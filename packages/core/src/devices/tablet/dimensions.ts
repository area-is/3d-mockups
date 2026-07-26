/**
 * Tablet device dimensions — the current Apple iPad lineup (iPad Pro M5,
 * iPad Air M4, iPad A16) and Samsung Galaxy Tab S11 family.
 *
 * All variants share one world scale (~64 mm per unit, set so the 13" iPad
 * Pro's portrait body is 4.4 units tall), so tablets keep their true relative
 * sizes side by side. Coordinates are portrait-first; `orientation` handles
 * landscape. Rear-hardware coordinates are FRONT-view (they mirror on the
 * back panel).
 *
 * Every iPad detail — camera pod and lens boss, buttons, Smart Connector,
 * Pencil connector window, speaker drilling — comes from Apple's own
 * dimensional drawings for accessory makers
 * (developer.apple.com/accessories/dimensional-drawings). Apple dimensions the
 * rear view from the top-left corner and the edges from the nearest corner, so
 * every number below is `half the body size - Apple's number`. The Galaxy Tabs
 * follow Samsung's product photography and spec sheets (photo-measured values
 * noted per variant).
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { Orientation } from '../../orientation'
import type { CameraFraming, MockupFraming } from '../../regions'

export interface TabletSpec {
  /** Ultra-thin flat slab. `radius` is the corner radius, `bevel` the edge rounding. */
  body: { width: number; height: number; depth: number; radius: number; bevel: number }
  /** Front cover glass (slightly larger than the active display — forms the bezel ring). */
  glass: { width: number; height: number; radius: number }
  /** Active display area (portrait). Content you pass as children maps onto this rect. */
  display: { width: number; height: number; radius: number }
  /** Default CSS px width of the portrait virtual display (logical pt/dp grid). */
  resolution: number
  /** Optional front-camera display notch (Galaxy Tab Ultra), portrait top edge. */
  notch?: { width: number; height: number; radius: number }
  /** Rear camera, front-view coordinates (mirrored on the back panel). */
  rearCamera:
    | {
        /** iPad-Pro-style rounded-square pod: wide lens + LiDAR on the corner
         * column, flash + sensor dot + mic inboard. */
        style: 'pod'
        x: number
        y: number
        size: number
        radius: number
      }
    | {
        /** iPad-Air/iPad-style bare raised lens: polished ring straight out of
         * the aluminum, no plate, no flash — plus the pinhole mic beside it.
         * `r` is the black lens window's ring; `boss` the wider body-colored
         * mound it rises from (Apple draws Ø16.92 around an Ø11.89 window). */
        style: 'single'
        x: number
        y: number
        r: number
        boss?: number
        mic: { x: number; y: number }
      }
    | {
        /** Galaxy-Tab-style individual floating ring(s) + flash dot. */
        style: 'rings'
        rings: { x: number; y: number; r: number }[]
        flash: { x: number; y: number }
      }
  /** Top-edge button (iPads: the top/Touch ID button toward the right corner). */
  topButton?: { x: number; length: number }
  /**
   * Buttons on the portrait-right edge (the landscape-top edge), from the
   * top: the iPads' two separate volume pills, or the Galaxy Tabs' volume
   * rocker + power key (volume sits closer to the corner, per Samsung's
   * layout diagram).
   */
  sideButtons: { y: number; length: number }[]
  /** Which short edge carries the USB-C port in portrait. The Galaxy Tabs'
   * port sits on the edge adjacent to the camera corner — the portrait TOP
   * edge (it centers on the landscape-left edge); iPads use the bottom. */
  usbEdge?: 'top' | 'bottom'
  /**
   * Stylus attachment strip on the portrait right edge (the landscape-top
   * long edge): the iPad Pencil charging strip, or the Tab S11 magnetic
   * side-mount for the hexagonal S Pen (this generation retired the
   * back-panel charging strip; the pen clips to the long sides). `offsetY`
   * shifts the strip along the edge, clear of the buttons. Absent on the
   * standard iPad (A16): the Pencil parks magnetically but there is no
   * charging strip.
   */
  stylus?: { length: number; offsetY: number }
  /**
   * Keyboard pogo contacts — three dots. `surface: 'back'` puts them on the
   * back panel laid along `axis` ('x' = a horizontal row, the iPads' Smart
   * Connector near the portrait-bottom edge; 'y' = a vertical column, the
   * Galaxy Tabs' contacts ~11 mm in from the portrait-left edge, centered).
   * `surface: 'edge'` sinks them into the portrait-left rail itself
   * (standard iPad A16, for the Magic Keyboard Folio).
   */
  pogo?: { surface: 'back' | 'edge'; x: number; y: number; axis: 'x' | 'y'; spacing: number }
  /**
   * Brand mark on the back. Apple's glyph sits centered (x 0), portrait
   * upright. Samsung's wordmark sits near the corner diagonal from the
   * cameras, set for the landscape hold — `rotate` lays it along the edge in
   * portrait, exactly like the hardware print.
   */
  logo?: { mark: 'apple' | 'samsung'; x?: number; y: number; width: number; height: number; rotate?: boolean }
  /** Model wordmark ("iPad Pro"…) printed near the portrait-bottom of the back. */
  backText?: { text: string; y: number; height: number }
  /**
   * Speaker machining on the short edges, mirrored top and bottom: the
   * iPads' drilled hole clusters (one per `xs` entry), or the Galaxy Tabs'
   * long milled slots near the corners.
   */
  speakers?:
    | {
        style: 'holes'
        xs: number[]
        count: number
        spacing: number
        r: number
        /**
         * Holes dropped from the outer end of the positive-x run on the TOP
         * edge only — the A16's top button truncates that run (12 → 9 on the
         * reference scan) while the other three runs keep the full count.
         */
        topTrim?: number
      }
    | { style: 'slots'; xs: number[]; length: number; width: number }
}

