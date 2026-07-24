/**
 * Billboard object dimensions — a classic 14' x 48' bulletin on a monopole.
 *
 * The standard US highway bulletin face (4.27 x 14.63 m) is normalized to
 * ~2.8 m per world unit, giving a 5.2 x 1.52 unit face. The origin is the
 * face center; the ground is `standHeight` below it (a mockup-friendly pole,
 * much shorter than the real ~10 m steel).
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming, RegionSpec } from '../../regions'

/** World units per millimeter for the billboard. */
export const BILLBOARD_MM = 1 / 2814

export const BILLBOARD = {
  /** Advertising face (the live area). Content you pass as children maps onto this rect. */
  face: { width: 5.2, height: 1.517, radius: 0.01 },
  /** Steel face panel behind the vinyl, with its trim lip. */
  panel: { width: 5.32, height: 1.637, depth: 0.1, radius: 0.02 },
  /** Torsion box + slatted apron skirt directly under the face — the pole
   * connects to this, not to the face itself. */
  apron: { width: 5.32, height: 0.48, depth: 0.25 },
  /** Distance from the face center down to the ground plane. Real bulletins
   * stand higher still (~2x the face height of exposed pole); this keeps the
   * classic proportion while staying frameable. */
  standHeight: 3.0,
  /** Monopole column and its foundation collar. */
  pole: { radius: 0.17, collarRadius: 0.22, collarHeight: 0.14 },
  /** Maintenance catwalk hung off the apron front. */
  catwalk: { width: 4.6, depth: 0.3, thickness: 0.04, drop: 0.1, railHeight: 0.38, posts: 5 },
  /** Floodlight fixtures along the top edge: arm reach and lamp size. */
  lights: { count: 4, reach: 0.6, rise: 0.24, radius: 0.07 },
  /** Default CSS px width of the virtual face. */
  resolution: 1200,
} as const

/** Face aspect ratio (height / width) — the 14:48 bulletin. */
export const BILLBOARD_FACE_ASPECT = BILLBOARD.face.height / BILLBOARD.face.width

/** Live regions: the advertising face. */
export const BILLBOARD_REGIONS = [
  { name: 'face', label: 'Face' },
] as const satisfies readonly RegionSpec[]

/**
 * Vertical offset that keeps the billboard (face + pole) visually centered on
 * the stage origin the camera and shadow are tuned for.
 */
export const BILLBOARD_STAGE_OFFSET_Y = 1.1

/** The pole base of the (stage-offset) billboard defines the ground plane. */
export const BILLBOARD_FRAMING = {
  camera: { position: [0, 0.2, 13.6], fov: 40 },
  floatIntensity: 0.4,
  extent: () => BILLBOARD.standHeight - BILLBOARD_STAGE_OFFSET_Y,
} as const satisfies MockupFraming
