import * as React from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { BUS, BUS_REGIONS, clipCircle, clipRoundedRect, clipRoundedRectOutline } from '@area-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { useScreenOccluders } from '../../screen/occluders'
import { LEDText, isLedText } from '../../led-text'
import { collectSlots, createSlots, resolveSurface, type SurfaceDefaults } from '../../slots'

type GroupProps = ThreeElements['group']

/**
 * Full-coverage side wrap: the whole side elevation, skirts to roofline,
 * tail to nose. The extruded shell makes the entire side face coplanar, so
 * one DOM plane can cover it; the body outline and the operational-glass
 * cutouts below are carved out of that plane with a CSS `clip-path`.
 */
const FULL_SIDE = {
  width: BUS.profile.noseX - BUS.profile.tailX,
  height: BUS.profile.roofY - BUS.skirtY,
  x: (BUS.profile.noseX + BUS.profile.tailX) / 2,
  y: (BUS.profile.roofY + BUS.skirtY) / 2,
} as const

/**
 * The shell's side profile as a THREE shape — shared by the extruded body
 * and the full wrap's depth occluder, so per-pixel blending hides exactly
 * what the wrap's clip covers and nothing more (glass in the carves stays
 * visible; proud hardware like the door mirrors draws over the livery).
 */
function busProfileShape(): THREE.Shape {
  const { skirtY, wheels, profile } = BUS
  const { noseX, tailX, windshieldBaseY, windshieldTopX, windshieldTopY, signBandTopX, signBandTopY, roofStartX, roofY } = profile
  const arch = wheels.archRadius
  const s = new THREE.Shape()
  // counterclockwise from the rear skirt, arcs cut the wheel arches
  s.moveTo(tailX + 0.06, skirtY)
  s.lineTo(wheels.rearX - arch, skirtY)
  s.absarc(wheels.rearX, skirtY, arch, Math.PI, 0, true)
  s.lineTo(wheels.frontX - arch, skirtY)
  s.absarc(wheels.frontX, skirtY, arch, Math.PI, 0, true)
  s.lineTo(noseX - 0.07, skirtY)
  s.quadraticCurveTo(noseX, skirtY, noseX, skirtY + 0.07)
  // flat nose, light windshield rake, dark sign band, front roof dome
  s.lineTo(noseX, windshieldBaseY)
  s.lineTo(windshieldTopX, windshieldTopY)
  s.lineTo(signBandTopX, signBandTopY)
  s.quadraticCurveTo(signBandTopX - 0.06, roofY, roofStartX, roofY)
  s.lineTo(tailX + 0.1, roofY)
  s.quadraticCurveTo(tailX, roofY, tailX, roofY - 0.08)
  s.lineTo(tailX, skirtY + 0.06)
  s.quadraticCurveTo(tailX, skirtY, tailX + 0.06, skirtY)
  return s
}

/** Rounded-rect hole path (world coords) matching one wrap-clip carve. */
function roundedHolePath(minX: number, minY: number, maxX: number, maxY: number, r: number): THREE.Path {
  const p = new THREE.Path()
  p.moveTo(minX + r, minY)
  p.lineTo(maxX - r, minY)
  p.quadraticCurveTo(maxX, minY, maxX, minY + r)
  p.lineTo(maxX, maxY - r)
  p.quadraticCurveTo(maxX, maxY, maxX - r, maxY)
  p.lineTo(minX + r, maxY)
  p.quadraticCurveTo(minX, maxY, minX, maxY - r)
  p.lineTo(minX, minY + r)
  p.quadraticCurveTo(minX, minY, minX + r, minY)
  p.closePath()
  return p
}

/**
 * SVG path (CSS px, y-down) clipping the full-coverage side wrap: the
 * shell's own side profile — wheel-arch arcs included — as the outer
 * boundary, with the operational glass as opposite-winding holes, cut tight
 * to the hardware (~4 mm install margin). What must stay clear is always
 * carved: the curb-side door leaves and the street-side driver's window.
 * The passenger window band is carved only when
 * `overWindows` is false — transit wraps normally run over it as perforated
 * film. `mirrored` builds the street-side (−Z) variant, whose CSS x axis
 * runs nose→tail; mirroring also flips every arc's sweep flag so the
 * geometry stays identical.
 */
