import * as React from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { VAN, VAN_REGIONS, clipRoundedRect, clipRoundedRectOutline } from '@area-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { useScreenOccluders } from '../../screen/occluders'
import { collectSlots, createSlots, resolveSurface, type SurfaceDefaults } from '../../slots'

type GroupProps = ThreeElements['group']

/**
 * Full-coverage side wrap: the whole flat side elevation, rockers to
 * roofline, tail to nose. The extruded shell makes the entire side face
 * coplanar, so one DOM plane can cover it; the outline and the hardware
 * cutouts below are carved out of that plane with a CSS `clip-path`.
 */
const FULL_WRAP = {
  width: VAN.profile.noseX - VAN.profile.tailX,
  height: VAN.profile.roofY - VAN.rockerY,
  x: (VAN.profile.noseX + VAN.profile.tailX) / 2,
  y: (VAN.profile.roofY + VAN.rockerY) / 2,
} as const

/** Default CSS px width of the full-side wrap — same dpi as the panel wrap. */
const FULL_WRAP_RESOLUTION = Math.round(VAN.resolution * (FULL_WRAP.width / VAN.wrap.width))

/**
 * Cab door, in world units on the side elevation — proportioned from
 * ProMaster/Sprinter-class references: the shut line runs up the vertical
 * B-pillar edge, across a flat top just under the roof rail, down a front
 * edge raked parallel to the A-pillar to the beltline, then near-vertical
 * to the wheel arch. The door glass repeats the same raked front with a
 * flat top and a vertical rear edge. Seams are a real door gap (~5 mm),
 * not the chunky bars of a cartoon.
 */
const SEAM_RAKE = 0.486 // dx per unit dy of the windshield slope
/** Raked front seam above the beltline, parallel to the A-pillar. */
const RAKED_SEAM = { bottomX: 2.06, bottomY: 0.245, topY: 0.8825, half: 0.0025 } as const
const rakedSeamX = (y: number) => RAKED_SEAM.bottomX - SEAM_RAKE * (y - RAKED_SEAM.bottomY)
/** Door glass frame: raked front, flat top, vertical rear (world coords). */
const DOOR_GLASS = { rearX: 1.09, frontX: 2.03, bottomY: 0.26, topY: 0.8 } as const

/**
 * The shell's side profile as a THREE shape — shared by the extruded body
 * and the full wrap's depth occluder, so per-pixel blending hides exactly
 * what the wrap's clip covers and nothing more (wheels in the arches and
 * carved glass stay visible; proud hardware draws over the livery).
 */
function vanProfileShape(): THREE.Shape {
  const { rockerY, wheels, profile } = VAN
  const { noseX, tailX, bumperTopY, hoodX, hoodY, cowlX, cowlY, windshieldTopX, windshieldTopY, roofStartX, roofY } = profile
  const arch = wheels.archRadius
  const s = new THREE.Shape()
  // counterclockwise from the rear rocker, arcs cut the wheel arches
  s.moveTo(tailX + 0.06, rockerY)
  s.lineTo(wheels.rearX - arch, rockerY)
  s.absarc(wheels.rearX, rockerY, arch, Math.PI, 0, true)
  s.lineTo(wheels.frontX - arch, rockerY)
  s.absarc(wheels.frontX, rockerY, arch, Math.PI, 0, true)
  s.lineTo(noseX - 0.09, rockerY)
  s.quadraticCurveTo(noseX, rockerY, noseX, rockerY + 0.09)
  s.lineTo(noseX, bumperTopY)
  // clamshell hood: short nose face up to the near-horizontal hood top,
  // back to the cowl crease where the windshield starts
  s.lineTo(hoodX, hoodY)
  s.lineTo(cowlX, cowlY)
  // raked windshield to the header, then the high-roof cap ramps back
  s.lineTo(windshieldTopX, windshieldTopY)
  s.quadraticCurveTo(windshieldTopX - 0.12, roofY, roofStartX, roofY)
  s.lineTo(tailX + 0.09, roofY)
  s.quadraticCurveTo(tailX, roofY, tailX, roofY - 0.09)
  s.lineTo(tailX, rockerY + 0.06)
  s.quadraticCurveTo(tailX, rockerY, tailX + 0.06, rockerY)
  return s
}

/**
 * Axis-aligned shut-line slits (the raked front segment above the beltline
 * is `RAKED_SEAM`). Every full wrap carves these — a real crevice is a GAP
 * the film tucks into, never a ridge over it — and the blending occluder
 * opens matching holes so the recessed seam meshes show through. Edges
 * meet exactly but never cross each other or the glass carve: overlapping
 * holes cancel back to filled under the nonzero rule.
 */
const DOOR_SEAMS = [
  // B-pillar edge, sill to door top
  { minX: 1.0275, maxX: 1.0325, minY: -0.86, maxY: 0.8775 },
  // door top, under the roof rail, corner-meeting the raked front seam
  { minX: 1.0275, maxX: 1.7477, minY: 0.8775, maxY: 0.8825 },
  // front edge below the beltline, stopped above the wheel arch (y −0.47)
  { minX: 2.0575, maxX: 2.0625, minY: -0.47, maxY: 0.245 },
  // sill seam, clear of the B-slit and the arch's front edge (x 1.467)
  { minX: 1.042, maxX: 1.462, minY: -0.8595, maxY: -0.8545 },
] as const

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
 * The cab door glass as a THREE shape (world coords, counterclockwise):
 * raked front edge parallel to the A-pillar, flat top under the roof rail,
 * vertical rear edge — rounded corners. Shared by the glass mesh, the
 * blending occluder's hole and (reverse-traced) the wrap clip.
 */
