/**
 * Apple Studio Display (2nd generation, 2026 — the 2022 enclosure carried
 * over): 27" 5K 5120x2880 at 218 ppi and 600 nits, 623 x 478 x 168 mm on the
 * tilt-adjustable stand, a ~19.5 mm flat-back aluminum slab standing 362 mm
 * bare (Apple's own VESA-configuration height), all-glass front with a uniform
 * ~13 mm black bezel over only a hairline of aluminum, centered camera,
 * 2x Thunderbolt 5 + 2x USB-C in a tight rear row left of center seen from
 * behind, the captive power cord's circular inlet centered low on the back,
 * and no power button.
 *
 * Every number below is measured off Apple's own imagery rather than
 * eyeballed: the official side-view illustration from the stand-adjustment
 * support guide (its 761 px height scales exactly to the published 478 mm, so
 * one pixel is 0.629 mm) for the profile, and the 2026 rear and front product
 * shots (panel width 623 mm as the ruler) for everything on the back.
 * Normalized to ~115 mm per world unit, so the enclosure is 5.42 units wide.
 * Origin sits at the panel center; the desk plane is `standHeight` below it.
 *
 * The tilt stand is a 152.5 mm wide, 6.5 mm thin sheet arm hanging from its
 * hinge 89 mm below the panel center — the machined pivot caps show on the
 * arm's sides — leaning 13° back over a long, thin (6.9 mm) foot plate whose
 * rounded ends reach 66 mm ahead of the panel and 101 mm behind it: the
 * published 168 mm depth, with the arm landing near the plate's rear on small
 * fillets rather than a heel. A single vertical stadium cutout passes clean
 * through the arm straddling the enclosure's bottom edge: the panel's round
 * power inlet shows through its upper half (the dark circle in the rear
 * photography) and the lower half is open air the captive cord drops through.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming } from '../../regions'

export const STUDIO_DISPLAY = {
  /** Aluminum enclosure (glass face). `radius` is the corner radius, `bevel` the edge rounding. */
  body: { width: 5.417, height: 3.148, depth: 0.17, radius: 0.09, bevel: 0.022 },
  /** Front cover glass — edge-to-edge, leaving only a hairline of aluminum.
   * The glass itself paints the uniform black bezel around the panel. */
  glass: { width: 5.373, height: 3.104, radius: 0.08 },
  /** Active display area. Content you pass as children maps onto this rect. */
  display: { width: 5.189, height: 2.919, radius: 0.03 },
  /** Default CSS px width of the virtual display (the 2560x1440 logical grid). */
  resolution: 2560,
  /** Distance from panel center down to the desk plane: 297.3 mm, so the
   * panel's bottom edge floats 116 mm above the desk and the whole assembly
   * stands 478 mm tall, exactly as published. */
  standHeight: 2.585,
  /** Gloss-black Apple mark on the back, centered horizontally — measured off
   * the official rear photography: 67 x 83 mm, glyph center 50 mm above the
   * panel's center line (130 mm below its top edge). */
  logo: { width: 0.583, height: 0.724, y: 0.437 },
  /**
   * Rear port row — 2x Thunderbolt 5 + 2x USB-C machined as a tight cluster
   * of VERTICAL pill slots near the bottom, left of center seen from the
   * back (the official rear photography shows four upright slots). FRONT-view
   * coordinates: `x` is the first slot's center (subsequent slots step
   * `spacing` toward the center), `y` is above the bottom edge; each slot is
   * `slot.width` x `slot.height` (~3.5 x 8.8 mm, centers ~14.5 mm apart,
   * ~29 mm up — photo-measured).
   *
   * `thunderbolt` marks the LAST `count` slots of that run — the ones nearest
   * the panel's center, i.e. the rightmost pair seen from behind, exactly as
   * on the hardware. Each wears the bolt above it, and the upstream (host)
   * port, the innermost one, adds a dot below. Both are sized and placed off
   * Apple's own rear-port callout: the bolt is 0.6 slot wide and 0.44 slot
   * tall, its center 0.57 slots above the slot's top edge, and the dot is a
   * 0.13-slot circle 0.44 slots below the bottom edge.
   */
  ports: {
    x: 5.417 / 2 - 0.813,
    spacing: 0.13,
    y: 0.243,
    slot: { width: 0.03, height: 0.078 },
    thunderbolt: {
      count: 2,
      icon: { width: 0.018, height: 0.0343, offset: 0.0444 },
      dot: { r: 0.0051, offset: 0.0343 },
    },
  },
  /** The captive power cord's round inlet: centered horizontally on the
   * back, ~35 mm across, its center ~32 mm above the bottom edge — aligned
   * behind the upper half of the stand blade's stadium cutout. */
  power: { r: 0.152, y: 0.278 },
  /**
   * Tilt stand, measured off Apple's side-view illustration. The arm (width x
   * `thickness` cross-section, 152.5 x 6.5 mm) hangs from the hinge barrel
   * (`hingeRadius` 9.4 mm, centered `attachY` = 89 mm below the panel center)
   * leaning `leanDeg` back, and meets a thin foot plate (`footThickness`
   * 6.9 mm) whose rounded lips sit at `footFrontZ` and `footBackZ` — 66 mm
   * ahead of the panel and 101 mm behind it, the published 168 mm depth. The
   * arm lands 74 mm behind the panel, a quarter of the way in from the plate's
   * rear lip, blended by small fillets (`backFillet` behind it,
   * `frontFillet` ahead) rather than the heel a big knee radius would give.
   * The stadium `cutout` is punched through the arm, its center `edgeOffset`
   * above the enclosure's bottom edge, looking onto the power inlet behind.
   */
  stand: {
    width: 1.326,
    thickness: 0.057,
    leanDeg: 13,
    attachY: -0.776,
    footFrontZ: 0.574,
    footBackZ: -0.88,
    footThickness: 0.06,
    backFillet: 0.075,
    frontFillet: 0.11,
    hingeRadius: 0.082,
    /** The blade's single vertical stadium (racetrack) cutout — 40 x 58 mm,
     * centered, its center `edgeOffset` above the enclosure's bottom edge.
     * The panel's power inlet shows through its upper half; the lower half
     * is open air the captive cord drops through. */
    cutout: { width: 0.348, length: 0.505, edgeOffset: 0.17 },
  },
} as const

/**
 * Vertical stage lift every binding renders the monitor with: the enclosure
 * sits this far above the group origin, so the panel + stand ensemble reads
 * visually centered on the stage origin the framing's camera and shadow are
 * tuned for.
 */
export const STUDIO_DISPLAY_STAGE_OFFSET_Y = 0.95

/** The stand base defines the desk plane; the shadow grounds just under it. */
export const STUDIO_DISPLAY_FRAMING = {
  camera: { position: [0, 0.3, 11.2], fov: 40 },
  floatIntensity: 0.5,
  extent: () => STUDIO_DISPLAY.standHeight - STUDIO_DISPLAY_STAGE_OFFSET_Y,
} as const satisfies MockupFraming
