/**
 * Laptop device dimensions - MacBook Air 13" / 15" (M5), MacBook Pro 14" /
 * 16" (M5) and the MacBook Neo 13".
 *
 * Every variant shares one world scale (~72.4 mm per unit, set so the Air's
 * closed footprint is exactly 4.2 x 2.97 units), so they keep their true
 * relative sizes side by side. The Pro 14 numbers were measured from
 * published specifications and product photography (ports, feet, speaker
 * grilles, notch and keyboard deck), normalized to the official
 * 312.6 x 221.2 x 15.5 mm closed body.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming, MockupMetrics } from '../../regions'

/** A port opening on a side wall of the base. `z` is distance from base center (+ = front). */
export interface LaptopPort {
  z: number
  width: number
  height: number
  /** `round` renders a circular jack of radius height/2. */
  shape?: 'pill' | 'round'
}

export interface LaptopSpec {
  /** Footprint shared by the base and the lid. `radius` is the corner radius. */
  footprint: { width: number; depth: number; radius: number }
  /** Bottom half: main chassis with the keyboard deck. */
  base: { thickness: number; bevel: number }
  /** Top half: the display lid. When open it stands `footprint.depth` tall. */
  lid: { thickness: number; bevel: number }
  /**
   * Active display area within the open lid. `offsetY` is the distance from
   * the lid's vertical center to the display center - the chin below the panel
   * is deeper than the top bezel, so the panel sits slightly high.
   */
  display: {
    width: number
    height: number
    radius: readonly [number, number, number, number]
    offsetY: number
  }
  /**
   * Camera notch: sits at the top-center of the display, menu-bar deep. The
   * notch is the 2021-on Air and Pro design; a laptop without one (the
   * MacBook Neo) keeps its camera in the bezel above the panel instead - see
   * `bezelCamera`.
   */
  notch?: { width: number; height: number; radius: number }
  /**
   * A camera set in the black bezel above the display rather than in a notch:
   * `offsetY` is how far its centre sits above the display's top edge. Only
   * the notchless MacBook Neo carries one.
   */
  bezelCamera?: { radius: number; offsetY: number }
  /**
   * The Magic Keyboard's well, milled into the deck on the hinge side:
   * `width`/`depth` bound it (the 14.5-unit, six-row key grid 2.75 mm in from
   * its wall, so they also set the 19 x 18.5 mm key pitch every Mac laptop
   * shares), `offsetZ` is its centre. Apple's top-down renders put the same
   * ~279.5 x 115 mm well on every model. `tray` is the Pro's black anodized
   * floor; on the Air and the Neo the well is the deck's own aluminium.
   */
  keyboard: { width: number; depth: number; offsetZ: number; tray: boolean }
  /**
   * What the editing keys (tab, caps lock, shift, delete, return) carry:
   * words, as on the Pro, or the symbols ⇥ ⇪ ⇧ ⌫ ↵ of the M5 Air and the
   * Neo. Defaults to `words`.
   */
  legends?: 'words' | 'symbols'
  /**
   * Lift-lid scoop: the crescent recess machined into the front edge at
   * center. `radius` is the cutting cylinder's radius, `bite` how deep it
   * penetrates the front face at deck level (the cut fades to nothing
   * ~sqrt(bite·2·radius) below the deck, as the hardware's does).
   */
  scoop: { width: number; radius: number; bite: number }
  /** Force Touch trackpad, centered between keyboard and front edge. */
  trackpad: { width: number; depth: number; offsetZ: number }
  /** Default lid angle (degrees between deck and screen; 90 = upright). */
  openAngle: number
  /**
   * Keycap finish: the black caps of the Air and Pro by default, or caps
   * colour-matched to the aluminium (`matched` - the MacBook Neo, whose
   * legends are then etched dark on light caps).
   */
  keycaps?: 'black' | 'matched'
  /** Port openings per side wall. */
  ports: { left: LaptopPort[]; right: LaptopPort[] }
  /** Rubber feet under the base: centers (±x, ±z) and radius. */
  feet: { x: number; z: number; radius: number }
  /**
   * Perforated speaker strips flanking the keyboard (Pro): centers at ±x.
   * Measured on Apple's top-down renders: a square grid of drilled holes at
   * ~0.94 mm pitch filling the band between the well and the chassis side -
   * 1.8 mm in from the side edge, ~2 mm off the well - and centred on the
   * well, 4.7 mm in from its top and bottom: 15 x 114 holes on the 14",
   * 38 x 114 on the 16".
   */
  speakers?: {
    x: number
    width: number
    depth: number
    offsetZ: number
    holePitchX: number
    holePitchZ: number
    holeR: number
  }
  /** Apple mark on the lid back: width/height and offset from lid center (+ = toward top). */
  logo: { width: number; height: number; offsetY: number }
  /** Embossed wordmark near the front of the underside. */
  bottomText?: { text: string; width: number; height: number; offsetZ: number }
}

