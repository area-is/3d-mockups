/**
 * Book-fold device dimensions - the Galaxy Z Fold 7, the Galaxy Z Fold 8, the
 * Galaxy Z Fold 8 Ultra, and Apple's iPhone Duo.
 *
 * A book-fold foldable has two form factors, and this spec carries both so the
 * one device can render either:
 *
 * - `closed`: the folded candy-bar - a narrow, thick body with a tall cover
 *   display on the front, the camera pill on the back and the hinge spine
 *   capping the left edge.
 * - `open`: the unfolded tablet - a wide, thin body with the large, nearly
 *   square inner display (a faint crease runs down its center) and the
 *   recessed hinge spine on the back.
 *
 * Both share one world scale (the same ~36.66 mm per unit as the Galaxy phone
 * family) so a Fold sits at true relative size beside the S-series. Detail
 * geometry (buttons, camera plateau + pill, hinge, ports) was measured from
 * published specifications and product photography. Pure, renderer-agnostic data.
 *
 * Real Galaxy Z Fold 7: unfolded 158.4 x 143.2 x 4.2 mm (8.0" 2184x1968 inner,
 * ratio ~1.11); folded 158.4 x 72.8 x 8.9 mm (6.5" 2520x1080 cover, ratio ~2.32).
 * Real Galaxy Z Fold 8 Ultra: the same chassis to the published tenth of a
 * millimetre, 4.1 mm thin unfolded, with a 2504x2256 inner panel in the same
 * 8.0" diagonal. Real Galaxy Z Fold 8: the generation's new WIDE form factor -
 * folded a short, broad 123.9 x 81.9 x 9.7 mm bar (5.5" 1248x1972 cover),
 * unfolded a landscape 123.9 x 161.4 x 4.5 mm tablet whose 7.6" 2448x1848
 * inner panel is natively 4:3 landscape. The hinge still runs vertically, so
 * the same spec shape carries it; it is simply wider than it is tall.
 * Real iPhone Duo: the same passport shape - folded 117.8 x 84.1 x 11.3 mm
 * (5.4" 1398x2034 cover), unfolded a landscape 117.8 x 164.6 x 5.2 mm tablet
 * with a 7.6" 2670x1878 inner panel and no inner camera hole at all. It is
 * a different brand on the same spec shape: `brand` picks the marks and the
 * system chrome, and the Duo simply leaves out the Samsung-only parts.
 */

import type { Orientation } from '../../orientation'
import type { MockupFraming, MockupMetrics } from '../../regions'
import { coverScreenLit, foldOpenAngle } from '../../regions'

/** The rear camera cluster in one pose's own back-face coordinates. */
interface FoldRearCamera {
  /** Light pedestal plate under the pill (measured: 19.8 x 52.1 mm, 2.7 mm proud). */
  plateau: { x: number; y: number; width: number; height: number; radius: number; raise: number }
  /**
   * Dark pill seating the lens column (measured: 15.2 x 48.6 mm, +2.2 mm
   * more). Absent where the collars stand straight on the plateau (the
   * iPhone Duo).
   */
  island?: { x: number; y: number; width: number; height: number; radius: number; raise: number }
  /**
   * Lens collars, top to bottom (r 7.9 mm on a 16.7 mm pitch); `pupil` is the
   * front element's fraction of the ring radius, `glint` its coating flare.
   * `x` defaults to the island's (the plateau's, without one), so a column of
   * lenses gives only `y`; the Duo's side-by-side pair gives both.
   */
  rings: { x?: number; y: number; r: number; pupil?: number; glint?: string }[]
  /**
   * The LED flash window: on the flat back beside the plateau by default, or
   * up on the plateau's face (`seat: 'plateau'`, the iPhone Duo).
   */
  flash: { x: number; y: number; r: number; seat?: 'back' | 'plateau' }
  /** A microphone grille pill on the plateau's face (the iPhone Duo). */
  mic?: { x: number; y: number; width: number; height: number }
  /**
   * How far the collars stand proud of the island, and where each collar's
   * metal ends and its cover glass begins (as a fraction of the ring radius).
   * Both default to the Galaxy rings' machined figures; the iPhone Duo's are
   * the iPhone 17's taller, thin-rimmed glossy rings.
   */
  ringProud?: number
  ringCollar?: number
}

