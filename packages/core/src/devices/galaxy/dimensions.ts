/**
 * Galaxy-style phone device dimensions - the current Galaxy S26 line
 * (Galaxy S26 and Galaxy S26 Ultra).
 *
 * All variants share one world scale (~36.66 mm per unit - the library's
 * long-standing Galaxy scale, kept so devices stay in true relative size
 * beside the Fold, Watch and every other object in the catalog).
 *
 * Body sizes are the published ones: S26 149.6 x 71.7 x 7.2 mm, S26 Ultra
 * 163.6 x 78.1 x 7.9 mm. Every detail on top of them - corner radii, punch
 * hole, bezel width, camera islands, ring pitch, button pills, wordmark - is
 * measured off the official four-view product renders, whose panels scale
 * exactly to those published widths (0.243 mm/px for the S26, 0.265 for the
 * Ultra), so the numbers come from the hardware rather than from taste.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { Orientation } from '../../orientation'
import type { MockupFraming, MockupMetrics } from '../../regions'

export interface GalaxyPhoneSpec {
  /** Aluminum/titanium frame + chassis. `radius` is the corner radius, `bevel` the edge rounding. */
  body: { width: number; height: number; depth: number; radius: number; bevel: number }
  /** Front cover glass (slightly larger than the active display - forms the bezel ring). */
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
 * Galaxy S26 - 149.6 x 71.7 x 7.2 mm, 6.3" 2340x1080 (19.5:9) flat display.
 * The three lenses sit in a single vertical capsule island top-left of the back
 * - a ~2.4 mm shoulder of island showing all the way around every ring - with
 * the LED flash alone on the flat back just inboard of it. Logical resolution
 * 360x780 (the panel at exactly one-third scale).
 */
const S26: GalaxyPhoneSpec = {
  body: { width: 1.956, height: 4.081, depth: 0.196, radius: 0.19, bevel: 0.02 },
  glass: { width: 1.888, height: 4.021, radius: 0.138 },
  display: { width: 1.829, height: 3.962, radius: 0.129 },
  // Photo-measured: a 3.65 mm hole, its center 3.77 mm below the display's top edge.
  punchHole: { radius: 0.05, offsetY: 0.103 },
  resolution: 360,
  // Photo-measured on the rail: volume pill 19.6 mm at +39.0 mm, power 12.0 mm at +13.2 mm.
  buttons: [
    { y: 1.064, length: 0.535 },
    { y: 0.36, length: 0.327 },
  ],
  buttonProfile: { protrusion: 0.012, thickness: 0.068 },
  rearCamera: {
    ringsX: 0.584,
    // Top to bottom: 12 MP ultra-wide, 50 MP main, 10 MP 3x tele. Rings are
    // 14.8 mm across, 16.0 mm apart, their column 21.4 mm off the back's center.
    rings: [
      { y: 1.647, r: 0.201, pupil: 0.38 },
      { y: 1.21, r: 0.201, pupil: 0.47 },
      { y: 0.774, r: 0.201, pupil: 0.34 },
    ],
    flash: { x: 0.169, y: 1.413 },
    // Photo-measured capsule: 19.3 x 51.4 mm, i.e. a ~2.4 mm shoulder of
    // island around every ring - not the tight sleeve a ring-width pill gives.
    island: { x: 0.584, y: 1.21, width: 0.527, height: 1.402, radius: 0.2635, raise: 0.028 },
    ringHeight: 0.026,
  },
  bottomEdge: {
    usb: { x: 0, width: 0.251, height: 0.087 },
    speaker: { x: 0.449, width: 0.465, height: 0.038 },
    mics: [{ x: -0.189, r: 0.015 }, { x: 0.169, r: 0.015 }],
    sim: { x: -0.535, width: 0.374, height: 0.071 },
  },
  antennaLines: [1.71, -1.47],
  // Photo-measured print: 23.3 x 3.5 mm, centered, 43.5 mm below the back's center.
  logo: { y: -1.186, width: 0.634, height: 0.095 },
}

