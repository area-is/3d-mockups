/**
 * TV object dimensions - three premium flat-screen designs, each sized by its
 * diagonal in inches (default 65").
 *
 * The variants are proportioned from the published dimensions of current
 * Samsung and LG sets, which is what makes them read as different products
 * rather than one cabinet with different legs:
 *
 * - `legs` - the wide-set 4K class on splayed A-frame feet: a near-bezel-less
 *   panel (~7.6 mm frame, ~14.6 mm bottom chin), thin at the edges with a
 *   shallow electronics bulge low on the back, standing on two slim feet near
 *   the ends, each a pair of struts meeting at the cabinet in the shallow Λ of
 *   current retail stands.
 * - `pedestal` - the Neo QLED class on a center plate, from Samsung's own
 *   QN70F spec sheet (75": 1677.5 x 960.7 x 26.6 mm over a 1660.6 x 934.1 mm
 *   panel, so an 8.45 mm frame and an 18.15 mm chin on a 26.6 mm AirSlim slab;
 *   the AERO CENTER stand's footprint is 354.8 x 331.5 mm, and the 1017.5 mm
 *   height-with-stand puts the panel 56.8 mm up). Samsung publishes that
 *   footprint at four sizes, so the plate is interpolated between them rather
 *   than scaled off one.
 * - `frame` - the picture-frame class (Samsung The Frame LS03F, 65":
 *   1458 x 833 x 25.4 mm over the same panel, i.e. a UNIFORM ~14.75 mm bezel
 *   with no chin, and a slab of even thickness because the electronics live in
 *   an external One Connect box). It ships with the Slim Fit Wall Mount and
 *   hangs flush, so it stands on nothing: the panel meets the surface directly.
 *
 * Normalized to ~258 mm per world unit (the 65" panel is 5.6 units wide). The
 * origin is the panel center; the media-stand plane is `standHeight` below it.
 *
 * Sizing follows real product ranges rather than uniform scaling: the panel
 * scales with the diagonal, but bezels, cabinet depth and port hardware stay
 * physical, feet keep a near-constant inset from the panel ends (they bolt into
 * the corner structure), and the stand hardware grows only mildly across the
 * range.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and
 * a future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { CameraFraming, MockupFraming, MockupMetrics } from '../../regions'

/** World units per millimeter for the TV. */
export const TV_MM = 1 / 258

/** The supported diagonal range in inches; `tvSpec` clamps into it. */
export const TV_MIN_INCHES = 32
export const TV_MAX_INCHES = 98

/** 16:9 factors: width = diagonal * 16/sqrt(337), height = diagonal * 9/sqrt(337). */
const W_FACTOR = 16 / Math.sqrt(337)
const H_FACTOR = 9 / Math.sqrt(337)

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Which cabinet + stand design a set is built to. */
export type TVVariant = 'legs' | 'pedestal' | 'frame'

/** Linear interpolation across a published size table, clamped at both ends. */
const fromTable = (table: readonly (readonly [number, number])[], d: number) => {
  const first = table[0]!
  const last = table[table.length - 1]!
  if (d <= first[0]) return first[1]
  if (d >= last[0]) return last[1]
  for (let i = 1; i < table.length; i++) {
    const [x1, y1] = table[i]!
    const [x0, y0] = table[i - 1]!
    if (d <= x1) return y0 + ((y1 - y0) * (d - x0)) / (x1 - x0)
  }
  return last[1]
}

/** Samsung's published AERO CENTER footprint (width, depth in mm) by diagonal. */
const AERO_STAND_WIDTH = [[55, 263.9], [65, 314.3], [75, 354.8], [85, 375.4]] as const
const AERO_STAND_DEPTH = [[55, 247.4], [65, 279.4], [75, 331.5], [85, 366.5]] as const

/** The variant every binding defaults to. */
export const TV_DEFAULT_VARIANT: TVVariant = 'legs'

/**
 * Per-variant cabinet proportions, in millimeters where physical. `bulge` is
 * the depth of the electronics hump on the back (0 on sets whose electronics
 * sit in an external box), `ports` whether a rear input bay is machined into
 * it, and `logoBar` whether the IR/logo tab projects under the chin.
 */
const VARIANTS = {
  legs: { bezel: 7.6, chin: 14.6, depth: 0.11, bulge: 0.14, ports: true, logoBar: true, stand: 'splayed' },
  pedestal: { bezel: 8.45, chin: 18.15, depth: 0.1031, bulge: 0.115, ports: true, logoBar: true, stand: 'pedestal' },
  frame: { bezel: 14.75, chin: 14.75, depth: 0.098, bulge: 0, ports: false, logoBar: false, stand: 'none' },
} as const satisfies Record<TVVariant, Record<string, unknown>>

/**
 * Build a TV spec for a diagonal in inches (clamped to
 * `TV_MIN_INCHES`..`TV_MAX_INCHES`) and a cabinet design. The default is a
 * 65" set on splayed feet.
 */