function buildFullSideClip(pxPerUnit: number, mirrored: boolean, overWindows: boolean): string {
  const { skirtY, wheels, profile, windowBand, doors, driverWindow } = BUS
  // Keep the wrap just inside the shell's beveled edge.
  const inset = 0.01
  const margin = 0.004
  const X = (x: number) => ((mirrored ? profile.noseX - x : x - profile.tailX) * pxPerUnit).toFixed(1)
  const Y = (y: number) => ((profile.roofY - y) * pxPerUnit).toFixed(1)
  const P = (x: number, y: number) => `${X(x)} ${Y(y)}`
  const R = (u: number) => (u * pxPerUnit).toFixed(1)
  // One sweep flag serves the whole trace (see core's clip-path helper); the
  // street-side mirror flips orientation, and the flag with it.
  const sweep = mirrored ? 0 : 1

  const bottom = skirtY + inset
  const top = profile.roofY - inset
  const tail = profile.tailX + inset
  const nose = profile.noseX - inset
  const arch = wheels.archRadius

  // The same trace as shellGeometry's profile shape, world-counterclockwise.
  const outline =
    `M ${P(tail + 0.06, bottom)} ` +
    `L ${P(wheels.rearX - arch, bottom)} ` +
    `A ${R(arch)} ${R(arch)} 0 0 ${sweep} ${P(wheels.rearX + arch, bottom)} ` +
    `L ${P(wheels.frontX - arch, bottom)} ` +
    `A ${R(arch)} ${R(arch)} 0 0 ${sweep} ${P(wheels.frontX + arch, bottom)} ` +
    `L ${P(nose - 0.07, bottom)} Q ${P(nose, bottom)} ${P(nose, bottom + 0.07)} ` +
    `L ${P(nose, profile.windshieldBaseY)} ` +
    `L ${P(profile.windshieldTopX - inset, profile.windshieldTopY)} ` +
    `L ${P(profile.signBandTopX - inset, profile.signBandTopY)} ` +
    `Q ${P(profile.signBandTopX - inset - 0.06, top)} ${P(profile.roofStartX, top)} ` +
    `L ${P(tail + 0.1, top)} Q ${P(tail, top)} ${P(tail, top - 0.08)} ` +
    `L ${P(tail, bottom + 0.06)} Q ${P(tail, bottom)} ${P(tail + 0.06, bottom)} Z `

  // With the band also carved (overWindows false), a door hole reaching the
  // band top would overlap the band hole — and two overlapping holes cancel
  // back to FILLED under the nonzero rule (a stray strip of livery over the
  // door glass). Stop the doors at the band's bottom edge so the two carves
  // meet instead of crossing.
  const doorTopY = windowBand.y + windowBand.height / 2
  const doorCarveTop = overWindows ? doorTopY + margin : windowBand.y - windowBand.height / 2 - margin
  const doorHoles = doors
    .map(({ x, width, bottomY }) =>
      clipRoundedRect(P, R, sweep, {
        minX: x - width / 2 - margin,
        maxX: x + width / 2 + margin,
        minY: bottomY - margin,
        maxY: doorCarveTop,
        r: 0.034,
      })
    )
    .join('')
  const windowHole = clipRoundedRect(P, R, sweep, {
    minX: driverWindow.x - driverWindow.width / 2 - margin,
    maxX: driverWindow.x + driverWindow.width / 2 + margin,
    minY: driverWindow.y - driverWindow.height / 2 - margin,
    maxY: driverWindow.y + driverWindow.height / 2 + margin,
    r: 0.034,
  })
  const bandHole = overWindows
    ? ''
    : clipRoundedRect(P, R, sweep, {
        minX: windowBand.backX - margin,
        maxX: windowBand.frontX + margin,
        minY: windowBand.y - windowBand.height / 2 - margin,
        maxY: windowBand.y + windowBand.height / 2 + margin,
        r: 0.034,
      })
  // (No carve for the mirror mount: it sits at the outline's windshield
  // edge, where a "hole" subpath escapes the outer boundary and renders as
  // an isolated filled dot under the nonzero rule — the floating speck of
  // livery on the mirror arm. The mount is proud 3D hardware anyway.)
  return (outline + (mirrored ? windowHole : doorHoles) + bandHole).trim()
}

/**
 * SVG path clipping the full-coverage rear wrap: the wrap rect itself as the
 * outer boundary with each taillight lamp carved out individually — the
 * graphic runs right up to every lamp collar. The engine louvers, route-sign
 * box and rear window sit behind the wrap plane and get covered like a real
 * tail wrap, unless `overWindows` is false, which carves the rear window
 * clear too.
 */
