/**
 * Watch device dimensions - Apple Watch Series 11 and Samsung Galaxy Watch 8.
 *
 * Both variants share one world scale (~17.7 mm per unit) so they keep true
 * relative sizes side by side:
 *
 * - Apple Watch Series 11, 46 mm: 46 x 39 x 9.7 mm squircle case, ~1.96"
 *   416x496 wide-angle OLED with heavily rounded corners. Right edge, top to
 *   bottom (per Apple's product photography): knurled Digital Crown (~7.3 mm
 *   gear-toothed barrel with a flat end cap, protruding ~2 mm), a single
 *   microphone hole, then the elongated flush side button sitting in a
 *   machined recess below center. Left edge: a fine perforated speaker
 *   grille. The Solo Loop slides into dark band slots in the case's flat
 *   top/bottom edges, offset toward the case back.
 * - Galaxy Watch 8, 44 mm: 46.0 x 43.7 x 8.6 mm "cushion" case (squircle
 *   aluminum armor with a flat top) carrying a RAISED round dial - the fully
 *   round 1.47" 480x480 sAMOLED sits on a slightly protruding black puck, so
 *   the aluminum cushion stays visible around it (unlike the Apple's
 *   edge-to-edge crystal). Right edge (per GSMArena's review macros): two
 *   raised pill keys with chamfered edges straddling a tiny microphone hole
 *   at center. Left edge: two short machined speaker slots in a vertical
 *   run. The Dynamic Lug band is nearly case-wide where it attaches and
 *   tapers around the wrist.
 *
 * The wristband is worn on an invisible wrist directly behind the case (a
 * ~58 x 45 mm oval, the wrist a 46 mm watch is sold for). The Apple wears the
 * Solo Loop: one seamless stretchy band with no closure, no holes and no
 * hardware, flaring into the lug slots at both ends. The Galaxy wears a
 * two-strap band closing with a pin buckle and keeper on the underside.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import { wristLoopArcLength, type WristLoop } from '../../geometry/strap'
import type { MockupFraming, MockupMetrics } from '../../regions'

export interface WatchSpec {
  /** Per-family construction: Apple squircle+crown, or Galaxy cushion+round display. */
  style: 'apple' | 'galaxy'
  /** Case. `radius` is the corner radius, `bevel` the edge rounding. */
  body: { width: number; height: number; depth: number; radius: number; bevel: number }
  /** Cover crystal. For the round Galaxy display width==height and radius==width/2. */
  glass: { width: number; height: number; radius: number }
  /** Raised round dial puck under the crystal (Galaxy cushion design only). */
  dial?: { radius: number; height: number }
  /** Active display area. Content you pass as children maps onto this rect. */
  display: { width: number; height: number; radius: number }
  /** Default CSS px width of the virtual display (the logical pt/dp grid). */
  resolution: number
  /**
   * Digital Crown on the right edge (Apple): a knurled gear-toothed barrel.
   * `thickness` is the barrel length along its axis, `proud` how far the
   * outer face protrudes past the case wall, `teeth`/`toothDepth` the
   * machined knurling crevices.
   */
  crown?: { y: number; radius: number; thickness: number; proud: number; teeth: number; toothDepth: number }
  /**
   * Keys on the right edge: Apple's flush side button (tiny `proud`, reads as
   * a pill outline in a recess), Galaxy's two raised chamfered keys. `length`
   * runs along the edge (y), `width` across the case depth (z), `proud` is
   * the protrusion past the case wall.
   */
  buttons: { y: number; length: number; width: number; proud: number }[]
  /** Microphone hole drilled into the right edge. */
  mic?: { y: number; radius: number; z?: number }
  /** Machined speaker slots in the left edge (Apple: one long; Galaxy: two short). */
  speaker: { y: number; length: number; height: number; z?: number }[]
  /**
   * Dark band-slot channel machined into the flat top/bottom case edges that
   * the strap slides into (Apple). `width`/`height` are the channel's lateral
   * size, `z` its center across the case depth (toward the back on the real
   * case).
   */
  bandSlot?: { width: number; height: number; z: number }
  /**
   * The case back's sensor cluster. Both families put an optical heart sensor
   * behind a round crystal in the middle of the back, ringed by the metal
   * electrode the ECG reads from - but they mount it differently: Apple sinks
   * the crystal flush into a back plate that matches the case colour (so the
   * watch reads as one piece of metal), while Samsung raises the whole
   * BioActive puck proud of the aluminium cushion.
   */
  back: {
    /** Crystal / puck radius. */
    radius: number
    /** How far it stands proud of the case back - negative sinks it in. */
    raise: number
    /** Central photodiode window. */
    hubRadius: number
    /** The small LED windows ringed around the hub. */
    leds: { count: number; ring: number; radius: number }
    /** Polished metal electrode ring around the crystal. */
    electrode: { inner: number; outer: number }
    /** Engraved charging-coil ring outside the electrode (Apple). */
    coilRing?: number
  }
  /**
   * Wristband. Two families, discriminated on `closure`.
   *
   * `seamless` is Apple's Solo Loop: ONE continuous stretchy band with no
   * closure, no holes and no hardware of any kind - it simply flares into the
   * lugs at both ends and is sized to the wrist rather than adjusted.
   *
   * `tuck` and `buckle` are the two-strap bands. The twelve-o'clock strap
   * carries the closure hardware and lies against the wrist; the six-o'clock
   * strap is the long one, carrying the row of punched adjustment holes,
   * lapping OVER the other past the closure - the pin or buckle tongue comes
   * up through one of its holes - and running on as a free tail.
   *
   * The loop is an ovoid (see `WristLoop`): the vertical radius eases from
   * `ryFront` at the case to `ryBack` at the far side of the wrist, `rz` is
   * the depth radius around `centerZ`, and the band emerges `startAngle`
   * degrees off the front axis so its cut ends stay buried in the case.
   * Every other angle below is measured the same way - 90° is the
   * twelve-o'clock side, 180° the underside of the wrist, 270° six o'clock.
   */
  band: WatchBand
}

