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

import type { MockupFraming, MockupMetrics, RegionSpec } from '../../regions'

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
/**
 * Millimetres per world unit. The box's longest edge always maps to
 * `CUSTOM_BOX.target`, so the scale depends on the size you asked for.
 */
export function customBoxMmPerUnit(size: CustomBoxSizeMm): number {
  return 1 / customBoxScale(size)
}

/** Live geometry of all six faces at the requested millimetre size. */
export const CUSTOM_BOX_METRICS = {
  mmPerUnit: ({ size }) => customBoxMmPerUnit(size),
  regions: ({ size }) => {
    const scale = customBoxScale(size)
    const w = size.width * scale
    const h = size.height * scale
    const d = size.depth * scale
    // every face shares the front face's dpi, so print density is uniform
    const pxPerUnit = CUSTOM_BOX.resolution / w
    const face = (width: number, height: number) => ({
      width,
      height,
      radius: 0,
      resolution: Math.round(width * pxPerUnit),
    })
    return {
      front: face(w, h),
      back: face(w, h),
      left: face(d, h),
      right: face(d, h),
      top: face(w, d),
      bottom: face(w, d),
    }
  },
} as const satisfies MockupMetrics<{ size: CustomBoxSizeMm }>

export const CUSTOM_BOX_FRAMING = {
  camera: { position: [0, 1.0, 7.8], fov: 40 },
  floatIntensity: 0.5,
  extent: ({ size }) => (size.height * customBoxScale(size)) / 2,
} as const satisfies MockupFraming<{ size: CustomBoxSizeMm }>
