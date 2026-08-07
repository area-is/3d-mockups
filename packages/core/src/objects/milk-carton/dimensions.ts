/**
 * Milk carton object dimensions - a gable-top beverage carton.
 *
 * Proportions follow the US half-gallon (1.89 L) carton: a 95 x 95 mm square
 * footprint, 241 mm tall overall - 190 mm of walls, a roof whose ridge rises
 * 38 mm above them, and the 13 mm sealed fin standing on the ridge.
 * Normalized to ~55 mm per world unit so the carton is 4.4 units tall.
 *
 * The top is the shape the pack is named for: two slanted roof panels meeting
 * at a ridge, an ear fold closing each end, and the fin the four panels are
 * pinched into. The ear folds are why the ends are not flat triangles - a side
 * panel stays its full width as it rises while the roof narrows toward the
 * ridge, so the excess board folds inward - deepening the whole way up until
 * the two halves close on each other just under the fin, where they are
 * pinched flat and sealed into it. A ribbed screw cap sits on the front roof
 * panel, which is where a real carton puts it - so it rides over that panel's
 * artwork the way a real spout rides over the print.
 *
 * Live faces: the four wall panels (front is the primary region) plus both
 * roof panels.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming, MockupMetrics, RegionSpec } from '../../regions'

export const MILK_CARTON = {
  /**
   * The walls: width (x), height (y) up to the eave, depth (z).
   *
   * `radius` is the corner fold - board creased on a rule comes off it
   * rounded, not knife-edged, so every fold on the carton keeps this much
   * radius. The roof's footprint is the same rounded rectangle, which is what
   * carries a corner's fillet up through the eave rather than ending it under
   * a square overhang.
   */
  body: { width: 1.734, height: 3.469, depth: 1.734, radius: 0.034 },
  /**
   * The gable roof. `rise` is how far the ridge stands above the walls;
   * `tuck` is how deep the ear fold pulls each end inward where it is
   * deepest - the side panel keeps its full width as it rises while the roof
   * narrows toward the ridge, and that excess board folds inward rather than
   * vanishing. It is what makes a carton's ends pinched rather than flat.
   * `crease` is the half-width of the flat the ridge fold keeps, for the same
   * reason the walls have a corner radius.
   */
  gable: { rise: 0.694, tuck: 0.36, crease: 0.026 },
  /**
   * The sealed top fin, standing on the ridge: four plies of board and the
   * seal between them, which is why it is thin next to everything else on the
   * carton. `radius` rounds its edges - it is a pressed fold, not a cut slab.
   */
  fin: { height: 0.237, thickness: 0.028, radius: 0.011 },
  /**
   * The screw cap on the front roof panel: the cap itself, the collar it is
   * moulded onto, and `offset` - how far up the slant it sits, as a fraction
   * of the slant (0 at the eave, 1 at the ridge). The cap is the one part of
   * the carton that is not a fraction of the board, so it scales with the
   * carton's width rather than with whichever edge is longest.
   *
   * `flutes` and `fluteDepth` are the moulded grip: the ribs a closure is
   * knurled with so a wet hand can turn it, the same gear profile the watch
   * crown is machined from. `rim` is the smooth band the ribs die into at the
   * top and bottom of the skirt, which is where a moulded cap's parting
   * surfaces are - ribs never run right off either edge.
   */
  cap: {
    radius: 0.2,
    height: 0.15,
    flange: 0.246,
    collar: 0.045,
    offset: 0.55,
    flutes: 42,
    fluteDepth: 0.013,
    rim: 0.022,
  },
  /** Default CSS px width of the virtual front panel; other panels share its dpi. */
  resolution: 420,
} as const

/** Overall height of the default carton in world units - walls + roof + fin. */
export const MILK_CARTON_HEIGHT =
  MILK_CARTON.body.height + MILK_CARTON.gable.rise + MILK_CARTON.fin.height

