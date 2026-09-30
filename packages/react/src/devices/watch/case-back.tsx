import * as React from 'react'
import * as THREE from 'three'
import { roundedRectShape, type WatchBack } from '../../core'

/**
 * The watch's case back, built from its spec (see `WatchBack` in core): the
 * sensor under its glass, the electrode, the band releases, the screws and
 * the engraved model line.
 *
 * The fine print - the sensor's rings, ribs, LEDs and photodiodes, and the
 * engraving - is drawn into canvas textures rather than modelled: it is
 * printed or etched flat on the real part, a few tenths of a millimetre
 * deep, and geometry that small would only alias. Everything that catches
 * light on its own - the puck, the glass, the release buttons, the screw
 * heads - is geometry.
 */

/** Texture size for the sensor glass; the engraving gets twice as many pixels for its type. */
const SENSOR_TEXTURE = 512
const ENGRAVING_TEXTURE = 1024

/** Silver of Samsung's electrode puck, whatever the case finish. */
const PUCK_METAL = '#b7bcc4'
/** Dark sensor glass: Apple's crystal, lighter where the electrode shows through, and Samsung's window. */
const GLASS = '#191b1f'
const GLASS_ELECTRODE = '#393c43'
const WINDOW = '#0b0c0f'

function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  draw(ctx)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

/**
 * A disc of `radius` domed `height` at its centre, facing +z, UV-mapped flat
 * like a `CircleGeometry` so a texture drawn head-on lands undistorted.
 */
function domedDisc(radius: number, height: number): THREE.BufferGeometry {
  const geometry = new THREE.RingGeometry(0, radius, 96, 24)
  const position = geometry.getAttribute('position') as THREE.BufferAttribute
  for (let i = 0; i < position.count; i++) {
    const r = Math.hypot(position.getX(i), position.getY(i)) / radius
    position.setZ(i, height * (1 - r * r))
  }
  geometry.computeVertexNormals()
  return geometry
}

/**
 * The sensor glass, drawn as seen looking at the back: canvas x runs toward
 * the back's right (the case's left flank), canvas y down toward six o'clock.
 */
