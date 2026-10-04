import { describe, expect, it } from 'vitest'
import {
  CREDIT_CARD,
  CREDIT_CARD_CHIP,
  CREDIT_CARD_DEFAULT_TEXT,
  CREDIT_CARD_MM_PER_UNIT,
  CREDIT_CARD_TIPPING,
  creditCardTippingColor,
} from '../objects/credit-card/dimensions'
import {
  STROKE_FONT,
  STROKE_FONT_GRID,
  layoutStrokeText,
  normalizeStrokeText,
  type StrokeTextLine,
} from '../objects/credit-card/stroke-font'
import { mockupInfo } from '../metrics'

const MM = CREDIT_CARD_MM_PER_UNIT
const { body, chip, emboss, expiryLabel, stripe, signature } = CREDIT_CARD
/** Millimetres in from the left edge, down from the top edge, up from the bottom edge. */
const fromLeft = (x: number) => x * MM + 42.8
const fromTop = (y: number) => 26.99 - y * MM
const fromBottom = (y: number) => y * MM + 26.99

/**
 * The card is built to the standards a real one is cut and embossed to, so
 * these check the spec against the published numbers rather than against
 * itself: a drifted constant is a card that no longer matches the art made
 * for the real thing.
 */
describe('the ID-1 blank (ISO/IEC 7810)', () => {
  it('is 85.60 x 53.98 x 0.76 mm with 3.18 mm corners', () => {
    expect(body.width * MM).toBeCloseTo(85.6, 6)
    expect(body.height * MM).toBeCloseTo(53.98, 6)
    expect(body.thickness * MM).toBeCloseTo(0.76, 6)
    expect(body.radius * MM).toBeCloseTo(3.18, 6)
  })

  it('prints full bleed on both faces', () => {
    expect(CREDIT_CARD.face.width).toBe(body.width)
    expect(CREDIT_CARD.face.height).toBe(body.height)
    expect(CREDIT_CARD.face.radius).toBe(body.radius)
  })
})

describe('the hardware over the print', () => {
  it('puts the contact plate over the ISO/IEC 7816-2 contact field', () => {
    // C1-C3 and C5-C7: 10.25-19.87 mm in from the left, 19.23-26.01 mm down.
    expect(fromLeft(chip.x - chip.width / 2)).toBeLessThanOrEqual(10.25)
    expect(fromLeft(chip.x + chip.width / 2)).toBeGreaterThanOrEqual(19.87)
    expect(fromTop(chip.y + chip.height / 2)).toBeLessThanOrEqual(19.23)
    expect(fromTop(chip.y - chip.height / 2)).toBeGreaterThanOrEqual(26.01)
    // The module measured off a photographed card: 13 x 11.4 mm, centred
    // 14.77 mm in and 22.61 mm down.
    expect(chip.width * MM).toBeCloseTo(13, 6)
    expect(chip.height * MM).toBeCloseTo(11.4, 6)
    expect(fromLeft(chip.x)).toBeCloseTo(14.77, 6)
    expect(fromTop(chip.y)).toBeCloseTo(22.61, 6)
  })

  it('etches the contacts within the plate', () => {
    for (const groove of chip.grooves) {
      for (const [x, y] of groove) {
        expect(Math.abs(x)).toBeLessThanOrEqual(0.5)
        expect(Math.abs(y)).toBeLessThanOrEqual(0.5)
      }
    }
    // three contacts down each side: two grooves across each column
    const across = chip.grooves.filter((g) => g.length === 2 && g[0]![1] === g[1]![1] && Math.abs(g[0]![1]) < 0.39)
    expect(across).toHaveLength(4)
  })

  it('runs the magnetic stripe 12.7 mm tall from 5.54 mm below the top edge', () => {
    expect(stripe.height * MM).toBeCloseTo(12.7, 6)
    expect(fromTop(stripe.y + stripe.height / 2)).toBeCloseTo(5.54, 6)
  })

  it('keeps the signature panel between the stripe and the number', () => {
    const panelTop = signature.y + signature.height / 2
    const panelBottom = signature.y - signature.height / 2
    expect(panelTop).toBeLessThan(stripe.y - stripe.height / 2)
    // The number's impressions come through on the back at the same height.
    const number = layoutStrokeText(CREDIT_CARD_DEFAULT_TEXT.number, emboss.number).bounds!
    expect(panelBottom).toBeGreaterThan(number.maxY)
    // ...and the panel stays on the card.
    expect(Math.abs(signature.x) + signature.width / 2).toBeLessThan(body.width / 2)
  })
})

