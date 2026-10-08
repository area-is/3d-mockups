import * as React from 'react'
import { interpolate, useCurrentFrame } from 'remotion'
import { Cut, Face, type ArtName } from '../kit'

/*
 * LUMEN, three nights of music in a botanical glasshouse: the invitation,
 * the programme, the artist pass, the live record, the festival zine, and
 * the screens and banners at the gate. A serif with a true italic, a quiet
 * sans, a night palette, and every picture a cut-out - three performers and
 * the plants they play among.
 */

export const SERIF = '"Instrument Serif", Georgia, serif'
export const SANS = '"Instrument Sans Variable", "Inter Variable", system-ui, sans-serif'

export const LUMEN = {
  night: '#0b1220',
  ink: '#101a17',
  glass: '#173a2e',
  moss: '#2c5e48',
  amber: '#ffb547',
  ember: '#e8743b',
  petal: '#f4a6b8',
  ivory: '#f4ecdc',
  moon: '#cfe3d9',
}

export interface Artist {
  name: string
  role: string
  night: string
  art: ArtName
  ground: string
}

export const ARTISTS: Artist[] = [
  { name: 'Marisol Vane', role: 'Soul', night: 'Friday 14', art: 'lumen-singer', ground: '#c9792c' },
  { name: 'Ezra Holloway Quartet', role: 'Jazz', night: 'Saturday 15', art: 'lumen-sax', ground: '#1f4a3a' },
  { name: 'Theo Marlowe', role: 'Electronic', night: 'Sunday 16', art: 'lumen-producer', ground: '#2c3a6b' },
]

/** A small label: sentence case and the face's own spacing, never tracked capitals. */
const label = (size: string, extra?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: SANS,
  fontSize: size,
  fontWeight: 600,
  letterSpacing: '-0.005em',
  lineHeight: 1.3,
  ...extra,
})

/** The mark: the word, and a small sun for the dot. */
export function Mark({ size, color, sun = LUMEN.amber, style }: { size: string; color: string; sun?: string; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'baseline', fontFamily: SERIF, fontSize: size, lineHeight: 0.85, letterSpacing: '-0.01em', color, ...style }}>
      Lumen
      <span style={{ display: 'inline-block', width: '0.16em', height: '0.16em', borderRadius: '50%', background: sun, marginLeft: '0.06em', boxShadow: `0 0 0.2em ${sun}` }} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  The invitation (greeting card, 127 × 178 mm)                       */
/* ------------------------------------------------------------------ */

export function InviteFront() {
  return (
    <Face ground={LUMEN.glass} ink={LUMEN.ivory} font={SERIF} style={{ padding: '10cqw 9cqw', background: `radial-gradient(ellipse 90% 70% at 50% 30%, ${LUMEN.moss} 0%, ${LUMEN.glass} 70%)` }}>
      <Cut name="lumen-monstera" style={{ right: '-30cqw', top: '-14cqw', width: '96cqw', transform: 'rotate(160deg)', opacity: 0.95 }} />
      <Cut name="lumen-fern" style={{ left: '-26cqw', bottom: '-10cqw', width: '70cqw', transform: 'rotate(20deg)' }} />
      <div style={label('3.4cqw', { color: LUMEN.amber, position: 'relative' })}>You are invited</div>
      <Mark size="30cqw" color={LUMEN.ivory} style={{ marginTop: '30cqh', position: 'relative' }} />
      <div style={{ fontSize: '8.6cqw', fontStyle: 'italic', lineHeight: 1.05, marginTop: '4cqw', position: 'relative' }}>
        Three nights
        <br />
        in the Glasshouse
      </div>
      <Cut name="lumen-orchid" style={{ right: '4cqw', bottom: '2cqh', width: '34cqw' }} />
      <div style={label('3cqw', { marginTop: 'auto', position: 'relative' })}>14 — 16 November</div>
    </Face>
  )
}

