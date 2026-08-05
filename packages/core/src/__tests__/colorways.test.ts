import { Color } from 'three'
import { describe, expect, it } from 'vitest'
import { railColor, findColorway, GALAXY_COLORWAYS } from '../colorways'

/** Largest per-channel distance between two hex colours, in 0-255 units. */
function channelDistance(a: string, b: string): number {
  const [ca, cb] = [new Color(a), new Color(b)]
  return Math.max(
    Math.abs(ca.r - cb.r),
    Math.abs(ca.g - cb.g),
    Math.abs(ca.b - cb.b)
  ) * 255
}

describe('railColor', () => {
  /*
   * Golden values. `railColor` reads and writes HSL, and three's accessors
   * default to the LINEAR working space with colour management on - while the
   * constants behind this function were fitted against sRGB values measured
   * off retail hardware. Left on the default, a Navy back returned #66718e
   * instead of #414a60: a mid-grey rail on a near-black phone.
   *
   * These assertions are deliberately absolute rather than relative. A
   * relative check ("lighter than the body") passes just as happily in the
   * wrong colour space.
   */
  it.each([
    ['#2a3245', '#414a60'],
    ['#101216', '#323740'],
  ])('derives %s -> %s', (body, expected) => {
    expect(railColor(body)).toBe(expected)
  })

  it('lands near the retail rail it was fitted against', () => {
    // Retail Navy ships a #3d4557 rail; the fit is documented as within
    // 9/255 per channel for the colours it covers.
    expect(channelDistance(railColor('#2a3245'), '#3d4557')).toBeLessThan(9)
  })

  it('lightens a dark body and darkens a light one', () => {
    const lightness = (hex: string) => new Color(hex).getHSL({ h: 0, s: 0, l: 0 }).l
    expect(lightness(railColor('#101216'))).toBeGreaterThan(lightness('#101216'))
    expect(lightness(railColor('#eceae5'))).toBeLessThan(lightness('#eceae5'))
  })

  it('accepts any CSS colour three can parse', () => {
    expect(railColor('rebeccapurple')).toMatch(/^#[0-9a-f]{6}$/)
  })
})

describe('findColorway', () => {
  const s26 = GALAXY_COLORWAYS.s26

  it('resolves a catalog id', () => {
    expect(findColorway(s26, s26[0]!.id)?.id).toBe(s26[0]!.id)
  })

  it('returns undefined for a raw CSS colour, so it passes through', () => {
    expect(findColorway(s26, '#ff0000')).toBeUndefined()
  })

  it('returns undefined when nothing was asked for', () => {
    expect(findColorway(s26, undefined)).toBeUndefined()
  })
})
