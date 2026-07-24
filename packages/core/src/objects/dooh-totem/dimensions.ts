/**
 * DOOH totem object dimensions — a digital street kiosk / totem.
 *
 * Proportions follow the JCDecaux/Clear Channel digital 6-sheet class: a
 * ~1.3 m wide, ~2.8 m tall, ~0.35 m deep rounded enclosure on a low plinth,
 * holding a portrait 75"-class LCD (~940 x 1670 mm active area) behind
 * glass. Normalized to ~700 mm per world unit so the totem stands 4 units
 * tall. The screen is a live 540x960 DOM surface (a 1080x1920 grid at 2x).
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming, RegionSpec } from '../../regions'

/** World units per millimeter for the DOOH totem. */
export const DOOH_TOTEM_MM = 1 / 700

/** Physical enclosure size overrides in millimeters. */
export interface DoohTotemSize {
  /** Enclosure width. Default 1300 mm. */
  width?: number
  /** Enclosure height. Default 2800 mm. */
  height?: number
}

/**
 * Build a DOOH totem spec for any enclosure size (millimeters). The default
 * is the JCDecaux/Clear Channel digital 6-sheet class (1300 x 2800 mm). The
 * bezels, louvres and plinth keep their real-world dimensions; the glass and
 * active display scale with the enclosure (so the display aspect follows the
 * cabinet — a 9:16 portrait at the default size).
 */
export function doohTotemSpec({ width = 1300, height = 2800 }: DoohTotemSize = {}) {
  const w = width * DOOH_TOTEM_MM
  const h = height * DOOH_TOTEM_MM
  const glassW = w - 0.197
  const glassH = h - 0.9
  return {
    /** Rounded enclosure. `radius` is the corner radius, `bevel` the edge rounding. */
    body: { width: w, height: h, depth: 0.5, radius: 0.24, bevel: 0.03 },
    /** Dark cover glass inset into the enclosure front (and back). */
    glass: { width: glassW, height: glassH, radius: 0.14 },
    /** Active display area. Content maps onto this rect. */
    display: { width: glassW - 0.317, height: glassH - 0.713, radius: 0.02 },
    /** Full-width kick plinth at the pavement — the enclosure runs straight into it. */
    plinth: { width: w + 0.043, height: 0.24, depth: 0.56 },
    /** Ventilation louvre bands above and below the glass (~120 mm tall). */
    louvre: { width: w - 0.357, height: 0.171, y: h / 2 - 0.22 },
    /** Distance from the enclosure center down to the pavement. */
    standHeight: h / 2 + 0.12,
    /** Default CSS px width of the virtual display (a 1080x1920 grid at 2x). */
    resolution: 540,
  }
}

export type DoohTotemSpec = ReturnType<typeof doohTotemSpec>

/** The default 1300 x 2800 mm digital 6-sheet totem. */
export const DOOH_TOTEM: DoohTotemSpec = doohTotemSpec()

/** Display aspect ratio (height / width) — portrait 9:16 at the default size. */
export const DOOH_TOTEM_ASPECT = DOOH_TOTEM.display.height / DOOH_TOTEM.display.width

/** Live regions: the two displays — real totems are double-sided. */
export const DOOH_TOTEM_REGIONS = [
  { name: 'front', label: 'Front display' },
  { name: 'back', label: 'Back display' },
] as const satisfies readonly RegionSpec[]

/** The plinth defines the pavement, `standHeight` below the enclosure center. */
export const DOOH_TOTEM_FRAMING = {
  camera: { position: [0, 0.4, 9.2], fov: 40 },
  floatIntensity: 0.4,
  extent: ({ size }) => (size ? doohTotemSpec(size) : DOOH_TOTEM).standHeight,
} as const satisfies MockupFraming<{ size?: DoohTotemSize }>
