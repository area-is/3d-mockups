/**
 * ID card object dimensions — a portrait CR80 badge on a lanyard.
 *
 * The card is the standard CR80 badge blank: 54 x 85.6 mm held portrait on
 * 30 mil (0.76 mm) PVC with a 14 x 3 mm slot punch centered 6 mm below the
 * top edge. Normalized to ~32 mm per world unit so the card is 2.68 units
 * tall. The lanyard rises from a metal crimp and swivel hook clipped through
 * the slot; the strap halves exit the top of the frame like a hanging badge.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming, RegionSpec } from '../../regions'

/** World units per millimeter for the ID card. */
export const ID_CARD_MM = 1 / 32

export const ID_CARD = {
  /** CR80 blank, portrait. `radius` is the die-cut corner rounding. */
  body: { width: 1.687, height: 2.675, thickness: 0.03, radius: 0.1, bevel: 0.005 },
  /** Slot punch (a real 14x3 mm stadium hole), centerline ~5.5 mm below the top edge. */
  slot: { width: 0.44, height: 0.095, centerY: 2.675 / 2 - 0.172 },
  /**
   * Printable face: the WHOLE card, edge to edge — like a real full-bleed
   * badge print, the design runs under the punch strip too. The renderer
   * carves the slot punch out of the live area (same stadium hole as the
   * 3D card), so content maps onto this rect on both sides minus the slot.
   */
  face: { width: 1.687, height: 2.675, radius: 0.1, offsetY: 0 },
  /**
   * Hardware chain, bottom to top exactly as on real lanyards: the classic
   * FLAT stamped-steel swivel J-hook (an open ring segment closed by a thin
   * spring gate) hanging pierced THROUGH the slot — its plane perpendicular
   * to the card, the lower band crossing inside the punched opening and the
   * ring window swallowing the punch strip — then the stem and swivel
   * barrel above it, and the sheet-metal crimp that captures the folded
   * strap ends. Reference: the standard "metal swivel J hook clip" used on
   * nearly every retail lanyard — flat polished steel, not wire.
   */
  hook: {
    /** Ring segment of the J: outer/inner radii of the flat stamped hook. */
    outerR: 0.168,
    innerR: 0.112,
    /** Stamped-steel thickness. */
    depth: 0.022,
    /** Mouth opening (degrees, CCW from +x): the gap the gate spans. */
    mouthStart: 12,
    mouthEnd: 74,
    stem: { width: 0.068, height: 0.17 },
    barrel: { radius: 0.07, height: 0.18, collar: 0.095 },
    crimp: { width: 0.44, height: 0.24, depth: 0.062 },
  },
  /** Woven strap halves rising from the crimp in a hanging ~30° V. */
  strap: { width: 0.47, thickness: 0.022, length: 2.6, spreadAngle: 0.26, backTilt: 0.1 },
  /** Default CSS px width of the virtual face (~300 dpi of the physical card). */
  resolution: 420,
} as const

/** Printable face aspect ratio (height / width). */
export const ID_CARD_FACE_ASPECT = ID_CARD.face.height / ID_CARD.face.width

/** Live regions: the two faces of the badge. */
export const ID_CARD_REGIONS = [
  { name: 'front', label: 'Front face' },
  { name: 'back', label: 'Back face' },
] as const satisfies readonly RegionSpec[]

/**
 * Vertical offset that centers the badge (card + hook, with the straps
 * running out of the top of the frame) on the stage origin.
 */
export const ID_CARD_STAGE_OFFSET_Y = -0.35

/** The (stage-offset) badge grounds on the card's bottom edge. */
export const ID_CARD_FRAMING = {
  camera: { position: [0, 0.35, 6.2], fov: 40 },
  floatIntensity: 0.6,
  extent: () => ID_CARD.body.height / 2 - ID_CARD_STAGE_OFFSET_Y,
  contactGap: 0.05,
} as const satisfies MockupFraming