export interface FoldSpec {
  /**
   * Whose book-fold this is. It decides the marks and the system chrome: a
   * Samsung carries the SAMSUNG emboss on its spine and draws One UI's status
   * bar; an Apple carries the badge on the camera half's back and draws
   * iOS's. Defaults to `samsung`.
   */
  brand?: 'samsung' | 'apple'
  /**
   * Folded candy-bar: two stacked slabs (`body.depth` is the whole stack)
   * with the visible crevice of `gap` air between them, like the real folded
   * device's side profile.
   */
  closed: {
    /**
     * `radius` rounds the free-edge corners; `hingeRadius`, when given, the
     * two corners along the hinge (the iPhone Duo's hinge ends nearly
     * square while its free corners are the roundest on any iPhone).
     */
    body: {
      width: number
      height: number
      depth: number
      radius: number
      hingeRadius?: number
      bevel: number
    }
    /** Air gap between the folded halves (the crevice along the rails). */
    gap: number
    /**
     * Cover display (content maps here when closed). `hingeRadius` rounds its
     * hinge-side corners when they differ from `radius`; `offsetX` shifts it
     * off the body's centre line toward the free edge (Apple's bezel drawing
     * leaves the Duo a wider border along the hinge than along the free
     * edge).
     */
    display: { width: number; height: number; radius: number; hingeRadius?: number; offsetX?: number }
    /**
     * Front-camera punch hole on the cover screen; `offsetX` is its signed
     * distance from the display's centre line (positive toward the free
     * edge), centred when absent.
     */
    punchHole: { radius: number; offsetX?: number; offsetY: number }
    /** Default CSS px width of the portrait cover display. */
    resolution: number
  }
  /** Unfolded tablet: wide, thin body with the big inner display. */
  open: {
    body: { width: number; height: number; depth: number; radius: number; bevel: number }
    /** Inner display (content maps here when open). */
    display: { width: number; height: number; radius: number }
    /**
     * Inner-display punch hole; `offsetX` is signed distance from center.
     * Absent when the inner camera sits under the panel (the iPhone Duo),
     * which leaves the open display uninterrupted and gives the status bar
     * nothing to clear.
     */
    punchHole?: { radius: number; offsetX: number; offsetY: number }
    /**
     * Default CSS px width of the inner display in the unrotated pose. That
     * pose is portrait on the Fold 7 / Fold 8 Ultra; the Fold 8's inner panel
     * is natively landscape, so its unrotated width is the landscape one.
     */
    resolution: number
  }
  /** Rear camera, given in each state's own back-face coordinates. */
  rearCamera: {
    closed: FoldRearCamera
    open: FoldRearCamera
  }
  /**
   * Keys. On the free (right) rail, `y` places a key along the rail, the
   * same in both poses. A key on the top edge (`edge: 'top'` - the iPhone
   * Duo's volume keys ride the camera half's top edge) is placed by `x` in
   * the CLOSED pose's own coordinates; the open pose carries it across onto
   * the camera half.
   */
  buttons: ({ edge?: 'right'; y: number; length: number } | { edge: 'top'; x: number; length: number })[]
  buttonProfile: { protrusion: number; thickness: number }
  /**
   * The hinge: open, a recessed spine channel down the center of the back;
   * closed, a flat band capping the left edge (protruding `overhang` beyond
   * the frame). `emboss` is the vertical SAMSUNG wordmark on the spine - the
   * iPhone Duo's spine is bare, micro-blasted titanium, so it carries none.
   */
  hinge: { width: number; overhang: number; emboss?: { length: number } }
  /**
   * Bottom-edge machining per pose (x positions in that pose's coordinates).
   * Folded, the USB lives on the camera half (rear slab) and the speaker on
   * the cover half (front slab) - each opening is machined into its own slab.
   */
  bottomEdge: {
    closed: {
      usb: { x: number; width: number; height: number }
      speaker: { x: number; width: number; height: number }
    }
    open: {
      usb: { x: number; width: number; height: number }
      speakers: { x: number; width: number; height: number }[]
      mics?: { x: number; r: number }[]
    }
  }
  /** Antenna seams on the side rails: y positions, mirrored onto both edges. */
  antennaLines?: number[]
  /**
   * Brand badge on the camera half's back (the iPhone Duo's Apple mark),
   * boxed `width` x `height` and centred at each pose's own back-face
   * coordinates, like the camera.
   */
  logo?: { width: number; height: number; closed: { x: number; y: number }; open: { x: number; y: number } }
}

