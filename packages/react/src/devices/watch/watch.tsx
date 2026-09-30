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
  bendAlongStrap,
  watchStrapLengths,
  WATCH_OPEN_START_Y,
  type StrapPath,
} from '../../core'
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
 * A rounded rectangle's outline as points, its straight runs subdivided every
 * `step` - so geometry built along it has vertices all along its sides for
 * `bendAlongStrap` to carry round a curve, where a plain shape has only the two
 * at each side's ends and bends into a chord.
 */
function roundedRectOutline(width: number, height: number, radius: number, step = 0.04): THREE.Vector2[] {
  const hw = width / 2
  const hh = height / 2
  const r = Math.max(0.001, Math.min(radius, hw, hh))
  const points: THREE.Vector2[] = []
  const arc = 8
  // Each corner, then the side after it, counter-clockwise from the bottom
  // right - start points in, end points out, so no point repeats where a
  // side has zero length (a stadium's ends).
  const corners: [number, number, number][] = [
    [hw - r, -hh + r, -Math.PI / 2],
    [hw - r, hh - r, 0],
    [-hw + r, hh - r, Math.PI / 2],
    [-hw + r, -hh + r, Math.PI],
  ]
  corners.forEach(([cx, cy, a0], i) => {
    for (let k = 0; k < arc; k++) {
      const a = a0 + (k / arc) * (Math.PI / 2)
      points.push(new THREE.Vector2(cx + r * Math.cos(a), cy + r * Math.sin(a)))
    }
    const a1 = a0 + Math.PI / 2
    const x0 = cx + r * Math.cos(a1)
    const y0 = cy + r * Math.sin(a1)
    const [nx, ny, na] = corners[(i + 1) % 4]!
    const x1 = nx + r * Math.cos(na)
    const y1 = ny + r * Math.sin(na)
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step - 1e-6)
    for (let k = 0; k < n; k++) points.push(new THREE.Vector2(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n))
  })
  return points
}

/**
 * A buckle frame in strap-local terms (x across the strap, z along it, y
 * outward): a rounded rectangle of bar stock `bar` wide and `height` deep,
 * swept as a tube so the metal reads as bent wire - round, or oval where the
 * stock is flatter than it is wide - with smooth shading all the way round.
 * Wrap it onto a strap with `bendAlongStrap`.
 *
 * A frame lying on a strap does not stay flat past the strap's edges: its
 * ends wrap down round them to the strap's mid-height. `dip` bends everything
 * outside `strapWidth` down by that much, so the cross bars ride on the strap
 * while the rounded ends sit beside it rather than floating above it.
 */
function buckleFrameGeometry(
  width: number,
  length: number,
  bar: number,
  height: number,
  radius: number,
  strapWidth = width,
  dip = 0
) {
  // The tube runs down the middle of the stock.
  const outline = roundedRectOutline(width - bar, length - bar, Math.max(0.005, radius - bar / 2), 0.03)
  const curve = new THREE.CatmullRomCurve3(
    outline.map((p) => new THREE.Vector3(p.x, 0, p.y)),
    true,
    'centripetal'
  )
  const geometry = new THREE.TubeGeometry(curve, outline.length * 2, bar / 2, 10, true)
  // Squash the round section to the stock's depth; normals by the inverse.
  const squash = height / bar
  const position = geometry.getAttribute('position') as THREE.BufferAttribute
  const normal = geometry.getAttribute('normal') as THREE.BufferAttribute
  const from = strapWidth / 2 - bar * 0.5
  const span = Math.max(bar * 1.5, 0.01)
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    // y -= dip * smoothstep(|x|) over the strap's edge; normals by the
    // deformation's inverse transpose, n' = (nx + f'(x) ny, ny, nz).
    const u = dip > 0 ? Math.min(1, Math.max(0, (Math.abs(x) - from) / span)) : 0
    position.setY(i, position.getY(i) * squash - dip * u * u * (3 - 2 * u))
    const ny = normal.getY(i) / squash
    const slope = dip > 0 ? ((dip * 6 * u * (1 - u)) / span) * Math.sign(x) : 0
    const nx = normal.getX(i) + slope * ny
    const nz = normal.getZ(i)
    const n = Math.hypot(nx, ny, nz) || 1
    normal.setXYZ(i, nx / n, ny / n, nz / n)
  }
  return geometry
}