describe('the embossed lines (ISO/IEC 7811-1)', () => {
  it('centres the number 21.42 mm above the bottom edge, 4.32 mm tall, no higher than 0.46 mm', () => {
    // 21.42 mm is line 1's centreline: as a baseline, the number's top would
    // stand above the 24.03 mm the standard allows it.
    const { number } = emboss
    expect(fromBottom(number.baseline + number.height / 2)).toBeCloseTo(21.42, 6)
    expect(fromBottom(number.baseline + number.height)).toBeLessThanOrEqual(24.03)
    expect(number.height * MM).toBeCloseTo(4.32, 6)
    for (const line of Object.values(emboss)) expect(line.relief * MM).toBeLessThanOrEqual(0.46 + 1e-9)
  })

  it('keeps the expiry and the name in the name-and-address area, 2.41-14.53 mm above the bottom edge', () => {
    for (const line of [emboss.expiry, emboss.name]) {
      expect(fromBottom(line.baseline)).toBeGreaterThanOrEqual(2.41)
      expect(fromBottom(line.baseline + line.height)).toBeLessThanOrEqual(14.53)
    }
  })

  it('stamps foil on a flat crest narrower than the stroke, and prints flat in a hairline', () => {
    expect(CREDIT_CARD.crest).toBeGreaterThan(0)
    expect(CREDIT_CARD.crest).toBeLessThan(1)
    expect(CREDIT_CARD.printedStroke).toBeGreaterThan(0)
    expect(CREDIT_CARD.printedStroke).toBeLessThan(1)
  })

  it('sits the number just below the middle of the card', () => {
    const { bounds } = layoutStrokeText(CREDIT_CARD_DEFAULT_TEXT.number, emboss.number)
    expect(bounds!.minY).toBeLessThan(0)
    expect(bounds!.maxY).toBeLessThan(0)
    expect(bounds!.maxY).toBeGreaterThan(-body.height / 4)
  })

  it('stacks number, expiry and name without touching, under the chip', () => {
    const number = layoutStrokeText(CREDIT_CARD_DEFAULT_TEXT.number, emboss.number).bounds!
    const expiry = layoutStrokeText(CREDIT_CARD_DEFAULT_TEXT.expiry, emboss.expiry).bounds!
    const name = layoutStrokeText(CREDIT_CARD_DEFAULT_TEXT.name, emboss.name).bounds!
    expect(number.maxY).toBeLessThan(chip.y - chip.height / 2)
    expect(expiry.maxY).toBeLessThan(number.minY)
    expect(name.maxY).toBeLessThan(expiry.minY)
  })

  it('fits a full 19-character number at its natural pitch', () => {
    const layout = layoutStrokeText('4000 1234 5678 9010', emboss.number)
    expect(layout.pitch).toBeCloseTo(emboss.number.pitch, 9)
    expect(layout.bounds!.maxX).toBeLessThan(body.width / 2)
  })

  it('keeps every default line, and the VALID THRU legend, on the face', () => {
    const lines: [string, StrokeTextLine][] = [
      [CREDIT_CARD_DEFAULT_TEXT.number, emboss.number],
      [CREDIT_CARD_DEFAULT_TEXT.expiry, emboss.expiry],
      [CREDIT_CARD_DEFAULT_TEXT.name, emboss.name],
      ...expiryLabel.map((line): [string, StrokeTextLine] => [line.text, line]),
    ]
    for (const [text, line] of lines) {
      const bounds = layoutStrokeText(text, line).bounds!
      expect(bounds.minX).toBeGreaterThan(-body.width / 2 + body.radius)
      expect(bounds.maxX).toBeLessThan(body.width / 2 - body.radius)
      expect(bounds.minY).toBeGreaterThan(-body.height / 2)
      expect(bounds.maxY).toBeLessThan(body.height / 2)
    }
  })

  it('prints the legend clear of the expiry it labels', () => {
    const expiry = layoutStrokeText(CREDIT_CARD_DEFAULT_TEXT.expiry, emboss.expiry).bounds!
    for (const line of expiryLabel) {
      expect(layoutStrokeText(line.text, line).bounds!.maxX).toBeLessThan(expiry.minX)
    }
  })
})

