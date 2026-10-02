import * as React from 'react'
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { Cut, Face, type ArtName } from '../kit'

/*
 * KITE, a running brand, dropping the Aero 2: the app, the lookbook, the
 * watch face, the store and the boxes. One condensed display face, one sans,
 * three colourways - and the shoe itself always a photograph.
 */

export const DISPLAY = 'Anton, "Inter Variable", sans-serif'
export const SANS = '"Inter Variable", Inter, system-ui, sans-serif'

export const KITE = {
  graphite: '#0d0e11',
  carbon: '#17191d',
  ash: '#2a2d33',
  chalk: '#f3f3ef',
  volt: '#d6ff3a',
  grey: '#8c9097',
}

export interface Colourway {
  id: 'volt' | 'sky' | 'ember'
  name: string
  art: ArtName
  ground: string
  /** A deeper tone of the ground, for type laid over it. */
  deep: string
  ink: string
}

export const COLOURWAYS: Colourway[] = [
  { id: 'volt', name: 'Volt', art: 'kite-volt', ground: '#d6ff3a', deep: '#b5dc1c', ink: '#0d0e11' },
  { id: 'sky', name: 'Sky', art: 'kite-sky', ground: '#a9d6ff', deep: '#7fb9ef', ink: '#0b1f3a' },
  { id: 'ember', name: 'Ember', art: 'kite-ember', ground: '#ff5a2a', deep: '#e0441a', ink: '#1a0a05' },
]

/** The mark: a kite, its spars, and a tail. */
export function KiteGlyph({ size, color, tail = true }: { size: number | string; color: string; tail?: boolean }) {
  return (
    <svg viewBox="0 0 24 32" style={{ width: size, height: 'auto', display: 'block', flex: 'none' }} aria-hidden>
      <path d="M12 1 22 11 12 23 2 11Z" fill={color} />
      <path d="M12 1V23M2 11H22" stroke="rgba(0,0,0,0.35)" strokeWidth={1.2} />
      {tail && <path d="M12 23c-2 2 2 3 0 5s2 3 0 4" stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" />}
    </svg>
  )
}

export function KiteLogo({ size, color, glyph }: { size: number | string; color: string; glyph?: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.18em', fontFamily: DISPLAY, fontSize: size, letterSpacing: '0.02em', lineHeight: 1, color }}>
      <KiteGlyph size="0.62em" color={glyph ?? color} tail={false} />
      KITE
    </div>
  )
}

const pad = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, '0')
const hms = (seconds: number) => `${pad(seconds / 3600)}:${pad((seconds / 60) % 60)}:${pad(seconds % 60)}`

/* ------------------------------------------------------------------ */
/*  The app (iPhone 18 Pro Max, 440 × 956)                             */
/* ------------------------------------------------------------------ */

/**
 * The product page. `pick` is the colourway as a continuous index - 0.5 is
 * halfway from the first to the second - so the hero can slide between them.
 * `shoeOpacity` lets the film lift the shoe off the glass.
 */
