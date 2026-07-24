import * as React from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import {
  WATCH_COLORWAYS,
  findColorway,
  WATCH_VARIANTS,
  WATCH_DEFAULT_VARIANT,
  SCREEN_REGIONS,
  type WatchVariant,
  roundedRectShape,
  gearShape,
  sweptStrapGeometry,
  wristLoopAt,
} from '@area-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { useScreenOccluders } from '../../screen/occluders'
import { SideKey, cutGeometry, stadiumCutter, holeCutter, EdgeSocket } from '../details'
import { collectSlots, createSlots, resolveSurface, type SurfaceDefaults } from '../../slots'

type GroupProps = ThreeElements['group']

export interface WatchProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Anything you want on the watch screen: React components, a <video>…
   * Wrap in `<Watch.Screen>` to set per-screen surface props.
   */
  children?: React.ReactNode
  /**
   * Which watch to render, at true relative sizes: `series11` (Apple Watch
   * Series 11, 46 mm — default) or `watch8` (Galaxy Watch 8, 44 mm cushion
   * case with a round display).
   */
  variant?: WatchVariant
  /**
   * A retail colorway id from `WATCH_COLORWAYS` (e.g. the catalog's first
   * entry) presetting the device colors. Explicit color props override it.
   */
  colorway?: string
  /** Case colorway. Apple aluminum: Jet Black `#1c1d21` (default), Silver
   * `#dfe0e3`, Rose Gold `#dcb8a8`. Galaxy: Graphite `#33363c`, Silver `#d9dade`. */
  color?: string
  /** Strap colorway (fluoroelastomer sport band). Defaults to a dark band. */
  bandColor?: string
  /**
   * CSS pixel width of the virtual display. The default matches the device's
   * logical grid: 208 gives 208×248 on the Apple Watch; 240 gives a round
   * 240×240 on the Galaxy Watch — so content lays out like on the real device.
   */
  resolution?: number
  /**
   * How screen content hides when the device faces away from the camera.
   * `true` raycasts against the case (fast, interactive). `'blending'` uses
   * per-pixel depth blending. `false` disables hiding.
   */
  occlude?: boolean | 'blending'
}

/**
 * A procedurally built smartwatch — Apple Watch Series 11 (46 mm squircle
 * case, Digital Crown, Sport Band) or Samsung Galaxy Watch 8 (44 mm cushion
 * case with the round display raised on its dial puck, two flat keys, a
 * tapering Dynamic-Lug-style band) depending on `variant`.
 *
 * The band is worn on an invisible wrist and built the way a real one is:
 * TWO domed, tapering straps sliding into the case's band slots, meeting at
 * a closure on the underside — the Sport Band's pin-and-tuck lap, or a
 * stainless pin buckle with a keeper and punched adjustment holes. No 3D
 * asset files are loaded — the whole device is generated from geometry at
 * runtime.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 */
