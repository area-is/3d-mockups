/**
 * Van object dimensions — a generic Euro-style cargo van (think Transit /
 * Sprinter silhouette, no brand): long-wheelbase panel van with a clamshell
 * hood, cowl break, raked windshield, high roof and a flat cargo side that
 * takes a vinyl-wrap livery.
 *
 * Normalized to ~1050 mm per world unit: 5.9 m long, 2.55 m tall, 2.05 m wide
 * becomes 5.62 x 2.43 x 1.95 units. The group origin sits mid-height at the
 * body center; the ground plane is `groundY` below it. +X is the nose, +Z the
 * curb side carrying the live wrap panel.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming, RegionSpec } from '../../regions'

/** World units per millimeter for the van. */
export const VAN_MM = 1 / 1050

export const VAN = {
  /** Overall body: length (x), height (y), width (z). `bevel` rounds the shell edges. */
  body: { length: 5.62, height: 2.43, width: 1.95, bevel: 0.045 },
  /** Y of the ground plane relative to the origin (wheels touch here). */
  groundY: -1.215,
  /** Y of the body's lower rocker edge (ground clearance above `groundY`). */
  rockerY: -0.881,
  /** Wheels: axle x positions, tire radius, arch cutout radius, tire width. */
  wheels: {
    frontX: 1.905,
    rearX: -1.587,
    radius: 0.362,
    archRadius: 0.438,
    width: 0.24,
    /** Wheel axle height (tire bottom touches `groundY`). */
    centerY: -0.853,
  },
  /**
   * Side profile checkpoints (x, y) used to build the extruded shell: bumper
   * face, near-horizontal clamshell hood top, cowl crease at the windshield
   * base, raked glass, and the high-roof cap ramping back to the roofline.
   */
  profile: {
    noseX: 2.81,
    tailX: -2.81,
    bumperTopY: -0.28,
    /** Top of the near-vertical nose/grille face — the clamshell hood's front edge. */
    hoodX: 2.79,
    hoodY: 0.06,
    cowlX: 2.28,
    cowlY: 0.24,
    windshieldTopX: 1.94,
    windshieldTopY: 0.94,
    roofStartX: 1.3,
    roofY: 1.19,
  },
  /** Live vinyl-wrap panels on both cargo sides, clear of the arches and door glass. */
  wrap: { width: 3.72, height: 1.52, x: -0.86, y: 0.34, radius: 0.02 },
  /** Live wrap panel on the rear doors, between the taillight clusters. */
  rear: { width: 1.42, height: 1.62, y: 0.14, radius: 0.02 },
  /**
   * Full-coverage rear wrap (`coverage="full"`): the whole barn-door face —
   * door edge to door edge, plate recess to just under the roofline — with
   * the taillight lamps, third brake light, hinge knuckles and the barn-door
   * shut line carved out.
   */
  rearFull: { width: 1.9, height: 1.81, y: 0.225, radius: 0.03 },
  /** Default CSS px width of the virtual side wrap panel. */
  resolution: 900,
} as const

/** Wrap panel aspect ratio (height / width). */
export const VAN_WRAP_ASPECT = VAN.wrap.height / VAN.wrap.width

/** Live regions: wrap panels on both sides and the rear, plus the plates. */
export const VAN_REGIONS = [
  { name: 'curbSide', label: 'Curb-side wrap' },
  { name: 'streetSide', label: 'Street-side wrap' },
  { name: 'rear', label: 'Rear wrap' },
  { name: 'licensePlate', label: 'License plate' },
] as const satisfies readonly RegionSpec[]

/** The wheels define the road plane; the shadow grounds just under them. */
export const VAN_FRAMING = {
  camera: { position: [0, 0.4, 10.6], fov: 40 },
  floatIntensity: 0.5,
  extent: () => -VAN.groundY,
} as const satisfies MockupFraming