/**
 * iPad Pro 13" (M5, Oct 2025 — the M4 chassis carried over): 281.6 x 215.5
 * x 5.1 mm, 13" 2752x2064 tandem OLED, uniform ~8.4 mm bezel. Logical
 * resolution 1032x1376 pt. Camera pod ~32 mm square: wide lens top-left +
 * LiDAR below it (back view), flash/sensor/mic inboard. Smart Connector:
 * three dots on the back near the portrait-bottom edge.
 */
const IPAD_PRO_13: TabletSpec = {
  body: { width: 3.367, height: 4.4, depth: 0.08, radius: 0.2, bevel: 0.01 },
  glass: { width: 3.31, height: 4.343, radius: 0.18 },
  display: { width: 3.095, height: 4.128, radius: 0.16 },
  resolution: 1032,
  // Apple's drawing: the pod is a 31.44 mm rounded square whose outer edge sits
  // 4.32 mm from the top and side edges, so its center is 20.04 mm in.
  rearCamera: { style: 'pod', x: 3.367 / 2 - 0.3131, y: 4.4 / 2 - 0.3131, size: 0.4913, radius: 0.14 },
  // Top button 12.06 mm long, 13.98 mm from the corner.
  topButton: { x: 3.367 / 2 - 0.3127, length: 0.1884 },
  // Volume pills 10.06 mm long starting 19.33 and 31.39 mm from the top corner.
  sideButtons: [
    { y: 4.4 / 2 - 0.3806, length: 0.1572 },
    { y: 4.4 / 2 - 0.5691, length: 0.1572 },
  ],
  // The Pencil's magnetic-connector window: a 25.53 mm non-metal strip centered
  // on the edge — not the whole length the Pencil clings to.
  stylus: { length: 0.399, offsetY: 0 },
  // Smart Connector: three Ø3.40 pins 5.27 mm apart, 12.00 mm up from the edge.
  pogo: { surface: 'back', x: 0, y: -4.4 / 2 + 0.1875, axis: 'x', spacing: 0.0823 },
  logo: { mark: 'apple', y: 0.02, width: 0.63, height: 0.774 },
  // 28 Ø1.60 holes per edge: two runs of 14 spanning 35.07–65.49 mm from each
  // corner, so 2.34 mm pitch centered 50.28 mm in.
  speakers: { style: 'holes', xs: [-0.8982, 0.8982], count: 14, spacing: 0.0366, r: 0.0125 },
}

