import { describe, expect, it } from 'vitest'
import { mockupInfo } from '../metrics'
import { IPHONE_MM_PER_UNIT, IPHONE_VARIANTS } from '../devices/iphone/dimensions'
import { IPHONE_DUO_VARIANTS, FOLD_MM_PER_UNIT } from '../devices/fold/dimensions'
import { LAPTOP_VARIANTS } from '../devices/laptop/dimensions'
import { APPLE_WATCH_VARIANTS, WATCH_MM_PER_UNIT } from '../devices/watch/dimensions'
import {
  APPLE_WATCH_COLORWAYS,
  IPHONE_COLORWAYS,
  IPHONE_DUO_COLORWAYS,
  LAPTOP_COLORWAYS,
} from '../colorways'

/**
 * The September 2026 Apple generation, checked against what Apple published
 * rather than against numbers copied out of the specs: the point grids each
 * device declares, the panel diagonals its modelled rect implies, and the
 * body figures on its tech-specs page.
 */

/** Inches across a modelled rect, from its millimetres. */
const diagonal = (mm: { width: number; height: number }) => Math.hypot(mm.width, mm.height) / 25.4

describe('iPhone Duo', () => {
  it('measures a landscape inner panel open and a portrait cover shut, on Apple point grids', () => {
    const open = mockupInfo('iphoneDuo').primary
    const shut = mockupInfo('iphoneDuo', { openAngle: false }).primary
    // 2670x1878 and 1398x2034 at 3x.
    expect(open.px).toEqual({ width: 890, height: 626 })
    expect(shut.px).toEqual({ width: 466, height: 678 })
    // The one iPhone whose unrotated pose is wider than tall.
    expect(open.px.width).toBeGreaterThan(open.px.height)
    expect(diagonal(open.mm)).toBeCloseTo(7.6, 1)
    expect(diagonal(shut.mm)).toBeCloseTo(5.4, 1)
  })

  it('folds to the published body', () => {
    const { closed, open } = IPHONE_DUO_VARIANTS.duo
    const mm = (units: number) => units * FOLD_MM_PER_UNIT
    expect(mm(closed.body.width)).toBeCloseTo(84.1, 0)
    expect(mm(closed.body.height)).toBeCloseTo(117.8, 0)
    expect(mm(closed.body.depth)).toBeCloseTo(11.3, 0)
    expect(mm(open.body.width)).toBeCloseTo(164.6, 0)
    expect(mm(open.body.depth)).toBeCloseTo(5.2, 0)
  })

  it('is an Apple with an uninterrupted inner display and a bare spine', () => {
    const duo = IPHONE_DUO_VARIANTS.duo
    expect(duo.brand).toBe('apple')
    // The inner camera is under the panel: no hole to draw, none to clear.
    expect(duo.open.punchHole).toBeUndefined()
    expect(duo.closed.punchHole).toBeDefined()
    expect(duo.hinge.emboss).toBeUndefined()
    expect(duo.logo).toBeDefined()
  })

  it('stands the tablet upright in landscape, like the Fold 8', () => {
    const upright = mockupInfo('iphoneDuo', { orientation: 'landscape' }).primary.px
    expect(upright).toEqual({ width: 626, height: 890 })
  })
})