export function InviteInsideLeft() {
  const lead = ARTISTS[0]!
  return (
    <Face ground={lead.ground} ink={LUMEN.ivory} font={SERIF} style={{ padding: '9cqw', background: `linear-gradient(180deg, #e39b45 0%, ${lead.ground} 60%, #8a4c18 100%)` }}>
      <div style={label('3cqw')}>Opening night</div>
      <div style={{ fontSize: '15cqw', lineHeight: 0.92, marginTop: '3cqw', position: 'relative', zIndex: 1 }}>{lead.name}</div>
      <Cut name={lead.art} style={{ left: '2cqw', bottom: 0, width: '100cqw' }} />
    </Face>
  )
}

export function InviteInsideRight() {
  return (
    <Face ground={LUMEN.ivory} ink={LUMEN.ink} font={SERIF} style={{ padding: '10cqw 9cqw' }}>
      <div style={label('3cqw', { color: LUMEN.moss })}>The line-up</div>
      {ARTISTS.map((a) => (
        <div key={a.name} style={{ marginTop: '7cqw', borderTop: `0.3cqw solid ${LUMEN.ink}22`, paddingTop: '3cqw' }}>
          <div style={label('2.6cqw', { color: LUMEN.ember })}>{a.night} November</div>
          <div style={{ fontSize: '10cqw', lineHeight: 1, marginTop: '1.6cqw' }}>{a.name}</div>
          <div style={{ fontSize: '5cqw', fontStyle: 'italic', opacity: 0.7 }}>{a.role}</div>
        </div>
      ))}
      <div style={{ marginTop: 'auto', fontFamily: SANS, fontSize: '3.4cqw', lineHeight: 1.4 }}>
        Doors at dusk. The Palm House, Victoria Gardens.
        <br />
        Kindly reply by 1 November.
      </div>
    </Face>
  )
}

export function InviteBack() {
  return (
    <Face ground={LUMEN.glass} ink={LUMEN.ivory} font={SERIF} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Mark size="16cqw" color={LUMEN.ivory} />
    </Face>
  )
}

/* ------------------------------------------------------------------ */
/*  The programme (Z-fold brochure, 93 × 216 mm panels)                */
/* ------------------------------------------------------------------ */

export function ProgrammeCover() {
  return (
    <Face ground={LUMEN.night} ink={LUMEN.ivory} font={SERIF} style={{ padding: '12cqw 10cqw', background: `linear-gradient(180deg, ${LUMEN.night} 0%, ${LUMEN.glass} 100%)` }}>
      <div style={label('4.4cqw', { color: LUMEN.amber })}>Programme</div>
      <Mark size="36cqw" color={LUMEN.ivory} style={{ marginTop: '6cqh' }} />
      <Cut name="lumen-orchid" style={{ left: '8cqw', top: '34cqh', width: '92cqw' }} />
      <div style={{ marginTop: 'auto', fontSize: '11cqw', fontStyle: 'italic', lineHeight: 1 }}>14 — 16 Nov</div>
    </Face>
  )
}

/** One night of the programme on one panel. */
export function ProgrammeNight({ artist, index }: { artist: Artist; index: number }) {
  const times = [
    ['18:30', 'Doors & cocktails in the Fern House'],
    ['19:30', 'Support: the Glasshouse Strings'],
    ['21:00', artist.name],
    ['23:00', 'Late set under the palms'],
  ]
  return (
    <Face ground={LUMEN.ivory} ink={LUMEN.ink} font={SERIF} style={{ padding: '11cqw 9cqw' }}>
      <div style={label('4cqw', { color: LUMEN.ember })}>Night {['one', 'two', 'three'][index]}</div>
      <div style={{ fontSize: '17cqw', lineHeight: 0.95, marginTop: '3cqw' }}>{artist.night.split(' ')[0]}</div>
      <div style={{ fontSize: '9cqw', fontStyle: 'italic' }}>{artist.night.split(' ')[1]} November</div>
      <div style={{ position: 'relative', height: '34cqh', margin: '4cqh -9cqw 0', background: artist.ground, overflow: 'hidden' }}>
        <Cut name={artist.art} style={{ left: '50%', bottom: 0, height: '104%', transform: 'translateX(-50%)' }} />
      </div>
      {times.map(([time, what]) => (
        <div key={time} style={{ display: 'flex', gap: '4cqw', marginTop: '4.4cqw', fontFamily: SANS, fontSize: '4.6cqw', lineHeight: 1.25 }}>
          <span style={{ fontWeight: 700, flex: 'none' }}>{time}</span>
          <span style={{ fontWeight: what === artist.name ? 700 : 400 }}>{what}</span>
        </div>
      ))}
    </Face>
  )
}

