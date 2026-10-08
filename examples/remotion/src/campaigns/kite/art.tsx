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

/**
 * The mark: a kite and its tail. The four panels are cut apart where the
 * spars cross, a clear gap rather than a darker line, so the mark is one
 * colour and reads on any ground. Each panel is the diamond's quarter pulled
 * back 0.7 from both spars (the outer edges cut where they meet the gap).
 */
export function KiteGlyph({ size, color, tail = true }: { size: number | string; color: string; tail?: boolean }) {
  return (
    <svg viewBox="0 0 24 32" style={{ width: size, height: 'auto', display: 'block', flex: 'none' }} aria-hidden>
      <path
        d="M11.3 1.7 2.7 10.3H11.3ZM12.7 1.7 21.3 10.3H12.7ZM12.7 11.7H21.42L12.7 22.16ZM11.3 11.7H2.58L11.3 22.16Z"
        fill={color}
      />
      {tail && <path d="M12 23.2c-2 1.8 2 2.8 0 4.8s2 3 0 4" stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" />}
    </svg>
  )
}

/**
 * The lock-up: the outro's kite, spars and tail, beside the word - its diamond
 * level with the capitals and the tail hanging below the line, so at any size
 * it reads as a kite rather than a bullet.
 */
export function KiteLogo({ size, color, glyph }: { size: number | string; color: string; glyph?: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'flex-start', gap: '0.16em', fontFamily: DISPLAY, fontSize: size, letterSpacing: '0.02em', lineHeight: 1, color }}>
      <span style={{ display: 'block', marginTop: '0.02em', marginBottom: '-0.42em' }}>
        <KiteGlyph size="0.8em" color={glyph ?? color} />
      </span>
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
          <KiteGlyph size={13} color={KITE.graphite} />
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

/**
 * The shipper's lid, black corrugated with volt ink. The packing tape runs
 * across the middle of the lid, so the print is laid out around it: the mark
 * above the tape and the line below it, with the band between left clear.
 */
export function MailerLid() {
  return (
    <Face ink={KITE.volt} font={DISPLAY} style={{ alignItems: 'center', justifyContent: 'space-between', padding: '9cqh 0 10cqh' }}>
      <KiteLogo size="13cqw" color={KITE.volt} />
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: '3.4cqw', letterSpacing: '-0.01em' }}>Handle like a personal best.</div>
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

/**
 * Print on a shoe box's coated board, laid over a face's artwork: the board's
 * fine tooth, the face's place in the light (`shade`, from none on the lid to
 * the most on an end) darkening toward its lower edge, and the creases - the
 * board catches the light where a fold rounds it and dips just inside. Without
 * it a face is a flat screen of colour with type on it; with it, ink on board.
 */
function OnCoated({ shade, lit = false }: { shade: number; lit?: boolean }) {
  return (
    <>
      <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'overlay', opacity: 0.5 }}>
        <filter id="kite-board-tooth">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={4} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#kite-board-tooth)" />
      </svg>
      <div aria-hidden style={{ position: 'absolute', inset: 0, mixBlendMode: 'multiply', background: `linear-gradient(180deg, rgba(0,0,0,${shade * 0.55}) 0%, rgba(0,0,0,${shade}) 100%)` }} />
      {/* the face toward the light takes a soft fall of it across one corner */}
      {lit ? <div aria-hidden style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', background: 'linear-gradient(140deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 50%)' }} /> : null}
      <div aria-hidden style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 0.3cqmin rgba(255,255,255,0.2), inset 0 0 2.6cqmin rgba(0,0,0,0.16)' }} />
    </>
  )
}

/** A printed photograph: matte, a touch less saturated than the screen's, and casting no shadow. */
const PRINTED: React.CSSProperties = { filter: 'saturate(0.9) contrast(0.96)' }

/** How deep the lid's rim comes down the walls: a third of the box's 120 mm. */
const RIM = '34cqh'

/**
 * The shoe box lid (330 × 210 mm): the colourway flooded edge to edge with a
 * tone-on-tone run of speed lines, the kite and the specs along the top, the
 * shoe across the middle, and the name set big in the colourway's deeper tone,
 * bleeding off the bottom right.
 */
