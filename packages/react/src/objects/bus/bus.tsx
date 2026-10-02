import * as React from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import {
  BUS,
  BUS_FULL_SIDE,
  BUS_REGIONS,
  clipCircle,
  clipRoundedRect,
  clipRoundedRectOutline,
  type BusCoverage,
} from '../../core'
import { DeviceScreen } from '../../screen/device-screen'
import { LEDText, isLedText } from '../../led-text'
import { collectSlots, createSlots, resolveSurface, type SurfaceProps } from '../../slots'
import { RoadWheel } from '../road-wheel'

type GroupProps = ThreeElements['group']

/**
 * In-plane growth of the shell's edge rounding: the extruded profile is the
 * flat side cap, and the side walls stand this much outside it where the
 * bevel rolls the roofline, corners and arch edges over. Every nose, tail
 * and roof fitting is placed off the WALL, not the nominal profile, and the
 * full wrap's clip insets by the same amount so the artwork ends on the
 * flat cap instead of overhanging the roll.
 */
const SHELL_BEVEL_SIZE = 0.024

/** Pillar between two window panes, and the gasket border around each. */
const PILLAR = 0.05
const GASKET = 0.022
/** Target pane pitch (~1.5 m): seven panes down a 12 m street side. */
const PANE_PITCH = 0.78

/**
 * The shell's side profile as a THREE shape - shared by the extruded body
 * and the full wrap's depth occluder, so per-pixel blending hides exactly
 * what the wrap's clip covers and nothing more (glass in the carves stays
 * visible; proud hardware like the door mirrors draws over the livery).
 */
function busProfileShape(): THREE.Shape {
  const { skirtY, wheels, profile } = BUS
  const { noseX, tailX, windshieldBaseY, windshieldTopX, windshieldTopY, signBandTopX, signBandTopY, roofStartX, roofY } = profile
  const arch = wheels.archRadius
  const s = new THREE.Shape()
  // Each arch: short vertical legs up from the skirt, then the semicircle
  // over the axle - a low-floor body's tall, square-shouldered opening.
  const archAt = (x: number) => {
    s.lineTo(x - arch, skirtY)
    s.lineTo(x - arch, wheels.archY)
    s.absarc(x, wheels.archY, arch, Math.PI, 0, true)
    s.lineTo(x + arch, skirtY)
  }
  // counterclockwise from the rear skirt
  s.moveTo(tailX + 0.06, skirtY)
  archAt(wheels.rearX)
  archAt(wheels.frontX)
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
 * Top of a door's wrap carve. With the band also carved (`overWindows`
 * false), a door hole reaching the band top would overlap the band hole -
 * and two overlapping holes cancel back to FILLED under the nonzero rule (a
 * stray strip of livery over the door glass). A door inside the band's run
 * therefore stops at the band's bottom edge so the two carves meet instead
 * of crossing; the front door sits ahead of the band and carves its full
 * height either way.
 */
function doorCarveTop(door: { x: number; width: number }, overWindows: boolean, margin: number): number {
  const { windowBand } = BUS
  const inBand = door.x + door.width / 2 > windowBand.backX && door.x - door.width / 2 < windowBand.frontX
  return overWindows || !inBand
    ? windowBand.y + windowBand.height / 2 + margin
    : windowBand.y - windowBand.height / 2 - margin
}

/**
 * SVG path (CSS px, y-down) clipping the full-coverage side wrap: the
 * shell's own side profile - wheel-arch legs and arcs included - as the
 * outer boundary, with the operational glass as opposite-winding holes, cut
 * tight to the hardware (~4 mm install margin). What must stay clear is
 * always carved: the curb-side door leaves and the street-side driver's
 * window. The passenger window band is carved only when `overWindows` is
 * false - transit wraps normally run over it as perforated film. `mirrored`
 * builds the street-side (−Z) variant, whose CSS x axis runs nose→tail;
 * mirroring also flips every arc's sweep flag so the geometry stays
 * identical.
 */
