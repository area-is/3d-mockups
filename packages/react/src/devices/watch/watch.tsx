import * as React from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import {
  APPLE_WATCH_COLORWAYS,
  APPLE_WATCH_DEFAULT_VARIANT,
  GALAXY_WATCH_COLORWAYS,
  GALAXY_WATCH_DEFAULT_VARIANT,
  findColorway,
  WATCH_VARIANTS,
  SCREEN_REGIONS,
  type AppleWatchVariant,
  type Colorway,
  type GalaxyWatchVariant,
  type WatchVariant,
  roundedRectShape,
  gearShape,
  sweptStrapGeometry,
  wristLoopPath,
  wristLoopArcLength,
  flatStrapPath,
  watchStrapLengths,
  WATCH_OPEN_START_Y,
  type StrapPath,
} from '@area-3d-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { SideKey, cutGeometry, stadiumCutter, holeCutter, EdgeSocket } from '../details'
import { collectSlots, createSlots, resolveSurface, type SurfaceProps } from '../../slots'

type GroupProps = ThreeElements['group']

/**
 * How far the unbuckled band sinks below the plane it and the case back both
 * rest on (~0.2 mm at watch scale): enough that the buried run loses the depth
 * test to the case back outright instead of tying with it, far too little to
 * read as a band floating off the surface.
 */
const BAND_SINK = 0.012

/**
 * Everything both watch families take. Each brand's component adds its own
 * `variant` union on top - and the Galaxy adds `bandOpen`, which an Apple Watch
 * has no closure to honor.
 */
export interface WatchCommonProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceProps {
  /**
   * Anything you want on the watch screen: React components, a <video>…
   * Wrap in `<AppleWatch.Screen>` / `<GalaxyWatch.Screen>` to set per-screen
   * surface props.
   */
  children?: React.ReactNode
  /**
   * Case color. Takes a retail colorway id from the family's catalog
   * (`APPLE_WATCH_COLORWAYS` / `GALAXY_WATCH_COLORWAYS` - Apple aluminum Jet
   * Black / Silver / Rose Gold, Galaxy Graphite and Silver) or any CSS color
   * for a custom finish. A colorway id wins over a CSS color of the same
   * name - pass hex if you meant the CSS one.
   */
  color?: string
  /** Strap colorway (fluoroelastomer sport band). Defaults to a dark band. */
  bandColor?: string
  /**
   * CSS pixel width of the virtual display. The default matches the device's
   * logical grid: 208 gives 208×248 on the Apple Watch; 240 gives a round
   * 240×240 on the Galaxy Watch - so content lays out like on the real device.
   */
  resolution?: number
}

/** The shared implementation's props: one variant space, `bandOpen` and all. */
interface WatchBodyProps extends WatchCommonProps {
  variant: WatchVariant
  /** The family's colorway catalog, for resolving the `colorway` id. */
  catalog: Colorway[]
  bandOpen?: boolean
}

/**
 * The smartwatch both families are built from - a case machined out of its
 * spec, wearing that spec's real band. `style: 'apple'` gives the squircle case
 * with the knurled Digital Crown and an edge-to-edge crystal; `style: 'galaxy'`
 * the cushion case with the round display raised on its dial puck and two flat
 * keys. The band follows its own `closure`: Apple's Solo Loop is ONE seamless
 * stretchy loop with no closure, no holes and no hardware, flaring into the lug
 * slots at both ends, while the Galaxy's two-strap band closes with a stainless
 * pin buckle, a keeper and punched adjustment holes sized from the retail fit
 * range - and only that one can be laid open with `bandOpen`. Both carry their
 * real sensor back: an optical cluster behind a round crystal, sunk flush into
 * Apple's body-colour plate, raised on Samsung's BioActive puck. No 3D asset
 * files are loaded - the whole device is generated from geometry at runtime.
 */
