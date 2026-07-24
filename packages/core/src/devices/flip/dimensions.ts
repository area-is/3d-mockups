/**
 * Galaxy Z Flip-style device dimensions — the Galaxy Z Flip 7.
 *
 * A clamshell foldable has two form factors, and this spec carries both:
 *
 * - `open`: the unfolded tall phone — a very slim 2.32:1 slab whose upper back
 *   half is entirely cover-screen glass carrying the two separate lens rings.
 * - `closed`: the folded compact — two stacked halves with a small air gap,
 *   the hinge capping the bottom edge, and the nearly-square cover display
 *   filling the front (with the lens rings and flash sitting on it).
 *
 * Shares the Galaxy world scale (~36.66 mm per unit) so it sits at true
 * relative size beside the S-series and the Fold. Detail geometry (buttons,
 * lens rings, hinge band, ports, seams) was measured from a reference 3D scan
 * of the retail device. Pure, renderer-agnostic data.
 *
 * Real Galaxy Z Flip 7: unfolded 166.7 x 75.2 x 6.5 mm (6.85" 2520x1080 main);
 * folded 85.5 x 75.2 x 13.7 mm (4.1" 948x1048 cover wrapping the cameras).
 */

import type { Orientation } from '../../orientation'
import type { MockupFraming } from '../../regions'

export interface FlipSpec {
  /** Unfolded tall phone. */
  open: {
    body: { width: number; height: number; depth: number; radius: number; bevel: number }
    /** Main inner display (content maps here when open). */
    display: { width: number; height: number; radius: number }
    /** Centered punch hole on the main display. */
    punchHole: { radius: number; offsetY: number }
    /** Default CSS px width of the portrait main display. */
    resolution: number
  }
  /**
   * Folded compact. `body` describes ONE half; the stack is two of them
   * separated by `gap`, plus the hinge band overhanging the bottom.
   */
  closed: {
    body: { width: number; height: number; depth: number; radius: number; bevel: number }
    /** Air gap between the folded halves. */
    gap: number
    /** Cover display (content maps here when closed), centered on the front half. */
    display: { width: number; height: number; radius: number }
    /** Default CSS px width of the cover display. */
    resolution: number
  }
  /**
   * Dual rear cameras on the cover-screen glass, in cover-HALF local
   * coordinates (origin at that half's center, +y toward the free end).
   * The two lens modules protrude individually from the glass — the retail
   * device has no plate or island grouping them (confirmed against official
   * product photography). Open pose: they show on the back of the upper
   * half. Closed pose: they face the viewer on the cover screen.
   */
  rearCamera: {
    /** How far each lens module stands proud of the cover glass. */
    raise: number
    /** The two lens rings; `pupil` is the front element's fraction of the ring radius. */
    rings: { x: number; y: number; r: number; pupil?: number }[]
    /** Fresnel flash disc, flush on the cover glass beside the lenses. */
    flash: { x: number; y: number; r: number }
  }
  /** Cover-glass rect on the back of the upper half (visible, dark, when open). */
  coverGlass: { width: number; height: number; radius: number }
  /** Side keys on the right edge of the cover half (half-local y): volume, power. */
  buttons: { y: number; length: number }[]
  buttonProfile: { protrusion: number; thickness: number }
  /** SIM tray slot on the left edge of the cover half (half-local y). */
  sim: { y: number; length: number }
  /** Machining on the free edge of the lower half (bottom when open, top when closed). */
  bottomEdge: {
    usb: { x: number; width: number; height: number }
    speaker: { x: number; width: number; height: number }
    mics: { x: number; r: number }[]
  }
  /**
   * The hinge band capping the folded bottom: how far it wraps across the
   * stack, how far it overhangs the halves, and the engraved wordmark length.
   */
  hinge: { width: number; overhang: number; emboss: { length: number } }
  /** Darker end-band seams, this far in from each free end (reads as antenna lines). */
  endSeamInset: number
}

