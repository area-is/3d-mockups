/**
 * Watch device dimensions — Apple Watch Series 11 and Samsung Galaxy Watch 8.
 *
 * Both variants share one world scale (~17.7 mm per unit) so they keep true
 * relative sizes side by side:
 *
 * - Apple Watch Series 11, 46 mm: 46 x 39 x 9.7 mm squircle case, ~1.96"
 *   416x496 wide-angle OLED with heavily rounded corners. Right edge, top to
 *   bottom (per Apple's product photography): knurled Digital Crown (~7.3 mm
 *   gear-toothed barrel with a flat end cap, protruding ~2 mm), a single
 *   microphone hole, then the elongated flush side button sitting in a
 *   machined recess below center. Left edge: one slim machined speaker slot.
 *   The Sport Band slides into dark band slots in the case's flat top/bottom
 *   edges, offset toward the case back.
 * - Galaxy Watch 8, 44 mm: 46.0 x 43.7 x 8.6 mm "cushion" case (squircle
 *   aluminum armor with a flat top) carrying a RAISED round dial — the fully
 *   round 1.47" 480x480 sAMOLED sits on a slightly protruding black puck, so
 *   the aluminum cushion stays visible around it (unlike the Apple's
 *   edge-to-edge crystal). Right edge (per GSMArena's review macros): two
 *   raised pill keys with chamfered edges straddling a tiny microphone hole
 *   at center. Left edge: two short machined speaker slots in a vertical
 *   run. The Dynamic Lug band is nearly case-wide where it attaches and
 *   tapers around the wrist.
 *
 * The wristband is worn on an invisible wrist directly behind the case
 * (product photos show the strap peeking only a few mm past the case outline,
 * wrist oval ~55 x 40 mm). It is two straps, not a ring: each leaves the case
 * through the band slot in its edge, and they meet at a closure on the
 * underside of the wrist — pin-and-tuck on the Sport Band, pin buckle and
 * keeper on the Galaxy band.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { WristLoop } from '../../geometry/strap'
import type { MockupFraming } from '../../regions'

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
   * Wristband, worn on an invisible wrist: TWO straps, like the real product.
   *
   * Both bands work the same way. The **twelve-o'clock strap** carries the
   * closure hardware (Apple's pin stud, Samsung's buckle frame) and lies
   * against the wrist. The **six-o'clock strap** is the long one: it carries
   * the row of punched adjustment holes, laps OVER the twelve-o'clock strap
   * past the closure — the pin comes up through one of its holes — and runs
   * on as a free tail. It is never one continuous rubber ring, and the tail
   * is long: on the retail product it reaches most of the way back round.
   *
   * The loop is an ovoid (see `WristLoop`): the vertical radius eases from
   * `ryFront` at the case to `ryBack` at the far side of the wrist, `rz` is
   * the depth radius around `centerZ`, and both straps emerge `startAngle`
   * degrees off the front axis so their cut ends stay buried in the case.
   * Every other angle below is measured the same way — 90° is the
   * twelve-o'clock side, 180° the underside of the wrist, 270° six o'clock.
   */
  band: {
    /** Width where the strap meets the case (the lug shoulder). */
    lugWidth: number
    /** Width along the strap's free run. */
    width: number
    /** Width at the free tip — tapered straps (Galaxy's Dynamic Lug band). */
    tipWidth: number
    thickness: number
    /** How far the outer face domes above the nominal thickness. */
    crown: number
    /**
     * `tuck` is Apple's Sport Band: no metal frame — a pin stud on the
     * twelve-o'clock strap comes up through a hole and the tail tucks into
     * the slot behind it. `buckle` is the classic pin buckle with a keeper.
     */
    closure: 'tuck' | 'buckle'
    /** Where the twelve-o'clock strap ends, under the lapping tail (worn). */
    pinStrapEnd: number
    /** Where the six-o'clock strap's free tip ends (worn). */
    tailEnd: number
    /**
     * Adjustment holes punched clean through the six-o'clock strap, as
     * normalized positions along it (0 at the lug, 1 at the tip). Positions
     * rather than sweep angles, so the row stays ON the strap whichever pose
     * the band is in — the unbuckled pose sweeps a different arc.
     */
    holes: number[]
    holeRadius: number
    /** Which hole the pin / buckle tongue engages when the band is worn. */
    closureHole: number
    /** Where the keeper sits along the six-o'clock strap, worn. */
    keeperT?: number
    /**
     * How much the loop opens out when the band is unbuckled: the straps keep
     * their length and the oval grows, so the two ends part instead of
     * overlapping — the relaxed curl of a product shot.
     */
    openScale: number
    loop: WristLoop
  }
}

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
  // Sport Band: fills the lug slot, narrows to a 22 mm strap, and closes
  // pin-and-tuck — six evenly spaced adjustment holes punched through the
  // long strap, the twelve-o'clock strap's pin coming up through the middle
  // one, and a long tail running on past it.
  band: {
    lugWidth: 1.33,
    width: 1.24,
    tipWidth: 1.16,
    thickness: 0.15,
    crown: 0.045,
    closure: 'tuck',
    // Sized from the retail fit range, not eyeballed. The loop below is a
    // 58 x 45 mm wrist (~162 mm round); the 46 mm M/L Sport Band fits up to
    // 210 mm, so the two straps carry ~183 mm of material — 300 deg to wrap
    // the wrist plus ~105 deg of tail past the closure. Apple's two pieces
    // are unequal: the pin strap is the short one, roughly 40 / 60.
    pinStrapEnd: 192,
    tailEnd: 86,
    holes: [0.476, 0.534, 0.591, 0.649, 0.706, 0.764],
    holeRadius: 0.112,
    closureHole: 2,
    openScale: 1.35,
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
  // Two short machined speaker slots in a vertical run on the left edge.
  speaker: [
    { y: 0.26, length: 0.37, height: 0.05 },
    { y: -0.26, length: 0.37, height: 0.05 },
  ],
  // Dynamic Lug band: nearly case-wide where it attaches, tapering hard
  // around the wrist to a stainless pin buckle, its tongue through one of the
  // punched holes and the tail threaded back through a rubber keeper.
  band: {
    lugWidth: 1.94,
    width: 1.42,
    tipWidth: 1.06,
    thickness: 0.135,
    crown: 0.038,
    closure: 'buckle',
    // Same sizing pass as the Sport Band: a 56 x 43 mm wrist (~157 mm round)
    // with ~170 mm of strap, so the tail still reaches the ~200 mm top of the
    // band's fit range and stands well past the buckle.
    pinStrapEnd: 198,
    tailEnd: 98,
    holes: [0.465, 0.527, 0.588, 0.649, 0.711, 0.772],
    holeRadius: 0.072,
    closureHole: 2,
    keeperT: 0.72,
    openScale: 1.32,
    loop: { ryFront: 1.72, ryBack: 1.46, rz: 1.22, centerZ: -0.98, startAngle: 34 },
  },
}

export const WATCH_VARIANTS: Record<'series11' | 'watch8', WatchSpec> = {
  series11: SERIES_11,
  watch8: GALAXY_WATCH_8,
}

export type WatchVariant = keyof typeof WATCH_VARIANTS

/** The variant every binding defaults to. */
export const WATCH_DEFAULT_VARIANT: WatchVariant = 'series11'

/**
 * Grounded under the bottom of the worn band loop. The extent is rebased
 * −0.05 so the shared float gap reproduces the stage's original 0.25 hover
 * clearance, with the grounded line (0.05 under the strap) restored by the
 * 0.1 contact gap.
 */
export const WATCH_FRAMING = {
  camera: { position: [0, 0.4, 7.7], fov: 40 },
  floatIntensity: 0.6,
  contactGap: 0.1,
  extent: ({ variant }) => {
    const { band } = WATCH_VARIANTS[variant ?? WATCH_DEFAULT_VARIANT]
    return (band.loop.ryFront + band.loop.ryBack) / 2 + band.thickness / 2 - 0.05
  },
} as const satisfies MockupFraming<{ variant?: WatchVariant }>
