import * as React from 'react'
import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {
  CREDIT_CARD,
  CREDIT_CARD_CHIP,
  CREDIT_CARD_DEFAULT_TEXT,
  CREDIT_CARD_REGIONS,
  STAGE_KEY_LIGHT,
  creditCardTippingColor,
  layoutStrokeText,
  normalizeStrokeText,
  roundedRectShape,
  type CreditCardChip,
  type CreditCardEmboss,
  type CreditCardEmbossLine,
  type CreditCardFinish,
  type CreditCardTipping,
} from '../../core'
import { DeviceScreen } from '../../screen/device-screen'
import { collectSlots, createSlots, resolveSurface, warnDev, type SurfaceProps } from '../../slots'

type GroupProps = ThreeElements['group']

export interface CreditCardProps extends Omit<GroupProps, 'children' | 'color' | 'name'>, SurfaceProps {
  /**
   * Card art, full bleed over the whole card. Bare children fill the front;
   * name faces explicitly with `<CreditCard.Front>` and `<CreditCard.Back>`
   * (plain stock when the back is omitted). The chip, the embossing, the
   * stripe and the signature panel stand on top of the art, like the real
   * hardware over a printed card - leave their areas for them, or turn them
   * off.
   */
  children?: React.ReactNode
  /**
   * Card stock color - an unprinted back, and the print's ground wherever the
   * art leaves it clear.
   */
  color?: string
  /**
   * The cut edge. A PVC card is printed sheets laminated over a white core,
   * so its edge shows white whatever the print; set this for a coloured core
   * or a metal card.
   */
  edgeColor?: string
  /**
   * The embossed card number, in Farrington 7B. Spaces are kept as typed; a
   * number longer than the line condenses to fit. Every embossed line takes
   * capitals, digits, spaces and `/`, `-` and `.`: lower case is raised as
   * capitals, accents are dropped from their letters (José becomes JOSE),
   * and any other character is left out, with a warning in development.
   */
  number?: string
  /** The embossed cardholder name, along the bottom of the card. */
  name?: string
  /**
   * The embossed expiry, centred under the number, with a printed
   * "VALID THRU" legend to its left. An empty string leaves both out.
   */
  expiry?: string
  /**
   * How the number, name and expiry are set:
   * - `true` (the default): embossed - raised as real relief, each stroke a
   *   flat crest carrying the `tipping` foil on shoulders that slope down to
   *   the card, with their mirrored impressions on the back;
   * - `'flat'`: printed flat in a hairline, with no relief and nothing on the
   *   back, the way most cards issued today carry them;
   * - `false`: left off, for art that sets its own.
   */
  emboss?: CreditCardEmboss
  /**
   * Foil on the embossed crests: `'silver'`, `'gold'`, any CSS color, or
   * `'none'` for untipped crests that show the print they were pushed up
   * through. With `emboss="flat"` the lines are printed in this colour, or
   * with `'none'` in a plain ink that suits the stock.
   */
  tipping?: CreditCardTipping
  /**
   * The EMV chip's contact plate on the front: `'gold'` (or `true`),
   * `'silver'`, or `false` for none.
   */
  chip?: CreditCardChip
  /**
   * The laminate over the print. `'gloss'` catches the studio's highlights as
   * the card turns, as a laminated card does; `'matte'` keeps the print
   * flat, for soft-touch cards.
   */
  finish?: CreditCardFinish
  /** The magnetic stripe across the top of the back. */
  stripe?: boolean
  /** The signature panel on the back, under the stripe. */
  signature?: boolean
}

/* ------------------------------------------------------------------ */
/*  Embossing geometry                                                 */
/* ------------------------------------------------------------------ */

/** Polylines laid out by `layoutStrokeText`. */
type Strokes = [number, number][][]

/** Steps down an embossed stroke's shoulder, from the crest's edge to its foot. */
const SHOULDER_STEPS = 4
/**
 * How far the shoulder runs on below the face past its foot, as a share of
 * the relief: buried, so the stroke rises out of the card with no seam.
 */
const FOOT_SINK = 0.25
/** Segments around a stroke's joints and ends. */
const ROUND = 16

/** Triangles being built: flat arrays, so a whole line is one geometry. */
interface MeshData {
  positions: number[]
  normals: number[]
  index: number[]
}

function vertex(m: MeshData, x: number, y: number, z: number, n: [number, number, number]): number {
  m.positions.push(x, y, z)
  m.normals.push(...n)
  return m.positions.length / 3 - 1
}

