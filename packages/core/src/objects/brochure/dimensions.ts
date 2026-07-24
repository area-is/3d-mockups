/**
 * Brochure object dimensions — a standing tri-fold.
 *
 * Proportions follow a US letter Z-fold: an 8.5" x 11" sheet folded into
 * three equal 93 x 216 mm panels (equal panels are correct for a zig-zag
 * Z-fold — only roll folds narrow the tuck-in panel), normalized to ~60 mm
 * per world unit so the standing brochure is 3.6 units tall. The stock
 * thickness is exaggerated a little (~0.45 mm vs ~0.2 mm for 100 lb cover)
 * so the paper edge still reads at mockup scale.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming, RegionSpec } from '../../regions'

/** World units per millimeter for the brochure. */
export const BROCHURE_MM = 1 / 60

/** Physical panel size overrides in millimeters. */
export interface BrochureSize {
  /** One folded panel's width. Default 93.1 mm (a letter sheet / 3). */
  width?: number
  /** Panel height. Default 215.9 mm (letter). */
  height?: number
}

/**
 * Build a brochure spec for any panel size (millimeters). The default is a
 * US letter Z-fold (three equal 93 x 216 mm panels); pass e.g.
 * `{ width: 99, height: 210 }` for an A4 tri-fold.
 */
export function brochureSpec({ width = 93.1, height = 215.9 }: BrochureSize = {}) {
  return {
    /** One folded panel. Content you pass per panel maps onto this rect. */
    panel: { width: width * BROCHURE_MM, height: height * BROCHURE_MM, thickness: 0.0075, radius: 0.008 },
    /** Number of panels in the fold. */
    panels: 3,
    /** Default zig-zag fold angle in degrees (0 would be a flat unfolded sheet). */
    foldAngle: 24,
    /** Default CSS px width of one virtual panel. */
    resolution: 360,
  }
}

export type BrochureSpec = ReturnType<typeof brochureSpec>

/** The default US letter Z-fold. */
export const BROCHURE: BrochureSpec = brochureSpec()

/** Panel aspect ratio (height / width) of the default sheet. */
export const BROCHURE_PANEL_ASPECT = BROCHURE.panel.height / BROCHURE.panel.width

/** Live regions: one repeating panel slot (front and back faces via `side`). */
export const BROCHURE_REGIONS = [
  { name: 'panel', label: 'Panel', repeats: true },
] as const satisfies readonly RegionSpec[]

/** The standing brochure grounds on its bottom paper edge. */
export const BROCHURE_FRAMING = {
  camera: { position: [0, 0.5, 8.4], fov: 40 },
  floatIntensity: 0.7,
  extent: ({ size }) => (size ? brochureSpec(size) : BROCHURE).panel.height / 2,
} as const satisfies MockupFraming<{ size?: BrochureSize }>
