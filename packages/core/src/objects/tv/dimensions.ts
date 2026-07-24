/**
 * TV object dimensions — a flat-screen on splayed A-frame feet, sized by
 * its diagonal in inches (default 65").
 *
 * Proportions follow the current entry/mid 4K class (LG UT8000 / Samsung
 * DU7200 style, no brand): a 16:9 panel in a near-bezel-less enclosure
 * (~8 mm frame, ~14 mm bottom chin), thin at the edges with a shallow
 * electronics bulge low on the back, standing on two slim feet near the
 * ends — each a pair of wide-splayed struts meeting at the cabinet, the
 * shallow Λ profile of current retail stands. Normalized to ~258 mm per
 * world unit (the 65" panel is 5.6 units wide). The origin is the panel
 * center; the media-stand plane is `standHeight` below it.
 *
 * Sizing follows real product ranges rather than uniform scaling: the
 * panel scales with the diagonal, but the bezel, chin, cabinet depth and
 * port hardware stay physical, the feet keep a near-constant inset from
 * the panel ends (they bolt into the corner structure), and the foot
 * hardware itself grows only mildly across the range — measured against
 * LG UT8000 / Samsung DU7200-class product photography and spec sheets.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and
 * a future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { CameraFraming, MockupFraming } from '../../regions'

/** World units per millimeter for the TV. */
export const TV_MM = 1 / 258

/** The supported diagonal range in inches; `tvSpec` clamps into it. */
export const TV_MIN_INCHES = 32
export const TV_MAX_INCHES = 98

/** 16:9 factors: width = diagonal * 16/sqrt(337), height = diagonal * 9/sqrt(337). */
const W_FACTOR = 16 / Math.sqrt(337)
const H_FACTOR = 9 / Math.sqrt(337)

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * Build a TV spec for a diagonal in inches (clamped to
 * `TV_MIN_INCHES`..`TV_MAX_INCHES`). The default is the 65" class.
 */
export function tvSpec(inches: number = 65) {
  const d = clamp(inches, TV_MIN_INCHES, TV_MAX_INCHES)
  const mm = (v: number) => v * TV_MM
  // Active panel from the diagonal; enclosure adds the physical bezels.
  const displayW = mm(d * 25.4 * W_FACTOR)
  const displayH = mm(d * 25.4 * H_FACTOR)
  const bezel = mm(7.6)
  const chin = mm(14.6)
  const bodyW = displayW + bezel * 2
  const bodyH = displayH + bezel + chin
  const centerY = -(chin - bezel) / 2
  // Feet: near-constant inset from the panel ends; the struts grow only
  // mildly with size (a 43" and a 75" use nearly the same plastic feet).
  const footInset = mm(clamp(105 + (d - 43) * 1.1, 100, 170))
  const footHeight = mm(clamp(58 + (d - 43) * 0.4, 55, 75))
  const footSpan = mm(clamp(240 + (d - 43) * 1.6, 230, 330))
  return {
    /** Diagonal in inches after clamping. */
    inches: d,
    /**
     * Enclosure (glass face). `radius` is the corner radius, `bevel` the
     * edge rounding. The body is taller than the display band by the bottom
     * chin, so it sits `centerY` below the panel center.
     */
    body: { width: bodyW, height: bodyH, depth: 0.11, radius: 0.03, bevel: 0.012, centerY },
    /** Active display area. Content you pass as children maps onto this rect. */
    display: { width: displayW, height: displayH, radius: 0.008 },
    /** Wide, shallow electronics bulge low on the back. */
    backBulge: { width: bodyW - 0.47, height: bodyH * 0.58, depth: 0.14 },
    /**
     * Two feet near the ends: each a pair of slim struts splaying fore and
     * aft from a common ankle at the cabinet bottom — the shallow Λ of
     * current retail stands. `offsetX` is the foot centerline from the TV
     * center, `span` the fore-aft footprint on the media stand.
     */
    feet: { offsetX: bodyW / 2 - footInset, height: footHeight, span: footSpan, strutWidth: 0.058, strutDepth: 0.05 },
    /**
     * Recessed input bay on the back (right side viewed from the back):
     * HDMI x3, USB x2, LAN, optical audio, antenna coax — the entry-class
     * loadout. Positions are bay-local; the bay sits on the bulge.
     */
    portBay: { width: 0.62, height: 1.08, inset: 0.03 },
    /** Distance from panel center down to the media-stand plane. */
    standHeight: bodyH / 2 - centerY + footHeight,
    /** Default CSS px width of the virtual display (the 1920x1080 logical grid). */
    resolution: 1920,
  }
}

export type TVSpec = ReturnType<typeof tvSpec>

/** The default 65" set. */
export const TV: TVSpec = tvSpec()

/**
 * Vertical stage lift every binding renders the TV with: the cabinet sits
 * this far above the group origin, so the panel + feet ensemble reads
 * visually centered on the stage origin the framing's camera and shadow are
 * tuned for.
 */
export const TV_STAGE_OFFSET_Y = 0.5

/**
 * Default camera for a given diagonal: the stage pose for the 65" base set,
 * pulled back in proportion as a larger panel widens past it. Size-dependent,
 * so it rides beside `TV_FRAMING` rather than inside it.
 */
export function tvCameraFraming(size?: number): CameraFraming {
  const spec = size === undefined ? TV : tvSpec(size)
  return { position: [0, 0.3, 11.6 * Math.max(1, spec.body.width / TV.body.width)], fov: 40 }
}

/** The feet define the media-stand plane; the shadow grounds under them. */
export const TV_FRAMING = {
  floatIntensity: 0.5,
  extent: ({ size }) => (size === undefined ? TV : tvSpec(size)).standHeight - TV_STAGE_OFFSET_Y,
} as const satisfies MockupFraming<{ size?: number }>

/** Display aspect ratio (height / width) — the 16:9 panel. */
export const TV_DISPLAY_ASPECT = TV.display.height / TV.display.width