/**
 * Ridge rise as a fraction of the carton's depth - a ~38 degree roof pitch,
 * which is what the default half-gallon's 38 mm rise over a 95 mm depth is.
 * The roof is a proportion of the footprint rather than of the height, so a
 * squat pint and a tall quart both get a carton-shaped top.
 */
const GABLE_PITCH = MILK_CARTON.gable.rise / MILK_CARTON.body.depth

/** Ear-fold depth, and the ridge fold's flat, as fractions of the carton's depth. */
const GABLE_TUCK = MILK_CARTON.gable.tuck / MILK_CARTON.body.depth
const GABLE_CREASE = MILK_CARTON.gable.crease / MILK_CARTON.body.depth

/**
 * Where the ear fold is deepest, as a fraction of the rise.
 *
 * Near the top, not halfway: the board a side panel has to shed grows with
 * every millimetre the roof narrows, so the fold deepens all the way up and
 * the two facets close on each other just under the fin - the glued line the
 * ear is finally sealed into. The last fraction back out to the fin is the
 * pinch itself, where the fold is pressed flat to be sealed.
 */
const EAR_FOLD_PEAK = 0.88

/** Fin height, thickness and edge radius as fractions of the carton's width. */
const FIN_HEIGHT = MILK_CARTON.fin.height / MILK_CARTON.body.width
const FIN_THICKNESS = MILK_CARTON.fin.thickness / MILK_CARTON.body.width
const FIN_RADIUS = MILK_CARTON.fin.radius / MILK_CARTON.body.width

/**
 * Least of the overall height the walls keep. A carton asked for shorter than
 * its own roof would otherwise resolve to negative walls and render inside
 * out; clamping trades the requested height for a carton that is still a
 * carton.
 */
const MIN_WALL_SHARE = 0.2

/** Carton size in real millimeters. */
export interface MilkCartonSizeMm {
  /** Carton width in millimeters (x). */
  width: number
  /**
   * Overall carton height in millimeters (y), roof and sealed fin included -
   * the number printed on a spec sheet, and what a ruler against a real
   * carton reads.
   */
  height: number
  /** Carton depth in millimeters (z). */
  depth: number
}

/** The default US half-gallon (1.89 L) carton in millimeters. */
export const MILK_CARTON_SIZE_MM: MilkCartonSizeMm = { width: 95, height: 241, depth: 95 }

/** Everything the renderer needs to build a carton of a given size. */
export interface MilkCartonLayout {
  /** The walls, up to the eave where the roof starts. */
  body: { width: number; height: number; depth: number; radius: number }
  /**
   * The roof: its rise above the eave, the length of one slanted panel, the
   * flat its ridge fold keeps (`crease`, a half-width in z), and the ear fold
   * each end pinches into - `tuck` deep at `tuckAt` of the rise, dying to
   * nothing at the eave below and pinched back to the fin above.
   */
  gable: { rise: number; slant: number; tuck: number; tuckAt: number; crease: number }
  fin: { height: number; thickness: number; radius: number }
  cap: {
    radius: number
    height: number
    flange: number
    collar: number
    offset: number
    flutes: number
    fluteDepth: number
    rim: number
  }
  /** Overall height, walls + roof + fin. */
  height: number
}

/**
 * Carton layout in world units for a given mm size. Like the mailer box, the
 * longest edge normalizes to the default stage (the default carton's 4.4 unit
 * height), so any size fills the camera while the mm dimensions set the true
 * proportions. Roof pitch, fin and cap stay proportional to the carton, so a
 * half-pint school carton and a 2 L jug-style pack both read right.
 */