/** A triangle, wound to face +z, the side of the face it sits on. */
function triangle(m: MeshData, a: number, b: number, c: number): void {
  const p = m.positions
  const cross =
    (p[b * 3]! - p[a * 3]!) * (p[c * 3 + 1]! - p[a * 3 + 1]!) - (p[b * 3 + 1]! - p[a * 3 + 1]!) * (p[c * 3]! - p[a * 3]!)
  if (cross >= 0) m.index.push(a, b, c)
  else m.index.push(a, c, b)
}

function toGeometry(m: MeshData): THREE.BufferGeometry | null {
  if (m.index.length === 0) return null
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(m.positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(m.normals, 3))
  geometry.setIndex(m.index)
  return geometry
}

/**
 * Every stroke as a flat band `halfWidth` either side of its centreline, at
 * height `z`: a disc at every point, a strip along every segment. It is the
 * embossed crest (the flat top the die leaves, where the foil goes), and at
 * z = 0 it is printed type: the "VALID THRU" legend, a flat-printed number,
 * the chip's etched grooves.
 */
function ribbonGeometry(strokes: Strokes, halfWidth: number, z: number): THREE.BufferGeometry | null {
  const m: MeshData = { positions: [], normals: [], index: [] }
  const up: [number, number, number] = [0, 0, 1]
  for (const run of strokes) {
    for (const [x, y] of run) {
      const center = vertex(m, x, y, z, up)
      const ring = Array.from({ length: ROUND }, (_, k) => {
        const a = (k / ROUND) * Math.PI * 2
        return vertex(m, x + Math.cos(a) * halfWidth, y + Math.sin(a) * halfWidth, z, up)
      })
      for (let k = 0; k < ROUND; k++) triangle(m, center, ring[k]!, ring[(k + 1) % ROUND]!)
    }
    for (let i = 0; i + 1 < run.length; i++) {
      const [ax, ay] = run[i]!
      const [bx, by] = run[i + 1]!
      const length = Math.hypot(bx - ax, by - ay)
      if (length < 1e-9) continue
      const nx = (-(by - ay) / length) * halfWidth
      const ny = ((bx - ax) / length) * halfWidth
      const a0 = vertex(m, ax + nx, ay + ny, z, up)
      const a1 = vertex(m, ax - nx, ay - ny, z, up)
      const b0 = vertex(m, bx + nx, by + ny, z, up)
      const b1 = vertex(m, bx - nx, by - ny, z, up)
      triangle(m, a0, a1, b1)
      triangle(m, a0, b1, b0)
    }
  }
  return toGeometry(m)
}

/**
 * The shoulders of embossed strokes: from the edge of the flat crest
 * (`crestHalf` from the centreline, `relief` high) down to the face at
 * `footHalf`, on a cosine so the crest's edge is crisp but rounded and the
 * foot meets the card tangentially - the slope a die leaves in PVC, not the
 * vertical wall of a wire glued on. Swept along every segment and turned
 * round every point, so joints and ends come out round.
 */
function shoulderGeometry(strokes: Strokes, crestHalf: number, footHalf: number, relief: number): THREE.BufferGeometry | null {
  const run = footHalf - crestHalf
  // The profile, crest edge outward: distance from the centreline, height,
  // and the slope's normal as [outward, up].
  const profile = Array.from({ length: SHOULDER_STEPS + 2 }, (_, i) => {
    if (i > SHOULDER_STEPS) return { r: footHalf + run * 0.3, z: -relief * FOOT_SINK, n: [0, 1] as const }
    const t = i / SHOULDER_STEPS
    const slope = (-relief * 0.5 * Math.PI * Math.sin(Math.PI * t)) / run
    const length = Math.hypot(slope, 1)
    return { r: crestHalf + run * t, z: relief * (0.5 + 0.5 * Math.cos(Math.PI * t)), n: [-slope / length, 1 / length] as const }
  })
  const m: MeshData = { positions: [], normals: [], index: [] }
  for (const points of strokes) {
    for (const [x, y] of points) {
      const rings = profile.map(({ r, z, n }) =>
        Array.from({ length: ROUND }, (_, k) => {
          const a = (k / ROUND) * Math.PI * 2
          const c = Math.cos(a)
          const sn = Math.sin(a)
          return vertex(m, x + c * r, y + sn * r, z, [c * n[0], sn * n[0], n[1]])
        })
      )
      for (let i = 0; i + 1 < rings.length; i++) {
        for (let k = 0; k < ROUND; k++) {
          const k1 = (k + 1) % ROUND
          triangle(m, rings[i]![k]!, rings[i + 1]![k]!, rings[i + 1]![k1]!)
          triangle(m, rings[i]![k]!, rings[i + 1]![k1]!, rings[i]![k1]!)
        }
      }
    }
    for (let i = 0; i + 1 < points.length; i++) {
      const [ax, ay] = points[i]!
      const [bx, by] = points[i + 1]!
      const length = Math.hypot(bx - ax, by - ay)
      if (length < 1e-9) continue
      for (const side of [-1, 1]) {
        const dx = (side * -(by - ay)) / length
        const dy = (side * (bx - ax)) / length
        const rows = profile.map(({ r, z, n }) => {
          const normal: [number, number, number] = [dx * n[0], dy * n[0], n[1]]
          return [vertex(m, ax + dx * r, ay + dy * r, z, normal), vertex(m, bx + dx * r, by + dy * r, z, normal)] as const
        })
        for (let j = 0; j + 1 < rows.length; j++) {
          const [a0, b0] = rows[j]!
          const [a1, b1] = rows[j + 1]!
          triangle(m, a0, a1, b1)
          triangle(m, a0, b1, b0)
        }
      }
    }
  }
  return toGeometry(m)
}