/** Shared by every band, whatever its closure. */
interface WatchBandBase {
  /** Width where the band meets the case (the lug shoulder). */
  lugWidth: number
  /** Width along the band's free run. */
  width: number
  thickness: number
  /** How far the outer face domes above the nominal thickness. */
  crown: number
  loop: WristLoop
}

/** Apple's Solo Loop: one continuous band, no closure, no holes, no hardware. */
export interface SeamlessWatchBand extends WatchBandBase {
  closure: 'seamless'
}

/** A two-strap band closing with a pin-and-tuck lap or a pin buckle. */
export interface FastenedWatchBand extends WatchBandBase {
  /**
   * `tuck` is the Sport Band: a pin stud on the twelve-o'clock strap comes up
   * through a hole and the tail tucks into the slot behind it. `buckle` is the
   * classic pin buckle with a keeper.
   */
  closure: 'tuck' | 'buckle'
  /** Width at the free tip - tapered straps (Galaxy's Dynamic Lug band). */
  tipWidth: number
  /** Where the twelve-o'clock strap ends, under the lapping tail (worn). */
  pinStrapEnd: number
  /** Where the six-o'clock strap's free tip ends (worn). */
  tailEnd: number
  /**
   * Adjustment holes punched clean through the six-o'clock strap, as
   * normalized positions along it (0 at the lug, 1 at the tip). Positions
   * rather than sweep angles, so the row stays ON the strap whichever pose
   * the band is in - the unbuckled pose sweeps a different arc.
   */
  holes: number[]
  /** Half-width of a hole across the strap. */
  holeRadius: number
  /**
   * Length of a hole along the strap. The Galaxy band's are elongated slots,
   * not drillings; set it equal to `holeRadius * 2` for a round hole.
   */
  holeLength: number
  /** Which hole the pin / buckle tongue engages when the band is worn. */
  closureHole: number
  /** Where the keeper sits along the six-o'clock strap, worn. */
  keeperT?: number
}

export type WatchBand = SeamlessWatchBand | FastenedWatchBand

