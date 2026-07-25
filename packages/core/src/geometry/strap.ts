/**
 * Wristband geometry: a crowned strap section swept along a path.
 *
 * A watch strap is not a tube. Its outer face is gently domed, its inner face
 * is flat against the wrist, its edges are half-round, and it tapers between
 * the lug and the free tip. Sweeping that section along a path — rather than
 * extruding one rectangle around a circle — is what separates a strap from a
 * rubber O-ring, so the math lives here and every binding gets it.
 *
 * A band gets a DIFFERENT path per pose rather than one path bent to fit.
 * Worn, it follows the oval of a wrist (`wristLoopPath`); unbuckled, it lies
 * dead straight on a surface (`flatStrapPath`). Approximating the flat pose as
 * a huge-radius arc technically works, but every offset expressed in degrees
 * then means a wildly different distance in the two poses — the bug that put
 * the buckle tens of units off the band. A path is parameterized 0→1 along the
 * strap in both poses, so positions transfer between them unchanged.
 *
 * Loop angles are measured from the front axis (the case): 0 is dead centre of
 * the case, +90° the twelve-o'clock side, 180° the underside of the wrist
 * where the closure sits, 270° the six-o'clock side.
 */

import { BufferAttribute, BufferGeometry, Vector2, Vector3 } from 'three'

/** The oval an on-wrist band traces, in the device's local YZ plane. */
export interface WristLoop {
  /** Vertical radius at the case (front) — the strap leaves the lugs here. */
  ryFront: number
  /** Vertical radius at the far side of the wrist. */
  ryBack: number
  /** Depth radius. */
  rz: number
  /** Loop centre on Z, behind the case. */
  centerZ: number
  /**
   * Degrees off the front axis where the straps emerge, so their cut ends
   * stay buried inside the case.
   */
  startAngle: number
}

/** A point on the wrist loop with the outward (away from the wrist) normal. */
export interface LoopFrame {
  y: number
  z: number
  /** Outward unit normal, in the YZ plane. */
  ny: number
  nz: number
}

/**
 * The loop's circumference, by Ramanujan's ellipse approximation — accurate to
 * a few parts in 10^5 at these proportions. This is what fixes a band's true
 * length: a band is cut to go round a wrist, so however it is posed, its
 * straps measure what they measure here.
 */
export function wristLoopPerimeter(loop: WristLoop): number {
  const a = (loop.ryFront + loop.ryBack) / 2
  return Math.PI * (3 * (a + loop.rz) - Math.sqrt((3 * a + loop.rz) * (a + 3 * loop.rz)))
}

/** Length of the `from` → `to` degree run along the loop. */
export function wristLoopArcLength(loop: WristLoop, from: number, to: number): number {
  return (Math.abs(to - from) / 360) * wristLoopPerimeter(loop)
}

/** Sample the wrist loop at sweep angle `phi` (radians). */
export function wristLoopAt(loop: WristLoop, phi: number): LoopFrame {
  const { ryFront, ryBack, rz, centerZ } = loop
  const sin = Math.sin(phi)
  const cos = Math.cos(phi)
  // The vertical radius eases from the case to the far side, so the oval is
  // egg-shaped like a real wrist rather than a perfect ellipse.
  const ease = (1 - cos) / 2
  const ry = ryFront + (ryBack - ryFront) * ease
  const dRy = ((ryBack - ryFront) / 2) * sin
  const y = ry * sin
  const z = centerZ + rz * cos
  // Tangent, then the perpendicular that points away from the loop centre.
  const ty = dRy * sin + ry * cos
  const tz = -rz * sin
  let ny = tz
  let nz = -ty
  const length = Math.hypot(ny, nz) || 1
  ny /= length
  nz /= length
  if (ny * y + nz * (z - centerZ) < 0) {
    ny = -ny
    nz = -nz
  }
  return { y, z, ny, nz }
}

/**
 * A strap's centre path, sampled at `t` from 0 at the lug end to 1 at the free
 * end. Every position along a band — a hole, the buckle, the keeper — is a `t`,
 * so it means the same place whichever pose the band is in.
 */
export type StrapPath = (t: number) => LoopFrame

/** Path along part of a worn wrist loop, `from` → `to` in degrees. */
export function wristLoopPath(loop: WristLoop, from: number, to: number): StrapPath {
  const a0 = (from * Math.PI) / 180
  const a1 = (to * Math.PI) / 180
  return (t) => wristLoopAt(loop, a0 + (a1 - a0) * t)
}

export interface FlatStrapOptions {
  /** Where the strap's lug end sits on the case's centre line. */
  startY: number
  /** Depth of the strap's mid-surface — the plane it lies in. */
  z: number
  /** True length of the strap. */
  length: number
  /** `1` runs it toward twelve o'clock, `-1` toward six. */
  direction: 1 | -1
}

/**
 * Path for a strap laid out flat: a straight run along Y at a fixed depth,
 * its outer face toward the viewer. This is the unbuckled pose — a real band
 * off the wrist is straight, not a very wide arc, and holes and hardware sit
 * at exact multiples of the strap's length rather than of some arc's radius.
 */
export function flatStrapPath({ startY, z, length, direction }: FlatStrapOptions): StrapPath {
  return (t) => ({ y: startY + direction * length * t, z, ny: 0, nz: 1 })
}

/** Per-position strap dimensions, sampled at `t` from 0 (start) to 1 (end). */
export type StrapTaper = (t: number) => number

