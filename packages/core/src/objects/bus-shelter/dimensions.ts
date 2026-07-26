/**
 * Bus shelter object dimensions — a glass transit shelter with a backlit
 * 6-sheet advertising lightbox.
 *
 * Proportions follow the JCDecaux-class street shelter: ~4.3 m wide, 2.5 m
 * tall, 1.45 m deep — flat roof slab on slim posts, full-width glass back
 * wall, a bench, and the 6-sheet lightbox (1185 x 1750 mm poster) standing
 * as the end panel. Normalized to ~700 mm per world unit so the shelter
 * stands 3.57 units tall. The poster is live DOM on both faces of the
 * lightbox.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming, MockupMetrics, RegionSpec } from '../../regions'

export const BUS_SHELTER = {
  /** Overall envelope: width (x), height (y), depth (z). */
  body: { width: 6.14, height: 3.57, depth: 2.07 },
  /** Flat roof slab with a small overhang. */
  roof: { width: 6.4, thickness: 0.16, depth: 2.25 },
  /** Glass back wall — floats ~120 mm clear of the pavement, stops ~80 mm below the roof. */
  backGlass: { width: 5.9, height: 3.125, thickness: 0.035 },
  /** Slim steel posts holding the roof at the open corners. */
  post: { radius: 0.055 },
  /** Bench slab inside, along the back wall. */
  bench: { width: 3.4, depth: 0.54, thickness: 0.07, height: 0.64, x: -1.1 },
  /** 6-sheet lightbox as the end panel (faces along the sidewalk) — a near-uniform ~70 mm frame around the poster. */
  lightbox: { width: 1.9, height: 2.707, depth: 0.36, x: 6.14 / 2 - 0.18 },
  /** The 6-sheet poster (1185 x 1750 mm), live on both lightbox faces. */
  poster: { width: 1.693, height: 2.5, radius: 0.01 },
  /** Bus-stop flag: a small double-sided sign panel on a short post above the roof. */
  flag: { width: 0.643, height: 0.5, x: 2.55, postRadius: 0.028 },
  /** RTPI arrivals display (~800×300 mm) hanging under the roof, facing the street. */
  display: { width: 1.143, height: 0.429, x: -0.35, drop: 0.09, resolution: 400 },
  /** Distance from the envelope center down to the pavement. */
  standHeight: 3.57 / 2,
  /** Default CSS px width of the virtual poster. */
  resolution: 480,
} as const

/** Live regions: both lightbox faces plus the two arrivals-board faces. */
export const BUS_SHELTER_REGIONS = [
  { name: 'poster', label: '6-sheet poster' },
  { name: 'inner', label: 'Inner poster' },
  { name: 'arrivals', label: 'Arrivals board' },
  { name: 'arrivalsBack', label: 'Arrivals board (back)' },
] as const satisfies readonly RegionSpec[]

/** The posts define the pavement; the shelter stands on it. */
/** Millimetres per world unit — the shelter scale (~700 mm per unit). */
export const BUS_SHELTER_MM_PER_UNIT = 700

/** Live geometry of the two 6-sheet poster faces and the arrivals board. */
export const BUS_SHELTER_METRICS = {
  mmPerUnit: BUS_SHELTER_MM_PER_UNIT,
  regions: () => {
    const { poster, display, resolution } = BUS_SHELTER
    const sheet = { width: poster.width, height: poster.height, radius: poster.radius, resolution }
    const board = {
      width: display.width,
      height: display.height,
      radius: 0.01,
      resolution: display.resolution,
    }
    return { poster: sheet, inner: sheet, arrivals: board, arrivalsBack: board }
  },
} as const satisfies MockupMetrics

export const BUS_SHELTER_FRAMING = {
  camera: { position: [0, 0.4, 11.4], fov: 40 },
  floatIntensity: 0.35,
  extent: () => BUS_SHELTER.standHeight,
} as const satisfies MockupFraming
