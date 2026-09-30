import * as React from 'react'
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'

/*
 * Screen content for the reel. Everything that moves reads Remotion's frame
 * (`useCurrentFrame()` works on the glass: the mockup bridges the page's
 * contexts into each screen's own React root), never a timer or a CSS
 * animation, which run on the browser's clock and would differ per render.
 */

export const SANS = '"Inter Variable", Inter, system-ui, sans-serif'
export const DISPLAY = '"Space Grotesk", "Inter Variable", system-ui, sans-serif'
export const MONO = '"JetBrains Mono", ui-monospace, monospace'

const fill: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  fontFamily: SANS,
  overflow: 'hidden',
}

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

/** A music player: spinning cover art, a live progress bar and a spectrum. */
export function MusicScreen({ accent = '#ff6b4a' }: { accent?: string }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame / fps
  const elapsed = 83 + t
  return (
    <div style={{ ...fill, background: 'linear-gradient(180deg, #2a1712 0%, #0d0a0a 70%)', color: '#fff', padding: '18% 9% 10%' }}>
      <div
        style={{
          aspectRatio: '1',
          borderRadius: 28,
          background: `conic-gradient(from ${t * 40}deg, ${accent}, #ffd166, #7b5cff, ${accent})`,
          boxShadow: `0 30px 60px ${accent}55`,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div style={{ width: '34%', aspectRatio: '1', borderRadius: '50%', background: '#0d0a0a', border: '10px solid rgba(255,255,255,.18)' }} />
      </div>
      <div style={{ marginTop: '11%', fontFamily: DISPLAY, fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em' }}>Afterglow Drive</div>
      <div style={{ marginTop: 6, fontSize: 20, opacity: 0.6 }}>The Parallax Club</div>
      <div style={{ marginTop: '9%', height: 6, borderRadius: 3, background: 'rgba(255,255,255,.18)' }}>
        <div style={{ width: `${(elapsed / 214) * 100}%`, height: '100%', borderRadius: 3, background: accent }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 16, opacity: 0.6, fontVariantNumeric: 'tabular-nums' }}>
        <span>{clock(elapsed)}</span>
        <span>-{clock(214 - elapsed)}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 6, marginTop: '8%' }}>
        {Array.from({ length: 18 }, (_, i) => {
          const h = 0.25 + 0.75 * Math.abs(Math.sin(t * (3 + (i % 5)) + i * 1.7))
          return <div key={i} style={{ flex: 1, height: `${h * 100}%`, borderRadius: 4, background: i % 3 ? accent : '#ffd166', opacity: 0.9 }} />
        })}
      </div>
    </div>
  )
}

const TILE_HUES = [12, 38, 200, 265, 150, 330, 55, 180, 290, 95, 20, 240]

/** A photo gallery whose grid scrolls: flat gradient tiles standing in for photos. */
export function GalleryScreen() {
  const frame = useCurrentFrame()
  const scroll = frame * 2.2
  return (
    <div style={{ ...fill, background: '#f6f3ee', color: '#1a1a1a', padding: '7% 5% 0' }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 44, fontWeight: 700, letterSpacing: '-0.03em' }}>Moments</div>
      <div style={{ fontSize: 18, opacity: 0.55, marginBottom: 18 }}>2,418 photos · synced</div>
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, transform: `translateY(${-scroll}px)`, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, alignContent: 'start' }}>
          {Array.from({ length: 64 }, (_, i) => {
            const hue = TILE_HUES[i % TILE_HUES.length]!
            const wide = i % 7 === 0
            return (
              <div
                key={i}
                style={{
                  gridColumn: wide ? 'span 2' : undefined,
                  aspectRatio: wide ? '2' : '1',
                  borderRadius: 10,
                  background: `linear-gradient(${(i * 47) % 360}deg, hsl(${hue} 75% 62%), hsl(${(hue + 40) % 360} 70% 38%))`,
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** An analytics dashboard: counters that count, a chart that draws itself. */
export function DashboardScreen({ compact = false }: { compact?: boolean }) {
  const frame = useCurrentFrame()
  const progress = interpolate(frame, [0, 70], [0, 1], { extrapolateRight: 'clamp' })
  const points = Array.from({ length: 24 }, (_, i) => 60 - 34 * Math.sin(i / 3.2) * (0.6 + i / 40) - i * 1.1)
  const path = points.map((y, i) => `${i ? 'L' : 'M'}${(i / 23) * 400},${y}`).join(' ')
  const kpis = [
    { label: 'Revenue', value: `$${Math.round(48210 * progress).toLocaleString('en-US')}`, delta: '+18.2%' },
    { label: 'Active users', value: Math.round(9312 * progress).toLocaleString('en-US'), delta: '+7.9%' },
    { label: 'Conversion', value: `${(4.8 * progress).toFixed(1)}%`, delta: '+0.6 pt' },
  ]
  return (
    <div style={{ ...fill, flexDirection: 'row', background: '#0f1117', color: '#e8eaf0' }}>
      {!compact && (
        <div style={{ width: '17%', background: '#151823', padding: '2.2% 1.6%', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 22, marginBottom: 12 }}>◆ Northwind</div>
          {['Overview', 'Customers', 'Revenue', 'Campaigns', 'Settings'].map((item, i) => (
            <div key={item} style={{ fontSize: 15, padding: '8px 12px', borderRadius: 8, background: i === 0 ? '#2a3050' : 'transparent', opacity: i === 0 ? 1 : 0.55 }}>
              {item}
            </div>
          ))}
        </div>
      )}
      <div style={{ flex: 1, padding: compact ? '8% 6%' : '2.4% 2.6%', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontFamily: DISPLAY, fontSize: compact ? 34 : 28, fontWeight: 700 }}>Overview</div>
        <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
          {kpis.map((kpi) => (
            <div key={kpi.label} style={{ background: '#181c28', borderRadius: 14, padding: '14px 18px' }}>
              <div style={{ fontSize: 14, opacity: 0.55 }}>{kpi.label}</div>
              <div style={{ fontSize: compact ? 34 : 30, fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{kpi.value}</div>
              <div style={{ fontSize: 13, color: '#3ddc97', marginTop: 2 }}>{kpi.delta}</div>
            </div>
          ))}
        </div>
        <div style={{ flex: 1, background: '#181c28', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 14, opacity: 0.55 }}>Weekly signups</div>
          <svg viewBox="0 0 400 100" preserveAspectRatio="none" style={{ flex: 1, width: '100%', marginTop: 8 }}>
            <defs>
              <linearGradient id="dash-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#7b8cff" stopOpacity="0.45" />
                <stop offset="1" stopColor="#7b8cff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${path} L400,100 L0,100 Z`} fill="url(#dash-fill)" opacity={progress} />
            <path d={path} fill="none" stroke="#7b8cff" strokeWidth={2.5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress} vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      </div>
    </div>
  )
}

/** An activity-ring watch face with a ticking clock. */
export function WatchScreen() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const seconds = 41 + frame / fps
  const rings = [
    { color: '#ff2d55', r: 40, value: interpolate(frame, [0, 60], [0.1, 0.86], { extrapolateRight: 'clamp' }) },
    { color: '#a4ff00', r: 30, value: interpolate(frame, [5, 65], [0.1, 0.64], { extrapolateRight: 'clamp' }) },
    { color: '#00e5ff', r: 20, value: interpolate(frame, [10, 70], [0.1, 0.93], { extrapolateRight: 'clamp' }) },
  ]
  return (
    <div style={{ ...fill, background: '#000', color: '#fff', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#ff9f0a' }}>
        10:{String(Math.floor(seconds / 60) + 9).padStart(2, '0')}
        <span style={{ fontSize: 16, opacity: 0.8 }}>:{String(Math.floor(seconds % 60)).padStart(2, '0')}</span>
      </div>
      <svg viewBox="0 0 100 100" style={{ width: '70%', marginTop: 4 }}>
        {rings.map((ring) => (
          <g key={ring.r} transform="rotate(-90 50 50)">
            <circle cx={50} cy={50} r={ring.r} fill="none" stroke={ring.color} strokeOpacity={0.2} strokeWidth={8} />
            <circle cx={50} cy={50} r={ring.r} fill="none" stroke={ring.color} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={`${ring.value} 1`} />
          </g>
        ))}
      </svg>
    </div>
  )
}

/** A tablet calendar/board for the ensemble scene. */
export function PlannerScreen() {
  const frame = useCurrentFrame()
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  const cards = [
    { day: 0, top: 8, h: 18, color: '#ffb4a2', text: 'Design review' },
    { day: 1, top: 30, h: 26, color: '#b8e0d2', text: 'Launch prep' },
    { day: 2, top: 12, h: 14, color: '#cdb4db', text: 'Standup' },
    { day: 3, top: 44, h: 22, color: '#ffd6a5', text: 'User interviews' },
    { day: 4, top: 20, h: 30, color: '#a2d2ff', text: 'Ship it 🚀' },
  ]
  return (
    <div style={{ ...fill, background: '#fbfaf7', color: '#1d1d1f', padding: '4% 4% 3%' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 40, fontWeight: 700, letterSpacing: '-0.03em' }}>Launch week</div>
        <div style={{ fontSize: 18, opacity: 0.5 }}>Oct 5 – 9</div>
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginTop: 18 }}>
        {days.map((day, d) => (
          <div key={day} style={{ position: 'relative', background: '#f0eee9', borderRadius: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600, padding: '10px 12px', opacity: 0.6 }}>{day}</div>
            {cards
              .filter((card) => card.day === d)
              .map((card) => {
                const appear = interpolate(frame, [card.day * 8, card.day * 8 + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
                return (
                  <div
                    key={card.text}
                    style={{
                      position: 'absolute',
                      left: 8,
                      right: 8,
                      top: `${card.top + 8}%`,
                      height: `${card.h}%`,
                      borderRadius: 10,
                      background: card.color,
                      padding: 10,
                      fontSize: 15,
                      fontWeight: 600,
                      opacity: appear,
                      transform: `translateY(${(1 - appear) * 20}px)`,
                    }}
                  >
                    {card.text}
                  </div>
                )
              })}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Record label art (a 166 px region); the record turns, so the label does too. */
export function RecordLabel() {
  return (
    <div style={{ ...fill, alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, #ffd23e 0 30%, #ff3d8b 30% 62%, #7048e8 62%)', color: '#1b1033' }}>
      <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em', position: 'absolute', top: '16%' }}>SIDE A</div>
      <div style={{ fontFamily: MONO, fontSize: 11, position: 'absolute', bottom: '14%', color: '#fff' }}>33⅓ RPM</div>
    </div>
  )
}

/** A record sleeve. */
export function SleeveArt() {
  return (
    <div style={{ ...fill, background: '#1b1033', color: '#fff', padding: '9%' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-radial-gradient(circle at 70% 70%, #ff3d8b 0 14px, #1b1033 14px 30px)', opacity: 0.85 }} />
      <div style={{ position: 'relative', fontFamily: DISPLAY, fontWeight: 700, fontSize: 64, lineHeight: 0.9, letterSpacing: '-0.04em' }}>
        Afterglow
        <br />
        Drive
      </div>
      <div style={{ position: 'relative', fontFamily: MONO, fontSize: 18, marginTop: 14, color: '#ffd23e' }}>THE PARALLAX CLUB · LP</div>
    </div>
  )
}

/** A book jacket. */
export function BookCover() {
  return (
    <div style={{ ...fill, background: '#10203a', color: '#f5efe2', padding: '12% 10%' }}>
      <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: '0.2em', opacity: 0.7 }}>A NOVEL</div>
      <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 104, lineHeight: 0.92, letterSpacing: '-0.04em', marginTop: '14%' }}>
        The
        <br />
        Quiet
        <br />
        Orbit
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ height: 8, background: 'linear-gradient(90deg, #ff6b4a, #ffd166, #3eecff)' }} />
      <div style={{ fontSize: 28, marginTop: 24 }}>Mara Ellison</div>
    </div>
  )
}

/** A product box's front panel. */
export function BoxArt() {
  return (
    <div style={{ ...fill, background: '#f4f1ea', color: '#232529', padding: '10%', alignItems: 'flex-start' }}>
      <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 88, letterSpacing: '-0.04em', lineHeight: 0.9 }}>
        orbit
        <span style={{ color: '#d7263d' }}>.</span>
      </div>
      <div style={{ fontSize: 26, marginTop: 12, opacity: 0.7 }}>wireless earbuds</div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 14 }}>
        {['#d7263d', '#1b6ca8', '#f7b32b'].map((c) => (
          <div key={c} style={{ width: 56, height: 56, borderRadius: '50%', background: c }} />
        ))}
      </div>
    </div>
  )
}