export function ProductScreen({ pick, shoeOpacity = 1 }: { pick: number; shoeOpacity?: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const index = Math.round(pick)
  const current = COLOURWAYS[Math.min(2, Math.max(0, index))]!
  const left = 2 * 3600 + 14 * 60 + 9 - frame / fps
  return (
    <div style={{ position: 'absolute', inset: 0, background: KITE.chalk, color: KITE.graphite, fontFamily: SANS, padding: '64px 20px 24px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <KiteLogo size={30} color={KITE.graphite} />
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2.5px solid ${KITE.graphite}` }} />
          <div style={{ width: 22, height: 24, borderRadius: '4px 4px 6px 6px', border: `2.5px solid ${KITE.graphite}` }} />
        </div>
      </div>
      {/* the hero card: the ground slides through the range and the shoe rides in on it */}
      <div style={{ position: 'relative', marginTop: 18, height: 360, borderRadius: 28, overflow: 'hidden', background: KITE.graphite }}>
        {COLOURWAYS.map((c, i) => {
          const offset = (i - pick) * 100
          if (Math.abs(offset) >= 100) return null
          return (
            <div key={c.id} style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, ${c.ground} 0%, ${c.deep} 100%)`, transform: `translateX(${offset}%)` }}>
              <div style={{ position: 'absolute', left: -6, top: 6, fontFamily: DISPLAY, fontSize: 178, lineHeight: 0.85, color: 'rgba(0,0,0,0.08)', whiteSpace: 'nowrap' }}>AERO 2</div>
              <Cut
                name={c.art}
                style={{
                  left: 14,
                  top: 112,
                  width: 400,
                  transform: `rotate(-9deg) translateX(${offset * -0.9}px)`,
                  filter: 'drop-shadow(0 26px 22px rgba(0,0,0,0.28))',
                  opacity: shoeOpacity,
                }}
              />
            </div>
          )
        })}
        <div style={{ position: 'absolute', left: 18, top: 16, background: KITE.graphite, color: KITE.volt, fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', padding: '6px 11px', borderRadius: 999 }}>
          Drop 10.09
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20 }}>
        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: 46, lineHeight: 1 }}>AERO 2</div>
          <div style={{ fontSize: 15, color: '#5d6168', marginTop: 4 }}>Road running · 212 g · 6 mm drop</div>
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: 34 }}>$160</div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 20, alignItems: 'center' }}>
        {COLOURWAYS.map((c, i) => (
          <div
            key={c.id}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: c.ground,
              boxShadow: i === index ? `0 0 0 3px ${KITE.chalk}, 0 0 0 5.5px ${KITE.graphite}` : 'inset 0 0 0 1px rgba(0,0,0,0.12)',
            }}
          />
        ))}
        <div style={{ marginLeft: 8, fontSize: 16, fontWeight: 700 }}>{current.name}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 22 }}>
        {['7', '8', '9', '10', '11'].map((size) => (
          <div
            key={size}
            style={{
              height: 46,
              borderRadius: 12,
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              fontSize: 16,
              border: `1.5px solid ${size === '9' ? KITE.graphite : '#d3d4d0'}`,
              background: size === '9' ? KITE.graphite : 'transparent',
              color: size === '9' ? KITE.chalk : KITE.graphite,
            }}
          >
            US {size}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 'auto', height: 62, borderRadius: 999, background: KITE.graphite, color: KITE.chalk, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontWeight: 700, fontSize: 17 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: KITE.volt }} />
        Notify me · drops in <span style={{ fontVariantNumeric: 'tabular-nums' }}>{hms(left)}</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  The foldable                                                       */
/* ------------------------------------------------------------------ */

/** The cover display (480 × 758): the last seconds before the drop. */
export function CountdownScreen({ seconds }: { seconds: number }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: KITE.graphite, color: KITE.chalk, fontFamily: SANS, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
      <KiteLogo size={34} color={KITE.chalk} glyph={KITE.volt} />
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em', color: KITE.volt, marginTop: 40 }}>Aero 2 drops in</div>
      <div style={{ fontFamily: DISPLAY, fontSize: 210, lineHeight: 0.9, fontVariantNumeric: 'tabular-nums' }}>00:0{Math.max(0, Math.ceil(seconds))}</div>
      <Cut name="kite-hero" style={{ position: 'relative', width: 300, marginTop: 30, filter: 'drop-shadow(0 20px 20px rgba(0,0,0,0.5))' }} />
    </div>
  )
}