const FOLD7: FoldSpec = {
  closed: {
    body: { width: 1.942, height: 4.321, depth: 0.241, radius: 0.081, bevel: 0.018 },
    // A hairline seam between the folded halves. (The hardware has about
    // 1.3 mm of air, but with the slabs' edge bevels that renders as a deep V
    // groove from the side - the retail device reads closed-flush, so the
    // model keeps just enough gap to draw the seam line.)
    gap: 0.012,
    // 65.98 x 153.03 mm cover panel, centered, with the hardware's sharp corners.
    display: { width: 1.8, height: 4.174, radius: 0.06 },
    punchHole: { radius: 0.053, offsetY: 0.127 },
    resolution: 360,
  },
  open: {
    body: { width: 3.906, height: 4.321, depth: 0.115, radius: 0.081, bevel: 0.012 },
    // 136.64 x 151.61 mm inner panel.
    display: { width: 3.727, height: 4.136, radius: 0.06 },
    // Punch on the right half: (+34.9, 3.7 below the top display edge), r 2.4 mm.
    punchHole: { radius: 0.065, offsetX: 0.952, offsetY: 0.1 },
    resolution: 820,
  },
  rearCamera: {
    // Folded: pill toward the free (right) edge of the back.
    closed: {
      plateau: { x: 0.501, y: 1.281, width: 0.54, height: 1.421, radius: 0.266, raise: 0.073 },
      island: { x: 0.501, y: 1.281, width: 0.416, height: 1.325, radius: 0.208, raise: 0.059 },
      // Top to bottom: 12 MP ultra-wide, 200 MP main, 10 MP 3x tele.
      rings: [
        { y: 1.735, r: 0.214, pupil: 0.38 },
        { y: 1.281, r: 0.214, pupil: 0.48 },
        { y: 0.826, r: 0.214, pupil: 0.32 },
      ],
      flash: { x: 0.047, y: 1.501, r: 0.058 },
    },
    // Unfolded: same module riding the camera half (right of the spine).
    open: {
      plateau: { x: 1.487, y: 1.281, width: 0.54, height: 1.421, radius: 0.266, raise: 0.073 },
      island: { x: 1.487, y: 1.281, width: 0.416, height: 1.325, radius: 0.208, raise: 0.059 },
      rings: [
        { y: 1.735, r: 0.214, pupil: 0.38 },
        { y: 1.281, r: 0.214, pupil: 0.48 },
        { y: 0.826, r: 0.214, pupil: 0.32 },
      ],
      flash: { x: 1.033, y: 1.501, r: 0.058 },
    },
  },
  // Measured: volume 18.6 mm at +28.4, power 13.0 mm at +6.5 on the right edge.
  buttons: [
    { y: 0.775, length: 0.507 },
    { y: 0.177, length: 0.354 },
  ],
  // Slim ~1.8 mm key strips - the rail is much thicker than the keys, with
  // clear frame above and below them (product photography), not pills
  // filling the edge.
  buttonProfile: { protrusion: 0.01, thickness: 0.05 },
  // Spine channel 6.1 mm wide; folded it caps the left edge, 1.1 mm proud,
  // with the vertical 16.7 mm SAMSUNG emboss at mid-height.
  hinge: { width: 0.166, overhang: 0.03, emboss: { length: 0.456 } },
  bottomEdge: {
    closed: {
      // Both center on the folded width but sit on different slabs of the stack.
      usb: { x: 0, width: 0.264, height: 0.081 },
      speaker: { x: 0, width: 0.366, height: 0.045 },
    },
    open: {
      // USB on the camera half, speaker centered on the cover half.
      usb: { x: 0.953, width: 0.264, height: 0.081 },
      speakers: [{ x: -0.976, width: 0.366, height: 0.045 }],
      mics: [{ x: 1.693, r: 0.026 }, { x: -1.657, r: 0.023 }],
    },
  },
  antennaLines: [1.115],
}

