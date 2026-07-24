/**
 * iPhone device dimensions — the full iPhone 17 family.
 *
 * All variants share one world scale (~37.15 mm per unit, set so the base
 * iPhone 17's display is exactly 1.8 units wide), so the variants keep their
 * true relative sizes when shown side by side.
 *
 * Detail geometry — button pills (lengths, positions, protrusion), the camera
 * plateau, lens triangle, flash/LiDAR column, bottom-edge drilling, antenna
 * strips and badges — was measured from reference 3D scans of the retail
 * devices, normalized to the official body dimensions.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

/** World units per millimeter for the iPhone family. */
import type { Orientation } from '../../orientation'
import type { MockupFraming } from '../../regions'

export const IPHONE_MM = 1 / 37.15

/** A side key. `flush: true` renders it seated in the rail (Camera Control). */
export interface IPhoneButton {
  edge: 'left' | 'right'
  y: number
  length: number
  flush?: boolean
}

export interface IPhoneSpec {
  /** Flat frame + chassis. `radius` is the corner radius, `bevel` the edge rounding. */
  body: { width: number; height: number; depth: number; radius: number; bevel: number }
  /** Front cover glass (slightly larger than the active display — forms the bezel ring). */
  glass: { width: number; height: number; radius: number }
  /** Active display area. Content you pass as children is mapped onto this rect. */
  display: { width: number; height: number; radius: number }
  /** Dynamic Island pill: size + distance from the top display edge to its center. */
  island: { width: number; height: number; offsetY: number }
  /** Default CSS px width of the portrait virtual display (the device's logical point grid). */
  resolution: number
  /** Side keys (Action, volume, side button, Camera Control), spec-accurate. */
  buttons: IPhoneButton[]
  /** Shared side-key profile: protrusion beyond the rail and z thickness of the pill. */
  buttonProfile: { protrusion: number; thickness: number }
  /** Rear camera architecture in front-view coordinates (mirrored on the back panel). */
  rearCamera: {
    /**
     * `pill`: vertical pill hugging the lenses (iPhone 17).
     * `bar`: full-width plateau across the top of the back (17 Air, 17 Pro/Pro Max).
     */
    style: 'pill' | 'bar'
    /** The raised pedestal. `radius` is its corner radius, `raise` its height off the back. */
    frame: { x: number; y: number; width: number; height: number; radius?: number; raise?: number }
    /** Lens rings with absolute positions. `h` is how far the ring stands proud of the pedestal. */
    lenses: { x: number; y: number; r: number; h?: number; pupil?: number }[]
    flash: { x: number; y: number; r: number }
    /** Small auxiliary dots (mic, LiDAR…). */
    dots?: { x: number; y: number; r: number }[]
  }
  /**
   * Ceramic Shield window on the lower back (the 17 Pro generation's aluminum
   * unibody has a separate flush glass rounded-rect for MagSafe/charging).
   */
  backWindow?: { y: number; width: number; height: number; radius: number }
  /** Bottom-edge drilling: USB-C, the two screws and the speaker/mic hole rows. */
  bottomEdge?: {
    usb: { x: number; width: number; height: number }
    screws?: { x: number; r: number }[]
    speakers?: { x: number; r: number }[]
  }
  /** Antenna strips crossing the side rails: y positions, mirrored onto both edges. */
  antennaLines?: number[]
  /** RF window strip centered on the top edge (Pro Max). */
  topWindow?: { width: number; height: number }
  /** Apple badge on the back: box centered at x = 0. */
  logo?: { y: number; width: number; height: number }
}

/**
 * iPhone 17 — 149.6 x 71.5 x 7.95 mm, 6.3" 2622x1206 display, Dynamic Island,
 * vertical two-lens camera pill. Logical resolution 402x874 pt. Button and
 * edge detail follows the family scan geometry.
 */