/**
 * A keeper moulded in band material, in strap-local terms: a rounded sleeve
 * whose opening is `width` x `height` (across x outward), `length` along the
 * strap, walls `wall` thick.
 */
function bandKeeperGeometry(width: number, height: number, length: number, wall: number) {
  const bevel = wall * 0.45
  const outerW = width + wall * 2 - bevel * 2
  const outerH = height + wall * 2 - bevel * 2
  // A soft, pill-ended section - a moulded loop, not a box.
  const shape = roundedRectShape(outerW, outerH, outerH / 2 - 0.001)
  shape.holes.push(roundedRectShape(width + bevel * 2, height + bevel * 2, Math.min((height + bevel * 2) / 2 - 0.001, wall)))
  const depth = Math.max(length - bevel * 2, 0.001)
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    // Rings along the sleeve, so it bends with the strap it wraps.
    steps: 8,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 12,
  })
  geometry.translate(0, 0, -depth / 2)
  return geometry
}

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
   * (`APPLE_WATCH_COLORWAYS[variant]` / `GALAXY_WATCH_COLORWAYS[variant]` -
   * the Series 11's aluminium Jet Black / Silver / Rose Gold, the Series 12's
   * aluminium, titanium and ceramic finishes, the Ultra 4's Natural and Black
   * titanium; Galaxy Graphite and Silver) or any CSS color for a custom
   * finish. A colorway id wins over a CSS color of the same name - pass hex
   * if you meant the CSS one.
   */
  color?: string
  /** Strap colorway (fluoroelastomer sport band). Defaults to a dark band. */
  bandColor?: string
  /**
   * CSS pixel width of the virtual display. The default matches the device's
   * logical grid: 208 gives 208×248 on the Apple Watch Series, 211 gives
   * 211×257 on the Ultra; 240 gives a round 240×240 on the Galaxy Watch - so
   * content lays out like on the real device.
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
 * slots at both ends, while the Ocean Band and the Galaxy's band are two straps
 * closing with a buckle, a keeper and punched adjustment holes sized from the
 * retail fit range - and only those can be laid open with `bandOpen`, which
 * `<GalaxyWatch>` exposes. Both carry their real sensor back: an optical
 * cluster behind a round crystal, sunk flush into Apple's body-colour plate
 * (raised on the Ultra's ceramic dome), raised on Samsung's BioActive puck. No
 * 3D asset files are loaded - the whole device is generated from geometry at
 * runtime.
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
  const { body, lip, glass, display, crown, crownGuard, buttons, mic, speaker, bandSlot, band } = spec
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
    // Under a lip, the body is the rest of the depth, sitting below it.
    const lipHeight = lip?.height ?? 0
    const depth = body.depth - lipHeight - body.bevel * 2
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
    geometry.translate(0, 0, -depth / 2 - lipHeight / 2)

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
      // away near the corners the recess (and key) fade out naturally. A key
      // on the left flank (the Ultra's Action button) is recessed there.
      const cutter = stadiumCutter(button.width + 0.06, button.length + 0.06, 0.024, 'x')
      cutter.translate(button.edge === 'left' ? -wall : wall, button.y, 0)
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
  }, [body, lip, mic, speaker, buttons, bandSlot])

  // The Ultra's lip: a flat plate standing on the barrel body, square-edged
  // but for a small roll, its top the case's face. It reaches down into the
  // body's rounded top edge so the two never show a seam.
  const lipGeometry = React.useMemo(() => {
    if (!lip) return null
    const roll = 0.012
    const reach = body.bevel * 0.6
    const shape = roundedRectShape(
      body.width - (lip.inset + roll) * 2,
      body.height - (lip.inset + roll) * 2,
      body.radius - lip.inset - roll
    )
    const depth = lip.height + reach - roll * 2
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: roll,
      bevelSize: roll,
      bevelSegments: 3,
      curveSegments: 48,
    })
    geometry.translate(0, 0, body.depth / 2 - roll - depth)
    return geometry
  }, [body, lip])

  const glassGeometry = React.useMemo(
    () => new THREE.ShapeGeometry(roundedRectShape(glass.width, glass.height, glass.radius), 32),
    [glass]
  )

  // Digital Crown barrel: a gear profile extruded along the crown's axis, so
  // the machined knurling crevices run down the barrel like the real crown.
  const crownGeometry = React.useMemo(() => {
    if (!crown) return null
    return new THREE.ExtrudeGeometry(
      gearShape(crown.radius, crown.teeth, crown.toothDepth, crown.lobed ? 'lobed' : 'knurled'),
      { depth: crown.thickness, bevelEnabled: false, curveSegments: 12 }
    )
  }, [crown])

  // The Ultra's crown guard: a round-ended plate standing off the right
  // flank, reaching back into the case so the join never shows a seam, with
  // a pocket cut round each key it shields and the microphone drilled
  // through it.
  const guardGeometry = React.useMemo(() => {
    if (!crownGuard) return null
    const { length, thickness, proud, radius } = crownGuard
    const reach = 0.16
    const shape = roundedRectShape(thickness - radius * 2, length - radius * 2, (thickness - radius * 2) / 2 - 0.001)
    const depth = proud + reach - radius * 2
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: radius,
      bevelSize: radius,
      bevelSegments: 4,
      curveSegments: 32,
    })
    // Outline x onto the case depth, extrusion out of the flank.
    geometry.rotateY(Math.PI / 2)
    const wall = body.width / 2
    geometry.translate(wall - reach + radius, crownGuard.y, 0)
    const face = wall + proud
    const cutters: THREE.BufferGeometry[] = []
    for (const key of buttons) {
      if (key.edge === 'left') continue
      const cutter = stadiumCutter(key.width + 0.05, key.length + 0.05, 0.03, 'x')
      cutter.translate(face, key.y, 0)
      cutters.push(cutter)
    }
    if (mic) {
      const cutter = holeCutter(mic.radius, 0.05, 'x')
      cutter.translate(face, mic.y, mic.z ?? 0)
      cutters.push(cutter)
    }
    return cutGeometry(geometry, cutters)
  }, [crownGuard, body.width, buttons, mic])

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
  // Worn, the tail rides this far off the loop where it laps the other strap:
  // clear of that strap's domed face and its ridge crests, so the two stack
  // rather than interpenetrate.
  const ridgeDepth = band.ridges?.depth ?? 0
  const ride = band.thickness + band.crown + ridgeDepth + 0.012
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

    const { ridges } = band
    const runs = pose.runs.map((run, index) => {
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
      // The moulded root: thicker where the strap leaves the case, thinning
      // to the strap proper over the connector's flare - a band is not a
      // ribbon of one gauge from the lug on.
      const root = (t: number) => 1 + 0.3 * (1 - shoulder(t))
      // Ridges crest on the outer face only (the inner face stays flat on the
      // wrist) and fade into the smooth connector. On the tail they are
      // phased so every hole sits in a trough.
      const phase = index === 1 && !seamless ? (band.holes[0] ?? 0) * run.length : 0
      const ridge = (t: number) =>
        ridges
          ? ridges.depth *
            (0.5 - 0.5 * Math.cos((2 * Math.PI * (t * run.length - phase)) / ridges.pitch)) *
            Math.min(1, Math.max(0, shoulder(t) * 1.5 - 0.5))
          : 0
      return sweptStrapGeometry({
        path: run.path,
        width: (t) =>
          band.lugWidth +
          (band.width - band.lugWidth) * shoulder(t) +
          (tipWidth - band.width) * tipFade(t),
        thickness: (t) => band.thickness * root(t) * (1 - 0.18 * tipFade(t)) + ridge(t),
        crown: (t) => band.crown * (1 - 0.4 * tipFade(t)),
        lift: (t) => run.lift(t) + ridge(t) / 2,
        // Enough rings to round every ridge, not just resolve the taper.
        segments: ridges ? Math.max(run.segments, Math.ceil((run.length / ridges.pitch) * 10)) : run.segments,
        capStart: true,
        capEnd: true,
      })
    })
    if (band.closure === 'seamless' || pose.kind === 'seamless') return runs

    // Punch the adjustment holes clean through the long strap, at their
    // positions along it - the same fractions whichever pose the band is in.
    const cutters = band.holes.map((t) => {
      const frame = pose.tail(t)
      // Holes are rounded slots - elongated across the strap on both bands
      // this models, a drilling when the two sizes agree - so the cutter is an
      // extruded stadium, not a cylinder.
      const depth = band.thickness * 8
      const cutter = new THREE.ExtrudeGeometry(
        roundedRectShape(
          band.holeRadius * 2,
          band.holeLength,
          Math.min(band.holeRadius, band.holeLength / 2) - 0.0005
        ),
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
      lipGeometry?.dispose()
      glassGeometry.dispose()
      bandGeometries.forEach((geometry) => geometry.dispose())
      crownGeometry?.dispose()
      guardGeometry?.dispose()
      speakerLinerGeometries.forEach((g) => g.dispose())
    }
  }, [bodyGeometry, lipGeometry, glassGeometry, bandGeometries, crownGeometry, guardGeometry, speakerLinerGeometries])

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

  // The Sport Band's pin-and-tuck. Worn, the pin comes up through the engaged
  // hole in the lapping tail, which rides one thickness proud; unbuckled it
  // stays on the tip of the strap it is mounted on. Both are fractions along a
  // strap, so neither pose has to know the shape of the other's path.
  const pinStud =
    band.closure !== 'tuck' || pose.kind === 'seamless'
      ? null
      : (() => {
          const at = bandOpen ? 0.91 : (band.holes[band.closureHole] ?? band.holes[0] ?? 0.6)
          const strap = bandOpen ? pose.pin : pose.tail
          const stand = bandOpen ? pose.pinLift(at) : pose.tailLift(at)
          return { ...fittingAt(strap, at, stand + band.thickness * 0.42), holeRadius: band.holeRadius }
        })()

  // Buckle hardware: the frame with its tongue, and the keeper. Each piece is
  // built flat in strap-local terms and wrapped onto its strap with
  // `bendAlongStrap`, so it follows the band's curve the way the real part
  // hugs it - straight slabs stand off a curved band at both ends, and from
  // the side read as blocks floating beside the strap.
  const hardware = React.useMemo(() => {
    if (band.closure !== 'buckle' || pose.kind === 'seamless') return null
    const [pinRun, tailRun] = pose.runs
    const frame = band.buckle ?? {
      width: band.width + 0.11,
      length: (band.width + 0.11) * 0.78,
      bar: band.thickness,
      radius: 0.2,
    }
    const barHeight = frame.bar
    // The strap's outer face over its centre path.
    const face = band.thickness / 2 + band.crown
    // Hardware lying ON a strap beds its cross bars into the rubber, their
    // tops level with the ridge crests - the band gives under the metal.
    const restOn = (surface: number) => surface + face + ridgeDepth - barHeight / 2 + 0.01
    const keeperLength = band.keeper === 'metal' ? frame.length * 0.85 : 0.34
    const parts: { geometry: THREE.BufferGeometry; finish: 'metal' | 'band' }[] = []

    // Lying on a strap whose centre path is `surface` off the loop, the
    // frame's ends wrap down round the strap's edges to its mid-height.
    const dipFrom = (surface: number, stand: number) => Math.max(0, stand - surface)

    const buckleAt = (path: StrapPath, length: number, at: number, stand: number, dip: number, tongueY: number) => {
      parts.push({
        geometry: bendAlongStrap(
          buckleFrameGeometry(frame.width, frame.length, frame.bar, barHeight, frame.radius, band.width, dip),
          { path, length, at, stand }
        ),
        finish: 'metal',
      })
      // The tongue: a rounded bar from the hinge bar - the end wrapped by the
      // short strap, toward -z - running down the middle of the frame toward
      // the free bar, dropping into the engaged hole. Rounded, not boxy: a
      // flat metal face turned to the camera mirrors whatever is behind it
      // and reads as a black slot.
      const tongueHeight = barHeight * 0.55
      const inner = frame.length - frame.bar * 1.2
      const tongueLength = inner * (frame.tongue ?? 1)
      const tongue = new THREE.CylinderGeometry(frame.bar * 0.4, frame.bar * 0.4, tongueLength, 12, 12)
      tongue.rotateX(Math.PI / 2)
      tongue.scale(1, tongueHeight / (frame.bar * 0.8), 1)
      tongue.computeVertexNormals()
      tongue.translate(0, tongueY, -inner / 2 + tongueLength / 2)
      parts.push({ geometry: bendAlongStrap(tongue, { path, length, at, stand }), finish: 'metal' })
    }

    const keeperAt = (path: StrapPath, length: number, at: number, bottom: number, top: number) => {
      if (band.keeper === 'metal') {
        // A second frame of the buckle's stock, lying over the straps.
        const stand = restOn(top)
        const geometry = buckleFrameGeometry(
          frame.width,
          keeperLength,
          frame.bar,
          barHeight,
          frame.radius,
          band.width,
          dipFrom((top + bottom + band.thickness / 2) / 2, stand)
        )
        parts.push({ geometry: bendAlongStrap(geometry, { path, length, at, stand }), finish: 'metal' })
        return
      }
      // A sleeve of band material round the straps.
      const height = top + face + ridgeDepth - bottom + 0.008
      const geometry = bandKeeperGeometry(band.width + 0.03, height, keeperLength, 0.03)
      geometry.translate(0, bottom + height / 2, 0)
      parts.push({ geometry: bendAlongStrap(geometry, { path, length, at }), finish: 'band' })
    }

    if (bandOpen) {
      // Unbuckled, the frame hangs off the short strap's tip, whose end is
      // wrapped round the hinge bar, level with the strap; the keeper sits
      // on the strap just inboard of it.
      const pinLength = pinRun!.length
      buckleAt(pose.pin, pinLength, 1 + (frame.length / 2 - frame.bar) / pinLength, 0, 0, 0)
      const at = 1 - (keeperLength / 2 + frame.bar + 0.06) / pinLength
      keeperAt(pose.pin, pinLength, at, -band.thickness / 2, 0)
    } else {
      // Worn, the frame lies over the lapping tail at the engaged hole, the
      // tongue resting on the strap; the keeper holds the tail down on the
      // other strap further along.
      const tailLength = tailRun!.length
      const closureT = band.holes[band.closureHole] ?? band.holes[0] ?? 0.6
      const surface = pose.tailLift(closureT)
      const stand = restOn(surface)
      buckleAt(pose.tail, tailLength, closureT, stand, dipFrom(surface, stand), -barHeight / 2 + (barHeight * 0.55) / 2)
      const keeperT = band.keeperT ?? 0.78
      keeperAt(pose.tail, tailLength, keeperT, -band.thickness / 2, pose.tailLift(keeperT))
    }
    return parts
  }, [band, bandOpen, pose, ridgeDepth])
  React.useEffect(() => () => hardware?.forEach(({ geometry }) => geometry.dispose()), [hardware])

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

      {/* the Ultra's flat lip, standing on the barrel body round the crystal */}
      {lipGeometry && (
        <mesh geometry={lipGeometry}>
          <meshPhysicalMaterial color={color} metalness={0.85} roughness={0.3} clearcoat={0.25} clearcoatRoughness={0.4} />
        </mesh>
      )}

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
        const { radius, raise, flare, housing, hubRadius, leds, electrode, coilRing } = spec.back
        // Back face is −z; everything below stacks outward from it.
        const face = -body.depth / 2
        const at = (out: number) => face - out
        return (
          <group>
            {/* raised puck carrying the crystal - a body-colour collar on the
                Galaxy, the Ultra's broad black-ceramic dome widening to the
                back plate */}
            {raise > 0 && (
              <mesh rotation-x={Math.PI / 2} position-z={at(raise / 2)}>
                <cylinderGeometry
                  args={flare ? [radius * flare, radius, raise, 64] : [radius, radius * 1.03, raise, 48]}
                />
                {housing ? (
                  <meshPhysicalMaterial color={housing} metalness={0.1} roughness={0.2} clearcoat={0.8} clearcoatRoughness={0.2} />
                ) : (
                  <meshPhysicalMaterial color={color} metalness={0.8} roughness={0.34} envMapIntensity={0.9} />
                )}
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

      {/* the Ultra's crown guard: a raised titanium boss on the right flank
          shielding the crown and side button, both of which stand proud of
          it - it reaches into the case so the join never shows a seam */}
      {guardGeometry && (
        <mesh geometry={guardGeometry}>
          <meshPhysicalMaterial
            color={color}
            metalness={0.85}
            roughness={0.3}
            clearcoat={0.25}
            clearcoatRoughness={0.4}
          />
        </mesh>
      )}

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
          {/* flat end cap, slightly proud of the teeth - satin, not a mirror
              that reads as a black disc face-on */}
          <mesh rotation-z={Math.PI / 2} position-x={crown.proud - 0.002}>
            <cylinderGeometry
              args={[crown.radius - crown.toothDepth - 0.012, crown.radius - crown.toothDepth - 0.012, 0.02, 40]}
            />
            <meshPhysicalMaterial color={color} metalness={0.9} roughness={0.36} clearcoat={0.4} />
          </mesh>
          {/* the Ultra's International Orange ring inlaid around the cap's face */}
          {crown.ring && (
            <mesh rotation-y={Math.PI / 2} position-x={crown.proud + 0.0086}>
              <ringGeometry
                args={[(crown.radius - crown.toothDepth - 0.012) * 0.74, (crown.radius - crown.toothDepth - 0.012) * 0.92, 48]}
              />
              <meshPhysicalMaterial color={crown.ring} metalness={0.2} roughness={0.5} />
            </mesh>
          )}
        </group>
      )}

      {/* keys seated in their machined recesses: Apple's near-flush side
          button and the Ultra's orange Action button on the left flank, the
          Galaxy's two raised chamfered keys - the right edge unless the spec
          says otherwise */}
      {buttons.map(({ y, length, width, proud, color: keyColor, edge }) => (
        <SideKey
          key={`${edge ?? 'right'}${y}`}
          side={edge === 'left' ? -1 : 1}
          railX={body.width / 2}
          y={y}
          length={length}
          thickness={width}
          protrusion={proud}
          color={keyColor ?? color}
          painted={keyColor !== undefined}
        />
      ))}

      {/* dark plug inside the drilled microphone hole on the right edge -
          in the crown guard's face where there is one */}
      {mic && (
        <EdgeSocket
          position={[body.width / 2 + (crownGuard?.proud ?? 0), mic.y, mic.z ?? 0]}
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
          key={`${y}:${z ?? 0}`}
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

      {pinStud && (
        // Sport Band pin-and-tuck: the twelve-o'clock strap's pin stud comes
        // up through one of the punched holes, its polished head sitting
        // flush in the opening - the only hardware the band shows.
        <group position={pinStud.position} rotation-x={pinStud.rotX}>
          {/* the post, rooted in the strap below */}
          <mesh>
            <cylinderGeometry args={[pinStud.holeRadius * 0.72, pinStud.holeRadius * 0.72, band.thickness * 2.2, 20]} />
            <meshPhysicalMaterial color="#0d0e11" metalness={0.2} roughness={0.6} envMapIntensity={0.3} />
          </mesh>
          {/* the polished head, sitting in the hole it came up through */}
          <mesh position-y={band.thickness * 0.55}>
            <cylinderGeometry args={[pinStud.holeRadius * 0.94, pinStud.holeRadius * 0.78, band.thickness * 0.55, 24]} />
            <meshPhysicalMaterial color="#b6bcc5" metalness={0.92} roughness={0.24} envMapIntensity={1.3} />
          </mesh>
        </group>
      )}

      {/* the buckle frame and tongue, in the case's metal, and the keeper -
          a second metal frame or a sleeve moulded in the band's material */}
      {hardware?.map(({ geometry, finish }, i) => (
        <mesh key={i} geometry={geometry}>
          {finish === 'metal' ? (
            // bead-blasted rather than polished: a mirror finish on bars this
            // thin flips between blown-out and black with the view
            <meshPhysicalMaterial color={color} metalness={0.8} roughness={0.42} envMapIntensity={1.2} />
          ) : (
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
          )}
        </mesh>
      ))}

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
   * Which Apple Watch to render: `series11` (Series 11, 46 mm - the default),
   * `series12` (Series 12, 46 mm - the same case, the generation's finishes)
   * or `ultra4` (Apple Watch Ultra 4, 49 mm - the titanium case with the
   * raised lip, the crown guard and the orange Action button, the Ultra 3's
   * case).
   */
  variant?: AppleWatchVariant
}

/**
 * A procedurally built Apple Watch - the Series 11 or Series 12's 46 mm
 * squircle case, or the Ultra 4's 49 mm titanium one, chosen with `variant`:
 * the knurled Digital Crown, the flush side button, an edge-to-edge crystal
 * over the display, and the optical sensor back sunk flush into a body-colour
 * plate. The Ultra adds the raised crown guard round a coarsely lobed crown,
 * the orange Action button and speaker grille on the left flank, a flat
 * crystal in a raised lip over tighter corners, and a ceramic sensor dome.
 *
 * The Series wear the Solo Loop - ONE seamless stretchy band with no closure,
 * no adjustment holes and no hardware, flaring into the lug slots at both
 * ends - and the Ultra its ridged Ocean Band on a titanium buckle and loop.
 * Neither unfastens here, so unlike `<GalaxyWatch>` this takes no `bandOpen`.
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
   * Which Galaxy Watch to render: `watch8` (Galaxy Watch 8, 44 mm cushion
   * case - the default), `watch9` (Galaxy Watch 9, 44 mm - the same case,
   * new internals) or `watchultra2` (Galaxy Watch Ultra 2, 47 mm titanium
   * cushion squircle with the orange Quick Button and a wider strap).
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
 * A procedurally built Samsung Galaxy Watch - the Watch 8 or Watch 9's 44 mm
 * aluminium cushion case, or the Watch Ultra 2's 47 mm titanium one, chosen
 * with `variant`: the fully round display raised on its dial puck, flat
 * chamfered keys (the Ultra 2 adds its orange Quick Button), machined speaker
 * slots, and the BioActive sensor puck standing proud of the back.
 *
 * It wears the Sport Band: two straps closing with a buckle in the case's
 * metal and a keeper over a row of punched adjustment holes, sized from the
 * retail fit range. `bandOpen` lays that band out flat instead of wearing it.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 */
function GalaxyWatchImpl({ variant = GALAXY_WATCH_DEFAULT_VARIANT, ...props }: GalaxyWatchProps) {
  return <WatchBody variant={variant} catalog={GALAXY_WATCH_COLORWAYS[variant]} {...props} />
}
GalaxyWatchImpl.displayName = 'GalaxyWatch'

export const GalaxyWatch = Object.assign(GalaxyWatchImpl, watchSlots)
