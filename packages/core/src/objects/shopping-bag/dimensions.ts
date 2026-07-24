/**
 * Shopping bag object dimensions — a kraft paper carrier with rope handles.
 *
 * Proportions follow a large fashion-carrier blank: 320 mm wide x 420 mm tall
 * x 140 mm gusset, with twisted-rope handles arcing over the top edge.
 * Normalized to ~95 mm per world unit so the bag stands 4.42 units tall.
 *
 * The bag is HOLLOW: four walls and a floor, an open rectangular mouth, a
 * machine-cut top edge, and side gussets that crease inward down their
 * vertical centerline. The crease is deepest at the mouth and dies to
 * nothing at the base — a standing carrier has a flat, square ("block")
 * bottom, so the footprint is a clean rectangle that the floor panel fills
 * edge to edge, with the envelope fold visible on the underside.
 *
 * Live faces: front (bare children) and back — full bleed, edge to edge.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming, RegionSpec } from '../../regions'

/** World units per millimeter for the shopping bag. */
export const SHOPPING_BAG_MM = 1 / 95

export const SHOPPING_BAG = {
  /** The bag: width (x), height (y), gusset depth (z). */
  body: { width: 3.368, height: 4.421, depth: 1.474, radius: 0.02 },
  /** Wall stock thickness (visual). */
  wall: 0.014,
  /** How far the side-gusset crease pulls inward at the mouth (it dies to
   * flat at the base). */
  gusset: 0.09,
  /** Twisted-paper handles: half-width, cord radius, vertical stretch of the
   * U, and the glued reinforcement patch inside the mouth. */
  handle: { radius: 0.84, tube: 0.046, rise: 1.3, patch: { width: 0.5, height: 0.42 } },
  /** Default CSS px width of the virtual front face. */
  resolution: 460,
} as const

/** Front face aspect ratio (height / width). */
export const SHOPPING_BAG_ASPECT = SHOPPING_BAG.body.height / SHOPPING_BAG.body.width

/** Bag size in real millimeters. */
export interface ShoppingBagSizeMm {
  /** Bag width in millimeters (x). */
  width: number
  /** Bag height in millimeters (y). */
  height: number
  /** Gusset depth in millimeters (z). */
  depth: number
}

/** The default carrier blank in millimeters. */
export const SHOPPING_BAG_SIZE_MM: ShoppingBagSizeMm = { width: 320, height: 420, depth: 140 }

/** Everything the renderer needs to build a bag of a given size. */
export interface ShoppingBagLayout {
  body: { width: number; height: number; depth: number; radius: number }
  wall: number
  gusset: number
  handle: { radius: number; tube: number; rise: number; patch: { width: number; height: number } }
}

/**
 * Bag layout in world units for a given mm size. Like the custom box, the
 * longest edge normalizes to the default stage (the default blank's 4.42
 * unit height), so any size fills the camera while the mm dimensions set
 * the true proportions. Handles, patches and the gusset crease scale with
 * the bag so small totes and deep grocery bags both read right.
 */
export function shoppingBagLayout(size: ShoppingBagSizeMm = SHOPPING_BAG_SIZE_MM): ShoppingBagLayout {
  const scale = SHOPPING_BAG.body.height / Math.max(size.width, size.height, size.depth)
  const width = size.width * scale
  const height = size.height * scale
  const depth = size.depth * scale
  return {
    body: { width, height, depth, radius: SHOPPING_BAG.body.radius },
    wall: SHOPPING_BAG.wall,
    // crease depth follows the gusset, but never folds past ~mid-panel
    gusset: Math.min(depth * 0.061, width * 0.1),
    handle: {
      radius: width * 0.2494,
      tube: Math.min(width * 0.01366, 0.06),
      rise: 1.3,
      patch: { width: width * 0.1484, height: width * 0.1247 },
    },
  }
}

/** Live regions: the two printed faces of the bag. */
export const SHOPPING_BAG_REGIONS = [
  { name: 'front', label: 'Front face' },
  { name: 'back', label: 'Back face' },
] as const satisfies readonly RegionSpec[]

/** The bag stands on the floor at half its (normalized) height. */
export const SHOPPING_BAG_FRAMING = {
  camera: { position: [0, 0.5, 8.6], fov: 40 },
  floatIntensity: 0.5,
  extent: ({ size }) => shoppingBagLayout(size).body.height / 2,
} as const satisfies MockupFraming<{ size?: ShoppingBagSizeMm }>
