import * as React from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import {
  TV,
  TV_DEFAULT_VARIANT,
  TV_MM_PER_UNIT,
  TV_STAGE_OFFSET_Y,
  SCREEN_REGIONS,
  tvSpec,
  roundedRectShape,
  type TVVariant,
} from '../../core'
import { DeviceScreen } from '../../screen/device-screen'
import { createLogoGeometry } from '../../devices/logos'
import { collectSlots, createSlots, resolveSurface, type SurfaceProps } from '../../slots'

type GroupProps = ThreeElements['group']

export interface TVProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceProps {
  /**
   * Anything you want on the TV: React components, an <iframe>, a <video>…
   * Wrap in `<TVSet.Screen>` to set per-screen surface props.
   */
  children?: React.ReactNode
  /**
   * Diagonal size in inches, clamped to `TV_MIN_INCHES`..`TV_MAX_INCHES`
   * (32–98). The panel scales with the diagonal while the bezels, cabinet
   * depth, ports and feet follow real product ratios - the feet keep a
   * near-constant inset from the panel ends and grow only mildly, like the
   * shared plastic stands on retail ranges. Default 65.
   */
  size?: number
  /**
   * Which design: `'legs'` the wide 4K set on splayed A-frame feet (default),
   * `'pedestal'` the Neo QLED class on a center plate, `'frame'` the
   * picture-frame class - a uniform thick bezel on an even-thickness slab (its
   * electronics live in an external connect box), wall-hung on nothing.
   */
  variant?: TVVariant
  /**
   * Enclosure colorway (frame, back, feet). The picture-frame set's back stays
   * matte black whatever the bezel finish, as the real one does.
   */
  color?: string
  /** CSS pixel width of the virtual display. 1920 gives 1920×1080. */
  resolution?: number
}

/**
 * `TVSetProps`, named after the component like every other `<Name>Props`.
 * `TVProps` stays as an alias so existing imports keep compiling.
 */
export type TVSetProps = TVProps

/**
 * A procedurally built flat-screen TV (65" by default, sized via `size` in
 * inches): near-bezel-less 16:9 panel, thin edges with a shallow
 * electronics bulge low on the back, a recessed rear input bay (HDMI, USB,
 * LAN, optical audio, antenna) and two slim feet near the ends - each a
 * pair of wide-splayed struts, the shallow Λ stance of current retail
 * stands. The screen is a live 1920×1080 DOM surface. No 3D asset files
 * are loaded.
 *
 * The TV renders lifted `TV_STAGE_OFFSET_Y` above the group origin, so the
 * panel + feet ensemble is visually centered on it (the stage pose the
 * framing's camera and shadow expect); the media-stand plane sits
 * `standHeight` below the lifted panel center. Must be rendered inside a
 * react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 */