/**
 * Geometry pressed flat onto the face, with every normal set to
 * `normal(n)`. Flat because whatever it shades is under it: the print of the
 * back face, for the embossing's debossed impressions.
 *
 * `facingBack` rewinds the triangles to face -z. A flattened stroke faces +z,
 * and three.js turns a back-facing triangle's normal around before lighting
 * it - which would quietly undo the hand-set normals of an impression seen
 * from behind.
 */
function flattenedGeometry(
  source: THREE.BufferGeometry,
  normal: (x: number, y: number, z: number) => [number, number, number],
  facingBack = false
): THREE.BufferGeometry {
  const flat = source.clone()
  const position = flat.getAttribute('position') as THREE.BufferAttribute
  const normals = flat.getAttribute('normal') as THREE.BufferAttribute
  for (let i = 0; i < position.count; i++) {
    position.setZ(i, 0)
    normals.setXYZ(i, ...normal(normals.getX(i), normals.getY(i), normals.getZ(i)))
  }
  const index = flat.getIndex()
  if (facingBack && index) {
    for (let i = 0; i + 2 < index.count; i += 3) {
      const b = index.getX(i + 1)
      index.setX(i + 1, index.getX(i + 2))
      index.setX(i + 2, b)
    }
  }
  return flat
}

/**
 * A soft contact shadow under a line of foil-tipped strokes: full strength
 * across the stroke's footprint (where the opaque crest hides it anyway),
 * fading to nothing `spread` beyond it. Built from the same capsules as the
 * strokes, as flat strips and fans with the strength in vertex alpha, and
 * drawn with MAX blending so where two capsules overlap the shadow is the
 * deeper of the two rather than their sum - no dark knots at the joints.
 */