/** The inner display (1020 × 770): the lookbook it opens on. */
export function LookbookScreen({ start = 0 }: { start?: number }) {
  const frame = useCurrentFrame() - start
  const rise = (delay: number) => interpolate(frame, [delay, delay + 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const card = (delay: number): React.CSSProperties => ({ opacity: rise(delay), transform: `translateY(${(1 - rise(delay)) * 30}px)` })
  return (
    <div style={{ position: 'absolute', inset: 0, background: KITE.graphite, fontFamily: SANS, padding: '58px 22px 22px', display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 14 }}>
      <div style={{ position: 'relative', borderRadius: 26, overflow: 'hidden', background: `linear-gradient(160deg, ${KITE.volt}, #b5dc1c)`, ...card(0) }}>
        <div style={{ position: 'absolute', left: 26, top: 24, fontFamily: DISPLAY, fontSize: 70, lineHeight: 0.92, color: KITE.graphite }}>
          BUILT FOR
          <br />
          THE LONG
          <br />
          WAY HOME
        </div>
        <Cut name="kite-runner" style={{ right: -40, bottom: -10, height: 560, transform: `translateX(${-frame * 0.6}px)` }} />
        <div style={{ position: 'absolute', left: 26, bottom: 22, fontSize: 15, fontWeight: 700, color: KITE.graphite }}>Lookbook · Autumn 26</div>
      </div>
      <div style={{ display: 'grid', gridTemplateRows: '1.25fr 1fr', gap: 14 }}>
        <div style={{ position: 'relative', borderRadius: 26, overflow: 'hidden', background: KITE.ash, ...card(6) }}>
          <Cut name="kite-portrait" style={{ right: -10, bottom: 0, height: '108%' }} />
          <div style={{ position: 'absolute', left: 22, bottom: 20, color: KITE.chalk }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 34, lineHeight: 1 }}>JONAH</div>
            <div style={{ fontSize: 14, color: KITE.volt, fontWeight: 700, marginTop: 4 }}>2:31 marathon</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {COLOURWAYS.slice(1).map((c, i) => (
            <div key={c.id} style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', background: c.ground, ...card(12 + i * 5) }}>
              <Cut name={c.art} style={{ left: 8, top: 34, width: '94%', transform: 'rotate(-10deg)' }} />
              <div style={{ position: 'absolute', left: 14, bottom: 12, fontWeight: 800, fontSize: 14, color: c.ink }}>{c.name} · $160</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  The watch (Ultra 4, 211 × 257)                                     */
/* ------------------------------------------------------------------ */

export function WorkoutScreen({ notifyAt }: { notifyAt: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame / fps
  const km = 6.2 + t * 0.0036
  const beat = 0.5 + 0.5 * Math.abs(Math.sin(t * Math.PI * 2.7))
  const note = interpolate(frame, [notifyAt, notifyAt + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000', color: '#fff', fontFamily: SANS, padding: '30px 16px 12px' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KITE.volt, letterSpacing: '-0.01em' }}>Tempo run</div>
      <div style={{ fontFamily: DISPLAY, fontSize: 64, lineHeight: 1, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
        4:38<span style={{ fontFamily: SANS, fontSize: 15, fontWeight: 700, color: '#9aa0a8', marginLeft: 4 }}>/KM</span>
      </div>
      <div style={{ fontFamily: DISPLAY, fontSize: 38, lineHeight: 1.1, color: KITE.volt, fontVariantNumeric: 'tabular-nums' }}>
        {km.toFixed(2)}
        <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, marginLeft: 4 }}>KM</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontFamily: DISPLAY, fontSize: 30 }}>
        <span style={{ color: '#ff3b4f', transform: `scale(${0.8 + beat * 0.25})`, display: 'inline-block', fontSize: 22 }}>♥</span>
        162<span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: '#9aa0a8' }}>BPM</span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 8,
          right: 8,
          bottom: 8,
          borderRadius: 18,
          background: '#1f2125',
          padding: '10px 12px',
          transform: `translateY(${(1 - note) * 130}%)`,
          display: 'flex',
          gap: 9,
          alignItems: 'center',
        }}
      >
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: KITE.volt, display: 'grid', placeItems: 'center', flex: 'none' }}>
          <KiteGlyph size={14} color={KITE.graphite} tail={false} />
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.25, fontWeight: 600 }}>
          <span style={{ color: KITE.volt }}>KITE</span>
          <br />
          Your Aero 2 ships today.
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  The store (MacBook Pro 14, 1512 × 982)                             */
/* ------------------------------------------------------------------ */

export function StoreScreen() {
  const frame = useCurrentFrame()
  const sold = interpolate(frame, [0, 120], [0.62, 1], { extrapolateRight: 'clamp' })
  const pairs = Math.round(5000 * sold)
  return (
    <div style={{ position: 'absolute', inset: 0, background: KITE.chalk, color: KITE.graphite, fontFamily: SANS, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 34, padding: '22px 40px', borderBottom: '1px solid #dcdcd6', fontSize: 17, fontWeight: 600 }}>
        <KiteLogo size={30} color={KITE.graphite} />
        {['Run', 'Train', 'Trail', 'Stories'].map((item) => (
          <span key={item} style={{ color: '#5d6168' }}>
            {item}
          </span>
        ))}
        <span style={{ marginLeft: 'auto' }}>Bag (1)</span>
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 30, padding: '36px 40px 36px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', color: '#5d6168' }}>Drop 10.09 · 10:00 ET</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 210, lineHeight: 0.88, marginTop: 14 }}>
            AERO
            <br />2
          </div>
          <div style={{ fontSize: 22, lineHeight: 1.4, color: '#3c4047', marginTop: 20, maxWidth: 520 }}>
            212 grams of supercritical foam, a knit that breathes, and a rocker that rolls you into the next stride.
          </div>
          <div style={{ marginTop: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 19 }}>
              <span>{sold >= 1 ? 'Sold out in 4:12' : 'Selling fast'}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{pairs.toLocaleString('en-US')} / 5,000 pairs</span>
            </div>
            <div style={{ height: 14, borderRadius: 7, background: '#dcdcd6', marginTop: 12, overflow: 'hidden' }}>
              <div style={{ width: `${sold * 100}%`, height: '100%', background: KITE.graphite }} />
            </div>
          </div>
        </div>
        <div style={{ position: 'relative', borderRadius: 30, overflow: 'hidden', background: `linear-gradient(150deg, ${KITE.volt}, #a9d61a)` }}>
          <div style={{ position: 'absolute', left: -10, top: -10, fontFamily: DISPLAY, fontSize: 300, lineHeight: 0.85, color: 'rgba(0,0,0,0.07)' }}>
            AERO
            <br />
            AERO
          </div>
          <Cut name="kite-hero" style={{ left: '10%', top: '10%', width: '82%', filter: 'drop-shadow(0 40px 34px rgba(0,0,0,0.3))', transform: `rotate(${-4 + frame * 0.03}deg)` }} />
          {sold >= 1 && (
            <div style={{ position: 'absolute', right: 28, top: 28, background: KITE.graphite, color: KITE.volt, fontWeight: 800, fontSize: 24, padding: '10px 18px', borderRadius: 999, letterSpacing: '-0.01em' }}>
              Sold out
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  The boxes                                                          */
/* ------------------------------------------------------------------ */

/** The shipper's lid, black corrugated with volt ink, under the tape. */
export function MailerLid() {
  return (
    <Face ink={KITE.volt} font={DISPLAY} style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <KiteGlyph size="13cqw" color={KITE.volt} />
      <div style={{ fontSize: '24cqw', lineHeight: 0.9, marginTop: '3cqh' }}>KITE</div>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: '3.8cqw', letterSpacing: '-0.01em', marginTop: '4cqh' }}>Handle like a personal best.</div>
    </Face>
  )
}

