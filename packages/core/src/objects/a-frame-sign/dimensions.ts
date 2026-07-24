/**
 * A-frame sign object dimensions — a sidewalk sandwich board.
 *
 * Proportions follow the classic 600 x 900 mm chalkboard-class sidewalk
 * sign: two framed panels hinged at the top, legs splayed ~15° each side (measured from street photos),
 * standing on the pavement. Normalized to ~280 mm per world unit so the
 * sign stands ~3.4 units tall. Both panels are live DOM.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming, RegionSpec } from '../../regions'

/** World units per millimeter for the A-frame sign. */
export const A_FRAME_SIGN_MM = 1 / 280

export const A_FRAME_SIGN = {
  /** One framed panel: outer size and frame bar width/depth. */
  panel: { width: 2.143, height: 3.214, frameWidth: 0.16, frameDepth: 0.09 },
  /** Printable face inside the frame. Content maps onto this rect per side. */
  face: { width: 2.143 - 0.32, height: 3.214 - 0.32, radius: 0.006 },
  /** Splay angle of each leg from vertical, in degrees. */
  splayAngle: 15,
  /** Default CSS px width of the virtual face. */
  resolution: 420,
} as const

/** Face aspect ratio (height / width). */
export const A_FRAME_SIGN_ASPECT = A_FRAME_SIGN.face.height / A_FRAME_SIGN.face.width

/** Live regions: the two panels of the A. */
export const A_FRAME_SIGN_REGIONS = [
  { name: 'front', label: 'Front panel' },
  { name: 'back', label: 'Back panel' },
] as const satisfies readonly RegionSpec[]

/** The splayed legs define the pavement; the sign stands on its leg tips. */
export const A_FRAME_SIGN_FRAMING = {
  camera: { position: [0, 0.5, 7.8], fov: 40 },
  floatIntensity: 0.5,
  extent: () =>
    (A_FRAME_SIGN.panel.height / 2) * Math.cos((A_FRAME_SIGN.splayAngle * Math.PI) / 180),
} as const satisfies MockupFraming
