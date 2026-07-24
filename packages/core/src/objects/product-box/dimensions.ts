/**
 * Product box object dimensions — a standing retail carton.
 *
 * Proportions follow the classic retail-carton hero (cereal/software class):
 * 190 mm wide x 265 mm tall x 55 mm deep — a ~1:1.4 front with a shallow
 * side — normalized to ~62 mm per world unit so the box stands 4.27 units
 * tall on the default mockup stage. The tuck flap on the top face stops
 * short of the back edge, leaving the visible seam every real carton has.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming, RegionSpec } from '../../regions'

/** World units per millimeter for the product box. */
export const PRODUCT_BOX_MM = 1 / 62

export const PRODUCT_BOX = {
  /** The carton: width (x), height (y), depth (z). `radius` is the fold-edge rounding. */
  body: { width: 3.065, height: 4.274, depth: 0.887, radius: 0.008 },
  /** Tuck flap on the top face: how far it stops short of the back edge, and its lift. */
  flap: { backGap: 0.1, lift: 0.008 },
  /** Default CSS px width of the virtual front face; other faces share its dpi. */
  resolution: 480,
} as const

/** Front face aspect ratio (height / width). */
export const PRODUCT_BOX_FRONT_ASPECT = PRODUCT_BOX.body.height / PRODUCT_BOX.body.width

/** Carton size in real millimeters. */
export interface ProductBoxSizeMm {
  /** Carton width in millimeters (x). */
  width: number
  /** Carton height in millimeters (y). */
  height: number
  /** Carton depth in millimeters (z). */
  depth: number
}

/** The default retail-carton blank in millimeters. */
export const PRODUCT_BOX_SIZE_MM: ProductBoxSizeMm = { width: 190, height: 265, depth: 55 }

/** Everything the renderer needs to build a carton of a given size. */
export interface ProductBoxLayout {
  body: { width: number; height: number; depth: number; radius: number }
  flap: { backGap: number; lift: number }
}

/**
 * Carton layout in world units for a given mm size. Like the custom box,
 * the longest edge normalizes to the default stage (the default blank's
 * 4.27 unit height), so any size fills the camera while the mm dimensions
 * set the true proportions.
 */
export function productBoxLayout(size: ProductBoxSizeMm = PRODUCT_BOX_SIZE_MM): ProductBoxLayout {
  const scale = PRODUCT_BOX.body.height / Math.max(size.width, size.height, size.depth)
  const depth = size.depth * scale
  return {
    body: { width: size.width * scale, height: size.height * scale, depth, radius: PRODUCT_BOX.body.radius },
    flap: { backGap: Math.min(PRODUCT_BOX.flap.backGap, depth * 0.113), lift: PRODUCT_BOX.flap.lift },
  }
}

/** Live regions: all six panels, front first. */
export const PRODUCT_BOX_REGIONS = [
  { name: 'front', label: 'Front panel' },
  { name: 'right', label: 'Right panel' },
  { name: 'left', label: 'Left panel' },
  { name: 'top', label: 'Top panel' },
  { name: 'bottom', label: 'Bottom panel' },
  { name: 'back', label: 'Back panel' },
] as const satisfies readonly RegionSpec[]

/** The carton stands on the ground plane at half its (normalized) height. */
export const PRODUCT_BOX_FRAMING = {
  camera: { position: [0, 0.6, 8.2], fov: 40 },
  floatIntensity: 0.7,
  extent: ({ size }) => productBoxLayout(size).body.height / 2,
} as const satisfies MockupFraming<{ size?: ProductBoxSizeMm }>