/**
 * MacBook Air 13" (M5, 2026) - 30.41 x 21.5 x 1.13 cm closed, 13.6" 2560x1664
 * Liquid Retina display with a notch, uniform side bezels and a deeper chin.
 * The M5 generation reuses the M4 chassis unchanged.
 */
const MACBOOK_AIR_13: LaptopSpec = {
  footprint: { width: 4.2, depth: 2.97, radius: 0.16 },
  base: { thickness: 0.1, bevel: 0.02 },
  lid: { thickness: 0.05, bevel: 0.008 },
  // Apple's bezel drawing: 3.9 mm top corners, a 6.9 mm top bezel.
  display: { width: 4.0, height: 2.6, radius: [0.054, 0.054, 0, 0], offsetY: 0.09 },
  notch: { width: 0.48, height: 0.095, radius: 0.045 },
  // The same Magic Keyboard as the Pro, in an aluminium well - the Air has no
  // black tray. Apple's top-down render puts the well 9.6 mm from the back
  // edge and 90.5 mm from the front, the trackpad 7.9 mm from the front.
  keyboard: { width: 3.85, depth: 1.587, offsetZ: -0.558, tray: false },
  legends: 'symbols',
  scoop: { width: 0.75, radius: 0.059, bite: 0.032 },
  trackpad: { width: 1.78, depth: 1.12, offsetZ: 0.823 },
  openAngle: 110,
  ports: {
    // MagSafe + two Thunderbolt 4 pills on the left, headphone jack right.
    left: [
      { z: -1.08, width: 0.15, height: 0.038 },
      { z: -0.84, width: 0.1, height: 0.03 },
      { z: -0.66, width: 0.1, height: 0.03 },
    ],
    right: [{ z: -0.8, width: 0.048, height: 0.048, shape: 'round' }],
  },
  feet: { x: 1.75, z: 1.15, radius: 0.055 },
  logo: { width: 0.5, height: 0.615, offsetY: 0.05 },
}

/**
 * MacBook Pro 14" (M5) - 312.6 x 221.2 x 15.5 mm closed, 14.2" 3024x1964
 * Liquid Retina XDR display. Detail geometry from product photography: MagSafe,
 * 2x Thunderbolt and headphone jack on the left; HDMI, Thunderbolt and SDXC on
 * the right; perforated speaker strips flanking the keyboard; 19.1 mm feet;
 * a deeper 36.8 mm camera notch. Default scaled resolution 1512x982 (2x).
 */
