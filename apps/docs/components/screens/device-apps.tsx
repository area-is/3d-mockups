'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useSurfaceOptional } from 'react-3d-mockups'
import { damier, gyre, halftone, ortho } from 'tabbied/patterns'
import { FONT, Pattern } from './swiss-art'
import { Photo, SERIF } from './label-art'
import { asset } from '@/lib/base-path.mjs'

/**
 * Three of the device screens carry a real product rather than a poster: a
 * watch face laid out for a round display, a studio's website on the laptop,
 * and a digital newspaper across the Fold's two pages. They are ordinary
 * React components - which is the point of a live DOM screen - and the
 * newspaper's photographs are generated (see `/art/news-*.webp`).
 *
 * No headings or landmarks, in these or any of the screen art: every tag here
 * lands in the host page's DOM. Set as `<h1>`/`<article>`/`<nav>`, the laptop's
 * headline became a second `<h1>` on the home page and the newspaper its main
 * `<article>` - for crawlers and reader modes, which the library's
 * `aria-hidden` on the screen does not reach. The type is all inline-styled,
 * so plain `div`s set identically.
 */

/* ------------------------------------------------------------------ */
/*  Galaxy Watch                                                       */
/* ------------------------------------------------------------------ */

/**
 * A watch face for a round display: activity rings around the rim, the time
 * dead centre, the date above it and three complications below. Everything
 * sits inside the inscribed circle - a 240 px dial has no corners, so nothing
 * is set where a corner would be. Measurements are in `cqw` against the dial.
 */
export function WatchFace() {
  const rings = [
    { r: 44, pct: 0.72, color: '#3ddc84' },
    { r: 39, pct: 0.46, color: '#5ec8ff' },
    { r: 34, pct: 0.88, color: '#ff6b8b' },
  ]
  const stat = (value: string, label: string, color: string) => (
    <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
      <span style={{ fontSize: '6cqw', fontWeight: 700, color, letterSpacing: '-0.02em' }}>{value}</span>
      <span style={{ fontSize: '3.2cqw', fontWeight: 600, letterSpacing: '-0.01em', opacity: 0.6, marginTop: '1.4cqw' }}>{label}</span>
    </div>
  )
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        containerType: 'size',
        position: 'relative',
        background: '#000000',
        color: '#ffffff',
        fontFamily: FONT,
        borderRadius: '50%',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <style>{`@keyframes watch-ring-in { from { stroke-dashoffset: var(--c); } }`}</style>
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }} aria-hidden>
        {rings.map(({ r, pct, color }) => {
          const c = 2 * Math.PI * r
          return (
            <g key={r}>
              <circle cx={50} cy={50} r={r} fill="none" stroke={color} strokeOpacity={0.2} strokeWidth={3.6} />
              <circle
                cx={50}
                cy={50}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={3.6}
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={c * (1 - pct)}
                style={{ ['--c' as string]: c, animation: 'watch-ring-in 1.4s cubic-bezier(0.2, 0.7, 0.2, 1) both' }}
              />
            </g>
          )
        })}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: '4.4cqw', fontWeight: 600, letterSpacing: '-0.01em', opacity: 0.65 }}>Mon 14</span>
        <span style={{ fontSize: '21cqw', fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 0.95, marginTop: '1cqw' }}>9:41</span>
        <div style={{ display: 'flex', gap: '6cqw', marginTop: '4.5cqw' }}>
          {stat('72', 'BPM', '#ff6b8b')}
          {stat('6,842', 'STEPS', '#3ddc84')}
          {stat('68°', 'SUNNY', '#5ec8ff')}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  MacBook Air                                                        */
/* ------------------------------------------------------------------ */

const SITE_INK = '#141414'
const SITE_PAPER = '#f4f2ec'
const SITE_ACCENT = '#e1341e'
const SITE_MUTED = '#6b6963'

/**
 * A design studio's website: a strict grid, one typeface set tight, one
 * accent, and the studio's generative pieces doing the work photography
 * would. The hero pattern is live - it reseeds itself - because this is a
 * screen and the page is here to say so.
 */
