import { describe, expect, it } from 'vitest'
import { WATCH_VARIANTS, WATCH_MM_PER_UNIT, type WatchSpec } from '../devices/watch/dimensions'

/**
 * The case back is laid out in the spec - sensor, engraving, band releases,
 * screws, vent - and drawn flat onto the back face. These check the layout
 * holds together: everything sits on the flat of the back (inside the
 * rounded edge the case rolls over), and nothing is drawn over anything else.
 */

const variants = Object.entries(WATCH_VARIANTS) as [string, WatchSpec][]

/** Whether a point lies on the flat back: inside the body outline less its edge roll, with `margin` to spare. */
function onFlat(spec: WatchSpec, x: number, y: number, margin = 0): boolean {
  const { width, height, radius, bevel } = spec.body
  const hw = width / 2 - bevel - margin
  const hh = height / 2 - bevel - margin
  const r = Math.max(0, radius - bevel - margin)
  const dx = Math.max(0, Math.abs(x) - (hw - r))
  const dy = Math.max(0, Math.abs(y) - (hh - r))
  return Math.abs(x) <= hw && Math.abs(y) <= hh && Math.hypot(dx, dy) <= r
}

/** Outer radius of whatever stands on the back round the sensor. */
function sensorReach(spec: WatchSpec): number {
  const { radius, flare } = spec.back
  return radius * (flare ?? 1)
}

describe('watch backs', () => {
  it.each(variants)('%s: the band releases sit on the flat, clear of the sensor and the engraving', (_, spec) => {
    const { release, engraving } = spec.back
    expect(release).toBeDefined()
    const { width, height, y } = release!
    for (const [x, py] of [
      [width / 2, y + height / 2],
      [-width / 2, y + height / 2],
    ]) {
      expect(onFlat(spec, x!, py!)).toBe(true)
    }
    const inner = y - height / 2
    expect(inner).toBeGreaterThan(sensorReach(spec))
    if (engraving) expect(inner).toBeGreaterThan(engraving.radius + engraving.size / 2)
  })

  it.each(variants)('%s: the engraving rings the sensor without running off the flat', (_, spec) => {
    const { engraving, boss } = spec.back
    expect(engraving).toBeDefined()
    const { radius, size, sweep } = engraving!
    expect(radius - size / 2).toBeGreaterThan(sensorReach(spec))
    // Every point of the text circle, at the letters' outer edge.
    for (let a = 0; a < 360; a += 5) {
      const t = (a * Math.PI) / 180
      expect(onFlat(spec, Math.cos(t) * (radius + size / 2), Math.sin(t) * (radius + size / 2))).toBe(true)
    }
    // On a boss, the text stays on it.
    if (boss) expect(radius + size / 2).toBeLessThan(boss.radius)
    expect(sweep).toBeGreaterThan(0)
    expect(sweep).toBeLessThanOrEqual(360)
  })

  it.each(variants.filter(([, spec]) => spec.back.screws))('%s: the screws sit on the flat, clear of everything else', (_, spec) => {
    const { screws, release, engraving, boss } = spec.back
    const { x, y, radius } = screws!
    expect(onFlat(spec, x, y, radius)).toBe(true)
    const reach = Math.hypot(x, y) - radius
    expect(reach).toBeGreaterThan((engraving?.radius ?? 0) + (engraving?.size ?? 0) / 2)
    if (boss) expect(reach).toBeGreaterThan(boss.radius)
    // Beside the release buttons, not on them.
    expect(Math.abs(x) - radius > release!.width / 2 || Math.abs(y) + radius < release!.y - release!.height / 2).toBe(true)
  })

  it.each(variants.filter(([, spec]) => spec.back.vent))('%s: the vent sits in the engraving’s gap', (_, spec) => {
    const { vent, engraving } = spec.back
    const { x, y, radius } = vent!
    expect(Math.hypot(x, y) - radius).toBeGreaterThan(sensorReach(spec))
    // The engraving runs clockwise as seen from the back, where the device's
    // +x is on the left: find the vent's bearing from twelve o'clock there.
    const bearing = (((Math.atan2(-x, y) * 180) / Math.PI) % 360 + 360) % 360
    const { from, sweep } = engraving!
    const start = ((from % 360) + 360) % 360
    const into = (bearing - start + 360) % 360
    const halfWidth = (Math.atan2(radius, Math.hypot(x, y)) * 180) / Math.PI
    expect(into - halfWidth).toBeGreaterThan(sweep)
    expect(into + halfWidth).toBeLessThan(360)
  })

  it('puts Samsung’s sensor in a small window in a metal puck, and Apple’s under all-glass', () => {
    for (const [, spec] of variants) {
      const { window: glass, electrode, radius } = spec.back
      if (spec.style === 'galaxy') {
        expect(glass).toBeDefined()
        expect(electrode.inner).toBeCloseTo(glass!, 6)
        expect(electrode.outer).toBeCloseTo(radius, 6)
      } else {
        expect(glass).toBeUndefined()
        expect(electrode.outer).toBeLessThanOrEqual(radius)
      }
    }
  })

  it('sizes the Apple sensor windows off Apple’s drawings', () => {
    // The Series crystal is ~25.5 mm across; the Ultra's dome ~27 mm where it meets the back.
    expect(2 * WATCH_VARIANTS.series11.back.radius * WATCH_MM_PER_UNIT).toBeCloseTo(25.5, 0)
    expect(2 * sensorReach(WATCH_VARIANTS.ultra4) * WATCH_MM_PER_UNIT).toBeCloseTo(27.2, 0)
  })
})
