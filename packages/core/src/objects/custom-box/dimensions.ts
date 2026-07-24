/**
 * Custom box object dimensions — a rectangular box at ANY size you specify
 * in millimeters: shipper, carton, counter display, crate… whatever
 * rectangular volume your project needs.
 *
 * Like the custom panel, the box normalizes itself: the longest edge maps
 * to `CUSTOM_BOX.target` world units, so any size fills the default stage
 * while the mm dimensions set the true proportions.
 *
 * Live faces: front (`children`), back, left, right, top and bottom.
 */

import type { MockupFraming, RegionSpec } from '../../regions'

export interface CustomBoxSizeMm {
  /** Box width in millimeters (x). */
  width: number
  /** Box height in millimeters (y). */
  height: number
  /** Box depth in millimeters (z). */
  depth: number
}

export const CUSTOM_BOX = {
  /** World units the longest edge normalizes to. */
  target: 4.4,
  /** Default CSS px width of the virtual front face; all faces share dpi. */
  resolution: 560,
} as const

/** World units per millimeter for a given box size. */
export function customBoxScale(size: CustomBoxSizeMm): number {
  return CUSTOM_BOX.target / Math.max(size.width, size.height, size.depth)
}

/** Live regions: all six faces, front first. */
export const CUSTOM_BOX_REGIONS = [
  { name: 'front', label: 'Front face' },
  { name: 'back', label: 'Back face' },
  { name: 'left', label: 'Left (−x) face' },
  { name: 'right', label: 'Right (+x) face' },
  { name: 'top', label: 'Top face' },
  { name: 'bottom', label: 'Bottom face' },
] as const satisfies readonly RegionSpec[]

/** The box sits on the ground plane at half its (normalized) height. */
export const CUSTOM_BOX_FRAMING = {
  camera: { position: [0, 1.0, 7.8], fov: 40 },
  floatIntensity: 0.5,
  extent: ({ size }) => (size.height * customBoxScale(size)) / 2,
} as const satisfies MockupFraming<{ size: CustomBoxSizeMm }>
