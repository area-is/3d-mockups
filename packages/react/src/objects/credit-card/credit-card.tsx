import * as React from 'react'
import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {
  CREDIT_CARD,
  CREDIT_CARD_DEFAULT_TEXT,
  CREDIT_CARD_REGIONS,
  STAGE_KEY_LIGHT,
  creditCardTippingColor,
  layoutStrokeText,
  normalizeStrokeText,
  roundedRectShape,
  roundedRectShapeCorners,
  type CreditCardTipping,
  type StrokeTextLine,
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
   * Card stock color - the edges, an unprinted back, and the print's ground
   * wherever the art leaves it clear.
   */
  color?: string
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
   * Raise the number, name and expiry as real embossed relief, with their
   * mirrored impressions on the back. `false` leaves the card flat, for art
   * that prints its own number (most cards issued today print it flat).
   */
  emboss?: boolean
  /**
   * Foil on the embossed crests: `'silver'`, `'gold'`, any CSS color, or
   * `'none'` for untipped crests that show the print they were pushed up
   * through.
   */
  tipping?: CreditCardTipping
  /** The EMV chip's gold contact plate on the front. */
  chip?: boolean
  /** The magnetic stripe across the top of the back. */
  stripe?: boolean
  /** The signature panel on the back, under the stripe. */
  signature?: boolean
}

/* ------------------------------------------------------------------ */
/*  Embossing geometry                                                 */
/* ------------------------------------------------------------------ */

/**
 * Share of a bead's elliptical profile sunk below the face. A bead sitting on
 * the face with its full half-ellipse meets it at a vertical tangent and
 * reads as a wire glued onto the card; sunk, it rises out of the face at a
 * slope, the way PVC pushed up by a die does.
 */
const BEAD_SINK = 0.3

/** Polylines laid out by `layoutStrokeText`. */
type Strokes = [number, number][][]

/**
 * The raised relief of a laid-out line: every stroke a rounded bead - half a
 * squashed cylinder per segment, a squashed dome at every point, so joints
 * and ends come out round - merged into one geometry. Built at z = 0 on the
 * face; the crests stand `relief` proud of it.
 */
function beadGeometry(strokes: Strokes, radius: number, relief: number): THREE.BufferGeometry | null {
  if (strokes.length === 0) return null
  const semiAxis = relief / (1 - BEAD_SINK)
  const squash = semiAxis / radius
  const sink = -semiAxis * BEAD_SINK
  const parts: THREE.BufferGeometry[] = []
  for (const run of strokes) {
    for (const [x, y] of run) {
      // the upper hemisphere, its pole turned from +y to face out of the card
      const dome = new THREE.SphereGeometry(radius, 12, 4, 0, Math.PI * 2, 0, Math.PI / 2)
      dome.rotateX(Math.PI / 2)
      dome.scale(1, 1, squash)
      dome.translate(x, y, sink)
      parts.push(dome)
    }
    for (let i = 0; i + 1 < run.length; i++) {
      const [ax, ay] = run[i]!
      const [bx, by] = run[i + 1]!
      const length = Math.hypot(bx - ax, by - ay)
      if (length < 1e-9) continue
      // the half of a y-axis cylinder facing +z, turned onto the segment
      const tube = new THREE.CylinderGeometry(radius, radius, length, 12, 1, true, -Math.PI / 2, Math.PI)
      tube.scale(1, 1, squash)
      tube.rotateZ(Math.atan2(by - ay, bx - ax) - Math.PI / 2)
      tube.translate((ax + bx) / 2, (ay + by) / 2, sink)
      parts.push(tube)
    }
  }
  const merged = mergeGeometries(parts)
  for (const part of parts) part.dispose()
  return merged
}

/**
 * The bead geometry pressed flat onto the face, with every normal set to
 * `normal(n)`. Flat because whatever it shades is under it: the print of the
 * back face for the debossed impressions, the face itself for printed type.
 *
 * `facingBack` rewinds the triangles to face -z. A flattened bead faces +z,
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
 * A soft contact shadow under a line of foil-tipped beads: full strength
 * across the bead's footprint (where the opaque bead hides it anyway),
 * fading to nothing `spread` beyond it. Built from the same capsules as the
 * beads, as flat strips and fans with the strength in vertex alpha, and drawn
 * with MAX blending so where two capsules overlap the shadow is the deeper of
 * the two rather than their sum - no dark knots at the joints.
 */