/**
 * Galaxy Z Fold 8 Ultra - the Fold 7's chassis, deliberately: the published
 * unfolded and folded footprints are identical to the Fold 7's, and only the
 * unfolded thickness moves, 4.2 -> 4.1 mm. The change is inside the panel:
 * the same 8.0" diagonal now drives 2504x2256 px on the same 910x820 dp grid
 * (2504/910 = 2256/820 = 2.75), so the physical display rect and the logical
 * resolution both carry over. The camera keeps the Fold 7's triple layout
 * around a 200 MP main. Every detail measurement is the Fold 7's, which the
 * identical chassis keeps valid.
 */
const FOLD8ULTRA: FoldSpec = {
  closed: FOLD7.closed,
  open: {
    ...FOLD7.open,
    // The tenth of a millimetre the generation shaved off: 4.1 mm.
    body: { ...FOLD7.open.body, depth: 0.112 },
  },
  rearCamera: FOLD7.rearCamera,
  buttons: FOLD7.buttons,
  buttonProfile: FOLD7.buttonProfile,
  hinge: FOLD7.hinge,
  bottomEdge: FOLD7.bottomEdge,
  antennaLines: FOLD7.antennaLines,
}

/**
 * Galaxy Z Fold 8 - the wide form factor, not a reshaped Fold 7: folded it is
 * a short, broad 123.9 x 81.9 x 9.7 mm bar with a 5.5" 1248x1972 cover panel,
 * and it unfolds around the same vertical hinge into a landscape
 * 123.9 x 161.4 x 4.5 mm tablet whose 7.6" 2448x1848 inner panel is natively
 * 4:3 landscape - the one display in the catalog whose unrotated pose is
 * wider than tall. Body, panel and camera-count figures are the published
 * hardware; detail geometry (camera pill proportions, ring size and pitch,
 * buttons, hinge, ports) is adapted from the Fold 7's measurements and the
 * official Fold 8 product renders.
 *
 * Resolutions: the cover panel runs 424 ppi, and 1248/2.6 = 480 dp puts it in
 * the density bucket nearest its true 163 dp/in; the inner panel divides by
 * the Fold 7 inner's own 2.4 (2448x1848 -> 1020x770).
 */
const FOLD8: FoldSpec = {
  closed: {
    body: { width: 2.234, height: 3.38, depth: 0.265, radius: 0.09, bevel: 0.018 },
    // The Fold 7's closed-flush hairline seam read carries over.
    gap: 0.012,
    // 74.71 x 118.05 mm cover panel (5.5", 1248x1972), centered.
    display: { width: 2.038, height: 3.22, radius: 0.09 },
    punchHole: { radius: 0.053, offsetY: 0.127 },
    resolution: 480,
  },
  open: {
    body: { width: 4.403, height: 3.38, depth: 0.123, radius: 0.09, bevel: 0.012 },
    // 154.07 x 116.31 mm inner panel (7.6", 2448x1848, landscape 4:3).
    display: { width: 4.203, height: 3.173, radius: 0.06 },
    // Punch centered on the right half, 3.7 mm below the top display edge.
    punchHole: { radius: 0.065, offsetX: 1.051, offsetY: 0.1 },
    resolution: 1020,
  },
  rearCamera: {
    // Folded: the Fold 7's corner pill at the Fold 7's margins - 17.2 mm in
    // from the free edge, 6.2 mm plateau clearance to the top edge - shortened
    // to the generation's two lenses on the same 16.7 mm ring pitch.
    closed: {
      plateau: { x: 0.647, y: 1.038, width: 0.54, height: 0.966, radius: 0.266, raise: 0.073 },
      island: { x: 0.647, y: 1.038, width: 0.416, height: 0.87, radius: 0.208, raise: 0.059 },
      // Top to bottom: 50 MP main, 50 MP ultra-wide.
      rings: [
        { y: 1.266, r: 0.214, pupil: 0.48 },
        { y: 0.811, r: 0.214, pupil: 0.38 },
      ],
      flash: { x: 0.193, y: 1.038, r: 0.058 },
    },
    // Unfolded: the same module riding the camera half (right of the spine).
    open: {
      plateau: { x: 1.757, y: 1.038, width: 0.54, height: 0.966, radius: 0.266, raise: 0.073 },
      island: { x: 1.757, y: 1.038, width: 0.416, height: 0.87, radius: 0.208, raise: 0.059 },
      rings: [
        { y: 1.266, r: 0.214, pupil: 0.48 },
        { y: 0.811, r: 0.214, pupil: 0.38 },
      ],
      flash: { x: 1.303, y: 1.038, r: 0.058 },
    },
  },
  // The Fold 7's keys at the Fold 7's relative rail positions on the shorter
  // body: volume above power on the right edge.
  buttons: [
    { y: 0.606, length: 0.507 },
    { y: 0.138, length: 0.354 },
  ],
  buttonProfile: { protrusion: 0.01, thickness: 0.05 },
  hinge: { width: 0.166, overhang: 0.03, emboss: { length: 0.456 } },
  bottomEdge: {
    closed: {
      usb: { x: 0, width: 0.264, height: 0.081 },
      speaker: { x: 0, width: 0.366, height: 0.045 },
    },
    open: {
      // USB centered on the camera half, speaker centered on the cover half.
      usb: { x: 1.101, width: 0.264, height: 0.081 },
      speakers: [{ x: -1.101, width: 0.366, height: 0.045 }],
      mics: [{ x: 1.94, r: 0.026 }, { x: -1.906, r: 0.023 }],
    },
  },
  antennaLines: [0.872],
}

