import * as React from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { TV, TV_STAGE_OFFSET_Y, SCREEN_REGIONS, tvSpec } from '@area-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { roundedRectShape } from '@area-mockups/core'
import { useScreenOccluders } from '../../screen/occluders'
import { collectSlots, createSlots, resolveSurface, type SurfaceDefaults } from '../../slots'

type GroupProps = ThreeElements['group']

export interface TVProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Anything you want on the TV: React components, an <iframe>, a <video>…
   * Wrap in `<TVSet.Screen>` to set per-screen surface props.
   */
  children?: React.ReactNode
  /**
   * Diagonal size in inches, clamped to `TV_MIN_INCHES`..`TV_MAX_INCHES`
   * (32–98). The panel scales with the diagonal while the bezels, cabinet
   * depth, ports and feet follow real product ratios — the feet keep a
   * near-constant inset from the panel ends and grow only mildly, like the
   * shared plastic stands on retail ranges. Default 65.
   */
  size?: number
  /** Enclosure colorway (frame, back, feet). */
  color?: string
  /** CSS pixel width of the virtual display. 1920 gives 1920×1080. */
  resolution?: number
  /**
   * How screen content hides when the TV faces away from the camera.
   * `true` raycasts against the enclosure (fast, interactive). `'blending'`
   * uses per-pixel depth blending. `false` disables hiding.
   */
  occlude?: boolean | 'blending'
}