/**
 * iPad Pro 11" (M5, Oct 2025): 249.7 x 177.5 x 5.3 mm, 11" 2420x1668.
 * Logical resolution 834x1210 pt.
 */
const IPAD_PRO_11: TabletSpec = {
  body: { width: 2.773, height: 3.902, depth: 0.083, radius: 0.19, bevel: 0.01 },
  glass: { width: 2.716, height: 3.845, radius: 0.17 },
  display: { width: 2.508, height: 3.639, radius: 0.15 },
  resolution: 834,
  // Apple's drawing gives the 11" the SAME camera pod, buttons, Smart Connector
  // and speaker runs as the 13" — only the body around them changes.
  rearCamera: { style: 'pod', x: 2.773 / 2 - 0.3131, y: 3.902 / 2 - 0.3131, size: 0.4913, radius: 0.14 },
  topButton: { x: 2.773 / 2 - 0.3127, length: 0.1884 },
  sideButtons: [
    { y: 3.902 / 2 - 0.3806, length: 0.1572 },
    { y: 3.902 / 2 - 0.5691, length: 0.1572 },
  ],
  stylus: { length: 0.399, offsetY: 0 },
  pogo: { surface: 'back', x: 0, y: -3.902 / 2 + 0.1875, axis: 'x', spacing: 0.0823 },
  logo: { mark: 'apple', y: 0.02, width: 0.6, height: 0.737 },
  speakers: { style: 'holes', xs: [-0.6011, 0.6011], count: 14, spacing: 0.0366, r: 0.0125 },
}

/**
 * iPad Air 13" (M4, Mar 2026 — the M2/M3 chassis carried over): 280.6 x
 * 214.9 x 6.1 mm, 12.9" 2732x2048 Liquid Retina, uniform ~8.9 mm bezel.
 * Logical resolution 1024x1366 pt. Bare single 12 MP lens (polished ring
 * ~13.5 mm, no flash) at the back's top-left with the pinhole mic below it;
 * Touch ID top button; Smart Connector dots on the back, bottom center.
 */
const IPAD_AIR_13: TabletSpec = {
  body: { width: 3.358, height: 4.384, depth: 0.095, radius: 0.16, bevel: 0.012 },
  glass: { width: 3.3, height: 4.327, radius: 0.14 },
  display: { width: 3.08, height: 4.106, radius: 0.12 },
  resolution: 1024,
  // Apple's drawing: lens center 12.69 mm in from the top and side edges, an
  // Ø11.89 window inside an Ø16.92 body-colored mound, mic 27.62 mm from the top.
  rearCamera: {
    style: 'single',
    x: 3.358 / 2 - 0.1983,
    y: 4.384 / 2 - 0.1983,
    r: 0.1084,
    boss: 0.1322,
    mic: { x: 3.358 / 2 - 0.1983, y: 4.384 / 2 - 0.1983 - 0.2333 },
  },
  // Touch ID top button 12.69 mm long, 17.12 mm from the corner.
  topButton: { x: 3.358 / 2 - 0.3667, length: 0.1983 },
  // Volume pills 10.06 mm long starting 19.49 and 31.55 mm from the top corner.
  sideButtons: [
    { y: 4.384 / 2 - 0.3831, length: 0.1572 },
    { y: 4.384 / 2 - 0.5716, length: 0.1572 },
  ],
  stylus: { length: 0.399, offsetY: 0 },
  // Smart Connector: three Ø3.40 pins 4.97 mm apart, 10.02 mm up from the edge.
  pogo: { surface: 'back', x: 0, y: -4.384 / 2 + 0.1566, axis: 'x', spacing: 0.0777 },
  logo: { mark: 'apple', y: 0.03, width: 0.61, height: 0.75 },
  backText: { text: 'iPad Air', y: -4.384 / 2 + 0.34, height: 0.052 },
  // 24 Ø1.76 holes per edge: two runs of 12 spanning 35.50–63.71 mm from each corner.
  speakers: { style: 'holes', xs: [-0.9038, 0.9038], count: 12, spacing: 0.0401, r: 0.01375 },
}

