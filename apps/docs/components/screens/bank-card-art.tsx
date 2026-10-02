'use client'

import { Face, Small, isDark, mix, quietInk, stockInk } from './sample-kit'

/**
 * Larkmoor, a fictional bank: the front and back of its debit card, printed
 * on whatever stock the card is.
 *
 * A payment card's print is laid out around hardware the printer never
 * touches - the chip, the embossed lines, the stripe and the signature panel
 * - so both faces keep those areas clear and fill the rest: the issuer's
 * mark, the contactless indicator beside the chip, a network mark in the
 * corner (an abstract one: no real network's name or logo), and on the back
 * the security code box and the small print. The number, the name and the
 * expiry are not printed at all; the mockup embosses them.
 *
 * Positions are the card's own millimetres as container units: 1cqw is
 * 0.856 mm across, 1cqh is 0.54 mm down.
 */

const TIDE = '#33b3a2'
const tideOn = (material: string) => (isDark(material) ? '#4fd1bf' : '#1f8f80')

/** The bank's mark: a lark's wing over a horizon line. */
function LarkMark({ size, color }: { size: string; color: string }) {
  return (
    <svg viewBox="0 0 40 28" style={{ width: size, height: 'auto', display: 'block', flex: 'none' }} aria-hidden>
      <path d="M3 20C11 7 22 3 37 4C27 8 22 13 19 20Z" fill={color} />
      <path d="M2 25h36" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
    </svg>
  )
}

/** The contactless indicator: four widening arcs, the way every tap-to-pay card shows it. */
function ContactlessMark({ size, color }: { size: string; color: string }) {
  return (
    <svg viewBox="0 0 24 28" style={{ width: size, height: 'auto', display: 'block' }} aria-hidden>
      <g fill="none" stroke={color} strokeWidth={2.3} strokeLinecap="round">
        <path d="M4 10.5a6 6 0 0 1 0 7" />
        <path d="M8.5 7.5a11 11 0 0 1 0 13" />
        <path d="M13 4.5a16 16 0 0 1 0 19" />
        <path d="M17.5 1.5a21 21 0 0 1 0 25" />
      </g>
    </svg>
  )
}

/** A made-up card network's mark: three stacked chevrons in a rounded tile. */
function NetworkMark({ width, color, tile }: { width: string; color: string; tile: string }) {
  return (
    <svg viewBox="0 0 48 30" style={{ width, height: 'auto', display: 'block' }} aria-hidden>
      <rect x="0.5" y="0.5" width="47" height="29" rx="6" fill={tile} />
      <g fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21l12-7 12 7" opacity={0.45} />
        <path d="M12 16l12-7 12 7" opacity={0.7} />
        <path d="M12 11l12-7 12 7" />
      </g>
    </svg>
  )
}

/** The front: mark and product at the head, tide bands to the right, the chip's neighbours, the network mark. */
export function LarkmoorCard({ material }: { material: string }) {
  const ink = stockInk(material)
  const tide = tideOn(material)
  const ground = material.startsWith('#') ? material : '#1f2b46'
  return (
    <Face ink={ink}>
      {/* tide bands sweeping in from the right edge - solid tints of the
          brand colour on this stock, so they print as inks, not glazes */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        aria-hidden
      >
        <path d="M58 0C70 26 70 64 46 100H100V0Z" fill={mix(ground, TIDE, 0.16)} />
        <path d="M72 0C82 30 82 66 66 100H100V0Z" fill={mix(ground, TIDE, 0.3)} />
        <path d="M86 0C93 32 93 68 84 100H100V0Z" fill={mix(ground, TIDE, 0.48)} />
      </svg>

      <div style={{ position: 'absolute', left: '8.6cqw', top: '9.5cqh', display: 'flex', alignItems: 'center', gap: '1.6cqw' }}>
        <LarkMark size="6.4cqw" color={tide} />
        <span style={{ fontSize: '5.4cqw', fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 1 }}>Larkmoor</span>
      </div>
      <Small size="2.9cqw" style={{ position: 'absolute', right: '6.6cqw', top: '10.5cqh', fontWeight: 700, color: isDark(material) ? '#ffffff' : ink }}>
        Debit
      </Small>

      {/* beside the chip (which the mockup draws at 11-24cqw, 34-50cqh) */}
      <div style={{ position: 'absolute', left: '27.5cqw', top: '35.5cqh', width: '4.6cqw' }}>
        <ContactlessMark size="100%" color={quietInk(material, 0.2)} />
      </div>

      <div style={{ position: 'absolute', right: '6.4cqw', bottom: '8.4cqh', width: '15cqw' }}>
        <NetworkMark width="100%" color={isDark(material) ? '#0f1a2c' : '#ffffff'} tile={tide} />
      </div>
    </Face>
  )
}

/** The back: the security code beside the signature panel, and the small print. */
export function LarkmoorCardBack({ material }: { material: string }) {
  const ink = stockInk(material)
  const quiet = quietInk(material, 0.3)
  const tide = tideOn(material)
  return (
    <Face ink={ink}>
      {/* above the stripe (which the mockup draws from 10 to 34cqh) */}
      <Small size="2cqw" style={{ position: 'absolute', left: '6cqw', top: '3.6cqh', color: quiet }}>
        Lost or stolen? Call +44 20 7946 0000, day or night.
      </Small>

      {/* between the stripe and the signature panel */}
      <Small size="1.5cqw" style={{ position: 'absolute', left: '6cqw', top: '34.4cqh', color: quiet, lineHeight: 1 }}>
        Authorised signature - not valid unless signed
      </Small>

      {/* the security code box at the panel's right end (the panel runs 6-67cqw) */}
      <div
        style={{
          position: 'absolute',
          left: '68.6cqw',
          top: '37.9cqh',
          width: '10.6cqw',
          height: '11.7cqh',
          background: '#ffffff',
          color: '#1d1f24',
          display: 'grid',
          placeItems: 'center',
          fontSize: '3.4cqw',
          fontStyle: 'italic',
          fontWeight: 600,
          letterSpacing: '0.04em',
        }}
      >
        123
      </div>

      <Small size="1.75cqw" style={{ position: 'absolute', left: '6cqw', right: '40cqw', top: '66cqh', color: quiet, lineHeight: 1.45 }}>
        This card is issued by Larkmoor Bank, a fictional bank, and remains its property. Use is subject to the
        cardholder agreement. If found, please return it to any Larkmoor branch or post it to Larkmoor, PO Box 0000.
      </Small>

      <div style={{ position: 'absolute', right: '6.4cqw', bottom: '8.4cqh', display: 'flex', alignItems: 'center', gap: '1.4cqw' }}>
        <LarkMark size="4.6cqw" color={tide} />
        <span style={{ fontSize: '3.4cqw', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>Larkmoor</span>
      </div>
    </Face>
  )
}