/**
 * A procedurally built flat-screen TV (65" by default, sized via `size` in
 * inches): near-bezel-less 16:9 panel, thin edges with a shallow
 * electronics bulge low on the back, a recessed rear input bay (HDMI, USB,
 * LAN, optical audio, antenna) and two slim feet near the ends — each a
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
  color = '#15171b',
  surfaceBackground = '#000000',
  resolution = TV.resolution,
  interactive = true,
  dragToRotate = true,
  occlude = true,
  surfaceStyle,
  ...groupProps
}: TVProps) {
  const screen = collectSlots(children, SCREEN_REGIONS).screen
  const spec = React.useMemo(() => (size === undefined ? TV : tvSpec(size)), [size])
  const { body, display, backBulge, feet, portBay } = spec
  const bodyRef = React.useRef<THREE.Mesh>(null!)
  const occludeRefs = useScreenOccluders(bodyRef)

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

  // One foot: ankle + two raked struts whose tips land INSIDE the flat
  // floor pads (the pads sit level on the stand plane outside the leaned
  // strut frame, and the struts terminate buried in them — no overshoot).
  const foot = React.useMemo(() => {
    const lean = 0.045
    // Slim, flat shoes — barely taller than the strut is wide, so the
    // junction reads as the strut ending in a low runner, not a bulb.
    const padH = 0.022
    const padLen = 0.19
    // The tip stops just under the pad's top surface: deep enough to weld
    // the two, shallow enough that the strut never distorts the shoe line.
    const drop = feet.height - padH - 0.004
    const spanZ = feet.span / 2 - padLen / 2 + 0.02
    return {
      lean,
      padH,
      padLen,
      spanZ,
      strutLength: Math.hypot(drop + 0.02, spanZ),
      rake: Math.atan2(spanZ, drop + 0.02),
      padX: feet.offsetX - Math.sin(lean) * drop,
    }
  }, [feet])

  const plastic = <meshPhysicalMaterial color={color} metalness={0.55} roughness={0.42} />
  const bayBottom = -body.height / 2 + body.centerY + 0.42
  const bulgeY = -(body.height - backBulge.height) / 2 + body.centerY + 0.1
  const bulgeZ = -body.depth / 2 - backBulge.depth / 2 + 0.02
  const bayX = -(backBulge.width / 2 - portBay.width / 2 - 0.14)
  const bayY = bayBottom + portBay.height / 2
  // The bulge's rear surface and how deep the input bay sinks behind it.
  const bulgeBackZ = bulgeZ - backBulge.depth / 2
  const cavityDepth = 0.06

  // Electronics bulge with the input bay punched THROUGH it: the opening's
  // side walls come from the extrusion's hole, so the bay reads as a real
  // carved cavity (a floor plate closes it `cavityDepth` in).
  const bulgeGeometry = React.useMemo(() => {
    const bevel = 0.012
    const shape = roundedRectShape(
      backBulge.width - bevel * 2,
      backBulge.height - bevel * 2,
      0.06
    )
    const hole = roundedRectShape(portBay.width, portBay.height, 0.03)
    const holePath = new THREE.Path()
    hole.getPoints(12).forEach((p, i) => {
      const x = p.x + bayX
      const y = p.y + (bayY - bulgeY)
      if (i === 0) holePath.moveTo(x, y)
      else holePath.lineTo(x, y)
    })
    shape.holes.push(holePath)
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
  React.useEffect(() => () => bulgeGeometry.dispose(), [bulgeGeometry])

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
  // — sockets sunk INTO the panel, like the rear of a retail set.
  const bayFloorGeometry = React.useMemo(() => {
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
  React.useEffect(() => () => bayFloorGeometry.dispose(), [bayFloorGeometry])

  return (
    /* the stage lift centering the panel + feet ensemble on the group origin */
    <group position-y={TV_STAGE_OFFSET_Y}>
    <group {...groupProps}>
      {/* enclosure, dropped by the chin offset so the display stays centered */}
      <mesh ref={bodyRef} geometry={bodyGeometry} position={[0, body.centerY, 0]}>
        <meshPhysicalMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* logo/IR bar projecting just below the chin at bottom center */}
      <RoundedBox
        args={[0.35, 0.04, 0.023]}
        radius={0.01}
        position={[0, -body.height / 2 + body.centerY - 0.012, body.depth / 2 - 0.02]}
      >
        <meshPhysicalMaterial color="#0b0c0e" metalness={0.5} roughness={0.4} />
      </RoundedBox>

      {/* shallow electronics bulge low on the back, the input bay punched
          through it */}
      <mesh geometry={bulgeGeometry} position={[0, bulgeY, bulgeZ]}>
        <meshPhysicalMaterial color={color} metalness={0.3} roughness={0.6} />
      </mesh>

      {/* the input bay's interior — right side viewed from the back (-x),
          the entry-class loadout: HDMI x3, USB x2, LAN, optical, antenna
          coax. A floor plate closes the punched opening `cavityDepth` in;
          every connector mounts on it and stays BELOW the bulge surface,
          so the ports read as carved-in inputs, not stuck-on blocks. */}
      <group position={[bayX, bayY, bulgeBackZ + cavityDepth]}>
        {/* the bay floor, ports punched through it (extrusion runs inward) */}
        <mesh geometry={bayFloorGeometry}>
          <meshPhysicalMaterial color="#101216" metalness={0.35} roughness={0.55} />
        </mesh>
        {ports.map((p, i) => (
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

      {/* feet: a slim ankle block under the cabinet with two wide-splayed
          struts running fore and aft — the shallow Λ stance of the
          reference stands. The struts terminate buried inside flat floor
          pads that sit level on the stand plane. */}
      {([1, -1] as const).map((sideX) => (
        <group key={sideX}>
          <group
            position={[sideX * feet.offsetX, -body.height / 2 + body.centerY, 0.02]}
            rotation-z={sideX * -foot.lean}
          >
            <RoundedBox args={[feet.strutWidth + 0.02, 0.07, 0.13]} radius={0.014} position={[0, -0.024, 0]}>
              {plastic}
            </RoundedBox>
            {([1, -1] as const).map((end) => (
              <group key={end} rotation-x={end * foot.rake}>
                <RoundedBox
                  args={[feet.strutWidth, foot.strutLength, feet.strutDepth]}
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
              args={[feet.strutWidth + 0.016, foot.padH, foot.padLen]}
              radius={0.01}
              position={[
                sideX * foot.padX,
                -body.height / 2 + body.centerY - feet.height + foot.padH / 2,
                0.02 - end * foot.spanZ,
              ]}
            >
              {plastic}
            </RoundedBox>
          ))}
        </group>
      ))}

      {/* the live screen: real DOM, CSS3D-transformed onto the panel */}
      <DeviceScreen
        width={display.width}
        height={display.height}
        radius={display.radius}
        position={[0, 0, body.depth / 2 + 0.004]}
        occlude={occlude === true ? occludeRefs : occlude === 'blending' ? 'blending' : undefined}
        {...resolveSurface(screen, {
          background: surfaceBackground,
          resolution,
          interactive,
          dragToRotate,
          style: surfaceStyle,
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