function TVSetImpl({
  children,
  size,
  variant = TV_DEFAULT_VARIANT,
  color = '#15171b',
  surfaceBackground = '#000000',
  resolution = TV.resolution,
  surfaceStyle,
  ...groupProps
}: TVProps) {
  const screen = collectSlots(children, SCREEN_REGIONS).screen
  const spec = React.useMemo(
    () => (size === undefined && variant === TV_DEFAULT_VARIANT ? TV : tvSpec(size, variant)),
    [size, variant]
  )
  const { body, display, backBulge, stand, portBay, backPanel } = spec

  const bodyGeometry = React.useMemo(() => {
    const shape = roundedRectShape(
      body.width - body.bevel * 2,
      body.height - body.bevel * 2,
      body.radius - body.bevel
    )
    const depth = body.depth - body.bevel * 2
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

  // One splayed foot: ankle + two raked struts whose tips land INSIDE the flat
  // floor pads (the pads sit level on the stand plane outside the leaned
  // strut frame, and the struts terminate buried in them - no overshoot).
  const foot = React.useMemo(() => {
    if (stand.kind !== 'splayed') return null
    const lean = 0.045
    // Slim, flat shoes - barely taller than the strut is wide, so the
    // junction reads as the strut ending in a low runner, not a bulb.
    const padH = 0.022
    const padLen = 0.19
    // The tip stops just under the pad's top surface: deep enough to weld
    // the two, shallow enough that the strut never distorts the shoe line.
    const drop = stand.height - padH - 0.004
    const spanZ = stand.span / 2 - padLen / 2 + 0.02
    return {
      lean,
      padH,
      padLen,
      spanZ,
      strutLength: Math.hypot(drop + 0.02, spanZ),
      rake: Math.atan2(spanZ, drop + 0.02),
      padX: stand.offsetX - Math.sin(lean) * drop,
    }
  }, [stand])

  const plastic = <meshPhysicalMaterial color={color} metalness={0.55} roughness={0.42} />
  // The pedestal's plate is a big flat face aimed straight up, and the camera
  // sees it at a grazing angle - where Fresnel drives the enclosure finish's
  // reflectance to ~1 and the overhead softbox blows the whole plate white.
  // Real center stands are dark graphite, so damp the specular right down.
  const graphite = (
    <meshPhysicalMaterial
      color={color}
      metalness={0.15}
      roughness={0.72}
      specularIntensity={0.3}
    />
  )
  const bayBottom = -body.height / 2 + body.centerY + 0.42
  const bulgeY = backBulge ? -(body.height - backBulge.height) / 2 + body.centerY + 0.1 : 0
  const bulgeZ = backBulge ? -body.depth / 2 - backBulge.depth / 2 + 0.02 : 0
  const bayX = backBulge && portBay ? -(backBulge.width / 2 - portBay.width / 2 - 0.14) : 0
  const bayY = portBay ? bayBottom + portBay.height / 2 : 0
  // The bulge's rear surface and how deep the input bay sinks behind it.
  const bulgeBackZ = backBulge ? bulgeZ - backBulge.depth / 2 : 0
  const cavityDepth = 0.06

  // Electronics bulge with the input bay punched THROUGH it: the opening's
  // side walls come from the extrusion's hole, so the bay reads as a real
  // carved cavity (a floor plate closes it `cavityDepth` in).
  const bulgeGeometry = React.useMemo(() => {
    if (!backBulge) return null
    const bevel = 0.012
    const shape = roundedRectShape(
      backBulge.width - bevel * 2,
      backBulge.height - bevel * 2,
      0.06
    )
    if (portBay) {
      const hole = roundedRectShape(portBay.width, portBay.height, 0.03)
      const holePath = new THREE.Path()
      hole.getPoints(12).forEach((p, i) => {
        const x = p.x + bayX
        const y = p.y + (bayY - bulgeY)
        if (i === 0) holePath.moveTo(x, y)
        else holePath.lineTo(x, y)
      })
      shape.holes.push(holePath)
    }
    const core = backBulge.depth - bevel * 2
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: core,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 2,
      curveSegments: 12,
    })
    geometry.translate(0, 0, -core / 2)
    return geometry
  }, [backBulge, portBay, bayX, bayY, bulgeY])
  React.useEffect(() => () => bulgeGeometry?.dispose(), [bulgeGeometry])

  // The rear input bay's connector column, top to bottom: 3x HDMI, 2x USB,
  // LAN, optical audio, antenna coax. Bay-local coordinates, y from the top.
  // `tongue` colors the connector's inner blade (HDMI gold, USB blue).
  const ports: { w: number; h: number; y: number; color: string; round?: boolean; tongue?: string }[] = [
    { w: 0.075, h: 0.024, y: 0.1, color: '#0a0b0d', tongue: '#a8863f' },
    { w: 0.075, h: 0.024, y: 0.2, color: '#0a0b0d', tongue: '#a8863f' },
    { w: 0.075, h: 0.024, y: 0.3, color: '#0a0b0d', tongue: '#a8863f' },
    { w: 0.05, h: 0.022, y: 0.42, color: '#0a0b0d', tongue: '#274a9e' },
    { w: 0.05, h: 0.022, y: 0.5, color: '#0a0b0d', tongue: '#274a9e' },
    { w: 0.062, h: 0.052, y: 0.63, color: '#0a0b0d' },
    { w: 0.036, h: 0.036, y: 0.76, color: '#141b12' },
    { w: 0.042, h: 0.042, y: 0.92, color: '#26292f', round: true },
  ]
  // The bay floor with every port punched THROUGH it: the openings get real
  // side walls from the extrusion, and the connector liners sit behind them
  // - sockets sunk INTO the panel, like the rear of a retail set.
  const bayFloorGeometry = React.useMemo(() => {
    if (!portBay) return null
    const shape = roundedRectShape(portBay.width - 0.008, portBay.height - 0.008, 0.028)
    for (const p of ports) {
      const cy = portBay.height / 2 - p.y - 0.06
      const cx = -0.1
      const hole = new THREE.Path()
      if (p.round) {
        hole.absarc(cx, cy, p.w / 2 + 0.004, 0, Math.PI * 2, false)
      } else {
        const w = p.w + 0.008
        const h = p.h + 0.008
        roundedRectShape(w, h, Math.min(0.008, h / 2 - 0.001))
          .getPoints(8)
          .forEach((pt, i) => {
            if (i === 0) hole.moveTo(pt.x + cx, pt.y + cy)
            else hole.lineTo(pt.x + cx, pt.y + cy)
          })
      }
      shape.holes.push(hole)
    }
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.03,
      bevelEnabled: false,
      curveSegments: 10,
    })
    return geometry
    // The port table is a module-level constant shape; portBay drives it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portBay])
  React.useEffect(() => () => bayFloorGeometry?.dispose(), [bayFloorGeometry])

  // The picture-frame set's rear, laid out from Samsung's own photograph of
  // the 65" LS03D from behind: one matte-black skin over the whole back
  // (whatever the bezel finish - the customisable frame is a front and side
  // affair), ribbed across, with the One Connect recess and its cable channel
  // punched THROUGH it as one union hole, so the opening gets real side walls
  // from the extrusion and reads carved, not painted; a dark floor at the
  // body's own back face closes it. The lower cover band stands proud of the
  // skin below the channel.
  const recessOutline = React.useMemo(() => {
    if (!backPanel) return null
    const { bay, groove, cover } = backPanel
    const ySeam = -body.height / 2 + cover.height
    const yGroove = ySeam + groove.height
    const yBay = ySeam + bay.height
    const yDrop = ySeam - bay.drop
    const l = bay.centerX - bay.width / 2
    const r = bay.centerX + bay.width / 2
    // Clockwise from the channel's left end: along the seam, down round the
    // recess's foot, back to the seam, out to the right end, up the channel's
    // top edge, round the recess's head, and back.
    const points: [number, number][] = [
      [-groove.width / 2, ySeam],
      [l, ySeam],
      [l, yDrop],
      [r, yDrop],
      [r, ySeam],
      [groove.width / 2, ySeam],
      [groove.width / 2, yGroove],
      [r, yGroove],
      [r, yBay],
      [l, yBay],
      [l, yGroove],
      [-groove.width / 2, yGroove],
    ]
    return points
  }, [backPanel, body.height])
  const backSkinGeometry = React.useMemo(() => {
    if (!backPanel || !recessOutline) return null
    const bevel = 0.004
    const shape = roundedRectShape(
      body.width - backPanel.inset * 2 - bevel * 2,
      body.height - backPanel.inset * 2 - bevel * 2,
      body.radius
    )
    const hole = new THREE.Path()
    recessOutline.forEach(([x, y], i) => (i === 0 ? hole.moveTo(x, y) : hole.lineTo(x, y)))
    hole.closePath()
    shape.holes.push(hole)
    const core = backPanel.depth - bevel * 2
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: core,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 2,
      curveSegments: 12,
    })
    geometry.translate(0, 0, -core / 2)
    return geometry
  }, [backPanel, recessOutline, body])
  React.useEffect(() => () => backSkinGeometry?.dispose(), [backSkinGeometry])
  // The cover band is extruded like the skin rather than boxed, so its UVs
  // are in the same world units and the grid runs across both at one pitch.
  // Its top edge is notched round the recess's foot, which drops below the
  // seam into it.
  const coverGeometry = React.useMemo(() => {
    if (!backPanel) return null
    const bevel = 0.0025
    const w = body.width - backPanel.inset * 2 - 0.012 - bevel * 2
    const h = backPanel.cover.height - bevel * 2
    const r = body.radius * 0.6
    const { bay } = backPanel
    const nl = bay.centerX - bay.width / 2 + bevel
    const nr = bay.centerX + bay.width / 2 - bevel
    const nd = bay.drop - bevel
    const x = -w / 2
    const y = -h / 2
    const shape = new THREE.Shape()
    shape.moveTo(x + r, y)
    shape.lineTo(x + w - r, y)
    shape.quadraticCurveTo(x + w, y, x + w, y + r)
    shape.lineTo(x + w, y + h - r)
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    shape.lineTo(nr, y + h)
    shape.lineTo(nr, y + h - nd)
    shape.lineTo(nl, y + h - nd)
    shape.lineTo(nl, y + h)
    shape.lineTo(x + r, y + h)
    shape.quadraticCurveTo(x, y + h, x, y + h - r)
    shape.lineTo(x, y + r)
    shape.quadraticCurveTo(x, y, x + r, y)
    const core = backPanel.cover.lift + 0.004 - bevel * 2
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: core,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 1,
      curveSegments: 8,
    })
    geometry.translate(0, 0, -core / 2)
    return geometry
  }, [backPanel, body])
  React.useEffect(() => () => coverGeometry?.dispose(), [coverGeometry])
  const recessFloorGeometry = React.useMemo(() => {
    if (!recessOutline) return null
    const shape = new THREE.Shape()
    recessOutline.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)))
    shape.closePath()
    return new THREE.ShapeGeometry(shape)
  }, [recessOutline])
  React.useEffect(() => () => recessFloorGeometry?.dispose(), [recessFloorGeometry])
  // The fine texture the whole back carries - up close, rows of small
  // lighter dashes in dark gutters, a dashed grid at about a 2.5 x 2 mm cell;
  // at arm's length it averages to the matte charcoal of the photograph.
  // Drawn once as a 2 x 2 cell tile and repeated at the product's pitch:
  // extruded caps carry world-unit UVs, so the repeat is cells per unit and
  // the skin and the cover band match. It is the colour map, so it reads
  // under any light, and the bump map, so the dashes catch the environment.
  const grid = React.useMemo(() => {
    if (!backPanel || typeof document === 'undefined') return null
    const cw = 12
    const ch = 10
    const canvas = document.createElement('canvas')
    canvas.width = cw * 2
    canvas.height = ch * 2
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    // Lighter than the photograph reads, on purpose: the map is multiplied by
    // the light the back actually gets, which is the environment alone.
    ctx.fillStyle = '#26292d'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#3b3f45'
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) ctx.fillRect(i * cw + 1, j * ch + 2, cw - 2, ch - 4)
    }
    ctx.fillStyle = '#474c52'
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) ctx.fillRect(i * cw + 2, j * ch + 3, cw - 4, 2)
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
    texture.repeat.set(TV_MM_PER_UNIT / backPanel.grid.pitchX / 2, TV_MM_PER_UNIT / backPanel.grid.pitchY / 2)
    return texture
  }, [backPanel])
  React.useEffect(() => () => grid?.dispose(), [grid])
  // The faint SAMSUNG print on the upper back of the skin.
  const backLogoGeometry = React.useMemo(
    () => (backPanel ? createLogoGeometry('samsung', 0.62, 0.62 * 0.155) : null),
    [backPanel]
  )
  React.useEffect(() => () => backLogoGeometry?.dispose(), [backLogoGeometry])
  // Where the skin's outward face lands (proud of the body back), and the
  // cover band's beyond it. Everything printed or sunk into either face is
  // placed off these two, so the band's extrusion is positioned to put its
  // outer face exactly at `coverFaceZ` (it runs `0.004` back into the skin).
  const bodyBackZ = -body.depth / 2
  const skinFaceZ = backPanel ? bodyBackZ + 0.002 - backPanel.depth : 0
  const coverFaceZ = backPanel ? skinFaceZ - backPanel.cover.lift : 0
  // The matte black of the real back, and the near-black of everything sunk
  // into it. Fixed rather than the bezel colour on purpose: a teak or white
  // Frame is teak or white from the front and black from behind.
  // The photograph's charcoal, carried by the grid tile; a little metalness
  // and a satin roughness let the environment give it the soft sheen the
  // studio shot has, without the stage's front lights (which never reach the
  // back) mattering. The fallback colour only shows where a canvas cannot be
  // made - server rendering.
  const rearSkin = (
    <meshPhysicalMaterial
      color={grid ? '#ffffff' : '#33373c'}
      metalness={0.3}
      roughness={0.5}
      {...(grid ? { map: grid, bumpMap: grid, bumpScale: 0.012 } : {})}
    />
  )
  const rearHollow = <meshPhysicalMaterial color="#0c0d0f" metalness={0.15} roughness={0.75} side={THREE.DoubleSide} />

  return (
    /* the stage lift centering the panel + feet ensemble on the group origin */
    <group position-y={TV_STAGE_OFFSET_Y}>
    <group {...groupProps}>
      {/* enclosure, dropped by the chin offset so the display stays centered */}
      <mesh geometry={bodyGeometry} position={[0, body.centerY, 0]}>
        <meshPhysicalMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* logo/IR bar projecting just below the chin at bottom center - the
          picture-frame set has none, its face is nothing but frame */}
      {spec.logoBar && (
        <RoundedBox
          args={[0.35, 0.04, 0.023]}
          radius={0.01}
          position={[0, -body.height / 2 + body.centerY - 0.012, body.depth / 2 - 0.02]}
        >
          <meshPhysicalMaterial color="#0b0c0e" metalness={0.5} roughness={0.4} />
        </RoundedBox>
      )}

      {/* shallow electronics bulge low on the back, the input bay punched
          through it (absent when the electronics live in a connect box) */}
      {bulgeGeometry && (
        <mesh geometry={bulgeGeometry} position={[0, bulgeY, bulgeZ]}>
          <meshPhysicalMaterial color={color} metalness={0.3} roughness={0.6} />
        </mesh>
      )}

      {/* the input bay's interior - right side viewed from the back (-x),
          the entry-class loadout: HDMI x3, USB x2, LAN, optical, antenna
          coax. A floor plate closes the punched opening `cavityDepth` in;
          every connector mounts on it and stays BELOW the bulge surface,
          so the ports read as carved-in inputs, not stuck-on blocks. */}
      <group position={[bayX, bayY, bulgeBackZ + cavityDepth]} visible={!!portBay}>
        {/* the bay floor, ports punched through it (extrusion runs inward) */}
        {bayFloorGeometry && (
          <mesh geometry={bayFloorGeometry}>
            <meshPhysicalMaterial color="#101216" metalness={0.35} roughness={0.55} />
          </mesh>
        )}
        {portBay && ports.map((p, i) => (
          <group key={i} position={[-0.1, portBay.height / 2 - p.y - 0.06, 0]}>
            {p.round ? (
              <>
                {/* the coax barrel protrudes through its drilled hole */}
                <mesh rotation-x={Math.PI / 2} position-z={0.002}>
                  <cylinderGeometry args={[p.w / 2, p.w / 2, 0.06, 16]} />
                  <meshPhysicalMaterial color="#b9bdc4" metalness={0.85} roughness={0.3} />
                </mesh>
                <mesh rotation-x={Math.PI / 2} position-z={-0.029}>
                  <cylinderGeometry args={[p.w / 4, p.w / 4, 0.002, 12]} />
                  <meshPhysicalMaterial color="#0a0b0d" metalness={0.2} roughness={0.6} />
                </mesh>
              </>
            ) : (
              <>
                {/* dark receptacle cavity behind the punched opening */}
                <RoundedBox
                  args={[p.w + 0.024, p.h + 0.024, 0.022]}
                  radius={0.006}
                  position-z={0.02}
                >
                  <meshPhysicalMaterial color={p.color} metalness={0.15} roughness={0.7} />
                </RoundedBox>
                {/* the connector's inner blade, visible down the opening */}
                {p.tongue && (
                  <RoundedBox
                    args={[p.w * 0.62, p.h * 0.34, 0.006]}
                    radius={0.002}
                    position-z={0.008}
                  >
                    <meshPhysicalMaterial color={p.tongue} metalness={0.6} roughness={0.4} />
                  </RoundedBox>
                )}
              </>
            )}
          </group>
        ))}
      </group>

      {/* the picture-frame set's rear (all it has - its electronics live in
          the external connect box): the grid-textured black skin, the cover
          band proud of its lower third, the cable channel along the band's
          top seam with the connector recess standing up from it and dropping
          into the band, the VESA points either side, the sunk label panel
          and controller slot on the band, and the faint wordmark up top.
          Wall-mount hardware deliberately absent. */}
      {backPanel && backSkinGeometry && (
        <group position-y={body.centerY}>
          <mesh geometry={backSkinGeometry} position-z={bodyBackZ + 0.002 - backPanel.depth / 2}>
            {rearSkin}
          </mesh>
          {/* dark floor closing the recess and channel at the body's own back face */}
          {recessFloorGeometry && (
            <mesh geometry={recessFloorGeometry} position-z={bodyBackZ - 0.0015}>
              {rearHollow}
            </mesh>
          )}
          {/* the lower cover band, its top edge the seam the cable runs along */}
          {coverGeometry && (
            <mesh
              geometry={coverGeometry}
              position={[0, -body.height / 2 + backPanel.cover.height / 2, coverFaceZ + (backPanel.cover.lift + 0.004) / 2]}
            >
              {rearSkin}
            </mesh>
          )}
          {/* the band's vertical seams: one down each side near the ends, and
              one running down from the recess's center, as on the real cover */}
          {[
            backPanel.bay.centerX,
            ...backPanel.cover.seams.flatMap((f) => [f * body.width / 2, -f * body.width / 2]),
          ].map((x, i) => (
            <mesh
              key={i}
              position={[
                x,
                -body.height / 2 + (backPanel.cover.height - (i === 0 ? backPanel.bay.drop : 0)) / 2,
                coverFaceZ - 0.0004,
              ]}
            >
              <boxGeometry args={[0.0022, backPanel.cover.height - (i === 0 ? backPanel.bay.drop : 0) - 0.02, 0.0008]} />
              <meshPhysicalMaterial color="#08090b" metalness={0.1} roughness={0.8} />
            </mesh>
          ))}
          {/* the slim One Connect socket, sunk in the recess near its top */}
          <group
            position={[
              backPanel.bay.centerX,
              -body.height / 2 + backPanel.cover.height + backPanel.bay.height - 0.16,
              bodyBackZ - 0.004,
            ]}
          >
            <RoundedBox args={[backPanel.port.width + 0.024, backPanel.port.height + 0.02, 0.012]} radius={0.005}>
              <meshPhysicalMaterial color="#b9bdc4" metalness={0.85} roughness={0.3} />
            </RoundedBox>
            <RoundedBox args={[backPanel.port.width, backPanel.port.height, 0.01]} radius={0.004} position-z={-0.003}>
              <meshPhysicalMaterial color="#0a0b0d" metalness={0.2} roughness={0.6} />
            </RoundedBox>
          </group>
          {/* VESA points: a threaded insert with a lighter chamfer ring each */}
          {([-1, 1] as const).flatMap((sx) =>
            ([-1, 1] as const).map((sy) => (
              <group
                key={`${sx}${sy}`}
                rotation-y={Math.PI}
                position={[
                  (sx * backPanel.vesa.width) / 2,
                  -body.height / 2 + backPanel.vesa.centerY + (sy * backPanel.vesa.height) / 2,
                  (sy < 0 ? coverFaceZ : skinFaceZ) - 0.0006,
                ]}
              >
                <mesh>
                  <ringGeometry args={[backPanel.vesa.r, backPanel.vesa.r * 1.55, 24]} />
                  <meshPhysicalMaterial color="#5a5e64" metalness={0.6} roughness={0.45} />
                </mesh>
                <mesh position-z={0.0002}>
                  <circleGeometry args={[backPanel.vesa.r, 24]} />
                  <meshPhysicalMaterial color="#050607" metalness={0.3} roughness={0.7} />
                </mesh>
              </group>
            ))
          )}
          {/* the label panel: a dark rectangle sunk into the cover band, as
              the photograph shows it - not a plate on it */}
          <mesh
            rotation-y={Math.PI}
            position={[backPanel.label.centerX, -body.height / 2 + backPanel.label.centerY, coverFaceZ - 0.0006]}
          >
            <planeGeometry args={[backPanel.label.width, backPanel.label.height]} />
            <meshPhysicalMaterial color="#0e0f11" metalness={0.1} roughness={0.85} />
          </mesh>
          {/* TV controller: a slim vertical slot at the band's far end, on
              the right seen from behind */}
          <mesh
            rotation-y={Math.PI}
            position={[
              -(body.width / 2 - backPanel.button.inset),
              -body.height / 2 + backPanel.button.centerY,
              coverFaceZ - 0.0006,
            ]}
          >
            <planeGeometry args={[backPanel.button.width, backPanel.button.height]} />
            <meshPhysicalMaterial color="#050607" metalness={0.2} roughness={0.7} />
          </mesh>
          {/* faint wordmark print on the upper back */}
          {backLogoGeometry && (
            <mesh
              geometry={backLogoGeometry}
              rotation-y={Math.PI}
              position={[0, body.height * 0.36, skinFaceZ - 0.0015]}
            >
              <meshPhysicalMaterial
                transparent
                opacity={0.45}
                color="#8a8f97"
                metalness={0.3}
                roughness={0.6}
                polygonOffset
                polygonOffsetFactor={-1}
              />
            </mesh>
          )}
        </group>
      )}

      {/* splayed feet: a slim ankle block under the cabinet with two
          wide-splayed struts running fore and aft - the shallow Λ stance of
          the reference stands. The struts terminate buried inside flat floor
          pads that sit level on the stand plane. */}
      {stand.kind === 'splayed' &&
        foot &&
        ([1, -1] as const).map((sideX) => (
          <group key={sideX}>
            <group
              position={[sideX * stand.offsetX, -body.height / 2 + body.centerY, 0.02]}
              rotation-z={sideX * -foot.lean}
            >
              <RoundedBox args={[stand.strutWidth + 0.02, 0.07, 0.13]} radius={0.014} position={[0, -0.024, 0]}>
                {plastic}
              </RoundedBox>
              {([1, -1] as const).map((end) => (
                <group key={end} rotation-x={end * foot.rake}>
                  <RoundedBox
                    args={[stand.strutWidth, foot.strutLength, stand.strutDepth]}
                    radius={0.014}
                    position={[0, 0.02 - foot.strutLength / 2, 0]}
                  >
                    {plastic}
                  </RoundedBox>
                </group>
              ))}
            </group>
            {/* flat floor shoes, level on the stand plane, the strut tips
                buried just under their top surface */}
            {([1, -1] as const).map((end) => (
              <RoundedBox
                key={end}
                args={[stand.strutWidth + 0.016, foot.padH, foot.padLen]}
                radius={0.01}
                position={[
                  sideX * foot.padX,
                  -body.height / 2 + body.centerY - stand.height + foot.padH / 2,
                  0.02 - end * foot.spanZ,
                ]}
              >
                {plastic}
              </RoundedBox>
            ))}
          </group>
        ))}

      {/* center pedestal: one slim neck dropping from the cabinet onto a low
          plate, so the set clears furniture narrower than the panel */}
      {stand.kind === 'pedestal' && (
        <>
          <RoundedBox
            args={[stand.neck.width, stand.neck.height + 0.06, stand.neck.depth]}
            radius={0.014}
            position={[
              0,
              -body.height / 2 + body.centerY - stand.neck.height / 2 + 0.03,
              -body.depth / 2 - stand.neck.depth / 2 + 0.03,
            ]}
          >
            {graphite}
          </RoundedBox>
          {/* the plate runs FORWARD from under the neck, the way a pedestal
              set sits at the back of its own base */}
          <RoundedBox
            args={[stand.plate.width, stand.plate.height, stand.plate.depth]}
            radius={0.008}
            position={[
              0,
              -body.height / 2 + body.centerY - stand.height + stand.plate.height / 2,
              -body.depth / 2 - stand.neck.depth / 2 + 0.03 + (stand.plate.depth - stand.neck.depth) / 2,
            ]}
          >
            {graphite}
          </RoundedBox>
        </>
      )}

      {/* `stand.kind === 'none'` (the picture-frame set) renders nothing here:
          it ships with a slim-fit wall mount and meets the surface directly */}

      {/* the live screen: real DOM, CSS3D-transformed onto the panel */}
      <DeviceScreen
        width={display.width}
        height={display.height}
        radius={display.radius}
        position={[0, 0, body.depth / 2 + 0.004]}
        {...resolveSurface(screen, {
          surfaceBackground,
          resolution,
          surfaceStyle,
        })}
        overlay={
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 2147483647,
              background:
                'linear-gradient(118deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 30%, rgba(255,255,255,0) 46%)',
            }}
          />
        }
      >
        {screen?.children}
      </DeviceScreen>
    </group>
    </group>
  )
}
TVSetImpl.displayName = 'TVSet'

/** The object's compound slots, shared by `<TVSet>` and `<TVSetMockup>`. */
export const tvSetSlots = createSlots(SCREEN_REGIONS)

export const TVSet = Object.assign(TVSetImpl, tvSetSlots)
