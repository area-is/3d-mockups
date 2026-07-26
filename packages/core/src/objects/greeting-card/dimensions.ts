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

import type { MockupFraming, MockupMetrics, RegionSpec } from '../../regions'

export const GREETING_CARD = {
  /** One folded panel. */
  panel: { width: 2.268, height: 3.179, thickness: 0.009, radius: 0.006 },
  /** Default opening angle in degrees (display sweet spot is 60-75). */
  openAngle: 65,
  /** Default CSS px width of one virtual panel face. */
  resolution: 380,
} as const

/** Live regions: the four printable faces, front cover first. */
export const GREETING_CARD_REGIONS = [
  { name: 'front', label: 'Front cover' },
  { name: 'insideLeft', label: 'Inside left' },
  { name: 'insideRight', label: 'Inside right' },
  { name: 'back', label: 'Back cover' },
] as const satisfies readonly RegionSpec[]

/** The tent-standing card grounds on its bottom panel edges. */
/** Millimetres per world unit — shared with the book. */
export const GREETING_CARD_MM_PER_UNIT = 56

/** Live geometry of the four panels — all the same folded-card page. */
export const GREETING_CARD_METRICS = {
  mmPerUnit: GREETING_CARD_MM_PER_UNIT,
  regions: () => {
    const { panel, resolution } = GREETING_CARD
    const one = { width: panel.width, height: panel.height, radius: panel.radius, resolution }
    return { front: one, insideLeft: one, insideRight: one, back: one }
  },
} as const satisfies MockupMetrics

export const GREETING_CARD_FRAMING = {
  camera: { position: [0, 0.5, 7.6], fov: 40 },
  floatIntensity: 0.6,
  extent: () => GREETING_CARD.panel.height / 2,
} as const satisfies MockupFraming