export function tvSpec(inches: number = 65, variant: TVVariant = TV_DEFAULT_VARIANT) {
  const d = clamp(inches, TV_MIN_INCHES, TV_MAX_INCHES)
  const v = VARIANTS[variant] ?? VARIANTS[TV_DEFAULT_VARIANT]
  const mm = (value: number) => value * TV_MM
  // Active panel from the diagonal; enclosure adds the physical bezels.
  const displayW = mm(d * 25.4 * W_FACTOR)
  const displayH = mm(d * 25.4 * H_FACTOR)
  const bezel = mm(v.bezel)
  const chin = mm(v.chin)
  const bodyW = displayW + bezel * 2
  const bodyH = displayH + bezel + chin
  const centerY = -(chin - bezel) / 2
  // Feet: near-constant inset from the panel ends; the struts grow only
  // mildly with size (a 43" and a 75" use nearly the same plastic feet).
  const footInset = mm(clamp(105 + (d - 43) * 1.1, 100, 170))
  const footHeight = mm(clamp(58 + (d - 43) * 0.4, 55, 75))
  const footSpan = mm(clamp(240 + (d - 43) * 1.6, 230, 330))
  // The AERO CENTER plate, interpolated across Samsung's published footprints,
  // lifting the panel the 56.8 mm their height-with-stand figure works out to.
  const plateWidth = mm(fromTable(AERO_STAND_WIDTH, d))
  const plateDepth = mm(fromTable(AERO_STAND_DEPTH, d))
  const plateHeight = mm(18)
  const neckLift = mm(56.8)
  const stand =
    v.stand === 'pedestal'
      ? ({
          kind: 'pedestal' as const,
          /** The low plate on the media surface, and the neck rising from it. */
          plate: { width: plateWidth, depth: plateDepth, height: plateHeight },
          neck: { width: mm(96), depth: mm(38), height: neckLift - plateHeight },
          height: neckLift,
        } as const)
      : v.stand === 'none'
        ? ({
            /** Wall-flush: the panel meets the surface with nothing under it. */
            kind: 'none' as const,
            height: 0,
          } as const)
        : ({
            kind: 'splayed' as const,
            /**
             * Two feet near the ends: each a pair of slim struts splaying fore
             * and aft from a common ankle at the cabinet bottom - the shallow Λ
             * of current retail stands. `offsetX` is the foot centerline from
             * the TV center, `span` the fore-aft footprint on the media stand.
             */
            offsetX: bodyW / 2 - footInset,
            height: footHeight,
            span: footSpan,
            strutWidth: 0.058,
            strutDepth: 0.05,
          } as const)
  return {
    /** Diagonal in inches after clamping. */
    inches: d,
    /** Which cabinet + stand design this spec describes. */
    variant,
    /**
     * Enclosure (glass face). `radius` is the corner radius, `bevel` the
     * edge rounding. The body is taller than the display band by the bottom
     * chin, so it sits `centerY` below the panel center.
     */
    body: { width: bodyW, height: bodyH, depth: v.depth, radius: 0.03, bevel: 0.012, centerY },
    /** Active display area. Content you pass as children maps onto this rect. */
    display: { width: displayW, height: displayH, radius: 0.008 },
    /** Wide, shallow electronics bulge low on the back - absent on `frame`. */
    backBulge: v.bulge ? { width: bodyW - 0.47, height: bodyH * 0.58, depth: v.bulge } : null,
    /** Whether the IR/logo tab projects under the chin. */
    logoBar: v.logoBar,
    /**
     * Recessed input bay on the back (right side viewed from the back):
     * HDMI x3, USB x2, LAN, optical audio, antenna coax. Positions are
     * bay-local; the bay sits on the bulge. Null when the electronics live in
     * an external connect box.
     */
    portBay: v.ports ? { width: 0.62, height: 1.08, inset: 0.03 } : null,
    /** How the set stands: splayed feet, a center pedestal, or nothing. */
    stand,
    /** Distance from panel center down to the media-stand plane. */
    standHeight: bodyH / 2 - centerY + stand.height,
    /** Default CSS px width of the virtual display (the 1920x1080 logical grid). */
    resolution: 1920,
  }
}

export type TVSpec = ReturnType<typeof tvSpec>

/** The default 65" set on splayed feet. */
export const TV: TVSpec = tvSpec()

/**
 * Vertical stage lift every binding renders the TV with: the cabinet sits
 * this far above the group origin, so the panel + feet ensemble reads
 * visually centered on the stage origin the framing's camera and shadow are
 * tuned for.
 */
export const TV_STAGE_OFFSET_Y = 0.5

/**
 * Default camera for a given diagonal: the stage pose for the 65" base set,
 * pulled back in proportion as a larger panel widens past it. Size-dependent,
 * so it rides beside `TV_FRAMING` rather than inside it.
 */
export function tvCameraFraming(size?: number, variant?: TVVariant): CameraFraming {
  const spec = tvSpec(size, variant)
  return { position: [0, 0.3, 11.6 * Math.max(1, spec.body.width / TV.body.width)], fov: 40 }
}

/** The stand defines the media-stand plane; the shadow grounds under it. */
/** Millimetres per world unit - the TV scale (`TV_MM` inverted). */
export const TV_MM_PER_UNIT = 1 / TV_MM

/** Live geometry of the active panel at the requested diagonal. */
export const TV_METRICS = {
  mmPerUnit: TV_MM_PER_UNIT,
  regions: ({ inches }) => {
    const { display, resolution } = tvSpec(inches)
    return {
      screen: { width: display.width, height: display.height, radius: display.radius, resolution },
    }
  },
} as const satisfies MockupMetrics<{ inches?: number }>

export const TV_FRAMING = {
  floatIntensity: 0.5,
  extent: ({ size, variant }) => tvSpec(size, variant).standHeight - TV_STAGE_OFFSET_Y,
} as const satisfies MockupFraming<{ size?: number; variant?: TVVariant }>
