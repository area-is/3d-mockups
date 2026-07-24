/**
 * Monitor device dimensions.
 *
 * Proportions follow the Apple Studio Display (2nd generation, March 2026 —
 * the 2022 enclosure carried over unchanged): 27" 5K 5120x2880 at 600 nits,
 * 623 x 478 x 168 mm on the tilt stand, ~19.5 mm flat-back aluminum slab
 * (362 mm tall bare), all-glass front with a uniform ~13 mm black bezel and
 * only a hairline of aluminum at the edge, centered camera, speaker
 * perforations along the bottom of the back, 2x Thunderbolt 5 + 2x USB-C in
 * a tight rear row (left of center seen from behind), the captive power
 * cord's circular recess centered low on the back, and no power button.
 * Normalized to ~115 mm per world unit, so the enclosure is 5.42 units wide.
 * Origin sits at the panel center; the desk plane is `standHeight` below it.
 *
 * The tilt stand matches the product photography (front, side and rear
 * angles): a wide (~152 mm), thin sheet arm hangs from the hinge — whose
 * machined pivot caps show on the arm's sides — about three quarters of the
 * way down the back, leans a gentle ~13° back down to the knee and runs
 * forward as a thin foot plate on small rubber pads. A single vertical
 * stadium cutout passes clean through the blade straddling the enclosure's
 * bottom edge: the panel's round power inlet shows through its upper half
 * (the dark circle in the rear photography) and the lower half is open air
 * the captive cord drops through.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming } from '../../regions'

export const MONITOR = {
  /** Aluminum enclosure (glass face). `radius` is the corner radius, `bevel` the edge rounding. */
  body: { width: 5.417, height: 3.128, depth: 0.17, radius: 0.09, bevel: 0.022 },
  /** Front cover glass — edge-to-edge, leaving only a hairline of aluminum.
   * The glass itself paints the uniform black bezel around the panel. */
  glass: { width: 5.373, height: 3.084, radius: 0.08 },
  /** Active display area. Content you pass as children maps onto this rect. */
  display: { width: 5.189, height: 2.919, radius: 0.03 },
  /** Default CSS px width of the virtual display (the 2560x1440 logical grid). */
  resolution: 2560,
  /** Distance from panel center down to the desk plane (stand height —
   * the panel's bottom edge floats ~120 mm above the desk). */
  standHeight: 2.607,
  /** Gloss-black Apple mark on the back, centered horizontally — measured
   * from the official rear photography: ~65 mm wide, glyph center ~129 mm
   * below the enclosure's top edge. */
  logo: { width: 0.562, height: 0.7, y: 0.44 },
  /**
   * Rear port row — 2x Thunderbolt 5 + 2x USB-C machined as a tight cluster
   * of VERTICAL pill slots near the bottom, left of center seen from the
   * back (the official rear photography shows four upright slots). FRONT-view
   * coordinates: `x` is the first slot's center (subsequent slots step
   * `spacing` toward the center), `y` is above the bottom edge; each slot is
   * `slot.width` x `slot.height` (~3.5 x 8.8 mm, centers ~14.5 mm apart,
   * ~29 mm up — photo-measured).
   */
  ports: { x: 5.417 / 2 - 0.866, spacing: 0.129, y: 0.243, slot: { width: 0.026, height: 0.078 } },
  /** The captive power cord's round inlet: centered horizontally on the
   * back, ~35 mm across, its center ~32 mm above the bottom edge — aligned
   * behind the upper half of the stand blade's stadium cutout. */
  power: { r: 0.152, y: 0.278 },
  /**
   * Tilt stand, proportioned from the product photos. The arm (width x
   * `thickness` cross-section) hangs from the hinge barrel (`hingeRadius`,
   * centered `attachY` up the back) leaning `leanDeg` degrees, rounds
   * through the knee at the rear (outer radius `outerKneeRadius`, inner
   * fillet `innerKneeRadius`) and runs forward as the foot plate
   * (`footThickness` tall, front lip at `footFrontZ`). The stadium
   * `cutout` is punched through the arm, its center `edgeOffset` above
   * the enclosure's bottom edge, looking onto the power inlet behind.
   */
  stand: {
    width: 1.287,
    thickness: 0.07,
    leanDeg: 13.2,
    attachY: -0.817,
    footFrontZ: 0.48,
    footThickness: 0.062,
    outerKneeRadius: 0.34,
    innerKneeRadius: 0.28,
    hingeRadius: 0.092,
    /** The blade's single vertical stadium (racetrack) cutout — ~42 x 62 mm,
     * centered, its center `edgeOffset` above the enclosure's bottom edge.
     * The panel's power inlet shows through its upper half; the lower half
     * is open air the captive cord drops through. */
    cutout: { width: 0.365, length: 0.539, edgeOffset: 0.239 },
  },
} as const

/**
 * Vertical stage lift every binding renders the monitor with: the enclosure
 * sits this far above the group origin, so the panel + stand ensemble reads
 * visually centered on the stage origin the framing's camera and shadow are
 * tuned for.
 */
export const MONITOR_STAGE_OFFSET_Y = 0.95

/** The stand base defines the desk plane; the shadow grounds just under it. */
export const MONITOR_FRAMING = {
  camera: { position: [0, 0.3, 11.2], fov: 40 },
  floatIntensity: 0.5,
  extent: () => MONITOR.standHeight - MONITOR_STAGE_OFFSET_Y,
} as const satisfies MockupFraming

/** Display aspect ratio (height / width) — the 16:9 5K panel. */
export const MONITOR_DISPLAY_ASPECT = MONITOR.display.height / MONITOR.display.width