export const FOLD_VARIANTS: Record<'fold7' | 'fold8' | 'fold8ultra', FoldSpec> = {
  fold7: FOLD7,
  fold8: FOLD8,
  fold8ultra: FOLD8ULTRA,
}

export type FoldVariant = keyof typeof FOLD_VARIANTS

/** The variant every binding defaults to. */
export const FOLD_DEFAULT_VARIANT: FoldVariant = 'fold7'

/**
 * iPhone Duo - Apple's first foldable, on the Fold 8's passport shape: folded
 * a broad 117.8 x 84.1 x 11.3 mm bar with a 5.4" 1398x2034 cover panel,
 * unfolding around the same vertical hinge into a landscape
 * 117.8 x 164.6 x 5.2 mm tablet whose 7.6" 2670x1878 inner panel is natively
 * landscape. Body and panel figures are Apple's tech specs; the diagonals
 * put the cover at 77.7 x 113.0 mm and the inner panel at 157.9 x 111.1 mm,
 * symmetrical 3.3 mm bezels all round.
 *
 * What makes it an iPhone rather than a Galaxy on the same spec shape:
 *
 * - No inner camera hole. The inner FaceTime camera sits under the display,
 *   so `open.punchHole` is absent and the open pose is one clean panel. The
 *   outer 12 MP Center Stage camera is a centred hole in the cover screen.
 * - Two rear cameras (48 MP Fusion main and ultra wide) in the iPhone 17's
 *   own vertical glossy pill at the top of the camera half - the pill's
 *   size, corner clearance, lens pitch and flash placement are the 17's
 *   dimensional drawing transposed onto this half, since Apple has not
 *   published the Duo's own; the pill and its lens seat are one body-colour
 *   glass pedestal rather than the Galaxy's two-tone plateau and island.
 * - Touch ID in the side button: volume up, volume down and the side button
 *   ride the camera half's free rail, no Camera Control.
 * - A bare, micro-blasted 3D-printed hinge cover with no wordmark, and the
 *   Apple badge on the camera half's back below the pill.
 * - A mirror-polished grade 5 titanium frame (`brand: 'apple'` is what the
 *   renderer keys the finish and iOS's status bar off).
 *
 * Resolutions are Apple's exact point grids at 3x: 890x626 inner (given as
 * the unrotated landscape width, as the Fold 8's is), 466x678 cover. Key
 * positions, the antenna seam and the bottom-edge machining are adapted
 * from the Fold 8 and the slab iPhones' rails pending Apple's accessory
 * drawings for the Duo.
 */