function haloGeometry(strokes: Strokes, inner: number, outer: number): THREE.BufferGeometry | null {
  if (strokes.length === 0) return null
  const positions: number[] = []
  const alphas: number[] = []
  const index: number[] = []
  const vertex = (x: number, y: number, alpha: number) => {
    positions.push(x, y, 0)
    alphas.push(0, 0, 0, alpha)
    return positions.length / 3 - 1
  }
  const SEGMENTS = 16
  for (const run of strokes) {
    for (const [x, y] of run) {
      const center = vertex(x, y, 1)
      const ring: [number, number][] = []
      for (let k = 0; k < SEGMENTS; k++) {
        const a = (k / SEGMENTS) * Math.PI * 2
        ring.push([
          vertex(x + Math.cos(a) * inner, y + Math.sin(a) * inner, 1),
          vertex(x + Math.cos(a) * outer, y + Math.sin(a) * outer, 0),
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
        vertex(ax + nx * d, ay + ny * d, alpha),
        vertex(bx + nx * d, by + ny * d, alpha),
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

/** One line's geometry, rebuilt only when its own text changes. */
function useStrokeLine(text: string, line: StrokeTextLine, relief: number, enabled: boolean) {
  const built = React.useMemo(() => {
    if (!enabled || text === '') return null
    const { strokes } = layoutStrokeText(text, line)
    const radius = line.stroke / 2
    const bead = beadGeometry(strokes, radius, relief)
    if (!bead) return null
    return { bead, radius, halo: haloGeometry(strokes, radius * 0.9, radius * 2.4) }
  }, [enabled, text, line, relief])
  React.useEffect(
    () => () => {
      built?.bead.dispose()
      built?.halo?.dispose()
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
 * Front faces only, so a raised bead's far wall never shades its near one.
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
 * full-bleed DOM on the front - and, optionally, the back - and the hardware
 * a real card carries over its print: the EMV chip's contact plate, the
 * number, name and expiry embossed as raised, foil-tipped relief (with their
 * mirrored impressions on the back), the magnetic stripe and the signature
 * panel. The lettering is a stroke font swept into geometry: no font files,
 * no 3D asset files.
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
  number: numberText = CREDIT_CARD_DEFAULT_TEXT.number,
  name: nameText = CREDIT_CARD_DEFAULT_TEXT.name,
  expiry: expiryText = CREDIT_CARD_DEFAULT_TEXT.expiry,
  emboss = true,
  tipping = 'silver',
  chip = true,
  stripe = true,
  signature = true,
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

  React.useEffect(() => {
    if (!emboss) return
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

  /* --- embossing --- */

  const numberLine = useStrokeLine(numberText, lines.number, lines.number.relief, emboss)
  const expiryLine = useStrokeLine(expiryText, lines.expiry, lines.expiry.relief, emboss)
  const nameLine = useStrokeLine(nameText, lines.name, lines.name.relief, emboss)
  const embossed = [numberLine, expiryLine, nameLine].filter((line) => line !== null)

  // "VALID THRU" is printed, not embossed: the same strokes pressed flat.
  const labelGeometry = React.useMemo(() => {
    if (!emboss || normalizeStrokeText(expiryText).text.trim() === '') return null
    const parts = expiryLabel
      .map((line) => beadGeometry(layoutStrokeText(line.text, line).strokes, line.stroke / 2, line.stroke / 4))
      .filter((part) => part !== null)
    if (parts.length === 0) return null
    const merged = mergeGeometries(parts)
    for (const part of parts) part.dispose()
    return flattenedGeometry(merged, () => [0, 0, 1])
  }, [emboss, expiryText, expiryLabel])
  React.useEffect(() => () => labelGeometry?.dispose(), [labelGeometry])

  // The reverse of each line: the bead pressed flat with its normals turned
  // inside out (a wall that faces +x on a raised stroke faces -x in the
  // groove it leaves behind), seen from the back - so mirrored, as it is.
  const impressions = React.useMemo(
    () =>
      [numberLine, expiryLine, nameLine].flatMap((line) =>
        line ? [flattenedGeometry(line.bead, (x, y, z) => [-x, -y, -z], true)] : []
      ),
    [numberLine, expiryLine, nameLine]
  )
  React.useEffect(() => () => impressions.forEach((geometry) => geometry.dispose()), [impressions])

  // Untipped crests carry the whole relief in shading, so they shade hard; an
  // impression is a shallower thing seen from the wrong side, so it is quiet.
  const untippedMaterial = React.useMemo(
    () => createReliefMaterial([0, 0, 1], { shade: 0.85, light: 0.5, glint: 0.6 }),
    []
  )
  const impressionMaterial = React.useMemo(
    () => createReliefMaterial([0, 0, -1], { shade: 0.34, light: 0.3, glint: 0.3 }),
    []
  )
  const haloMaterial = React.useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#000000',
        vertexColors: true,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
        blending: THREE.CustomBlending,
        blendEquation: THREE.MaxEquation,
      }),
    []
  )
  React.useEffect(
    () => () => {
      untippedMaterial.dispose()
      impressionMaterial.dispose()
      haloMaterial.dispose()
    },
    [untippedMaterial, impressionMaterial, haloMaterial]
  )

  /* --- chip --- */

  const chipGeometry = React.useMemo(() => {
    const { width, height, radius, groove, centerWidth, rows } = CREDIT_CARD.chip
    const plate = new THREE.ShapeGeometry(roundedRectShapeCorners(width, height, [radius, radius, radius, radius]), 12)
    // Pads inside a groove-wide rim; outer corners follow the plate's rounding.
    const left = -width / 2 + groove
    const right = width / 2 - groove
    const top = height / 2 - groove
    const bottom = -height / 2 + groove
    const rowHeight = (top - bottom - groove * (rows - 1)) / rows
    const inner = Math.max(0, radius - groove)
    const small = groove * 0.6
    const pad = (x0: number, x1: number, y0: number, y1: number, corners: [number, number, number, number]) => {
      const g = new THREE.ShapeGeometry(roundedRectShapeCorners(x1 - x0, y1 - y0, corners), 8)
      g.translate((x0 + x1) / 2, (y0 + y1) / 2, 0)
      return g
    }
    const parts: THREE.BufferGeometry[] = [
      pad(-centerWidth / 2 + groove / 2, centerWidth / 2 - groove / 2, bottom, top, [small, small, small, small]),
    ]
    for (const side of [-1, 1] as const) {
      const [x0, x1] = side < 0 ? [left, -centerWidth / 2 - groove / 2] : [centerWidth / 2 + groove / 2, right]
      for (let r = 0; r < rows; r++) {
        const y1 = top - r * (rowHeight + groove)
        const y0 = y1 - rowHeight
        const isTop = r === 0
        const isBottom = r === rows - 1
        const outerTop = isTop ? inner : small
        const outerBottom = isBottom ? inner : small
        // CSS order: top-left, top-right, bottom-right, bottom-left
        parts.push(
          pad(
            x0,
            x1,
            y0,
            y1,
            side < 0 ? [outerTop, small, small, outerBottom] : [small, outerTop, outerBottom, small]
          )
        )
      }
    }
    const pads = mergeGeometries(parts)
    for (const part of parts) part.dispose()
    return { plate, pads }
  }, [])
  React.useEffect(
    () => () => {
      chipGeometry.plate.dispose()
      chipGeometry.pads.dispose()
    },
    [chipGeometry]
  )

  /* --- back hardware --- */

  const signatureGeometry = React.useMemo(() => {
    const { width, height, radius } = CREDIT_CARD.signature
    return new THREE.ShapeGeometry(roundedRectShape(width, height, radius), 6)
  }, [])
  const signatureTint = React.useMemo(() => signatureTexture(), [])
  React.useEffect(
    () => () => {
      signatureGeometry.dispose()
      signatureTint.dispose()
    },
    [signatureGeometry, signatureTint]
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
  const stockMaterial = (
    <meshPhysicalMaterial color={color} metalness={0} roughness={0.45} clearcoat={0.5} clearcoatRoughness={0.3} />
  )
  const foilMaterial = foil ? (
    <meshPhysicalMaterial color={foil} metalness={1} roughness={0.3} clearcoat={0.4} clearcoatRoughness={0.2} />
  ) : null

  return (
    <group {...groupProps}>
      {/* the PVC blank: faces in the stock color, edges the same core */}
      <mesh geometry={bodyGeometry}>{stockMaterial}</mesh>

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

      {/* EMV contact plate, essentially flush: the substrate shows in the
          grooves between the gold pads */}
      {chip && (
        <group position={[chipSpec.x, chipSpec.y, faceZ]}>
          <mesh geometry={chipGeometry.plate} position-z={chipSpec.lift}>
            <meshPhysicalMaterial color="#6b5629" metalness={0.45} roughness={0.55} />
          </mesh>
          {/* Not fully metallic: a flat mirror is only as bright as whatever
              it happens to face, and at some angles that is the dark part of
              the studio - the plate went black. Real contact gold is brushed
              enough to keep its colour from anywhere. */}
          <mesh geometry={chipGeometry.pads} position-z={chipSpec.lift * 1.75}>
            <meshPhysicalMaterial
              color="#f3d78e"
              metalness={0.5}
              roughness={0.3}
              clearcoat={0.35}
              clearcoatRoughness={0.25}
            />
          </mesh>
        </group>
      )}

      {/* the embossed lines: foil-tipped beads over a soft contact shadow, or
          untipped relief shading the print it was pushed up through */}
      {embossed.length > 0 && (
        <group position-z={faceZ}>
          {embossed.map((line, i) =>
            foil ? (
              <React.Fragment key={i}>
                <mesh geometry={line.bead}>{foilMaterial}</mesh>
                {line.halo && (
                  <mesh
                    geometry={line.halo}
                    material={haloMaterial}
                    // a hair off the face, and nudged away from the key light
                    position={[-line.radius * 0.25, -line.radius * 0.35, 0.0006]}
                  />
                )}
              </React.Fragment>
            ) : (
              <mesh key={i} geometry={line.bead} material={untippedMaterial} />
            )
          )}
          {/* the legend is metallic ink, not foil: flat, it would mirror the
              studio and turn black at the same angles a flat chip does */}
          {labelGeometry && (
            <mesh geometry={labelGeometry} position-z={0.0006}>
              {foil ? (
                <meshStandardMaterial color={foil} metalness={0.45} roughness={0.42} />
              ) : (
                <meshBasicMaterial color={inkOn(color)} />
              )}
            </mesh>
          )}
        </group>
      )}

      {/* the embossing's reverse, debossed into the back: shading over the
          back's print, or the stock itself pressed in on an unprinted back */}
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