function haloGeometry(strokes: Strokes, inner: number, outer: number): THREE.BufferGeometry | null {
  if (strokes.length === 0) return null
  const positions: number[] = []
  const alphas: number[] = []
  const index: number[] = []
  const point = (x: number, y: number, alpha: number) => {
    positions.push(x, y, 0)
    alphas.push(0, 0, 0, alpha)
    return positions.length / 3 - 1
  }
  const SEGMENTS = 16
  for (const run of strokes) {
    for (const [x, y] of run) {
      const center = point(x, y, 1)
      const ring: [number, number][] = []
      for (let k = 0; k < SEGMENTS; k++) {
        const a = (k / SEGMENTS) * Math.PI * 2
        ring.push([
          point(x + Math.cos(a) * inner, y + Math.sin(a) * inner, 1),
          point(x + Math.cos(a) * outer, y + Math.sin(a) * outer, 0),
        ])
      }
      for (let k = 0; k < SEGMENTS; k++) {
        const [i0, o0] = ring[k]!
        const [i1, o1] = ring[(k + 1) % SEGMENTS]!
        index.push(center, i0, i1, i0, o0, o1, i0, o1, i1)
      }
    }
    for (let i = 0; i + 1 < run.length; i++) {
      const [ax, ay] = run[i]!
      const [bx, by] = run[i + 1]!
      const length = Math.hypot(bx - ax, by - ay)
      if (length < 1e-9) continue
      // across the segment: outer edge, footprint edge, footprint edge, outer edge
      const nx = -(by - ay) / length
      const ny = (bx - ax) / length
      const row = (d: number, alpha: number) => [
        point(ax + nx * d, ay + ny * d, alpha),
        point(bx + nx * d, by + ny * d, alpha),
      ]
      const rows = [row(-outer, 0), row(-inner, 1), row(inner, 1), row(outer, 0)]
      for (let r = 0; r + 1 < rows.length; r++) {
        const [a0, b0] = rows[r]!
        const [a1, b1] = rows[r + 1]!
        index.push(a0!, b0!, b1!, a0!, b1!, a1!)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(alphas, 4))
  geometry.setIndex(index)
  return geometry
}

/** One line's geometry, rebuilt only when its own text or style changes. */
function useStrokeLine(text: string, line: CreditCardEmbossLine, emboss: CreditCardEmboss) {
  const built = React.useMemo(() => {
    if (emboss === false || text === '') return null
    const { strokes } = layoutStrokeText(text, line)
    if (strokes.length === 0) return null
    const half = line.stroke / 2
    if (emboss === 'flat') {
      const print = ribbonGeometry(strokes, half * CREDIT_CARD.printedStroke, 0)
      return print ? { kind: 'flat' as const, print } : null
    }
    const crest = ribbonGeometry(strokes, half * CREDIT_CARD.crest, line.relief)
    const shoulders = shoulderGeometry(strokes, half * CREDIT_CARD.crest, half, line.relief)
    if (!crest || !shoulders) return null
    return { kind: 'raised' as const, crest, shoulders, radius: half, halo: haloGeometry(strokes, half * 0.85, half * 1.8) }
  }, [emboss, text, line])
  React.useEffect(
    () => () => {
      if (!built) return
      if (built.kind === 'flat') built.print.dispose()
      else {
        built.crest.dispose()
        built.shoulders.dispose()
        built.halo?.dispose()
      }
    },
    [built]
  )
  return built
}

/* ------------------------------------------------------------------ */
/*  Relief shading over live DOM                                       */
/* ------------------------------------------------------------------ */

/**
 * Shading for relief that has the PRINT on it rather than foil: untipped
 * crests, and the back's debossed impressions. The print is DOM under the
 * canvas, so it cannot be lit; what the canvas can do is lay shading over it.
 * This draws only the difference the relief makes - darker where a wall
 * turns from the key light, lighter (and a glint) where it turns to it,
 * nothing where it is as flat as the face - as premultiplied black or white,
 * which the page composites over the print.
 *
 * MAX blending, not ordinary alpha: the strokes are overlapping capsules, and
 * blending each layer over the last would darken every joint twice. The
 * canvas under a printed face is transparent black, so MAX of the layers is
 * the strongest shading any one of them asks for, never their sum. That only
 * holds over transparent canvas: over an opaque stock it would do nothing, so
 * an unprinted back gets lit geometry in the stock instead (see the card).
 *
 * Front faces only, so a raised stroke's far wall never shades its near one.
 */
function createReliefMaterial(
  faceNormal: [number, number, number],
  strength: { shade: number; light: number; glint: number }
) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uFaceNormal: { value: new THREE.Vector3(...faceNormal) },
      uLightDir: { value: new THREE.Vector3(...STAGE_KEY_LIGHT.position).normalize() },
      uShade: { value: strength.shade },
      uLight: { value: strength.light },
      uGlint: { value: strength.glint },
    },
    vertexShader: /* glsl */ `
      uniform vec3 uFaceNormal;
      varying vec3 vNormal;
      varying vec3 vFace;
      varying vec3 vWorld;
      void main() {
        mat3 m = mat3(modelMatrix);
        vNormal = m * normal;
        vFace = m * uFaceNormal;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uLightDir;
      uniform float uShade;
      uniform float uLight;
      uniform float uGlint;
      varying vec3 vNormal;
      varying vec3 vFace;
      varying vec3 vWorld;
      void main() {
        vec3 n = normalize(vNormal);
        vec3 f = normalize(vFace);
        vec3 h = normalize(uLightDir + normalize(cameraPosition - vWorld));
        float lit = dot(n, uLightDir) - dot(f, uLightDir);
        float glint = max(pow(max(dot(n, h), 0.0), 40.0) - pow(max(dot(f, h), 0.0), 40.0), 0.0);
        float light = clamp(clamp(lit, 0.0, 1.0) * uLight + glint * uGlint, 0.0, 1.0);
        float shade = clamp(-lit, 0.0, 1.0) * uShade;
        gl_FragColor = vec4(vec3(light), max(light, shade));
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    blending: THREE.CustomBlending,
    blendEquation: THREE.MaxEquation,
  })
}

/**
 * The clear gloss film a card is laminated in, over a printed face. The print
 * is DOM under the canvas and reflects nothing, yet the studio's softboxes
 * sliding across the laminate as a card turns are most of what makes it read
 * as plastic rather than paper. So the film is a real, physically lit gloss
 * surface - black, so it adds no colour of its own, and glossy, so it
 * reflects the studio with the Fresnel rise of any clear coat (faint head on,
 * strong at a grazing angle) - drawn as light only: its alpha is set to the
 * reflection's own brightness, so over the print it brightens where it
 * reflects something and leaves the print untouched where it does not.
 */
function createLaminateMaterial(): THREE.MeshPhysicalMaterial {
  const material = new THREE.MeshPhysicalMaterial({
    color: '#000000',
    metalness: 0,
    roughness: 0.16,
    transparent: true,
    depthWrite: false,
    // the reflection is light added to the print: premultiplied, so the
    // canvas carries it as-is and the print shows through by its alpha
    premultipliedAlpha: true,
  })
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `#include <dithering_fragment>
      gl_FragColor.a = clamp(max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b)), 0.0, 1.0);`
    )
  }
  material.customProgramCacheKey = () => 'react-3d-mockups-card-laminate'
  return material
}

/* ------------------------------------------------------------------ */
/*  Back hardware                                                      */
/* ------------------------------------------------------------------ */

/**
 * The signature panel's security tint: fine pale-blue diagonals on cream, the
 * pattern that shows up any attempt to erase the signature. Generated data,
 * no image file.
 */
function signatureTexture(): THREE.DataTexture {
  const size = 32
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const line = (x + y) % 16 < 3
      const o = (y * size + x) * 4
      data[o] = line ? 196 : 244
      data[o + 1] = line ? 210 : 241
      data[o + 2] = line ? 230 : 231
      data[o + 3] = 255
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.generateMipmaps = true
  // ShapeGeometry UVs are the shape's own coordinates (world units), so one
  // tile is 1 / repeat units: ~2.4 mm, a diagonal every 1.2 mm.
  texture.repeat.set(10.8, 10.8)
  texture.needsUpdate = true
  return texture
}

/** Ink for flat print on a stock: near-black on a light card, paper white on a dark one. */
function inkOn(stock: string): string {
  const { r, g, b } = new THREE.Color(stock)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.18 ? '#1d1f24' : '#f2f1ec'
}

/* ------------------------------------------------------------------ */
/*  Validation                                                         */
/* ------------------------------------------------------------------ */

/** Characters already warned about: each is reported once, not on every render or card. */
const warnedCharacters = new Set<string>()

function warnUnembossable(prop: string, text: string): void {
  const fresh = normalizeStrokeText(text).dropped.filter((char) => !warnedCharacters.has(char))
  if (fresh.length === 0) return
  for (const char of fresh) warnedCharacters.add(char)
  warnDev(
    `<CreditCard> cannot emboss ${fresh.map((char) => JSON.stringify(char)).join(', ')} in \`${prop}\`, so ` +
      `${fresh.length === 1 ? 'it was' : 'they were'} dropped. The embossing font covers 0-9, A-Z, space, '/', '-' and '.'.`
  )
}

