/**
 * Storefront object dimensions — a free-standing single-story corner shop.
 *
 * Proportions follow the classic high-street shopfront: a 6 m frontage,
 * ~4.4 m deep, with the parapet just above the cornice (~3.1 m) so the
 * painted shopfront composition IS the whole elevation — no masonry band.
 * Normalized to ~1100 mm per world unit so the façade is 5.45 units wide.
 *
 * All four elevations are glazed shopfront compositions:
 * - front (+Z): display windows, transom lights, fascia sign, glazed door;
 * - the other three sides (+X, −X, −Z): the same composition without the
 *   door — windows only — each carrying its own live fascia sign.
 *
 * Live surfaces: the four fascia signs (the front `fascia` region plus
 * left/right/rear), both front display bays, the glazed door leaf and the
 * center pane of each other elevation — every elevation is mockup-able
 * (the roof is not).
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming, RegionSpec } from '../../regions'

/** World units per millimeter for the storefront. */
export const STOREFRONT_MM = 1 / 1100

export const STOREFRONT = {
  /** Overall building: width (x), height (y), depth (z). */
  body: { width: 5.455, height: 2.85, depth: 4.0 },
  /** Fascia sign band (~550 mm) sitting directly above the window head. */
  fascia: { height: 0.5, y: 1.054 },
  /** Live sign area inset in the front fascia. Content (`children`) maps here. */
  sign: { width: 4.9, height: 0.41, radius: 0.01 },
  /** Live sign areas on the side fascias (elevations along the depth). */
  sideSign: { width: 3.45, height: 0.41, radius: 0.01 },
  /** Live sign area on the rear fascia (same frontage as the front). */
  rearSign: { width: 4.9, height: 0.41, radius: 0.01 },
  /** Stall riser under the display windows, all round. */
  riser: { height: 0.545 },
  /** Display window band between riser and fascia (door bay on the front right). */
  window: { top: 0.804, doorX: 1.6, doorWidth: 0.909, mullionX: -0.65 },
  /** Flat roof cap overhanging the parapet line. */
  roof: { thickness: 0.07, overhang: 0.03 },
  /** Distance from the building center down to the pavement. */
  standHeight: 2.85 / 2,
  /** Default CSS px width of the virtual fascia signs. */
  resolution: 800,
} as const

/** Fascia sign aspect ratio (height / width). */
export const STOREFRONT_SIGN_ASPECT = STOREFRONT.sign.height / STOREFRONT.sign.width

/**
 * Live regions: the four fascia signs, both front display bays, the glazed
 * door leaf and the center pane of each windows-only elevation.
 */
export const STOREFRONT_REGIONS = [
  { name: 'fascia', label: 'Front fascia sign' },
  { name: 'frontLeft', label: 'Front-left display bay' },
  { name: 'frontRight', label: 'Front-right display bay' },
  { name: 'door', label: 'Door glass' },
  { name: 'left', label: 'Left window pane' },
  { name: 'right', label: 'Right window pane' },
  { name: 'rear', label: 'Rear window pane' },
  { name: 'leftSign', label: 'Left fascia sign' },
  { name: 'rightSign', label: 'Right fascia sign' },
  { name: 'rearSign', label: 'Rear fascia sign' },
] as const satisfies readonly RegionSpec[]

/** The façade stands on the pavement. */
export const STOREFRONT_FRAMING = {
  camera: { position: [0, 0.4, 10.6], fov: 40 },
  floatIntensity: 0.35,
  extent: () => STOREFRONT.standHeight,
} as const satisfies MockupFraming
