/**
 * iPhone device dimensions — the full iPhone 17 family.
 *
 * All variants share one world scale (~37.15 mm per unit, set so the base
 * iPhone 17's display is exactly 1.8 units wide), so the variants keep their
 * true relative sizes when shown side by side.
 *
 * Camera geometry (plateau footprints and protrusion, lens centers, flash /
 * LiDAR / mic positions and diameters) and the Apple badge come straight from
 * Apple's own dimensional drawings for accessory makers
 * (developer.apple.com/accessories/dimensional-drawings), whose DETAIL D
 * dimensions every position below converts from: Apple measures off the rear
 * view's top-left corner, so a front-view coordinate is
 * `half the body size - Apple's number`. Button pills, bottom-edge drilling
 * and antenna strips were measured from reference 3D scans of the retail
 * devices, normalized to the official body dimensions.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

/** World units per millimeter for the iPhone family. */
import type { Orientation } from '../../orientation'
import type { MockupFraming, MockupMetrics } from '../../regions'

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
    /**
     * The raised pedestal. `radius` is its corner radius, `raise` its height
     * off the back, `wall` how far its top face sits inside the footprint —
     * the width of the sloped wall around it (Apple's drawings put the 17's
     * pill face 2.6 mm inside its base, the Air's 4.7 mm).
     */
    frame: {
      x: number
      y: number
      width: number
      height: number
      radius?: number
      raise?: number
      wall?: number
    }
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
  // Apple's drawing, measured from the rear view's top-left corner: pill base
  // 24.88 x 42.28 mm with its face 2.61 mm inside that, 1.78 mm proud of the
  // glass; two Ø16 lenses 17.72 mm apart on the pill's axis, 3.45 mm of glass
  // above the back (so the rings stand 1.67 mm off the pill); the Ø6.28 flash
  // out on the flat back and the Ø1 mic on the pill beside the lenses, both on
  // the lens pair's center line.
  rearCamera: {
    style: 'pill',
    frame: { x: 0.5949, y: 1.4086, width: 0.6697, height: 1.1381, raise: 0.0479, wall: 0.0703 },
    lenses: [
      { x: 0.5949, y: 1.647, r: 0.2153, h: 0.045 },
      { x: 0.5949, y: 1.1701, r: 0.2153, h: 0.045 },
    ],
    flash: { x: 0.1429, y: 1.4086, r: 0.0845 },
    dots: [{ x: 0.4086, y: 1.4086, r: 0.0135 }],
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
  // Apple's drawing: 15.75 x 19.34 mm, centered, its center 73.18 mm below the
  // top edge — a hair above the body's center line.
  logo: { y: 0.044, width: 0.4239, height: 0.5206 },
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
  // Apple's drawing: a stadium plateau 33.03 mm tall (so fully rounded ends),
  // its top edge 1.14 mm below the product's top edge, 3.03 mm proud of the
  // glass with a broad 4.7 mm sloped wall; the single Ø15.82 lens 16.29 mm in
  // from the top-left corner, with the Ø2.30 mic and Ø6.30 flash on that same
  // center line at 51.34 and 58.42 mm.
  rearCamera: {
    style: 'bar',
    frame: { x: 0, y: 1.627, width: 1.739, height: 0.889, radius: 0.4445, raise: 0.082, wall: 0.128 },
    lenses: [{ x: 0.5669, y: 1.6638, r: 0.21, h: 0.0713 }],
    flash: { x: -0.5672, y: 1.6638, r: 0.0848 },
    dots: [{ x: -0.3766, y: 1.6638, r: 0.031 }],
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
  // Apple's drawing: 15.29 x 18.77 mm, centered, 77.19 mm below the top edge.
  logo: { y: 0.0246, width: 0.4116, height: 0.5052 },
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
  // Apple's drawing: the plateau is the unibody's own shelf — it runs the full
  // width, its top edge IS the product's top edge, and it steps down to the
  // glass 44.01 mm below that, standing 2.55 mm proud. The lens trio sits
  // 14.37 mm in from the top-left corner (rows 14.37 / 33.61, third lens at
  // 32.36 across on the 23.99 mm center line), and the Ø6.80 flash, Ø1.05 mic
  // and Ø6.65 LiDAR share the 58.03 mm column at rows 13.82 / 23.99 / 34.16.
  rearCamera: {
    style: 'bar',
    frame: { x: 0, y: 1.4167, width: 1.895, height: 1.1647, radius: 0.269, raise: 0.0686 },
    lenses: [
      { x: 0.5802, y: 1.6321, r: 0.215, h: 0.02 }, // main (top-left from the back)
      { x: 0.5802, y: 1.1142, r: 0.215, h: 0.02 }, // ultra wide (bottom-left)
      { x: 0.096, y: 1.3733, r: 0.215, h: 0.02 }, // telephoto (inboard, mid-height)
    ],
    flash: { x: -0.5949, y: 1.647, r: 0.0915 },
    dots: [
      { x: -0.5949, y: 1.0994, r: 0.0895 }, // LiDAR
      { x: -0.5949, y: 1.3733, r: 0.0141 }, // mic
    ],
  },
  // Apple's drawing: 64.06 x 98.14 mm with generous ~16 mm corners, spanning
  // 47.96 to 146.10 mm below the top edge.
  backWindow: { y: -0.5929, width: 1.7243, height: 2.6417, radius: 0.4307 },
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
  // Apple's drawing: 16.32 x 20.04 mm, centered in the glass window rather than
  // on the body — 95.30 mm below the top edge, i.e. 20.30 mm below the body's
  // center line, so the MagSafe ring lands around it.
  logo: { y: -0.5464, width: 0.4393, height: 0.5394 },
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
  // Apple's drawing: same plateau architecture and the same camera rows as the
  // Pro — full-width unibody shelf from the top edge down to 44.01 mm, 2.55 mm
  // proud, lens trio 14.37 mm in from the top-left corner — with the flash /
  // mic / LiDAR column pushed out to 64.16 mm by the wider body.
  rearCamera: {
    style: 'bar',
    frame: { x: 0, y: 1.5969, width: 2.06, height: 1.1642, radius: 0.32, raise: 0.0686 },
    lenses: [
      { x: 0.6632, y: 1.8127, r: 0.219, h: 0.02 },
      { x: 0.6632, y: 1.2947, r: 0.219, h: 0.02 },
      { x: 0.179, y: 1.5537, r: 0.219, h: 0.02 },
    ],
    flash: { x: -0.677, y: 1.8127, r: 0.0915 },
    dots: [
      { x: -0.677, y: 1.28, r: 0.0895 }, // LiDAR
      { x: -0.677, y: 1.5537, r: 0.0155 }, // mic
    ],
  },
  // Apple's drawing: Ceramic Shield window 70.19 x 111.57 mm with ~16 mm
  // corners, 47.96 to 159.53 mm below the top edge — the two-tone back.
  backWindow: { y: -0.5932, width: 1.8894, height: 3.0032, radius: 0.4307 },
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
  // Apple's drawing: 16.32 x 20.04 mm — the same badge as the Pro, and the same
  // 20.30 mm below the body's center line, centered in the glass window.
  logo: { y: -0.5464, width: 0.4393, height: 0.5394 },
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

/** Millimetres per world unit — the shared iPhone-family scale. */
export const IPHONE_MM_PER_UNIT = 37.15

/** Live geometry of the display, in the current orientation. */
export const IPHONE_METRICS = {
  mmPerUnit: IPHONE_MM_PER_UNIT,
  regions: ({ variant, orientation }) => {
    const { display, resolution } = IPHONE_VARIANTS[variant ?? IPHONE_DEFAULT_VARIANT]
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
} as const satisfies MockupMetrics<{ variant?: IPhoneVariant; orientation?: Orientation }>

/** Grounded on the bottom edge of the body (its side edge in landscape). */
export const IPHONE_FRAMING = {
  contactGap: 0.05,
  extent: ({ variant, orientation }) => {
    const body = IPHONE_VARIANTS[variant ?? IPHONE_DEFAULT_VARIANT].body
    return (orientation === 'landscape' ? body.width : body.height) / 2
  },
} as const satisfies MockupFraming<{ variant?: IPhoneVariant; orientation?: Orientation }>