const IPHONE_DUO: FoldSpec = {
  brand: 'apple',
  closed: {
    // Apple's bezel drawing: the free-edge corners are 12.4 mm, the hinge
    // ends 4.3 mm - the hinge cover's squared ends.
    body: { width: 2.294, height: 3.213, depth: 0.308, radius: 0.338, hingeRadius: 0.12, bevel: 0.02 },
    gap: 0.012,
    // 77.7 x 113.0 mm cover panel (5.4", 1398x2034). Its free-edge corners
    // are 9.6 mm, its hinge-side corners 1.3 mm, and it sits 0.7 mm off
    // centre toward the free edge (3.9 mm of border along the hinge, 2.5 at
    // the free edge).
    display: { width: 2.119, height: 3.083, radius: 0.262, hingeRadius: 0.035, offsetX: 0.02 },
    // The Ø6.0 mm hole in the panel's top-right corner: 7.9 mm below the
    // display's top edge, 30.7 mm right of its centre line.
    punchHole: { radius: 0.0815, offsetX: 0.838, offsetY: 0.215 },
    resolution: 466,
  },
  open: {
    body: { width: 4.49, height: 3.213, depth: 0.142, radius: 0.338, bevel: 0.012 },
    // 157.9 x 111.1 mm inner panel (7.6", 2670x1878, landscape) with 8.9 mm
    // corners, per the bezel drawing.
    display: { width: 4.307, height: 3.03, radius: 0.243 },
    resolution: 890,
  },
  rearCamera: {
    // Apple's Outer Open bezel drawing, on the camera half's back: a
    // horizontal 55.8 x 21.3 mm stadium plateau across the top, 4.8 mm in
    // from the free edge and 4.4 mm down from the top edge, with the two
    // Ø16.2 lens collars side by side on its centre line (15.1 and 32.8 mm
    // in from the free edge, on the 17's 17.7 mm pitch) and the mic grille
    // and Ø3.7 flash stacked at its inner end. No separate island: the
    // collars stand straight on the plateau.
    closed: {
      plateau: { x: 0.255, y: 1.196, width: 1.522, height: 0.581, radius: 0.29, raise: 0.065 },
      // Free edge inward: 48 MP Fusion main, 48 MP ultra-wide.
      rings: [
        { x: 0.735, y: 1.196, r: 0.221, pupil: 0.5, glint: '#3f4f7a' },
        { x: 0.252, y: 1.196, r: 0.221, pupil: 0.46, glint: '#4b4270' },
      ],
      mic: { x: -0.206, y: 1.309, width: 0.087, height: 0.038 },
      flash: { x: -0.206, y: 1.069, r: 0.05, seat: 'plateau' },
      ringProud: 0.045,
      ringCollar: 0.86,
    },
    // Unfolded: the same module riding the camera half (right of the spine).
    open: {
      plateau: { x: 1.353, y: 1.196, width: 1.522, height: 0.581, radius: 0.29, raise: 0.065 },
      rings: [
        { x: 1.833, y: 1.196, r: 0.221, pupil: 0.5, glint: '#3f4f7a' },
        { x: 1.35, y: 1.196, r: 0.221, pupil: 0.46, glint: '#4b4270' },
      ],
      mic: { x: 0.892, y: 1.309, width: 0.087, height: 0.038 },
      flash: { x: 0.892, y: 1.069, r: 0.05, seat: 'plateau' },
      ringProud: 0.045,
      ringCollar: 0.86,
    },
  },
  // The Touch ID side button alone on the free rail, 18.6 mm long and
  // centred 15.9 mm above the middle; the two 10.8 mm volume keys on the
  // camera half's top edge, 1.8 and 15.3 mm right of the folded body's
  // centre line (bezel drawing).
  buttons: [
    { y: 0.434, length: 0.507 },
    { edge: 'top', x: 0.05, length: 0.295 },
    { edge: 'top', x: 0.416, length: 0.295 },
  ],
  buttonProfile: { protrusion: 0.011, thickness: 0.06 },
  // The bare titanium hinge cover: no emboss.
  hinge: { width: 0.166, overhang: 0.03 },
  bottomEdge: {
    closed: {
      usb: { x: 0, width: 0.245, height: 0.075 },
      speaker: { x: 0, width: 0.366, height: 0.045 },
    },
    open: {
      usb: { x: 1.098, width: 0.245, height: 0.075 },
      speakers: [{ x: -1.098, width: 0.366, height: 0.045 }],
      mics: [{ x: 1.95, r: 0.026 }, { x: -1.92, r: 0.023 }],
    },
  },
  antennaLines: [0.9],
  // The 16.3 x 20.0 mm badge, centred on the camera half's back, its centre
  // 0.8 mm below the middle.
  logo: { width: 0.445, height: 0.546, closed: { x: 0, y: -0.022 }, open: { x: 1.098, y: -0.022 } },
}