function doorGlassShape(): THREE.Shape {
  const { rearX, frontX, bottomY, topY } = DOOR_GLASS
  const ftX = frontX - SEAM_RAKE * (topY - bottomY)
  const len = Math.hypot(ftX - frontX, topY - bottomY)
  const ux = (ftX - frontX) / len
  const uy = (topY - bottomY) / len
  const rB = 0.03
  const rT = 0.05
  const s = new THREE.Shape()
  s.moveTo(rearX + rB, bottomY)
  s.lineTo(frontX - rB, bottomY)
  s.quadraticCurveTo(frontX, bottomY, frontX + ux * rB, bottomY + uy * rB)
  s.lineTo(ftX - ux * rT, topY - uy * rT)
  s.quadraticCurveTo(ftX, topY, ftX - rT, topY)
  s.lineTo(rearX + rT, topY)
  s.quadraticCurveTo(rearX, topY, rearX, topY - rT)
  s.lineTo(rearX, bottomY + rB)
  s.quadraticCurveTo(rearX, bottomY, rearX + rB, bottomY)
  s.closePath()
  return s
}

/**
 * SVG path (CSS px, y-down) clipping the full-coverage wrap: the shell's own
 * side profile — including the wheel-arch arcs — as the outer boundary, with
 * the hardware cutouts as opposite-winding holes. `mirrored` builds the
 * street-side (−Z) variant, whose CSS x axis runs nose→tail; mirroring also
 * flips every arc's sweep flag so the geometry stays identical.
 */
function buildFullWrapClip(pxPerUnit: number, mirrored: boolean, overWindows: boolean): string {
  const { rockerY, wheels, profile } = VAN
  // Keep the wrap just inside the shell's beveled edge.
  const inset = 0.01
  const X = (x: number) => ((mirrored ? profile.noseX - x : x - profile.tailX) * pxPerUnit).toFixed(1)
  const Y = (y: number) => ((profile.roofY - y) * pxPerUnit).toFixed(1)
  const P = (x: number, y: number) => `${X(x)} ${Y(y)}`
  const R = (u: number) => (u * pxPerUnit).toFixed(1)
  // One sweep flag serves the whole trace (see core's clip-path helper); the
  // street-side mirror flips orientation, and the flag with it.
  const sweep = mirrored ? 0 : 1

  const bottom = rockerY + inset
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
    `L ${P(nose - 0.09, bottom)} Q ${P(nose, bottom)} ${P(nose, bottom + 0.09)} ` +
    `L ${P(nose, profile.bumperTopY)} ` +
    `L ${P(profile.hoodX - inset, profile.hoodY - inset)} ` +
    `L ${P(profile.cowlX - inset, profile.cowlY)} ` +
    `L ${P(profile.windshieldTopX - inset, profile.windshieldTopY)} ` +
    `Q ${P(profile.windshieldTopX - inset - 0.12, top)} ${P(profile.roofStartX, top)} ` +
    `L ${P(tail + 0.09, top)} Q ${P(tail, top)} ${P(tail, top - 0.09)} ` +
    `L ${P(tail, bottom + 0.06)} Q ${P(tail, bottom)} ${P(tail + 0.06, bottom)} Z `

  // Door glass, traced world-clockwise (reverse of the mesh shape): raked
  // front parallel to the A-pillar, flat top, vertical rear edge.
  const { rearX, frontX, bottomY: gB, topY: gT } = DOOR_GLASS
  const ftX = frontX - SEAM_RAKE * (gT - gB)
  const gLen = Math.hypot(ftX - frontX, gT - gB)
  const gUx = (ftX - frontX) / gLen
  const gUy = (gT - gB) / gLen
  const rB2 = 0.03
  const rT2 = 0.05
  const glass =
    `M ${P(rearX + rB2, gB)} Q ${P(rearX, gB)} ${P(rearX, gB + rB2)} ` +
    `L ${P(rearX, gT - rT2)} Q ${P(rearX, gT)} ${P(rearX + rT2, gT)} ` +
    `L ${P(ftX - rT2, gT)} Q ${P(ftX, gT)} ${P(ftX - gUx * rT2, gT - gUy * rT2)} ` +
    `L ${P(frontX + gUx * rB2, gB + gUy * rB2)} Q ${P(frontX, gB)} ${P(frontX - rB2, gB)} Z `

  // The cab-door shut lines are carved as slits — the crevice is a gap the
  // film tucks into on a real wrap. No other hardware carves: the sides
  // composite per-pixel ('blending'), so the proud mirror, handle and door
  // track draw over the livery on their own — hardware remounted over vinyl.
  const seams = DOOR_SEAMS.map((s) => clipRoundedRect(P, R, sweep, { ...s, r: 0.002 })).join('')
  // The raked front seam: a fixed-order parallelogram — the CSS x mirror
  // flips outline and hole winding together, so one point order serves
  // both sides.
  const rh = RAKED_SEAM.half
  const rTopX = rakedSeamX(RAKED_SEAM.topY)
  const raked =
    `M ${P(rTopX - rh, RAKED_SEAM.topY)} L ${P(rTopX + rh, RAKED_SEAM.topY)} ` +
    `L ${P(RAKED_SEAM.bottomX + rh, RAKED_SEAM.bottomY)} L ${P(RAKED_SEAM.bottomX - rh, RAKED_SEAM.bottomY)} Z `
  return (outline + seams + raked + (overWindows ? '' : glass)).trim()
}

