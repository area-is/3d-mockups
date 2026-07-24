/**
 * Magazine object dimensions — a perfect-bound glossy monthly.
 *
 * Proportions follow a standard US letter-trim magazine: 216 x 279 mm with a
 * ~6 mm perfect-bound page block (roughly a 100-page issue), normalized to
 * ~66 mm per world unit so the magazine stands 4.23 units tall on the default
 * mockup stage.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming, RegionSpec } from '../../regions'

/** World units per millimeter for the magazine. */
export const MAGAZINE_MM = 1 / 66

/** Physical trim size overrides in millimeters. */
export interface MagazineSize {
  /** Trim width. Default 216 mm (US letter). */
  width?: number
  /** Trim height. Default 279 mm. */
  height?: number
  /** Page-block thickness. Default 6 mm (~100 pages). */
  thickness?: number
}

/**
 * Build a magazine spec for any trim size (millimeters). The default is the
 * US letter-trim monthly; pass e.g. `{ width: 210, height: 297 }` for A4.
 */
export function magazineSpec({ width = 216, height = 279, thickness = 6 }: MagazineSize = {}) {
  const w = width * MAGAZINE_MM
  const h = height * MAGAZINE_MM
  return {
    /** Trimmed page block — real guillotine cuts are near-square, so the edge
     * rounding is just enough to catch a highlight. */
    body: { width: w, height: h, thickness: thickness * MAGAZINE_MM, radius: 0.003 },
    /** Cover art area (the whole front). Content you pass as children maps onto this rect. */
    cover: { width: w, height: h, radius: 0.008 },
    /** Default CSS px width of the virtual cover. */
    resolution: 480,
  }
}

export type MagazineSpec = ReturnType<typeof magazineSpec>

/** The default US letter-trim monthly (216 x 279 x 6 mm). */
export const MAGAZINE: MagazineSpec = magazineSpec()

/** Cover aspect ratio (height / width) of the default trim. */
export const MAGAZINE_COVER_ASPECT = MAGAZINE.cover.height / MAGAZINE.cover.width

/** Live regions: front cover, back cover and the bound-edge spine strip. */
export const MAGAZINE_REGIONS = [
  { name: 'cover', label: 'Front cover' },
  { name: 'back', label: 'Back cover' },
  { name: 'spine', label: 'Spine' },
] as const satisfies readonly RegionSpec[]

/** The standing magazine grounds on its bottom trim edge. */
export const MAGAZINE_FRAMING = {
  camera: { position: [0, 0.5, 8.2], fov: 40 },
  floatIntensity: 0.8,
  extent: ({ size }) => (size ? magazineSpec(size) : MAGAZINE).body.height / 2,
  contactGap: 0.05,
} as const satisfies MockupFraming<{ size?: MagazineSize }>