export function SwissSite() {
  const cards: [typeof damier, string, string, string, string, string][] = [
    [damier, 'kunsthalle', 'Kunsthalle Basel', 'Identity system · 2026', '#e6f0ee', '#0f8b8d'],
    [ortho, 'meridian', 'Meridian Transit', 'Wayfinding · 2025', '#f1e6d8', '#ff6a1a'],
    [halftone, 'niggli', 'Verlag Niggli', 'Editorial design · 2025', '#e9e4f2', '#5b3fa0'],
  ]
  const link: CSSProperties = { fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        background: SITE_PAPER,
        color: SITE_INK,
        fontFamily: FONT,
        letterSpacing: '-0.015em',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '22px 48px',
          borderBottom: `1px solid ${SITE_INK}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700, fontSize: 19, letterSpacing: '-0.035em' }}>
          <span style={{ width: 14, height: 14, background: SITE_ACCENT, display: 'inline-block' }} />
          Raster Studio
        </div>
        <div style={{ display: 'flex', gap: 34, fontSize: 15, fontWeight: 500 }}>
          <span style={{ borderBottom: `2px solid ${SITE_INK}`, paddingBottom: 2 }}>Work</span>
          <span>Studio</span>
          <span>Journal</span>
          <span>Contact</span>
        </div>
        <span
          style={{
            background: SITE_INK,
            color: SITE_PAPER,
            fontSize: 14,
            fontWeight: 600,
            padding: '9px 16px',
            borderRadius: 999,
          }}
        >
          Start a project →
        </span>
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 48, padding: '52px 48px 40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'baseline', fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>
            <span style={{ color: SITE_ACCENT }}>01</span>
            <span style={{ color: SITE_MUTED }}>Design studio · Zürich — Lisbon</span>
          </div>
          <div style={{ margin: '22px 0 24px', fontSize: 76, lineHeight: 0.97, fontWeight: 700, letterSpacing: '-0.045em', color: SITE_INK }}>
            Systems that make good work inevitable.
          </div>
          <p style={{ margin: 0, maxWidth: 540, fontSize: 19, lineHeight: 1.45, color: '#3a3833' }}>
            We design identities, interfaces and the grids underneath them, for teams who would rather ship one
            coherent thing than a hundred clever ones.
          </p>
          <div style={{ marginTop: 'auto', display: 'flex', gap: 28, paddingTop: 24 }}>
            <span style={link}>Selected work →</span>
            <span style={{ ...link, color: SITE_MUTED }}>How we work →</span>
          </div>
        </div>
        <div style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', background: SITE_INK, minHeight: 300 }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            <Pattern pattern={gyre} live palette={[SITE_INK, SITE_PAPER, SITE_ACCENT]} grid="6x9" />
          </div>
          <span
            style={{
              position: 'absolute',
              left: 16,
              bottom: 14,
              color: SITE_PAPER,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              opacity: 0.85,
            }}
          >
            Fig. 01 — Rotation study
          </span>
        </div>
      </section>

      <section style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, padding: '0 48px' }}>
        {cards.map(([pattern, seed, title, meta, ground, accent]) => (
          <div key={seed} style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
            <div style={{ flex: 1, minHeight: 0, borderRadius: 6, overflow: 'hidden', background: ground }}>
              <Pattern pattern={pattern} seed={`raster-${seed}`} palette={[ground, SITE_INK, accent]} grid="4x6" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 14 }}>
              <strong style={{ fontWeight: 600 }}>{title}</strong>
              <span style={{ color: SITE_MUTED }}>{meta}</span>
            </div>
          </div>
        ))}
      </section>

      <footer style={{ display: 'flex', justifyContent: 'space-between', padding: '22px 48px 24px', fontSize: 13, color: SITE_MUTED }}>
        <span>© 2026 Raster Studio · Zürich — Lisbon</span>
        <span>Instagram · Are.na · Newsletter</span>
      </footer>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Galaxy Z Fold                                                      */
/* ------------------------------------------------------------------ */

const NEWS_INK = '#161616'
const NEWS_PAPER = '#f7f5f0'
const NEWS_MUTED = '#5e5b55'
const NEWS_RED = '#b3261e'

interface Story {
  kicker: string
  title: string
  standfirst: string
  byline: string
  photo: string
  position?: string
}

const SECOND: Story[] = [
  {
    kicker: 'Environment',
    title: 'Volunteers return four hundred rescued turtles to the surf',
    standfirst: 'After a cold snap stranded them along the cape, the last of the rehabilitated ridleys went back into the Atlantic at first light.',
    byline: 'Priya Desai',
    photo: asset('/art/news-turtle.webp'),
    position: '50% 60%',
  },
  {
    kicker: 'Culture',
    title: 'After thirty years, the Aldous Quartet plays its last residency',
    standfirst: 'The ensemble that turned a shipyard hall into a concert venue bows out with the complete Beethoven cycle.',
    byline: 'Tomas Brandt',
    photo: asset('/art/news-quartet.webp'),
  },
  {
    kicker: 'Sport',
    title: 'Breakaway holds on the final climb as Marchetti takes the stage',
    standfirst: 'The 24-year-old survived a late chase to win alone on the Col de Vars and move into third overall.',
    byline: 'Leila Haddad',
    photo: asset('/art/news-cycling.webp'),
  },
]

const MOST_READ = [
  'Why the city’s rents fell for the first time in nine years',
  'The quiet return of the neighbourhood bakery',
  'Opinion: A tram is a promise kept, and that is rarer than it should be',
  'Weekend weather: the last warm days of the year',
]

/** A hairline in the paper's ink, at the weights a broadsheet uses. */
const rule = (weight = 1): CSSProperties => ({ borderTop: `${weight}px solid ${NEWS_INK}` })

function Kicker({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 700, color: NEWS_RED, letterSpacing: '-0.01em' }}>{children}</div>
  )
}

const SECTIONS = ['World', 'Politics', 'Business', 'Science', 'Culture', 'Sport', 'Opinion', 'Puzzles']

/** Below this width (CSS px) the paper is a phone's: one column, not two pages. */
const TWO_PAGES = 560

/**
 * The morning paper on the Fold. Open, it is two pages: masthead and section
 * bar across both, the lead story with its photograph on the left page, three
 * shorter pieces with thumbnails, the most-read list and the markets on the
 * right, with a gutter down the middle so the crease falls between the pages
 * the way it does in a folded newspaper. Shut, the same paper is on the cover
 * display, a phone's width, so it is laid out the way the paper's app lays it
 * out on a phone: one column, the section bar running off the edge to scroll.
 */
export function Newspaper() {
  // Off a device (the docs render it flat too) there is no surface: two pages.
  const pages = (useSurfaceOptional()?.width ?? Infinity) >= TWO_PAGES
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        background: NEWS_PAPER,
        color: NEWS_INK,
        fontFamily: FONT,
        display: 'flex',
        flexDirection: 'column',
        padding: pages ? '54px 28px 22px' : '0 18px 16px',
        // The Fold draws One UI's bar over the top of each display; this
        // clears the band it actually occupies rather than a number tuned to
        // one variant. `0px` off a device, where this also renders.
        paddingTop: `calc(var(--mockup-safe-area-top, 0px) + ${pages ? 18 : 10}px)`,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 10.5, letterSpacing: 0, color: NEWS_MUTED, whiteSpace: 'nowrap' }}>
        <span>{pages ? 'Tuesday, September 15, 2026 · Morning edition' : 'Tuesday, September 15'}</span>
        <span>{pages ? 'Partly sunny · 68° / 54° · Sign in' : '68° / 54°'}</span>
      </div>
      <div style={{ ...rule(2), borderBottom: `1px solid ${NEWS_INK}`, marginTop: 8, padding: pages ? '10px 0 9px' : '8px 0 7px', textAlign: 'center' }}>
        <div style={{ fontFamily: SERIF, fontSize: pages ? 58 : 40, lineHeight: 1, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
          The Meridian
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: pages ? 'space-between' : 'flex-start',
          gap: pages ? 0 : 16,
          padding: '8px 2px',
          borderBottom: `1px solid ${NEWS_INK}`,
          fontSize: 11.5,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          // On a phone the bar is wider than the screen and scrolls; the fade
          // says there is more of it.
          ...(pages ? {} : { maskImage: 'linear-gradient(90deg, #000 82%, transparent)' }),
        }}
      >
        {SECTIONS.map((section) => (
          <span key={section} style={{ flex: 'none', ...(section === 'World' ? { color: NEWS_RED } : {}) }}>
            {section}
          </span>
        ))}
      </div>

      {pages ? (
        /* One row, pinned to the page: the lead's body runs off the foot of
           the page the way a jump story does, rather than pushing the row
           taller than the screen and the markets strip off it. */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'minmax(0, 1fr)', columnGap: 46, flex: 1, minHeight: 0, paddingTop: 16 }}>
          {/* the left page: the lead */}
          <div style={{ minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
            <Lead columns={2} />
          </div>
          {/* the right page: the shorts, the list, the markets */}
          <div style={{ minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Shorts thumb={120} />
            <MostRead />
            <Markets />
          </div>
        </div>
      ) : (
        /* One column, running off the foot of the screen the way a feed does. */
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', paddingTop: 14 }}>
          <Lead columns={1} />
          <div style={{ ...rule(1), marginTop: 14, paddingTop: 12 }}>
            <Shorts thumb={92} />
          </div>
        </div>
      )}
    </div>
  )
}

/** The lead: photograph, headline, standfirst, and the body in `columns` columns. */
function Lead({ columns }: { columns: 1 | 2 }) {
  const wide = columns === 2
  return (
    <>
      <div style={{ height: wide ? 222 : 196, overflow: 'hidden' }}>
        <Photo src={asset('/art/news-lead.webp')} position="50% 45%" />
      </div>
      <div style={{ fontSize: 10.5, lineHeight: 1.35, color: NEWS_MUTED, marginTop: 6 }}>
        The first eastbound tram crosses Founders Bridge at 6:12 a.m. Photograph: Ana Ferreira for The Meridian
      </div>
      <div style={{ marginTop: 14 }}>
        <Kicker>Transit</Kicker>
      </div>
      <div style={{ fontFamily: SERIF, fontWeight: 400, fontSize: wide ? 33 : 27, lineHeight: 1.08, letterSpacing: '-0.012em', margin: '6px 0 10px', color: NEWS_INK }}>
        City&rsquo;s first light-rail line opens to dawn crowds and a decade of promises
      </div>
      <p style={{ fontFamily: SERIF, fontSize: wide ? 14.5 : 15, lineHeight: 1.4, color: '#33312c', margin: '0 0 9px' }}>
        Twelve years after the referendum, the Green Line carried 41,000 riders on its first morning. The
        second phase breaks ground in spring.
      </p>
      <div style={{ fontSize: 11, color: NEWS_MUTED, marginBottom: 10 }}>
        By <strong style={{ color: NEWS_INK, fontWeight: 600 }}>Marcus Ellery</strong> · 7 min read
      </div>
      <div style={{ columnCount: columns, columnGap: 16, fontSize: wide ? 11.5 : 13, lineHeight: 1.5, textAlign: 'justify', hyphens: 'auto' }}>
        <p style={{ margin: 0 }}>
          <span style={{ fontFamily: SERIF, fontSize: wide ? 34 : 38, float: 'left', lineHeight: 0.8, paddingRight: 6, paddingTop: 4 }}>T</span>
          he first eastbound tram left Founders Bridge at 6:12 a.m. with every seat taken and a small crowd
          applauding from the platform, and by the time the morning rush had thinned the transit authority
          was reporting ridership at roughly double its opening-day forecast.
        </p>
        <p style={{ margin: '8px 0 0' }}>
          The 14-kilometre line, approved by voters in 2014 and delayed twice by funding disputes, links the
          university district with the riverfront and the regional rail hub. Trains run every six minutes at
          peak and every twelve off-peak, and the first month of fares has been waived.
        </p>
        <p style={{ margin: '8px 0 0' }}>
          &ldquo;It is not a monument, it is a timetable,&rdquo; said transit director Hana Okafor, who rode
          the first service. &ldquo;Judge it in a year, when it is just how people get to work.&rdquo; A second
          phase north to the hospital campus is due to start construction in April.
        </p>
      </div>
    </>
  )
}

/** The three shorter pieces, each with a `thumb`-px-wide photograph. */
function Shorts({ thumb }: { thumb: number }) {
  return (
    <>
      {SECOND.map((story) => (
        <div
          key={story.title}
          style={{ display: 'grid', gridTemplateColumns: `1fr ${thumb}px`, gap: 14, paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid #d6d1c6' }}
        >
          <div style={{ minWidth: 0 }}>
            <Kicker>{story.kicker}</Kicker>
            <div style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 18, lineHeight: 1.15, letterSpacing: '-0.01em', margin: '4px 0 5px', color: NEWS_INK }}>
              {story.title}
            </div>
            <p style={{ margin: 0, fontSize: 11, lineHeight: 1.38, color: '#33312c' }}>{story.standfirst}</p>
            <div style={{ fontSize: 10.5, color: NEWS_MUTED, marginTop: 5 }}>By {story.byline}</div>
          </div>
          <div style={{ height: Math.round(thumb * 0.78), overflow: 'hidden' }}>
            <Photo src={story.photo} position={story.position} />
          </div>
        </div>
      ))}
    </>
  )
}

function MostRead() {
  return (
    <div>
      <div style={{ ...rule(2), paddingTop: 8, fontSize: 11, fontWeight: 700, letterSpacing: '-0.01em' }}>Most read</div>
      <ol style={{ margin: '6px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 5 }}>
        {MOST_READ.map((item, i) => (
          <li key={item} style={{ display: 'flex', gap: 10, fontSize: 12, lineHeight: 1.3 }}>
            <span style={{ fontFamily: SERIF, fontSize: 18, lineHeight: 1, color: NEWS_RED, flex: 'none', width: 14 }}>{i + 1}</span>
            <span style={{ fontFamily: SERIF }}>{item}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Markets() {
  return (
    <div style={{ marginTop: 'auto', ...rule(1), paddingTop: 7, display: 'flex', justifyContent: 'space-between', fontSize: 10.5, letterSpacing: '0.02em' }}>
      <span>
        S&amp;P 500 <strong style={{ color: '#1a7f4b' }}>+0.4%</strong>
      </span>
      <span>
        Nasdaq <strong style={{ color: '#1a7f4b' }}>+0.7%</strong>
      </span>
      <span>10-yr 4.02%</span>
      <span>EUR/USD 1.09</span>
      <span>
        Brent <strong style={{ color: NEWS_RED }}>−1.1%</strong>
      </span>
    </div>
  )
}
