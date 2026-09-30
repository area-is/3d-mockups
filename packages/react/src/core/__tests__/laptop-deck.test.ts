import { describe, expect, it } from 'vitest'
import { LAPTOP_MM_PER_UNIT, LAPTOP_VARIANTS } from '../devices/laptop/dimensions'

/**
 * The deck layout, against Apple's top-down renders of each model (scaled by
 * the chassis's official width): the same ~279.5 x 115 mm keyboard well on
 * every one, its distance from the back edge, the trackpad just below it,
 * and the Pro's grilles centred on it.
 */

const mm = (units: number) => units * LAPTOP_MM_PER_UNIT

// Well top to the back edge, per Apple's renders.
const WELL_FROM_BACK = { air13: 9.6, air15: 19.1, pro14: 14.2, pro16: 22.6, neo13: 12.0 } as const

describe('laptop decks', () => {
  it.each(Object.entries(WELL_FROM_BACK))('%s: the well sits where Apple’s render puts it', (variant, fromBack) => {
    const { footprint, keyboard, trackpad } = LAPTOP_VARIANTS[variant as keyof typeof WELL_FROM_BACK]
    expect(Math.abs(mm(keyboard.width) - 279.5)).toBeLessThan(1)
    expect(Math.abs(mm(keyboard.depth) - 115)).toBeLessThan(1)
    const wellTop = keyboard.offsetZ - keyboard.depth / 2
    expect(mm(wellTop + footprint.depth / 2)).toBeCloseTo(fromBack, 0)
    // The trackpad starts 2-3.5 mm below the well.
    const gap = trackpad.offsetZ - trackpad.depth / 2 - (keyboard.offsetZ + keyboard.depth / 2)
    expect(mm(gap)).toBeGreaterThan(1.3)
    expect(mm(gap)).toBeLessThan(3.5)
  })

  it.each(['pro14', 'pro16'] as const)('%s: the grilles run the well’s height, beside it', (variant) => {
    const { footprint, keyboard, speakers } = LAPTOP_VARIANTS[variant]
    expect(speakers).toBeDefined()
    expect(speakers!.offsetZ).toBeCloseTo(keyboard.offsetZ, 6)
    expect(mm(keyboard.depth - speakers!.depth) / 2).toBeCloseTo(4.7, 0)
    // 1.8 mm in from the side edge, clear of the well.
    expect(mm(footprint.width / 2 - speakers!.x - speakers!.width / 2)).toBeCloseTo(1.8, 0)
    expect(speakers!.x - speakers!.width / 2).toBeGreaterThan(keyboard.width / 2)
    // A square grid, 0.94 mm each way.
    expect(mm(speakers!.holePitchX)).toBeCloseTo(0.935, 1)
    expect(speakers!.holePitchZ).toBe(speakers!.holePitchX)
  })
})