/**
 * iPad Air 11" (M4, Mar 2026): 247.6 x 178.5 x 6.1 mm, 10.86" 2360x1640,
 * uniform ~10.3 mm bezel. Logical resolution 820x1180 pt.
 */
const IPAD_AIR_11: TabletSpec = {
  body: { width: 2.789, height: 3.869, depth: 0.095, radius: 0.15, bevel: 0.012 },
  glass: { width: 2.732, height: 3.812, radius: 0.13 },
  display: { width: 2.466, height: 3.548, radius: 0.11 },
  resolution: 820,
  // Same camera module, buttons and Smart Connector as the 13" Air; only the
  // speaker runs move in with the narrower body (28.22–56.44 mm per Apple).
  rearCamera: {
    style: 'single',
    x: 2.789 / 2 - 0.1983,
    y: 3.869 / 2 - 0.1983,
    r: 0.1084,
    boss: 0.1322,
    mic: { x: 2.789 / 2 - 0.1983, y: 3.869 / 2 - 0.1983 - 0.2333 },
  },
  topButton: { x: 2.789 / 2 - 0.3667, length: 0.1983 },
  sideButtons: [
    { y: 3.869 / 2 - 0.3831, length: 0.1572 },
    { y: 3.869 / 2 - 0.5716, length: 0.1572 },
  ],
  stylus: { length: 0.399, offsetY: 0 },
  pogo: { surface: 'back', x: 0, y: -3.869 / 2 + 0.1566, axis: 'x', spacing: 0.0777 },
  logo: { mark: 'apple', y: 0.03, width: 0.58, height: 0.712 },
  backText: { text: 'iPad Air', y: -3.869 / 2 + 0.31, height: 0.05 },
  speakers: { style: 'holes', xs: [-0.7331, 0.7331], count: 12, spacing: 0.0401, r: 0.01375 },
}

/**
 * iPad (11th generation, A16, Mar 2025 — the 10th-gen chassis carried over):
 * 248.6 x 179.5 x 7.0 mm, 10.86" 2360x1640 Liquid Retina, uniform ~10.8 mm
 * bezel, crisper chamfered rails than the Air. Logical resolution
 * 820x1180 pt. Bare single lens (no flash), ~17 mm Touch ID top button,
 * volumes on the right edge, Smart Connector dots set into the LEFT rail
 * (Magic Keyboard Folio), no Pencil charging strip.
 */
