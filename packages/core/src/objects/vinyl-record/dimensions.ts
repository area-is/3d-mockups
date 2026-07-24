/**
 * Vinyl record object dimensions — a 12" LP half-out of its sleeve.
 *
 * Proportions follow the real thing: a 313 mm square jacket ~4 mm thick, and
 * a 302 mm disc with a 100 mm center label, peeking out of the sleeve far
 * enough that the whole label sits clear of the jacket edge. Normalized to
 * ~92 mm per world unit so the jacket is 3.4 units square. The disc label is
 * a live circular DOM area (like the round Galaxy Watch face); the cover and
 * back are live too.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming, RegionSpec } from '../../regions'

/** World units per millimeter for the vinyl record. */
export const VINYL_RECORD_MM = 1 / 92

export const VINYL_RECORD = {
  /** Square jacket. `radius` softens the corners a hair. */
  sleeve: { size: 3.402, thickness: 0.043, radius: 0.01 },
  /** The disc: vinyl radius, thickness, label/dead-wax radii, and the
   * standard 7.24 mm diameter spindle hole. */
  disc: { radius: 1.641, thickness: 0.022, labelRadius: 0.543, deadWaxRadius: 0.62, spindleRadius: 0.039 },
  /** White paper inner sleeve, slightly smaller than the jacket. */
  innerSleeve: { size: 3.35, thickness: 0.006 },
  /** Fraction of the disc exposed past the sleeve edge. 70% clears the whole
   * label past the jacket with margin — the DOM label must never overlap the
   * DOM cover, since CSS3D layers can't depth-sort against each other. */
  discPeek: 0.7,
  /** Default CSS px width of the virtual cover; the label shares its dpi. */
  resolution: 520,
} as const

/** Cover aspect ratio (height / width) — square. */
export const VINYL_RECORD_ASPECT = 1

/** Live regions: the jacket's two faces and the disc's two center labels. */
export const VINYL_RECORD_REGIONS = [
  { name: 'cover', label: 'Cover' },
  { name: 'back', label: 'Back cover' },
  { name: 'label', label: 'Side A label' },
  { name: 'backLabel', label: 'Side B label' },
] as const satisfies readonly RegionSpec[]

/** The upright jacket grounds on its bottom edge. */
export const VINYL_RECORD_FRAMING = {
  camera: { position: [0, 0.4, 8.4], fov: 40 },
  floatIntensity: 0.7,
  extent: () => VINYL_RECORD.sleeve.size / 2,
  contactGap: 0.05,
} as const satisfies MockupFraming