export function ProgrammeMap() {
  const houses: [string, number, number, number][] = [
    ['Palm House', 18, 22, 64],
    ['Fern House', 12, 56, 36],
    ['Orchid House', 54, 58, 34],
    ['Gate', 38, 86, 24],
  ]
  return (
    <Face ground={LUMEN.glass} ink={LUMEN.ivory} font={SERIF} style={{ padding: '11cqw 9cqw' }}>
      <div style={label('4cqw', { color: LUMEN.amber })}>Finding your way</div>
      <div style={{ fontSize: '14cqw', lineHeight: 0.95, marginTop: '3cqw' }}>The gardens</div>
      <div style={{ position: 'relative', flex: 1, marginTop: '6cqw' }}>
        {houses.map(([name, x, y, w]) => (
          <div key={name} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: `${w}%`, height: name === 'Gate' ? '6%' : '16%', border: `0.6cqw solid ${LUMEN.moon}`, borderRadius: name === 'Palm House' ? '50% 50% 4% 4%' : '1.5cqw', display: 'grid', placeItems: 'center', fontFamily: SANS, fontSize: '3.6cqw', fontWeight: 600 }}>
            {name}
          </div>
        ))}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <path d="M50 88 C50 74 30 76 30 64 M50 88 C52 76 70 78 70 66 M30 56 C34 44 46 44 50 38" stroke={LUMEN.amber} strokeWidth={0.8} strokeDasharray="2 2" fill="none" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </Face>
  )
}

/* ------------------------------------------------------------------ */
/*  The artist pass (ID badge, CR80)                                   */
/* ------------------------------------------------------------------ */

export function PassFront() {
  const artist = ARTISTS[2]!
  return (
    <Face ground={LUMEN.night} ink={LUMEN.ivory} font={SERIF} style={{ padding: '22cqw 9cqw 9cqw' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: '21cqw', height: '56cqh', background: `linear-gradient(180deg, ${artist.ground}, #18224a)` }} />
      <Cut name={artist.art} style={{ left: '50%', top: '22cqw', height: '56cqh', transform: 'translateX(-50%)' }} />
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Mark size="13cqw" color={LUMEN.ivory} />
        <span style={label('3.4cqw', { color: LUMEN.amber })}>2026</span>
      </div>
      <div style={{ marginTop: 'auto', position: 'relative' }}>
        <div style={{ fontSize: '12cqw', lineHeight: 1 }}>{artist.name}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4cqw' }}>
          <span style={{ ...label('4.6cqw'), background: LUMEN.amber, color: LUMEN.night, padding: '1.6cqw 3cqw', borderRadius: '1cqw', fontWeight: 700 }}>Artist</span>
          <span style={label('3.4cqw')}>All areas</span>
        </div>
      </div>
    </Face>
  )
}