function buildFullRearClip(pxPerUnit: number, overWindows: boolean): string {
  const { rearFull, rearWindow } = BUS
  const halfW = rearFull.width / 2
  const topY = rearFull.y + rearFull.height / 2
  // The rear plane faces −X; its CSS x axis runs along world +z unmirrored.
  const P = (z: number, y: number) => `${((z + halfW) * pxPerUnit).toFixed(1)} ${((topY - y) * pxPerUnit).toFixed(1)}`
  const R = (u: number) => (u * pxPerUnit).toFixed(1)

  const outline = clipRoundedRectOutline(P, R, 1, {
    minX: -halfW,
    minY: topY - rearFull.height,
    maxX: halfW,
    maxY: topY,
    r: rearFull.radius,
  })
  // The stacked round lamps at each corner, r 0.045 plus a slim margin.
  const lamps = ([1, -1] as const)
    .flatMap((side) => [0.3, 0.16, 0.02].map((y) => clipCircle(P, R, 1, side * 0.56, y, 0.053)))
    .join('')
  const windowHole = overWindows
    ? ''
    : clipRoundedRect(P, R, 1, {
        minX: -rearWindow.width / 2 - 0.006,
        maxX: rearWindow.width / 2 + 0.006,
        minY: rearWindow.y - rearWindow.height / 2 - 0.006,
        maxY: rearWindow.y + rearWindow.height / 2 + 0.006,
        r: 0.036,
      })
  return (outline + lamps + windowHole).trim()
}

export interface BusProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Creative for the ad surfaces. Bare children fill the curb-side (+Z)
   * surface — the king-size panel by default, the whole side with
   * `coverage="full"`; name regions explicitly with `<Bus.CurbSide>`,
   * `<Bus.StreetSide>`, `<Bus.Rear>` and `<Bus.DestinationSign>`. Inside
   * `<Bus.DestinationSign>`, a string (scrolls as a marquee when it
   * overflows) or an array of strings (flips between them like a real
   * alternating sign) gets the built-in dot-matrix LED renderer — any other
   * React node renders as-is for full custom control.
   */
  children?: React.ReactNode
  /** Body paint. Transit fleets are usually white or silver. */
  color?: string
  /**
   * CSS pixel width of the virtual ad surface. Height follows its aspect;
   * the default tracks `coverage` (king-size panel dpi, or the full wrap's).
   */
  resolution?: number
  /**
   * How much of the bus the live ad surfaces cover. `'panel'` (default) is
   * the classic king-size (30"x144") side panel and 21"x70" tail panel.
   * `'full'` is the full transit wrap: the entire side elevation — skirts to
   * roofline, tail to nose — and the entire tail between bumper and roof
   * dome. The wheel arches, door leaves, driver's window and taillights are
   * carved out (CSS `clip-path`), so the 3D wheels, the glass the driver
   * needs and the lights stay visible through your livery.
   */
  coverage?: 'panel' | 'full'
  /**
   * Whether a full-coverage wrap runs OVER the passenger glass (`true`,
   * default — perforated-film style: the graphic covers the side window
   * band and the rear window) or UNDER it (`false` — the glass is carved
   * out of the wrap and stays visible). Pass a boolean for all surfaces or
   * an object to set each surface separately, e.g.
   * `{ curbSide: true, streetSide: true, rear: false }`. Operational glass
   * (doors, driver's window) is always carved out regardless.
   */
  wrapOverWindows?: boolean | { curbSide?: boolean; streetSide?: boolean; rear?: boolean }
  /**
   * How ad content hides when the bus faces away from the camera.
   * `true` raycasts against the shell (fast, interactive). `'blending'` uses
   * per-pixel depth blending. `false` disables hiding.
   */
  occlude?: boolean | 'blending'
}

/**
 * A procedurally built 40 ft / 12 m low-floor city transit bus (generic
 * Xcelsior/LFS/Citaro-class silhouette, no brand): a one-box shell extruded
 * from the side profile — no hood, lightly-raked two-piece windshield under
 * a dark sign fascia, flat roof — with the near-half-height window band, the
 * driver's window behind the street-side A-pillar, two full-glass curb-side
 * doors, roof HVAC pod, wheels, stacked round taillights, rear louvers,
 * mirrors and bumpers added on. The curb side carries a live king-size
 * (30" x 144") ad panel between the wheels — or, with `coverage="full"`, the
 * entire sides and tail become the live surface, transit-wrap style — and
 * the destination sign can be live DOM too (plain strings get the built-in
 * LED renderer). No 3D asset files are loaded.
 *
 * The origin is the body center; the road sits `BUS.groundY` below it. The
 * ad panel faces +Z. Must be rendered inside a react-three-fiber `<Canvas>`
 * (or `<MockupCanvas>`).
 *
 * ```tsx
 * <Bus rotation={[0, -0.4, 0]}>
 *   <YourCreative />
 *   <Bus.DestinationSign>52 DOWNTOWN</Bus.DestinationSign>
 * </Bus>
 * ```
 */
