/**
 * A stroke font for embossed card lettering - pure data plus its layout math.
 *
 * Embossing is not type set in a font file: a card embosser drives a punch
 * and die per character, and what stands up on the card is a raised STROKE
 * of near-constant width. So the honest description of an embossed glyph is
 * its centrelines, and that is what this is: every glyph a handful of
 * polylines on a 4 x 6 grid (x right, y up from the baseline), which the
 * scene component sweeps into raised strokes. No font file, no network, and
 * the same data works for the raised front, the debossed reverse and the
 * flat print - the "VALID THRU" label, or a number printed rather than
 * embossed.
 *
 * The digits follow Farrington 7B, the OCR face card numbers are embossed in:
 * square, seven-segment-like forms with a few tells (the 4's open top and
 * short right stem, the 8's narrow upper bowl, the flagged and footed 1). The
 * letters are the plain gothic the name line is embossed in. Lower case is
 * set as capitals, the way an embosser would.
 */

/** The glyph grid: every point of every stroke lies within this cell. */
export const STROKE_FONT_GRID = { width: 4, height: 6 } as const

/**
 * One glyph: its strokes, each a polyline written as a flat run of x, y
 * pairs on `STROKE_FONT_GRID`. A single pair is a dot. A space is no strokes.
 */
export type StrokeGlyph = readonly (readonly number[])[]

const O = [0.8, 0, 3.2, 0, 4, 0.8, 4, 5.2, 3.2, 6, 0.8, 6, 0, 5.2, 0, 0.8, 0.8, 0]

/** Every character the font can emboss: 0-9, A-Z, space, `/`, `-` and `.`. */
export const STROKE_FONT: Readonly<Record<string, StrokeGlyph>> = {
  ' ': [],
  '0': [[0.5, 0, 3.5, 0, 4, 0.5, 4, 5.5, 3.5, 6, 0.5, 6, 0, 5.5, 0, 0.5, 0.5, 0]],
  '1': [[0.9, 4.9, 2.2, 6, 2.2, 0], [0.8, 0, 3.6, 0]],
  '2': [[0, 6, 4, 6, 4, 3.4, 0, 2.2, 0, 0, 4, 0]],
  '3': [[0, 6, 4, 6, 4, 0, 0, 0], [1.2, 3.2, 4, 3.2]],
  '4': [[0, 6, 0, 2.2, 4, 2.2], [3, 4.4, 3, 0]],
  '5': [[4, 6, 0, 6, 0, 3.4, 4, 3.4, 4, 0, 0, 0]],
  '6': [[3.6, 6, 0, 6, 0, 0, 4, 0, 4, 3.4, 0, 3.4]],
  '7': [[0, 6, 4, 6, 4, 4.6, 1.4, 0]],
  '8': [[0, 0, 4, 0, 4, 3.2, 0, 3.2, 0, 0], [0.5, 3.2, 0.5, 6, 3.5, 6, 3.5, 3.2]],
  '9': [[4, 3, 0, 3, 0, 6, 4, 6, 4, 0, 0.4, 0]],
  A: [[0, 0, 0, 4, 2, 6, 4, 4, 4, 0], [0, 2.6, 4, 2.6]],
  B: [[0, 0, 0, 6, 3, 6, 4, 5, 4, 4, 3, 3.1, 0, 3.1], [3, 3.1, 4, 2.1, 4, 1, 3, 0, 0, 0]],
  C: [[4, 5.2, 3.2, 6, 0.8, 6, 0, 5.2, 0, 0.8, 0.8, 0, 3.2, 0, 4, 0.8]],
  D: [[0, 0, 0, 6, 2.6, 6, 4, 4.6, 4, 1.4, 2.6, 0, 0, 0]],
  E: [[4, 6, 0, 6, 0, 0, 4, 0], [0, 3.1, 3, 3.1]],
  F: [[4, 6, 0, 6, 0, 0], [0, 3.1, 3, 3.1]],
  G: [[4, 5.2, 3.2, 6, 0.8, 6, 0, 5.2, 0, 0.8, 0.8, 0, 3.2, 0, 4, 0.8, 4, 2.8, 2.2, 2.8]],
  H: [[0, 0, 0, 6], [4, 0, 4, 6], [0, 3.1, 4, 3.1]],
  I: [[1, 6, 3, 6], [2, 6, 2, 0], [1, 0, 3, 0]],
  J: [[4, 6, 4, 0.8, 3.2, 0, 0.8, 0, 0, 0.8, 0, 1.8]],
  K: [[0, 0, 0, 6], [4, 6, 0, 2], [1.5, 3.5, 4, 0]],
  L: [[0, 6, 0, 0, 4, 0]],
  M: [[0, 0, 0, 6, 2, 3, 4, 6, 4, 0]],
  N: [[0, 0, 0, 6, 4, 0, 4, 6]],
  O: [O],
  P: [[0, 0, 0, 6, 3, 6, 4, 5, 4, 3.6, 3, 2.6, 0, 2.6]],
  Q: [O, [2.4, 1.6, 4, 0]],
  R: [[0, 0, 0, 6, 3, 6, 4, 5, 4, 3.6, 3, 2.6, 0, 2.6], [2, 2.6, 4, 0]],
  S: [[4, 5.2, 3.2, 6, 0.8, 6, 0, 5.2, 0, 3.9, 0.8, 3.1, 3.2, 3.1, 4, 2.3, 4, 0.8, 3.2, 0, 0.8, 0, 0, 0.8]],
  T: [[0, 6, 4, 6], [2, 6, 2, 0]],
  U: [[0, 6, 0, 0.8, 0.8, 0, 3.2, 0, 4, 0.8, 4, 6]],
  V: [[0, 6, 2, 0, 4, 6]],
  W: [[0, 6, 0.9, 0, 2, 4, 3.1, 0, 4, 6]],
  X: [[0, 0, 4, 6], [0, 6, 4, 0]],
  Y: [[0, 6, 2, 3, 4, 6], [2, 3, 2, 0]],
  Z: [[0, 6, 4, 6, 0, 0, 4, 0]],
  '/': [[0.6, 0, 3.4, 6]],
  '-': [[0.8, 3, 3.2, 3]],
  '.': [[2, 0]],
}