/** Apple Watch Series 11, 46 mm. Logical resolution 208x248 pt. */
const SERIES_11: WatchSpec = {
  style: 'apple',
  body: { width: 2.203, height: 2.6, depth: 0.548, radius: 0.88, bevel: 0.12 },
  glass: { width: 2.02, height: 2.38, radius: 0.72 },
  display: { width: 1.808, height: 2.158, radius: 0.62 },
  resolution: 208,
  // Crown center ~31% down the right edge; ~7.3 mm knurled barrel, ~2 mm proud.
  crown: { y: 0.48, radius: 0.205, thickness: 0.19, proud: 0.115, teeth: 46, toothDepth: 0.0085 },
  // Flush side button in its recess, center ~62% down the edge (~10.3 x 2.8 mm).
  buttons: [{ y: -0.31, length: 0.58, width: 0.16, proud: 0.012 }],
  // Mic hole between crown and side button.
  mic: { y: 0.1, radius: 0.022 },
  // Single slim machined speaker slot on the left edge (Series 10/11 design).
  speaker: [{ y: 0, length: 0.92, height: 0.06 }],
  // Sport Band slot channel in the flat top/bottom edges, offset case-back.
  bandSlot: { width: 1.37, height: 0.24, z: -0.16 },
  // Back: aluminium matching the case, with the sensor crystal sunk flush in
  // the middle and the electrode ring around it.
  back: {
    radius: 0.6,
    raise: -0.012,
    hubRadius: 0.17,
    leds: { count: 4, ring: 0.33, radius: 0.078 },
    electrode: { inner: 0.6, outer: 0.68 },
    coilRing: 0.86,
  },
  // Solo Loop: ONE continuous stretchy band, no closure, no holes, no
  // hardware - it flares into the lug slots at both ends and is sized to the
  // wrist rather than adjusted. The loop below is a 58 x 45 mm wrist (~162 mm
  // round), which is what a Solo Loop is cut to.
  band: {
    closure: 'seamless',
    lugWidth: 1.33,
    width: 1.235,
    thickness: 0.152,
    crown: 0.05,
    loop: { ryFront: 1.78, ryBack: 1.5, rz: 1.27, centerZ: -1.05, startAngle: 30 },
  },
}

/** Galaxy Watch 8, 44 mm: cushion case, round 480x480 display (240 dp grid). */
const GALAXY_WATCH_8: WatchSpec = {
  style: 'galaxy',
  body: { width: 2.469, height: 2.599, depth: 0.486, radius: 0.92, bevel: 0.13 },
  glass: { width: 2.18, height: 2.18, radius: 1.09 },
  dial: { radius: 1.09, height: 0.07 },
  display: { width: 2.0, height: 2.0, radius: 1.0 },
  resolution: 240,
  // Two raised chamfered pill keys (~10 x 3.3 mm) straddling the mic hole.
  buttons: [
    { y: 0.4, length: 0.56, width: 0.185, proud: 0.04 },
    { y: -0.4, length: 0.56, width: 0.185, proud: 0.04 },
  ],
  mic: { y: 0.0, radius: 0.02 },
  // Back: the BioActive puck stands proud of the aluminium cushion, its
  // electrode ring split into two arcs around the optical windows.
  back: {
    radius: 0.62,
    raise: 0.055,
    hubRadius: 0.14,
    leds: { count: 4, ring: 0.3, radius: 0.068 },
    electrode: { inner: 0.44, outer: 0.56 },
  },
  // Two short machined speaker slots in a vertical run on the left edge.
  speaker: [
    { y: 0.26, length: 0.37, height: 0.05 },
    { y: -0.26, length: 0.37, height: 0.05 },
  ],
  // Dynamic Lug band: nearly case-wide where it attaches, tapering hard
  // around the wrist to a stainless pin buckle, its tongue through one of the
  // punched holes and the tail threaded back through a rubber keeper.
  band: {
    // The Dynamic Lug connector is nearly case-wide, but the strap itself is
    // the standard 20 mm (1.13 units at this scale), tapering to ~16 mm.
    lugWidth: 1.86,
    width: 1.13,
    tipWidth: 0.9,
    thickness: 0.135,
    crown: 0.038,
    closure: 'buckle',
    // Same sizing pass as the Sport Band: a 56 x 43 mm wrist (~157 mm round)
    // with ~170 mm of strap, so the tail still reaches the ~200 mm top of the
    // band's fit range and stands well past the buckle.
    pinStrapEnd: 198,
    tailEnd: 98,
    holes: [0.465, 0.527, 0.588, 0.649, 0.711, 0.772],
    holeRadius: 0.058,
    holeLength: 0.185,
    closureHole: 2,
    keeperT: 0.72,
    loop: { ryFront: 1.72, ryBack: 1.46, rz: 1.22, centerZ: -0.98, startAngle: 34 },
  },
}

/** The Apple Watch family, worn on a seamless Solo Loop. */
export const APPLE_WATCH_VARIANTS: Record<'series11', WatchSpec> = {
  series11: SERIES_11,
}

/** The Galaxy Watch family, worn on a buckled two-strap band. */
export const GALAXY_WATCH_VARIANTS: Record<'watch8', WatchSpec> = {
  watch8: GALAXY_WATCH_8,
}

export type AppleWatchVariant = keyof typeof APPLE_WATCH_VARIANTS
export type GalaxyWatchVariant = keyof typeof GALAXY_WATCH_VARIANTS