function WatchBody({
  children,
  variant,
  catalog,
  color: colorProp,
  bandColor = '#2a2c31',
  bandOpen = false,
  surfaceBackground = '#000000',
  resolution,
  surfaceStyle,
  ...groupProps
}: WatchBodyProps) {
  const screen = collectSlots(children, SCREEN_REGIONS).screen
  const spec = WATCH_VARIANTS[variant]
  // `color` doubles as the colorway selector: a catalog id resolves to
  // that retail finish, anything else is passed through as a raw CSS
  // color. Ids win over same-named CSS colors - pass hex for those.
  const retail = findColorway(catalog, colorProp)
  const color = retail?.color ?? colorProp ?? '#1c1d21'
  const { body, glass, display, crown, buttons, mic, speaker, bandSlot, band } = spec
  const res = resolution ?? spec.resolution

  // Squircle / cushion case: extruded rounded-rect with a deep bevel for the
  // curved sides (the Galaxy cushion is the same construction, wider and
  // flatter with a bigger bevel). The mic hole, speaker slots, key recesses
  // and band-slot channels are then machined into the chassis with CSG, so
  // every opening is a true cavity with a lip - matching the phone models.
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
  // It has no closure, no holes and no hardware at all - it just flares into
  // the lug slots at both ends - so it is a single sweep all the way round the
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
  // Either way each run is a domed strap section swept along a path (core's
  // `sweptStrapGeometry`), widening at the lug shoulder to fill the case's
  // band slot. The worn and unbuckled poses are SEPARATE paths - a wrist oval
  // and a straight line - rather than one path stretched to serve both, and
  // because a path is parameterized 0→1 along its own strap, every hole and
  // fitting keeps the same position in either.
  const ride = band.thickness * 1.02
  const pose = React.useMemo(() => {
    const { startAngle } = band.loop
    const ramp = (t: number, a: number, b: number) =>
      Math.min(1, Math.max(0, (t - a) / Math.max(b - a, 1e-3)))
    const flat = (_t: number) => 0

    if (band.closure === 'seamless') {
      // One sweep the long way round, both cut ends buried in the case.
      return {
        kind: 'seamless' as const,
        runs: [
          {
            path: wristLoopPath(band.loop, startAngle, 360 - startAngle),
            length: wristLoopArcLength(band.loop, startAngle, 360 - startAngle),
            lift: flat,
            segments: 168,
          },
        ],
      }
    }

    if (bandOpen) {
      // Unbuckled, the band lies out FLAT, exactly as one is photographed off
      // the wrist. It cannot stay a loop: the far side of a closed loop sits
      // between the camera and the watch, hiding the case back and turning the
      // closure away. Both straps run dead straight out past the case with the
      // hole row and buckle facing the viewer. The lengths come from the worn
      // loop (core's `watchStrapLengths`), so laying the band out neither
      // stretches nor shortens it.
      const length = watchStrapLengths(band)
      // Laid down flat on the same plane the case back rests on - but sunk a
      // hair INTO the case rather than dead flush with it. Flush, the strap's
      // flat inner face and the case's back face are coplanar exactly where
      // each strap runs under the case into its lug slot, and the two z-fight
      // into blotches that crawl over the sensor back as the watch turns.
      const z = -body.depth / 2 + band.thickness / 2 + BAND_SINK
      const pin = flatStrapPath({ startY: WATCH_OPEN_START_Y, z, length: length.pin, direction: 1 })
      const tail = flatStrapPath({ startY: -WATCH_OPEN_START_Y, z, length: length.tail, direction: -1 })
      return {
        kind: 'fastened' as const,
        pin,
        tail,
        // A straight run only needs enough rings to resolve the width taper.
        runs: [
          { path: pin, length: length.pin, lift: flat, segments: 40 },
          { path: tail, length: length.tail, lift: flat, segments: 56 },
        ],
        tailLift: flat,
        pinLift: flat,
      }
    }

    const tailFrom = 360 - startAngle
    // Worn, the tail rides one thickness proud from just before it reaches the
    // other strap's end, so the two stack rather than interpenetrate.
    const lapAt = (angle: number) => (tailFrom - angle) / (tailFrom - band.tailEnd)
    const lapStart = Math.max(0, lapAt(band.pinStrapEnd + 20))
    const lapFull = Math.min(1, lapAt(band.pinStrapEnd))
    const tailLift = (t: number) => ride * ramp(t, lapStart, lapFull)
    const pin = wristLoopPath(band.loop, startAngle, band.pinStrapEnd)
    const tail = wristLoopPath(band.loop, tailFrom, band.tailEnd)
    const length = watchStrapLengths(band)
    return {
      kind: 'fastened' as const,
      pin,
      tail,
      runs: [
        { path: pin, length: length.pin, lift: flat, segments: 72 },
        { path: tail, length: length.tail, lift: tailLift, segments: 112 },
      ],
      tailLift,
      pinLift: flat,
    }
  }, [band, bandOpen, ride, body.depth])

  const bandGeometries = React.useMemo(() => {
    // Lug shoulder → strap: the wide section is just the connector filling the
    // case slot. A seamless loop has TWO lug ends, so its taper is symmetric.
    // The connector is a fixed piece of hardware, so its flare runs a set
    // DISTANCE out from where the strap leaves the case - not a fraction of
    // whichever strap it is on, which comes out stubby on the short one, and
    // not measured from the strap's start either, since how much of that start
    // is buried inside the case differs from pose to pose.
    const seamless = band.closure === 'seamless'
    const LUG_FLARE = 0.45
    const halfHeight = body.height / 2
    // The free tip is narrower on a tapered strap (the Dynamic Lug band).
    const tipWidth = seamless ? band.width : band.tipWidth

    const runs = pose.runs.map((run) => {
      let buried = 0
      for (let i = 1; i <= 24; i++) {
        const t = i / 24
        if (Math.abs(run.path(t).y) > halfHeight) break
        buried = t * run.length
      }
      const lugEnd = Math.min(0.5, (buried + LUG_FLARE) / run.length)
      const shoulder = (t: number) => Math.min(1, (seamless ? Math.min(t, 1 - t) : t) / lugEnd)
      // Tip taper over the last fifth of a fastened strap; a loop has no tip.
      const tipFade = (t: number) => (seamless ? 0 : Math.max(0, (t - 0.8) / 0.2))
      return sweptStrapGeometry({
        path: run.path,
        width: (t) =>
          band.lugWidth +
          (band.width - band.lugWidth) * shoulder(t) +
          (tipWidth - band.width) * tipFade(t),
        thickness: (t) => band.thickness * (1 - 0.18 * tipFade(t)),
        crown: (t) => band.crown * (1 - 0.4 * tipFade(t)),
        lift: run.lift,
        segments: run.segments,
        capStart: true,
        capEnd: true,
      })
    })
    if (band.closure === 'seamless' || pose.kind === 'seamless') return runs

    // Punch the adjustment holes clean through the long strap, at their
    // positions along it - the same fractions whichever pose the band is in.
    const cutters = band.holes.map((t) => {
      const frame = pose.tail(t)
      // The Galaxy band's holes are elongated SLOTS running along the strap,
      // not drillings - so the cutter is an extruded stadium, not a cylinder.
      const depth = band.thickness * 8
      const cutter = new THREE.ExtrudeGeometry(
        roundedRectShape(band.holeRadius * 2, band.holeLength, band.holeRadius),
        { depth, bevelEnabled: false, curveSegments: 12 }
      )
      cutter.translate(0, 0, -depth / 2)
      // Extrusion runs along +Z, so aim THAT down the strap's outward normal:
      // rotateX(t) sends +Z to (0, -sin t, cos t) and the normal is (0, ny, nz).
      // The shape's +Y then lands on the tangent - along the strap, which is
      // exactly where the slot's length belongs - and +X stays across it.
      cutter.rotateX(Math.atan2(-frame.ny, frame.nz))
      // Centre it on the strap's MID-surface - that is where `lift` puts the
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

  // Strap fittings ride the band: a point a fraction `t` along one strap, the
  // outward normal to stand hardware off it, and the tangent tilt that lays
  // that hardware flat against it.
  const fittingAt = React.useCallback((path: StrapPath, t: number, stand = 0) => {
    const frame = path(t)
    return {
      position: [0, frame.y + frame.ny * stand, frame.z + frame.nz * stand] as [number, number, number],
      // Rotation that sends the fitting's local +Y onto the strap's outward
      // normal, +Z along the strap and +X across it - so hardware is
      // authored in strap-local terms and lands flat on the band.
      rotX: Math.atan2(frame.nz, frame.ny),
    }
  }, [])

  // Closure hardware - nothing at all on a seamless loop. Worn, both closures
  // engage through a hole in the lapping strap, so the hardware sits at that
  // hole: the tail rides one thickness proud and the pin (or buckle tongue)
  // comes up from the strap below into the opening. Unbuckled, the hardware
  // stays on the twelve-o'clock strap's own tip where it is mounted.
  const closure =
    band.closure === 'seamless' || pose.kind === 'seamless'
      ? null
      : (() => {
          // Worn, the closure sits at the engaged hole on the lapping tail.
          // Unbuckled, it stays where it is mounted: the tip of the strap that
          // carries it. Both are fractions along a strap, so neither pose has
          // to know anything about the shape of the other's path.
          const closureT = band.holes[band.closureHole] ?? band.holes[0] ?? 0.6
          const strap = bandOpen ? pose.pin : pose.tail
          const at = bandOpen ? 0.91 : closureT
          const stand = bandOpen ? pose.pinLift(at) : pose.tailLift(at)
          const keeperT = band.keeperT ?? 0.78
          return {
            pinStud: fittingAt(strap, at, stand + band.thickness * 0.42),
            // The frame STRADDLES the strap - the tail threads through it - so
            // it centres on the strap's mid-surface, not inside it.
            buckleFrame: fittingAt(strap, at, stand),
            // Worn, the keeper encircles the tail where it lies over the other
            // strap; unbuckled it sits on its own strap, inboard of the buckle.
            keeper: bandOpen
              ? fittingAt(pose.pin, 0.7, pose.pinLift(0.7))
              : fittingAt(pose.tail, keeperT, pose.tailLift(keeperT) + band.thickness * 0.5),
            // Proportioned off the retail accessory: a frame a little wider
            // than the strap that threads it, nearly as long as it is wide,
            // and bent from CHUNKY square stock - the Galaxy band's tang
            // buckle is a solid block, not a wire hoop.
            width: band.width + 0.11,
            length: (band.width + 0.11) * 0.78,
            bar: band.thickness * 1.0,
            holeRadius: band.holeRadius,
          }
        })()

  return (
    <group {...groupProps}>
      {/* case - no sharp clearcoat: mirror-reflected light panels turn into
          hard-edged patches on the tight case curvature */}
      <mesh geometry={bodyGeometry}>
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
          crystal in the middle, ringed by the metal ECG electrode - but Apple
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
            {/* raised puck (Galaxy) - a body-colour collar carrying the crystal */}
            {raise > 0 && (
              <mesh rotation-x={Math.PI / 2} position-z={at(raise / 2)}>
                <cylinderGeometry args={[radius, radius * 1.03, raise, 48]} />
                <meshPhysicalMaterial color={color} metalness={0.8} roughness={0.34} envMapIntensity={0.9} />
              </mesh>
            )}
            {/* machined chamfer the crystal sits in - without it the near-black
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
                windows - the green pair reads as the heart-rate emitters */}
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

      {/* Digital Crown, Apple only - a knurled gear-toothed barrel protruding
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
          top/bottom edges (Apple) - kept below the case's corner roll so only
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
          velvety edge falloff - `sheen` gives that without the blown-out
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
        // flush in the opening - the only hardware the band shows.
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
              CHUNKY rounded-rectangle frame - nearly as long as it is wide,
              bent from square stock, not thin wire - with a hinge bar across
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

      {/* the live screen: real DOM, CSS3D-transformed onto the crystal */}
      <DeviceScreen
        width={display.width}
        height={display.height}
        radius={display.radius}
        position={[0, 0, faceZ + 0.006]}
        {...resolveSurface(screen, {
          surfaceBackground,
          resolution: res,
          surfaceStyle,
        })}
      >
        {screen?.children}
      </DeviceScreen>
    </group>
  )
}
WatchBody.displayName = 'WatchBody'

/** The compound slots both watches share with their mockups. */
export const watchSlots = createSlots(SCREEN_REGIONS)

export interface AppleWatchProps extends WatchCommonProps {
  /**
   * Which Apple Watch to render: `series11` (Series 11, 46 mm - the default and
   * only model today).
   */
  variant?: AppleWatchVariant
}

/**
 * A procedurally built Apple Watch Series 11: 46 mm squircle case with the
 * knurled Digital Crown, the flush side button, an edge-to-edge crystal over
 * the 416x496 display, and the optical sensor back sunk flush into a
 * body-colour plate.
 *
 * It wears the Solo Loop - ONE seamless stretchy band with no closure, no
 * adjustment holes and no hardware, flaring into the lug slots at both ends.
 * There is nothing to unfasten, so unlike `<GalaxyWatch>` it takes no
 * `bandOpen`.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 */
function AppleWatchImpl({ variant = APPLE_WATCH_DEFAULT_VARIANT, ...props }: AppleWatchProps) {
  return <WatchBody variant={variant} catalog={APPLE_WATCH_COLORWAYS[variant]} {...props} />
}
AppleWatchImpl.displayName = 'AppleWatch'

export const AppleWatch = Object.assign(AppleWatchImpl, watchSlots)

export interface GalaxyWatchProps extends WatchCommonProps {
  /**
   * Which Galaxy Watch to render: `watch8` (Galaxy Watch 8, 44 mm cushion case
   * with the round display - the default and only model today).
   */
  variant?: GalaxyWatchVariant
  /**
   * `true` lays the band out unbuckled and flat: both straps run straight out
   * from the case, so the hole row, the buckle AND the case back all face the
   * camera - the pose product photography uses. The default (`false`) wears it,
   * fastened around an invisible wrist behind the case, which necessarily hides
   * the back.
   */
  bandOpen?: boolean
}

/**
 * A procedurally built Samsung Galaxy Watch 8: 44 mm cushion case with the
 * fully round 480x480 display raised on its dial puck, two flat chamfered keys,
 * machined speaker slots, and the BioActive sensor puck standing proud of the
 * aluminium back.
 *
 * It wears the tapering Dynamic-Lug-style band: two straps closing with a
 * stainless pin buckle and keeper over a row of punched adjustment holes, sized
 * from the retail fit range. `bandOpen` lays that band out flat instead of
 * wearing it.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 */
function GalaxyWatchImpl({ variant = GALAXY_WATCH_DEFAULT_VARIANT, ...props }: GalaxyWatchProps) {
  return <WatchBody variant={variant} catalog={GALAXY_WATCH_COLORWAYS[variant]} {...props} />
}
GalaxyWatchImpl.displayName = 'GalaxyWatch'

export const GalaxyWatch = Object.assign(GalaxyWatchImpl, watchSlots)