function WatchImpl({
  children,
  variant = WATCH_DEFAULT_VARIANT,
  colorway,
  color: colorProp,
  bandColor = '#2a2c31',
  surfaceBackground = '#000000',
  resolution,
  interactive = true,
  dragToRotate = true,
  occlude = true,
  surfaceStyle,
  ...groupProps
}: WatchProps) {
  const screen = collectSlots(children, SCREEN_REGIONS).screen
  const spec = WATCH_VARIANTS[variant]
  const retail = findColorway(WATCH_COLORWAYS[variant], colorway)
  const color = colorProp ?? retail?.color ?? '#1c1d21'
  const { body, glass, display, crown, buttons, mic, speaker, bandSlot, band } = spec
  const res = resolution ?? spec.resolution
  const bodyRef = React.useRef<THREE.Mesh>(null!)
  const occludeRefs = useScreenOccluders(bodyRef)

  // Squircle / cushion case: extruded rounded-rect with a deep bevel for the
  // curved sides (the Galaxy cushion is the same construction, wider and
  // flatter with a bigger bevel). The mic hole, speaker slots, key recesses
  // and band-slot channels are then machined into the chassis with CSG, so
  // every opening is a true cavity with a lip — matching the phone models.
  const bodyGeometry = React.useMemo(() => {
    const shape = roundedRectShape(
      body.width - body.bevel * 2,
      body.height - body.bevel * 2,
      body.radius - body.bevel
    )
    const depth = body.depth - body.bevel * 2
    // Generously tessellated: the case's tight curvature turns per-facet
    // specular into visible mosaic patches at lower segment counts.
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: body.bevel,
      bevelSize: body.bevel,
      bevelSegments: 10,
      curveSegments: 48,
    })
    geometry.translate(0, 0, -depth / 2)

    const wall = body.width / 2
    const cutters: THREE.BufferGeometry[] = []
    if (mic) {
      const cutter = holeCutter(mic.radius, 0.08, 'x')
      cutter.translate(wall, mic.y, mic.z ?? 0)
      cutters.push(cutter)
    }
    for (const slot of speaker) {
      // On an x cut the cutter's width maps to z (the slot's thin dimension)
      // and its height to y (the run along the edge).
      const cutter = stadiumCutter(slot.height, slot.length, 0.07, 'x')
      cutter.translate(-wall, slot.y, slot.z ?? 0)
      cutters.push(cutter)
    }
    for (const button of buttons) {
      // Shallow machined recess the key sits in; where the case wall curves
      // away near the corners the recess (and key) fade out naturally.
      const cutter = stadiumCutter(button.width + 0.06, button.length + 0.06, 0.024, 'x')
      cutter.translate(wall, button.y, 0)
      cutters.push(cutter)
    }
    if (bandSlot) {
      for (const side of [1, -1]) {
        const cutter = stadiumCutter(bandSlot.width, bandSlot.height, 0.14, 'y')
        cutter.translate(0, side * (body.height / 2), bandSlot.z)
        cutters.push(cutter)
      }
    }
    return cutGeometry(geometry, cutters)
  }, [body, mic, speaker, buttons, bandSlot])

  const glassGeometry = React.useMemo(
    () => new THREE.ShapeGeometry(roundedRectShape(glass.width, glass.height, glass.radius), 32),
    [glass]
  )

  // Digital Crown barrel: a gear profile extruded along the crown's axis, so
  // the machined knurling crevices run down the barrel like the real crown.
  const crownGeometry = React.useMemo(() => {
    if (!crown) return null
    return new THREE.ExtrudeGeometry(gearShape(crown.radius, crown.teeth, crown.toothDepth), {
      depth: crown.thickness,
      bevelEnabled: false,
    })
  }, [crown])

  // Dark liners seated inside the machined speaker slots: a slim stadium pill
  // sunk past the cavity lip, so the opening keeps a bright machined chamfer
  // over a dark interior.
  const speakerLinerGeometries = React.useMemo(
    () =>
      speaker.map(({ length, height }) => {
        const shape = roundedRectShape(height - 0.006, length - 0.006, (height - 0.006) / 2 - 0.001)
        return new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false, curveSegments: 16 })
      }),
    [speaker]
  )

  // The worn wristband: two straps, like the real product. The twelve-o'clock
  // strap leaves the top band slot, wraps the invisible wrist and carries the
  // closure on its underside; the six-o'clock strap comes up the other way
  // and its tail runs past the closure. Both start inside the case, so they
  // read as sliding into the band slots.
  //
  // Each is a domed strap section swept along the wrist oval (core's
  // `sweptStrapGeometry`): wide at the lug shoulder, narrowing to the strap
  // proper, tapering again at the tip. The twelve-o'clock strap lifts by one
  // strap thickness as it approaches the closure so it laps cleanly OVER the
  // tail instead of intersecting it.
  const closure = band.closureAngle
  const bandGeometries = React.useMemo(() => {
    const { startAngle } = band.loop
    // Lug shoulder → strap: the wide section is just the connector filling the
    // case slot, exactly as on the real bands.
    const shoulder = (t: number) => Math.min(1, t * 7)
    const lugTaper = (t: number) => band.lugWidth + (band.width - band.lugWidth) * shoulder(t)
    // Tip taper over the last fifth of the strap.
    const tipFade = (t: number) => Math.max(0, (t - 0.8) / 0.2)
    const strapWidth = (t: number) => lugTaper(t) + (band.tipWidth - band.width) * tipFade(t)
    const thickness = (t: number) => band.thickness * (1 - 0.18 * tipFade(t))
    const crown = (t: number) => band.crown * (1 - 0.4 * tipFade(t))
    return {
      // Twelve-o'clock strap, lapping over the tail near the closure.
      upper: sweptStrapGeometry({
        loop: band.loop,
        from: startAngle,
        to: closure,
        width: strapWidth,
        thickness,
        crown,
        lift: (t) => band.thickness * 1.05 * Math.min(1, Math.max(0, (t - 0.74) / 0.16)),
        segments: 60,
        capEnd: true,
      }),
      // Six-o'clock strap: swept backwards from the bottom band slot, running
      // `tailOverrun` degrees past the closure.
      lower: sweptStrapGeometry({
        loop: band.loop,
        from: 360 - startAngle,
        to: closure - band.tailOverrun,
        width: strapWidth,
        thickness,
        crown,
        segments: 60,
        capEnd: true,
      }),
    }
  }, [band, closure])

  React.useEffect(() => {
    return () => {
      bodyGeometry.dispose()
      glassGeometry.dispose()
      bandGeometries.upper.dispose()
      bandGeometries.lower.dispose()
      crownGeometry?.dispose()
      speakerLinerGeometries.forEach((g) => g.dispose())
    }
  }, [bodyGeometry, glassGeometry, bandGeometries, crownGeometry, speakerLinerGeometries])

  const dial = spec.dial
  const faceZ = body.depth / 2 + (dial?.height ?? 0)

  // Strap fittings ride the loop: a point on the wrist oval, the outward
  // normal to stand hardware off the strap, and the tangent tilt that lays it
  // flat against the band.
  const fittingAt = React.useCallback(
    (phiDeg: number, ride = 0) => {
      const frame = wristLoopAt(band.loop, (phiDeg * Math.PI) / 180)
      return {
        position: [0, frame.y + frame.ny * ride, frame.z + frame.nz * ride] as [number, number, number],
        // The section's outward normal is (ny, nz); a fitting built along +Y
        // lines up with the strap when rotated onto it.
        rotX: Math.atan2(-frame.nz, frame.ny),
      }
    },
    [band.loop]
  )

  // Closure hardware on the wrist's underside. `tuck` (Sport Band) is just
  // the pin stud on the lapping strap's tip; `buckle` is the classic metal
  // frame with its pin, plus a keeper holding the tail down.
  const stand = band.thickness * 1.05
  const pinStud = fittingAt(closure - 5, stand + band.thickness * 0.55)
  const buckleFrame = fittingAt(closure - 2, stand * 0.5)
  const keeper = fittingAt(closure - band.tailOverrun * 0.62, band.thickness * 0.5)

  return (
    <group {...groupProps}>
      {/* case — no sharp clearcoat: mirror-reflected light panels turn into
          hard-edged patches on the tight case curvature */}
      <mesh ref={bodyRef} geometry={bodyGeometry}>
        <meshPhysicalMaterial
          color={color}
          metalness={0.85}
          roughness={0.3}
          clearcoat={0.25}
          clearcoatRoughness={0.4}
        />
      </mesh>

      {/* Galaxy cushion design: the round dial rides on a raised black puck,
          leaving the aluminum cushion visible around it */}
      {dial && (
        <>
          <mesh
            rotation-x={Math.PI / 2}
            position-z={body.depth / 2 + dial.height / 2 - 0.03}
          >
            <cylinderGeometry args={[dial.radius, dial.radius, dial.height + 0.06, 48]} />
            <meshPhysicalMaterial
              color="#0b0c10"
              metalness={0.55}
              roughness={0.25}
              clearcoat={0.6}
              clearcoatRoughness={0.3}
            />
          </mesh>
          {/* polished rim ring around the dial puck's top edge, as in the
              review macros of the cushion case */}
          <mesh position-z={body.depth / 2 + dial.height - 0.008}>
            <torusGeometry args={[dial.radius - 0.008, 0.009, 10, 72]} />
            <meshPhysicalMaterial color={color} metalness={0.95} roughness={0.18} envMapIntensity={1.2} />
          </mesh>
        </>
      )}

      {/* cover crystal (black ring around the display; a full circle on Galaxy).
          Softened gloss: a mirror clearcoat blows out white at grazing angles */}
      <mesh geometry={glassGeometry} position-z={faceZ + 0.002}>
        <meshPhysicalMaterial
          color="#020205"
          metalness={0.1}
          roughness={0.12}
          clearcoat={0.8}
          clearcoatRoughness={0.25}
        />
      </mesh>

      {/* back sensor island — spans most of the case back on both watches */}
      <mesh rotation-x={Math.PI / 2} position-z={-body.depth / 2 - 0.01}>
        <cylinderGeometry args={[0.78, 0.85, 0.03, 40]} />
        <meshPhysicalMaterial color="#101114" metalness={0.3} roughness={0.35} clearcoat={1} />
      </mesh>

      {/* Digital Crown, Apple only — a knurled gear-toothed barrel protruding
          ~2 mm past the case, with a flat end cap and a dark seam ring where
          the cap meets the teeth (per Apple's product macros) */}
      {crown && crownGeometry && (
        <group position={[body.width / 2, crown.y, 0]}>
          <mesh
            geometry={crownGeometry}
            rotation-y={Math.PI / 2}
            position-x={crown.proud - crown.thickness}
          >
            <meshPhysicalMaterial color={color} metalness={0.88} roughness={0.32} />
          </mesh>
          {/* dark groove between the knurling and the end cap */}
          <mesh rotation-y={Math.PI / 2} position-x={crown.proud - 0.008}>
            <torusGeometry args={[crown.radius - crown.toothDepth - 0.008, 0.011, 10, 48]} />
            <meshPhysicalMaterial color="#0c0d10" metalness={0.5} roughness={0.45} />
          </mesh>
          {/* flat end cap, slightly proud of the teeth */}
          <mesh rotation-z={Math.PI / 2} position-x={crown.proud - 0.002}>
            <cylinderGeometry
              args={[crown.radius - crown.toothDepth - 0.012, crown.radius - crown.toothDepth - 0.012, 0.02, 40]}
            />
            <meshPhysicalMaterial color={color} metalness={0.9} roughness={0.22} clearcoat={0.4} />
          </mesh>
        </group>
      )}

      {/* keys on the right edge, seated in their machined recesses: Apple's
          near-flush side button, the Galaxy's two raised chamfered keys */}
      {buttons.map(({ y, length, width, proud }) => (
        <SideKey
          key={y}
          side={1}
          railX={body.width / 2}
          y={y}
          length={length}
          thickness={width}
          protrusion={proud}
          color={color}
        />
      ))}

      {/* dark plug inside the drilled microphone hole on the right edge */}
      {mic && (
        <EdgeSocket
          position={[body.width / 2, mic.y, mic.z ?? 0]}
          r={mic.radius}
          depth={0.07}
          lip={0.014}
          axis="x"
          inward={-1}
        />
      )}

      {/* dark liners inside the machined speaker slots on the left edge (one
          long slot on Apple, two short ones on Galaxy) */}
      {speaker.map(({ y, z }, i) => (
        <mesh
          key={y}
          geometry={speakerLinerGeometries[i]!}
          rotation-y={-Math.PI / 2}
          position={[-body.width / 2 + 0.018 + 0.05, y, z ?? 0]}
        >
          <meshPhysicalMaterial color="#08090c" metalness={0.15} roughness={0.6} envMapIntensity={0.3} />
        </mesh>
      ))}

      {/* dark liner inside the band-slot channels machined into the flat
          top/bottom edges (Apple) — kept below the case's corner roll so only
          the cavity mouth and the darkness inside it show */}
      {bandSlot && (
        <>
          {[1, -1].map((side) => (
            <RoundedBox
              key={side}
              args={[bandSlot.width - 0.03, 0.12, bandSlot.height - 0.03]}
              radius={0.05}
              position={[0, side * (body.height / 2 - 0.11 - 0.06), bandSlot.z]}
            >
              <meshPhysicalMaterial color="#0a0b0d" metalness={0.12} roughness={0.65} envMapIntensity={0.3} />
            </RoundedBox>
          ))}
        </>
      )}

      {/* the two worn straps. Fluoroelastomer is a soft-touch matte with a
          velvety edge falloff — `sheen` gives that without the blown-out
          white a clearcoat produces at grazing angles */}
      {[bandGeometries.upper, bandGeometries.lower].map((geometry, i) => (
        <mesh key={i} geometry={geometry}>
          <meshPhysicalMaterial
            color={bandColor}
            metalness={0}
            roughness={0.62}
            clearcoat={0.2}
            clearcoatRoughness={0.65}
            sheen={0.4}
            sheenRoughness={0.85}
            sheenColor="#8d939c"
            envMapIntensity={0.65}
          />
        </mesh>
      ))}

      {/* adjustment holes punched through the tail, sunk as dark eyelets */}
      {band.holes.map(({ angle, radius }) => {
        const hole = fittingAt(angle, band.thickness * 0.5 + band.crown * 0.4)
        return (
          <mesh key={angle} position={hole.position} rotation-x={hole.rotX + Math.PI / 2}>
            <cylinderGeometry args={[radius, radius * 0.86, band.thickness * 1.1, 16]} />
            <meshPhysicalMaterial color="#08090b" metalness={0.1} roughness={0.75} envMapIntensity={0.25} />
          </mesh>
        )
      })}

      {band.closure === 'tuck' ? (
        // Sport Band pin-and-tuck: the only hardware on show is the pin stud
        // on the lapping strap's tip, seated in a shallow dark socket.
        <group position={pinStud.position} rotation-x={pinStud.rotX}>
          <mesh rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[band.thickness * 0.62, band.thickness * 0.68, band.thickness * 0.5, 24]} />
            <meshPhysicalMaterial color="#0d0e11" metalness={0.2} roughness={0.6} envMapIntensity={0.3} />
          </mesh>
          <mesh rotation-x={Math.PI / 2} position-y={band.thickness * 0.16}>
            <cylinderGeometry args={[band.thickness * 0.4, band.thickness * 0.44, band.thickness * 0.36, 24]} />
            <meshPhysicalMaterial color="#aeb4bd" metalness={0.92} roughness={0.26} envMapIntensity={1.2} />
          </mesh>
        </group>
      ) : (
        <>
          {/* pin buckle: a stainless frame straddling both straps, with the
              tongue crossing it into the tail's holes */}
          <group position={buckleFrame.position} rotation-x={buckleFrame.rotX}>
            {([1, -1] as const).map((s) => (
              <RoundedBox
                key={s}
                args={[0.07, 0.1, band.thickness * 2.6]}
                radius={0.026}
                position={[s * (band.width / 2 + 0.035), 0, 0]}
              >
                <meshPhysicalMaterial color="#b9bdc6" metalness={0.9} roughness={0.28} envMapIntensity={1.2} />
              </RoundedBox>
            ))}
            {([1, -1] as const).map((s) => (
              <RoundedBox
                key={s}
                args={[band.width + 0.14, 0.1, 0.062]}
                radius={0.026}
                position={[0, 0, s * band.thickness * 1.24]}
              >
                <meshPhysicalMaterial color="#b9bdc6" metalness={0.9} roughness={0.28} envMapIntensity={1.2} />
              </RoundedBox>
            ))}
            <mesh rotation-z={Math.PI / 2} position-y={band.thickness * 0.7}>
              <cylinderGeometry args={[0.022, 0.022, band.width * 0.55, 12]} />
              <meshPhysicalMaterial color="#c6cad1" metalness={0.92} roughness={0.24} />
            </mesh>
          </group>
          {/* keeper: the rubber loop the tail threads back through */}
          <group position={keeper.position} rotation-x={keeper.rotX}>
            {([1, -1] as const).map((s) => (
              <RoundedBox
                key={s}
                args={[band.tipWidth + 0.11, 0.14, 0.05]}
                radius={0.022}
                position={[0, 0, s * (band.thickness * 0.72 + 0.025)]}
              >
                <meshPhysicalMaterial color={bandColor} metalness={0} roughness={0.62} sheen={0.4} sheenRoughness={0.85} />
              </RoundedBox>
            ))}
            {([1, -1] as const).map((s) => (
              <RoundedBox
                key={s}
                args={[0.05, 0.14, band.thickness * 1.5]}
                radius={0.02}
                position={[s * (band.tipWidth / 2 + 0.03), 0, 0]}
              >
                <meshPhysicalMaterial color={bandColor} metalness={0} roughness={0.62} sheen={0.4} sheenRoughness={0.85} />
              </RoundedBox>
            ))}
          </group>
        </>
      )}

      {/* the live screen: real DOM, CSS3D-transformed onto the crystal */}
      <DeviceScreen
        width={display.width}
        height={display.height}
        radius={display.radius}
        position={[0, 0, faceZ + 0.006]}
        occlude={occlude === true ? occludeRefs : occlude === 'blending' ? 'blending' : undefined}
        {...resolveSurface(screen, {
          background: surfaceBackground,
          resolution: res,
          interactive,
          dragToRotate,
          style: surfaceStyle,
        })}
      >
        {screen?.children}
      </DeviceScreen>
    </group>
  )
}
WatchImpl.displayName = 'Watch'

/** The device's compound slots, shared by `<Watch>` and `<WatchMockup>`. */
export const watchSlots = createSlots(SCREEN_REGIONS)

export const Watch = Object.assign(WatchImpl, watchSlots)
