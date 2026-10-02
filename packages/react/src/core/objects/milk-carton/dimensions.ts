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
import { checkSizeMm } from '../../size'

export const MILK_CARTON = {
  /**
   * The walls: width (x), height (y) up to the eave, depth (z).
   *
   * `radius` is the corner fold - board creased on a rule comes off it
   * rounded, not knife-edged, so every fold on the carton keeps this much
   * radius: about 1.3 mm, which is what a crease in 0.5 mm board actually
   * turns on. It was 3 mm, which rounded the carton off like a bar of soap and
   * pushed the flat print faces well short of their corners. The roof's
   * footprint is the same rounded rectangle, which is what carries a corner's
   * fillet up through the eave rather than ending it under a square overhang.
   */
  body: { width: 1.734, height: 3.469, depth: 1.734, radius: 0.024 },
  /**
   * The gable roof. `rise` is how far the ridge stands above the walls;
   * `tuck` is how deep the ear fold pulls each end inward where it is
   * deepest - the side panel keeps its full width as it rises while the roof
   * narrows toward the ridge, and that excess board folds inward rather than
   * vanishing. It is what makes a carton's ends pinched rather than flat.
   * `crease` is the half-width of the flat the ridge fold keeps: the fin's
   * root stands on it, so it is sized to the fin rather than to the fold.
   *
   * The tuck is 12 mm on the half-gallon. It was 20, which read as a dent
   * punched into the end rather than board folded in: a real ear is pinched
   * hard just under the fin and shallow everywhere else, and its depth is
   * limited by how much board the fold actually has to shed.
   */
  gable: { rise: 0.694, tuck: 0.22, crease: 0.06 },
  /**
   * The sealed top fin, standing on the ridge. Four plies of board and the
   * seal between them: 5 mm thick where the ears fold into its root, tapering
   * to `taper` of that at the sealed top edge, which is pressed round. It was
   * modelled at 1.5 mm - a single ply - and read as a sheet of paper stood on
   * the roof. `knuckle` is the extra thickness at each end, where the ear
   * folds gather: a real fin is visibly fatter at its ends than in the middle.
   */
  fin: { height: 0.237, thickness: 0.095, taper: 0.62, radius: 0.03, knuckle: 0.3 },
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
  /**
   * The walls, up to the eave where the roof starts. `face` is the flat of
   * each wall between its corner folds - the part a print actually lies on -
   * so the live panels are sized to it rather than to the wall's full width,
   * which would put their edges out past the folds.
   */
  body: {
    width: number
    height: number
    depth: number
    radius: number
    face: { width: number; depth: number }
  }
  /**
   * The roof: its rise above the eave, the length of one slanted panel, the
   * flat its ridge fold keeps (`crease`, a half-width in z), and the ear fold
   * each end pinches into - `tuck` deep at `tuckAt` of the rise, dying to
   * nothing at the eave below and pinched back to the fin above.
   *
   * `fold` is the eave's fillet radius, and `panel` is the straight run of
   * the slope between that fillet and the ridge flat - the flat a roof print
   * lies on - as a length along the slope and the centre it is placed at, in
   * z and in height above the eave.
   */
  gable: {
    rise: number
    slant: number
    tuck: number
    tuckAt: number
    crease: number
    fold: number
    panel: { length: number; centerZ: number; centerY: number }
  }
  /** Root thickness, the top edge's share of it, the edge rounding, and the end knuckles' extra. */
  fin: { height: number; thickness: number; taper: number; radius: number; knuckle: number }
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
  checkSizeMm('MilkCarton', size, 'width: 95, height: 241, depth: 95')
  const scale = MILK_CARTON_HEIGHT / Math.max(size.width, size.height, size.depth)
  const width = size.width * scale
  const depth = size.depth * scale
  const overall = size.height * scale
  const rise = depth * GABLE_PITCH
  const thickness = width * FIN_THICKNESS
  const fin = {
    height: width * FIN_HEIGHT,
    thickness,
    taper: MILK_CARTON.fin.taper,
    // The sealed edge is a half-round of the tapered thickness, so the
    // rounding can never exceed what the top has to round.
    radius: Math.min(width * FIN_RADIUS, thickness * MILK_CARTON.fin.taper * 0.5),
    knuckle: MILK_CARTON.fin.knuckle,
  }
  // The walls are what the overall height has left over once the roof and fin
  // have taken their share (see MIN_WALL_SHARE).
  const bodyHeight = Math.max(overall - rise - fin.height, overall * MIN_WALL_SHARE)
  const capScale = width / MILK_CARTON.body.width
  // Never a fold wider than the face it is on has room for.
  const radius = Math.min(MILK_CARTON.body.radius, width / 4, depth / 4)
  // At least as wide as the fin's root, so the fin stands on a flat rather
  // than balancing on a knife edge - and never so wide it flattens the roof.
  const crease = Math.min(Math.max(depth * GABLE_CREASE, thickness * 0.55), depth * 0.08)
  const roof = milkCartonRoof({ depth, radius }, { rise, crease })
  return {
    body: {
      width,
      height: bodyHeight,
      depth,
      radius,
      face: { width: width - 2 * radius, depth: depth - 2 * radius },
    },
    gable: {
      rise,
      slant: Math.hypot(depth / 2, rise),
      // Never past the middle of the carton: a deep, narrow pack would
      // otherwise fold its two ends through each other.
      tuck: Math.min(depth * GABLE_TUCK, width / 2),
      tuckAt: EAR_FOLD_PEAK,
      crease,
      fold: roof.fold,
      panel: roof.panel,
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

/**
 * The roof in profile, front to back: a function of z alone, in the (z, y)
 * plane with y measured up from the eave.
 */
export interface MilkCartonRoof {
  /** The eave fillet's radius - the board's fold, never wider than the slope has room for. */
  fold: number
  /** Rise per unit of depth. */
  pitch: number
  /** Length along the slope per unit of depth. */
  along: number
  /** Where the eave fillet hands over to the straight slope. */
  filletEndZ: number
  filletEndY: number
  /** Height of the ridge flat, where the fin stands. */
  apex: number
  /** The board's height above the eave at `z`. */
  heightAt: (z: number) => number
  /** The straight run a roof print lies on: its length along the slope, and its centre. */
  panel: { length: number; centerZ: number; centerY: number }
}

/**
 * The roof profile.
 *
 * The slope is not a line drawn from the eave: the eave is a FOLD, so the
 * roof leaves the wall on a fillet of the board's own fold radius - tangent to
 * the wall at the eave, tangent to the slope a little way up. The slope is the
 * tangent to that arc at the roof's pitch, which lifts the ridge by a hair
 * over where a sharp crease would have put it; the fin absorbs that so the
 * carton stays exactly as tall as the spec says.
 *
 * Shared by the model, which lofts the roof from it, and the metrics, which
 * report the roof panels' printable run from it - so the two can never
 * disagree about where a print on the roof ends.
 */
export function milkCartonRoof(
  body: { depth: number; radius: number },
  gable: { rise: number; crease: number }
): MilkCartonRoof {
  const hd = body.depth / 2
  const crease = gable.crease
  const fold = Math.min(body.radius, (hd - crease) / 2)
  const pitch = gable.rise / hd
  const along = Math.hypot(1, pitch)
  const filletEndZ = hd - fold + (fold * pitch) / along
  const filletEndY = fold / along
  const heightAt = (z: number): number => {
    const az = Math.abs(z)
    if (az >= filletEndZ) {
      // On the fillet: the upper arc of the circle sat on the eave, inside
      // the corner, that the wall and the slope are both tangent to.
      const dz = az - (hd - fold)
      return Math.sqrt(Math.max(0, fold * fold - dz * dz))
    }
    return filletEndY + (filletEndZ - Math.max(az, crease)) * pitch
  }
  const run = filletEndZ - crease
  const centerZ = crease + run / 2
  return {
    fold,
    pitch,
    along,
    filletEndZ,
    filletEndY,
    apex: heightAt(crease),
    heightAt,
    panel: { length: run * along, centerZ, centerY: heightAt(centerZ) },
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

/**
 * Live geometry of the four walls and both roof panels: each is the flat of
 * its face - a wall between its corner folds, a roof slope between the eave
 * fillet and the ridge - because that is where a print lies. The corners are
 * square: every edge of a face is a crease.
 */
export const MILK_CARTON_METRICS = {
  mmPerUnit: ({ size }) => milkCartonMmPerUnit(size),
  regions: ({ size }) => {
    const { body, gable } = milkCartonLayout(size)
    const pxPerUnit = MILK_CARTON.resolution / body.face.width
    const panel = (width: number, height: number) => ({
      width,
      height,
      radius: 0,
      resolution: Math.round(width * pxPerUnit),
    })
    return {
      front: panel(body.face.width, body.height),
      back: panel(body.face.width, body.height),
      right: panel(body.face.depth, body.height),
      left: panel(body.face.depth, body.height),
      gableFront: panel(body.width, gable.panel.length),
      gableBack: panel(body.width, gable.panel.length),
    }
  },
} as const satisfies MockupMetrics<{ size?: MilkCartonSizeMm }>

export const MILK_CARTON_FRAMING = {
  camera: { position: [0, 0.6, 8.4], fov: 40 },
  floatIntensity: 0.5,
  extent: ({ size }) => milkCartonLayout(size).height / 2,
} as const satisfies MockupFraming<{ size?: MilkCartonSizeMm }>
