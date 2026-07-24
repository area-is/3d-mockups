/**
 * Bus object dimensions — a generic 40 ft / 12 m low-floor city transit bus
 * (New Flyer Xcelsior / Nova LFS / Mercedes Citaro class, no brand):
 * one-box silhouette with no hood, a near-vertical lightly-raked front, a
 * dark upper fascia band holding the LED destination sign, a window band
 * covering almost half the body height, two full-glass curb-side doors, a
 * flat roof with an HVAC pod, and the classic king-size advertising panel
 * (30" x 144") between the wheels.
 *
 * Normalized to ~1900 mm per world unit: 12.19 x 3.20 x 2.59 m becomes
 * 6.4 x 1.68 x 1.36 units. The group origin sits mid-height at the body
 * center; the ground plane is `groundY` below it. +X is the nose, +Z the
 * curb side carrying the doors and the live ad panel.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming, RegionSpec } from '../../regions'

/** World units per millimeter for the bus. */
export const BUS_MM = 1 / 1900

export const BUS = {
  /** Overall body: length (x), height (y), width (z). `bevel` rounds the shell edges. */
  body: { length: 6.4, height: 1.684, width: 1.363, bevel: 0.04 },
  /** Y of the ground plane relative to the origin (wheels touch here). */
  groundY: -0.842,
  /** Y of the body's lower skirt edge (~330 mm low-floor ground clearance). */
  skirtY: -0.676,
  /**
   * Wheels: front axle 2.7 m from the nose, 6 m wheelbase, ~1 m tires.
   * The front axle runs single tires; the drive axle runs duals —
   * `dualWidth` is each tire of the pair, `dualGap` the space between them.
   */
  wheels: {
    frontX: 1.779,
    rearX: -1.379,
    radius: 0.263,
    archRadius: 0.305,
    width: 0.2,
    dualWidth: 0.158,
    dualGap: 0.021,
    centerY: -0.587,
  },
  /**
   * Side profile checkpoints (x, y): flat nose face, lightly-raked
   * windshield (~6.5 deg), dark sign band above it, front roof dome, flat
   * roofline.
   */
  profile: {
    noseX: 3.2,
    tailX: -3.2,
    windshieldBaseY: -0.34,
    windshieldTopX: 3.105,
    windshieldTopY: 0.5,
    signBandTopX: 3.084,
    signBandTopY: 0.684,
    roofStartX: 2.79,
    roofY: 0.842,
  },
  /** Passenger window band (both sides) — nearly half the body height. */
  windowBand: { y: 0.079, height: 0.66, frontX: 2.35, backX: -3.02 },
  /**
   * Driver's window on the street side (−Z), right behind the A-pillar —
   * same height and sill line as the passenger band, like the sliding
   * driver's glass on real low-floor buses.
   */
  driverWindow: { x: 2.73, width: 0.6, y: 0.079, height: 0.66 },
  /**
   * Curb-side doors: two-leaf full-glass slabs whose glass drops to ~350 mm
   * above the ground — the low-floor entry these buses are known for.
   */
  doors: [
    { x: 2.724, width: 0.6, bottomY: -0.66 },
    { x: -0.158, width: 0.63, bottomY: -0.66 },
  ],
  /** Roof HVAC pod over the rear half. */
  hvac: { length: 1.579, height: 0.184, width: 1.079, x: -0.632 },
  /**
   * Live king-size ad panels (30" x 144" = 762 x 3658 mm) on both sides,
   * between the wheel arches, top edge tucked under the window sill.
   */
  ad: { width: 1.925, height: 0.401, x: 0.2, y: -0.47, radius: 0.012 },
  /** Live tail ad (21" x 70" = 533 x 1778 mm) on the engine door. */
  rearAd: { width: 0.936, height: 0.281, y: -0.28, radius: 0.012 },
  /**
   * Full-coverage rear wrap (`coverage="full"`): the whole tail between the
   * bumper and the roof dome, out to the corner bevels — engine louvers and
   * the rear window get covered like a real tail wrap; each taillight lamp
   * is carved out individually.
   */
  rearFull: { width: 1.32, height: 1.16, y: 0.18, radius: 0.02 },
  /** Rear window above the engine bay. */
  rearWindow: { width: 0.95, height: 0.44, y: 0.5 },
  /** Live LED destination sign inside the dark upper fascia band. */
  destination: { width: 1.105, height: 0.174, y: 0.56 },
  /** Default CSS px width of the virtual ad panel. */
  resolution: 960,
  /** Default CSS px width of the full-coverage side wrap (`coverage="full"`). */
  fullResolution: 1920,
} as const

/** Ad panel aspect ratio (height / width) — the 30x144 king size. */
export const BUS_AD_ASPECT = BUS.ad.height / BUS.ad.width

/** Live regions: ad surfaces on both sides and the tail, plus the LED sign. */
export const BUS_REGIONS = [
  { name: 'curbSide', label: 'Curb-side ad' },
  { name: 'streetSide', label: 'Street-side ad' },
  { name: 'rear', label: 'Rear ad' },
  { name: 'destinationSign', label: 'Destination sign' },
] as const satisfies readonly RegionSpec[]

/** The wheels define the road plane; the shadow grounds just under them. */
export const BUS_FRAMING = {
  camera: { position: [0, 0.3, 11.8], fov: 40 },
  floatIntensity: 0.4,
  extent: () => -BUS.groundY,
} as const satisfies MockupFraming
