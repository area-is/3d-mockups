import { describe, expect, it } from 'vitest'
import { MOCKUP_KINDS, mockupInfo, mockupRegions, type MockupKind } from '../metrics'

/**
 * Registry invariants.
 *
 * These are the checks the visual harness structurally cannot make: it renders
 * a mockup and diffs pixels, so a metrics resolver that disagrees with the
 * component it claims to describe produces a perfectly stable — and perfectly
 * wrong — picture. Every failure mode encoded here was a real bug found in the
 * repository audit.
 */

/** Kinds whose props have a required member, so `mockupInfo` needs arguments. */
const REQUIRES_PROPS: Partial<Record<MockupKind, object>> = {
  customPanel: { size: { width: 210, height: 297 } },
  customBox: { size: { width: 200, height: 120, depth: 80 } },
}

const infoFor = (kind: MockupKind) =>
  mockupInfo(kind as 'galaxy', REQUIRES_PROPS[kind] as undefined)

describe('the mockup registry', () => {
  it('lists every kind exactly once', () => {
    expect(new Set(MOCKUP_KINDS).size).toBe(MOCKUP_KINDS.length)
    expect(MOCKUP_KINDS.length).toBeGreaterThan(30)
  })

  it.each(MOCKUP_KINDS)('%s resolves at least one region from its defaults', (kind) => {
    const info = infoFor(kind)
    expect(info.list.length).toBeGreaterThan(0)
    expect(info.primary).toBeDefined()
  })

  it.each(MOCKUP_KINDS)('%s declares metrics for every region it advertises', (kind) => {
    const info = infoFor(kind)
    // A region declared in *_REGIONS but missing from the metrics resolver is
    // silently skipped by describeMockup, so mockupInfo quietly under-reports.
    for (const region of mockupRegions(kind)) {
      expect(Object.keys(info.regions)).toContain(region.name)
    }
  })

  it.each(MOCKUP_KINDS)('%s reports positive, finite geometry everywhere', (kind) => {
    for (const region of infoFor(kind).list) {
      for (const value of [
        region.units.width,
        region.units.height,
        region.mm.width,
        region.mm.height,
        region.px.width,
        region.px.height,
      ]) {
        expect(Number.isFinite(value)).toBe(true)
        expect(value).toBeGreaterThan(0)
      }
    }
  })

  it('names the mockup when a required prop is missing', () => {
    // Used to throw `Cannot read properties of undefined (reading 'width')`
    // from deep inside the scale function, naming neither prop nor mockup.
    expect(() => (mockupInfo as (k: string) => unknown)('customPanel')).toThrow(
      /customPanel/
    )
  })

  it('rejects an unknown kind by name', () => {
    expect(() => (mockupInfo as (k: string) => unknown)('nope')).toThrow(/nope/)
  })
})

describe('props that change what is measured', () => {
  /*
   * The van and bus resolvers keyed off `coverage !== 'panel'`, so an omitted
   * coverage measured the full wrap while the components default to the panel.
   * The contract is that bare `mockupInfo(kind)` equals the component's own
   * defaults, which for these two means the panel.
   */
  it.each([
    ['van', 'curbSide'],
    ['bus', 'curbSide'],
  ] as const)('%s defaults to the panel, not the full wrap', (kind, region) => {
    const byDefault = mockupInfo(kind, {}).regions[region]
    const panel = mockupInfo(kind, { coverage: 'panel' }).regions[region]
    const full = mockupInfo(kind, { coverage: 'full' }).regions[region]
    expect(byDefault).toEqual(panel)
    expect(byDefault).not.toEqual(full)
  })

  it('measures the TV at the size it is given', () => {
    // The resolver read an `inches` prop no component passes, so every size
    // silently measured the 65" default.
    const base = mockupInfo('tv', {}).primary.mm.width
    const big = mockupInfo('tv', { size: 85 }).primary.mm.width
    expect(big).toBeGreaterThan(base * 1.2)
  })

  it('shrinks the poster opening for a mat, whether flag or colour', () => {
    const bare = mockupInfo('posterFrame', {}).primary.mm.width
    expect(mockupInfo('posterFrame', { mat: true }).primary.mm.width).toBeLessThan(bare)
    expect(mockupInfo('posterFrame', { mat: '#1d1f24' }).primary.mm.width).toBeLessThan(bare)
  })

  it('transposes a phone screen between orientations', () => {
    const portrait = mockupInfo('galaxy', { orientation: 'portrait' }).primary.px
    const landscape = mockupInfo('galaxy', { orientation: 'landscape' }).primary.px
    expect(landscape.width).toBe(portrait.height)
    expect(landscape.height).toBe(portrait.width)
  })
})