/** What `normalizeStrokeText` kept, and what it had to drop. */
export interface NormalizedStrokeText {
  /** The text as the font will set it: capitals, unsupported characters gone. */
  text: string
  /** Each character the font has no glyph for, once, in order of appearance. */
  dropped: string[]
}

const hasGlyph = (char: string) => Object.prototype.hasOwnProperty.call(STROKE_FONT, char)

/**
 * Fold a string onto the font: lower case becomes capitals (an embosser has no
 * lower case), accented letters lose their accents the way a card bureau
 * transliterates a name (José → JOSE), and any character still without a
 * glyph is dropped rather than guessed at. The caller decides whether a drop
 * is worth a warning.
 */
export function normalizeStrokeText(text: string): NormalizedStrokeText {
  let out = ''
  const dropped: string[] = []
  for (const raw of text) {
    // NFD splits a letter from its combining marks; `toUpperCase` can widen a
    // character (ß → SS), so every resulting character has to be settable.
    const folded = raw.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    if (folded.length > 0 && [...folded].every(hasGlyph)) out += folded
    else if (!dropped.includes(raw)) dropped.push(raw)
  }
  return { text: out, dropped }
}

/**
 * Where one line of stroke text sits and how big it is set, in whatever unit
 * the caller works in (the card spec uses world units, card-centred).
 */
export interface StrokeTextLine {
  /** Left edge of the first character's ink. */
  x: number
  /** Baseline: the bottom of the ink. */
  baseline: number
  /** Ink height of a character, stroke included. */
  height: number
  /** Ink width of a character, stroke included. */
  width: number
  /** Advance from one character to the next. */
  pitch: number
  /** Stroke width - how wide each centreline is swept, foot to foot. */
  stroke: number
  /**
   * The longest the line's ink may run. A longer text condenses (pitch and
   * width together) to fit, the way an embosser bureau squeezes a long name
   * rather than running it off the card.
   */
  maxWidth: number
}

/** A laid-out line: every stroke as a polyline of points on the face. */
export interface StrokeTextLayout {
  /** The strokes, each a polyline of `[x, y]` centreline points; a dot is one point. */
  strokes: [number, number][][]
  /** Ink bounds of the whole line (strokes plus half the stroke width), or `null` for no ink. */
  bounds: { minX: number; minY: number; maxX: number; maxY: number } | null
  /** Advance actually used, after any condensing. */
  pitch: number
  /** Character ink width actually used, after any condensing. */
  width: number
}

/**
 * Lay a line of text out on a `StrokeTextLine`. The text is normalized first
 * (see `normalizeStrokeText`), so this never throws on input it cannot set.
 *
 * The grid maps onto the character's ink box inset by half a stroke on every
 * side, so the swept stroke - not just its centreline - lands inside the box
 * the line describes.
 */
export function layoutStrokeText(text: string, line: StrokeTextLine): StrokeTextLayout {
  const chars = [...normalizeStrokeText(text).text]
  const natural = chars.length > 0 ? (chars.length - 1) * line.pitch + line.width : 0
  // Never condense the ink box below the stroke itself, or the centrelines
  // would cross over.
  const fit = natural > line.maxWidth && natural > 0 ? Math.max(line.maxWidth / natural, line.stroke / line.width) : 1
  const pitch = line.pitch * fit
  const width = line.width * fit
  const half = line.stroke / 2
  const sx = Math.max(0, width - line.stroke) / STROKE_FONT_GRID.width
  const sy = Math.max(0, line.height - line.stroke) / STROKE_FONT_GRID.height

  const strokes: [number, number][][] = []
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  chars.forEach((char, i) => {
    const left = line.x + i * pitch + half
    const bottom = line.baseline + half
    for (const run of STROKE_FONT[char] ?? []) {
      const points: [number, number][] = []
      for (let k = 0; k + 1 < run.length; k += 2) {
        const x = left + run[k]! * sx
        const y = bottom + run[k + 1]! * sy
        points.push([x, y])
        minX = Math.min(minX, x - half)
        maxX = Math.max(maxX, x + half)
        minY = Math.min(minY, y - half)
        maxY = Math.max(maxY, y + half)
      }
      if (points.length > 0) strokes.push(points)
    }
  })
  return {
    strokes,
    bounds: strokes.length > 0 ? { minX, minY, maxX, maxY } : null,
    pitch,
    width,
  }
}