describe('iPhone 18 Pro and Pro Max', () => {
  it.each([
    ['18pro', 'pro'],
    ['18promax', 'promax'],
  ] as const)('%s is the %s chassis with a narrower Dynamic Island', (next, prev) => {
    const a = IPHONE_VARIANTS[next]
    const b = IPHONE_VARIANTS[prev]
    expect(a.body).toEqual(b.body)
    expect(a.display).toEqual(b.display)
    // A quarter narrower (Apple's bezels: 15.57 vs 20.65 mm), the same
    // height and the same seat below the top edge.
    expect(a.island.width / b.island.width).toBeCloseTo(15.57 / 20.65, 2)
    expect(a.island.height).toBe(b.island.height)
    expect(a.island.offsetY).toBe(b.island.offsetY)
    expect(mockupInfo('iphone', { variant: next }).primary.px).toEqual(
      mockupInfo('iphone', { variant: prev }).primary.px
    )
  })

  it.each([
    ['18pro', 'pro'],
    ['18promax', 'promax'],
  ] as const)('%s keeps the %s camera layout with a bigger module, per Apple’s drawings', (next, prev) => {
    const a = IPHONE_VARIANTS[next].rearCamera
    const b = IPHONE_VARIANTS[prev].rearCamera
    const mm = (units: number) => units * IPHONE_MM_PER_UNIT
    // Plateau 2.78 mm off the back (2.55); collars Ø16.58 x 2.11 mm (Ø16.20 x 1.88).
    expect(mm(a.frame.raise!)).toBeCloseTo(2.78, 1)
    expect(mm(b.frame.raise!)).toBeCloseTo(2.55, 1)
    for (const lens of a.lenses) {
      expect(mm(2 * lens.r)).toBeCloseTo(16.58, 1)
      expect(mm(lens.h!)).toBeCloseTo(2.11, 1)
    }
    for (const lens of b.lenses) {
      expect(mm(2 * lens.r)).toBeCloseTo(16.2, 1)
      expect(mm(lens.h!)).toBeCloseTo(1.88, 1)
    }
    // The same rows and column; only the telephoto moves, 0.13 mm outboard.
    a.lenses.forEach((lens, i) => {
      expect(lens.y).toBe(b.lenses[i]!.y)
      expect(mm(b.lenses[i]!.x - lens.x)).toBeCloseTo(i === 2 ? 0.13 : 0, 2)
    })
    expect(a.frame).toEqual({ ...b.frame, raise: a.frame.raise })
    // Flash and LiDAR Ø6.90, the mic Ø1.15, in the same places.
    expect(mm(2 * a.flash.r)).toBeCloseTo(6.9, 1)
    for (const dot of a.dots!) expect(mm(2 * dot.r)).toBeCloseTo(dot.kind === 'sensor' ? 6.9 : 1.15, 1)
    expect(a.dots!.map(({ x, y }) => [x, y])).toEqual(b.dots!.map(({ x, y }) => [x, y]))
    // The main camera, bottom left from the back, has the six-blade iris.
    expect(a.lenses.map((lens) => lens.iris)).toEqual([undefined, 6, undefined])
  })
})

describe('MacBook Neo 13"', () => {
  it('has a notchless 16:10 panel with the camera in the bezel', () => {
    const neo = LAPTOP_VARIANTS.neo13
    expect(neo.notch).toBeUndefined()
    expect(neo.bezelCamera).toBeDefined()
    expect(neo.display.width / neo.display.height).toBeCloseTo(2408 / 1506, 3)
    // 2408x1506 at 2x.
    expect(mockupInfo('laptop', { variant: 'neo13' }).primary.px).toEqual({ width: 1204, height: 753 })
    expect(diagonal(mockupInfo('laptop', { variant: 'neo13' }).primary.mm)).toBeCloseTo(13.0, 1)
  })

  it('keeps the notch on every other MacBook', () => {
    for (const variant of ['air13', 'air15', 'pro14', 'pro16'] as const) {
      expect(LAPTOP_VARIANTS[variant].notch).toBeDefined()
      expect(LAPTOP_VARIANTS[variant].bezelCamera).toBeUndefined()
    }
  })
})