const MACBOOK_PRO_14: LaptopSpec = {
  footprint: { width: 4.318, depth: 3.055, radius: 0.113 },
  base: { thickness: 0.149, bevel: 0.028 },
  lid: { thickness: 0.054, bevel: 0.008 },
  // Active area 302.5 x 196.4 mm, top corners rounded, sitting 7.1 mm high.
  // Width corrected from a measured 301.4 mm: the modelled rect's aspect
  // must equal the panel's 3024:1964, or a 1512-wide layout renders 985 tall
  // instead of the hardware's 982. 14.2" at that aspect puts the active area
  // at 302.48 x 196.45 mm, which the height already matched.
  // Apple's bezel drawing: 3.8 mm top corners.
  display: { width: 4.1772, height: 2.713, radius: [0.052, 0.052, 0, 0], offsetY: 0.098 },
  notch: { width: 0.508, height: 0.088, radius: 0.018 },
  // Black-floored well 278.7 x 114.9 mm, 14.2 mm from the back edge on
  // Apple's top-down render (38.9 mm behind base center).
  keyboard: { width: 3.85, depth: 1.587, offsetZ: -0.537, tray: true },
  // Measured: 54.5 mm wide crescent, 2.5 mm bite fading out 3.9 mm down.
  scoop: { width: 0.753, radius: 0.0593, bite: 0.0345 },
  // 129.7 x 81.6 mm trackpad, 8.1 mm from the front edge.
  trackpad: { width: 1.792, depth: 1.127, offsetZ: 0.852 },
  openAngle: 110,
  ports: {
    left: [
      { z: -1.142, width: 0.243, height: 0.046 }, // MagSafe 3
      { z: -0.886, width: 0.119, height: 0.039 }, // Thunderbolt
      { z: -0.681, width: 0.119, height: 0.039 }, // Thunderbolt
      { z: -0.504, width: 0.055, height: 0.055, shape: 'round' }, // headphone jack
    ],
    right: [
      { z: -1.142, width: 0.202, height: 0.068 }, // HDMI
      { z: -0.886, width: 0.119, height: 0.039 }, // Thunderbolt
      { z: -0.548, width: 0.369, height: 0.037 }, // SDXC
    ],
  },
  feet: { x: 1.774, z: 1.146, radius: 0.132 },
  // 13.1 x 105.6 mm of drilling.
  speakers: {
    x: 2.0435,
    width: 0.181,
    depth: 1.4586,
    offsetZ: -0.537,
    holePitchX: 0.0129,
    holePitchZ: 0.0129,
    holeR: 0.00435,
  },
  logo: { width: 0.521, height: 0.641, offsetY: 0.054 },
  bottomText: { text: 'MacBook Pro', width: 0.793, height: 0.104, offsetZ: 1.42 },
}

/**
 * MacBook Air 15" (M5, 2026) - 340.4 x 237.6 x 11.5 mm closed, 15.3"
 * 2880x1864 Liquid Retina at 224 ppi. Same slab language, keyboard, scoop
 * and port kit as the 13" in a wider chassis; the four-speaker system vents
 * through the hinge, so the deck stays clean. Default scaled 1440x932.
 */
const MACBOOK_AIR_15: LaptopSpec = {
  footprint: { width: 4.702, depth: 3.282, radius: 0.16 },
  base: { thickness: 0.103, bevel: 0.02 },
  lid: { thickness: 0.05, bevel: 0.008 },
  // Active area 326.2 x 211.1 mm.
  // Apple's bezel drawing: 3.9 mm top corners, a 6.7 mm top bezel.
  display: { width: 4.506, height: 2.916, radius: [0.054, 0.054, 0, 0], offsetY: 0.091 },
  notch: { width: 0.48, height: 0.095, radius: 0.045 },
  // Identical Magic Keyboard well, but further from the hinge than the 13"'s:
  // 19.1 mm from the back edge on Apple's top-down render, 103.6 from the
  // front.
  keyboard: { width: 3.85, depth: 1.587, offsetZ: -0.583, tray: false },
  legends: 'symbols',
  scoop: { width: 0.75, radius: 0.059, bite: 0.032 },
  // ~136 x 82.5 mm Force Touch trackpad, 2.5 mm below the well.
  trackpad: { width: 1.878, depth: 1.14, offsetZ: 0.815 },
  openAngle: 110,
  ports: {
    // Same kit at the same distances from the back edge as the 13".
    left: [
      { z: -1.236, width: 0.15, height: 0.038 },
      { z: -0.996, width: 0.1, height: 0.03 },
      { z: -0.816, width: 0.1, height: 0.03 },
    ],
    right: [{ z: -0.956, width: 0.048, height: 0.048, shape: 'round' }],
  },
  feet: { x: 2.001, z: 1.306, radius: 0.055 },
  logo: { width: 0.52, height: 0.64, offsetY: 0.05 },
}

/**
 * MacBook Pro 16" (M5 Pro / M5 Max, 2026) - 355.7 x 248.1 x 16.8 mm closed,
 * 16.2" 3456x2234 Liquid Retina XDR at 254 ppi. Same port set and measured
 * keyboard/scoop/grille details as the 14" in the larger chassis, with wider
 * speaker strips and a deeper palm rest. Default scaled 1728x1117.
 */
