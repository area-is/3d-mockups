/**
 * Book object dimensions — a trade hardcover.
 *
 * Proportions follow a standard 6.14" x 9.21" (156 x 234 mm) trade hardcover,
 * 27 mm thick overall: a 22 mm page block between 2.5 mm binder's boards, with
 * a 3 mm board overhang ("squares") past the pages on the three open edges.
 * Normalized to ~56 mm per world unit so the book stands 4.18 units tall —
 * phone-sized on the default mockup stage.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming, MockupMetrics, RegionSpec } from '../../regions'

/** World units per millimeter for the book. */
export const BOOK_MM = 1 / 56

/** Physical trim size overrides in millimeters. */
export interface BookSize {
  /** Cover width. Default 156 mm (6.14"). */
  width?: number
  /** Cover height. Default 234 mm (9.21"). */
  height?: number
  /** Total closed thickness. Default 27 mm. */
  thickness?: number
}

/**
 * Build a book spec for any trim size (millimeters). The default is the
 * standard 156 x 234 x 27 mm trade hardcover; pass e.g.
 * `{ width: 216, height: 279 }` for a letter-size art book. Boards, squares
 * and joints keep their real-world dimensions regardless of trim.
 */
export function bookSpec({ width = 156, height = 234, thickness = 27 }: BookSize = {}) {
  const w = width * BOOK_MM
  const h = height * BOOK_MM
  const t = thickness * BOOK_MM
  const boardT = 0.045
  const inset = 0.054
  return {
    /** One binder's board (front or back cover). `radius` rounds the corners in the cover plane. */
    board: { width: w, height: h, thickness: boardT, radius: 0.045, bevel: 0.008 },
    /** Total closed thickness (page block + both boards). */
    thickness: t,
    /** Page block, inset from the three open edges by the board overhang. */
    pages: { width: w - inset, height: h - inset * 2, thickness: t - boardT * 2, inset },
    /** Convex cloth backbone: `bulge` is how far the half-cylinder shell projects past the boards (~2.5 mm). */
    spine: { bulge: 0.045 },
    /** French groove: a shallow recessed strip on each board along the spine joint (~7 mm wide, ~1 mm deep). */
    groove: { width: 0.125, depth: 0.018 },
    /** Headbands at the head and tail of the spine, spanning the text block. */
    headband: { radius: 0.022 },
    /** Cover art area (the whole front board). Content you pass as children maps onto this rect. */
    cover: { width: w, height: h, radius: 0.045 },
    /** Default CSS px width of the virtual cover. */
    resolution: 480,
  }
}

export type BookSpec = ReturnType<typeof bookSpec>

/** The default trade hardcover (156 x 234 x 27 mm). */
export const BOOK: BookSpec = bookSpec()

/** Live regions: front cover, back cover and the spine strip. */
export const BOOK_REGIONS = [
  { name: 'cover', label: 'Front cover' },
  { name: 'back', label: 'Back cover' },
  { name: 'spine', label: 'Spine' },
] as const satisfies readonly RegionSpec[]

/** The standing hardcover grounds on its bottom board edge. */
/** Millimetres per world unit — the book scale (`BOOK_MM` inverted). */
export const BOOK_MM_PER_UNIT = 1 / BOOK_MM

/**
 * Live geometry of the three printed faces. The spine strip is the flat crown
 * left between the two joint rolls, which is what `<Book>` prints onto — not
 * the full closed thickness.
 */
export const BOOK_METRICS = {
  mmPerUnit: BOOK_MM_PER_UNIT,
  regions: ({ size }) => {
    const spec = size ? bookSpec(size) : BOOK
    const { cover, board, thickness, spine, resolution } = spec
    const spineJoint = Math.min((spine.bulge + 0.012) * 0.95, thickness * 0.18)
    const spineWidth = thickness - spineJoint * 2
    const face = { width: cover.width, height: cover.height, radius: cover.radius, resolution }
    return {
      cover: face,
      back: face,
      spine: {
        width: spineWidth,
        height: board.height - 0.03,
        radius: 0.01,
        // the spine shares the cover's dpi
        resolution: Math.max(48, Math.round((resolution / cover.width) * spineWidth)),
      },
    }
  },
} as const satisfies MockupMetrics<{ size?: BookSize }>

export const BOOK_FRAMING = {
  camera: { position: [0, 0.5, 8], fov: 40 },
  floatIntensity: 0.8,
  extent: ({ size }) => (size ? bookSpec(size) : BOOK).board.height / 2,
  contactGap: 0.05,
} as const satisfies MockupFraming<{ size?: BookSize }>