export function ShoeboxLid({ colourway: c }: { colourway: Colourway }) {
  return (
    <Face ground={c.ground} ink={c.ink} font={DISPLAY} style={{ padding: '6.5cqw 7cqw' }}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(118deg, rgba(0,0,0,0.045) 0 0.9cqw, transparent 0.9cqw 3.2cqw)' }} />
      <div aria-hidden style={{ position: 'absolute', right: '-3cqw', bottom: '-9cqh', fontSize: '50cqh', lineHeight: 0.8, color: c.deep }}>AERO 2</div>
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <KiteLogo size="8cqw" color={c.ink} />
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: '2.4cqw', lineHeight: 1.35, textAlign: 'right', letterSpacing: '-0.01em' }}>
          Road running
          <br />
          212 g · 6 mm drop
        </div>
      </div>
      <Cut name={c.art} style={{ left: '24cqw', top: '17cqh', width: '58cqw', transform: 'rotate(-7deg)', ...PRINTED }} />
      <div style={{ marginTop: 'auto', position: 'relative' }}>
        <div style={{ fontSize: '9cqw', lineHeight: 0.9 }}>AERO 2</div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: '2.4cqw', marginTop: '1.2cqw', letterSpacing: '-0.01em' }}>Run lighter.</div>
      </div>
      <OnCoated shade={0} lit />
    </Face>
  )
}

/**
 * A wall of the box, long or short: the lid's rim across the top third, in the
 * colourway, casting a hairline of shadow on the graphite base below it - the
 * two-piece box every pair of shoes comes in - and the base's own print under
 * that. The long walls name the shoe; the ends carry the warehouse label.
 */
function ShoeboxWall({ colourway: c, end, shade }: { colourway: Colourway; end: boolean; shade: number }) {
  const sku = `KT-0219-${c.id === 'volt' ? '701' : c.id === 'sky' ? '402' : '806'}`
  return (
    <Face ground={KITE.graphite} ink={c.ground} font={DISPLAY}>
      <div style={{ height: RIM, flex: 'none', background: c.ground, color: c.ink, display: 'flex', alignItems: 'center', justifyContent: end ? 'center' : 'space-between', padding: '0 5cqw', boxSizing: 'border-box' }}>
        <KiteLogo size="17cqh" color={c.ink} />
        {end ? null : <span style={{ fontSize: '15cqh' }}>RUN LIGHTER</span>}
      </div>
      {/* the rim's edge stands a board's thickness proud of the base: a lit lip, then its shadow */}
      <div aria-hidden style={{ height: '0.8cqh', flex: 'none', background: 'rgba(255,255,255,0.35)', mixBlendMode: 'screen' }} />
      <div aria-hidden style={{ height: '7cqh', marginBottom: '-7cqh', flex: 'none', position: 'relative', background: 'linear-gradient(180deg, rgba(0,0,0,0.7), rgba(0,0,0,0))' }} />
      {end ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '64cqw', height: '46cqh', background: '#f4f3ee', color: KITE.graphite, borderRadius: '1cqw', padding: '3.5cqh 4cqw', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', fontFamily: SANS }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: DISPLAY, fontSize: '7cqw', lineHeight: 1 }}>
              <span>AERO 2</span>
              <span>US 9</span>
            </div>
            <div style={{ fontSize: '3cqw', fontWeight: 700, marginTop: '1.6cqh' }}>
              {c.name} · {sku}
            </div>
            <div style={{ marginTop: 'auto', display: 'flex', gap: '0.45cqw', height: '13cqh' }}>
              {Array.from({ length: 36 }, (_, i) => (
                <div key={i} style={{ width: `${[0.35, 0.8, 0.3, 0.55, 1][i % 5]}cqw`, background: KITE.graphite }} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 5cqw' }}>
          <span style={{ fontSize: '30cqh', lineHeight: 0.9 }}>AERO 2</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2.4cqw', fontFamily: SANS, fontWeight: 700, fontSize: '7cqh', color: KITE.chalk, letterSpacing: '-0.01em' }}>
            <span>{c.name} · Road running</span>
            <span style={{ display: 'flex', gap: '0.8cqw' }}>
              {COLOURWAYS.map((w) => (
                <span key={w.id} style={{ width: '6cqh', height: '6cqh', borderRadius: '50%', background: w.ground, boxShadow: w.id === c.id ? `0 0 0 0.6cqh ${KITE.chalk}` : undefined }} />
              ))}
            </span>
          </div>
        </div>
      )}
      <OnCoated shade={shade} />
    </Face>
  )
}

/** A long wall (330 × 120 mm). */
export function ShoeboxSide({ colourway }: { colourway: Colourway }) {
  return <ShoeboxWall colourway={colourway} end={false} shade={0.14} />
}

/** A short wall (210 × 120 mm), with the label the warehouse reads. */
export function ShoeboxLabel({ colourway }: { colourway: Colourway }) {
  return <ShoeboxWall colourway={colourway} end shade={0.26} />
}