export interface StrapOptions {
  /** The centre path the section sweeps along. */
  path: StrapPath
  /** Strap width across the wrist. */
  width: StrapTaper
  /** Strap thickness (edge to edge through the section). */
  thickness: StrapTaper
  /** How far the outer face domes above the nominal thickness. */
  crown: StrapTaper
  /**
   * Extra ride height above the loop — how far this strap stands off the
   * wrist. A strap crossing over another one lifts by roughly the other's
   * thickness so the two stack instead of interpenetrating.
   */
  lift?: StrapTaper
  /** Sweep segments. */
  segments?: number
  /** Close the start end with a cap (a free tip; a lug end stays open). */
  capStart?: boolean
  /** Close the end end with a cap. */
  capEnd?: boolean
}

/** Section resolution: doming samples, then each half-round edge. */
const OUTER_SEGMENTS = 12
const EDGE_SEGMENTS = 7

/**
 * The strap's cross-section in (across-width, outward-thickness) coordinates:
 * a domed outer face, half-round edges and a flat inner face, traced as one
 * closed ring of a fixed point count so every sweep ring indexes alike.
 */
function strapSection(width: number, thickness: number, crown: number, out: Vector2[]): void {
  const half = Math.max(width / 2, 1e-4)
  const edge = Math.min(thickness / 2, half * 0.95)
  // Flat span between the two half-round edges.
  const flat = Math.max(half - edge, 1e-4)
  let i = 0
  const push = (u: number, v: number) => {
    const point = out[i]
    if (point) point.set(u, v)
    else out[i] = new Vector2(u, v)
    i++
  }
  // Outer face, left to right, doming to `crown` at the centre line.
  for (let s = 0; s <= OUTER_SEGMENTS; s++) {
    const u = -flat + (2 * flat * s) / OUTER_SEGMENTS
    const k = u / flat
    push(u, edge + crown * (1 - k * k))
  }
  // Right edge, outer to inner.
  for (let s = 1; s < EDGE_SEGMENTS; s++) {
    const angle = Math.PI / 2 - (Math.PI * s) / EDGE_SEGMENTS
    push(flat + edge * Math.cos(angle), edge * Math.sin(angle))
  }
  // Flat inner face, right to left.
  for (let s = 0; s <= OUTER_SEGMENTS; s++) {
    push(flat - (2 * flat * s) / OUTER_SEGMENTS, -edge)
  }
  // Left edge, inner back up to outer.
  for (let s = 1; s < EDGE_SEGMENTS; s++) {
    const angle = -Math.PI / 2 - (Math.PI * s) / EDGE_SEGMENTS
    push(-flat + edge * Math.cos(angle), edge * Math.sin(angle))
  }
  out.length = i
}

/** Points per section ring — fixed, so the sweep grid stays rectangular. */
export const STRAP_SECTION_POINTS = (OUTER_SEGMENTS + 1) * 2 + (EDGE_SEGMENTS - 1) * 2

/**
 * Sweep a strap section along part of a wrist loop. The result is an indexed
 * grid with smooth vertex normals — flat-shaded extrusions turn a glossy
 * band into visible facets.
 */
export function sweptStrapGeometry({
  path,
  width,
  thickness,
  crown,
  lift,
  segments = 64,
  capStart = false,
  capEnd = false,
}: StrapOptions): BufferGeometry {
  const cols = STRAP_SECTION_POINTS
  const rings = segments
  const vertexCount = (rings + 1) * cols + (capStart ? cols + 1 : 0) + (capEnd ? cols + 1 : 0)
  const positions = new Float32Array(vertexCount * 3)
  const indices: number[] = []
  const section: Vector2[] = []
  const centre = new Vector3()

  for (let i = 0; i <= rings; i++) {
    const t = i / rings
    const frame = path(t)
    const ride = lift ? lift(t) : 0
    strapSection(width(t), thickness(t), crown(t), section)
    for (let j = 0; j < cols; j++) {
      const s = section[j]!
      const v = s.y + ride
      const o = (i * cols + j) * 3
      positions[o] = s.x
      positions[o + 1] = frame.y + frame.ny * v
      positions[o + 2] = frame.z + frame.nz * v
    }
    if (i < rings) {
      for (let j = 0; j < cols; j++) {
        const jn = (j + 1) % cols
        const a = i * cols + j
        const b = i * cols + jn
        const c = (i + 1) * cols + j
        const d = (i + 1) * cols + jn
        indices.push(a, c, b, b, c, d)
      }
    }
  }

  // End caps: a triangle fan from the ring's centroid, so a strap tip reads
  // as solid rubber instead of an open tube needing double-sided material.
  let next = (rings + 1) * cols
  const cap = (ring: number, flip: boolean) => {
    centre.set(0, 0, 0)
    for (let j = 0; j < cols; j++) {
      const o = (ring * cols + j) * 3
      centre.x += positions[o]!
      centre.y += positions[o + 1]!
      centre.z += positions[o + 2]!
    }
    centre.divideScalar(cols)
    const hub = next
    positions[hub * 3] = centre.x
    positions[hub * 3 + 1] = centre.y
    positions[hub * 3 + 2] = centre.z
    next++
    for (let j = 0; j < cols; j++) {
      const o = (ring * cols + j) * 3
      positions[(next + j) * 3] = positions[o]!
      positions[(next + j) * 3 + 1] = positions[o + 1]!
      positions[(next + j) * 3 + 2] = positions[o + 2]!
    }
    for (let j = 0; j < cols; j++) {
      const b = next + j
      const c = next + ((j + 1) % cols)
      indices.push(hub, flip ? c : b, flip ? b : c)
    }
    next += cols
  }
  if (capStart) cap(0, true)
  if (capEnd) cap(rings, false)

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