const MACBOOK_PRO_16: LaptopSpec = {
  footprint: { width: 4.913, depth: 3.427, radius: 0.113 },
  base: { thickness: 0.167, bevel: 0.028 },
  lid: { thickness: 0.054, bevel: 0.008 },
  // Active area 345.7 x 223.5 mm.
  // Apple's bezel drawing: 3.8 mm top corners, a 5.6 mm top bezel.
  display: { width: 4.775, height: 3.087, radius: [0.052, 0.052, 0, 0], offsetY: 0.093 },
  notch: { width: 0.508, height: 0.088, radius: 0.018 },
  // The well 22.6 mm from the back edge on Apple's top-down render.
  keyboard: { width: 3.85, depth: 1.587, offsetZ: -0.607, tray: true },
  scoop: { width: 0.753, radius: 0.0593, bite: 0.0345 },
  // ~160 x 99.5 mm trackpad, 2.8 mm below the well as on the 14".
  trackpad: { width: 2.21, depth: 1.374, offsetZ: 0.912 },
  openAngle: 110,
  ports: {
    // Same connectors at the 14"'s distances from the back edge.
    left: [
      { z: -1.328, width: 0.243, height: 0.046 }, // MagSafe 3
      { z: -1.072, width: 0.119, height: 0.039 }, // Thunderbolt
      { z: -0.867, width: 0.119, height: 0.039 }, // Thunderbolt
      { z: -0.69, width: 0.055, height: 0.055, shape: 'round' }, // headphone jack
    ],
    right: [
      { z: -1.328, width: 0.202, height: 0.068 }, // HDMI
      { z: -1.072, width: 0.119, height: 0.039 }, // Thunderbolt
      { z: -0.734, width: 0.369, height: 0.037 }, // SDXC
    ],
  },
  feet: { x: 2.072, z: 1.332, radius: 0.145 },
  // The 16"'s gap is 38.5 mm and the drilling fills it: 34.5 x 105.7 mm.
  speakers: {
    x: 2.1934,
    width: 0.4765,
    depth: 1.4586,
    offsetZ: -0.607,
    holePitchX: 0.0129,
    holePitchZ: 0.0129,
    holeR: 0.00435,
  },
  logo: { width: 0.55, height: 0.677, offsetY: 0.054 },
  bottomText: { text: 'MacBook Pro', width: 0.793, height: 0.104, offsetZ: 1.606 },
}

/**
 * MacBook Neo 13" (A18 Pro, 2026) - 297.5 x 206.4 x 12.7 mm closed, 13.0"
 * 2408x1506 LED-backlit IPS display at 219 ppi. Apple's entry MacBook, and
 * the first notchless one since 2022: the 1080p FaceTime camera sits in a
 * visibly deeper black bezel above a square-cornered 16:10 panel, on a body
 * a hair smaller than the Air 13's and 1.4 mm thicker. It keeps the Magic
 * Keyboard module (Touch ID optional at retail; modelled with it), set
 * Air-style in an aluminium well, with two USB-C ports on the left (USB 3
 * and USB 2, both charging - there is no MagSafe) and the headphone jack on
 * the right. Body, panel and port figures are Apple's tech specs; the
 * keyboard and trackpad are placed off Apple's top-down render, the feet and
 * the camera's position in the bezel adapted from the Air 13 and Apple's
 * product photography. Default scaled resolution 1204x753 (2x).
 */