function BusImpl({
  children,
  color = '#eef0f2',
  surfaceBackground = '#ffffff',
  resolution,
  coverage = 'panel',
  wrapOverWindows = true,
  interactive = true,
  dragToRotate = true,
  occlude = true,
  surfaceStyle,
  ...groupProps
}: BusProps) {
  const regions = collectSlots(children, BUS_REGIONS)
  const {
    body,
    skirtY,
    wheels,
    profile,
    windowBand,
    driverWindow,
    doors,
    hvac,
    ad,
    rearAd: rearAdSpec,
    rearFull,
    rearWindow,
    destination,
  } = BUS
  const shellRef = React.useRef<THREE.Mesh>(null!)
  const occludeRefs = useScreenOccluders(shellRef)
  // Screens occlude against OTHER registered bodies only. The shell is a
  // convex hull, so the backface culler already hides every surface the
  // body itself could cover — own-shell ray hits at oblique angles were
  // false positives that blanked a plainly visible surface (the rear wrap
  // vanishing at rear-quarter views). The shell stays registered so it
  // still occludes every other mockup in the scene.
  const otherOccludeRefs = React.useMemo(() => occludeRefs.filter((ref) => ref !== shellRef), [occludeRefs])

  // The ad rect the DeviceScreens cover: the classic king-size panel, or the
  // whole side elevation with the operational glass carved out via clip-path.
  const fullWrap = coverage === 'full'
  const over =
    typeof wrapOverWindows === 'boolean'
      ? { curbSide: wrapOverWindows, streetSide: wrapOverWindows, rear: wrapOverWindows }
      : { curbSide: true, streetSide: true, rear: true, ...wrapOverWindows }
  const side = fullWrap
    ? { width: FULL_SIDE.width, height: FULL_SIDE.height, x: FULL_SIDE.x, y: FULL_SIDE.y, radius: 0 }
    : { width: ad.width, height: ad.height, x: ad.x, y: ad.y, radius: ad.radius }
  const sideResolution = resolution ?? (fullWrap ? BUS.fullResolution : BUS.resolution)
  const rearSpec = fullWrap ? rearFull : rearAdSpec
  const surfaceDefaults = { background: surfaceBackground, interactive, dragToRotate, style: surfaceStyle }
  const curbSurface = resolveSurface(regions.curbSide, { ...surfaceDefaults, resolution: sideResolution })
  const streetSurface = resolveSurface(regions.streetSide, { ...surfaceDefaults, resolution: sideResolution })
  // The rear surface shares the side surface's dpi.
  const rearSurface = resolveSurface(regions.rear, {
    ...surfaceDefaults,
    resolution: Math.round(rearSpec.width * (sideResolution / side.width)),
  })
  // Clips are built at each surface's resolved resolution, so a slot-level
  // `resolution` override keeps the carve aligned with its wrap.
  const sideClip = React.useMemo(() => {
    if (!fullWrap) return null
    return {
      curb: `path("${buildFullSideClip(curbSurface.resolution / FULL_SIDE.width, false, over.curbSide)}")`,
      street: `path("${buildFullSideClip(streetSurface.resolution / FULL_SIDE.width, true, over.streetSide)}")`,
    }
  }, [fullWrap, curbSurface.resolution, streetSurface.resolution, over.curbSide, over.streetSide])
  const rearClip = React.useMemo(() => {
    if (!fullWrap) return null
    return `path("${buildFullRearClip(rearSurface.resolution / rearFull.width, over.rear)}")`
  }, [fullWrap, rearSurface.resolution, rearFull.width, over.rear])
  const curbStyle = sideClip ? { clipPath: sideClip.curb, ...curbSurface.screenStyle } : curbSurface.screenStyle
  const streetStyle = sideClip ? { clipPath: sideClip.street, ...streetSurface.screenStyle } : streetSurface.screenStyle
  const rearStyle = rearClip ? { clipPath: rearClip, ...rearSurface.screenStyle } : rearSurface.screenStyle

  // Depth occluders for the full-coverage sides: the wrap outline as real
  // geometry with the same glass carves as the clip, so per-pixel blending
  // hides only what the livery visually covers — and the proud door
  // mirrors draw over the wrap instead of being pierced by it.
  const sideOccluderGeometries = React.useMemo(() => {
    if (!fullWrap) return null
    const margin = 0.004
    const doorTopY = windowBand.y + windowBand.height / 2
    const build = (overGlass: boolean, mirroredSide: boolean) => {
      const s = busProfileShape()
      // Door holes meet (never cross) the band hole — see buildFullSideClip.
      const doorHoleTop = overGlass ? doorTopY + margin : windowBand.y - windowBand.height / 2 - margin
      if (mirroredSide) {
        s.holes.push(
          roundedHolePath(
            driverWindow.x - driverWindow.width / 2 - margin,
            driverWindow.y - driverWindow.height / 2 - margin,
            driverWindow.x + driverWindow.width / 2 + margin,
            driverWindow.y + driverWindow.height / 2 + margin,
            0.034
          )
        )
      } else {
        for (const { x, width, bottomY } of doors) {
          s.holes.push(roundedHolePath(x - width / 2 - margin, bottomY - margin, x + width / 2 + margin, doorHoleTop, 0.034))
        }
      }
      if (!overGlass) {
        s.holes.push(
          roundedHolePath(
            windowBand.backX - margin,
            windowBand.y - windowBand.height / 2 - margin,
            windowBand.frontX + margin,
            windowBand.y + windowBand.height / 2 + margin,
            0.034
          )
        )
      }
      const geometry = new THREE.ShapeGeometry(s, 16)
      geometry.translate(-FULL_SIDE.x, -FULL_SIDE.y, 0)
      if (mirroredSide) geometry.scale(-1, 1, 1)
      return geometry
    }
    return { curb: build(over.curbSide, false), street: build(over.streetSide, true) }
  }, [fullWrap, over.curbSide, over.streetSide, windowBand, doors, driverWindow])
  React.useEffect(
    () => () => {
      sideOccluderGeometries?.curb.dispose()
      sideOccluderGeometries?.street.dispose()
    },
    [sideOccluderGeometries]
  )
  // Full-coverage sides composite per-pixel so proud hardware (the door
  // mirrors and their arms) draws over the livery; everything else keeps
  // the fast raycast mode.
  const sideScreenOcclusion = (blendGeometry?: THREE.BufferGeometry) =>
    fullWrap && occlude !== false
      ? { occlude: 'blending' as const, occluderGeometry: blendGeometry }
      : { occlude: occlude === true ? otherOccludeRefs : occlude === 'blending' ? ('blending' as const) : undefined }

  // Plain strings become the built-in LED destination sign; custom nodes
  // pass straight through.
  const signSlot = regions.destinationSign
  const signContent = signSlot?.children
  const sign = isLedText(signContent) ? <LEDText text={signContent} /> : signContent

  const shellGeometry = React.useMemo(() => {
    const s = busProfileShape()
    const depth = body.width - body.bevel * 2
    const geometry = new THREE.ExtrudeGeometry(s, {
      depth,
      bevelEnabled: true,
      bevelThickness: body.bevel,
      // a small in-plane bevel keeps the profile within ~15mm of nominal,
      // so the glass band and lamps placed on it stay visible
      bevelSize: 0.015,
      bevelSegments: 3,
      curveSegments: 24,
    })
    geometry.translate(0, 0, -depth / 2)
    return geometry
  }, [body, skirtY, wheels, profile])

  // The whole front glass band — windshield up through the sign fascia —
  // reads as one dark plane on these buses.
  const frontBand = React.useMemo(() => {
    const dx = profile.signBandTopX - profile.noseX
    const dy = profile.signBandTopY - profile.windshieldBaseY
    const length = Math.hypot(dx, dy)
    return {
      tilt: Math.atan2(-dx / length, dy / length),
      length,
      mid: [
        (profile.noseX + profile.signBandTopX) / 2 + (dy / length) * 0.032,
        (profile.windshieldBaseY + profile.signBandTopY) / 2 + (-dx / length) * 0.032,
      ] as const,
    }
  }, [profile])

  React.useEffect(() => () => shellGeometry.dispose(), [shellGeometry])

  const glassMaterial = (
    <meshPhysicalMaterial color="#10161f" metalness={0.2} roughness={0.12} clearcoat={1} />
  )
  const trimMaterial = <meshPhysicalMaterial color="#23262b" metalness={0.1} roughness={0.7} />

  const bandCenterX = (windowBand.frontX + windowBand.backX) / 2
  const bandLength = windowBand.frontX - windowBand.backX
  const doorTopY = windowBand.y + windowBand.height / 2
  // drive-axle dual pair: outer tire face lines up with the single fronts
  const dualOuterZ = body.width / 2 - 0.02 - wheels.dualWidth / 2
  const dualInnerZ = dualOuterZ - wheels.dualWidth - wheels.dualGap

  return (
    <group {...groupProps}>
      {/* painted shell */}
      <mesh ref={shellRef} geometry={shellGeometry}>
        <meshPhysicalMaterial
          color={color}
          metalness={0.4}
          roughness={0.3}
          clearcoat={1}
          clearcoatRoughness={0.15}
        />
      </mesh>

      {/* front glass band: windshield + sign fascia as one dark plane, with
          the two-piece windshield's center mullion */}
      <group position={[frontBand.mid[0], frontBand.mid[1], 0]} rotation-z={frontBand.tilt}>
        <mesh rotation-y={Math.PI / 2}>
          <planeGeometry args={[body.width - 0.2, frontBand.length - 0.06]} />
          {glassMaterial}
        </mesh>
        <mesh position={[0.012, -0.28, 0]}>
          <boxGeometry args={[0.02, frontBand.length - 0.62, 0.035]} />
          {trimMaterial}
        </mesh>

        {/* live LED destination sign inside the fascia */}
        {signSlot != null && (
          <DeviceScreen
            width={destination.width}
            height={destination.height}
            radius={0.01}
            {...resolveSurface(signSlot, { ...surfaceDefaults, background: '#0a0a08', resolution: 480 })}
            position={[0.016, destination.y - frontBand.mid[1], 0]}
            rotation={[0, Math.PI / 2, 0]}
            occlude={occlude === true ? otherOccludeRefs : occlude === 'blending' ? 'blending' : undefined}
          >
            {sign}
          </DeviceScreen>
        )}
      </group>

      {/* passenger window bands, both sides — almost half the body height.
          A full wrap covering the glass (perforated film) hides its side's
          band; with the wrap under the glass the band stays, showing through
          the window carve-out. */}
      {[1, -1].map((s) => {
        const wrapped =
          fullWrap && (s === 1 ? regions.curbSide != null && over.curbSide : regions.streetSide != null && over.streetSide)
        if (wrapped) return null
        return (
          <RoundedBox
            key={s}
            args={[bandLength, windowBand.height, 0.1]}
            radius={0.03}
            position={[bandCenterX, windowBand.y, s * (body.width / 2 - 0.03)]}
          >
            {glassMaterial}
          </RoundedBox>
        )
      })}

      {/* driver's window behind the street-side A-pillar: taller than the
          passenger band, sill dropping below it — always clear glass (it is
          carved out of a full wrap; vinyl never covers the driver's view) */}
      <RoundedBox
        args={[driverWindow.width, driverWindow.height, 0.1]}
        radius={0.03}
        position={[driverWindow.x, driverWindow.y, -(body.width / 2 - 0.03)]}
      >
        {glassMaterial}
      </RoundedBox>

      {/* curb-side doors: two-leaf full-glass slabs dropping to the low-floor
          entry, with a center mullion slightly proud of the glass marking the
          leaf split */}
      {doors.map(({ x, width, bottomY }) => (
        <group key={x}>
          <RoundedBox
            args={[width, doorTopY - bottomY, 0.1]}
            radius={0.03}
            position={[x, (doorTopY + bottomY) / 2, body.width / 2 - 0.02]}
          >
            {glassMaterial}
          </RoundedBox>
          <mesh position={[x, (doorTopY + bottomY) / 2, body.width / 2 + 0.036]}>
            <boxGeometry args={[0.013, doorTopY - bottomY - 0.04, 0.015]} />
            {trimMaterial}
          </mesh>
        </group>
      ))}

      {/* roof HVAC pod over the rear half */}
      <RoundedBox
        args={[hvac.length, hvac.height, hvac.width]}
        radius={0.05}
        position={[hvac.x, profile.roofY + hvac.height / 2, 0]}
      >
        <meshPhysicalMaterial color={color} metalness={0.5} roughness={0.5} />
      </RoundedBox>

      {/* running gear: dark wheel-well liners fill the arch openings, axles
          tie each wheel pair together, and an underbody pan closes the gap
          between the skirts — the wheels read as attached, not floating */}
      {([wheels.frontX, wheels.rearX] as const).map((x) => (
        <group key={x}>
          <mesh position={[x, skirtY + (wheels.archRadius + 0.02) / 2, 0]}>
            <boxGeometry args={[wheels.archRadius * 2 - 0.04, wheels.archRadius + 0.02, body.width - 0.08]} />
            <meshPhysicalMaterial color="#0c0d10" metalness={0} roughness={1} />
          </mesh>
          <mesh rotation-x={Math.PI / 2} position={[x, wheels.centerY, 0]}>
            <cylinderGeometry args={[0.05, 0.05, body.width - 0.3, 12]} />
            <meshPhysicalMaterial color="#191b1f" metalness={0.5} roughness={0.7} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, skirtY - 0.06, 0]}>
        <boxGeometry args={[body.length - 0.7, 0.12, body.width - 0.36]} />
        <meshPhysicalMaterial color="#0d0e11" metalness={0.1} roughness={0.95} />
      </mesh>

      {/* wheels: single steer tires up front — tire, rim, hub */}
      {[1, -1].map((side) => (
        <group key={side} position={[wheels.frontX, wheels.centerY, side * (body.width / 2 - 0.12)]}>
          <mesh rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[wheels.radius, wheels.radius, wheels.width, 28]} />
            <meshPhysicalMaterial color="#15161a" metalness={0} roughness={0.95} />
          </mesh>
          <mesh rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.15, 0.15, wheels.width + 0.006, 24]} />
            <meshPhysicalMaterial color="#c6cad1" metalness={0.85} roughness={0.35} />
          </mesh>
          <mesh rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.05, 0.05, wheels.width + 0.012, 16]} />
            <meshPhysicalMaterial color="#3c4046" metalness={0.7} roughness={0.4} />
          </mesh>
        </group>
      ))}
      {/* drive axle runs dual tires per side; rim and hub only on the outer */}
      {[1, -1].map((side) => (
        <group key={side} position={[wheels.rearX, wheels.centerY, 0]}>
          {[dualOuterZ, dualInnerZ].map((z) => (
            <mesh key={z} rotation-x={Math.PI / 2} position={[0, 0, side * z]}>
              <cylinderGeometry args={[wheels.radius, wheels.radius, wheels.dualWidth, 28]} />
              <meshPhysicalMaterial color="#15161a" metalness={0} roughness={0.95} />
            </mesh>
          ))}
          <mesh rotation-x={Math.PI / 2} position={[0, 0, side * dualOuterZ]}>
            <cylinderGeometry args={[0.15, 0.15, wheels.dualWidth + 0.006, 24]} />
            <meshPhysicalMaterial color="#c6cad1" metalness={0.85} roughness={0.35} />
          </mesh>
          <mesh rotation-x={Math.PI / 2} position={[0, 0, side * dualOuterZ]}>
            <cylinderGeometry args={[0.05, 0.05, wheels.dualWidth + 0.012, 16]} />
            <meshPhysicalMaterial color="#3c4046" metalness={0.7} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* bumpers */}
      <RoundedBox args={[0.1, 0.27, body.width + 0.02]} radius={0.04} position={[3.2, -0.4, 0]}>
        {trimMaterial}
      </RoundedBox>
      <RoundedBox args={[0.1, 0.2, body.width + 0.02]} radius={0.04} position={[-3.2, -0.52, 0]}>
        {trimMaterial}
      </RoundedBox>

      {/* headlights low on the nose, amber turn signals at the corners */}
      {[1, -1].map((side) => (
        <group key={side}>
          <RoundedBox args={[0.05, 0.12, 0.28]} radius={0.02} position={[3.21, -0.52, side * 0.4]}>
            <meshPhysicalMaterial
              color="#e8edf4"
              emissive="#dfe9f5"
              emissiveIntensity={0.25}
              metalness={0.3}
              roughness={0.2}
              clearcoat={1}
            />
          </RoundedBox>
          <RoundedBox args={[0.05, 0.1, 0.09]} radius={0.02} position={[3.21, -0.51, side * 0.6]}>
            <meshPhysicalMaterial
              color="#f2a33c"
              emissive="#ffb340"
              emissiveIntensity={0.4}
              roughness={0.25}
              clearcoat={1}
            />
          </RoundedBox>
        </group>
      ))}

      {/* rear: window above the engine bay, small route-sign box near the
          roof, engine louvers, and stacked round lamps — brake and tail in
          red, turn signal in amber — at each corner */}
      <RoundedBox
        args={[0.05, rearWindow.height, rearWindow.width]}
        radius={0.03}
        position={[-3.198, rearWindow.y, 0]}
      >
        {glassMaterial}
      </RoundedBox>
      <RoundedBox args={[0.03, 0.1, 0.5]} radius={0.012} position={[-3.206, 0.77, 0]}>
        <meshPhysicalMaterial color="#0a0a08" metalness={0.2} roughness={0.3} clearcoat={1} />
      </RoundedBox>
      <RoundedBox args={[0.05, 0.22, 0.9]} radius={0.02} position={[-3.198, 0.05, 0]}>
        <meshPhysicalMaterial color="#1d2025" metalness={0.3} roughness={0.6} />
      </RoundedBox>
      {[1, -1].map((side) =>
        (
          [
            { y: 0.3, color: '#8c1524', emissive: '#c11a30' },
            { y: 0.16, color: '#8c1524', emissive: '#c11a30' },
            { y: 0.02, color: '#f2a33c', emissive: '#ffb340' },
          ] as const
        ).map(({ y, color: lampColor, emissive }) => (
          // Slim lens pucks: rooted in the tail face, ending just ~7 mm proud
          // of the full-wrap plane (x -3.229) — through the carved holes the
          // lamps read mounted ON the livery without jutting like knobs. The
          // whole tail stack (window, sign box, louvers) sits within ~23 mm
          // of the face so the wrap plane can hug the body this closely.
          <mesh key={`${side}${y}`} rotation-z={Math.PI / 2} position={[-3.218, y, side * 0.56]}>
            <cylinderGeometry args={[0.045, 0.045, 0.036, 20]} />
            <meshPhysicalMaterial
              color={lampColor}
              emissive={emissive}
              emissiveIntensity={0.4}
              roughness={0.25}
              clearcoat={1}
            />
          </mesh>
        ))
      )}

      {/* door mirrors on swan-neck arms: the heads hang ~450 mm forward of
          the windshield at its mid-height, transit style — root stub off the
          A-pillar, forward run, then the drop to the head */}
      {[1, -1].map((side) => (
        <group key={side}>
          <mesh position={[3.15, 0.34, side * (body.width / 2 + 0.06)]}>
            <boxGeometry args={[0.035, 0.03, 0.16]} />
            {trimMaterial}
          </mesh>
          <mesh position={[3.29, 0.34, side * (body.width / 2 + 0.12)]}>
            <boxGeometry args={[0.32, 0.028, 0.028]} />
            {trimMaterial}
          </mesh>
          <mesh position={[3.44, 0.22, side * (body.width / 2 + 0.12)]}>
            <boxGeometry args={[0.028, 0.26, 0.028]} />
            {trimMaterial}
          </mesh>
          <RoundedBox
            args={[0.06, 0.3, 0.13]}
            radius={0.02}
            position={[3.44, 0.05, side * (body.width / 2 + 0.12)]}
            rotation-y={side * 0.15}
          >
            {trimMaterial}
          </RoundedBox>
        </group>
      ))}

      {/* five amber marker lights across the front roof dome */}
      {[-0.44, -0.22, 0, 0.22, 0.44].map((z) => (
        <RoundedBox key={z} args={[0.05, 0.03, 0.09]} radius={0.012} position={[2.99, 0.81, z]} rotation-z={-0.49}>
          <meshPhysicalMaterial
            color="#f2a33c"
            emissive="#ffb340"
            emissiveIntensity={0.4}
            roughness={0.25}
            clearcoat={1}
          />
        </RoundedBox>
      ))}

      {/* the live ads: king-size panels (or full transit wraps) on both
          sides, tail ad (or full tail wrap) on the rear */}
      <DeviceScreen
        width={side.width}
        height={side.height}
        radius={side.radius}
        {...curbSurface}
        position={[side.x, side.y, body.width / 2 + 0.008]}
        {...sideScreenOcclusion(sideOccluderGeometries?.curb)}
        screenStyle={curbStyle}
      >
        {regions.curbSide?.children}
      </DeviceScreen>
      {regions.streetSide != null && (
        <DeviceScreen
          width={side.width}
          height={side.height}
          radius={side.radius}
          {...streetSurface}
          position={[side.x, side.y, -body.width / 2 - 0.008]}
          rotation={[0, Math.PI, 0]}
          {...sideScreenOcclusion(sideOccluderGeometries?.street)}
          screenStyle={streetStyle}
        >
          {regions.streetSide.children}
        </DeviceScreen>
      )}
      {regions.rear != null && (
        <DeviceScreen
          width={rearSpec.width}
          height={rearSpec.height}
          radius={rearSpec.radius}
          {...rearSurface}
          position={[-body.length / 2 - (fullWrap ? 0.029 : 0.028), rearSpec.y, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          occlude={occlude === true ? otherOccludeRefs : occlude === 'blending' ? 'blending' : undefined}
          screenStyle={rearStyle}
        >
          {regions.rear.children}
        </DeviceScreen>
      )}
    </group>
  )
}
BusImpl.displayName = 'Bus'

/** The bus's compound slots, shared by `<Bus>` and `<BusMockup>`. */
export const busSlots = createSlots(BUS_REGIONS)

export const Bus = Object.assign(BusImpl, busSlots)
