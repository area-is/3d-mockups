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
  watchOpenSweeps,
  WATCH_OPEN_START,
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
   * `true` renders the band unbuckled and laid open: the straps run out from
   * the case on a wide, near-flat arc, so the hole row, the closure AND the
   * case back all face the camera — the pose product photography uses. The
   * default (`false`) wears it, fastened around an invisible wrist behind the
   * case, which necessarily hides the back.
   *
   * Ignored on the Apple Watch: its Solo Loop is seamless, so there is no
   * closure to undo. Applies to `watch8`.
   */
  bandOpen?: boolean
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
 * Each wears its real band. The Apple gets the Solo Loop: ONE seamless
 * stretchy band with no closure, no holes and no hardware, flaring into the
 * lug slots at both ends. The Galaxy gets a two-strap band closing with a
 * stainless pin buckle, a keeper and punched adjustment holes, sized from the
 * retail fit range — `bandOpen` lays that one out flat instead of wearing it.
 * Both cases carry their real sensor back: an optical cluster behind a round
 * crystal, sunk flush into Apple's body-colour plate, raised on Samsung's
 * BioActive puck. No 3D asset files are loaded — the whole device is generated
 * from geometry at runtime.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 */
function WatchImpl({
  children,
  variant = WATCH_DEFAULT_VARIANT,
  colorway,
  color: colorProp,
  bandColor = '#2a2c31',
  bandOpen = false,
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

  // The wristband. Two constructions, chosen by the band's own closure:
  //
  // `seamless` (the Apple Watch's Solo Loop) is ONE continuous stretchy band.
  // It has no closure, no holes and no hardware at all — it just flares into
  // the lug slots at both ends — so it is a single sweep all the way round the
  // wrist, and `bandOpen` has nothing to undo.
  //
  // The fastened bands are two straps. The twelve-o'clock one lies against the
  // wrist and ends under the closure; the six-o'clock one is the long one,
  // carrying the row of punched adjustment holes, lapping OVER the other past
  // the closure (the pin or buckle tongue comes up through one of its holes)
  // and running on as a free tail. The holes are machined clean through with
  // the same CSG the chassis ports use, so they are real openings showing the
  // strap beneath rather than painted-on discs.
  //
  // Either way each run is a domed strap section swept along the wrist oval
  // (core's `sweptStrapGeometry`), widening at the lug shoulder to fill the
  // case's band slot.
  const ride = band.thickness * 1.02
  const pose = React.useMemo(() => {
    const { startAngle } = band.loop
    const ramp = (t: number, a: number, b: number) =>
      Math.min(1, Math.max(0, (t - a) / Math.max(b - a, 1e-3)))

    if (band.closure === 'seamless') {
      // One sweep the long way round, both cut ends buried in the case.
      return {
        kind: 'seamless' as const,
        loop: band.loop,
        runs: [{ from: startAngle, to: 360 - startAngle, lift: (_t: number) => 0, segments: 168 }],
      }
    }

    const tailFrom = 360 - startAngle
    // Worn, the tail rides one thickness proud from just before it reaches the
    // other strap's end, so the two stack rather than interpenetrate.
    const lapAt = (angle: number) => (tailFrom - angle) / (tailFrom - band.tailEnd)
    const lapStart = Math.max(0, lapAt(band.pinStrapEnd + 20))
    const lapFull = Math.min(1, lapAt(band.pinStrapEnd))

    if (!bandOpen) {
      return {
        kind: 'fastened' as const,
        loop: band.loop,
        pin: { from: startAngle, to: band.pinStrapEnd },
        tail: { from: tailFrom, to: band.tailEnd },
        runs: [
          { from: startAngle, to: band.pinStrapEnd, lift: (_t: number) => 0, segments: 72 },
          {
            from: tailFrom,
            to: band.tailEnd,
            lift: (t: number) => ride * ramp(t, lapStart, lapFull),
            segments: 112,
          },
        ],
        tailLift: (t: number) => ride * ramp(t, lapStart, lapFull),
        pinLift: (_t: number) => 0,
      }
    }

    // Unbuckled, the band lies on a much larger, near-flat arc — a wide C
    // whose ends are far apart. It cannot stay a loop: the far side of a
    // closed loop sits between the camera and the watch, hiding the case back
    // from behind and turning the closure away. On the open arc both straps
    // run out past the case with the hole row, pin and buckle facing the
    // viewer, exactly as a band is photographed off-wrist. The sweeps come
    // from the straps' true length (core's `watchOpenSweeps`), so opening the
    // band never stretches or shortens it.
    const R = band.openRadius
    const sweeps = watchOpenSweeps(band)
    const loop = {
      ryFront: R,
      ryBack: R,
      rz: R,
      // Centred behind the case, so the arc passes through the band slots.
      centerZ: -R + band.loop.rz * 0.12,
      startAngle: WATCH_OPEN_START,
    }
    const pin = { from: WATCH_OPEN_START, to: WATCH_OPEN_START + sweeps.pin }
    const tail = { from: -WATCH_OPEN_START, to: -WATCH_OPEN_START - sweeps.tail }
    return {
      kind: 'fastened' as const,
      loop,
      pin,
      tail,
      runs: [
        { ...pin, lift: (_t: number) => 0, segments: 72 },
        { ...tail, lift: (_t: number) => 0, segments: 112 },
      ],
      tailLift: (_t: number) => 0,
      pinLift: (_t: number) => 0,
    }
  }, [band, bandOpen, ride])

  const bandGeometries = React.useMemo(() => {
    // Lug shoulder → strap: the wide section is just the connector filling the
    // case slot. A seamless loop has TWO lug ends, so its taper is symmetric.
    const seamless = band.closure === 'seamless'
    const shoulder = (t: number) => Math.min(1, (seamless ? Math.min(t, 1 - t) * 2 : t) * 7)
    const lugTaper = (t: number) => band.lugWidth + (band.width - band.lugWidth) * shoulder(t)
    // Tip taper over the last fifth of a fastened strap; a loop has no tip.
    const tipFade = (t: number) => (seamless ? 0 : Math.max(0, (t - 0.8) / 0.2))
    const tipWidth = seamless ? band.width : band.width
    const strapWidth = (t: number) => lugTaper(t) + (tipWidth - band.width) * tipFade(t)
    const thickness = (t: number) => band.thickness * (1 - 0.18 * tipFade(t))
    const crown = (t: number) => band.crown * (1 - 0.4 * tipFade(t))

    const runs = pose.runs.map((run) =>
      sweptStrapGeometry({
        loop: pose.loop,
        from: run.from,
        to: run.to,
        width: strapWidth,
        thickness,
        crown,
        lift: run.lift,
        segments: run.segments,
        capStart: true,
        capEnd: true,
      })
    )
    if (band.closure === 'seamless' || pose.kind === 'seamless') return runs

    // Punch the adjustment holes clean through the long strap. Each cutter is
    // a cylinder on the loop's outward normal at that hole's position along
    // the strap, long enough to clear the section however far it has ridden up.
    const { from, to } = pose.tail
    const cutters = band.holes.map((t) => {
      const angle = from + (to - from) * t
      const frame = wristLoopAt(pose.loop, (angle * Math.PI) / 180)
      // The Galaxy band's holes are elongated SLOTS running along the strap,
      // not drillings — so the cutter is an extruded stadium, not a cylinder.
      const depth = band.thickness * 8
      const cutter = new THREE.ExtrudeGeometry(
        roundedRectShape(band.holeRadius * 2, band.holeLength, band.holeRadius),
        { depth, bevelEnabled: false, curveSegments: 12 }
      )
      cutter.translate(0, 0, -depth / 2)
      // Extrusion runs along +Z, so aim THAT down the loop's outward normal:
      // rotateX(t) sends +Z to (0, -sin t, cos t) and the normal is (0, ny, nz).
      // The shape's +Y then lands on the tangent — along the strap, which is
      // exactly where the slot's length belongs — and +X stays across it.
      cutter.rotateX(Math.atan2(-frame.ny, frame.nz))
      // Centre it on the strap's MID-surface — that is where `lift` puts the
      // section's origin.
      const seat = pose.tailLift(t)
      cutter.translate(0, frame.y + frame.ny * seat, frame.z + frame.nz * seat)
      return cutter
    })
    return [runs[0]!, cutGeometry(runs[1]!, cutters)]
  }, [band, pose])

  React.useEffect(() => {
    return () => {
      bodyGeometry.dispose()
      glassGeometry.dispose()
      bandGeometries.forEach((geometry) => geometry.dispose())
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
    (phiDeg: number, stand = 0) => {
      const frame = wristLoopAt(pose.loop, (phiDeg * Math.PI) / 180)
      return {
        position: [0, frame.y + frame.ny * stand, frame.z + frame.nz * stand] as [number, number, number],
        // Rotation that sends the fitting's local +Y onto the loop's outward
        // normal, +Z along the strap and +X across it — so hardware is
        // authored in strap-local terms and lands flat on the band.
        rotX: Math.atan2(frame.nz, frame.ny),
      }
    },
    [pose.loop]
  )

  // Closure hardware — nothing at all on a seamless loop. Worn, both closures
  // engage through a hole in the lapping strap, so the hardware sits at that
  // hole: the tail rides one thickness proud and the pin (or buckle tongue)
  // comes up from the strap below into the opening. Unbuckled, the hardware
  // stays on the twelve-o'clock strap's own tip where it is mounted.
  const closure =
    band.closure === 'seamless' || pose.kind === 'seamless'
      ? null
      : (() => {
          const tailAngleAt = (t: number) =>
            pose.tail.from + (pose.tail.to - pose.tail.from) * t
          const closureT = band.holes[band.closureHole] ?? band.holes[0] ?? 0.6
          const angle = bandOpen ? pose.pin.to - 7 : tailAngleAt(closureT)
          const stand = bandOpen ? pose.pinLift(0.94) : pose.tailLift(closureT)
          const keeperT = band.keeperT ?? 0.78
          return {
            pinStud: fittingAt(angle, stand + band.thickness * 0.42),
            // The frame STRADDLES the strap — the tail threads through it — so
            // it centres on the strap's mid-surface, not inside it.
            buckleFrame: fittingAt(angle, stand),
            // Worn, the keeper encircles the tail where it lies over the other
            // strap; unbuckled it sits on its own strap, inboard of the buckle.
            keeper: bandOpen
              ? fittingAt(pose.pin.to - 24, pose.pinLift(0.82))
              : fittingAt(tailAngleAt(keeperT), pose.tailLift(keeperT) + band.thickness * 0.5),
            // Proportioned off the retail accessory: a frame a little wider
            // than the strap that threads it, nearly as long as it is wide,
            // and bent from CHUNKY square stock — the Galaxy band's tang
            // buckle is a solid block, not a wire hoop.
            width: band.width + 0.11,
            length: (band.width + 0.11) * 0.78,
            bar: band.thickness * 1.0,
            holeRadius: band.holeRadius,
          }
        })()

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

      {/* The case back. Both families read the heart optically through a round
          crystal in the middle, ringed by the metal ECG electrode — but Apple
          sinks it flush into a back plate the colour of the case (the watch
          looks milled from one billet), while Samsung raises the whole
          BioActive puck proud of the aluminium cushion. Either way the back is
          NOT one big dark disc: the metal around the cluster is body-coloured,
          and the sensor windows are small. */}
      {(() => {
        const { radius, raise, hubRadius, leds, electrode, coilRing } = spec.back
        // Back face is −z; everything below stacks outward from it.
        const face = -body.depth / 2
        const at = (out: number) => face - out
        return (
          <group>
            {/* raised puck (Galaxy) — a body-colour collar carrying the crystal */}
            {raise > 0 && (
              <mesh rotation-x={Math.PI / 2} position-z={at(raise / 2)}>
                <cylinderGeometry args={[radius, radius * 1.03, raise, 48]} />
                <meshPhysicalMaterial color={color} metalness={0.8} roughness={0.34} envMapIntensity={0.9} />
              </mesh>
            )}
            {/* machined chamfer the crystal sits in — without it the near-black
                sapphire vanishes into a near-black case */}
            <mesh position-z={at(Math.max(raise, 0) + 0.006)} rotation-y={Math.PI}>
              <ringGeometry args={[radius * 0.9, radius * 1.02, 48]} />
              <meshPhysicalMaterial color={color} metalness={0.95} roughness={0.16} envMapIntensity={1.5} />
            </mesh>
            {/* the sensor crystal: glossy near-black sapphire, domed a hair */}
            <mesh rotation-x={Math.PI / 2} position-z={at(Math.max(raise, 0) + 0.012)}>
              <cylinderGeometry args={[radius * 0.94, radius * 0.94, 0.026, 48]} />
              <meshPhysicalMaterial
                color="#07080b"
                metalness={0.1}
                roughness={0.07}
                clearcoat={1}
                clearcoatRoughness={0.05}
                envMapIntensity={1.3}
              />
            </mesh>
            {/* polished electrode ring the ECG reads from */}
            <mesh position-z={at(Math.max(raise, 0) + 0.014)} rotation-y={Math.PI}>
              <ringGeometry args={[electrode.inner * 0.94, electrode.outer * 0.94, 48]} />
              <meshPhysicalMaterial
                color={spec.style === 'galaxy' ? '#c3c7ce' : color}
                metalness={0.94}
                roughness={0.2}
                envMapIntensity={1.3}
              />
            </mesh>
            {/* optical stack: the central photodiode, ringed by the LED
                windows — the green pair reads as the heart-rate emitters */}
            <mesh position-z={at(Math.max(raise, 0) + 0.027)} rotation-y={Math.PI}>
              <circleGeometry args={[hubRadius, 28]} />
              <meshPhysicalMaterial color="#1b2230" metalness={0.35} roughness={0.13} clearcoat={1} envMapIntensity={1.4} />
            </mesh>
            {Array.from({ length: leds.count }, (_, i) => {
              const a = (i / leds.count) * Math.PI * 2 + Math.PI / 4
              const green = i % 2 === 0
              return (
                <mesh
                  key={i}
                  position={[Math.cos(a) * leds.ring, Math.sin(a) * leds.ring, at(Math.max(raise, 0) + 0.027)]}
                  rotation-y={Math.PI}
                >
                  <circleGeometry args={[leds.radius, 20]} />
                  <meshPhysicalMaterial
                    color={green ? '#0e4a2e' : '#1a2030'}
                    emissive={green ? '#0f7a4a' : '#000000'}
                    emissiveIntensity={green ? 0.75 : 0}
                    metalness={0.2}
                    roughness={0.14}
                    clearcoat={1}
                  />
                </mesh>
              )
            })}
            {/* engraved charging-coil ring outside the cluster (Apple) */}
            {coilRing && (
              <mesh position-z={at(0.004)} rotation-y={Math.PI}>
                <ringGeometry args={[coilRing - 0.014, coilRing, 56]} />
                <meshPhysicalMaterial color="#0f1114" metalness={0.5} roughness={0.55} transparent opacity={0.5} />
              </mesh>
            )}
          </group>
        )
      })()}

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
      {bandGeometries.map((geometry, i) => (
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
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {closure === null ? null : band.closure === 'tuck' ? (
        // Sport Band pin-and-tuck: the twelve-o'clock strap's pin stud comes
        // up through one of the punched holes, its polished head sitting
        // flush in the opening — the only hardware the band shows.
        <group position={closure.pinStud.position} rotation-x={closure.pinStud.rotX}>
          {/* the post, rooted in the strap below */}
          <mesh>
            <cylinderGeometry args={[closure.holeRadius * 0.72, closure.holeRadius * 0.72, band.thickness * 2.2, 20]} />
            <meshPhysicalMaterial color="#0d0e11" metalness={0.2} roughness={0.6} envMapIntensity={0.3} />
          </mesh>
          {/* the polished head, sitting in the hole it came up through */}
          <mesh position-y={band.thickness * 0.55}>
            <cylinderGeometry args={[closure.holeRadius * 0.94, closure.holeRadius * 0.78, band.thickness * 0.55, 24]} />
            <meshPhysicalMaterial color="#b6bcc5" metalness={0.92} roughness={0.24} envMapIntensity={1.3} />
          </mesh>
        </group>
      ) : (
        <>
          {/* The Galaxy band's tang buckle, per the retail accessory: a
              CHUNKY rounded-rectangle frame — nearly as long as it is wide,
              bent from square stock, not thin wire — with a hinge bar across
              its inner end and a flat tapered tongue lying in the opening,
              dropping into one of the strap's slots. */}
          <group position={closure.buckleFrame.position} rotation-x={closure.buckleFrame.rotX}>
            {([1, -1] as const).map((side) => (
              <RoundedBox
                key={`side${side}`}
                args={[closure.bar, closure.bar * 1.15, closure.length]}
                radius={closure.bar * 0.4}
                position={[side * (closure.width / 2 - closure.bar / 2), 0, 0]}
              >
                <meshPhysicalMaterial color="#7d828a" metalness={0.88} roughness={0.32} envMapIntensity={1.2} />
              </RoundedBox>
            ))}
            {([1, -1] as const).map((side) => (
              <RoundedBox
                key={`end${side}`}
                args={[closure.width, closure.bar * 1.15, closure.bar]}
                radius={closure.bar * 0.4}
                position={[0, 0, side * (closure.length / 2 - closure.bar / 2)]}
              >
                <meshPhysicalMaterial color="#7d828a" metalness={0.88} roughness={0.32} envMapIntensity={1.2} />
              </RoundedBox>
            ))}
            {/* hinge bar the tongue swings on */}
            <mesh rotation-z={Math.PI / 2} position={[0, 0, closure.length * 0.16]}>
              <cylinderGeometry args={[closure.bar * 0.3, closure.bar * 0.3, closure.width - closure.bar, 12]} />
              <meshPhysicalMaterial color="#8b9098" metalness={0.9} roughness={0.28} envMapIntensity={1.2} />
            </mesh>
            {/* the tongue, flat and tapered, dropping into a slot */}
            <mesh position={[0, band.thickness * 0.34, -closure.length * 0.12]} rotation-x={0.16}>
              <boxGeometry args={[closure.bar * 0.72, closure.bar * 0.42, closure.length * 0.72]} />
              <meshPhysicalMaterial color="#8b9098" metalness={0.9} roughness={0.28} envMapIntensity={1.2} />
            </mesh>
          </group>
          {/* keeper: the wide flat rubber loop the tail threads back through */}
          <group position={closure.keeper.position} rotation-x={closure.keeper.rotX}>
            {([1, -1] as const).map((side) => (
              <RoundedBox
                key={`face${side}`}
                args={[band.width + 0.1, 0.05, 0.3]}
                radius={0.02}
                position={[0, side * (band.thickness * 0.95 + 0.024), 0]}
              >
                <meshPhysicalMaterial color={bandColor} metalness={0} roughness={0.62} sheen={0.4} sheenRoughness={0.85} />
              </RoundedBox>
            ))}
            {([1, -1] as const).map((side) => (
              <RoundedBox
                key={`edge${side}`}
                args={[0.05, band.thickness * 2.1, 0.3]}
                radius={0.02}
                position={[side * ((band.width + 0.1) / 2 - 0.025), 0, 0]}
              >
                <meshPhysicalMaterial color={bandColor} metalness={0} roughness={0.62} sheen={0.4} sheenRoughness={0.85} />
              </RoundedBox>
            ))}
          </group>
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

      {/* The case back. Both families read the heart optically through a round
          crystal in the middle, ringed by the metal ECG electrode — but Apple
          sinks it flush into a back plate the colour of the case (the watch
          looks milled from one billet), while Samsung raises the whole
          BioActive puck proud of the aluminium cushion. Either way the back is
          NOT one big dark disc: the metal around the cluster is body-coloured,
          and the sensor windows are small. */}
      {(() => {
        const { radius, raise, hubRadius, leds, electrode, coilRing } = spec.back
        // Back face is −z; everything below stacks outward from it.
        const face = -body.depth / 2
        const at = (out: number) => face - out
        return (
          <group>
            {/* raised puck (Galaxy) — a body-colour collar carrying the crystal */}
            {raise > 0 && (
              <mesh rotation-x={Math.PI / 2} position-z={at(raise / 2)}>
                <cylinderGeometry args={[radius, radius * 1.03, raise, 48]} />
                <meshPhysicalMaterial color={color} metalness={0.8} roughness={0.34} envMapIntensity={0.9} />
              </mesh>
            )}
            {/* machined chamfer the crystal sits in — without it the near-black
                sapphire vanishes into a near-black case */}
            <mesh position-z={at(Math.max(raise, 0) + 0.006)} rotation-y={Math.PI}>
              <ringGeometry args={[radius * 0.9, radius * 1.02, 48]} />
              <meshPhysicalMaterial color={color} metalness={0.95} roughness={0.16} envMapIntensity={1.5} />
            </mesh>
            {/* the sensor crystal: glossy near-black sapphire, domed a hair */}
            <mesh rotation-x={Math.PI / 2} position-z={at(Math.max(raise, 0) + 0.012)}>
              <cylinderGeometry args={[radius * 0.94, radius * 0.94, 0.026, 48]} />
              <meshPhysicalMaterial
                color="#07080b"
                metalness={0.1}
                roughness={0.07}
                clearcoat={1}
                clearcoatRoughness={0.05}
                envMapIntensity={1.3}
              />
            </mesh>
            {/* polished electrode ring the ECG reads from */}
            <mesh position-z={at(Math.max(raise, 0) + 0.014)} rotation-y={Math.PI}>
              <ringGeometry args={[electrode.inner * 0.94, electrode.outer * 0.94, 48]} />
              <meshPhysicalMaterial
                color={spec.style === 'galaxy' ? '#c3c7ce' : color}
                metalness={0.94}
                roughness={0.2}
                envMapIntensity={1.3}
              />
            </mesh>
            {/* optical stack: the central photodiode, ringed by the LED
                windows — the green pair reads as the heart-rate emitters */}
            <mesh position-z={at(Math.max(raise, 0) + 0.027)} rotation-y={Math.PI}>
              <circleGeometry args={[hubRadius, 28]} />
              <meshPhysicalMaterial color="#1b2230" metalness={0.35} roughness={0.13} clearcoat={1} envMapIntensity={1.4} />
            </mesh>
            {Array.from({ length: leds.count }, (_, i) => {
              const a = (i / leds.count) * Math.PI * 2 + Math.PI / 4
              const green = i % 2 === 0
              return (
                <mesh
                  key={i}
                  position={[Math.cos(a) * leds.ring, Math.sin(a) * leds.ring, at(Math.max(raise, 0) + 0.027)]}
                  rotation-y={Math.PI}
                >
                  <circleGeometry args={[leds.radius, 20]} />
                  <meshPhysicalMaterial
                    color={green ? '#0e4a2e' : '#1a2030'}
                    emissive={green ? '#0f7a4a' : '#000000'}
                    emissiveIntensity={green ? 0.75 : 0}
                    metalness={0.2}
                    roughness={0.14}
                    clearcoat={1}
                  />
                </mesh>
              )
            })}
            {/* engraved charging-coil ring outside the cluster (Apple) */}
            {coilRing && (
              <mesh position-z={at(0.004)} rotation-y={Math.PI}>
                <ringGeometry args={[coilRing - 0.014, coilRing, 56]} />
                <meshPhysicalMaterial color="#0f1114" metalness={0.5} roughness={0.55} transparent opacity={0.5} />
              </mesh>
            )}
          </group>
        )
      })()}

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
      {bandGeometries.map((geometry, i) => (
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
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {closure === null ? null : band.closure === 'tuck' ? (
        // Sport Band pin-and-tuck: the twelve-o'clock strap's pin stud comes
        // up through one of the punched holes, its polished head sitting
        // flush in the opening — the only hardware the band shows.
        <group position={closure.pinStud.position} rotation-x={closure.pinStud.rotX}>
          {/* the post, rooted in the strap below */}
          <mesh>
            <cylinderGeometry args={[closure.holeRadius * 0.72, closure.holeRadius * 0.72, band.thickness * 2.2, 20]} />
            <meshPhysicalMaterial color="#0d0e11" metalness={0.2} roughness={0.6} envMapIntensity={0.3} />
          </mesh>
          {/* the polished head, sitting in the hole it came up through */}
          <mesh position-y={band.thickness * 0.55}>
            <cylinderGeometry args={[closure.holeRadius * 0.94, closure.holeRadius * 0.78, band.thickness * 0.55, 24]} />
            <meshPhysicalMaterial color="#b6bcc5" metalness={0.92} roughness={0.24} envMapIntensity={1.3} />
          </mesh>
        </group>
      ) : (
        <>
          {/* stainless pin buckle. Proportioned off the strap it fastens: a
              real one is a slim rectangular frame just wide enough for the
              strap to pass through, about half as long as it is wide, with a
              hinge bar at the lug end and a short tongue crossing it into the
              tail's hole. `closure.bar` is the stock the frame is bent from. */}
          <group position={closure.buckleFrame.position} rotation-x={closure.buckleFrame.rotX}>
            {([1, -1] as const).map((s) => (
              <RoundedBox
                key={`side${s}`}
                args={[closure.bar, closure.bar * 1.35, closure.length]}
                radius={closure.bar * 0.42}
                position={[s * (closure.width / 2 - closure.bar / 2), 0, 0]}
              >
                <meshPhysicalMaterial color="#b9bdc6" metalness={0.9} roughness={0.26} envMapIntensity={1.3} />
              </RoundedBox>
            ))}
            {([1, -1] as const).map((s) => (
              <RoundedBox
                key={`end${s}`}
                args={[closure.width, closure.bar * 1.35, closure.bar]}
                radius={closure.bar * 0.42}
                position={[0, 0, s * (closure.length / 2 - closure.bar / 2)]}
              >
                <meshPhysicalMaterial color="#b9bdc6" metalness={0.9} roughness={0.26} envMapIntensity={1.3} />
              </RoundedBox>
            ))}
            {/* hinge bar spanning the frame, and the tongue swinging off it
                and down into the hole */}
            <mesh rotation-z={Math.PI / 2} position={[0, 0, closure.length / 2 - closure.bar / 2]}>
              <cylinderGeometry args={[closure.bar * 0.4, closure.bar * 0.4, closure.width - closure.bar, 12]} />
              <meshPhysicalMaterial color="#c6cad1" metalness={0.92} roughness={0.22} envMapIntensity={1.3} />
            </mesh>
            <mesh
              position={[0, band.thickness * 0.55, closure.length * 0.06]}
              rotation-x={Math.PI / 2 - 0.42}
            >
              <cylinderGeometry args={[closure.bar * 0.3, closure.bar * 0.4, closure.length * 0.92, 10]} />
              <meshPhysicalMaterial color="#c6cad1" metalness={0.92} roughness={0.22} envMapIntensity={1.3} />
            </mesh>
          </group>
          {/* keeper: the rubber loop the tail threads back through */}
          <group position={closure.keeper.position} rotation-x={closure.keeper.rotX}>
            {([1, -1] as const).map((s) => (
              <RoundedBox
                key={s}
                args={[band.width + 0.1, 0.15, 0.046]}
                radius={0.02}
                position={[0, s * (band.thickness * 0.9 + 0.023), 0]}
              >
                <meshPhysicalMaterial color={bandColor} metalness={0} roughness={0.62} sheen={0.4} sheenRoughness={0.85} />
              </RoundedBox>
            ))}
            {([1, -1] as const).map((s) => (
              <RoundedBox
                key={s}
                args={[0.046, band.thickness * 1.9, 0.15]}
                radius={0.018}
                position={[s * (band.width / 2 + 0.028), 0, 0]}
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