const MACBOOK_NEO_13: LaptopSpec = {
  footprint: { width: 4.109, depth: 2.851, radius: 0.16 },
  base: { thickness: 0.115, bevel: 0.02 },
  lid: { thickness: 0.06, bevel: 0.008 },
  // 13.0" at 2408:1506 puts the active area at 280.0 x 175.1 mm. Apple's
  // bezel drawing rounds its top corners 4.0 mm like the Air's and squares
  // the bottom ones, under a 9.4 mm top bezel - the same as the sides - and
  // a deeper chin, so the panel sits high.
  display: { width: 3.867, height: 2.419, radius: [0.055, 0.055, 0, 0], offsetY: 0.086 },
  // The Ø1.7 mm camera window centred in the top bezel, 4.5 mm above the panel.
  bezelCamera: { radius: 0.012, offsetY: 0.062 },
  // Caps colour-matched to the aluminium, per Apple's launch photography.
  keycaps: 'matched',
  // The Air's Magic Keyboard well, 12.0 mm from the back edge and 79.5 from
  // the front on Apple's top-down render, with the M5 Air's symbol legends.
  keyboard: { width: 3.85, depth: 1.587, offsetZ: -0.4655, tray: false },
  legends: 'symbols',
  scoop: { width: 0.75, radius: 0.059, bite: 0.032 },
  // ~116 x 72.5 mm trackpad, 3 mm below the well.
  trackpad: { width: 1.6, depth: 1.0, offsetZ: 0.869 },
  openAngle: 110,
  ports: {
    // Apple's side photography, scaled by the port openings: two USB-C
    // pills on the left 23 and 37 mm from the back edge - USB 3, then USB 2
    // - and on the right the jack 53 mm back with the 27 mm speaker slot
    // between it and the hinge.
    left: [
      { z: -1.108, width: 0.1, height: 0.03 },
      { z: -0.914, width: 0.1, height: 0.03 },
    ],
    right: [
      { z: -0.693, width: 0.048, height: 0.048, shape: 'round' },
      { z: -0.956, width: 0.37, height: 0.016 },
    ],
  },
  feet: { x: 1.72, z: 1.1, radius: 0.055 },
  logo: { width: 0.49, height: 0.6, offsetY: 0.05 },
}

export const LAPTOP_VARIANTS: Record<'air13' | 'air15' | 'pro14' | 'pro16' | 'neo13', LaptopSpec> = {
  air13: MACBOOK_AIR_13,
  air15: MACBOOK_AIR_15,
  pro14: MACBOOK_PRO_14,
  pro16: MACBOOK_PRO_16,
  neo13: MACBOOK_NEO_13,
}

export type LaptopVariant = keyof typeof LAPTOP_VARIANTS

/** The variant every binding defaults to. */
export const LAPTOP_DEFAULT_VARIANT: LaptopVariant = 'air13'

/**
 * Vertical offset baked into the laptop model: it rides this far down so the
 * opened pose (deck + raised lid) sits visually centered on the group origin
 * the stage camera and shadow are tuned for.
 */
export const LAPTOP_STAGE_OFFSET_Y = -1.15

/**
 * Grounded just under the rubber feet: the ground line sits 0.024 below the
 * offset base slab. The extent is rebased −0.056 so the shared float gap
 * reproduces the stage's original 0.22 hover clearance, with the grounded
 * line restored by the 0.08 contact gap.
 */
/** Millimetres per world unit - the shared laptop scale. */
export const LAPTOP_MM_PER_UNIT = 72.4

/**
 * Default CSS px width of each variant's virtual display: the panel's own
 * point grid at 2x (a 2560x1664 Air 13 renders 1280x832, the Neo's
 * 2408x1506 renders 1204x753).
 */
export const LAPTOP_RESOLUTIONS: Record<LaptopVariant, number> = {
  air13: 1280,
  air15: 1440,
  pro14: 1512,
  pro16: 1728,
  neo13: 1204,
}

/** Live geometry of the display. Laptops have one pose - always landscape. */
export const LAPTOP_METRICS = {
  mmPerUnit: LAPTOP_MM_PER_UNIT,
  regions: ({ variant }) => {
    const key = variant ?? LAPTOP_DEFAULT_VARIANT
    const { display } = LAPTOP_VARIANTS[key]
    return {
      screen: {
        width: display.width,
        height: display.height,
        radius: display.radius,
        resolution: LAPTOP_RESOLUTIONS[key],
      },
    }
  },
} as const satisfies MockupMetrics<{ variant?: LaptopVariant }>

export const LAPTOP_FRAMING = {
  camera: { position: [0, 0.9, 9.6], fov: 40 },
  floatIntensity: 0.7,
  contactGap: 0.08,
  extent: ({ variant }) =>
    -LAPTOP_STAGE_OFFSET_Y + LAPTOP_VARIANTS[variant ?? LAPTOP_DEFAULT_VARIANT].base.thickness / 2 - 0.056,
} as const satisfies MockupFraming<{ variant?: LaptopVariant }>