export function MailerSide() {
  return (
    <Face ink={KITE.volt} font={DISPLAY} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '17cqh', letterSpacing: '0.01em' }}>RUN LIGHTER · KITE · RUN LIGHTER</div>
    </Face>
  )
}

/** A short end of the shipper; the wrapped tape rides down its middle. */
export function MailerEnd() {
  return (
    <Face ink={KITE.volt} font={DISPLAY} style={{ justifyContent: 'flex-end', padding: '0 6cqw 8cqh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12cqh' }}>
        <span>KITE</span>
        <span>THIS SIDE UP</span>
      </div>
    </Face>
  )
}

/** The shoe box lid (330 × 210 mm). */
export function ShoeboxLid({ colourway: c }: { colourway: Colourway }) {
  return (
    <Face ground={c.ground} ink={c.ink} font={DISPLAY} style={{ padding: '6cqw 7cqw' }}>
      <div style={{ position: 'absolute', right: '-4cqw', top: '-6cqh', fontSize: '46cqh', lineHeight: 0.85, color: 'rgba(0,0,0,0.07)' }}>AERO</div>
      <KiteLogo size="9cqw" color={c.ink} />
      <Cut name={c.art} style={{ left: '20cqw', top: '22cqh', width: '74cqw', transform: 'rotate(-8deg)', filter: 'drop-shadow(0 2cqw 1.6cqw rgba(0,0,0,0.25))' }} />
      <div style={{ position: 'absolute', left: '7cqw', bottom: '8cqh', fontSize: '10cqw', lineHeight: 1 }}>AERO 2</div>
    </Face>
  )
}

/** The end of the box: the label the warehouse reads. */
export function ShoeboxLabel({ colourway: c }: { colourway: Colourway }) {
  return (
    <Face ground={c.ground} ink={c.ink} font={SANS} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '70cqw', height: '68cqh', background: '#fff', color: KITE.graphite, borderRadius: '1.5cqw', padding: '4cqh 4cqw', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: DISPLAY, fontSize: '8cqw', lineHeight: 1 }}>
          <span>AERO 2</span>
          <span>US 9</span>
        </div>
        <div style={{ fontSize: '3.6cqw', fontWeight: 700, marginTop: '3cqh' }}>{c.name} · KT-0219-{c.id === 'volt' ? '701' : c.id === 'sky' ? '402' : '806'}</div>
        <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5cqw', height: '22cqh' }}>
          {Array.from({ length: 38 }, (_, i) => (
            <div key={i} style={{ width: `${[0.4, 0.9, 0.3, 0.6, 1.1][i % 5]}cqw`, background: KITE.graphite }} />
          ))}
        </div>
      </div>
    </Face>
  )
}

export function ShoeboxSide({ colourway: c }: { colourway: Colourway }) {
  return (
    <Face ground={c.ground} ink={c.ink} font={DISPLAY} style={{ justifyContent: 'center', padding: '0 5cqw' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <KiteLogo size="15cqh" color={c.ink} />
        <span style={{ fontSize: '15cqh' }}>RUN LIGHTER</span>
      </div>
    </Face>
  )
}