/* ------------------------------------------------------------------ */
/*  The card                                                           */
/* ------------------------------------------------------------------ */

/**
 * A procedurally built payment card: an ISO/IEC 7810 ID-1 blank with live
 * full-bleed DOM on the front - and, optionally, the back - under a gloss
 * laminate, and the hardware a real card carries over its print: the EMV
 * module's etched contact plate, the number, name and expiry embossed as
 * raised relief with foil-tipped crests (with their mirrored impressions on
 * the back) or printed flat, the magnetic stripe and the signature panel,
 * all round a white PVC core. The lettering is a stroke font swept into
 * geometry: no font files, no 3D asset files.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 *
 * ```tsx
 * <CreditCard number="4000 1234 5678 9010" name="ALEX MORGAN" expiry="12/29">
 *   <CreditCard.Front><CardFront /></CreditCard.Front>
 *   <CreditCard.Back><CardBack /></CreditCard.Back>
 * </CreditCard>
 * ```
 */
function CreditCardImpl({
  children,
  color = '#1f2b46',
  edgeColor = CREDIT_CARD.edgeColor,
  number: numberText = CREDIT_CARD_DEFAULT_TEXT.number,
  name: nameText = CREDIT_CARD_DEFAULT_TEXT.name,
  expiry: expiryText = CREDIT_CARD_DEFAULT_TEXT.expiry,
  emboss = true,
  tipping = 'silver',
  chip = true,
  stripe = true,
  signature = true,
  finish = 'gloss',
  // Printed straight onto the stock: whatever the content leaves clear is `color`.
  surfaceBackground = color,
  resolution = CREDIT_CARD.resolution,
  surfaceStyle,
  ...groupProps
}: CreditCardProps) {
  const regions = collectSlots(children, CREDIT_CARD_REGIONS)
  const { body, face, faceOffset, emboss: lines, expiryLabel } = CREDIT_CARD
  /** The card's visible surface - the live face - on either side. */
  const faceZ = body.thickness / 2 + faceOffset
  const foil = creditCardTippingColor(tipping)
  const backPrinted = regions.back != null
  const plating = chip === false ? null : CREDIT_CARD_CHIP[chip === true ? 'gold' : chip]

  React.useEffect(() => {
    if (emboss === false) return
    warnUnembossable('number', numberText)
    warnUnembossable('name', nameText)
    warnUnembossable('expiry', expiryText)
  }, [emboss, numberText, nameText, expiryText])

  const bodyGeometry = React.useMemo(() => {
    const shape = roundedRectShape(
      body.width - body.bevel * 2,
      body.height - body.bevel * 2,
      body.radius - body.bevel
    )
    const depth = body.thickness - body.bevel * 2
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: body.bevel,
      bevelSize: body.bevel,
      bevelSegments: 2,
      curveSegments: 12,
    })
    geometry.translate(0, 0, -depth / 2)
    return geometry
  }, [body])
  React.useEffect(() => () => bodyGeometry.dispose(), [bodyGeometry])

  /* --- the lettering --- */

  const numberLine = useStrokeLine(numberText, lines.number, emboss)
  const expiryLine = useStrokeLine(expiryText, lines.expiry, emboss)
  const nameLine = useStrokeLine(nameText, lines.name, emboss)
  const strokeLines = [numberLine, expiryLine, nameLine].filter((line) => line !== null)

  // "VALID THRU" is printed, embossed card or not.
  const labelGeometry = React.useMemo(() => {
    if (emboss === false || normalizeStrokeText(expiryText).text.trim() === '') return null
    const parts = expiryLabel
      .map((line) => ribbonGeometry(layoutStrokeText(line.text, line).strokes, line.stroke / 2, 0))
      .filter((part) => part !== null)
    if (parts.length === 0) return null
    const merged = mergeGeometries(parts)
    for (const part of parts) part.dispose()
    return merged
  }, [emboss, expiryText, expiryLabel])
  React.useEffect(() => () => labelGeometry?.dispose(), [labelGeometry])

  // The reverse of each embossed line: its shoulders pressed flat with their
  // normals turned inside out (a slope that faces +x on a raised stroke faces
  // -x in the groove it leaves behind), seen from the back - so mirrored, as
  // it is. The crest's flat top leaves a flat floor, which needs no shading.
  const impressions = React.useMemo(
    () =>
      [numberLine, expiryLine, nameLine].flatMap((line) =>
        line?.kind === 'raised' ? [flattenedGeometry(line.shoulders, (x, y, z) => [-x, -y, -z], true)] : []
      ),
    [numberLine, expiryLine, nameLine]
  )
  React.useEffect(() => () => impressions.forEach((geometry) => geometry.dispose()), [impressions])

  // The shoulders carry the print they were pushed up through, so they shade
  // it; an impression is a shallower thing seen from the wrong side, so quiet.
  const shoulderMaterial = React.useMemo(
    () => createReliefMaterial([0, 0, 1], { shade: 0.85, light: 0.5, glint: 0.6 }),
    []
  )
  const impressionMaterial = React.useMemo(
    () => createReliefMaterial([0, 0, -1], { shade: 0.34, light: 0.3, glint: 0.3 }),
    []
  )
  // An untipped crest is the print itself: it draws nothing, but it still
  // has to hide the shoulders under it, or their shading would show through.
  const crestDepthMaterial = React.useMemo(() => new THREE.MeshBasicMaterial({ colorWrite: false }), [])
  const haloMaterial = React.useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#000000',
        vertexColors: true,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
        blending: THREE.CustomBlending,
        blendEquation: THREE.MaxEquation,
      }),
    []
  )
  const laminate = React.useMemo(() => createLaminateMaterial(), [])
  React.useEffect(
    () => () => {
      shoulderMaterial.dispose()
      impressionMaterial.dispose()
      crestDepthMaterial.dispose()
      haloMaterial.dispose()
      laminate.dispose()
    },
    [shoulderMaterial, impressionMaterial, crestDepthMaterial, haloMaterial, laminate]
  )

  /* --- chip --- */

  const chipGeometry = React.useMemo(() => {
    const { width, height, radius, rim, groove, grooves } = CREDIT_CARD.chip
    const cavity = new THREE.ShapeGeometry(roundedRectShape(width + rim * 2, height + rim * 2, radius + rim), 12)
    const plate = new THREE.ShapeGeometry(roundedRectShape(width, height, radius), 12)
    const etched = ribbonGeometry(
      grooves.map((line) => line.map(([x, y]) => [x * width, y * height] as [number, number])),
      groove / 2,
      0
    )!
    return { cavity, plate, etched }
  }, [])
  React.useEffect(
    () => () => {
      chipGeometry.cavity.dispose()
      chipGeometry.plate.dispose()
      chipGeometry.etched.dispose()
    },
    [chipGeometry]
  )

  /* --- the laminate, and the back hardware --- */

  const faceGeometry = React.useMemo(() => new THREE.ShapeGeometry(roundedRectShape(face.width, face.height, face.radius), 12), [face])
  const signatureGeometry = React.useMemo(() => {
    const { width, height, radius } = CREDIT_CARD.signature
    return new THREE.ShapeGeometry(roundedRectShape(width, height, radius), 6)
  }, [])
  const signatureTint = React.useMemo(() => signatureTexture(), [])
  React.useEffect(
    () => () => {
      faceGeometry.dispose()
      signatureGeometry.dispose()
      signatureTint.dispose()
    },
    [faceGeometry, signatureGeometry, signatureTint]
  )

  /* --- faces --- */

  const surfaceDefaults = {
    surfaceBackground,
    resolution,
    surfaceStyle,
  }
  const faceProps = {
    width: face.width,
    height: face.height,
    radius: face.radius,
  }
  const { chip: chipSpec, stripe: stripeSpec, signature: signatureSpec } = CREDIT_CARD
  const glossy = finish === 'gloss'
  const stockMaterial = (
    <meshPhysicalMaterial
      color={color}
      metalness={0}
      roughness={glossy ? 0.45 : 0.75}
      clearcoat={glossy ? 0.5 : 0}
      clearcoatRoughness={0.3}
    />
  )
  // Part metal, like the chip: the crest is flat now, and a flat full mirror
  // only shows what it faces - head on, the dark studio behind the camera,
  // so the foil read black. Hot-stamped foil is a metallised film that stays
  // bright from any side.
  const foilMaterial = foil ? (
    <meshPhysicalMaterial
      color={foil}
      metalness={0.45}
      roughness={0.32}
      clearcoat={0.6}
      clearcoatRoughness={0.15}
    />
  ) : null
  // Flat lettering is metallic ink in the foil's colour, or plain ink: flat,
  // full foil would mirror the studio and turn black at the angles a flat
  // chip does.
  const inkMaterial = foil ? (
    <meshStandardMaterial color={foil} metalness={0.45} roughness={0.42} />
  ) : (
    <meshBasicMaterial color={inkOn(color)} />
  )

  return (
    <group {...groupProps}>
      {/* the PVC blank: faces in the stock color, the cut edge its white core
          (ExtrudeGeometry material group 0 is the caps, group 1 the sides) */}
      <mesh geometry={bodyGeometry}>
        {React.cloneElement(stockMaterial, { attach: 'material-0' })}
        <meshPhysicalMaterial attach="material-1" color={edgeColor} metalness={0} roughness={0.6} />
      </mesh>

      {/* live front face */}
      <DeviceScreen {...faceProps} {...resolveSurface(regions.front, surfaceDefaults)} position={[0, 0, faceZ]}>
        {regions.front?.children}
      </DeviceScreen>

      {/* live back face - only mounted when there's a design for it */}
      {backPrinted && (
        <DeviceScreen
          {...faceProps}
          {...resolveSurface(regions.back, surfaceDefaults)}
          position={[0, 0, -faceZ]}
          rotation={[0, Math.PI, 0]}
        >
          {regions.back!.children}
        </DeviceScreen>
      )}

      {/* the gloss laminate over the print (an unprinted back is the stock
          itself, already lit with a clearcoat) */}
      {glossy && <mesh geometry={faceGeometry} material={laminate} position-z={faceZ + 0.0002} />}
      {glossy && backPrinted && (
        <mesh geometry={faceGeometry} material={laminate} position-z={-faceZ - 0.0002} rotation={[0, Math.PI, 0]} />
      )}

      {/* the EMV module: one plated sheet in its milled cavity, the contacts
          etched apart through to the dark substrate */}
      {plating && (
        <group position={[chipSpec.x, chipSpec.y, faceZ]}>
          <mesh geometry={chipGeometry.cavity} position-z={chipSpec.lift * 0.5}>
            <meshStandardMaterial color="#1b1814" metalness={0} roughness={0.7} />
          </mesh>
          {/* Not fully metallic: a flat mirror is only as bright as whatever
              it happens to face, and at some angles that is the dark part of
              the studio - the plate went black. Real contact plating is
              brushed enough to keep its colour from anywhere. */}
          <mesh geometry={chipGeometry.plate} position-z={chipSpec.lift}>
            <meshPhysicalMaterial
              color={plating.plate}
              metalness={0.5}
              roughness={0.3}
              clearcoat={0.35}
              clearcoatRoughness={0.25}
            />
          </mesh>
          <mesh geometry={chipGeometry.etched} position-z={chipSpec.lift * 1.6}>
            <meshStandardMaterial color={plating.groove} metalness={0} roughness={0.8} />
          </mesh>
        </group>
      )}

      {/* the lettering: embossed strokes - a foil-stamped crest on shoulders
          that shade the print they were pushed up through - or flat print */}
      {(strokeLines.length > 0 || labelGeometry) && (
        <group position-z={faceZ}>
          {strokeLines.map((line, i) =>
            line.kind === 'flat' ? (
              <mesh key={i} geometry={line.print} position-z={0.0006}>
                {inkMaterial}
              </mesh>
            ) : (
              <React.Fragment key={i}>
                {foil ? (
                  <mesh geometry={line.crest}>{foilMaterial}</mesh>
                ) : (
                  <mesh geometry={line.crest} material={crestDepthMaterial} />
                )}
                <mesh geometry={line.shoulders} material={shoulderMaterial} />
                {foil && line.halo && (
                  <mesh
                    geometry={line.halo}
                    material={haloMaterial}
                    // a hair off the face, and nudged away from the key light
                    position={[-line.radius * 0.3, -line.radius * 0.4, 0.0006]}
                  />
                )}
              </React.Fragment>
            )
          )}
          {labelGeometry && (
            <mesh geometry={labelGeometry} position-z={0.0006}>
              {inkMaterial}
            </mesh>
          )}
        </group>
      )}

      {/* the embossing's reverse, debossed into the back: shading over the
          back's print, or the stock itself pressed in on an unprinted one */}
      {impressions.length > 0 && (
        <group position-z={-faceZ - 0.0006}>
          {impressions.map((geometry, i) =>
            backPrinted ? (
              <mesh key={i} geometry={geometry} material={impressionMaterial} />
            ) : (
              <mesh key={i} geometry={geometry}>
                {stockMaterial}
              </mesh>
            )
          )}
        </group>
      )}

      {/* back hardware, laid out as seen looking at the back */}
      <group rotation={[0, Math.PI, 0]}>
        {stripe && (
          <mesh position={[0, stripeSpec.y, faceZ + 0.001]}>
            <planeGeometry args={[body.width - 0.001, stripeSpec.height]} />
            {/* iron oxide in a binder: dark and only satin. Full studio
                reflections turned it into a grey band at most angles - the
                print around it is DOM and reflects nothing, so a stripe that
                does outshines the card it is on */}
            <meshPhysicalMaterial color="#171514" metalness={0} roughness={0.55} envMapIntensity={0.35} />
          </mesh>
        )}
        {signature && (
          <mesh geometry={signatureGeometry} position={[signatureSpec.x, signatureSpec.y, faceZ + 0.001]}>
            {/* lit alone, matte paper reads grey in the studio; the tint as
                its own glow keeps it the white a pen is meant to write on */}
            <meshStandardMaterial
              map={signatureTint}
              emissiveMap={signatureTint}
              emissive="#ffffff"
              emissiveIntensity={0.4}
              metalness={0}
              roughness={0.8}
            />
          </mesh>
        )}
      </group>
    </group>
  )
}
CreditCardImpl.displayName = 'CreditCard'

/** The card's compound slots, shared by `<CreditCard>` and `<CreditCardMockup>`. */
export const creditCardSlots = createSlots(CREDIT_CARD_REGIONS)

export const CreditCard = Object.assign(CreditCardImpl, creditCardSlots)
