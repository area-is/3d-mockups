/**
 * TV object dimensions — three premium flat-screen designs, each sized by its
 * diagonal in inches (default 65").
 *
 * The variants are proportioned from the published dimensions of current
 * Samsung and LG sets, which is what makes them read as different products
 * rather than one cabinet with different legs:
 *
 * - `legs` — the wide-set 4K class on splayed A-frame feet: a near-bezel-less
 *   panel (~7.6 mm frame, ~14.6 mm bottom chin), thin at the edges with a
 *   shallow electronics bulge low on the back, standing on two slim feet near
 *   the ends, each a pair of struts meeting at the cabinet in the shallow Λ of
 *   current retail stands.
 * - `pedestal` — the OLED class on a center plate (LG C5, 65": 1441 mm wide
 *   over a 1428.5 mm panel, so a ~6.2 mm frame; 880 mm tall on the stand, whose
 *   footprint is 470 x 230 mm). One slim neck rises from a low plate instead of
 *   feet, so the set can sit on furniture narrower than the panel.
 * - `frame` — the picture-frame class (Samsung The Frame LS03F, 65":
 *   1458 x 833 x 25.4 mm over the same panel, i.e. a UNIFORM ~14.75 mm bezel
 *   with no chin, and a slab of even thickness because the electronics live in
 *   an external One Connect box). It stands on the snap-in blade feet Samsung
 *   ships for tabletop placement.
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

import type { CameraFraming, MockupFraming } from '../../regions'

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
  pedestal: { bezel: 6.2, chin: 9.4, depth: 0.1, bulge: 0.135, ports: true, logoBar: true, stand: 'pedestal' },
  frame: { bezel: 14.75, chin: 14.75, depth: 0.098, bulge: 0, ports: false, logoBar: false, stand: 'blades' },
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
  // The center plate: 470 x 230 mm under a 65" C5, growing gently with the
  // panel so a 98" set doesn't perch on a 65" plate.
  const plateWidth = mm(clamp(470 + (d - 65) * 2.2, 380, 620))
  const plateDepth = mm(clamp(230 + (d - 65) * 0.8, 200, 280))
  const plateHeight = mm(20)
  const neckLift = mm(clamp(60 + (d - 65) * 0.2, 52, 76))
  // The Frame's snap-in blades: flat, straight and shallow, set well in from
  // the panel ends so the set clears a narrower console.
  const bladeInset = mm(clamp(150 + (d - 43) * 1.4, 140, 230))
  const bladeHeight = mm(clamp(52 + (d - 43) * 0.3, 50, 66))
  const bladeDepth = mm(clamp(150 + (d - 43) * 0.9, 145, 210))
  const stand =
    v.stand === 'pedestal'
      ? ({
          kind: 'pedestal' as const,
          /** The low plate on the media surface, and the neck rising from it. */
          plate: { width: plateWidth, depth: plateDepth, height: plateHeight },
          neck: { width: mm(90), depth: mm(34), height: neckLift - plateHeight },
          height: neckLift,
        } as const)
      : v.stand === 'blades'
        ? ({
            kind: 'blades' as const,
            /** One flat blade per end: a thin plate standing on its edge. */
            offsetX: bodyW / 2 - bladeInset,
            height: bladeHeight,
            depth: bladeDepth,
            thickness: mm(11),
          } as const)
        : ({
            kind: 'splayed' as const,
            /**
             * Two feet near the ends: each a pair of slim struts splaying fore
             * and aft from a common ankle at the cabinet bottom — the shallow Λ
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
    /** Wide, shallow electronics bulge low on the back — absent on `frame`. */
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
    /** How the set stands: splayed feet, a center pedestal, or blade feet. */
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
export const TV_FRAMING = {
  floatIntensity: 0.5,
  extent: ({ size, variant }) => tvSpec(size, variant).standHeight - TV_STAGE_OFFSET_Y,
} as const satisfies MockupFraming<{ size?: number; variant?: TVVariant }>
