/**
 * Business card object dimensions.
 *
 * Proportions follow the US/ISO 7810 ID-1-adjacent standard card: 89 x 51 mm
 * (3.5" x 2") on premium 32 pt (0.8 mm) stock, normalized to ~26 mm per world
 * unit so the card is 3.42 units wide — filling the default mockup stage.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming, MockupMetrics, RegionSpec } from '../../regions'

export const BUSINESS_CARD = {
  /**
   * The card itself. Premium 32 pt stock is die-cut with square corners —
   * `radius` keeps only a hair of rounding so the die never glints. (Standard
   * round-corner dies, when used, are 3.2 mm: pass `radius: 0.123` via a
   * custom spec if you need one.)
   */
  body: { width: 3.423, height: 1.962, thickness: 0.031, radius: 0.02, bevel: 0.006 },
  /** Printable face (full bleed). Content maps onto this rect on both sides. */
  face: { width: 3.423, height: 1.962, radius: 0.02 },
  /** Default CSS px width of the virtual face (~150 dpi of the physical card). */
  resolution: 520,
} as const

/** Live regions: the two faces of the card. */
export const BUSINESS_CARD_REGIONS = [
  { name: 'front', label: 'Front face' },
  { name: 'back', label: 'Back face' },
] as const satisfies readonly RegionSpec[]

/** The card grounds on its long bottom edge. */
/** Millimetres per world unit — the business-card scale. */
export const BUSINESS_CARD_MM_PER_UNIT = 26

/** Live geometry of the two full-bleed faces. */
export const BUSINESS_CARD_METRICS = {
  mmPerUnit: BUSINESS_CARD_MM_PER_UNIT,
  regions: () => {
    const { face, resolution } = BUSINESS_CARD
    const one = { width: face.width, height: face.height, radius: face.radius, resolution }
    return { front: one, back: one }
  },
} as const satisfies MockupMetrics

export const BUSINESS_CARD_FRAMING = {
  camera: { position: [0, 0.3, 5.6], fov: 40 },
  floatIntensity: 0.6,
  extent: () => BUSINESS_CARD.body.height / 2,
  contactGap: 0.05,
} as const satisfies MockupFraming