/**
 * SVG path clipping the rear wrap. Both coverages carve the barn-door shut
 * line (a real van's center crevice stays visible through any wrap); the
 * full-coverage wrap additionally carves every taillight lamp, the third
 * brake light and the hinge knuckles — each to a slim install margin, so
 * the livery runs right up to the hardware and the lamps (which stand
 * slightly proud of the wrap plane) read mounted ON the wrap, not sunken.
 */
function buildRearClip(pxPerUnit: number, full: boolean): string {
  const spec = full ? VAN.rearFull : VAN.rear
  const halfW = spec.width / 2
  const topY = spec.y + spec.height / 2
  const bottomY = spec.y - spec.height / 2
  // The rear plane faces −X; its CSS x axis runs along world +z unmirrored.
  const P = (z: number, y: number) => `${((z + halfW) * pxPerUnit).toFixed(1)} ${((topY - y) * pxPerUnit).toFixed(1)}`
  const R = (u: number) => (u * pxPerUnit).toFixed(1)

  const outline = clipRoundedRectOutline(P, R, 1, {
    minX: -halfW,
    minY: bottomY,
    maxX: halfW,
    maxY: topY,
    r: spec.radius,
  })
  // The center shut line between the barn doors.
  const slit = clipRoundedRect(P, R, 1, {
    minX: -0.008,
    maxX: 0.008,
    minY: bottomY + 0.002,
    maxY: topY - 0.002,
    r: 0.004,
  })
  if (!full) return (outline + slit).trim()

  // Each lamp carved individually — brake, turn, reverse — so the livery
  // runs right up to every lens (bus-parity precision).
  const lamps = ([1, -1] as const)
    .flatMap((side) =>
      (
        [
          { y0: -0.026, y1: 0.186 },
          { y0: -0.181, y1: -0.039 },
          { y0: -0.311, y1: -0.189 },
        ] as const
      ).map(({ y0, y1 }) =>
        clipRoundedRect(P, R, 1, {
          minX: side === 1 ? 0.774 : -0.906,
          maxX: side === 1 ? 0.906 : -0.774,
          minY: y0,
          maxY: y1,
          r: 0.02,
        })
      )
    )
    .join('')
  // High-mount third brake light strip above the doors.
  const brake = clipRoundedRect(P, R, 1, {
    minX: -0.281,
    maxX: 0.281,
    minY: 1.0265,
    maxY: 1.0735,
    r: 0.012,
  })
  // Barn-door hinge knuckles at the outer door edges, two per side.
  const hinges = ([1, -1] as const)
    .flatMap((side) =>
      (
        [
          { y0: 0.499, y1: 0.601 },
          { y0: -0.301, y1: -0.199 },
        ] as const
      ).map(({ y0, y1 }) =>
        clipRoundedRect(P, R, 1, {
          minX: side === 1 ? 0.912 : -0.948,
          maxX: side === 1 ? 0.948 : -0.912,
          minY: y0,
          maxY: y1,
          r: 0.01,
        })
      )
    )
    .join('')
  return (outline + slit + lamps + brake + hinges).trim()
}

export interface VanProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Livery content. Bare children fill the curb-side (+Z) wrap panel; name
   * regions explicitly with `<Van.CurbSide>`, `<Van.StreetSide>`, `<Van.Rear>`
   * and `<Van.LicensePlate>`. A string inside `<Van.LicensePlate>` renders
   * the built-in plate face (dark plate type on the white blank); any React
   * node renders as-is on both plates.
   */
  children?: React.ReactNode
  /** Body paint. Wrap fleets are usually white. */
  color?: string
  /**
   * CSS pixel width of the virtual wrap panel. Height follows the panel
   * aspect; the default tracks `coverage` (panel dpi, or its full-side
   * equivalent).
   */
  resolution?: number
  /**
   * How much of the van the live wraps cover. `'panel'` (default) is the
   * classic rectangular mid-panel, clear of the arches and glass, plus the
   * between-the-taillights rear panel. `'full'` covers the entire side
   * elevation — rockers to roofline, tail to nose — with the wheel arches,
   * door glass, door handle, mirror mount and curb-side door track carved
   * out of the wrap (CSS `clip-path`), and the entire barn-door rear face
   * with the taillight clusters carved out — so the 3D wheels, windows,
   * hardware and lights show through your livery.
   */
  coverage?: 'panel' | 'full'
  /**
   * Whether a full-coverage wrap runs OVER the cab door glass (perforated
   * film, the full-print fleet look) or the glass stays clear (`false`,
   * default — door glass is operational, so real wraps usually cut around
   * it). Pass a boolean for both sides or `{ curbSide?, streetSide? }`.
   */
  wrapOverWindows?: boolean | { curbSide?: boolean; streetSide?: boolean }
  /**
   * How wrap content hides when the van faces away from the camera.
   * `true` raycasts against the shell (fast, interactive). `'blending'` uses
   * per-pixel depth blending. `false` disables hiding.
   */
  occlude?: boolean | 'blending'
}

