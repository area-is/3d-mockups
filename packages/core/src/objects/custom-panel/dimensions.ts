/**
 * Custom panel object dimensions — a flat rectangular sheet at ANY size you
 * specify in millimeters: foam board, acrylic sign, art print, table card,
 * banner blank… whatever rectangle your project needs.
 *
 * Unlike the fixed-size objects, the panel normalizes itself: the longest
 * edge always maps to `CUSTOM_PANEL.target` world units, so a 100×150 mm
 * card and a 1000×1500 mm board both fill the default stage. The mm sizes
 * still matter — they set the aspect ratio and the relative thickness.
 *
 * Live faces: front (bare children) and back.
 */

import type { MockupFraming, RegionSpec } from '../../regions'

export interface CustomSizeMm {
  /** Panel width in millimeters. */
  width: number
  /** Panel height in millimeters. */
  height: number
  /** Stock thickness in millimeters (default 5). */
  thickness?: number
}

export const CUSTOM_PANEL = {
  /** World units the longest edge normalizes to. */
  target: 4.4,
  /** Default stock thickness (mm). */
  thickness: 5,
  /** Default CSS px width of the virtual front face. */
  resolution: 560,
} as const

/** World units per millimeter for a given panel size. */
export function customPanelScale(size: CustomSizeMm): number {
  return CUSTOM_PANEL.target / Math.max(size.width, size.height)
}

/** Live regions: the two faces of the panel. */
export const CUSTOM_PANEL_REGIONS = [
  { name: 'front', label: 'Front face' },
  { name: 'back', label: 'Back face' },
] as const satisfies readonly RegionSpec[]

/** The panel stands on its bottom edge at half its (normalized) height. */
export const CUSTOM_PANEL_FRAMING = {
  camera: { position: [0, 0.5, 7.4], fov: 40 },
  floatIntensity: 0.5,
  extent: ({ size }) => (size.height * customPanelScale(size)) / 2,
} as const satisfies MockupFraming<{ size: CustomSizeMm }>
