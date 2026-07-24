/**
 * Greeting card object dimensions — a folded A7 card standing like a tent.
 *
 * Proportions follow the US A7 standard: a 10" x 7" sheet folded once into
 * two 127 x 178 mm portrait panels on heavy card stock, standing partially
 * open. Normalized to ~56 mm per world unit (the book's scale) so the card
 * stands 3.18 units tall.
 *
 * Four printable faces: the front cover, the two inside faces of the spread,
 * and the back cover.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming, RegionSpec } from '../../regions'

/** World units per millimeter for the greeting card. */
export const GREETING_CARD_MM = 1 / 56

export const GREETING_CARD = {
  /** One folded panel. */
  panel: { width: 2.268, height: 3.179, thickness: 0.009, radius: 0.006 },
  /** Default opening angle in degrees (display sweet spot is 60-75). */
  openAngle: 65,
  /** Default CSS px width of one virtual panel face. */
  resolution: 380,
} as const

/** Panel aspect ratio (height / width). */
export const GREETING_CARD_ASPECT = GREETING_CARD.panel.height / GREETING_CARD.panel.width

/** Live regions: the four printable faces, front cover first. */
export const GREETING_CARD_REGIONS = [
  { name: 'front', label: 'Front cover' },
  { name: 'insideLeft', label: 'Inside left' },
  { name: 'insideRight', label: 'Inside right' },
  { name: 'back', label: 'Back cover' },
] as const satisfies readonly RegionSpec[]

/** The tent-standing card grounds on its bottom panel edges. */
export const GREETING_CARD_FRAMING = {
  camera: { position: [0, 0.5, 7.6], fov: 40 },
  floatIntensity: 0.6,
  extent: () => GREETING_CARD.panel.height / 2,
} as const satisfies MockupFraming