describe('Apple Watch Series 12 and Ultra 4', () => {
  it('carries the Series 12 on the Series 11 case, a millimetre wider', () => {
    const { series11, series12 } = APPLE_WATCH_VARIANTS
    // Apple's Series 12 specs: 46 x 40 x 9.7 mm against the 11's 46 x 39.
    expect(series12.body.width * WATCH_MM_PER_UNIT).toBeCloseTo(40, 0)
    expect(series11.body.width * WATCH_MM_PER_UNIT).toBeCloseTo(39, 0)
    expect(series12.body.height).toBe(series11.body.height)
    expect(series12.body.depth).toBe(series11.body.depth)
    expect(APPLE_WATCH_VARIANTS.series12.display).toEqual(APPLE_WATCH_VARIANTS.series11.display)
    expect(mockupInfo('appleWatch', { variant: 'series12' }).primary.px).toEqual(
      mockupInfo('appleWatch', { variant: 'series11' }).primary.px
    )
  })

  it('gives the Ultra 4 its published 49 x 44 x 12 mm case and 422x514 panel', () => {
    const ultra = APPLE_WATCH_VARIANTS.ultra4
    expect(ultra.style).toBe('apple')
    expect(ultra.body.height * WATCH_MM_PER_UNIT).toBeCloseTo(49, 0)
    // The published 44 mm spans the crown guard and crown; the case itself
    // is 41.4 mm on Apple's bezel drawing.
    const guarded = ultra.body.width + ultra.crownGuard!.proud + (ultra.crown!.proud - ultra.crownGuard!.proud)
    expect(guarded * WATCH_MM_PER_UNIT).toBeCloseTo(44, 0)
    expect(ultra.body.depth * WATCH_MM_PER_UNIT).toBeCloseTo(12, 0)
    expect(mockupInfo('appleWatch', { variant: 'ultra4' }).primary.px).toEqual({ width: 211, height: 257 })
    // 422x514 at Apple's 326 ppi is 32.9 x 40.1 mm; with its 9 mm corners
    // that is the 1245 mm² display area Apple publishes (the Series 11's
    // 416x496 with 8 mm corners gives its 1196 the same way).
    const area = ({ width, height, radius }: { width: number; height: number; radius: number }) =>
      (width * height - (4 - Math.PI) * radius * radius) * WATCH_MM_PER_UNIT ** 2
    expect(area(ultra.display)).toBeCloseTo(1245, -1)
    expect(area(APPLE_WATCH_VARIANTS.series11.display)).toBeCloseTo(1196, -1)
  })

  it('shields the Ultra crown and puts the orange Action button on the left flank', () => {
    const ultra = APPLE_WATCH_VARIANTS.ultra4
    expect(ultra.crownGuard).toBeDefined()
    // The crown and the side button must stand clear of the guard to show.
    expect(ultra.crown!.proud).toBeGreaterThan(ultra.crownGuard!.proud)
    const action = ultra.buttons.find((key) => key.edge === 'left')
    expect(action?.color).toBeDefined()
    // The Series keep every key on the right flank, guard-free.
    expect(APPLE_WATCH_VARIANTS.series11.crownGuard).toBeUndefined()
    expect(APPLE_WATCH_VARIANTS.series11.buttons.every((key) => key.edge !== 'left')).toBe(true)
  })

  it('wears a buckled band on the Ultra and the seamless loop on the Series', () => {
    expect(APPLE_WATCH_VARIANTS.ultra4.band.closure).toBe('buckle')
    expect(APPLE_WATCH_VARIANTS.series12.band.closure).toBe('seamless')
  })
})

describe('retail colorways', () => {
  it('ship with every new variant', () => {
    for (const catalog of [
      IPHONE_COLORWAYS['18pro'],
      IPHONE_COLORWAYS['18promax'],
      IPHONE_DUO_COLORWAYS.duo,
      LAPTOP_COLORWAYS.neo13,
      APPLE_WATCH_COLORWAYS.series12,
      APPLE_WATCH_COLORWAYS.ultra4,
    ]) {
      expect(catalog.length).toBeGreaterThan(1)
      for (const entry of catalog) {
        expect(entry.id).toMatch(/^[a-z0-9]+$/)
        expect(entry.color).toMatch(/^#[0-9a-f]{6}$/)
      }
    }
  })
})