/** The iPhone Duo family - one model today. */
export const IPHONE_DUO_VARIANTS: Record<'duo', FoldSpec> = {
  duo: IPHONE_DUO,
}

export type IPhoneDuoVariant = keyof typeof IPHONE_DUO_VARIANTS

/** The variant the iPhone Duo binding defaults to. */
export const IPHONE_DUO_DEFAULT_VARIANT: IPhoneDuoVariant = 'duo'

/** Millimetres per world unit - shared with the Galaxy phones. */
export const FOLD_MM_PER_UNIT = 36.66

/** The pose props a book-fold's geometry depends on. */
export interface FoldPoseProps<V extends string = FoldVariant> {
  variant?: V
  openAngle?: boolean | number
  orientation?: Orientation
  /** Hinge angle up to which the cover display stays lit (see `COVER_SCREEN_UNTIL`). */
  coverScreenUntil?: number
}

/**
 * Live geometry of whichever panel is lit: the tall cover display from shut
 * until the handoff angle (`coverScreenLit`), the big inner display after.
 *
 * Built per family so an omitted `variant` falls back to the family the
 * mockup belongs to - the Galaxy Z Fold and the iPhone Duo share the spec
 * shape and this math, not a default (see the watch framings for the same
 * reasoning). `V` is inferred from the variant table alone: a module-level
 * default is narrowed to its literal at the call site, and inferring from it
 * too would type the whole family as that one variant.
 */
function foldMetrics<V extends string>(variants: Record<V, FoldSpec>, defaultVariant: NoInfer<V>) {
  return {
    mmPerUnit: FOLD_MM_PER_UNIT,
    regions: ({ variant, openAngle, orientation, coverScreenUntil }: FoldPoseProps<V>) => {
      const spec = variants[variant ?? defaultVariant]
      const { display, resolution } = coverScreenLit(openAngle, coverScreenUntil) ? spec.closed : spec.open
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
  } as const satisfies MockupMetrics<FoldPoseProps<V>>
}

/**
 * Grounded by default: the shadow plane kisses the bottom edge of the body -
 * the halves' folded extent at partial angles in landscape.
 */
function foldFraming<V extends string>(variants: Record<V, FoldSpec>, defaultVariant: NoInfer<V>) {
  return {
    contactGap: 0.05,
    extent: ({ variant, openAngle, orientation }: FoldPoseProps<V>) => {
      const spec = variants[variant ?? defaultVariant]
      const angle = foldOpenAngle(openAngle)
      const state = angle > 3 ? spec.open : spec.closed
      const foldCos = Math.cos((((180 - angle) / 2) * Math.PI) / 180)
      const extent =
        orientation === 'landscape'
          ? angle > 3 && angle < 177
            ? state.body.width * foldCos
            : state.body.width
          : state.body.height
      return extent / 2
    },
  } as const satisfies MockupFraming<FoldPoseProps<V>>
}

export const FOLD_METRICS = foldMetrics(FOLD_VARIANTS, FOLD_DEFAULT_VARIANT)
export const FOLD_FRAMING = foldFraming(FOLD_VARIANTS, FOLD_DEFAULT_VARIANT)

/** Live geometry of the iPhone Duo's inner or cover display. */
export const IPHONE_DUO_METRICS = foldMetrics(IPHONE_DUO_VARIANTS, IPHONE_DUO_DEFAULT_VARIANT)
export const IPHONE_DUO_FRAMING = foldFraming(IPHONE_DUO_VARIANTS, IPHONE_DUO_DEFAULT_VARIANT)