function drawSensor(ctx: CanvasRenderingContext2D, back: WatchBack) {
  const glass = back.window ?? back.radius
  const size = SENSOR_TEXTURE
  const c = size / 2
  const s = size / (2 * glass)
  const circle = (r: number) => {
    ctx.beginPath()
    ctx.arc(c, c, r * s, 0, Math.PI * 2)
  }
  const at = (angle: number, ring: number) => {
    const a = (angle * Math.PI) / 180
    return [c + Math.cos(a) * ring * s, c - Math.sin(a) * ring * s] as const
  }

  // The glass, and on an all-glass back the lighter band over the electrode.
  circle(glass)
  ctx.fillStyle = back.window ? WINDOW : GLASS
  ctx.fill()
  if (!back.window) {
    const { inner, outer } = back.electrode
    ctx.beginPath()
    ctx.arc(c, c, outer * s, 0, Math.PI * 2)
    ctx.arc(c, c, inner * s, 0, Math.PI * 2, true)
    ctx.fillStyle = back.spokes ? '#202125' : GLASS_ELECTRODE
    ctx.fill()
  }

  // The Ultra's sunburst: ribs from the window out to the dome's edge.
  if (back.spokes) {
    ctx.strokeStyle = '#62666e'
    ctx.lineWidth = Math.max(1.5, 0.005 * s)
    for (let i = 0; i < back.spokes.count; i++) {
      const a = (i / back.spokes.count) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(c + Math.cos(a) * back.spokes.inner * s, c + Math.sin(a) * back.spokes.inner * s)
      ctx.lineTo(c + Math.cos(a) * glass * s, c + Math.sin(a) * glass * s)
      ctx.stroke()
    }
  }

  for (const r of back.rings ?? []) {
    circle(r)
    ctx.strokeStyle = back.window ? '#3f424a' : '#555961'
    ctx.lineWidth = Math.max(1.5, 0.005 * s)
    ctx.stroke()
  }

  // The electrode's insulating gap, across the glass band (an all-glass back;
  // on a metal puck the gap is cut in the metal, as geometry).
  if (back.split && !back.window) {
    ctx.strokeStyle = '#050506'
    ctx.lineWidth = 0.012 * s
    for (const side of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(c + side * back.electrode.inner * s, c)
      ctx.lineTo(c + side * back.electrode.outer * s, c)
      ctx.stroke()
    }
  }

  if (back.hubRadius > 0) {
    const r = back.hubRadius * s
    if (back.hub === 'metal') {
      // A polished sensor disc: spun metal, brighter across its middle.
      const g = ctx.createLinearGradient(c - r, c - r, c + r, c + r)
      g.addColorStop(0, '#6e737b')
      g.addColorStop(0.5, '#c9ccd2')
      g.addColorStop(1, '#5f636b')
      ctx.fillStyle = g
    } else {
      const g = ctx.createRadialGradient(c - r * 0.3, c - r * 0.3, r * 0.1, c, c, r)
      g.addColorStop(0, '#3a414c')
      g.addColorStop(1, '#0b0d11')
      ctx.fillStyle = g
    }
    circle(back.hubRadius)
    ctx.fill()
  }

  const { leds, lenses } = back
  for (let i = 0; i < leds.count; i++) {
    const [x, y] = at((leds.start ?? 0) + (i * 360) / leds.count, leds.ring)
    const r = leds.radius * s
    const color = leds.colors?.[i % leds.colors.length] ?? '#9da096'
    const g = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.05, x, y, r)
    g.addColorStop(0, '#f4f1e8')
    g.addColorStop(0.45, color)
    g.addColorStop(1, '#2b2a26')
    ctx.fillStyle = g
    ctx.beginPath()
    if (leds.shape === 'oval') ctx.ellipse(x, y, r * 0.78, r, 0, 0, Math.PI * 2)
    else ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  if (lenses) {
    for (let i = 0; i < lenses.count; i++) {
      const [x, y] = at((lenses.start ?? 0) + (i * 360) / lenses.count, lenses.ring)
      const r = lenses.radius * s
      if (lenses.shape === 'diamond') {
        ctx.fillStyle = lenses.colors?.[i % lenses.colors.length] ?? '#4d4a66'
        ctx.beginPath()
        ctx.moveTo(x, y - r)
        ctx.lineTo(x + r, y)
        ctx.lineTo(x, y + r)
        ctx.lineTo(x - r, y)
        ctx.closePath()
        ctx.fill()
      } else {
        // A lens: a dark barrel round a lighter element.
        ctx.fillStyle = '#07080a'
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#34373e'
        ctx.lineWidth = Math.max(1.5, 0.004 * s)
        ctx.stroke()
        const g = ctx.createRadialGradient(x - r * 0.15, y - r * 0.15, r * 0.05, x, y, r * 0.5)
        g.addColorStop(0, '#727883')
        g.addColorStop(1, '#2a2d34')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, r * 0.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
}

/** The engraving, white on clear, clockwise from `from` as seen looking at the back. */
function drawEngraving(ctx: CanvasRenderingContext2D, engraving: NonNullable<WatchBack['engraving']>) {
  const { radius, text, from, sweep, size: capHeight } = engraving
  const extent = radius + capHeight
  const size = ENGRAVING_TEXTURE
  const c = size / 2
  const s = size / (2 * extent)
  // Caps are ~0.7 of the font size.
  ctx.font = `600 ${(capHeight / 0.7) * s}px "Helvetica Neue", Helvetica, Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#ffffff'
  const chars = [...text]
  const widths = chars.map((ch) => ctx.measureText(ch).width)
  const total = widths.reduce((sum, w) => sum + w, 0)
  let run = 0
  chars.forEach((ch, i) => {
    const centre = run + widths[i]! / 2
    run += widths[i]!
    const angle = ((from + (centre / total) * sweep) * Math.PI) / 180
    ctx.save()
    ctx.translate(c, c)
    // Canvas y runs down, so a positive rotation is clockwise on screen.
    ctx.rotate(angle)
    ctx.fillText(ch, 0, -radius * s)
    ctx.restore()
  })
}

/**
 * The drawn textures, one set per spec rather than per watch: every Series 11
 * on a page shares its back's, and a spec is a constant, so they are made once
 * and kept. Each canvas that draws them uploads its own copy to its own GPU
 * context and frees it with that context.
 */
const backTextures = new WeakMap<WatchBack, { sensor: THREE.CanvasTexture; engraved: THREE.CanvasTexture | null }>()

function texturesFor(back: WatchBack) {
  let textures = backTextures.get(back)
  if (!textures) {
    textures = {
      sensor: canvasTexture(SENSOR_TEXTURE, (ctx) => drawSensor(ctx, back)),
      engraved: back.engraving ? canvasTexture(ENGRAVING_TEXTURE, (ctx) => drawEngraving(ctx, back.engraving!)) : null,
    }
    backTextures.set(back, textures)
  }
  return textures
}

/** A lobed screw-drive recess: `lobes` arms round the centre. */
function lobedShape(radius: number, lobes: number): THREE.Shape {
  const shape = new THREE.Shape()
  const samples = lobes * 16
  // Sharper arms for a tri-wing, rounder ones for a pentalobe.
  const sharpness = lobes <= 3 ? 4 : 1.5
  for (let i = 0; i <= samples; i++) {
    const a = (i / samples) * Math.PI * 2 + Math.PI / 2
    const k = Math.pow(0.5 + 0.5 * Math.cos(lobes * (a - Math.PI / 2)), sharpness)
    const r = radius * (0.22 + 0.42 * k)
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  return shape
}

/** Relative luminance of a CSS colour, 0-1. */
function luminance(css: string): number {
  const color = new THREE.Color(css)
  return 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b
}

export function CaseBack({ back, depth, color }: { back: WatchBack; depth: number; color: string }) {
  const { radius, raise, flare, housing, window: glassWindow, electrode, boss, release, screws, vent, engraving } = back
  // The back face is -z; everything stacks outward from it, on the boss where there is one.
  const face = -depth / 2
  const base = boss?.raise ?? 0
  const at = (out: number) => face - out
  const glassRadius = glassWindow ?? radius
  const allGlass = glassWindow === undefined
  const lift = Math.max(raise, 0)

  const parts = React.useMemo(() => {
    const { sensor, engraved } = texturesFor(back)
    // The Series' crystal domes a little; the Ultra's dome face and Samsung's
    // window are all but flat.
    const glass = domedDisc(glassRadius, allGlass && !back.housing ? 0.012 : 0.004)
    const releaseGap = back.release
      ? new THREE.ShapeGeometry(
          roundedRectShape(back.release.width + 0.028, back.release.height + 0.028, (back.release.height + 0.028) / 2 - 0.0005),
          24
        )
      : null
    const releaseKey = back.release
      ? new THREE.ExtrudeGeometry(
          roundedRectShape(back.release.width - 0.008, back.release.height - 0.008, (back.release.height - 0.008) / 2 - 0.0005),
          { depth: 0.006, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 24 }
        )
      : null
    const recess = back.screws ? new THREE.ShapeGeometry(lobedShape(back.screws.radius, back.screws.lobes)) : null
    return { sensor, engraved, glass, releaseGap, releaseKey, recess }
  }, [back, glassRadius, allGlass])
  React.useEffect(
    () => () => {
      // The textures are shared (see `texturesFor`); only the geometry is ours.
      parts.glass.dispose()
      parts.releaseGap?.dispose()
      parts.releaseKey?.dispose()
      parts.recess?.dispose()
    },
    [parts]
  )

  const dark = luminance(color) < 0.25
  const bossColor = React.useMemo(() => '#' + new THREE.Color(color).multiplyScalar(0.55).getHexString(), [color])
  const metal = <meshPhysicalMaterial color={color} metalness={0.85} roughness={0.32} envMapIntensity={1.1} />
  const decal = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 } as const

  return (
    <group>
      {/* the Galaxy Watch Ultra's round plate, raised off the back */}
      {boss && (
        <mesh rotation-x={Math.PI / 2} position-z={at(boss.raise / 2)}>
          <cylinderGeometry args={[boss.radius, boss.radius + boss.raise, boss.raise, 96]} />
          {/* a darker bead-blast than the plate round it */}
          <meshPhysicalMaterial color={bossColor} metalness={0.7} roughness={0.55} envMapIntensity={0.8} />
        </mesh>
      )}

      {/* the raised puck: Samsung's silver electrode, the Ultra's ceramic dome
          widening to the plate, or the Series' crystal standing a hair proud */}
      {raise > 0 && (
        <mesh rotation-x={Math.PI / 2} position-z={at(base + raise / 2)}>
          <cylinderGeometry args={flare ? [radius * flare, radius, raise, 96] : [radius, radius, raise, 96]} />
          {housing ? (
            <meshPhysicalMaterial color={housing} metalness={0.1} roughness={0.2} clearcoat={0.8} clearcoatRoughness={0.2} />
          ) : allGlass ? (
            <meshPhysicalMaterial color={GLASS} metalness={0.1} roughness={0.1} clearcoat={1} clearcoatRoughness={0.08} />
          ) : (
            <meshPhysicalMaterial color={PUCK_METAL} metalness={0.95} roughness={0.3} envMapIntensity={1.3} />
          )}
        </mesh>
      )}

      {/* the polished bezel the Series' crystal sits in */}
      {allGlass && !housing && (
        <mesh position-z={at(base + 0.001)} rotation-y={Math.PI}>
          <ringGeometry args={[radius - 0.004, radius + 0.03, 96]} />
          <meshPhysicalMaterial color={color} metalness={0.95} roughness={0.12} envMapIntensity={1.6} {...decal} />
        </mesh>
      )}

      {/* Samsung's metal face - the electrode - round the dark window, split
          across the middle, with a polished bevel at its rim */}
      {!allGlass && (
        <>
          <mesh position-z={at(base + lift + 0.0005)} rotation-y={Math.PI}>
            <ringGeometry args={[glassRadius, radius - 0.018, 96]} />
            {/* satin rather than mirror: face-on, a mirror shows the dark room
                behind the camera, where the real puck reads bright silver */}
            <meshPhysicalMaterial color={PUCK_METAL} metalness={0.9} roughness={0.34} envMapIntensity={1.4} {...decal} />
          </mesh>
          <mesh position-z={at(base + lift + 0.0005)} rotation-y={Math.PI}>
            <ringGeometry args={[radius - 0.018, radius, 96]} />
            <meshPhysicalMaterial color="#e3e6ea" metalness={1} roughness={0.08} envMapIntensity={1.8} {...decal} />
          </mesh>
          {back.split &&
            ([1, -1] as const).map((side) => (
              <mesh
                key={side}
                position={[(side * (electrode.inner + electrode.outer)) / 2, 0, at(base + lift + 0.001)]}
                rotation-y={Math.PI}
              >
                <planeGeometry args={[electrode.outer - electrode.inner, 0.012]} />
                <meshBasicMaterial color="#08090b" {...decal} />
              </mesh>
            ))}
        </>
      )}

      {/* the sensor glass, its rings, LEDs and photodiodes drawn in */}
      <mesh geometry={parts.glass} position-z={at(base + lift + 0.001)} rotation-y={Math.PI}>
        <meshPhysicalMaterial
          map={parts.sensor}
          metalness={0.15}
          roughness={0.12}
          clearcoat={1}
          clearcoatRoughness={0.06}
          envMapIntensity={1.2}
          {...decal}
        />
      </mesh>

      {back.coilRing && (
        <mesh position-z={at(0.004)} rotation-y={Math.PI}>
          <ringGeometry args={[back.coilRing - 0.014, back.coilRing, 56]} />
          <meshPhysicalMaterial color="#0f1114" metalness={0.5} roughness={0.55} transparent opacity={0.5} />
        </mesh>
      )}

      {/* the engraved model line: etched paler into a dark finish, darker into a light one */}
      {engraving && parts.engraved && (
        <mesh position-z={at(base + 0.0008)} rotation-y={Math.PI}>
          <planeGeometry args={[2 * (engraving.radius + engraving.size), 2 * (engraving.radius + engraving.size)]} />
          <meshPhysicalMaterial
            map={parts.engraved}
            color={dark ? '#9ea1a7' : '#4f5258'}
            metalness={0.4}
            roughness={0.6}
            transparent
            opacity={dark ? 0.55 : 0.5}
            depthWrite={false}
            {...decal}
          />
        </mesh>
      )}

      {/* the band releases by each lug: a key sunk in a dark gap */}
      {release &&
        ([1, -1] as const).map((side) => (
          <group key={side} position={[0, side * release.y, at(0)]} rotation-y={Math.PI}>
            <mesh geometry={parts.releaseGap!} position-z={0.0008}>
              <meshBasicMaterial color="#060708" {...decal} />
            </mesh>
            <mesh geometry={parts.releaseKey!} position-z={0.0006}>
              {release.color ? (
                <meshPhysicalMaterial color={release.color} metalness={0.8} roughness={0.35} envMapIntensity={1.1} />
              ) : (
                metal
              )}
            </mesh>
          </group>
        ))}

      {/* screws: a low head with its lobed drive recess */}
      {screws &&
        ([
          [1, 1],
          [1, -1],
          [-1, 1],
          [-1, -1],
        ] as const).map(([sx, sy]) => (
          <group key={`${sx}${sy}`} position={[sx * screws.x, sy * screws.y, at(0)]} rotation-y={Math.PI}>
            <mesh rotation-x={Math.PI / 2} position-z={0.005}>
              <cylinderGeometry args={[screws.radius * 0.92, screws.radius, 0.01, 32]} />
              {metal}
            </mesh>
            <mesh geometry={parts.recess!} position-z={0.0102}>
              <meshBasicMaterial color="#0a0b0d" {...decal} />
            </mesh>
          </group>
        ))}

      {/* the vent: a dark port with a bright machined lip */}
      {vent && (
        <group position={[vent.x, vent.y, at(base + 0.0008)]} rotation-y={Math.PI}>
          <mesh>
            <circleGeometry args={[vent.radius, 32]} />
            <meshBasicMaterial color="#050506" {...decal} />
          </mesh>
          <mesh>
            <ringGeometry args={[vent.radius, vent.radius + 0.008, 32]} />
            <meshPhysicalMaterial color={color} metalness={0.95} roughness={0.15} envMapIntensity={1.6} {...decal} />
          </mesh>
        </group>
      )}
    </group>
  )
}
