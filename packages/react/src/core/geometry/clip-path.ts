/**
 * Shared SVG-path building blocks for full-coverage wrap clip-paths (van,
 * bus): CSS `clip-path: path(...)` strings computed from the same dimension
 * specs the 3D shells are built from.
 *
 * Callers supply the world→CSS-px mapping as two closures - `P` maps a world
 * point to `"x y"` (flipping the y axis, and the x axis for a mirrored
 * street-side panel) and `R` maps a world length to px - plus the arc sweep
 * flag matching that mapping's orientation: `1` when the mapping preserves
 * the x direction, `0` when it mirrors it. All arcs in one wrap trace (the
 * body outline's wheel arches and every hole corner) share that same flag.
 */

/** Maps a world-space point to a CSS-px `"x y"` pair. */
export type ClipPoint = (x: number, y: number) => string

/** Maps a world-space length to CSS px. */
export type ClipLength = (u: number) => string

/** An axis-aligned rounded rect in world space (y up). */
export interface ClipRect {
  minX: number
  minY: number
  maxX: number
  maxY: number
  r: number
}

/**
 * Rounded-rect HOLE subpath. Traced from the world top-left corner in the +x
 * direction - world-clockwise, so against a world-counterclockwise outer
 * boundary the nonzero fill rule reads it as a hole. (Winding comes from the
 * traversal order; the sweep flag only bows the corner arcs the right way.)
 */
export function clipRoundedRect(
  P: ClipPoint,
  R: ClipLength,
  sweep: 0 | 1,
  { minX, minY, maxX, maxY, r }: ClipRect
): string {
  return (
    `M ${P(minX + r, maxY)} L ${P(maxX - r, maxY)} A ${R(r)} ${R(r)} 0 0 ${sweep} ${P(maxX, maxY - r)} ` +
    `L ${P(maxX, minY + r)} A ${R(r)} ${R(r)} 0 0 ${sweep} ${P(maxX - r, minY)} ` +
    `L ${P(minX + r, minY)} A ${R(r)} ${R(r)} 0 0 ${sweep} ${P(minX, minY + r)} ` +
    `L ${P(minX, maxY - r)} A ${R(r)} ${R(r)} 0 0 ${sweep} ${P(minX + r, maxY)} Z `
  )
}

/**
 * Circular HOLE subpath (two half arcs), wound the same way as
 * `clipRoundedRect` holes - for carving individual lamps, ports and other
 * round hardware out of a wrap.
 */
export function clipCircle(
  P: ClipPoint,
  R: ClipLength,
  sweep: 0 | 1,
  cx: number,
  cy: number,
  r: number
): string {
  return (
    `M ${P(cx - r, cy)} A ${R(r)} ${R(r)} 0 1 ${sweep} ${P(cx + r, cy)} ` +
    `A ${R(r)} ${R(r)} 0 1 ${sweep} ${P(cx - r, cy)} Z `
  )
}

/**
 * Rounded-rect OUTER-boundary subpath: the same rect traced in the reverse
 * (world-counterclockwise) direction, so `clipRoundedRect` holes cut out of
 * it under the nonzero fill rule. Pass the SAME `sweep` used for the holes -
 * the reversed traversal flips the corner arcs' flag internally.
 */
export function clipRoundedRectOutline(
  P: ClipPoint,
  R: ClipLength,
  sweep: 0 | 1,
  { minX, minY, maxX, maxY, r }: ClipRect
): string {
  const s = (1 - sweep) as 0 | 1
  return (
    `M ${P(maxX - r, maxY)} L ${P(minX + r, maxY)} A ${R(r)} ${R(r)} 0 0 ${s} ${P(minX, maxY - r)} ` +
    `L ${P(minX, minY + r)} A ${R(r)} ${R(r)} 0 0 ${s} ${P(minX + r, minY)} ` +
    `L ${P(maxX - r, minY)} A ${R(r)} ${R(r)} 0 0 ${s} ${P(maxX, minY + r)} ` +
    `L ${P(maxX, maxY - r)} A ${R(r)} ${R(r)} 0 0 ${s} ${P(maxX - r, maxY)} Z `
  )
}
