/**
 * Galaxy-style phone device dimensions — the current Galaxy S26 line
 * (Galaxy S26 and Galaxy S26 Ultra).
 *
 * All variants share one world scale (~36.66 mm per unit — the library's
 * long-standing Galaxy scale, kept so devices stay in true relative size
 * beside the Fold, Watch and every other object in the catalog).
 *
 * The S26 and S26 Ultra numbers below were measured from reference 3D scans
 * of the retail devices (button pills, camera islands, port cutouts and seam
 * positions taken from the scan geometry), then normalized to the official
 * body dimensions: S26 149.6 x 71.7 x 7.2 mm, S26 Ultra 163.6 x 78.1 x 7.9 mm.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { Orientation } from '../../orientation'
import type { MockupFraming } from '../../regions'

/** World units per millimeter for the Galaxy family. */
export const GALAXY_MM = 1 / 36.66

export interface GalaxyPhoneSpec {
  /** Aluminum/titanium frame + chassis. `radius` is the corner radius, `bevel` the edge rounding. */
  body: { width: number; height: number; depth: number; radius: number; bevel: number }
  /** Front cover glass (slightly larger than the active display — forms the bezel ring). */
  glass: { width: number; height: number; radius: number }
  /** Active display area. Content you pass as children is mapped onto this rect. */
  display: { width: number; height: number; radius: number }
  /** Front camera punch hole: circle radius + distance from the top display edge to its center. */
  punchHole: { radius: number; offsetY: number }
  /** Default CSS px width of the portrait virtual display (the device's logical dp width). */
  resolution: number
  /** Side keys on the right edge (front view), top to bottom: y center + length. */
  buttons: { y: number; length: number }[]
  /** Shared side-key profile: protrusion beyond the rail and z thickness of the pill. */
  buttonProfile: { protrusion: number; thickness: number }
  /** Rear camera layout in front-view coordinates (mirrored on the back panel). */
  rearCamera: {
    /** x of the main lens column (front view; appears top-left from the back). */
    ringsX: number
    /**
     * Lens rings, top to bottom. `x` overrides the column (the Ultra's second,
     * smaller column); `h` overrides `ringHeight` for that ring; `pupil` is
     * the front element's fraction of the ring radius (main lenses are wider
     * than ultra-wides and folded teles).
     */
    rings: { x?: number; y: number; r: number; h?: number; pupil?: number }[]
    flash: { x: number; y: number }
    /** Small auxiliary sensors (laser AF, extra mics…). */
    dots?: { x: number; y: number; r: number }[]
    /** Raised pill island seating the main lens column. `raise` is its height off the back. */
    island?: {
      x: number
      y: number
      width: number
      height: number
      radius: number
      raise?: number
    }
    /** How far the lens rings stand proud of their mounting surface (island or back). */
    ringHeight?: number
  }
  /**
   * Bottom-edge machining, in front-view x positions on the rim: USB-C port,
   * speaker slot, mic holes, SIM tray and (Ultra) the S Pen cap.
   */
  bottomEdge?: {
    usb: { x: number; width: number; height: number }
    speaker?: { x: number; width: number; height: number }
    mics?: { x: number; r: number }[]
    sim?: { x: number; width: number; height: number }
    penCap?: { x: number; r: number }
  }
  /** Antenna seams on the side rails: y positions, mirrored onto both edges. */
  antennaLines?: number[]
  /** Back wordmark box (centered at x = 0). */
  logo?: { y: number; width: number; height: number }
}

/**
 * Galaxy S26 — 149.6 x 71.7 x 7.2 mm, 6.3" 2340x1080 (19.5:9) flat display.
 * The three lenses sit in a single vertical pill island top-left of the back
 * (rings nearly filling the pill's width) with the LED flash on the flat back
 * just inboard of it. Logical resolution 360x780 (the panel at exactly
 * one-third scale).
 */
const S26: GalaxyPhoneSpec = {
  body: { width: 1.956, height: 4.081, depth: 0.196, radius: 0.19, bevel: 0.02 },
  glass: { width: 1.888, height: 4.021, radius: 0.138 },
  display: { width: 1.829, height: 3.962, radius: 0.129 },
  punchHole: { radius: 0.055, offsetY: 0.111 },
  resolution: 360,
  // Measured from the scan: volume pill 20.8 mm at +41.6 mm, power 13.7 mm at +13.9 mm.
  buttons: [
    { y: 1.135, length: 0.567 },
    { y: 0.379, length: 0.374 },
  ],
  buttonProfile: { protrusion: 0.012, thickness: 0.068 },
  rearCamera: {
    ringsX: 0.582,
    // Top to bottom: 12 MP ultra-wide, 50 MP main, 10 MP 3x tele.
    rings: [
      { y: 1.624, r: 0.196, pupil: 0.38 },
      { y: 1.196, r: 0.196, pupil: 0.47 },
      { y: 0.767, r: 0.196, pupil: 0.34 },
    ],
    flash: { x: 0.169, y: 1.413 },
    island: { x: 0.581, y: 1.196, width: 0.404, height: 1.26, radius: 0.202, raise: 0.028 },
    ringHeight: 0.026,
  },
  bottomEdge: {
    usb: { x: 0, width: 0.251, height: 0.087 },
    speaker: { x: 0.449, width: 0.465, height: 0.038 },
    mics: [{ x: -0.189, r: 0.015 }, { x: 0.169, r: 0.015 }],
    sim: { x: -0.535, width: 0.374, height: 0.071 },
  },
  antennaLines: [1.71, -1.47],
  logo: { y: -1.269, width: 0.586, height: 0.09 },
}