const IPHONE_17: IPhoneSpec = {
  body: { width: 1.925, height: 4.027, depth: 0.214, radius: 0.34, bevel: 0.02 },
  glass: { width: 1.865, height: 3.967, radius: 0.31 },
  display: { width: 1.8, height: 3.9134, radius: 0.28 },
  island: { width: 0.56, height: 0.17, offsetY: 0.16 },
  resolution: 402,
  buttons: [
    { edge: 'left', y: 1.127, length: 0.17 },
    { edge: 'left', y: 0.739, length: 0.29 },
    { edge: 'left', y: 0.351, length: 0.295 },
    { edge: 'right', y: 0.533, length: 0.476 },
    { edge: 'right', y: -0.721, length: 0.467, flush: true },
  ],
  buttonProfile: { protrusion: 0.011, thickness: 0.058 },
  rearCamera: {
    style: 'pill',
    frame: { x: 1.925 / 2 - 0.41, y: 4.027 / 2 - 0.72, width: 0.58, height: 1.2, raise: 0.03 },
    lenses: [
      { x: 1.925 / 2 - 0.41, y: 4.027 / 2 - 0.72 + 0.3, r: 0.225, h: 0.05 },
      { x: 1.925 / 2 - 0.41, y: 4.027 / 2 - 0.72 - 0.3, r: 0.225, h: 0.05 },
    ],
    flash: { x: 1.925 / 2 - 0.86, y: 4.027 / 2 - 0.42, r: 0.06 },
    dots: [{ x: 1.925 / 2 - 0.86, y: 4.027 / 2 - 0.64, r: 0.018 }],
  },
  bottomEdge: {
    usb: { x: 0, width: 0.239, height: 0.071 },
    screws: [{ x: 0.203, r: 0.022 }, { x: -0.238, r: 0.022 }],
    speakers: [
      { x: 0.313, r: 0.024 },
      { x: 0.375, r: 0.024 },
      { x: -0.349, r: 0.024 },
      { x: -0.409, r: 0.024 },
    ],
  },
  antennaLines: [1.6, -1.6],
  logo: { y: 0.015, width: 0.42, height: 0.517 },
}

/**
 * iPhone 17 Air — 156.2 x 74.7 x 5.64 mm (ultra-thin), 6.5" 2736x1260 display.
 * Single 48MP lens in a full-width stadium bar across the top of the back with
 * the flash and mic on the opposite half; titanium frame; buttons protrude a
 * bare 0.3 mm. Logical resolution 420x912 pt.
 */
const IPHONE_17_AIR: IPhoneSpec = {
  body: { width: 2.011, height: 4.205, depth: 0.152, radius: 0.338, bevel: 0.016 },
  glass: { width: 1.951, height: 4.145, radius: 0.31 },
  display: { width: 1.873, height: 4.066, radius: 0.276 },
  island: { width: 0.557, height: 0.168, offsetY: 0.183 },
  resolution: 420,
  // Scan: Action 6.3 mm at +45.2, volumes 10.8/10.9 at +30.8/+16.4 (left rail);
  // side key 17.7 mm at +23.1, flush Camera Control 17.4 mm at -26.8 (right rail).
  buttons: [
    { edge: 'left', y: 1.216, length: 0.17 },
    { edge: 'left', y: 0.828, length: 0.29 },
    { edge: 'left', y: 0.44, length: 0.295 },
    { edge: 'right', y: 0.622, length: 0.476 },
    { edge: 'right', y: -0.721, length: 0.467, flush: true },
  ],
  buttonProfile: { protrusion: 0.008, thickness: 0.058 },
  rearCamera: {
    style: 'bar',
    // Perfect stadium 64.6 x 22.8 mm, 3 mm proud, ends inset 6 mm from the rails.
    frame: { x: 0, y: 1.668, width: 1.739, height: 0.613, radius: 0.307, raise: 0.082 },
    lenses: [{ x: 0.577, y: 1.668, r: 0.21, h: 0.056 }],
    flash: { x: -0.566, y: 1.668, r: 0.079 },
    dots: [{ x: -0.372, y: 1.666, r: 0.023 }],
  },
  bottomEdge: {
    usb: { x: 0, width: 0.239, height: 0.071 },
    screws: [{ x: 0.203, r: 0.022 }, { x: -0.238, r: 0.022 }],
    speakers: [
      { x: 0.313, r: 0.024 },
      { x: 0.375, r: 0.024 },
      { x: -0.349, r: 0.024 },
      { x: -0.409, r: 0.024 },
    ],
  },
  antennaLines: [1.67, -1.67],
  logo: { y: 0.015, width: 0.42, height: 0.517 },
}

