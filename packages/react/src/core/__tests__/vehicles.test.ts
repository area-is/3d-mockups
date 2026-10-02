import { describe, expect, it } from 'vitest'
import { BUS } from '../objects/bus/dimensions'
import { mockupInfo } from '../metrics'

/**
 * The bus's ad panels against its hardware.
 *
 * The curb side once carried the street side's king-size panel, mirrored:
 * it ran straight across the rear door, and the door glass covered the left
 * third of the ad - "BusMockup" read "Mockup". Nothing caught it, because a
 * picture of a covered ad is a perfectly stable picture.
 */
interface Rect {
  left: number
  right: number
  bottom: number
  top: number
}

const panel = (r: { x: number; y: number; width: number; height: number }): Rect => ({
  left: r.x - r.width / 2,
  right: r.x + r.width / 2,
  bottom: r.y - r.height / 2,
  top: r.y + r.height / 2,
})

const overlaps = (a: Rect, b: Rect) => a.left < b.right && b.left < a.right && a.bottom < b.top && b.bottom < a.top

/** A curb-side door, from its glass's bottom edge to the top of the window band. */
const door = (d: { x: number; width: number; bottomY: number }): Rect => ({
  left: d.x - d.width / 2,
  right: d.x + d.width / 2,
  bottom: d.bottomY,
  top: BUS.windowBand.y + BUS.windowBand.height / 2,
})

/** A wheel arch's opening, up to the crown of its semicircle. */
const arch = (x: number): Rect => ({
  left: x - BUS.wheels.archRadius,
  right: x + BUS.wheels.archRadius,
  bottom: BUS.groundY,
  top: BUS.wheels.archY + BUS.wheels.archRadius,
})

describe('the bus ad panels', () => {
  const curb = panel(BUS.curbAd)
  const street = panel(BUS.ad)

  it.each(BUS.doors.map((d, i) => [i, d] as const))('the curb-side panel clears door %i', (_i, d) => {
    expect(overlaps(curb, door(d))).toBe(false)
  })

  it.each([
    ['front', BUS.wheels.frontX],
    ['rear', BUS.wheels.rearX],
  ])('both panels clear the %s wheel arch', (_name, x) => {
    expect(overlaps(curb, arch(x))).toBe(false)
    expect(overlaps(street, arch(x))).toBe(false)
  })

  it('stays under the window band on both sides', () => {
    const sill = BUS.windowBand.y - BUS.windowBand.height / 2
    expect(curb.top).toBeLessThanOrEqual(sill)
    expect(street.top).toBeLessThanOrEqual(sill)
  })

  it('measures the curb-side queen at the street-side king’s print density', () => {
    const { curbSide, streetSide } = mockupInfo('bus').regions
    // 30" x 88" and 30" x 144".
    expect(curbSide.mm.width).toBeCloseTo(2235, -1)
    expect(streetSide.mm.width).toBeCloseTo(3658, -1)
    expect(curbSide.pxPerUnit).toBeCloseTo(streetSide.pxPerUnit, 0)
  })
})