const IPAD_11: TabletSpec = {
  // Corner rounding measured at ~15.3 mm on this chassis — visibly softer
  // than the Air/Pro, with the camera ring "nesting" inside the corner arc.
  body: { width: 2.805, height: 3.884, depth: 0.109, radius: 0.235, bevel: 0.008 },
  glass: { width: 2.748, height: 3.828, radius: 0.21 },
  display: { width: 2.464, height: 3.549, radius: 0.1 },
  resolution: 820,
  // Apple's drawing: the same camera module as the Air (Ø11.89 window inside an
  // Ø16.92 mound), sitting 14.90 mm in from both edges, mic 29.62 from the top.
  rearCamera: {
    style: 'single',
    x: 2.805 / 2 - 0.2328,
    y: 3.884 / 2 - 0.2328,
    r: 0.1084,
    boss: 0.1322,
    mic: { x: 2.805 / 2 - 0.2328, y: 3.884 / 2 - 0.2328 - 0.23 },
  },
  // Sleep/wake button 15.15 mm long, 17.12 mm from the corner.
  topButton: { x: 2.805 / 2 - 0.3855, length: 0.2367 },
  // Volume pills 10.06 mm long starting 22.72 and 34.78 mm from the top corner.
  sideButtons: [
    { y: 3.884 / 2 - 0.4336, length: 0.1572 },
    { y: 3.884 / 2 - 0.622, length: 0.1572 },
  ],
  // Rail-mounted Smart Connector: three Ø3.20 pins 4.65 mm apart.
  pogo: { surface: 'edge', x: -2.805 / 2, y: 0, axis: 'y', spacing: 0.0727 },
  // ~26.4 mm glyph, centered on the back within measurement error.
  logo: { mark: 'apple', y: 0.01, width: 0.413, height: 0.55 },
  // Apple's drawing: Ø1.89 holes in runs spanning 29.44–57.66 mm from each
  // corner (2.57 mm pitch), and the top edge's runs are dimensioned shorter
  // (37.14–58.60) where the sleep/wake button interrupts one.
  speakers: { style: 'holes', xs: [-0.7219, 0.7219], count: 12, spacing: 0.0401, r: 0.0148, topTrim: 3 },
}

/**
 * Galaxy Tab S11 (11") — 253.8 x 165.3 x 5.5 mm, 11" 2560x1600 (16:10)
 * AMOLED, uniform ~8.5 mm bezel, no notch (bezel front camera on the
 * landscape-top edge). Single 13 MP rear ring (~13.3 mm, photo-measured
 * 16.5 mm in from the landscape-top edge / 15.9 mm from the portrait-top
 * edge) + flash inboard; hexagonal S Pen on the long side; three keyboard
 * pogo contacts ~11 mm in from the portrait-left edge; quad speaker slots;
 * USB-C centered on the portrait-TOP edge (landscape left). Logical
 * resolution 800x1280 dp (xhdpi estimate).
 */
const TAB_S11: TabletSpec = {
  body: { width: 2.583, height: 3.966, depth: 0.086, radius: 0.14, bevel: 0.01 },
  glass: { width: 2.53, height: 3.913, radius: 0.12 },
  display: { width: 2.314, height: 3.702, radius: 0.05 },
  resolution: 800,
  rearCamera: {
    style: 'rings',
    rings: [{ x: 2.583 / 2 - 0.258, y: 3.966 / 2 - 0.248, r: 0.104 }],
    flash: { x: 2.583 / 2 - 0.258, y: 3.966 / 2 - 0.452 },
  },
  sideButtons: [
    { y: 3.966 / 2 - 0.886, length: 0.316 },
    { y: 3.966 / 2 - 1.303, length: 0.209 },
  ],
  usbEdge: 'top',
  stylus: { length: 2.375, offsetY: -0.52 },
  pogo: { surface: 'back', x: -2.583 / 2 + 0.175, y: 0, axis: 'y', spacing: 0.083 },
  logo: { mark: 'samsung', x: 1.057, y: -1.514, width: 0.47, height: 0.073, rotate: true },
  speakers: { style: 'slots', xs: [-0.73, 0.73], length: 0.64, width: 0.02 },
}

/**
 * Galaxy Tab S11 Ultra (14.6") — 326.3 x 208.5 x 5.1 mm, 14.6" 2960x1848
 * (16:10) AMOLED, uniform ~5.9 mm bezel with a small U-shaped notch
 * (~12.4 mm, single 12 MP front camera) on the landscape-top edge (the
 * portrait right edge). Dual protruding rear rings (~14.8 mm, centers
 * 16.5/35.7 mm from the portrait-top edge) + flash inboard; hexagonal
 * S Pen on the long side; keyboard pogo contacts; USB-C on the portrait-TOP
 * edge. Logical resolution 924x1480 dp (xhdpi estimate).
 */