/**
 * Galaxy S26 Ultra - 163.6 x 78.1 x 7.9 mm, 6.9" 3120x1440 display, titanium
 * frame with newly rounded corners and the S Pen silo on the bottom-left. The
 * rear array moves to the S26 pill language, scaled up: three large rings
 * stacked in a raised stadium island top-left (each ring standing proud of the
 * pill), with the 3x/5x tele pair split into a second column on the flat back
 * beside it, the flash sitting between them. Logical resolution 384x832 (One
 * UI's default FHD+ render at 450 dpi). Detail geometry measured off the
 * official product renders (the 297 px panel scales to the published 78.1 mm,
 * so one pixel is 0.265 mm).
 */
const S26_ULTRA: GalaxyPhoneSpec = {
  // The 2026 Ultra dropped the S25 Ultra's boxy corners: the silhouette
  // measures a 7.3 mm corner radius, the same as the base S26's.
  body: { width: 2.13, height: 4.463, depth: 0.216, radius: 0.199, bevel: 0.02 },
  glass: { width: 2.07, height: 4.403, radius: 0.179 },
  display: { width: 1.995, height: 4.328, radius: 0.138 },
  // Photo-measured: a 3.68 mm hole, its center 3.94 mm below the display's top edge.
  punchHole: { radius: 0.05, offsetY: 0.106 },
  resolution: 384,
  // Photo-measured on the rail: volume pill 20.4 mm at +44.6 mm, power 13.5 mm
  // at +17.5 mm, 0.45 mm proud of the rail, 2.5 mm thick.
  buttons: [
    { y: 1.217, length: 0.546 },
    { y: 0.477, length: 0.364 },
  ],
  buttonProfile: { protrusion: 0.012, thickness: 0.069 },
  rearCamera: {
    ringsX: 0.66,
    rings: [
      // Main column, top to bottom: 50 MP ultra-wide, 200 MP main (widest
      // pupil), 50 MP 5x periscope (small pupil deep in the barrel).
      { y: 1.826, r: 0.224, pupil: 0.4 },
      { y: 1.329, r: 0.224, pupil: 0.47 },
      { y: 0.833, r: 0.224, pupil: 0.3 },
      // Second column on the flat back: 9.3 mm tele rings, much flatter (~1.4 mm
      // proud), sharing the top two rings' rows with the flash between them.
      { x: 0.169, y: 1.826, r: 0.128, h: 0.038, pupil: 0.34 },
      { x: 0.169, y: 1.329, r: 0.128, h: 0.038, pupil: 0.34 },
    ],
    flash: { x: 0.169, y: 1.576 },
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

/** Millimetres per world unit - the shared Galaxy-family scale. */
export const GALAXY_MM_PER_UNIT = 36.66

/**
 * Live geometry of the display, in the current orientation. `landscape` swaps
 * the panel's W/H and re-derives the logical width from the portrait one, so
 * the S26 reads 360x780 upright and 780x360 on its side - exactly what
 * `<Galaxy>` hands its screen bridge.
 */
export const GALAXY_METRICS = {
  mmPerUnit: GALAXY_MM_PER_UNIT,
  regions: ({ variant, orientation }) => {
    const { display, resolution } = GALAXY_VARIANTS[variant ?? GALAXY_DEFAULT_VARIANT]
    const landscape = orientation === 'landscape'
    return {
      screen: {
        width: landscape ? display.height : display.width,
        height: landscape ? display.width : display.height,
        radius: display.radius,
        resolution: Math.round(resolution * (landscape ? display.height / display.width : 1)),
      },
    }
  },
} as const satisfies MockupMetrics<{ variant?: GalaxyVariant; orientation?: Orientation }>

/** Grounded on the bottom edge of the body (its side edge in landscape). */
export const GALAXY_FRAMING = {
  contactGap: 0.05,
  extent: ({ variant, orientation }) => {
    const body = GALAXY_VARIANTS[variant ?? GALAXY_DEFAULT_VARIANT].body
    return (orientation === 'landscape' ? body.width : body.height) / 2
  },
} as const satisfies MockupFraming<{ variant?: GalaxyVariant; orientation?: Orientation }>