/**
 * iPhone 17 Pro — 150.0 x 71.9 x 8.75 mm, 6.3" 2622x1206 display (same panel
 * as the 17). Aluminum unibody with the full-width camera plateau: triangular
 * 48MP trio on one side, flash + mic + LiDAR column on the other, and the
 * Ceramic Shield charging window on the lower back. Logical resolution
 * 402x874 pt. Detail geometry from a retail-unit scan.
 */
const IPHONE_17_PRO: IPhoneSpec = {
  body: { width: 1.935, height: 4.038, depth: 0.2355, radius: 0.289, bevel: 0.02 },
  glass: { width: 1.875, height: 3.978, radius: 0.26 },
  display: { width: 1.8, height: 3.9134, radius: 0.23 },
  island: { width: 0.528, height: 0.16, offsetY: 0.15 },
  resolution: 402,
  // Scan: Action 6.7 mm at +43.0, volumes 10.6 at +29.8/+16.6; side key 16.9 mm
  // at +23.4; flush Camera Control at -29.6.
  buttons: [
    { edge: 'left', y: 1.159, length: 0.179 },
    { edge: 'left', y: 0.802, length: 0.284 },
    { edge: 'left', y: 0.447, length: 0.284 },
    { edge: 'right', y: 0.629, length: 0.454 },
    { edge: 'right', y: -0.797, length: 0.458, flush: true },
  ],
  buttonProfile: { protrusion: 0.011, thickness: 0.072 },
  rearCamera: {
    style: 'bar',
    // Plateau 64.4 x 39.0 mm across the top ~27% of the back, ~1.7 mm proud.
    frame: { x: 0, y: 1.386, width: 1.734, height: 1.05, radius: 0.14, raise: 0.046 },
    lenses: [
      { x: 0.607, y: 1.655, r: 0.215, h: 0.03 }, // main (top-left from the back)
      { x: 0.607, y: 1.129, r: 0.215, h: 0.03 }, // ultra wide (bottom-left)
      { x: 0.131, y: 1.411, r: 0.215, h: 0.03 }, // telephoto (inboard, mid-height)
    ],
    flash: { x: -0.619, y: 1.709, r: 0.09 },
    dots: [
      { x: -0.622, y: 1.03, r: 0.082 }, // LiDAR
      { x: -0.617, y: 1.39, r: 0.016 }, // mic
    ],
  },
  backWindow: { y: -0.556, width: 1.747, height: 2.74, radius: 0.235 },
  bottomEdge: {
    usb: { x: 0, width: 0.239, height: 0.073 },
    screws: [{ x: 0.183, r: 0.02 }, { x: -0.183, r: 0.02 }],
    speakers: [
      // Scan: six drilled holes per side, slightly asymmetric groups. Hole
      // radius from the retail drilling (~1.8 mm bore) — the scan's clusters
      // read wider because they include each hole's chamfer, which would make
      // neighboring cavities intersect.
      { x: -0.552, r: 0.024 },
      { x: -0.485, r: 0.024 },
      { x: -0.425, r: 0.024 },
      { x: -0.358, r: 0.024 },
      { x: -0.283, r: 0.024 },
      { x: -0.231, r: 0.024 },
      { x: 0.312, r: 0.024 },
      { x: 0.374, r: 0.024 },
      { x: 0.436, r: 0.024 },
      { x: 0.503, r: 0.024 },
      { x: 0.573, r: 0.024 },
      { x: 0.63, r: 0.024 },
    ],
  },
  antennaLines: [1.62, -1.62],
  logo: { y: 0.04, width: 0.42, height: 0.521 },
}

/**
 * iPhone 17 Pro Max — 163.4 x 78.0 x 8.75 mm, 6.9" 2868x1320 display. Same
 * plateau architecture as the Pro at the larger size, plus the top-edge RF
 * window. Logical resolution 440x956 pt. Detail geometry from a retail-unit
 * scan (dimensionally the cleanest of the family models).
 */