describe('the stroke font', () => {
  const DOCUMENTED = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ /-.'

  it.each([...DOCUMENTED])('has a glyph for %j', (char) => {
    const glyph = STROKE_FONT[char]
    expect(glyph).toBeDefined()
    if (char !== ' ') expect(glyph!.length).toBeGreaterThan(0)
  })

  it('has nothing it does not document', () => {
    expect(Object.keys(STROKE_FONT).sort()).toEqual([...DOCUMENTED].sort())
  })

  it.each(Object.keys(STROKE_FONT))('keeps every stroke of %j inside its cell', (char) => {
    for (const run of STROKE_FONT[char]!) {
      // a polyline is x, y pairs; a single pair is a dot
      expect(run.length % 2).toBe(0)
      expect(run.length).toBeGreaterThanOrEqual(2)
      for (let i = 0; i < run.length; i += 2) {
        expect(run[i]).toBeGreaterThanOrEqual(0)
        expect(run[i]).toBeLessThanOrEqual(STROKE_FONT_GRID.width)
        expect(run[i + 1]).toBeGreaterThanOrEqual(0)
        expect(run[i + 1]).toBeLessThanOrEqual(STROKE_FONT_GRID.height)
      }
    }
  })

  it('sets lower case as capitals and drops what it cannot emboss, naming each once', () => {
    expect(normalizeStrokeText('Alex Morgan')).toEqual({ text: 'ALEX MORGAN', dropped: [] })
    expect(normalizeStrokeText("4000 #1 #2 €3 O'Neil")).toEqual({ text: '4000 1 2 3 ONEIL', dropped: ['#', '€', "'"] })
  })

  it('transliterates accented letters rather than dropping them, as a card bureau does', () => {
    expect(normalizeStrokeText('José Núñez Weiß')).toEqual({ text: 'JOSE NUNEZ WEISS', dropped: [] })
  })

  it('lays every character inside its own ink box, bead included', () => {
    const line = emboss.number
    const text = '0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ/-.'
    for (const [i, char] of [...text].entries()) {
      const { strokes } = layoutStrokeText(char, { ...line, x: line.x + i * line.pitch })
      const left = line.x + i * line.pitch
      for (const run of strokes) {
        for (const [x, y] of run) {
          expect(x - line.stroke / 2).toBeGreaterThanOrEqual(left - 1e-9)
          expect(x + line.stroke / 2).toBeLessThanOrEqual(left + line.width + 1e-9)
          expect(y - line.stroke / 2).toBeGreaterThanOrEqual(line.baseline - 1e-9)
          expect(y + line.stroke / 2).toBeLessThanOrEqual(line.baseline + line.height + 1e-9)
        }
      }
    }
  })

  it('condenses a line too long for the card rather than running it off', () => {
    const long = 'MAXIMILIAN ALEXANDER WORTHINGTON-SMYTHE'
    const layout = layoutStrokeText(long, emboss.name)
    expect(layout.pitch).toBeLessThan(emboss.name.pitch)
    expect(layout.bounds!.maxX - layout.bounds!.minX).toBeLessThanOrEqual(emboss.name.maxWidth + 1e-9)
  })

  it('lays out nothing for an empty or unembossable line', () => {
    expect(layoutStrokeText('', emboss.name)).toMatchObject({ strokes: [], bounds: null })
    expect(layoutStrokeText('###', emboss.name)).toMatchObject({ strokes: [], bounds: null })
  })
})

describe('tipping', () => {
  it('defaults to silver foil, and takes a preset, any CSS colour, or none', () => {
    expect(creditCardTippingColor(undefined)).toBe(CREDIT_CARD_TIPPING.silver)
    expect(creditCardTippingColor('gold')).toBe(CREDIT_CARD_TIPPING.gold)
    expect(creditCardTippingColor('#b87333')).toBe('#b87333')
    expect(creditCardTippingColor('none')).toBeNull()
  })
})

describe('chip plating', () => {
  it('comes in gold and silver, each with a darker substrate in its grooves', () => {
    for (const { plate, groove } of Object.values(CREDIT_CARD_CHIP)) {
      const luminance = (hex: string) => {
        const n = parseInt(hex.slice(1), 16)
        return 0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)
      }
      expect(luminance(groove)).toBeLessThan(luminance(plate) / 2)
    }
    expect(Object.keys(CREDIT_CARD_CHIP)).toEqual(['gold', 'silver'])
  })
})

describe("mockupInfo('creditCard')", () => {
  it('measures both full-bleed faces at the card size, front first', () => {
    const info = mockupInfo('creditCard')
    expect(info.primary.name).toBe('front')
    expect(info.list.map((r) => r.name)).toEqual(['front', 'back'])
    for (const region of info.list) {
      expect(region.mm.width).toBeCloseTo(85.6, 1)
      expect(region.mm.height).toBeCloseTo(53.98, 1)
      expect(region.px).toEqual({ width: 520, height: 328 })
    }
  })
})
