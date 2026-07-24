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
   * The twelve-o'clock strap carries the closure, the six-o'clock strap runs
   * past it and its tail is held down — never one continuous rubber ring.
   *
   * The loop is an ovoid (see `WristLoop`): the vertical radius eases from
   * `ryFront` at the case to `ryBack` at the far side of the wrist, `rz` is
   * the depth radius around `centerZ`, and both straps emerge `startAngle`
   * degrees off the front axis so their cut ends stay buried in the case.
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
     * `tuck` is Apple's Sport Band: no metal frame — the twelve-o'clock strap
     * laps over the other and a small pin stud shows on its tip.
     * `buckle` is the classic pin buckle with a keeper.
     */
    closure: 'tuck' | 'buckle'
    /** Sweep angle (deg) where the closure sits on the wrist's underside. */
    closureAngle: number
    /** How far past the closure the six-o'clock strap's tail runs (deg). */
    tailOverrun: number
    /** Adjustment holes punched along the tail, as sweep angles (deg). */
    holes: { angle: number; radius: number }[]
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
  crown: { y: 0.48, radius: 0.205, thickness: 0.19, proud: 0.115, teeth: 30, toothDepth: 0.016 },
  // Flush side button in its recess, center ~62% down the edge (~10.3 x 2.8 mm).
  buttons: [{ y: -0.31, length: 0.58, width: 0.16, proud: 0.012 }],
  // Mic hole between crown and side button.
  mic: { y: 0.1, radius: 0.022 },
  // Single slim machined speaker slot on the left edge (Series 10/11 design).
  speaker: [{ y: 0, length: 0.92, height: 0.06 }],
  // Sport Band slot channel in the flat top/bottom edges, offset case-back.
  bandSlot: { width: 1.37, height: 0.24, z: -0.16 },
  // Sport Band: fills the lug slot, narrows to a 22 mm strap, and closes with
  // the pin-and-tuck — the twelve-o'clock strap laps over the six-o'clock
  // one, its pin stud showing on the outer face.
  band: {
    lugWidth: 1.33,
    width: 1.24,
    tipWidth: 1.15,
    thickness: 0.15,
    crown: 0.045,
    closure: 'tuck',
    closureAngle: 176,
    tailOverrun: 34,
    holes: [],
    loop: { ryFront: 1.6, ryBack: 1.34, rz: 1.06, centerZ: -0.7, startAngle: 30 },
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
  // around the wrist to a classic pin buckle with a keeper.
  band: {
    lugWidth: 1.94,
    width: 1.44,
    tipWidth: 1.08,
    thickness: 0.135,
    crown: 0.038,
    closure: 'buckle',
    closureAngle: 172,
    tailOverrun: 40,
    holes: [
      { angle: 152, radius: 0.052 },
      { angle: 138, radius: 0.052 },
      { angle: 124, radius: 0.052 },
    ],
    loop: { ryFront: 1.55, ryBack: 1.3, rz: 1.0, centerZ: -0.62, startAngle: 34 },
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
  camera: { position: [0, 0.4, 6.9], fov: 40 },
  floatIntensity: 0.6,
  contactGap: 0.1,
  extent: ({ variant }) => {
    const { band } = WATCH_VARIANTS[variant ?? WATCH_DEFAULT_VARIANT]
    return (band.loop.ryFront + band.loop.ryBack) / 2 + band.thickness / 2 - 0.05
  },
} as const satisfies MockupFraming<{ variant?: WatchVariant }>