const IPHONE_17_PRO_MAX: IPhoneSpec = {
  body: { width: 2.1, height: 4.398, depth: 0.2355, radius: 0.34, bevel: 0.02 },
  glass: { width: 2.04, height: 4.338, radius: 0.3 },
  display: { width: 1.962, height: 4.263, radius: 0.274 },
  island: { width: 0.561, height: 0.163, offsetY: 0.142 },
  resolution: 440,
  // Scan: Action 6.9 mm at +47.4, volumes 11.2 at +33.3/+19.1; side key 17.7 mm
  // at +26.2; flush Camera Control at -30.1. All 2.7 mm thick, 0.45 mm proud.
  buttons: [
    { edge: 'left', y: 1.276, length: 0.186 },
    { edge: 'left', y: 0.896, length: 0.302 },
    { edge: 'left', y: 0.514, length: 0.302 },
    { edge: 'right', y: 0.705, length: 0.477 },
    { edge: 'right', y: -0.81, length: 0.455, flush: true },
  ],
  buttonProfile: { protrusion: 0.012, thickness: 0.072 },
  rearCamera: {
    style: 'bar',
    // Plateau 68.2 x 37.9 mm, 2.5 mm proud, 5 mm margins.
    frame: { x: 0, y: 1.549, width: 1.836, height: 1.02, radius: 0.12, raise: 0.067 },
    lenses: [
      { x: 0.665, y: 1.812, r: 0.219, h: 0.046 },
      { x: 0.665, y: 1.295, r: 0.219, h: 0.046 },
      { x: 0.179, y: 1.554, r: 0.219, h: 0.046 },
    ],
    flash: { x: -0.681, y: 1.827, r: 0.091 },
    dots: [
      { x: -0.681, y: 1.28, r: 0.09 }, // LiDAR
      { x: -0.68, y: 1.554, r: 0.012 }, // mic
    ],
  },
  // Flush Ceramic Shield window 70.7 x 110.8 mm, r 9.5 — the two-tone back.
  backWindow: { y: -0.605, width: 1.902, height: 2.983, radius: 0.256 },
  bottomEdge: {
    usb: { x: 0, width: 0.244, height: 0.085 },
    screws: [{ x: 0.187, r: 0.02 }, { x: -0.187, r: 0.02 }],
    speakers: [
      { x: 0.333, r: 0.021 },
      { x: 0.394, r: 0.021 },
      { x: 0.455, r: 0.021 },
      { x: 0.516, r: 0.021 },
      { x: 0.577, r: 0.021 },
      { x: 0.637, r: 0.021 },
      { x: -0.333, r: 0.021 },
      { x: -0.394, r: 0.021 },
      { x: -0.455, r: 0.021 },
      { x: -0.516, r: 0.021 },
      { x: -0.577, r: 0.021 },
      { x: -0.637, r: 0.021 },
    ],
  },
  antennaLines: [1.764, -1.764],
  topWindow: { width: 0.738, height: 0.121 },
  logo: { y: -0.546, width: 0.441, height: 0.539 },
}

export const IPHONE_VARIANTS: Record<'17' | 'air' | 'pro' | 'promax', IPhoneSpec> = {
  '17': IPHONE_17,
  air: IPHONE_17_AIR,
  pro: IPHONE_17_PRO,
  promax: IPHONE_17_PRO_MAX,
}

export type IPhoneVariant = keyof typeof IPHONE_VARIANTS

/** The variant every binding defaults to. */
export const IPHONE_DEFAULT_VARIANT: IPhoneVariant = '17'

/** Grounded on the bottom edge of the body (its side edge in landscape). */
export const IPHONE_FRAMING = {
  contactGap: 0.05,
  extent: ({ variant, orientation }) => {
    const body = IPHONE_VARIANTS[variant ?? IPHONE_DEFAULT_VARIANT].body
    return (orientation === 'landscape' ? body.width : body.height) / 2
  },
} as const satisfies MockupFraming<{ variant?: IPhoneVariant; orientation?: Orientation }>

/** Back-compat: dimensions of the default device (iPhone 17). */
export const IPHONE = IPHONE_17

/** Display aspect ratio (height / width) of the default device. */
export const IPHONE_DISPLAY_ASPECT = IPHONE.display.height / IPHONE.display.width