/** Every watch spec in one table - the shared framing and camera math key off it. */
export const WATCH_VARIANTS: Record<AppleWatchVariant | GalaxyWatchVariant, WatchSpec> = {
  ...APPLE_WATCH_VARIANTS,
  ...GALAXY_WATCH_VARIANTS,
}

export type WatchVariant = AppleWatchVariant | GalaxyWatchVariant

/** The variant each family's binding defaults to. */
export const APPLE_WATCH_DEFAULT_VARIANT: AppleWatchVariant = 'series11'
export const GALAXY_WATCH_DEFAULT_VARIANT: GalaxyWatchVariant = 'watch8'

/** Framing distance for the worn pose, which every variant shares. */
const WORN_DISTANCE = 7.7
const FOV = 40

/**
 * Camera distance that frames the watch in the given band pose. Laid flat the
 * band is several times the worn loop's height, so the worn distance crops it
 * badly; back off far enough that the full extent fits the vertical field with
 * a little air around it.
 */
export function watchCameraDistance(variant: WatchVariant, bandOpen: boolean): number {
  const { band } = WATCH_VARIANTS[variant]
  if (!bandOpen || band.closure === 'seamless') return WORN_DISTANCE
  const fit = watchOpenExtent(band) / Math.tan((FOV / 2) * (Math.PI / 180))
  return Math.max(WORN_DISTANCE, fit * 1.12)
}

/**
 * Grounded under the bottom of the band: the worn loop's lower edge, or the
 * tip of the longer strap when the band lies flat. The worn extent is rebased
 * −0.05 so the shared float gap reproduces the stage's original 0.25 hover
 * clearance, with the grounded line (0.05 under the strap) restored by the
 * 0.1 contact gap.
 */
/** Millimetres per world unit - the shared watch scale. */
export const WATCH_MM_PER_UNIT = 17.7

/** Live geometry of a watch display. Watches have a single pose. */
function watchRegions(variant: WatchVariant) {
  const { display, resolution } = WATCH_VARIANTS[variant]
  return {
    screen: { width: display.width, height: display.height, radius: display.radius, resolution },
  }
}

/** Live geometry of the Apple Watch display. */
export const APPLE_WATCH_METRICS = {
  mmPerUnit: WATCH_MM_PER_UNIT,
  regions: ({ variant }) => watchRegions(variant ?? APPLE_WATCH_DEFAULT_VARIANT),
} as const satisfies MockupMetrics<{ variant?: AppleWatchVariant }>

/** Live geometry of the Galaxy Watch display (round: width === height). */
export const GALAXY_WATCH_METRICS = {
  mmPerUnit: WATCH_MM_PER_UNIT,
  regions: ({ variant }) => watchRegions(variant ?? GALAXY_WATCH_DEFAULT_VARIANT),
} as const satisfies MockupMetrics<{ variant?: GalaxyWatchVariant }>

export const WATCH_FRAMING = {
  camera: { position: [0, 0.4, WORN_DISTANCE], fov: FOV },
  floatIntensity: 0.6,
  contactGap: 0.1,
  extent: ({ variant, bandOpen }) => {
    const { band } = WATCH_VARIANTS[variant ?? APPLE_WATCH_DEFAULT_VARIANT]
    // A seamless band has no closure to undo, so `bandOpen` cannot change it.
    if (bandOpen && band.closure !== 'seamless') return watchOpenExtent(band)
    return (band.loop.ryFront + band.loop.ryBack) / 2 + band.thickness / 2 - 0.05
  },
} as const satisfies MockupFraming<{ variant?: WatchVariant; bandOpen?: boolean }>

/**
 * True length of each strap, measured along the wrist loop it wraps. The worn
 * pose is what fixes a band's length - it is cut to go round a wrist - so the
 * flat pose reads its lengths from here rather than carrying its own numbers
 * that could drift out of agreement.
 */
export function watchStrapLengths(band: FastenedWatchBand): { pin: number; tail: number } {
  const { startAngle } = band.loop
  return {
    pin: wristLoopArcLength(band.loop, startAngle, band.pinStrapEnd),
    tail: wristLoopArcLength(band.loop, 360 - startAngle, band.tailEnd),
  }
}

/**
 * How far up the case's centre line a flat band's straps begin, so their cut
 * ends stay buried inside it.
 */
export const WATCH_OPEN_START_Y = 0.55

/** Half-height of the band laid flat, for framing and the contact shadow. */
export function watchOpenExtent(band: FastenedWatchBand): number {
  const { pin, tail } = watchStrapLengths(band)
  return WATCH_OPEN_START_Y + Math.max(pin, tail) + band.thickness
}