export function PassBack() {
  const zones = ['Palm House', 'Fern House', 'Orchid House', 'Green room', 'Backstage', 'Roof garden']
  return (
    <Face ground={LUMEN.ivory} ink={LUMEN.ink} font={SERIF} style={{ padding: '22cqw 9cqw 9cqw' }}>
      <div style={label('3.6cqw', { color: LUMEN.ember })}>Access</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.4cqw', marginTop: '4cqw' }}>
        {zones.map((z, i) => (
          <div key={z} style={{ border: `0.5cqw solid ${LUMEN.ink}`, borderRadius: '2cqw', padding: '3cqw', background: i < 5 ? LUMEN.amber : 'transparent', fontFamily: SANS, fontSize: '4.2cqw', fontWeight: 600 }}>
            {z}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1cqw' }}>
        {Array.from({ length: 96 }, (_, i) => (
          <div key={i} style={{ aspectRatio: 1, background: (i * 37) % 5 < 2 ? LUMEN.ink : 'transparent' }} />
        ))}
      </div>
      <div style={{ fontFamily: SANS, fontSize: '3.2cqw', marginTop: '3cqw' }}>Not transferable · LMN-26-0314</div>
    </Face>
  )
}

/* ------------------------------------------------------------------ */
/*  The live record and the zine                                       */
/* ------------------------------------------------------------------ */

export function RecordSleeve() {
  const artist = ARTISTS[1]!
  return (
    <Face ground={artist.ground} ink={LUMEN.ivory} font={SERIF} style={{ padding: '7cqw', background: `radial-gradient(circle at 70% 30%, #2f6b52 0%, ${artist.ground} 55%, #0e2a20 100%)` }}>
      <div aria-hidden style={{ position: 'absolute', left: '36cqw', top: '6cqw', width: '58cqw', aspectRatio: 1, borderRadius: '50%', background: `radial-gradient(circle, ${LUMEN.amber} 0%, rgba(255,181,71,0) 68%)`, opacity: 0.7 }} />
      <Cut name={artist.art} style={{ right: '-6cqw', bottom: 0, height: '96cqh' }} />
      <div style={{ position: 'relative', fontSize: '12cqw', lineHeight: 0.92 }}>
        Live at the
        <br />
        <span style={{ fontStyle: 'italic' }}>Glasshouse</span>
      </div>
      <div style={label('2.6cqw', { position: 'relative', marginTop: '3cqw', color: LUMEN.amber })}>{artist.name}</div>
      <Mark size="9cqw" color={LUMEN.ivory} style={{ position: 'absolute', left: '7cqw', bottom: '7cqw' }} />
    </Face>
  )
}

/** The side-A label. The disc does not turn, so the label does: grooves look the same at every angle. */
export function RecordLabel({ turn }: { turn: number }) {
  return (
    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', transform: `rotate(${turn}deg)`, background: `radial-gradient(circle, ${LUMEN.ivory} 0 26%, ${LUMEN.amber} 26% 100%)`, color: LUMEN.night, fontFamily: SERIF }}>
      <div style={{ position: 'absolute', top: '14%', left: 0, right: 0, textAlign: 'center', fontSize: 22 }}>Lumen</div>
      <div style={{ position: 'absolute', bottom: '14%', left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: '-0.005em' }}>Side A · 33⅓</div>
    </div>
  )
}

/** The festival zine's cover: the masthead set behind the singer's head, the way a magazine does it. */
export function ZineCover() {
  const artist = ARTISTS[0]!
  return (
    <Face ground="#e9dcc6" ink={LUMEN.ink} font={SERIF} style={{ padding: '6cqw 6cqw' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: '4cqw', textAlign: 'center', fontSize: '40cqw', lineHeight: 0.8, color: LUMEN.ember, letterSpacing: '-0.02em' }}>Lumen</div>
      <Cut name={artist.art} style={{ left: '50%', bottom: 0, height: '84cqh', transform: 'translateX(-46%)' }} />
      <div style={{ position: 'absolute', left: '6cqw', top: '44cqh', width: '30cqw', ...label('3cqw', { lineHeight: 1.4 }) }}>
        Issue 03
        <br />
        Winter 2026
      </div>
      <div style={{ position: 'absolute', left: '6cqw', bottom: '8cqh', width: '44cqw', fontSize: '9cqw', lineHeight: 0.95, color: LUMEN.ivory, textShadow: '0 0.4cqw 2cqw rgba(0,0,0,0.4)' }}>
        <span style={{ fontStyle: 'italic' }}>Marisol Vane</span> on singing to the palms
      </div>
    </Face>
  )
}

/* ------------------------------------------------------------------ */
/*  The gate                                                           */
/* ------------------------------------------------------------------ */

/** The totem's screen (540 × 960): one artist a night, cross-dissolving. */
export function GateScreen({ hold = 40 }: { hold?: number }) {
  const frame = useCurrentFrame()
  return (
    <div style={{ position: 'absolute', inset: 0, background: LUMEN.night }}>
      {ARTISTS.map((artist, i) => {
        const start = i * hold
        const opacity = interpolate(frame, [start - 10, start, start + hold - 10, start + hold], [0, 1, 1, i === ARTISTS.length - 1 ? 1 : 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
        if (opacity <= 0) return null
        const drift = (frame - start) * 0.25
        return (
          <div key={artist.name} style={{ position: 'absolute', inset: 0, opacity }}>
            <Face ground={artist.ground} ink={LUMEN.ivory} font={SERIF} style={{ padding: '9cqw 8cqw', background: `linear-gradient(180deg, ${artist.ground} 0%, ${LUMEN.night} 100%)` }}>
              <Cut name={artist.art} style={{ left: '50%', bottom: '18cqh', height: '64cqh', transform: `translateX(-50%) scale(${1 + drift * 0.002})` }} />
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Mark size="14cqw" color={LUMEN.ivory} />
                <span style={label('3.4cqw', { color: LUMEN.amber })}>Tonight</span>
              </div>
              <div style={{ marginTop: 'auto', position: 'relative' }}>
                <div style={label('3.6cqw', { color: LUMEN.amber })}>{artist.night} Nov · {artist.role}</div>
                <div style={{ fontSize: '14cqw', lineHeight: 0.95, marginTop: '2cqw' }}>{artist.name}</div>
              </div>
            </Face>
          </div>
        )
      })}
    </div>
  )
}

export function WelcomeBanner() {
  return (
    <Face ground={LUMEN.glass} ink={LUMEN.ivory} font={SERIF} style={{ padding: '12cqw 10cqw', background: `linear-gradient(180deg, ${LUMEN.night} 0%, ${LUMEN.glass} 60%, ${LUMEN.moss} 100%)` }}>
      <div style={label('4cqw', { color: LUMEN.amber })}>Welcome</div>
      <div style={{ fontSize: '22cqw', lineHeight: 0.9, marginTop: '4cqw' }}>
        to the
        <br />
        <span style={{ fontStyle: 'italic' }}>Glasshouse</span>
      </div>
      <Cut name="lumen-monstera" style={{ left: '-20cqw', bottom: '6cqh', width: '120cqw', transform: 'rotate(-12deg)' }} />
      <Cut name="lumen-fern" style={{ right: '-26cqw', bottom: '-4cqh', width: '80cqw', transform: 'rotate(-20deg)' }} />
      <Mark size="18cqw" color={LUMEN.ivory} style={{ marginTop: 'auto', position: 'relative' }} />
    </Face>
  )
}

export function WayfindingBanner() {
  const signs: [string, string][] = [
    ['Palm House', 'Main stage'],
    ['Fern House', 'Bar & supper'],
    ['Orchid House', 'Late sets'],
  ]
  return (
    <Face ground={LUMEN.ivory} ink={LUMEN.ink} font={SERIF} style={{ padding: '12cqw 10cqw' }}>
      <Mark size="22cqw" color={LUMEN.ink} sun={LUMEN.ember} />
      <div style={{ fontSize: '12cqw', fontStyle: 'italic', lineHeight: 1, marginTop: '4cqw' }}>This way, after dark</div>
      {signs.map(([house, what], i) => (
        <div key={house} style={{ display: 'flex', alignItems: 'center', gap: '4cqw', marginTop: i ? '5cqw' : '12cqw', borderTop: `0.4cqw solid ${LUMEN.ink}`, paddingTop: '4cqw' }}>
          <span style={{ fontSize: '12cqw', lineHeight: 1, color: LUMEN.ember }}>{['↑', '←', '→'][i]}</span>
          <div>
            <div style={{ fontSize: '9cqw', lineHeight: 1 }}>{house}</div>
            <div style={{ fontFamily: SANS, fontSize: '4.2cqw' }}>{what}</div>
          </div>
        </div>
      ))}
      <Cut name="lumen-orchid" style={{ right: '-6cqw', bottom: '3cqh', width: '64cqw' }} />
    </Face>
  )
}
