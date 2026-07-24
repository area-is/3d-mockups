/**
 * Mailer box object dimensions — a closed corrugated shipper.
 *
 * Proportions follow the classic e-commerce hero shipper: 350 x 250 x 120 mm
 * kraft corrugated, lying flat, with a 48 mm packing-tape band over the flap
 * seam that wraps down both ends. Normalized to ~78 mm per world unit so the
 * box is 4.49 units wide.
 *
 * Live faces: top (the primary region — tape rendered as a DOM overlay so it
 * stays over your print), front and end panels.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming, RegionSpec } from '../../regions'

/** World units per millimeter for the mailer box. */
export const MAILER_BOX_MM = 1 / 78

export const MAILER_BOX = {
  /** The shipper: width (x), height (y), depth (z). `radius` softens the corrugated edges. */
  body: { width: 4.487, height: 1.538, depth: 3.205, radius: 0.03 },
  /** Packing tape: band width, running across the top seam and down both ends. */
  tape: { width: 0.615 },
  /** Default CSS px width of the virtual top face; other faces share its dpi. */
  resolution: 520,
} as const

/** Top face aspect ratio (depth / width). */
export const MAILER_BOX_TOP_ASPECT = MAILER_BOX.body.depth / MAILER_BOX.body.width

/** Shipper size in real millimeters. */
export interface MailerBoxSizeMm {
  /** Shipper width in millimeters (x). */
  width: number
  /** Shipper height in millimeters (y). */
  height: number
  /** Shipper depth in millimeters (z). */
  depth: number
}

/** The default e-commerce shipper in millimeters. */
export const MAILER_BOX_SIZE_MM: MailerBoxSizeMm = { width: 350, height: 120, depth: 250 }

/** Everything the renderer needs to build a shipper of a given size. */
export interface MailerBoxLayout {
  body: { width: number; height: number; depth: number; radius: number }
  tape: { width: number }
}

/**
 * Shipper layout in world units for a given mm size. Like the custom box,
 * the longest edge normalizes to the default stage (the default shipper's
 * 4.49 unit width), so any size fills the camera while the mm dimensions
 * set the true proportions. The packing tape stays a real 48 mm band.
 */
export function mailerBoxLayout(size: MailerBoxSizeMm = MAILER_BOX_SIZE_MM): MailerBoxLayout {
  const scale = MAILER_BOX.body.width / Math.max(size.width, size.height, size.depth)
  const width = size.width * scale
  return {
    body: { width, height: size.height * scale, depth: size.depth * scale, radius: MAILER_BOX.body.radius },
    tape: { width: Math.min(48 * scale, width * 0.25) },
  }
}

/** Live regions: all six panels, the top (the shipper's hero face) first. */
export const MAILER_BOX_REGIONS = [
  { name: 'top', label: 'Top panel' },
  { name: 'front', label: 'Front panel' },
  { name: 'back', label: 'Back panel' },
  { name: 'right', label: 'Right end panel' },
  { name: 'left', label: 'Left end panel' },
  { name: 'bottom', label: 'Bottom panel' },
] as const satisfies readonly RegionSpec[]

/** The box sits on the table at half its (normalized) height. */
export const MAILER_BOX_FRAMING = {
  camera: { position: [0, 0.8, 7.6], fov: 40 },
  floatIntensity: 0.6,
  extent: ({ size }) => mailerBoxLayout(size).body.height / 2,
} as const satisfies MockupFraming<{ size?: MailerBoxSizeMm }>
