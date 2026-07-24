/**
 * Laptop device dimensions — MacBook Air 13" (M5) and MacBook Pro 14" (M5).
 *
 * Both variants share one world scale (~72.4 mm per unit, set so the Air's
 * closed footprint is exactly 4.2 x 2.97 units), so they keep their true
 * relative sizes side by side. The Pro 14 numbers were measured from a
 * reference 3D scan of the retail machine (ports, feet, speaker grilles,
 * notch and keyboard deck all taken from the scan geometry), normalized to
 * the official 312.6 x 221.2 x 15.5 mm closed body.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming } from '../../regions'

/** World units per millimeter for the laptop family. */
export const LAPTOP_MM = 1 / 72.4

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
   * the lid's vertical center to the display center — the chin below the panel
   * is deeper than the top bezel, so the panel sits slightly high.
   */
  display: {
    width: number
    height: number
    radius: readonly [number, number, number, number]
    offsetY: number
  }
  /** Camera notch: sits at the top-center of the display, menu-bar deep. */
  notch: { width: number; height: number; radius: number }
  /**
   * Keyboard well (recessed area) and key grid on the deck, hinge side.
   * `legends` picks the printed style: `text` is the US MacBook Pro convention
   * (esc/tab/caps lock/return/shift/delete as words), `icons` the M5 Air's
   * glyph convention (⇥ ⇪ ⇧ ⌫ ⏎ symbols on those caps).
   */
  keyboard: { width: number; depth: number; offsetZ: number; legends: 'text' | 'icons' }
  /**
   * Lift-lid scoop: the crescent recess machined into the front edge at
   * center. `radius` is the cutting cylinder's radius, `bite` how deep it
   * penetrates the front face at deck level (the cut fades to nothing
   * ~sqrt(bite·2·radius) below the deck, per the reference scan).
   */
  scoop: { width: number; radius: number; bite: number }
  /** Force Touch trackpad, centered between keyboard and front edge. */
  trackpad: { width: number; depth: number; offsetZ: number }
  /** Default lid angle (degrees between deck and screen; 90 = upright). */
  openAngle: number
  /** Port openings per side wall. */
  ports: { left: LaptopPort[]; right: LaptopPort[] }
  /** Rubber feet under the base: centers (±x, ±z) and radius. */
  feet: { x: number; z: number; radius: number }
  /**
   * Perforated speaker strips flanking the keyboard (Pro): centers at ±x.
   * Hole metrics from the reference scan's grille tile: ~1.0 x 0.93 mm grid
   * of ~0.63 mm drilled holes.
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
 * MacBook Air 13" (M5, 2026) — 30.41 x 21.5 x 1.13 cm closed, 13.6" 2560x1664
 * Liquid Retina display with a notch, uniform side bezels and a deeper chin.
 * The M5 generation reuses the M4 chassis unchanged.
 */