function buildFullSideClip(pxPerUnit: number, mirrored: boolean, overWindows: boolean): string {
  const { skirtY, wheels, profile, windowBand, doors, driverWindow } = BUS
  // Keep the wrap just inside the shell's rolled edge: matches the in-plane
  // bevel of the shell ExtrudeGeometry, so the artwork ends where the flat
  // cap does instead of overhanging onto the roll.
  const inset = SHELL_BEVEL_SIZE
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
  // The arch offset inward by the same inset is a LARGER circle about the
  // same centre, with the legs pushed out to match.
  const archR = wheels.archRadius + inset
  const archAt = (x: number) =>
    `L ${P(x - archR, bottom)} L ${P(x - archR, wheels.archY)} ` +
    `A ${R(archR)} ${R(archR)} 0 0 ${sweep} ${P(x + archR, wheels.archY)} ` +
    `L ${P(x + archR, bottom)} `

  // The same trace as shellGeometry's profile shape, world-counterclockwise.
  const outline =
    `M ${P(tail + 0.06, bottom)} ` +
    archAt(wheels.rearX) +
    archAt(wheels.frontX) +
    `L ${P(nose - 0.07, bottom)} Q ${P(nose, bottom)} ${P(nose, bottom + 0.07)} ` +
    `L ${P(nose, profile.windshieldBaseY)} ` +
    `L ${P(profile.windshieldTopX - inset, profile.windshieldTopY)} ` +
    `L ${P(profile.signBandTopX - inset, profile.signBandTopY)} ` +
    `Q ${P(profile.signBandTopX - inset - 0.06, top)} ${P(profile.roofStartX, top)} ` +
    `L ${P(tail + 0.1, top)} Q ${P(tail, top)} ${P(tail, top - 0.08)} ` +
    `L ${P(tail, bottom + 0.06)} Q ${P(tail, bottom)} ${P(tail + 0.06, bottom)} Z `

  const doorHoles = doors
    .map((door) =>
      clipRoundedRect(P, R, sweep, {
        minX: door.x - door.width / 2 - margin,
        maxX: door.x + door.width / 2 + margin,
        minY: door.bottomY - margin,
        maxY: doorCarveTop(door, overWindows, margin),
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
  // an isolated filled dot under the nonzero rule - the floating speck of
  // livery on the mirror arm. The mount is proud 3D hardware anyway.)
  return (outline + (mirrored ? windowHole : doorHoles) + bandHole).trim()
}

/**
 * SVG path clipping the full-coverage rear wrap: the wrap rect itself as the
 * outer boundary with each taillight lamp carved out individually - the
 * graphic runs right up to every lamp collar. The engine grille, hatch
 * lines, route-sign box and rear window sit behind the wrap plane and get
 * covered like a real tail wrap, unless `overWindows` is false, which
 * carves the rear window clear too.
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
  // The stacked round lamps at each corner, r 0.045 plus bezel and a slim margin.
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

/**
 * The glass runs of one side's window band - the whole band, split around
 * any door leaf that interrupts it - and the pane cells inside each run,
 * divided at an even pitch so the pillars land where a coachbuilder's would.
 */
function bandSections(withDoors: boolean): [number, number][] {
  const { windowBand, doors } = BUS
  let sections: [number, number][] = [[windowBand.backX, windowBand.frontX]]
  if (!withDoors) return sections
  for (const { x, width } of doors) {
    const d0 = x - width / 2
    const d1 = x + width / 2
    sections = sections.flatMap(([a, b]): [number, number][] => {
      if (d1 <= a || d0 >= b) return [[a, b]]
      const out: [number, number][] = []
      if (d0 > a) out.push([a, d0])
      if (d1 < b) out.push([d1, b])
      return out
    })
  }
  return sections
}

function bandPanes(sections: [number, number][]): { x0: number; x1: number }[] {
  return sections.flatMap(([a, b]) => {
    const n = Math.max(1, Math.round((b - a) / PANE_PITCH))
    const w = (b - a) / n
    return Array.from({ length: n }, (_, i) => ({ x0: a + i * w, x1: a + (i + 1) * w }))
  })
}

/** Cuts `cuts` (each widened by `gap`) out of a list of x spans. */
function subtractSpans(spans: [number, number][], cuts: [number, number][], gap: number): [number, number][] {
  return cuts.reduce(
    (acc, [c0, c1]) =>
      acc.flatMap(([a, b]): [number, number][] => {
        const lo = c0 - gap
        const hi = c1 + gap
        if (hi <= a || lo >= b) return [[a, b]]
        const out: [number, number][] = []
        if (lo > a) out.push([a, lo])
        if (hi < b) out.push([hi, b])
        return out
      }),
    spans
  )
}

export interface BusProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceProps {
  /**
   * Creative for the ad surfaces. Bare children fill the curb-side (+Z)
   * surface - by default the queen-size panel between the rear door and the
   * front wheel, the whole side with `coverage="full"`; name regions explicitly with `<Bus.CurbSide>`,
   * `<Bus.StreetSide>`, `<Bus.Rear>` and `<Bus.DestinationSign>`. Inside
   * `<Bus.DestinationSign>`, a string (scrolls as a marquee when it
   * overflows) or an array of strings (flips between them like a real
   * alternating sign) gets the built-in dot-matrix LED renderer - any other
   * React node renders as-is for full custom control.
   */
  children?: React.ReactNode
  /** Body paint. Transit fleets are usually white or silver. */
  color?: string
  /**
   * CSS pixel width of the virtual ad surface. Height follows its aspect;
   * the default tracks `coverage` (the ad panels' print density, or the full
   * wrap's).
   */
  resolution?: number
  /**
   * How much of the vehicle the live wraps cover.
   *
   * - `'panel'` (default) - the classic mid-panel ad rect.
   * - `'full'` - the whole side elevation and rear face, with the glass and
   *   hardware carved out of the wrap so they stay visible through it.
   * - `'perforated'` - the same full wrap, but running OVER the glass as
   *   perforated window film (the full-print fleet look). Operational glass
   *   is always carved out regardless.
   */
  coverage?: BusCoverage
}

/**
 * A procedurally built 40 ft / 12 m low-floor city transit bus (generic
 * Xcelsior/LFS/Citaro-class silhouette, no brand): a one-box shell extruded
 * from the side profile - no hood, lightly-raked two-piece windshield under
 * a dark sign fascia, flat roof - with the near-half-height window band
 * split into pillared panes, the driver's window behind the street-side
 * A-pillar, two full-glass curb-side doors, wheels set into their wells,
 * roof HVAC pod, bumpers, lamp clusters, rear grille and mirrors added on.
 * The curb side carries a live king-size (30" x 144") ad panel between the
 * wheels - or, with `coverage="full"`, the entire sides and tail become the
 * live surface, transit-wrap style - and the destination sign can be live
 * DOM too (plain strings get the built-in LED renderer). No 3D asset files
 * are loaded.
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
  // Printed straight onto the stock: whatever the content leaves clear is `color`.
  surfaceBackground = color,
  resolution,
  coverage = 'panel',
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
  // Screens occlude against OTHER registered bodies only. The shell is a
  // convex hull, so the backface culler already hides every surface the
  // body itself could cover - own-shell ray hits at oblique angles were
  // false positives that blanked a plainly visible surface (the rear wrap
  // vanishing at rear-quarter views). The shell stays registered so it
  // still occludes every other mockup in the scene.

  // The ad rects the DeviceScreens cover: the classic panels - a king
  // street-side, a queen curb-side, clear of the doors - or the whole side
  // elevation with the operational glass carved out via clip-path.
  const fullWrap = coverage !== 'panel'
  // Perforated film runs the graphic over the glass; a plain full wrap carves it out.
  const overGlass = coverage === 'perforated'
  const side = fullWrap
    ? { width: BUS_FULL_SIDE.width, height: BUS_FULL_SIDE.height, x: BUS_FULL_SIDE.x, y: BUS_FULL_SIDE.y, radius: 0 }
    : { width: ad.width, height: ad.height, x: ad.x, y: ad.y, radius: ad.radius }
  const curb = fullWrap ? side : BUS.curbAd
  const sideResolution = resolution ?? (fullWrap ? BUS.fullResolution : BUS.resolution)
  const rearSpec = fullWrap ? rearFull : rearAdSpec
  const surfaceDefaults = { surfaceBackground, surfaceStyle }
  // The curb panel prints at the street side's dpi, like the tail.
  const curbSurface = resolveSurface(regions.curbSide, {
    ...surfaceDefaults,
    resolution: Math.round(curb.width * (sideResolution / side.width)),
  })
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
      curb: `path("${buildFullSideClip(curbSurface.resolution / BUS_FULL_SIDE.width, false, overGlass)}")`,
      street: `path("${buildFullSideClip(streetSurface.resolution / BUS_FULL_SIDE.width, true, overGlass)}")`,
    }
  }, [fullWrap, curbSurface.resolution, streetSurface.resolution, overGlass])
  const rearClip = React.useMemo(() => {
    if (!fullWrap) return null
    return `path("${buildFullRearClip(rearSurface.resolution / rearFull.width, overGlass)}")`
  }, [fullWrap, rearSurface.resolution, rearFull.width, overGlass])
  const curbStyle = sideClip ? { clipPath: sideClip.curb, ...curbSurface.screenStyle } : curbSurface.screenStyle
  const streetStyle = sideClip ? { clipPath: sideClip.street, ...streetSurface.screenStyle } : streetSurface.screenStyle
  const rearStyle = rearClip ? { clipPath: rearClip, ...rearSurface.screenStyle } : rearSurface.screenStyle

  // Depth occluders for the full-coverage sides: the wrap outline as real
  // geometry with the same glass carves as the clip, so per-pixel blending
  // hides only what the livery visually covers - and the proud door
  // mirrors draw over the wrap instead of being pierced by it.
  const sideOccluderGeometries = React.useMemo(() => {
    if (!fullWrap) return null
    const margin = 0.004
    const build = (mirroredSide: boolean) => {
      const s = busProfileShape()
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
        // Door holes meet (never cross) the band hole - see doorCarveTop.
        for (const door of doors) {
          s.holes.push(
            roundedHolePath(
              door.x - door.width / 2 - margin,
              door.bottomY - margin,
              door.x + door.width / 2 + margin,
              doorCarveTop(door, overGlass, margin),
              0.034
            )
          )
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
      geometry.translate(-BUS_FULL_SIDE.x, -BUS_FULL_SIDE.y, 0)
      if (mirroredSide) geometry.scale(-1, 1, 1)
      return geometry
    }
    return { curb: build(false), street: build(true) }
  }, [fullWrap, overGlass, windowBand, doors, driverWindow])
  React.useEffect(
    () => () => {
      sideOccluderGeometries?.curb.dispose()
      sideOccluderGeometries?.street.dispose()
    },
    [sideOccluderGeometries]
  )
  // Only the full-coverage sides need a custom depth mask: their DOM is
  // clipped to the wrap outline, so the mask must carve the same glass out of
  // the silhouette - otherwise the livery's rectangle would hide the door
  // mirrors and their arms, which stand proud of it. A panel ad is a plain
  // rect, and its own silhouette already is its mask.
  const sideScreenOcclusion = (blendGeometry?: THREE.BufferGeometry) =>
    fullWrap ? { occluderGeometry: blendGeometry } : {}

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
      // deep across the width, shallow in-plane: a soft rolled roofline and
      // corner posts, while the profile stays within ~45 mm of nominal so
      // the glass band and lamps placed on it stay visible
      bevelThickness: body.bevel,
      bevelSize: SHELL_BEVEL_SIZE,
      bevelSegments: 4,
      curveSegments: 24,
    })
    geometry.translate(0, 0, -depth / 2)
    return geometry
  }, [body, skirtY, wheels, profile])

  // The front band - windshield base up through the sign fascia - as a local
  // frame: origin on the profile segment's midpoint, +x its outward normal,
  // +y up the rake, +z across the bus.
  const front = React.useMemo(() => {
    const dx = profile.signBandTopX - profile.noseX
    const dy = profile.signBandTopY - profile.windshieldBaseY
    const length = Math.hypot(dx, dy)
    return {
      tilt: Math.atan2(-dx / length, dy / length),
      length,
      mid: [(profile.noseX + profile.signBandTopX) / 2, (profile.windshieldBaseY + profile.signBandTopY) / 2] as const,
    }
  }, [profile])

  // The wheel-well ceiling: a half-pipe over each axle, seen through the
  // arch as the dark curved roof of the well instead of the bus's far side.
  const wellGeometry = React.useMemo(() => {
    const r = wheels.archRadius - 0.008
    const geometry = new THREE.CylinderGeometry(r, r, body.width - 0.06, 24, 1, true, Math.PI / 2, Math.PI)
    geometry.rotateX(Math.PI / 2)
    return geometry
  }, [wheels, body])

  React.useEffect(
    () => () => {
      shellGeometry.dispose()
      wellGeometry.dispose()
    },
    [shellGeometry, wellGeometry]
  )

  // Automotive laminate: a near-black dielectric with a mirror-smooth
  // surface, so the studio panels read as reflections instead of grey plastic.
  const glassMaterial = (
    <meshPhysicalMaterial
      color="#080c13"
      metalness={0}
      roughness={0.05}
      clearcoat={1}
      clearcoatRoughness={0.03}
      envMapIntensity={1.8}
    />
  )
  // Satin-black hardware (bumpers, mirrors), the flatter black of window
  // pillars and frames, and the dead-matte rubber of gaskets and seals.
  const trimMaterial = <meshPhysicalMaterial color="#1e2126" metalness={0.1} roughness={0.72} />
  const frameMaterial = <meshPhysicalMaterial color="#0f1114" metalness={0.05} roughness={0.85} />
  const rubberMaterial = <meshPhysicalMaterial color="#0a0b0d" metalness={0} roughness={0.95} />
  const bezelMaterial = <meshPhysicalMaterial color="#c9ced6" metalness={0.9} roughness={0.25} envMapIntensity={1.2} />
  const amberLamp = (
    <meshPhysicalMaterial color="#f2a33c" emissive="#ffb340" emissiveIntensity={0.4} roughness={0.25} clearcoat={1} />
  )
  const redLamp = (
    <meshPhysicalMaterial color="#8c1524" emissive="#c11a30" emissiveIntensity={0.4} roughness={0.25} clearcoat={1} />
  )
  const wellMaterial = <meshPhysicalMaterial color="#0c0d10" metalness={0} roughness={1} side={THREE.DoubleSide} />

  const hw = body.width / 2
  const lift = SHELL_BEVEL_SIZE
  // Where the walls actually are, bevel included - fittings hang off these.
  const noseFace = profile.noseX + lift
  const tailFace = profile.tailX - lift
  const roofTop = profile.roofY + lift
  const bandBottom = windowBand.y - windowBand.height / 2
  const doorTopY = windowBand.y + windowBand.height / 2
  // tires sit ~95 mm inside the body side, so the arch reads as a well
  const tireFaceZ = hw - 0.05
  const dualOuterZ = tireFaceZ - wheels.dualWidth / 2
  const dualInnerZ = dualOuterZ - wheels.dualWidth - wheels.dualGap
  // The rear wrap plane hugs the tail wall by 20 mm; every tail fitting but
  // the lamps (carved out individually) stays inside that. The rear window
  // is the exception when a full wrap carves around it: the wrap's depth
  // mask erases everything behind its plane, carve or no carve, so the
  // glass steps just proud of the plane to show through the hole - and
  // drops back behind it when perforated film runs over the window.
  const rearPlaneX = tailFace - 0.02
  const rearGlassCarved = fullWrap && !overGlass && regions.rear != null
  const rearGlassX = rearGlassCarved ? rearPlaneX - 0.004 : tailFace + 0.014

  // Windshield: curved in plan like the references - a slice of a 5-unit
  // cylinder bulging ~35 mm at the centre mullion - flat in elevation. Its
  // top stops under the destination sign, leaving the fascia as its frame.
  const glassW = body.width - 0.2
  const glassRc = 5
  const glassHalfAngle = Math.asin(glassW / 2 / glassRc)
  const fasciaX = lift + 0.004
  const glassEdgeX = fasciaX + 0.008
  const glassApexX = glassEdgeX + glassRc * (1 - Math.cos(glassHalfAngle))
  const signY = destination.y - front.mid[1]
  const glassBottom = -front.length / 2 + 0.04
  const glassTop = signY - destination.height / 2 - 0.014
  const glassH = glassTop - glassBottom
  const glassCy = (glassBottom + glassTop) / 2
  /** Local x of the glass surface at across-bus offset `z`, and its tangent rotation. */
  const onGlass = (z: number) => {
    const theta = Math.asin(z / glassRc)
    return { x: glassApexX - glassRc * (1 - Math.cos(theta)), rotY: -theta }
  }

  // Skirt-panel seam: the shut line where the lower skirts meet the body
  // side, broken at the arches (and, curb side, the doors) like the panels
  // it stands for. It sits a hair BEHIND the wrap plane, so a livery covers
  // it exactly like vinyl over a body seam.
  const seamY = -0.605
  const seamSpans: [number, number][] = [
    [profile.tailX + 0.14, wheels.rearX - wheels.archRadius - 0.03],
    [wheels.rearX + wheels.archRadius + 0.03, wheels.frontX - wheels.archRadius - 0.03],
    [wheels.frontX + wheels.archRadius + 0.03, profile.noseX - 0.14],
  ]
  const doorSpans: [number, number][] = doors.map(({ x, width }) => [x - width / 2, x + width / 2])

  return (
    <group {...groupProps}>
      {/* painted shell. Automotive paint is a dielectric base under a clear
          lacquer - half-metal desaturates the body into dull sheet and kills
          the wet highlight the clearcoat is there to provide. */}
      <mesh geometry={shellGeometry}>
        <meshPhysicalMaterial
          color={color}
          metalness={0.08}
          roughness={0.42}
          clearcoat={1}
          clearcoatRoughness={0.06}
          envMapIntensity={1.1}
        />
      </mesh>

      {/* front: matte fascia framing the whole band, the curved two-piece
          windshield with its centre mullion and parked wipers, the glossy
          destination-sign window in the fascia above, and the route-number
          box behind the curb-side corner of the glass */}
      <group position={[front.mid[0], front.mid[1], 0]} rotation-z={front.tilt}>
        <mesh position-x={fasciaX} rotation-y={Math.PI / 2}>
          <planeGeometry args={[body.width - 0.09, front.length - 0.02]} />
          {frameMaterial}
        </mesh>
        <mesh position={[glassApexX - glassRc, glassCy, 0]} rotation-y={Math.PI / 2}>
          <cylinderGeometry args={[glassRc, glassRc, glassH, 24, 1, true, -glassHalfAngle, glassHalfAngle * 2]} />
          {glassMaterial}
        </mesh>
        <mesh position={[glassApexX + 0.002, glassCy, 0]}>
          <boxGeometry args={[0.024, glassH - 0.01, 0.03]} />
          {frameMaterial}
        </mesh>
        {/* pantograph wipers parked along the base, blades tangent to the
            curve - the give-away cue of a working cab. Charcoal, not black:
            on black glass a black blade is a hairline, a charcoal one a wiper. */}
        {[0.27, -0.27].map((z) => {
          const at = onGlass(z)
          return (
            <group key={z} position={[at.x + 0.009, glassBottom + 0.06, z]} rotation-y={at.rotY}>
              <mesh rotation-x={-0.12}>
                <boxGeometry args={[0.014, 0.03, 0.46]} />
                <meshPhysicalMaterial color="#2b2e34" metalness={0.3} roughness={0.6} />
              </mesh>
            </group>
          )
        })}
        {/* route-number box behind the curb-side corner of the glass, above
            the wipers' parked line, with the faint warmth of its LEDs */}
        {(() => {
          const at = onGlass(0.36)
          return (
            <RoundedBox
              args={[0.01, 0.11, 0.24]}
              radius={0.004}
              smoothness={1} bevelSegments={1}
              position={[at.x + 0.006, glassBottom + 0.19, 0.36]}
              rotation-y={at.rotY}
            >
              <meshPhysicalMaterial color="#101215" emissive="#ffb340" emissiveIntensity={0.05} roughness={0.3} clearcoat={1} />
            </RoundedBox>
          )
        })()}
        {/* (RoundedBox radii stay under half the thinnest dimension: drei
            builds the box from a (w-2r) x (h-2r) shape plus an r bevel, and a
            radius past that inverts the shape and overshoots the box - the
            rear grille's edges once poked through the wrap plane that way.) */}
        <RoundedBox
          args={[0.012, destination.height + 0.028, destination.width + 0.04]}
          radius={0.005}
          smoothness={2} bevelSegments={1}
          position={[glassEdgeX, signY, 0]}
        >
          <meshPhysicalMaterial color="#0a0a08" metalness={0.2} roughness={0.3} clearcoat={1} />
        </RoundedBox>

        {/* live LED destination sign inside the fascia */}
        {signSlot != null && (
          <DeviceScreen
            width={destination.width}
            height={destination.height}
            radius={destination.radius}
            {...resolveSurface(signSlot, {
              ...surfaceDefaults,
              surfaceBackground: '#0a0a08',
              resolution: destination.resolution,
            })}
            position={[glassEdgeX + 0.012, signY, 0]}
            rotation={[0, Math.PI / 2, 0]}
          >
            {sign}
          </DeviceScreen>
        )}
      </group>

      {/* passenger window band, both sides: a matte frame run behind glossy
          panes set apart by pillars, each pane with the rail of its upper
          sliding sash. A full wrap covering the glass (perforated film)
          hides its side's band; with the wrap under the glass the band
          stays, showing through the window carve-out. */}
      {([1, -1] as const).map((s) => {
        const wrapped = fullWrap && overGlass && (s === 1 ? regions.curbSide != null : regions.streetSide != null)
        if (wrapped) return null
        const sections = bandSections(s === 1)
        return (
          <group key={s} position-z={s * hw}>
            {sections.map(([a, b]) => (
              <RoundedBox
                key={a}
                args={[b - a, windowBand.height, 0.03]}
                radius={0.012}
                smoothness={2} bevelSegments={1}
                position={[(a + b) / 2, windowBand.y, s * -0.008]}
              >
                {frameMaterial}
              </RoundedBox>
            ))}
            {bandPanes(sections).map(({ x0, x1 }) => (
              <group key={x0} position={[(x0 + x1) / 2, windowBand.y, s * 0.006]}>
                <mesh>
                  <boxGeometry args={[x1 - x0 - PILLAR, windowBand.height - GASKET * 2, 0.02]} />
                  {glassMaterial}
                </mesh>
                <mesh position={[0, windowBand.height * 0.18, s * 0.012]}>
                  <boxGeometry args={[x1 - x0 - PILLAR, 0.014, 0.006]} />
                  {frameMaterial}
                </mesh>
              </group>
            ))}
          </group>
        )
      })}

      {/* driver's window behind the street-side A-pillar: framed glass with
          the sliding sash's divider and rail - always clear (it is carved
          out of a full wrap; vinyl never covers the driver's view) */}
      <group position={[driverWindow.x, driverWindow.y, -hw]}>
        <RoundedBox args={[driverWindow.width, driverWindow.height, 0.03]} radius={0.012} smoothness={2} bevelSegments={1} position-z={0.008}>
          {frameMaterial}
        </RoundedBox>
        <mesh position-z={-0.006}>
          <boxGeometry args={[driverWindow.width - 0.044, driverWindow.height - 0.044, 0.02]} />
          {glassMaterial}
        </mesh>
        <mesh position-z={-0.012}>
          <boxGeometry args={[0.018, driverWindow.height - 0.044, 0.006]} />
          {frameMaterial}
        </mesh>
        <mesh position={[0, driverWindow.height * 0.18, -0.012]}>
          <boxGeometry args={[driverWindow.width - 0.044, 0.014, 0.006]} />
          {frameMaterial}
        </mesh>
      </group>

      {/* curb-side doors: two full-glass leaves in a matte frame, dropping to
          the low-floor entry, the leaf-edge rubber seals meeting proud at the
          centre and the band's sill rail carried across the glass. The frame
          stands proud of the ad plane: a full wrap's rect runs across both
          doors, and hardware over the vinyl reads as an installer's
          cut-around, where vinyl over the door frame reads as a mistake. */}
      {doors.map(({ x, width, bottomY }) => {
        const h = doorTopY - bottomY
        const cy = (doorTopY + bottomY) / 2
        return (
          <group key={x} position={[x, cy, hw]}>
            <RoundedBox args={[width, h, 0.03]} radius={0.012} smoothness={2} bevelSegments={1} position-z={-0.003}>
              {frameMaterial}
            </RoundedBox>
            {[-1, 1].map((leaf) => (
              <mesh key={leaf} position={[(leaf * width) / 4, 0, 0.006]}>
                <boxGeometry args={[width / 2 - 0.045, h - 0.05, 0.02]} />
                {glassMaterial}
              </mesh>
            ))}
            <mesh position-z={0.02}>
              <boxGeometry args={[0.024, h - 0.04, 0.014]} />
              {rubberMaterial}
            </mesh>
            <mesh position={[0, bandBottom - cy, 0.018]}>
              <boxGeometry args={[width - 0.06, 0.03, 0.008]} />
              {frameMaterial}
            </mesh>
          </group>
        )
      })}

      {/* skirt-panel seams, both sides */}
      {([1, -1] as const).map((s) =>
        subtractSpans(seamSpans, s === 1 ? doorSpans : [], 0.02).map(([a, b]) => (
          <mesh key={`${s}${a}`} position={[(a + b) / 2, seamY, s * (hw - 0.002)]}>
            <boxGeometry args={[b - a, 0.008, 0.012]} />
            <meshPhysicalMaterial color="#15171b" metalness={0.2} roughness={0.8} />
          </mesh>
        ))
      )}

      {/* side marker lamps on the skirt corners - amber ahead, red behind -
          proud of the wrap plane, so a livery reads cut around them */}
      {([1, -1] as const).map((s) => (
        <group key={s}>
          <mesh position={[3.11, -0.5, s * (hw + 0.006)]}>
            <boxGeometry args={[0.09, 0.035, 0.016]} />
            {amberLamp}
          </mesh>
          <mesh position={[-3.09, -0.5, s * (hw + 0.006)]}>
            <boxGeometry args={[0.09, 0.035, 0.016]} />
            {redLamp}
          </mesh>
        </group>
      ))}

      {/* roof: a low vented HVAC pod over the rear half - louvred condenser
          intakes down both flanks, twin fan grilles on top - the roof-edge
          trim lines that read as the cap's seam, and a GPS puck */}
      <group position={[hvac.x, roofTop - 0.01 + hvac.height / 2, 0]}>
        <RoundedBox args={[hvac.length, hvac.height, hvac.width]} radius={0.03} smoothness={3} bevelSegments={2}>
          <meshPhysicalMaterial color={color} metalness={0.1} roughness={0.5} clearcoat={0.6} />
        </RoundedBox>
        {([1, -1] as const).map((s) => (
          <group key={s} position-z={s * (hvac.width / 2 - 0.002)}>
            <RoundedBox args={[hvac.length - 0.3, hvac.height - 0.05, 0.016]} radius={0.006} smoothness={1} bevelSegments={1}>
              {frameMaterial}
            </RoundedBox>
            {[-0.02, 0, 0.02].map((y) => (
              <mesh key={y} position={[0, y, s * 0.006]}>
                <boxGeometry args={[hvac.length - 0.34, 0.006, 0.006]} />
                <meshPhysicalMaterial color="#3a3e45" metalness={0.4} roughness={0.5} />
              </mesh>
            ))}
          </group>
        ))}
        {[-0.4, 0.4].map((x) => (
          <group key={x} position={[x, hvac.height / 2, 0]}>
            <mesh position-y={0.004}>
              <cylinderGeometry args={[0.17, 0.17, 0.012, 24]} />
              {frameMaterial}
            </mesh>
            <mesh position-y={0.01} rotation-x={Math.PI / 2}>
              <torusGeometry args={[0.16, 0.006, 6, 24]} />
              <meshPhysicalMaterial color="#3a3e45" metalness={0.4} roughness={0.5} />
            </mesh>
          </group>
        ))}
      </group>
      {([1, -1] as const).map((s) => (
        <mesh key={s} position={[0, roofTop + 0.004, s * (hw - 0.0615)]}>
          <boxGeometry args={[body.length - 0.5, 0.012, 0.03]} />
          <meshPhysicalMaterial color="#2a2d33" metalness={0.2} roughness={0.7} />
        </mesh>
      ))}
      <group position={[1.5, roofTop, -0.3]}>
        <mesh position-y={0.015}>
          <cylinderGeometry args={[0.035, 0.04, 0.03, 12]} />
          {trimMaterial}
        </mesh>
        <mesh position-y={0.1}>
          <cylinderGeometry args={[0.006, 0.008, 0.14, 8]} />
          {trimMaterial}
        </mesh>
      </group>

      {/* running gear: each well is a dark half-pipe ceiling over a dark
          centre block (so the arch shows the well's roof and back, never the
          far side), the axle tying its wheel pair together, and an underbody
          pan closing the gap between the skirts */}
      {([wheels.frontX, wheels.rearX] as const).map((x) => (
        <group key={x}>
          <mesh geometry={wellGeometry} position={[x, wheels.archY, 0]}>
            {wellMaterial}
          </mesh>
          <mesh position={[x, (skirtY + wheels.archY + wheels.archRadius + 0.02) / 2, 0]}>
            <boxGeometry args={[wheels.archRadius * 2 - 0.05, wheels.archY + wheels.archRadius + 0.02 - skirtY, 0.5]} />
            <meshPhysicalMaterial color="#0c0d10" metalness={0} roughness={1} />
          </mesh>
          <mesh rotation-x={Math.PI / 2} position={[x, wheels.centerY, 0]}>
            <cylinderGeometry args={[0.05, 0.05, body.width - 0.3, 12]} />
            <meshPhysicalMaterial color="#191b1f" metalness={0.5} roughness={0.7} />
          </mesh>
        </group>
      ))}
      {/* drive-axle differential housing */}
      <mesh rotation-x={Math.PI / 2} position={[wheels.rearX, wheels.centerY, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.22, 16]} />
        <meshPhysicalMaterial color="#191b1f" metalness={0.5} roughness={0.7} />
      </mesh>
      <mesh position={[0, skirtY - 0.06, 0]}>
        <boxGeometry args={[body.length - 0.7, 0.12, body.width - 0.36]} />
        <meshPhysicalMaterial color="#0d0e11" metalness={0.1} roughness={0.95} />
      </mesh>

      {/* wheels: single steer tires up front, duals on the drive axle, set
          into the wells. The shared road wheel lathes a real tire carcass -
          bulged sidewalls, rounded shoulders, grooved tread - on a dished
          ten-lug rim; the 22.5" rim leaves the deep sidewall of a bus tire. */}
      {([1, -1] as const).map((side) => (
        <RoadWheel
          key={side}
          radius={wheels.radius}
          width={wheels.width}
          face={side}
          lugs={10}
          rimRatio={0.55}
          position={[wheels.frontX, wheels.centerY, side * (tireFaceZ - wheels.width / 2)]}
        />
      ))}
      {/* the inner tire of each dual pair shows only its tread, so it keeps a
          plain dark rim face rather than a second set of polished hardware */}
      {([1, -1] as const).map((side) => (
        <React.Fragment key={side}>
          <RoadWheel
            radius={wheels.radius}
            width={wheels.dualWidth}
            face={side}
            lugs={10}
            rimRatio={0.55}
            position={[wheels.rearX, wheels.centerY, side * dualOuterZ]}
          />
          <RoadWheel
            radius={wheels.radius}
            width={wheels.dualWidth}
            face={side}
            lugs={10}
            rimRatio={0.55}
            rimColor="#3c4046"
            position={[wheels.rearX, wheels.centerY, side * dualInnerZ]}
          />
        </React.Fragment>
      ))}

      {/* front bumper: a deep lower bar with its rub strip and a stepped-back
          upper bar, wrapping the corners */}
      <RoundedBox args={[0.12, 0.11, body.width + 0.04]} radius={0.04} smoothness={3} bevelSegments={2} position={[noseFace + 0.016, -0.62, 0]}>
        {trimMaterial}
      </RoundedBox>
      <mesh position={[noseFace + 0.078, -0.62, 0]}>
        <boxGeometry args={[0.008, 0.03, body.width - 0.1]} />
        {rubberMaterial}
      </mesh>
      <RoundedBox args={[0.08, 0.06, body.width + 0.02]} radius={0.025} smoothness={2} bevelSegments={1} position={[noseFace + 0.006, -0.535, 0]}>
        {trimMaterial}
      </RoundedBox>

      {/* headlamp clusters between bumper and windshield: a black housing
          holding twin projector lenses in bright bezels, with the amber turn
          signal strip along its foot */}
      {([1, -1] as const).map((side) => (
        <group key={side} position={[noseFace, -0.43, side * 0.42]}>
          <RoundedBox args={[0.04, 0.17, 0.4]} radius={0.015} smoothness={2} bevelSegments={1} position-x={0.006}>
            {frameMaterial}
          </RoundedBox>
          {[-0.09, 0.09].map((dz) => (
            <group key={dz} position={[0.028, 0.03, dz]}>
              <mesh rotation-z={Math.PI / 2}>
                <cylinderGeometry args={[0.05, 0.05, 0.02, 20]} />
                <meshPhysicalMaterial
                  color="#e8edf4"
                  emissive="#dfe9f5"
                  emissiveIntensity={0.25}
                  metalness={0.3}
                  roughness={0.2}
                  clearcoat={1}
                />
              </mesh>
              <mesh position-x={0.012} rotation-z={Math.PI / 2}>
                <cylinderGeometry args={[0.022, 0.022, 0.006, 16]} />
                <meshPhysicalMaterial color="#2a2f38" metalness={0.6} roughness={0.3} />
              </mesh>
              <mesh position-x={0.008} rotation-y={Math.PI / 2}>
                <torusGeometry args={[0.052, 0.005, 6, 24]} />
                {bezelMaterial}
              </mesh>
            </group>
          ))}
          <mesh position={[0.026, -0.06, 0]}>
            <boxGeometry args={[0.016, 0.03, 0.34]} />
            {amberLamp}
          </mesh>
        </group>
      ))}

      {/* rear: framed window above the engine bay, route-sign box near the
          roof, the engine hatch outlined by its shut lines with the slatted
          cooling grille in it, stacked round lamps - brake and tail in red,
          turn signal in amber - in a housing at each corner, and the bumper */}
      <RoundedBox
        args={[0.03, rearWindow.height + 0.05, rearWindow.width + 0.05]}
        radius={0.012}
        smoothness={2} bevelSegments={1}
        position={[tailFace + 0.008, rearWindow.y, 0]}
      >
        {frameMaterial}
      </RoundedBox>
      <RoundedBox
        args={[0.05, rearWindow.height, rearWindow.width]}
        radius={0.02}
        smoothness={2} bevelSegments={1}
        position={[rearGlassX, rearWindow.y, 0]}
      >
        {glassMaterial}
      </RoundedBox>
      <RoundedBox args={[0.03, 0.1, 0.5]} radius={0.012} smoothness={2} bevelSegments={1} position={[tailFace + 0.009, 0.77, 0]}>
        <meshPhysicalMaterial color="#0a0a08" metalness={0.2} roughness={0.3} clearcoat={1} />
      </RoundedBox>
      {/* hatch shut lines: a hair proud of the wall, well inside the wrap plane */}
      {([1, -1] as const).map((side) => (
        <mesh key={side} position={[tailFace + 0.001, -0.085, side * 0.61]}>
          <boxGeometry args={[0.006, 0.67, 0.008]} />
          <meshPhysicalMaterial color="#15171b" metalness={0.2} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[tailFace + 0.001, 0.255, 0]}>
        <boxGeometry args={[0.006, 0.008, 1.228]} />
        <meshPhysicalMaterial color="#15171b" metalness={0.2} roughness={0.8} />
      </mesh>
      <RoundedBox args={[0.03, 0.24, 0.92]} radius={0.012} smoothness={2} bevelSegments={1} position={[tailFace + 0.009, 0.05, 0]}>
        <meshPhysicalMaterial color="#111317" metalness={0.3} roughness={0.65} />
      </RoundedBox>
      {[-0.08, -0.04, 0, 0.04, 0.08].map((dy) => (
        <mesh key={dy} position={[tailFace + 0.006, 0.05 + dy, 0]}>
          <boxGeometry args={[0.03, 0.022, 0.86]} />
          <meshPhysicalMaterial color="#3a3e45" metalness={0.5} roughness={0.45} />
        </mesh>
      ))}
      {([1, -1] as const).map((side) => (
        <group key={side} position={[tailFace, 0, side * 0.56]}>
          <RoundedBox args={[0.016, 0.44, 0.14]} radius={0.007} smoothness={2} bevelSegments={1} position={[0.002, 0.16, 0]}>
            {frameMaterial}
          </RoundedBox>
          {(
            [
              { y: 0.3, lamp: redLamp },
              { y: 0.16, lamp: redLamp },
              { y: 0.02, lamp: amberLamp },
            ] as const
          ).map(({ y, lamp }) => (
            // Lens pucks rooted in the housing, ending ~20 mm proud of the
            // full-wrap plane - through the carved holes the lamps read
            // mounted ON the livery without jutting like knobs.
            <group key={y} position-y={y}>
              <mesh rotation-z={Math.PI / 2} position-x={-0.016}>
                <cylinderGeometry args={[0.045, 0.045, 0.05, 20]} />
                {lamp}
              </mesh>
              <mesh position-x={-0.036} rotation-y={Math.PI / 2}>
                <torusGeometry args={[0.047, 0.004, 6, 24]} />
                {bezelMaterial}
              </mesh>
            </group>
          ))}
        </group>
      ))}
      <RoundedBox args={[0.12, 0.16, body.width + 0.04]} radius={0.04} smoothness={3} bevelSegments={2} position={[tailFace - 0.016, -0.54, 0]}>
        {trimMaterial}
      </RoundedBox>

      {/* door mirrors on swan-neck arms: a pad on the A-pillar, the arm
          reaching forward and out, then the drop to a tall head hung ~450 mm
          ahead of the windshield at its mid-height, transit style - the
          glass facing the driver */}
      {([1, -1] as const).map((side) => (
        <group key={side}>
          <RoundedBox args={[0.09, 0.07, 0.03]} radius={0.01} smoothness={1} bevelSegments={1} position={[3.13, 0.46, side * (hw + 0.008)]}>
            {trimMaterial}
          </RoundedBox>
          <mesh position={[3.275, 0.46, side * (hw + 0.085)]} rotation-y={-side * Math.atan2(0.13, 0.27)}>
            <boxGeometry args={[0.3, 0.028, 0.028]} />
            {trimMaterial}
          </mesh>
          <mesh position={[3.41, 0.31, side * (hw + 0.15)]}>
            <boxGeometry args={[0.028, 0.3, 0.028]} />
            {trimMaterial}
          </mesh>
          <group position={[3.41, 0.05, side * (hw + 0.15)]} rotation-y={side * 0.12}>
            <RoundedBox args={[0.07, 0.3, 0.16]} radius={0.03} smoothness={2} bevelSegments={1}>
              {trimMaterial}
            </RoundedBox>
            <mesh position-x={-0.036}>
              <boxGeometry args={[0.006, 0.25, 0.12]} />
              {glassMaterial}
            </mesh>
          </group>
        </group>
      ))}

      {/* marker lights along the roofline: five amber across the front
          dome, five red across the tail corner, each seated on its curve */}
      {[-0.44, -0.22, 0, 0.22, 0.44].map((z) => (
        <React.Fragment key={z}>
          <RoundedBox args={[0.05, 0.03, 0.09]} radius={0.01} smoothness={1} bevelSegments={1} position={[2.998, 0.834, z]} rotation-z={-0.49}>
            {amberLamp}
          </RoundedBox>
          <RoundedBox args={[0.05, 0.03, 0.09]} radius={0.01} smoothness={1} bevelSegments={1} position={[-3.197, 0.85, z]} rotation-z={0.675}>
            {redLamp}
          </RoundedBox>
        </React.Fragment>
      ))}

      {/* the live ads: a queen curb-side and a king street-side (or full
          transit wraps on both), tail ad (or full tail wrap) on the rear */}
      <DeviceScreen
        width={curb.width}
        height={curb.height}
        radius={curb.radius}
        {...curbSurface}
        position={[curb.x, curb.y, hw + 0.008]}
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
          position={[side.x, side.y, -hw - 0.008]}
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
          position={[rearPlaneX, rearSpec.y, 0]}
          rotation={[0, -Math.PI / 2, 0]}
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
