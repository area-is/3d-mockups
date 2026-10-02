/**
 * Credit card object dimensions - an ISO/IEC 7810 ID-1 payment card.
 *
 * The card is the ID-1 blank every bank card is cut to: 85.60 x 53.98 mm on
 * 0.76 mm PVC with 3.18 mm corners, the same blank as the ID badge but held
 * landscape. Normalized to 26 mm per world unit - the business card's scale,
 * so the two read at the same size on the default stage.
 *
 * Everything on it is placed the way the standards place it, measured from
 * the card's edges and converted here, so the scene component only ever reads
 * world units:
 *
 * - the EMV contact plate over the ISO/IEC 7816-2 contact field (its first
 *   contact 10.25 mm in from the left edge and 19.23 mm down from the top);
 * - the embossed lines of ISO/IEC 7811-1 - the number in Farrington 7B with
 *   its baseline 21.42 mm above the bottom edge, the expiry and the name below
 *   it in the smaller gothic, raised up to 0.46 mm;
 * - the magnetic stripe of ISO/IEC 7811-2 on the back, 12.7 mm tall from
 *   5.54 mm below the top edge, and a signature panel under it.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import type { MockupFraming, MockupMetrics, RegionSpec } from '../../regions'
import type { StrokeTextLine } from './stroke-font'

/** Millimetres per world unit - the credit-card scale. */
export const CREDIT_CARD_MM_PER_UNIT = 26

const mm = (v: number) => v / CREDIT_CARD_MM_PER_UNIT
const CARD_WIDTH_MM = 85.6
const CARD_HEIGHT_MM = 53.98
/** A point `v` mm in from the left edge, in world units from the card's centre. */
const fromLeft = (v: number) => mm(v - CARD_WIDTH_MM / 2)
/** A point `v` mm up from the bottom edge, in world units from the card's centre. */
const fromBottom = (v: number) => mm(v - CARD_HEIGHT_MM / 2)
/** A point `v` mm down from the top edge, in world units from the card's centre. */
const fromTop = (v: number) => mm(CARD_HEIGHT_MM / 2 - v)

/** One embossed line: where the text sits, how it is set, and how high it stands. */
export interface CreditCardEmbossLine extends StrokeTextLine {
  /** How far the crests stand proud of the face (ISO/IEC 7811-1: at most 0.46 mm). */
  relief: number
}

/** One flat-printed line of small type: its text and where it is set. */
export interface CreditCardPrintLine extends StrokeTextLine {
  text: string
}

const NUMBER_X_MM = 10.18
const EXPIRY_X_MM = 40
const NAME_X_MM = 7.65
/** Clear margin the embossing keeps from the right edge when a long line condenses. */
const RIGHT_MARGIN_MM = 5.5