const MACBOOK_AIR_13: LaptopSpec = {
  footprint: { width: 4.2, depth: 2.97, radius: 0.16 },
  base: { thickness: 0.1, bevel: 0.02 },
  lid: { thickness: 0.05, bevel: 0.008 },
  display: { width: 4.0, height: 2.6, radius: [0.09, 0.09, 0, 0], offsetY: 0.05 },
  notch: { width: 0.48, height: 0.095, radius: 0.045 },
  // Same word-label legend set as the Pro 14 scan — per the user's direction
  // the M5 line shares one layout and symbol style across Air and Pro.
  keyboard: { width: 3.78, depth: 1.5, offsetZ: -0.6, legends: 'text' },
  scoop: { width: 0.75, radius: 0.059, bite: 0.032 },
  trackpad: { width: 1.78, depth: 1.12, offsetZ: 0.78 },
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
 * MacBook Pro 14" (M5) — 312.6 x 221.2 x 15.5 mm closed, 14.2" 3024x1964
 * Liquid Retina XDR display. Detail geometry from a retail-unit scan: MagSafe,
 * 2x Thunderbolt and headphone jack on the left; HDMI, Thunderbolt and SDXC on
 * the right; perforated speaker strips flanking the keyboard; 19.1 mm feet;
 * a deeper 36.8 mm camera notch. Default scaled resolution 1512x982 (2x).
 */
const MACBOOK_PRO_14: LaptopSpec = {
  footprint: { width: 4.318, depth: 3.055, radius: 0.113 },
  base: { thickness: 0.149, bevel: 0.028 },
  lid: { thickness: 0.054, bevel: 0.008 },
  // Active area 301.4 x 196.4 mm, top corners rounded, sitting 7.1 mm high.
  display: { width: 4.163, height: 2.713, radius: [0.063, 0.063, 0, 0], offsetY: 0.098 },
  notch: { width: 0.508, height: 0.088, radius: 0.018 },
  // Black keyboard well 278.7 x 114.9 mm centered 36.5 mm behind base center.
  keyboard: { width: 3.85, depth: 1.587, offsetZ: -0.504, legends: 'text' },
  // Scan-measured: 54.5 mm wide crescent, 2.5 mm bite fading out 3.9 mm down.
  scoop: { width: 0.753, radius: 0.0593, bite: 0.0345 },
  // 129.7 x 81.6 mm trackpad, centered 64.5 mm ahead of base center.
  trackpad: { width: 1.792, depth: 1.127, offsetZ: 0.89 },
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
  speakers: {
    x: 2.037,
    width: 0.213,
    depth: 1.47,
    offsetZ: -0.504,
    holePitchX: 0.0142,
    holePitchZ: 0.0129,
    holeR: 0.00435,
  },
  logo: { width: 0.521, height: 0.641, offsetY: 0.054 },
  bottomText: { text: 'MacBook Pro', width: 0.793, height: 0.104, offsetZ: 1.42 },
}

/**
 * MacBook Air 15" (M5, 2026) — 340.4 x 237.6 x 11.5 mm closed, 15.3"
 * 2880x1864 Liquid Retina at 224 ppi. Same slab language, keyboard, scoop
 * and port kit as the 13" in a wider chassis; the four-speaker system vents
 * through the hinge, so the deck stays clean. Default scaled 1440x932.
 */
const MACBOOK_AIR_15: LaptopSpec = {
  footprint: { width: 4.702, depth: 3.282, radius: 0.16 },
  base: { thickness: 0.103, bevel: 0.02 },
  lid: { thickness: 0.05, bevel: 0.008 },
  // Active area 326.2 x 211.1 mm.
  display: { width: 4.506, height: 2.916, radius: [0.09, 0.09, 0, 0], offsetY: 0.055 },
  notch: { width: 0.48, height: 0.095, radius: 0.045 },
  // Identical Magic Keyboard well, seated the same distance from the hinge.
  keyboard: { width: 3.78, depth: 1.5, offsetZ: -0.756, legends: 'text' },
  scoop: { width: 0.75, radius: 0.059, bite: 0.032 },
  // ~136 x 82.5 mm Force Touch trackpad.
  trackpad: { width: 1.878, depth: 1.14, offsetZ: 0.8 },
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
 * MacBook Pro 16" (M5 Pro / M5 Max, 2026) — 355.7 x 248.1 x 16.8 mm closed,
 * 16.2" 3456x2234 Liquid Retina XDR at 254 ppi. Same port set and measured
 * keyboard/scoop/grille details as the 14" in the larger chassis, with wider
 * speaker strips and a deeper palm rest. Default scaled 1728x1117.
 */
const MACBOOK_PRO_16: LaptopSpec = {
  footprint: { width: 4.913, depth: 3.427, radius: 0.113 },
  base: { thickness: 0.167, bevel: 0.028 },
  lid: { thickness: 0.054, bevel: 0.008 },
  // Active area 345.7 x 223.5 mm.
  display: { width: 4.775, height: 3.087, radius: [0.063, 0.063, 0, 0], offsetY: 0.105 },
  notch: { width: 0.508, height: 0.088, radius: 0.018 },
  keyboard: { width: 3.85, depth: 1.587, offsetZ: -0.69, legends: 'text' },
  scoop: { width: 0.753, radius: 0.0593, bite: 0.0345 },
  // ~160 x 99.5 mm trackpad.
  trackpad: { width: 2.21, depth: 1.374, offsetZ: 0.836 },
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
  speakers: {
    x: 2.09,
    width: 0.32,
    depth: 1.47,
    offsetZ: -0.69,
    holePitchX: 0.0142,
    holePitchZ: 0.0129,
    holeR: 0.00435,
  },
  logo: { width: 0.55, height: 0.677, offsetY: 0.054 },
  bottomText: { text: 'MacBook Pro', width: 0.793, height: 0.104, offsetZ: 1.606 },
}

export const LAPTOP_VARIANTS: Record<'air13' | 'air15' | 'pro14' | 'pro16', LaptopSpec> = {
  air13: MACBOOK_AIR_13,
  air15: MACBOOK_AIR_15,
  pro14: MACBOOK_PRO_14,
  pro16: MACBOOK_PRO_16,
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
export const LAPTOP_FRAMING = {
  camera: { position: [0, 0.9, 9.6], fov: 40 },
  floatIntensity: 0.7,
  contactGap: 0.08,
  extent: ({ variant }) =>
    -LAPTOP_STAGE_OFFSET_Y + LAPTOP_VARIANTS[variant ?? LAPTOP_DEFAULT_VARIANT].base.thickness / 2 - 0.056,
} as const satisfies MockupFraming<{ variant?: LaptopVariant }>

/** Back-compat: dimensions of the default device (MacBook Air 13"). */
export const LAPTOP = MACBOOK_AIR_13

/** Display aspect ratio (height / width) of the default device — the 13.6" 2560x1664 panel. */
export const LAPTOP_DISPLAY_ASPECT = LAPTOP.display.height / LAPTOP.display.width
