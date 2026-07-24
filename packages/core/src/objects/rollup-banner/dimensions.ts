/**
 * Roll-up banner object dimensions — the 850 x 2000 mm retractable
 * trade-show banner stand.
 *
 * Normalized to ~540 mm per world unit so the standing unit is ~4 units
 * tall: a floor-sitting oval-section aluminum cassette (~350 mm deep,
 * ~90 mm tall) with end caps, a rear support pole, a clamp rail across the
 * top edge, and the graphic rising out of the cassette slot. The group
 * origin is the graphic center; the floor is `standHeight` below it.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming, RegionSpec } from '../../regions'

/** World units per millimeter for the roll-up banner. */
export const ROLLUP_BANNER_MM = 1 / 540

/** Physical graphic size overrides in millimeters. */
export interface RollupBannerSize {
  /** Graphic width. Default 850 mm (the standard trade-show unit). */
  width?: number
  /** Visible graphic height. Default 2000 mm. */
  height?: number
}

/**
 * Build a roll-up banner spec for any graphic size (millimeters). The
 * default is the standard 850 x 2000 mm unit; pass e.g. `{ width: 1000 }`
 * for a wide 1000 x 2000 stand. The cassette wraps the graphic width; its
 * section and the hardware keep their real-world dimensions.
 */
export function rollupBannerSpec({ width = 850, height = 2000 }: RollupBannerSize = {}) {
  const w = width * ROLLUP_BANNER_MM
  const h = height * ROLLUP_BANNER_MM
  return {
    /** Visible graphic (the live area). Content you pass as children maps onto this rect. */
    graphic: { width: w, height: h, radius: 0.006 },
    /** Aluminum cassette base: an oval-section extrusion flat on the floor, with end caps. */
    cassette: { width: w + 0.093, depth: 0.648, height: 0.167 },
    /** Rear support pole and the top clamp rail. */
    pole: { radius: 0.022 },
    rail: { height: 0.055, depth: 0.05 },
    /** Distance from the graphic center down to the floor. */
    standHeight: h / 2 + 0.16,
    /** Default CSS px width of the virtual graphic. */
    resolution: 420,
  }
}

export type RollupBannerSpec = ReturnType<typeof rollupBannerSpec>

/** The default 850 x 2000 mm stand. */
export const ROLLUP_BANNER: RollupBannerSpec = rollupBannerSpec()

/** Graphic aspect ratio (height / width) of the default unit. */
export const ROLLUP_BANNER_ASPECT = ROLLUP_BANNER.graphic.height / ROLLUP_BANNER.graphic.width

/** Live regions: the visible graphic. */
export const ROLLUP_BANNER_REGIONS = [
  { name: 'banner', label: 'Banner' },
] as const satisfies readonly RegionSpec[]

/**
 * Vertical offset that keeps the banner (graphic + cassette) visually
 * centered on the stage origin.
 */
export const ROLLUP_BANNER_STAGE_OFFSET_Y = 0.14

/** The cassette of the (stage-offset) stand defines the floor. */
export const ROLLUP_BANNER_FRAMING = {
  camera: { position: [0, 0.4, 8.6], fov: 40 },
  floatIntensity: 0.5,
  extent: ({ size }) =>
    (size ? rollupBannerSpec(size) : ROLLUP_BANNER).standHeight - ROLLUP_BANNER_STAGE_OFFSET_Y,
} as const satisfies MockupFraming<{ size?: RollupBannerSize }>