const TAB_S11_ULTRA: TabletSpec = {
  body: { width: 3.258, height: 5.098, depth: 0.08, radius: 0.14, bevel: 0.01 },
  glass: { width: 3.205, height: 5.045, radius: 0.12 },
  display: { width: 3.068, height: 4.914, radius: 0.05 },
  resolution: 924,
  notch: { width: 0.194, height: 0.09, radius: 0.08 },
  rearCamera: {
    style: 'rings',
    rings: [
      { x: 3.258 / 2 - 0.264, y: 5.098 / 2 - 0.258, r: 0.116 },
      { x: 3.258 / 2 - 0.264, y: 5.098 / 2 - 0.558, r: 0.116 },
    ],
    flash: { x: 3.258 / 2 - 0.264, y: 5.098 / 2 - 0.773 },
  },
  sideButtons: [
    { y: 5.098 / 2 - 0.886, length: 0.316 },
    { y: 5.098 / 2 - 1.303, length: 0.209 },
  ],
  usbEdge: 'top',
  stylus: { length: 2.375, offsetY: -0.42 },
  pogo: { surface: 'back', x: -3.258 / 2 + 0.175, y: 0, axis: 'y', spacing: 0.083 },
  logo: { mark: 'samsung', x: 1.377, y: -2.063, width: 0.484, height: 0.075, rotate: true },
  speakers: { style: 'slots', xs: [-1.075, 1.075], length: 0.64, width: 0.02 },
}

/** The iPad lineup: two Pros, two Airs and the standard iPad. */
export const IPAD_VARIANTS: Record<
  'ipadpro13' | 'ipadpro11' | 'ipadair13' | 'ipadair11' | 'ipad11',
  TabletSpec
> = {
  ipadpro13: IPAD_PRO_13,
  ipadpro11: IPAD_PRO_11,
  ipadair13: IPAD_AIR_13,
  ipadair11: IPAD_AIR_11,
  ipad11: IPAD_11,
}

/** The Galaxy Tab S11 family. */
export const GALAXY_TAB_VARIANTS: Record<'tabs11' | 'tabs11ultra', TabletSpec> = {
  tabs11: TAB_S11,
  tabs11ultra: TAB_S11_ULTRA,
}

export type IPadVariant = keyof typeof IPAD_VARIANTS
export type GalaxyTabVariant = keyof typeof GALAXY_TAB_VARIANTS

/** Every tablet spec in one table — the shared framing keys off it. */
export const TABLET_VARIANTS: Record<IPadVariant | GalaxyTabVariant, TabletSpec> = {
  ...IPAD_VARIANTS,
  ...GALAXY_TAB_VARIANTS,
}

export type TabletVariant = IPadVariant | GalaxyTabVariant

/** The variant each family's binding defaults to. */
export const IPAD_DEFAULT_VARIANT: IPadVariant = 'ipadpro13'
export const GALAXY_TAB_DEFAULT_VARIANT: GalaxyTabVariant = 'tabs11'

/** Grounded on the bottom edge of the body (its side edge in landscape). */
export const TABLET_FRAMING = {
  camera: { position: [0, 0.5, 8.6], fov: 40 },
  floatIntensity: 0.8,
  contactGap: 0.05,
  extent: ({ variant, orientation }) => {
    const body = TABLET_VARIANTS[variant ?? IPAD_DEFAULT_VARIANT].body
    return (orientation === 'landscape' ? body.width : body.height) / 2
  },
} as const satisfies MockupFraming<{ variant?: TabletVariant; orientation?: Orientation }>

/** The 14.6" Tab Ultra needs a bit more camera room than the iPads. */
export const TABLET_ULTRA_CAMERA = {
  position: [0, 0.5, 9.6],
  fov: 40,
} as const satisfies CameraFraming