const FLIP7: FlipSpec = {
  open: {
    body: { width: 2.051, height: 4.547, depth: 0.177, radius: 0.201, bevel: 0.014 },
    // 68.95 x 160.45 mm panel, r 4.2 mm, slim 2.1 mm bezel.
    display: { width: 1.881, height: 4.377, radius: 0.116 },
    punchHole: { radius: 0.057, offsetY: 0.102 },
    resolution: 360,
  },
  closed: {
    body: { width: 2.051, height: 2.274, depth: 0.177, radius: 0.201, bevel: 0.014 },
    gap: 0.02,
    // 70.0 x 78.15 mm cover panel, r 4.8 mm.
    display: { width: 1.909, height: 2.132, radius: 0.13 },
    resolution: 316,
  },
  rearCamera: {
    // Each 13.4 mm module stands ~2 mm proud of the cover glass on its own —
    // no shared plate (the pill in the reference scan was the screen-protector
    // cutout, not raised hardware; product photos show bare glass between the
    // flash and the lenses).
    raise: 0.055,
    // 50 MP main (outer) + 12 MP ultra-wide (inner).
    rings: [
      { x: 0.723, y: 0.829, r: 0.183, pupil: 0.44 },
      { x: 0.339, y: 0.829, r: 0.183, pupil: 0.39 },
    ],
    flash: { x: 0.035, y: 0.821, r: 0.058 },
  },
  coverGlass: { width: 1.973, height: 2.195, radius: 0.162 },
  // Scan: volume 19.1 mm, power 13.7 mm on the right edge of the cover half.
  buttons: [
    { y: 0.241, length: 0.52 },
    { y: -0.426, length: 0.374 },
  ],
  buttonProfile: { protrusion: 0.008, thickness: 0.052 },
  sim: { y: 0.432, length: 0.4 },
  bottomEdge: {
    usb: { x: 0, width: 0.257, height: 0.079 },
    speaker: { x: 0.518, width: 0.302, height: 0.042 },
    mics: [{ x: -0.605, r: 0.02 }, { x: -0.407, r: 0.02 }],
  },
  // Band 10.4 mm across the stack, 2.1 mm overhang, 23.7 mm SAMSUNG engraving.
  hinge: { width: 0.283, overhang: 0.058, emboss: { length: 0.647 } },
  endSeamInset: 0.445,
}

export const FLIP_VARIANTS: Record<'flip7', FlipSpec> = {
  flip7: FLIP7,
}

export type FlipVariant = keyof typeof FLIP_VARIANTS

/** The variant every binding defaults to. */
export const FLIP_DEFAULT_VARIANT: FlipVariant = 'flip7'

/**
 * Grounded by default: the shadow plane kisses the bottom of the body — the
 * hinge band when folded, the halves' folded extent at partial angles.
 */
export const FLIP_FRAMING = {
  contactGap: 0.05,
  extent: ({ variant, open, openAngle, orientation }) => {
    const spec = FLIP_VARIANTS[variant ?? FLIP_DEFAULT_VARIANT]
    const angle =
      openAngle === undefined ? ((open ?? true) ? 180 : 0) : Math.max(0, Math.min(180, openAngle))
    const foldCos = Math.cos((((180 - angle) / 2) * Math.PI) / 180)
    const extent =
      orientation === 'landscape'
        ? angle > 3
          ? spec.open.body.width
          : spec.closed.body.width
        : angle >= 177
          ? spec.open.body.height
          : angle <= 3
            ? spec.closed.body.height + spec.hinge.overhang * 2
            : spec.closed.body.height * 2 * foldCos
    return extent / 2
  },
} as const satisfies MockupFraming<{
  variant?: FlipVariant
  open?: boolean
  openAngle?: number
  orientation?: Orientation
}>

/** Back-compat / default device. */
export const FLIP = FLIP7

/** Main (open) display aspect ratio (height / width). */
export const FLIP_OPEN_ASPECT = FLIP.open.display.height / FLIP.open.display.width
