/**
 * Storefront object dimensions - a free-standing single-story corner shop.
 *
 * Proportions follow the classic high-street shopfront: a 6 m frontage,
 * ~4.4 m deep, with the parapet just above the cornice (~3.1 m) so the
 * painted shopfront composition IS the whole elevation - no masonry band.
 * Normalized to ~1100 mm per world unit so the façade is 5.45 units wide.
 *
 * All four elevations are glazed shopfront compositions:
 * - front (+Z): display windows, transom lights, fascia sign, glazed door;
 * - the other three sides (+X, −X, −Z): the same composition without the
 *   door - windows only - each carrying its own live fascia sign.
 *
 * Live surfaces: the four fascia signs (the front `fascia` region plus
 * left/right/rear), both front display bays, the glazed door leaf and the
 * center pane of each other elevation - every elevation is mockup-able
 * (the roof is not).
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming, MockupMetrics, RegionSpec } from '../../regions'

export const STOREFRONT = {
  /** Overall building: width (x), height (y), depth (z). */
  body: { width: 5.455, height: 2.85, depth: 4.0 },
  /** Fascia sign band (~550 mm) sitting directly above the window head. */
  fascia: { height: 0.5, y: 1.054 },
  /** Live sign area inset in the front fascia. Content (`children`) maps here. */
  sign: { width: 4.9, height: 0.41, radius: 0.01 },
  /** Live sign areas on the side fascias (elevations along the depth). */
  sideSign: { width: 3.45, height: 0.41, radius: 0.01 },
  /** Live sign area on the rear fascia (same frontage as the front). */
  rearSign: { width: 4.9, height: 0.41, radius: 0.01 },
  /** Stall riser under the display windows, all round. */
  riser: { height: 0.545 },
  /** Display window band between riser and fascia (door bay on the front right). */
  window: { top: 0.804, doorX: 1.6, doorWidth: 0.909, mullionX: -0.65 },
  /** Flat roof cap overhanging the parapet line. */
  roof: { thickness: 0.07, overhang: 0.03 },
  /** Distance from the building center down to the pavement. */
  standHeight: 2.85 / 2,
  /** Default CSS px width of the virtual fascia signs. */
  resolution: 800,
  /** Corner rounding of the glazed display panes. */
  paneRadius: 0.004,
  /**
   * Default CSS px width per live pane. The front bays differ because the
   * door bay makes them unequal; the three windows-only elevations share one.
   */
  paneResolution: { frontLeft: 480, frontRight: 460, door: 260, side: 420 },
} as const

/**
 * Live regions: the four fascia signs, both front display bays, the glazed
 * door leaf and the center pane of each windows-only elevation.
 */
export const STOREFRONT_REGIONS = [
  { name: 'fascia', label: 'Front fascia sign' },
  { name: 'frontLeft', label: 'Front-left display bay' },
  { name: 'frontRight', label: 'Front-right display bay' },
  { name: 'door', label: 'Door glass' },
  { name: 'left', label: 'Left window pane' },
  { name: 'right', label: 'Right window pane' },
  { name: 'rear', label: 'Rear window pane' },
  { name: 'leftSign', label: 'Left fascia sign' },
  { name: 'rightSign', label: 'Right fascia sign' },
  { name: 'rearSign', label: 'Rear fascia sign' },
] as const satisfies readonly RegionSpec[]

/** The façade stands on the pavement. */
/** Millimetres per world unit - the storefront scale (~1100 mm per unit). */
export const STOREFRONT_MM_PER_UNIT = 1100

/**
 * The façade layout every elevation is composed from: the chain running
 * pavement → stall riser → display glass → transom rail, plus the front
 * window's glazing extent and the two bays either side of its mullion.
 *
 * Lived in the React scene component until the metrics needed it. Everything
 * downstream - the renderer, `mockupInfo`, the catalog, a second binding -
 * is a consumer of this one function.
 */
export function storefrontLayout() {
  const { body, window: win, riser, standHeight } = STOREFRONT
  const riserTop = -standHeight + riser.height
  const windowH = win.top - riserTop
  // transom rail ~450 mm below the window head
  const transomY = win.top - 0.409
  // The big display panes (live areas) run riser-top to transom rail.
  const paneTop = transomY - 0.033
  const paneBottom = riserTop + 0.02
  const paneH = paneTop - paneBottom
  // Front window glazing extent - the door bay sits to its right.
  const glazeX = (win.doorX - 0.35 - body.width / 2) / 2
  const glazeW = win.doorX - 0.35 + body.width / 2 - 0.3
  return {
    riserTop,
    windowH,
    transomY,
    paneTop,
    paneBottom,
    paneH,
    paneCY: (paneTop + paneBottom) / 2,
    glazeX,
    glazeW,
    // Front bays either side of the mullion (the mullion is 0.1 wide).
    bayL: { x0: glazeX - glazeW / 2, x1: win.mullionX - 0.06 },
    bayR: { x0: win.mullionX + 0.06, x1: glazeX + glazeW / 2 },
    /** Live pane width on a windows-only elevation of the given face length. */
    elevationPaneWidth: (faceLen: number) => ((faceLen - 0.6) * 2) / 3 - 0.12,
    /** Live door-glass size on the front elevation. */
    door: { width: win.doorWidth - 0.24, height: windowH + riser.height - 0.36 },
  }
}

export type StorefrontLayout = ReturnType<typeof storefrontLayout>

/**
 * Live geometry of the four fascia signs, both front display bays, the door
 * glass and the three windows-only elevations. The side elevations run along
 * the building's depth and the rear along its width, so their panes differ.
 */
export const STOREFRONT_METRICS = {
  mmPerUnit: STOREFRONT_MM_PER_UNIT,
  regions: () => {
    const { body, sign, sideSign, rearSign, resolution, paneRadius, paneResolution } = STOREFRONT
    const l = storefrontLayout()
    const band = (width: number) => ({ width, height: sign.height, radius: sign.radius, resolution })
    const pane = (width: number, res: number) => ({
      width,
      height: l.paneH,
      radius: paneRadius,
      resolution: res,
    })
    const sidePane = pane(l.elevationPaneWidth(body.depth), paneResolution.side)
    return {
      fascia: band(sign.width),
      frontLeft: pane(l.bayL.x1 - l.bayL.x0, paneResolution.frontLeft),
      frontRight: pane(l.bayR.x1 - l.bayR.x0, paneResolution.frontRight),
      door: {
        width: l.door.width,
        height: l.door.height,
        radius: paneRadius,
        resolution: paneResolution.door,
      },
      left: sidePane,
      right: sidePane,
      rear: pane(l.elevationPaneWidth(body.width), paneResolution.side),
      leftSign: band(sideSign.width),
      rightSign: band(sideSign.width),
      rearSign: band(rearSign.width),
    }
  },
} as const satisfies MockupMetrics

export const STOREFRONT_FRAMING = {
  camera: { position: [0, 0.4, 10.6], fov: 40 },
  floatIntensity: 0.35,
  extent: () => STOREFRONT.standHeight,
} as const satisfies MockupFraming