export function milkCartonLayout(size: MilkCartonSizeMm = MILK_CARTON_SIZE_MM): MilkCartonLayout {
  const scale = MILK_CARTON_HEIGHT / Math.max(size.width, size.height, size.depth)
  const width = size.width * scale
  const depth = size.depth * scale
  const overall = size.height * scale
  const rise = depth * GABLE_PITCH
  const thickness = width * FIN_THICKNESS
  const fin = {
    height: width * FIN_HEIGHT,
    thickness,
    // A rounded box cannot round past half its own smallest side.
    radius: Math.min(width * FIN_RADIUS, thickness * 0.45),
  }
  // The walls are what the overall height has left over once the roof and fin
  // have taken their share (see MIN_WALL_SHARE).
  const bodyHeight = Math.max(overall - rise - fin.height, overall * MIN_WALL_SHARE)
  const capScale = width / MILK_CARTON.body.width
  return {
    body: { width, height: bodyHeight, depth, radius: MILK_CARTON.body.radius },
    gable: {
      rise,
      slant: Math.hypot(depth / 2, rise),
      // Never past the middle of the carton: a deep, narrow pack would
      // otherwise fold its two ends through each other.
      tuck: Math.min(depth * GABLE_TUCK, width / 2),
      tuckAt: EAR_FOLD_PEAK,
      // Wider than the fin standing on it, so a soft shoulder of folded board
      // shows either side of the seal instead of a knife edge running into it.
      crease: Math.min(depth * GABLE_CREASE, depth * 0.06),
    },
    fin,
    cap: {
      radius: MILK_CARTON.cap.radius * capScale,
      height: MILK_CARTON.cap.height * capScale,
      flange: MILK_CARTON.cap.flange * capScale,
      collar: MILK_CARTON.cap.collar * capScale,
      offset: MILK_CARTON.cap.offset,
      // The rib COUNT is fixed - a closure is moulded with the grip its
      // diameter calls for, so a smaller cap gets finer ribs, not fewer.
      flutes: MILK_CARTON.cap.flutes,
      fluteDepth: MILK_CARTON.cap.fluteDepth * capScale,
      rim: MILK_CARTON.cap.rim * capScale,
    },
    height: bodyHeight + rise + fin.height,
  }
}

/** Live regions: the four walls, the front one first, then both roof panels. */
export const MILK_CARTON_REGIONS = [
  { name: 'front', label: 'Front panel' },
  { name: 'back', label: 'Back panel' },
  { name: 'right', label: 'Right panel' },
  { name: 'left', label: 'Left panel' },
  { name: 'gableFront', label: 'Front roof panel' },
  { name: 'gableBack', label: 'Back roof panel' },
] as const satisfies readonly RegionSpec[]

/**
 * Millimetres per world unit. The carton's longest edge maps to a fixed world
 * height, so the scale depends on the size you asked for.
 */
export function milkCartonMmPerUnit(size: MilkCartonSizeMm = MILK_CARTON_SIZE_MM): number {
  return Math.max(size.width, size.height, size.depth) / MILK_CARTON_HEIGHT
}

/** Live geometry of the four walls and both roof panels. */
export const MILK_CARTON_METRICS = {
  mmPerUnit: ({ size }) => milkCartonMmPerUnit(size),
  regions: ({ size }) => {
    const { body, gable } = milkCartonLayout(size)
    const pxPerUnit = MILK_CARTON.resolution / body.width
    const panel = (width: number, height: number) => ({
      width,
      height,
      radius: body.radius,
      resolution: Math.round(width * pxPerUnit),
    })
    return {
      front: panel(body.width, body.height),
      back: panel(body.width, body.height),
      right: panel(body.depth, body.height),
      left: panel(body.depth, body.height),
      gableFront: panel(body.width, gable.slant),
      gableBack: panel(body.width, gable.slant),
    }
  },
} as const satisfies MockupMetrics<{ size?: MilkCartonSizeMm }>

export const MILK_CARTON_FRAMING = {
  camera: { position: [0, 0.6, 8.4], fov: 40 },
  floatIntensity: 0.5,
  extent: ({ size }) => milkCartonLayout(size).height / 2,
} as const satisfies MockupFraming<{ size?: MilkCartonSizeMm }>
