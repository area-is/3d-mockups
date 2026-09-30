import { describe, expect, it } from 'vitest'
import { BoxGeometry } from 'three'
import { bendAlongStrap, flatStrapPath, wristLoopAt, wristLoopPath, wristLoopArcLength, type WristLoop } from '../geometry/strap'
import { gearShape } from '../geometry/gear'
import { WATCH_MM_PER_UNIT, WATCH_VARIANTS, watchStrapLengths, type FastenedWatchBand } from '../devices/watch/dimensions'

/**
 * The band hardware is authored flat and wrapped onto the strap; the specs
 * behind it are measured off the makers' renders. These check that the wrap
 * lands hardware where the strap is, and that the specs still say what the
 * renders do.
 */

const CIRCLE: WristLoop = { ryFront: 1.5, ryBack: 1.5, rz: 1.5, centerZ: 0, startAngle: 0 }

describe('bendAlongStrap', () => {
  it('carries the local origin to the strap point, stood off along its normal', () => {
    const path = wristLoopPath(CIRCLE, 0, 180)
    const length = wristLoopArcLength(CIRCLE, 0, 180)
    const box = new BoxGeometry(0.002, 0.002, 0.002)
    bendAlongStrap(box, { path, length, at: 0.5, stand: 0.2 })
    box.computeBoundingBox()
    const centre = box.boundingBox!.getCenter(box.boundingBox!.min.clone())
    const frame = path(0.5)
    expect(centre.x).toBeCloseTo(0, 4)
    expect(centre.y).toBeCloseTo(frame.y + frame.ny * 0.2, 3)
    expect(centre.z).toBeCloseTo(frame.z + frame.nz * 0.2, 3)
  })

  it('bends a straight bar round the loop instead of leaving it a chord', () => {
    const path = wristLoopPath(CIRCLE, 0, 180)
    const length = wristLoopArcLength(CIRCLE, 0, 180)
    // A bar a third of the loop long, lying on the strap.
    const bar = new BoxGeometry(0.01, 0.01, length / 3, 1, 1, 40)
    bendAlongStrap(bar, { path, length, at: 0.5 })
    const position = bar.getAttribute('position')
    for (let i = 0; i < position.count; i++) {
      const r = Math.hypot(position.getY(i), position.getZ(i))
      // Every vertex stays on the circle, give or take the bar's half-height.
      expect(Math.abs(r - 1.5)).toBeLessThan(0.006)
    }
  })

  it('turns outward-facing normals to face out from the wrist', () => {
    const path = wristLoopPath(CIRCLE, 0, 180)
    const length = wristLoopArcLength(CIRCLE, 0, 180)
    // Thin along the strap, so every vertex of a face shares one frame.
    const box = new BoxGeometry(0.1, 0.1, 0.0001)
    bendAlongStrap(box, { path, length, at: 0.25 })
    const frame = path(0.25)
    const normal = box.getAttribute('normal')
    const position = box.getAttribute('position')
    // BoxGeometry's +y face is vertices 8-11.
    for (let i = 8; i < 12; i++) {
      expect(normal.getY(i)).toBeCloseTo(frame.ny, 3)
      expect(normal.getZ(i)).toBeCloseTo(frame.nz, 3)
      expect(position.getX(i) ** 2).toBeLessThan(0.0026)
    }
  })

  it('leaves a flat strap flat', () => {
    const path = flatStrapPath({ startY: 0, z: 0, length: 4, direction: 1 })
    const box = new BoxGeometry(0.5, 0.1, 1, 1, 1, 8)
    bendAlongStrap(box, { path, length: 4, at: 0.5 })
    box.computeBoundingBox()
    expect(box.boundingBox!.min.z).toBeCloseTo(-0.05, 6)
    expect(box.boundingBox!.max.z).toBeCloseTo(0.05, 6)
    expect(box.boundingBox!.max.y - box.boundingBox!.min.y).toBeCloseTo(1, 6)
  })
})

