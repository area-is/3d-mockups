/**
 * Semi trailer object dimensions — a 53 ft dry van parked on its landing
 * gear (no tractor): the biggest advertising canvas on the road.
 *
 * Proportions follow the US standard: 16.15 m long, 2.6 m wide, a 2.9 m box
 * on a ~1.2 m floor height (4.1 m overall), smooth-sided for wraps, tandem
 * axles at the rear, landing gear behind the kingpin, ICC bumper and DOT
 * reflective tape along the bottom rail. Normalized to ~2485 mm per world
 * unit so the trailer is 6.5 units long.
 *
 * Live surfaces: both smooth sides and the rear doors. The group origin is
 * the box center; the road sits `groundY` below it.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming, RegionSpec } from '../../regions'

/** World units per millimeter for the semi trailer. */
export const SEMI_TRAILER_MM = 1 / 2485

export const SEMI_TRAILER = {
  /** The box: length (x), height (y), width (z). */
  body: { length: 6.5, height: 1.167, width: 1.046, radius: 0.02 },
  /** Y of the road relative to the origin (box center). */
  groundY: -1.066,
  /**
   * Tandem axles at the rear, dual tires per side — `width` is each tire of
   * the pair, `dualGap` the space between them.
   */
  wheels: { axles: [-2.03, -2.53] as const, radius: 0.203, width: 0.121, dualGap: 0.026, centerY: -0.863 },
  /** Landing gear legs, well behind the kingpin. */
  landingGear: { x: 1.75, spread: 0.33 },
  /** Live wrap panels on both smooth sides. */
  side: { width: 6.1, height: 1.05, radius: 0.012 },
  /** Live panel on the rear doors, inside the door frame and lock rods. */
  rear: { width: 0.9, height: 1.05, radius: 0.012 },
  /** Default CSS px width of the virtual side panel. */
  resolution: 1100,
} as const

/** Side panel aspect ratio (height / width). */
export const SEMI_TRAILER_SIDE_ASPECT = SEMI_TRAILER.side.height / SEMI_TRAILER.side.width

/** Live regions: both smooth sides and the rear doors. */
export const SEMI_TRAILER_REGIONS = [
  { name: 'curbSide', label: 'Curb-side panel' },
  { name: 'streetSide', label: 'Street-side panel' },
  { name: 'rear', label: 'Rear-door panel' },
] as const satisfies readonly RegionSpec[]

/** The wheels and landing gear define the road; the shadow grounds under them. */
export const SEMI_TRAILER_FRAMING = {
  camera: { position: [0, 0.3, 11.8], fov: 40 },
  floatIntensity: 0.5,
  extent: () => -SEMI_TRAILER.groundY,
} as const satisfies MockupFraming