/**
 * A procedurally built cargo van (generic Transit/Sprinter-style silhouette,
 * no brand): the shell is the side profile — clamshell hood, cowl break,
 * raked windshield, high roof, wheel-arch cutouts — extruded across the
 * width, with wheels (six-lug steel rims), glass, wipers, door shut lines,
 * a sliding-door step, roof ribs, antenna, lights, rear hinges and license
 * plate, mirrors and bumpers added on. The flat cargo side carries a live
 * vinyl-wrap panel for your livery — or, with `coverage="full"`, the whole
 * side elevation and the whole rear face. No 3D asset files are loaded.
 *
 * The origin is the body center; the road sits `VAN.groundY` below it. The
 * wrap panel faces +Z. Must be rendered inside a react-three-fiber `<Canvas>`
 * (or `<MockupCanvas>`).
 *
 * ```tsx
 * <Van coverage="full">
 *   <YourLivery />
 *   <Van.Rear><RearDoors /></Van.Rear>
 *   <Van.LicensePlate>AREA 51</Van.LicensePlate>
 * </Van>
 * ```
 */
function VanImpl({
  children,
  color = '#eef0f2',
  surfaceBackground = '#ffffff',
  resolution,
  coverage = 'panel',
  wrapOverWindows = false,
  interactive = true,
  dragToRotate = true,
  occlude = true,
  surfaceStyle,
  ...groupProps
}: VanProps) {
  const regions = collectSlots(children, VAN_REGIONS)
  const { body, rockerY, wheels, profile, wrap, rear: rearPanel, rearFull } = VAN
  const shellRef = React.useRef<THREE.Mesh>(null!)
  const occludeRefs = useScreenOccluders(shellRef)
  // Screens occlude against OTHER registered bodies only — see the bus's
  // matching note: the convex shell's own ray hits at oblique angles were
  // false positives, and the backface culler covers every view the body
  // itself could block.
  const otherOccludeRefs = React.useMemo(() => occludeRefs.filter((ref) => ref !== shellRef), [occludeRefs])

  // The side rect the DeviceScreens cover: the classic mid-panel, or the
  // whole side elevation with the hardware carved out via clip-path.
  const fullWrap = coverage === 'full'
  const plateSlot = regions.licensePlate
  const plateContent = plateSlot?.children
  // A string becomes the built-in plate face (plate type on the white
  // blank); custom nodes render as-is on both plates.
  const plateFace =
    typeof plateContent === 'string' ? (
      <div
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f4f6f8',
          border: '2px solid #a9aeb6',
          borderRadius: 4,
          containerType: 'size',
        }}
      >
        <span
          style={{
            color: '#181b20',
            fontFamily: '"Arial Narrow", "Helvetica Neue", Arial, sans-serif',
            fontWeight: 700,
            fontSize: '52cqh',
            letterSpacing: '0.1em',
            whiteSpace: 'pre',
          }}
        >
          {plateContent}
        </span>
      </div>
    ) : (
      plateContent
    )
  const over =
    typeof wrapOverWindows === 'boolean'
      ? { curbSide: wrapOverWindows, streetSide: wrapOverWindows }
      : { curbSide: false, streetSide: false, ...wrapOverWindows }
  const side = fullWrap
    ? { width: FULL_WRAP.width, height: FULL_WRAP.height, x: FULL_WRAP.x, y: FULL_WRAP.y, radius: 0 }
    : { width: wrap.width, height: wrap.height, x: wrap.x, y: wrap.y, radius: wrap.radius }
  const rearSpec = fullWrap ? rearFull : rearPanel
  const sideResolution = resolution ?? (fullWrap ? FULL_WRAP_RESOLUTION : VAN.resolution)
  const surfaceDefaults = { background: surfaceBackground, interactive, dragToRotate, style: surfaceStyle }
  const curbSurface = resolveSurface(regions.curbSide, { ...surfaceDefaults, resolution: sideResolution })
  const streetSurface = resolveSurface(regions.streetSide, { ...surfaceDefaults, resolution: sideResolution })
  // The rear panel shares the side wrap's dpi.
  const rearSurface = resolveSurface(regions.rear, {
    ...surfaceDefaults,
    resolution: Math.round(rearSpec.width * (sideResolution / side.width)),
  })
  // Clips are built at each surface's resolved resolution, so a slot-level
  // `resolution` override keeps the carve aligned with its wrap.
  const sideClip = React.useMemo(() => {
    if (!fullWrap) return null
    return {
      curb: `path("${buildFullWrapClip(curbSurface.resolution / FULL_WRAP.width, false, over.curbSide)}")`,
      street: `path("${buildFullWrapClip(streetSurface.resolution / FULL_WRAP.width, true, over.streetSide)}")`,
    }
  }, [fullWrap, curbSurface.resolution, streetSurface.resolution, over.curbSide, over.streetSide])
  const rearClip = React.useMemo(
    () => `path("${buildRearClip(rearSurface.resolution / rearSpec.width, fullWrap)}")`,
    [fullWrap, rearSurface.resolution, rearSpec.width]
  )
  const curbStyle = sideClip ? { clipPath: sideClip.curb, ...curbSurface.screenStyle } : curbSurface.screenStyle
  const streetStyle = sideClip ? { clipPath: sideClip.street, ...streetSurface.screenStyle } : streetSurface.screenStyle
  const rearStyle = { clipPath: rearClip, ...rearSurface.screenStyle }

  // Depth occluders for the full-coverage sides: the wrap outline as real
  // geometry (door glass carved when the wrap keeps clear of it), so
  // per-pixel blending hides only what the livery visually covers.
  const sideOccluderGeometries = React.useMemo(() => {
    if (!fullWrap) return null
    const build = (overGlass: boolean, mirroredSide: boolean) => {
      const s = vanProfileShape()
      if (!overGlass) s.holes.push(doorGlassShape())
      for (const seam of DOOR_SEAMS) s.holes.push(roundedHolePath(seam.minX, seam.minY, seam.maxX, seam.maxY, 0.002))
      const rakedHole = new THREE.Path()
      const rh = RAKED_SEAM.half
      const rTopX = rakedSeamX(RAKED_SEAM.topY)
      rakedHole.moveTo(rTopX - rh, RAKED_SEAM.topY)
      rakedHole.lineTo(rTopX + rh, RAKED_SEAM.topY)
      rakedHole.lineTo(RAKED_SEAM.bottomX + rh, RAKED_SEAM.bottomY)
      rakedHole.lineTo(RAKED_SEAM.bottomX - rh, RAKED_SEAM.bottomY)
      rakedHole.closePath()
      s.holes.push(rakedHole)
      const geometry = new THREE.ShapeGeometry(s, 16)
      geometry.translate(-FULL_WRAP.x, -FULL_WRAP.y, 0)
      if (mirroredSide) geometry.scale(-1, 1, 1)
      return geometry
    }
    return { curb: build(over.curbSide, false), street: build(over.streetSide, true) }
  }, [fullWrap, over.curbSide, over.streetSide])
  React.useEffect(
    () => () => {
      sideOccluderGeometries?.curb.dispose()
      sideOccluderGeometries?.street.dispose()
    },
    [sideOccluderGeometries]
  )
  // Full-coverage sides composite per-pixel so proud hardware (mirrors,
  // handles, track, hinges) draws over the livery; everything else keeps
  // the fast raycast mode.
  const sideScreenOcclusion = (blendGeometry?: THREE.BufferGeometry) =>
    fullWrap && occlude !== false
      ? { occlude: 'blending' as const, occluderGeometry: blendGeometry }
      : { occlude: occlude === true ? otherOccludeRefs : occlude === 'blending' ? ('blending' as const) : undefined }

  const shellGeometry = React.useMemo(() => {
    const s = vanProfileShape()
    const depth = body.width - body.bevel * 2
    const geometry = new THREE.ExtrudeGeometry(s, {
      depth,
      bevelEnabled: true,
      bevelThickness: body.bevel,
      // a small in-plane bevel keeps the profile within ~15mm of its nominal
      // outline, so glass planes and lamps placed on it stay visible
      bevelSize: 0.015,
      bevelSegments: 3,
      curveSegments: 24,
    })
    geometry.translate(0, 0, -depth / 2)
    return geometry
  }, [body, rockerY, wheels, profile])

  // Windshield plane, laid on the cowl-to-header segment of the profile.
  const windshield = React.useMemo(() => {
    const dx = profile.windshieldTopX - profile.cowlX
    const dy = profile.windshieldTopY - profile.cowlY
    const length = Math.hypot(dx, dy)
    return {
      tilt: Math.atan2(-dx / length, dy / length),
      length,
      mid: [
        (profile.cowlX + profile.windshieldTopX) / 2 + (dy / length) * 0.035,
        (profile.cowlY + profile.windshieldTopY) / 2 + (-dx / length) * 0.035,
      ] as const,
    }
  }, [profile])

  // Cab door glass: raked front parallel to the A-pillar, flat top and a
  // vertical rear edge with rounded corners, like the references. Built in
  // world side-elevation coords from the same shape as the wrap carve.
  const doorGlassGeometry = React.useMemo(
    () => new THREE.ExtrudeGeometry(doorGlassShape(), { depth: 0.02, bevelEnabled: false }),
    []
  )

  React.useEffect(() => {
    return () => {
      shellGeometry.dispose()
      doorGlassGeometry.dispose()
    }
  }, [shellGeometry, doorGlassGeometry])

  const glassMaterial = (
    <meshPhysicalMaterial color="#10161f" metalness={0.2} roughness={0.12} clearcoat={1} />
  )
  const trimMaterial = <meshPhysicalMaterial color="#23262b" metalness={0.1} roughness={0.7} />

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

      {/* windshield on the cowl-to-header segment, with the two wipers
          parked across its base — the give-away cue of a working cab */}
      <group position={[windshield.mid[0], windshield.mid[1], 0]} rotation-z={windshield.tilt}>
        <mesh rotation-y={Math.PI / 2}>
          <planeGeometry args={[body.width - 0.28, windshield.length - 0.1]} />
          {glassMaterial}
        </mesh>
        {[-0.28, 0.36].map((z) => (
          <mesh
            key={z}
            position={[0.024, -windshield.length / 2 + 0.28, z]}
            rotation-x={0.42}
          >
            <boxGeometry args={[0.014, 0.5, 0.028]} />
            <meshPhysicalMaterial color="#0e0f12" metalness={0.2} roughness={0.85} />
          </mesh>
        ))}
      </group>

      {/* cab door glass, both sides — trapezoid following the A-pillar. The
          0.02 extrusion runs +z from its base, so each side gets its own base
          z that leaves the outer face ~10mm proud of the shell — or recessed
          beneath the wrap plane when that side's wrap covers the glass. */}
      {[1, -1].map((side) => {
        const covered =
          fullWrap && (side === 1 ? over.curbSide && regions.curbSide != null : over.streetSide && regions.streetSide != null)
        // The 0.02 extrusion always runs +z, so each side's base leaves the
        // outer face ~10mm proud — or tucked under the wrap plane when the
        // wrap covers the glass.
        const base =
          side === 1 ? body.width / 2 - (covered ? 0.018 : 0.01) : -body.width / 2 + (covered ? 0.002 : -0.01)
        return (
          <mesh key={side} geometry={doorGlassGeometry} position={[0, 0, base]}>
            {glassMaterial}
          </mesh>
        )
      })}

      {/* cab door handles, just under the window sill near the rear edge —
          where the references mount them */}
      {[1, -1].map((side) => (
        <RoundedBox key={side} args={[0.162, 0.029, 0.022]} radius={0.01} position={[1.26, 0.12, side * 0.982]}>
          {trimMaterial}
        </RoundedBox>
      ))}

      {/* cab-door shut lines, both sides: the A-pillar seam, the B-pillar
          seam and the sill seam joining them (`DOOR_SEAMS`) — recessed dark
          strips sunk to the body surface, a GAP like the rear barn-door
          crevice, never a ridge. The full wrap carves matching slits (and
          the blending occluder matching holes), so the crevice reads
          through any livery. Each strip is a hair wider/taller than its
          slit so no background ever peeks through the carve edge. */}
      {[1, -1].map((side) => {
        const rTopX = rakedSeamX(RAKED_SEAM.topY)
        const rakedLen = Math.hypot(RAKED_SEAM.bottomX - rTopX, RAKED_SEAM.topY - RAKED_SEAM.bottomY)
        const rakedAngle = Math.atan2(RAKED_SEAM.topY - RAKED_SEAM.bottomY, rTopX - RAKED_SEAM.bottomX)
        return (
          <group key={side}>
            {DOOR_SEAMS.map((s) => (
              <mesh
                key={`${s.minX}${s.minY}`}
                position={[(s.minX + s.maxX) / 2, (s.minY + s.maxY) / 2, side * 0.9715]}
              >
                <boxGeometry args={[s.maxX - s.minX + 0.008, s.maxY - s.minY + 0.008, 0.01]} />
                <meshPhysicalMaterial color="#191b1f" metalness={0.2} roughness={0.8} />
              </mesh>
            ))}
            {/* raked front seam strip, rotated along the A-pillar slope */}
            <mesh
              position={[(rTopX + RAKED_SEAM.bottomX) / 2, (RAKED_SEAM.topY + RAKED_SEAM.bottomY) / 2, side * 0.9715]}
              rotation-z={rakedAngle}
            >
              <boxGeometry args={[rakedLen + 0.008, RAKED_SEAM.half * 2 + 0.008, 0.01]} />
              <meshPhysicalMaterial color="#191b1f" metalness={0.2} roughness={0.8} />
            </mesh>
          </group>
        )
      })}

      {/* curb-side sliding-door track groove, from behind the door to the
          rear quarter — above the panel wrap's top edge (y 1.10), and held
          proud of the full wrap's DOM plane so blending draws it over any
          livery like remounted hardware */}
      <mesh position={[-0.8, 1.14, body.width / 2 + 0.012]}>
        <boxGeometry args={[3.4, 0.038, 0.018]} />
        <meshPhysicalMaterial color="#191b1f" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* black entry step under the curb-side sliding door, hung below the
          rocker line — outside every wrap region, so it stays visible */}
      <RoundedBox args={[1.55, 0.09, 0.06]} radius={0.02} position={[0.05, -0.93, body.width / 2 - 0.02]}>
        {trimMaterial}
      </RoundedBox>

      {/* high-roof cap detail: shallow longitudinal ribs pressed into the
          sheet metal, the Sprinter/Transit roof signature from a 3/4 view */}
      {[-0.54, -0.18, 0.18, 0.54].map((z) => (
        <RoundedBox key={z} args={[3.5, 0.014, 0.055]} radius={0.006} position={[-0.68, profile.roofY + 0.005, z]}>
          <meshPhysicalMaterial color={color} metalness={0.4} roughness={0.35} clearcoat={1} clearcoatRoughness={0.15} />
        </RoundedBox>
      ))}

      {/* stub antenna on the front roof corner */}
      <group position={[1.08, profile.roofY, -0.56]}>
        <mesh position={[0, 0.015, 0]}>
          <cylinderGeometry args={[0.022, 0.028, 0.03, 12]} />
          {trimMaterial}
        </mesh>
        <mesh position={[0, 0.11, 0]} rotation-z={0.12}>
          <cylinderGeometry args={[0.007, 0.009, 0.19, 8]} />
          {trimMaterial}
        </mesh>
      </group>

      {/* fog-light recesses set into the bumper corners */}
      {[1, -1].map((side) => (
        <RoundedBox key={side} args={[0.06, 0.095, 0.17]} radius={0.025} position={[2.845, -0.7, side * 0.6]}>
          <meshPhysicalMaterial color="#0e0f11" metalness={0.3} roughness={0.55} />
        </RoundedBox>
      ))}

      {/* running gear: dark wheel-well liners fill the arch openings, axles
          tie each wheel pair together, and an underbody pan closes the gap
          between the rockers — so the wheels read as attached, not floating */}
      {([wheels.frontX, wheels.rearX] as const).map((x) => (
        <group key={x}>
          <mesh position={[x, rockerY + (wheels.archRadius + 0.02) / 2, 0]}>
            <boxGeometry args={[wheels.archRadius * 2 - 0.04, wheels.archRadius + 0.02, body.width - 0.08]} />
            <meshPhysicalMaterial color="#0c0d10" metalness={0} roughness={1} />
          </mesh>
          <mesh rotation-x={Math.PI / 2} position={[x, wheels.centerY, 0]}>
            <cylinderGeometry args={[0.055, 0.055, body.width - 0.34, 12]} />
            <meshPhysicalMaterial color="#191b1f" metalness={0.5} roughness={0.7} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, rockerY - 0.075, 0]}>
        <boxGeometry args={[body.length - 0.9, 0.15, body.width - 0.4]} />
        <meshPhysicalMaterial color="#0d0e11" metalness={0.1} roughness={0.95} />
      </mesh>

      {/* wheels: tire, rim, hub and a six-lug ring — four corners. The lugs
          sit just proud of the outer rim face, the cue that makes a plain
          cylinder read as a steel commercial wheel. */}
      {([wheels.frontX, wheels.rearX] as const).map((x) =>
        [1, -1].map((side) => (
          <group key={`${x}${side}`} position={[x, wheels.centerY, side * (body.width / 2 - 0.145)]}>
            <mesh rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[wheels.radius, wheels.radius, wheels.width, 28]} />
              <meshPhysicalMaterial color="#15161a" metalness={0} roughness={0.95} />
            </mesh>
            <mesh rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[0.19, 0.19, wheels.width + 0.006, 24]} />
              <meshPhysicalMaterial color="#c6cad1" metalness={0.85} roughness={0.35} />
            </mesh>
            <mesh rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[0.06, 0.06, wheels.width + 0.012, 16]} />
              <meshPhysicalMaterial color="#3c4046" metalness={0.7} roughness={0.4} />
            </mesh>
            {Array.from({ length: 6 }, (_, i) => {
              const angle = (i / 6) * Math.PI * 2
              return (
                <mesh
                  key={i}
                  rotation-x={Math.PI / 2}
                  position={[Math.cos(angle) * 0.115, Math.sin(angle) * 0.115, side * (wheels.width / 2 + 0.007)]}
                >
                  <cylinderGeometry args={[0.017, 0.017, 0.016, 10]} />
                  <meshPhysicalMaterial color="#4a4f56" metalness={0.75} roughness={0.35} />
                </mesh>
              )
            })}
          </group>
        ))
      )}

      {/* wide slatted grille spanning the nose between the headlights, just
          under the hood's front edge (the modern Transit/Sprinter face) */}
      <RoundedBox args={[0.05, 0.28, 1.12]} radius={0.03} position={[2.81, -0.11, 0]}>
        <meshPhysicalMaterial color="#15171b" metalness={0.3} roughness={0.6} />
      </RoundedBox>
      {[-0.045, -0.125, -0.205].map((y) => (
        <RoundedBox key={y} args={[0.055, 0.036, 1.06]} radius={0.015} position={[2.815, y, 0]}>
          <meshPhysicalMaterial color="#2c3037" metalness={0.5} roughness={0.45} />
        </RoundedBox>
      ))}
      {/* slim lower intake in the bumper band */}
      <RoundedBox args={[0.05, 0.12, 1.2]} radius={0.02} position={[2.86, -0.72, 0]}>
        <meshPhysicalMaterial color="#141619" metalness={0.3} roughness={0.65} />
      </RoundedBox>
      {/* license-plate recess between grille and bumper */}
      <RoundedBox args={[0.03, 0.13, 0.52]} radius={0.012} position={[2.82, -0.42, 0]}>
        <meshPhysicalMaterial color="#dfe2e6" metalness={0.1} roughness={0.5} />
      </RoundedBox>
      {plateSlot != null && (
        <DeviceScreen
          width={0.5}
          height={0.12}
          radius={0.008}
          {...resolveSurface(plateSlot, { ...surfaceDefaults, background: '#f4f6f8', resolution: 200 })}
          position={[2.839, -0.42, 0]}
          rotation={[0, Math.PI / 2, 0]}
          occlude={occlude === true ? otherOccludeRefs : occlude === 'blending' ? 'blending' : undefined}
        >
          {plateFace}
        </DeviceScreen>
      )}
      {/* headlight units flanking the grille, tops kissing the hood line,
          reaching out to the corners with the amber segment wrapping the end */}
      {[1, -1].map((side) => (
        <group key={side}>
          <RoundedBox args={[0.06, 0.22, 0.44]} radius={0.03} position={[2.81, -0.07, side * 0.72]}>
            <meshPhysicalMaterial
              color="#e8edf4"
              emissive="#dfe9f5"
              emissiveIntensity={0.25}
              metalness={0.3}
              roughness={0.2}
              clearcoat={1}
            />
          </RoundedBox>
          <RoundedBox args={[0.055, 0.16, 0.09]} radius={0.025} position={[2.8, -0.09, side * 0.93]}>
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

      {/* black plastic bumper band low on the nose, wrapping the corners —
          a slim skid band, not a half-height mass */}
      <RoundedBox args={[0.14, 0.3, body.width + 0.02]} radius={0.05} position={[2.8, -0.73, 0]}>
        {trimMaterial}
      </RoundedBox>
      <RoundedBox args={[0.1, 0.16, body.width + 0.02]} radius={0.04} position={[-2.77, -0.82, 0]}>
        {trimMaterial}
      </RoundedBox>
      {/* taillight clusters: brake (red) / turn (amber) / reverse (white),
          stacked at hand height on the rear corners like real van lamps —
          standing ~20 mm proud of the wrap plane, so a full livery reads as
          cut around lamps mounted ON the doors, not sunken behind them */}
      {[1, -1].map((side) => (
        <group key={side} position={[-2.821, 0, side * 0.84]}>
          <RoundedBox args={[0.05, 0.2, 0.12]} radius={0.02} position={[0, 0.08, 0]}>
            <meshPhysicalMaterial color="#8c1524" emissive="#c11a30" emissiveIntensity={0.45} roughness={0.25} clearcoat={1} />
          </RoundedBox>
          <RoundedBox args={[0.05, 0.13, 0.12]} radius={0.02} position={[0, -0.11, 0]}>
            <meshPhysicalMaterial color="#f2a33c" emissive="#ffb340" emissiveIntensity={0.4} roughness={0.25} clearcoat={1} />
          </RoundedBox>
          <RoundedBox args={[0.05, 0.11, 0.12]} radius={0.02} position={[0, -0.25, 0]}>
            <meshPhysicalMaterial color="#e9ecef" emissive="#f2f5f8" emissiveIntensity={0.2} roughness={0.25} clearcoat={1} />
          </RoundedBox>
        </group>
      ))}

      {/* rear barn-door center shut line, running the full door height —
          every rear wrap carves a slit over it, so the crevice stays
          visible through any livery like on a real wrapped van */}
      <mesh position={[-2.822, 0.12, 0]}>
        <boxGeometry args={[0.01, 1.96, 0.014]} />
        <meshPhysicalMaterial color="#191b1f" metalness={0.2} roughness={0.8} />
      </mesh>
      {/* high-mount third brake light strip above the doors, proud of the
          wrap plane and carved out of the full wrap */}
      <RoundedBox args={[0.025, 0.035, 0.55]} radius={0.01} position={[-2.83, 1.05, 0]}>
        <meshPhysicalMaterial color="#8c1524" emissive="#c11a30" emissiveIntensity={0.45} roughness={0.25} clearcoat={1} />
      </RoundedBox>
      {/* vertical grab handle on the right rear door leaf, kept just behind
          the rear wrap plane so a live rear panel covers it cleanly */}
      <RoundedBox args={[0.024, 0.162, 0.03]} radius={0.008} position={[-2.82, -0.26, -0.12]}>
        {trimMaterial}
      </RoundedBox>
      {/* barn-door hinge knuckles at the outer door edges, two per side —
          the full rear wrap carves a tight hole around each, so they show
          through any livery like install-cut hardware */}
      {[1, -1].map((side) =>
        [0.55, -0.25].map((y) => (
          <RoundedBox key={`${side}${y}`} args={[0.05, 0.09, 0.024]} radius={0.008} position={[-2.835, y, side * 0.93]}>
            {trimMaterial}
          </RoundedBox>
        ))
      )}
      {/* license recess and plate low on the left door leaf, under every
          wrap region's bottom edge */}
      <RoundedBox args={[0.03, 0.17, 0.34]} radius={0.012} position={[-2.822, -0.78, -0.3]}>
        <meshPhysicalMaterial color="#15171a" metalness={0.2} roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[0.014, 0.125, 0.27]} radius={0.008} position={[-2.834, -0.78, -0.3]}>
        <meshPhysicalMaterial color="#e6e9ed" metalness={0.05} roughness={0.5} />
      </RoundedBox>
      {plateSlot != null && (
        <DeviceScreen
          width={0.26}
          height={0.115}
          radius={0.006}
          {...resolveSurface(plateSlot, { ...surfaceDefaults, background: '#f4f6f8', resolution: 160 })}
          position={[-2.843, -0.78, -0.3]}
          rotation={[0, -Math.PI / 2, 0]}
          occlude={occlude === true ? otherOccludeRefs : occlude === 'blending' ? 'blending' : undefined}
        >
          {plateFace}
        </DeviceScreen>
      )}

      {/* door mirrors: heads reach only ~165 mm beyond the body per side,
          each hung from two short arms off the door at beltline */}
      {[1, -1].map((side) => (
        <group key={side}>
          <mesh position={[2.08, 0.62, side * 1.0]}>
            <boxGeometry args={[0.03, 0.025, 0.09]} />
            {trimMaterial}
          </mesh>
          <mesh position={[2.08, 0.44, side * 1.0]}>
            <boxGeometry args={[0.03, 0.025, 0.09]} />
            {trimMaterial}
          </mesh>
          <RoundedBox args={[0.07, 0.26, 0.15]} radius={0.02} position={[2.03, 0.52, side * 1.055]}>
            {trimMaterial}
          </RoundedBox>
        </group>
      ))}

      {/* the live wraps: real DOM on the curb side, street side and rear doors */}
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
          position={[-body.length / 2 - 0.026, rearSpec.y, 0]}
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
VanImpl.displayName = 'Van'

/** The van's compound slots, shared by `<Van>` and `<VanMockup>`. */
export const vanSlots = createSlots(VAN_REGIONS)

export const Van = Object.assign(VanImpl, vanSlots)