describe('gearShape', () => {
  it('cuts the Ultra crown as a score of lobes between the two radii', () => {
    const points = gearShape(0.272, 20, 0.024, 'lobed').getPoints()
    const radii = points.map((p) => Math.hypot(p.x, p.y))
    expect(Math.max(...radii)).toBeLessThanOrEqual(0.272 + 1e-9)
    expect(Math.min(...radii)).toBeGreaterThanOrEqual(0.272 - 0.024 - 1e-9)
    // One crest per lobe round the circumference.
    let crests = 0
    for (let i = 0; i < radii.length; i++) {
      const prev = radii[(i - 1 + radii.length) % radii.length]!
      const next = radii[(i + 1) % radii.length]!
      if (radii[i]! >= prev && radii[i]! > next) crests++
    }
    expect(crests).toBe(20)
  })
})

const fastened = (Object.entries(WATCH_VARIANTS) as [string, (typeof WATCH_VARIANTS)[keyof typeof WATCH_VARIANTS]][])
  .filter(([, spec]) => spec.band.closure !== 'seamless')
  .map(([name, spec]) => [name, spec.band as FastenedWatchBand] as const)

describe('watch bands', () => {
  it.each(fastened)('%s: engages the buckle at the short strap’s end, holes in order', (_, band) => {
    const { startAngle } = band.loop
    const tailFrom = 360 - startAngle
    const angleAt = (t: number) => tailFrom - t * (tailFrom - band.tailEnd)
    const engaged = angleAt(band.holes[band.closureHole]!)
    // The frame's hinge bar is wrapped by the short strap's end, so the hole
    // the tongue is in sits within one buckle length of that end.
    const perDegree = wristLoopArcLength(band.loop, 0, 1)
    const buckleLength = band.buckle?.length ?? band.width
    expect(Math.abs(band.pinStrapEnd - engaged) * perDegree).toBeLessThan(buckleLength)
    for (let i = 1; i < band.holes.length; i++) expect(band.holes[i]!).toBeGreaterThan(band.holes[i - 1]!)
    expect(band.holes[0]!).toBeGreaterThan(0)
    expect(band.holes.at(-1)!).toBeLessThan(1)
  })

  it('punches the holes at the pitch the makers’ renders show', () => {
    const pitch = (name: 'watch8' | 'ultra4') => {
      const band = WATCH_VARIANTS[name].band as FastenedWatchBand
      const { tail } = watchStrapLengths(band)
      return ((band.holes[1]! - band.holes[0]!) * tail * WATCH_MM_PER_UNIT)
    }
    // Galaxy Watch 8 Sport Band: ten holes 5.2 mm apart. Ocean Band: 6.7 mm.
    expect(pitch('watch8')).toBeCloseTo(5.2, 0)
    expect(pitch('ultra4')).toBeCloseTo(6.7, 0)
    const ocean = WATCH_VARIANTS.ultra4.band
    // The Ocean Band's holes sit in its ridges' troughs, one per ridge.
    expect(ocean.ridges!.pitch * WATCH_MM_PER_UNIT).toBeCloseTo(pitch('ultra4'), 0)
  })

  it.each(Object.entries(WATCH_VARIANTS))('%s: the band leaves through the case end, not the face or back', (_, spec) => {
    const { loop } = spec.band
    const half = spec.body.height / 2
    // Walk the loop from where the strap starts until it clears the case end.
    let phi = (loop.startAngle * Math.PI) / 180
    const start = wristLoopAt(loop, phi)
    // The buried end stays inside the case.
    expect(Math.abs(start.y)).toBeLessThan(half)
    expect(start.z).toBeLessThan(spec.body.depth / 2)
    let frame = start
    while (frame.y < half) {
      phi += 0.002
      frame = wristLoopAt(loop, phi)
    }
    // It crosses the case end's plane between the back and the face.
    expect(frame.z).toBeGreaterThan(-spec.body.depth / 2)
    expect(frame.z).toBeLessThan(spec.body.depth / 2)
    // And through the band slot where the case has one.
    if (spec.bandSlot) expect(Math.abs(frame.z - spec.bandSlot.z)).toBeLessThan(spec.bandSlot.height / 2)
  })
})