export const CREDIT_CARD = {
  /** ID-1 blank, landscape. `radius` is the ISO 3.18 mm corner. */
  body: {
    width: mm(CARD_WIDTH_MM),
    height: mm(CARD_HEIGHT_MM),
    thickness: mm(0.76),
    radius: mm(3.18),
    bevel: 0.004,
  },
  /** Printable faces: the whole card, edge to edge, on both sides. */
  face: { width: mm(CARD_WIDTH_MM), height: mm(CARD_HEIGHT_MM), radius: mm(3.18) },
  /**
   * How far each live face sits off the PVC, and so where the card's visible
   * surface is: the hardware below (chip, embossing, stripe, panel) is placed
   * relative to it, not to the body, so it always lands on top of the print.
   */
  faceOffset: 0.003,
  /**
   * The EMV contact plate: about 11 x 8.5 mm, centred on the six-contact field
   * of ISO/IEC 7816-2 (C1-C3 and C5-C7; C4 and C8 are unused on payment cards,
   * which is why the plate is shorter than the full eight-contact field). The
   * pads are three per side with a full-height centre pad between them, split
   * by thin grooves that show the darker substrate.
   */
  chip: {
    x: fromLeft(15.06),
    y: fromTop(22.62),
    width: mm(11),
    height: mm(8.5),
    radius: mm(1.25),
    /** Width of the grooves between the pads. */
    groove: mm(0.3),
    /** Width of the centre pad. */
    centerWidth: mm(3),
    /** Pads per side column. */
    rows: 3,
    /** Rise of the plate over the face; the pads stand a hair above it. */
    lift: 0.0008,
  },
  /** The embossed lines, front side. The back carries their mirrored impressions. */
  emboss: {
    /** The card number: Farrington 7B at 7 characters per inch, 4.32 mm tall. */
    number: {
      x: fromLeft(NUMBER_X_MM),
      baseline: fromBottom(21.42),
      height: mm(4.32),
      width: mm(2.7),
      pitch: mm(3.63),
      stroke: mm(0.72),
      maxWidth: mm(CARD_WIDTH_MM - NUMBER_X_MM - RIGHT_MARGIN_MM),
      relief: mm(0.46),
    },
    /** The expiry: the small gothic at 10 characters per inch, mid-card. */
    expiry: {
      x: fromLeft(EXPIRY_X_MM),
      baseline: fromBottom(10.6),
      height: mm(2.92),
      width: mm(2),
      pitch: mm(2.54),
      stroke: mm(0.5),
      maxWidth: mm(CARD_WIDTH_MM - EXPIRY_X_MM - RIGHT_MARGIN_MM),
      relief: mm(0.4),
    },
    /** The cardholder's name, at the foot of the name-and-address area. */
    name: {
      x: fromLeft(NAME_X_MM),
      baseline: fromBottom(4.9),
      height: mm(2.92),
      width: mm(2),
      pitch: mm(2.54),
      stroke: mm(0.5),
      maxWidth: mm(CARD_WIDTH_MM - NAME_X_MM - RIGHT_MARGIN_MM),
      relief: mm(0.4),
    },
  } satisfies Record<string, CreditCardEmbossLine>,
  /**
   * The "VALID THRU" legend printed flat to the left of the expiry, two short
   * lines of tiny capitals centred on the expiry's height.
   */
  expiryLabel: [
    {
      text: 'VALID',
      x: fromLeft(EXPIRY_X_MM - 5.6),
      baseline: fromBottom(10.6 + 1.62),
      height: mm(1.05),
      width: mm(0.78),
      pitch: mm(0.98),
      stroke: mm(0.2),
      maxWidth: mm(5),
    },
    {
      text: 'THRU',
      x: fromLeft(EXPIRY_X_MM - 5.6),
      baseline: fromBottom(10.6 + 0.12),
      height: mm(1.05),
      width: mm(0.78),
      pitch: mm(0.98),
      stroke: mm(0.2),
      maxWidth: mm(5),
    },
  ] satisfies readonly CreditCardPrintLine[],
  /** Magnetic stripe, back side: edge to edge, 12.7 mm tall from 5.54 mm below the top. */
  stripe: { y: fromTop(5.54 + 12.7 / 2), height: mm(12.7) },
  /**
   * Signature panel, back side: under the stripe and a millimetre clear of the
   * number's impressions, leaving room at its right end for a printed
   * security code. Back-side features are laid out as seen looking at the
   * back, so `x` here runs mirrored to the front's.
   */
  signature: {
    x: fromLeft(5 + 52 / 2),
    y: fromTop(20 + 7 / 2),
    width: mm(52),
    height: mm(7),
    radius: mm(0.4),
  },
  /** Default CSS px width of the virtual face (~150 dpi of the physical card). */
  resolution: 520,
} as const

/** Crest foil presets for `tipping`. Any other CSS colour is used as given. */
export const CREDIT_CARD_TIPPING = {
  silver: '#dfe3e9',
  gold: '#e3bd62',
} as const

/** `tipping`: a preset, `'none'` for untipped crests, or any CSS colour. */
export type CreditCardTipping = keyof typeof CREDIT_CARD_TIPPING | 'none' | (string & {})

/**
 * The foil colour a `tipping` value puts on the crests, or `null` for none -
 * the embossing then shows the print it was pushed up through.
 */
export function creditCardTippingColor(tipping: CreditCardTipping | undefined): string | null {
  if (tipping === 'none' || tipping === '') return null
  if (tipping === undefined) return CREDIT_CARD_TIPPING.silver
  return (CREDIT_CARD_TIPPING as Record<string, string>)[tipping] ?? tipping
}

/** Default embossing, a plausible test card (never a live number). */
export const CREDIT_CARD_DEFAULT_TEXT = {
  number: '4000 1234 5678 9010',
  name: 'ALEX MORGAN',
  expiry: '12/29',
} as const

/** Live regions: the two faces of the card. */
export const CREDIT_CARD_REGIONS = [
  { name: 'front', label: 'Front face' },
  { name: 'back', label: 'Back face' },
] as const satisfies readonly RegionSpec[]

/** Live geometry of the two full-bleed faces. */
export const CREDIT_CARD_METRICS = {
  mmPerUnit: CREDIT_CARD_MM_PER_UNIT,
  regions: () => {
    const { face, resolution } = CREDIT_CARD
    const one = { width: face.width, height: face.height, radius: face.radius, resolution }
    return { front: one, back: one }
  },
} as const satisfies MockupMetrics

/** The card grounds on its long bottom edge. */
export const CREDIT_CARD_FRAMING = {
  camera: { position: [0, 0.3, 5.4], fov: 40 },
  floatIntensity: 0.6,
  extent: () => CREDIT_CARD.body.height / 2,
  contactGap: 0.05,
} as const satisfies MockupFraming
