/**
 * Poster frame object dimensions.
 *
 * Proportions follow an 18" x 24" (457 x 610 mm) poster in a 22 mm gallery
 * frame with a 30 mm deep profile, normalized to ~140 mm per world unit so
 * the framed poster stands ~4.7 units tall on the default mockup stage.
 *
 * Like a real frame, the molding's rabbet lip overlaps the sheet 1/4"
 * (~6.4 mm) per side: `opening` is what you actually see (and what your
 * content maps onto); the sheet itself continues behind the lip.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming, RegionSpec } from '../../regions'

/** World units per millimeter for the poster frame. */
export const POSTER_FRAME_MM = 1 / 140

/** Physical poster-sheet size overrides in millimeters. */
export interface PosterFrameSize {
  /** Sheet width. Default 457 mm (18"). */
  width?: number
  /** Sheet height. Default 610 mm (24"). */
  height?: number
}

/**
 * Build a poster-frame spec for any sheet size (millimeters). The default is
 * an 18" x 24" poster; pass e.g. `{ width: 610, height: 914 }` for 24" x 36"
 * or `{ width: 594, height: 841 }` for A1. The molding profile, lip and mat
 * width keep their real-world dimensions regardless of sheet size.
 */
export function posterFrameSpec({ width = 457, height = 610 }: PosterFrameSize = {}) {
  const w = width * POSTER_FRAME_MM
  const h = height * POSTER_FRAME_MM
  const lip = 0.0457
  return {
    /** Physical poster sheet (continues behind the molding lip). */
    poster: { width: w, height: h, radius: 0.004 },
    /** Rabbet lip overlap per side — the molding covers this much sheet edge. */
    lip,
    /** Visible opening. Content you pass as children maps onto this rect. */
    opening: { width: w - lip * 2, height: h - lip * 2, radius: 0.004 },
    /** Frame molding: bar width in the frame plane, and profile depth. */
    frame: { width: 0.157, depth: 0.214, radius: 0.02, bevel: 0.012 },
    /** How far the sheet sits recessed behind the frame's front lip (~2 mm). */
    recess: 0.014,
    /** Optional matboard border width (a 2.5" gallery mat). */
    matWidth: 0.457,
    /** Default CSS px width of the virtual visible opening. */
    resolution: 540,
  }
}

export type PosterFrameSpec = ReturnType<typeof posterFrameSpec>

/** The default 18" x 24" framed poster. */
export const POSTER_FRAME: PosterFrameSpec = posterFrameSpec()

/** Visible opening aspect ratio (height / width) of the default sheet. */
export const POSTER_FRAME_ASPECT = POSTER_FRAME.opening.height / POSTER_FRAME.opening.width

/** Live regions: the poster behind the glazing. */
export const POSTER_FRAME_REGIONS = [
  { name: 'poster', label: 'Poster' },
] as const satisfies readonly RegionSpec[]

/** The framed poster grounds on the molding's bottom edge. */
export const POSTER_FRAME_FRAMING = {
  camera: { position: [0, 0.5, 8.8], fov: 40 },
  floatIntensity: 0.7,
  extent: ({ size }) => {
    const spec = size ? posterFrameSpec(size) : POSTER_FRAME
    return (spec.poster.height + spec.frame.width * 2) / 2
  },
  contactGap: 0.05,
} as const satisfies MockupFraming<{ size?: PosterFrameSize }>