/**
 * Galaxy S26 Ultra — 163.6 x 78.1 x 7.9 mm, 6.9" 3120x1440 display, titanium
 * frame with boxier corners and the S Pen silo on the bottom-left. The rear
 * array moves to the S26 pill language, scaled up: three large rings stacked
 * in a raised stadium island top-left (each ring standing proud of the pill),
 * with the 3x/5x tele pair, laser-AF dot and flash in a second column on the
 * flat back beside it. Logical resolution 384x832 (One UI's default FHD+
 * render at 450 dpi). Detail geometry measured from a retail-unit scan.
 */
const S26_ULTRA: GalaxyPhoneSpec = {
  body: { width: 2.13, height: 4.463, depth: 0.216, radius: 0.175, bevel: 0.02 },
  glass: { width: 2.07, height: 4.403, radius: 0.157 },
  display: { width: 1.995, height: 4.328, radius: 0.121 },
  punchHole: { radius: 0.036, offsetY: 0.106 },
  resolution: 384,
  // Measured from the scan: volume pill 20.0 mm at +40.8 mm, power 13.3 mm at +14.6 mm,
  // 0.45 mm proud of the rail, 2.5 mm thick.
  buttons: [
    { y: 1.114, length: 0.546 },
    { y: 0.4, length: 0.364 },
  ],
  buttonProfile: { protrusion: 0.012, thickness: 0.069 },
  rearCamera: {
    ringsX: 0.66,
    rings: [
      // Main column, top to bottom: 50 MP ultra-wide, 200 MP main (widest
      // pupil), 50 MP 5x periscope (small pupil deep in the barrel).
      { y: 1.826, r: 0.231, pupil: 0.4 },
      { y: 1.329, r: 0.231, pupil: 0.47 },
      { y: 0.833, r: 0.231, pupil: 0.3 },
      // Second column on the flat back: 9.4 mm tele rings, much flatter (~1.4 mm proud).
      { x: 0.169, y: 1.826, r: 0.128, h: 0.038, pupil: 0.34 },
      { x: 0.169, y: 1.329, r: 0.128, h: 0.038, pupil: 0.34 },
    ],
    flash: { x: 0.169, y: 1.576 },
    dots: [
      { x: 0.169, y: 1.68, r: 0.024 }, // laser AF between the top tele ring and the flash
    ],
    // The stadium pill hugs the main column only (21.4 x 57.7 mm, 1.2 mm proud).
    island: { x: 0.66, y: 1.329, width: 0.584, height: 1.576, radius: 0.292, raise: 0.032 },
    // The Ultra's rings stand well proud of the pill face (~3.3 mm).
    ringHeight: 0.089,
  },
  bottomEdge: {
    usb: { x: 0, width: 0.251, height: 0.087 },
    speaker: { x: -0.522, width: 0.284, height: 0.038 },
    mics: [{ x: 0.194, r: 0.015 }],
    sim: { x: 0.467, width: 0.398, height: 0.071 },
    penCap: { x: -0.9, r: 0.073 },
  },
  antennaLines: [1.39, -1.69],
  logo: { y: -1.389, width: 0.641, height: 0.098 },
}

export const GALAXY_VARIANTS: Record<'s26' | 's26ultra', GalaxyPhoneSpec> = {
  s26: S26,
  s26ultra: S26_ULTRA,
}

export type GalaxyVariant = keyof typeof GALAXY_VARIANTS

/** The variant every binding defaults to. */
export const GALAXY_DEFAULT_VARIANT: GalaxyVariant = 's26'

/** Grounded on the bottom edge of the body (its side edge in landscape). */
export const PHONE_FRAMING = {
  contactGap: 0.05,
  extent: ({ variant, orientation }) => {
    const body = GALAXY_VARIANTS[variant ?? GALAXY_DEFAULT_VARIANT].body
    return (orientation === 'landscape' ? body.width : body.height) / 2
  },
} as const satisfies MockupFraming<{ variant?: GalaxyVariant; orientation?: Orientation }>

/** Back-compat: dimensions of the default device (Galaxy S26). */
export const PHONE = S26

/** Display aspect ratio (height / width) of the default device — a 19.5:9 panel. */
export const PHONE_DISPLAY_ASPECT = PHONE.display.height / PHONE.display.width
