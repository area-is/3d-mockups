'use client'

/**
 * Full-bleed artwork for the object mockups (book, magazine, brochure, card,
 * poster, billboard, van). Self-contained inline styles so the demos don't
 * lean on page CSS — each component fills its live surface with width/height
 * 100%.
 */

const serif = 'Georgia, "Times New Roman", serif'

/** Hardcover novel jacket. */
export function BookCoverArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: 28,
        background: 'linear-gradient(160deg, #16324a 0%, #0d1f30 55%, #0a1622 100%)',
        color: '#e8dcc0',
        fontFamily: serif,
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'center',
      }}
    >
      <div style={{ border: '1px solid #b89b5e', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 20px 28px' }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: '#b89b5e' }}>A NOVEL</div>
        {/* explicit color: the docs site's global heading styles would
            otherwise override the cover's inherited cream and render the
            title near-black on the navy jacket */}
        <h1 style={{ fontSize: 44, lineHeight: 1.15, fontWeight: 500, margin: '26px 0 0', color: '#e8dcc0' }}>
          The Atlas of Quiet Places
        </h1>
        <svg width="86" height="86" viewBox="0 0 86 86" style={{ margin: 'auto 0' }} aria-hidden>
          <circle cx="43" cy="43" r="34" fill="none" stroke="#b89b5e" strokeWidth="1.5" />
          <path d="M43 13v60M13 43h60M22 22l42 42M64 22L22 64" stroke="#b89b5e" strokeWidth="0.8" />
          <circle cx="43" cy="43" r="5" fill="#b89b5e" />
        </svg>
        <div style={{ fontSize: 15, letterSpacing: 5 }}>MIRA HALVORSEN</div>
      </div>
    </div>
  )
}

/** Glossy monthly cover. */
export function MagazineCoverArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: 24,
        background: 'radial-gradient(120% 90% at 80% 20%, #ff7a3c 0%, #e6453a 40%, #8f1d4e 100%)',
        color: '#fff7ef',
        fontFamily: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <svg viewBox="0 0 100 100" aria-hidden style={{ position: 'absolute', right: -60, bottom: -40, width: 300, height: 300, opacity: 0.35 }}>
        <circle cx="50" cy="50" r="46" fill="none" stroke="#ffd9a8" strokeWidth="0.7" />
        <circle cx="50" cy="50" r="34" fill="none" stroke="#ffd9a8" strokeWidth="0.7" />
        <circle cx="50" cy="50" r="22" fill="none" stroke="#ffd9a8" strokeWidth="0.7" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -2 }}>AREA</div>
        <div style={{ fontSize: 12, letterSpacing: 2 }}>NO. 07 — JUL 2026</div>
      </div>
      <div style={{ fontSize: 13, letterSpacing: 3, marginTop: -6 }}>THE DESIGN QUARTERLY</div>
      <div style={{ marginTop: 'auto', display: 'grid', gap: 10, maxWidth: '70%' }}>
        <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>Print is a live surface now</div>
        <div style={{ fontSize: 14, opacity: 0.9 }}>Mockups that click · 3D on the newsstand · 24 pages of type</div>
      </div>
    </div>
  )
}

/**
 * Spine strip matching the cover — the DOM's left edge lands at the
 * spine's TOP, so this row reads top-to-bottom on the shelf.
 */
export function MagazineSpineArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: '0 26px',
        background: 'linear-gradient(90deg, #8f1d4e 0%, #e6453a 55%, #ff7a3c 100%)',
        color: '#fff7ef',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
      }}
    >
      <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: 1, whiteSpace: 'nowrap' }}>AREA</div>
      <div style={{ fontSize: 14, letterSpacing: 5, opacity: 0.85, whiteSpace: 'nowrap' }}>THE DESIGN QUARTERLY · PRINT IS A LIVE SURFACE NOW</div>
      <div style={{ fontSize: 14, letterSpacing: 2, whiteSpace: 'nowrap' }}>NO. 07 — JUL 2026</div>
    </div>
  )
}

/** Tri-fold panel 1 — the front. */
export function BrochureFrontArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: 22,
        background: 'linear-gradient(180deg, #1d4433 0%, #143126 70%, #0e241c 100%)',
        color: '#f0ead6',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: 3 }}>RIDGELINE NATIONAL PARK</div>
      <svg viewBox="0 0 100 44" aria-hidden style={{ width: '100%', marginTop: 'auto' }}>
        <path d="M0 40 L22 12 L34 26 L52 4 L70 30 L82 18 L100 40" fill="none" stroke="#e8b64c" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="78" cy="8" r="5" fill="#f0ead6" />
      </svg>
      <h2 style={{ fontSize: 34, lineHeight: 1.05, margin: '14px 0 8px', fontWeight: 700, color: '#f0ead6' }}>
        Trail Guide
      </h2>
      <div style={{ fontSize: 12, opacity: 0.85 }}>2026 season · free map inside</div>
    </div>
  )
}

/** Tri-fold panel 2 — the trail list. */
export function BrochureTrailsArt() {
  const trails: [string, string, string][] = [
    ['Larch Loop', '2.4 km', 'easy'],
    ['Mirror Tarn', '5.1 km', 'easy'],
    ['Saddle Pass', '9.8 km', 'moderate'],
    ['The Palisade', '14 km', 'hard'],
    ['Ridgeline Traverse', '22 km', 'hard'],
  ]
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: 22,
        background: '#f4efe1',
        color: '#20362c',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: 3, color: '#8a6a2f' }}>PICK YOUR DAY</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Five trails, one ridge</div>
      <div style={{ display: 'grid', gap: 8, marginTop: 6 }}>
        {trails.map(([name, dist, grade]) => (
          <div key={name} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, borderBottom: '1px solid #d8cfb4', paddingBottom: 7, fontSize: 12.5 }}>
            <span style={{ fontWeight: 600 }}>{name}</span>
            <span style={{ color: '#6d6650' }}>
              {dist} · {grade}
            </span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 'auto', fontSize: 11, color: '#6d6650' }}>
        Dogs on leash. Pack out what you pack in.
      </div>
    </div>
  )
}

/** Tri-fold panel 3 — plan your visit. */
export function BrochureVisitArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: 22,
        background: '#2a5741',
        color: '#f0ead6',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: 3, color: '#e8b64c' }}>PLAN YOUR VISIT</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>Open dawn to dusk, all year</div>
      <svg viewBox="0 0 100 62" aria-hidden style={{ width: '100%', background: '#20452f', borderRadius: 6 }}>
        <path d="M8 52 C 26 44, 30 20, 52 18 S 88 28, 94 10" fill="none" stroke="#e8b64c" strokeWidth="1.6" strokeDasharray="4 3" />
        <circle cx="8" cy="52" r="3" fill="#f0ead6" />
        <circle cx="94" cy="10" r="3" fill="#f0ead6" />
        <text x="13" y="57" fontSize="6" fill="#f0ead6">visitor center</text>
        <text x="58" y="12" fontSize="6" fill="#f0ead6">summit</text>
      </svg>
      <div style={{ marginTop: 'auto', display: 'grid', gap: 4, fontSize: 12 }}>
        <div>ridgeline.example/visit</div>
        <div>+1 (555) 010-4426</div>
        <div>14 Basin Rd, Larchmont</div>
      </div>
    </div>
  )
}

/** Business card front. */
export function CardFrontArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: '26px 30px',
        background: '#fdfcf9',
        color: '#191d24',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ width: 44, height: 6, background: '#e6453a', borderRadius: 3 }} />
      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>Yuna Park</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>Product Designer · Area Studio</div>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 11.5, color: '#6b7280', marginTop: 14 }}>
        <span>yuna@area.studio</span>
        <span>+82 10-0100-2244</span>
      </div>
    </div>
  )
}

/** Business card back. */
export function CardBackArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        background: '#191d24',
        color: '#fdfcf9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: 16,
          background: '#e6453a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 26,
          fontWeight: 800,
        }}
      >
        A
      </div>
      <div style={{ fontSize: 12, letterSpacing: 3, color: '#9aa1ab' }}>AREA.STUDIO</div>
    </div>
  )
}

/** 18x24 gig poster. */
export function PosterArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: 30,
        background: 'linear-gradient(200deg, #f5e9d4 0%, #f2ddb8 100%)',
        color: '#1c1a16',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ fontSize: 12, letterSpacing: 4 }}>LIVE AT THE FOUNDRY</div>
      <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 0.94, letterSpacing: -3, marginTop: 18 }}>
        SIGNAL
        <br />
        <span style={{ color: '#d1461f' }}>/ NOISE</span>
      </div>
      <svg viewBox="0 0 100 26" aria-hidden style={{ width: '100%', marginTop: 'auto' }}>
        {Array.from({ length: 40 }, (_, i) => (
          <rect key={i} x={i * 2.5} y={13 - Math.abs(Math.sin(i * 0.55)) * 11} width={1.4} height={Math.abs(Math.sin(i * 0.55)) * 22 + 2} fill="#1c1a16" />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginTop: 16 }}>
        <span>SAT AUG 22 · 9PM</span>
        <span>DOORS 8PM · ALL AGES</span>
      </div>
    </div>
  )
}

/** 14x48 bulletin creative — one message, big type. */
export function BillboardAdArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: '0 48px',
        background: '#0e1b2e',
        color: '#f4f7fb',
        display: 'flex',
        alignItems: 'center',
        gap: 40,
      }}
    >
      <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.02, flex: 1 }}>
        Ship mockups, <span style={{ color: '#5ad0a6' }}>not screenshots.</span>
      </div>
      <div
        style={{
          background: '#5ad0a6',
          color: '#0e1b2e',
          fontSize: 24,
          fontWeight: 700,
          padding: '16px 28px',
          borderRadius: 999,
          whiteSpace: 'nowrap',
        }}
      >
        area-3d-mockups
      </div>
    </div>
  )
}

/** ID badge front. */
export function BadgeFrontArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        background: '#fdfdfb',
        color: '#161a20',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ height: 8, background: '#b3223a' }} />
      <div style={{ padding: '18px 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 22, height: 22, borderRadius: 7, background: '#b3223a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>A</div>
        <div style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>AREA LABS</div>
      </div>
      <div style={{ margin: '18px auto 0', width: 108, height: 108, borderRadius: '50%', background: 'linear-gradient(160deg, #cdd6e2, #9fb0c4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 700, color: '#5b6a7e' }}>
        YP
      </div>
      <div style={{ textAlign: 'center', marginTop: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Yuna Park</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Product Designer</div>
      </div>
      <div style={{ margin: '20px 20px 0', padding: '10px 14px', borderRadius: 10, background: '#f2f4f7', display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 6, fontSize: 11 }}>
        <span style={{ color: '#6b7280' }}>Dept</span>
        <span style={{ fontWeight: 600, textAlign: 'right' }}>Design</span>
        <span style={{ color: '#6b7280' }}>Access</span>
        <span style={{ fontWeight: 600, textAlign: 'right' }}>L3 · All floors</span>
      </div>
      <svg width="150" height="24" viewBox="0 0 150 24" aria-hidden style={{ margin: 'auto auto 10px', paddingTop: 14 }}>
        {Array.from({ length: 34 }, (_, i) => (
          <rect key={i} x={i * 4.4} y={0} width={i % 3 === 0 ? 2.8 : 1.4} height={24} fill="#161a20" />
        ))}
      </svg>
      <div style={{ padding: '0 20px 16px', display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#6b7280' }}>
        <span>ID 0042</span>
        <span>EXP 08/27</span>
      </div>
    </div>
  )
}

/** ID badge back. */
export function BadgeBackArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        background: '#161a20',
        color: '#e7eaef',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 20,
        textAlign: 'center',
      }}
    >
      <svg width="120" height="40" viewBox="0 0 120 40" aria-hidden>
        {Array.from({ length: 30 }, (_, i) => (
          <rect key={i} x={i * 4} y={0} width={i % 3 === 0 ? 2.6 : 1.3} height={40} fill="#e7eaef" />
        ))}
      </svg>
      <div style={{ fontSize: 10, color: '#9aa1ab', maxWidth: 200 }}>
        This badge is the property of Area Labs. If found, drop it in any mailbox.
      </div>
    </div>
  )
}

/** King-size bus ad — one message, big type, 4.8:1. */
export function BusAdArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: '0 36px',
        background: '#f4c534',
        color: '#171614',
        display: 'flex',
        alignItems: 'center',
        gap: 28,
      }}
    >
      <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1, whiteSpace: 'nowrap' }}>
        Fresh flowers, city-wide.
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 22, fontWeight: 700, whiteSpace: 'nowrap' }}>
        BLOOM<span style={{ color: '#2a8f68' }}>&amp;CO.</span> · bloomand.co
      </div>
    </div>
  )
}

/**
 * Amber LED destination marquee: the route number holds steady while the
 * destination scrolls past, behind a dot-matrix mask — like a real bus sign.
 */
export function DestinationArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0a0a08',
        color: '#ffb424',
        display: 'flex',
        alignItems: 'center',
        fontFamily: '"JetBrains Mono", ui-monospace, monospace',
        fontWeight: 700,
        letterSpacing: 2,
        textShadow: '0 0 6px rgba(255,180,36,0.8)',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes led-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
      <span style={{ fontSize: 36, padding: '0 16px', borderRight: '2px solid rgba(255,180,36,0.35)' }}>42</span>
      <div style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'inline-block', animation: 'led-marquee 9s linear infinite' }}>
          {[0, 1].map((i) => (
            <span key={i} style={{ fontSize: 26, paddingLeft: 24, paddingRight: 120 }}>
              DOWNTOWN VIA 5TH AVE · NEXT STOP CANAL ST
            </span>
          ))}
        </div>
      </div>
      {/* LED dot-matrix mask over the whole sign */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(circle at center, transparent 34%, #0a0a08 72%)',
          backgroundSize: '5px 5px',
        }}
      />
    </div>
  )
}

/** Product box front panel. */
export function BoxFrontArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: 26,
        background: 'linear-gradient(175deg, #2b5c8f 0%, #17385c 100%)',
        color: '#f2f6fb',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 12, letterSpacing: 4, color: '#8fb4d9' }}>AREA LABS</div>
      <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -0.5, marginTop: 6 }}>Deep Focus</div>
      <div style={{ fontSize: 12.5, color: '#b9cfe4', marginTop: 4 }}>single-origin whole bean · 340 g</div>
      <svg viewBox="0 0 80 80" style={{ width: 150, margin: 'auto 0' }} aria-hidden>
        <circle cx="40" cy="40" r="30" fill="none" stroke="#8fb4d9" strokeWidth="2" />
        <path d="M40 14 v52 M14 40 h52" stroke="#8fb4d9" strokeWidth="1" />
        <circle cx="40" cy="40" r="10" fill="#f4c534" />
      </svg>
      <div style={{ fontSize: 12, color: '#8fb4d9' }}>DARK ROAST · NOTES OF CHERRY &amp; COCOA</div>
    </div>
  )
}

/** Product box side panel. */
export function BoxSideArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: '26px 12px',
        background: '#17385c',
        color: '#b9cfe4',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 10,
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: 2, writingMode: 'vertical-rl', margin: 'auto', transform: 'rotate(180deg)' }}>
        DEEP FOCUS · SINGLE ORIGIN · 340 G
      </div>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f4c534' }} />
    </div>
  )
}

/** Product box top panel. */
export function BoxTopArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#17385c',
        color: '#f2f6fb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
        fontWeight: 800,
        letterSpacing: 1,
      }}
    >
      DEEP FOCUS
    </div>
  )
}

/** Roll-up banner graphic. */
export function BannerArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: 32,
        background: 'linear-gradient(200deg, #1d4433 0%, #0e241c 78%)',
        color: '#f0ead6',
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{ fontSize: 13, letterSpacing: 4, color: '#e8b64c' }}>RIDGELINE TOURS</div>
      <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.05, marginTop: 14 }}>
        Walk the ridge.
        <br />
        We handle the rest.
      </div>
      <svg viewBox="0 0 100 40" aria-hidden style={{ width: '100%', margin: 'auto 0' }}>
        <path d="M0 36 L20 12 L32 24 L52 4 L72 28 L84 16 L100 36" fill="none" stroke="#e8b64c" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <div style={{ display: 'grid', gap: 6, fontSize: 15 }}>
        <div style={{ fontWeight: 700 }}>Guided day hikes · Apr–Oct</div>
        <div style={{ color: '#c9d6c2' }}>ridgeline.example/tours</div>
      </div>
      <div style={{ marginTop: 22, background: '#e8b64c', color: '#173229', fontWeight: 800, fontSize: 16, padding: '12px 30px', borderRadius: 999 }}>
        BOOK AT BOOTH 214
      </div>
    </div>
  )
}

/** Greeting card cover. */
export function GreetingCoverArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: 22,
        background: 'linear-gradient(170deg, #f8e8d8 0%, #f2cfc0 100%)',
        color: '#7a3b2e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <svg viewBox="0 0 60 60" style={{ width: 110, marginTop: 26 }} aria-hidden>
        <circle cx="30" cy="26" r="14" fill="none" stroke="#c96b52" strokeWidth="2" />
        <path d="M30 40 v12 M22 48 h16" stroke="#c96b52" strokeWidth="2" strokeLinecap="round" />
        <path d="M18 18 c4 -8 20 -8 24 0" fill="none" stroke="#e8a087" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div style={{ fontFamily: serif, fontSize: 34, lineHeight: 1.1, marginTop: 'auto' }}>
        oh happy day
      </div>
      <div style={{ fontSize: 11, letterSpacing: 3, margin: '10px 0 16px' }}>A LITTLE SUNSHINE, POST-HASTE</div>
    </div>
  )
}

/** Greeting card inside-right message page. */
export function GreetingInsideArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: 26,
        background: '#fdfaf4',
        color: '#7a3b2e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 14,
      }}
    >
      <div style={{ fontFamily: serif, fontSize: 26, lineHeight: 1.3 }}>
        wishing you the
        <br />
        very best year yet
      </div>
      <div style={{ width: 60, height: 2, background: '#e8a087' }} />
      <div style={{ fontSize: 13 }}>— everyone at Area Labs</div>
    </div>
  )
}

/** Vinyl album cover. */
export function VinylCoverArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: 26,
        background: 'radial-gradient(140% 110% at 20% 15%, #2b3f63 0%, #101725 62%)',
        color: '#e9edf5',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <svg viewBox="0 0 100 100" aria-hidden style={{ position: 'absolute', right: -30, bottom: -30, width: 260, opacity: 0.5 }}>
        {[44, 36, 28, 20].map((r) => (
          <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="#5ad0a6" strokeWidth="0.8" />
        ))}
      </svg>
      <div style={{ fontSize: 12, letterSpacing: 4, color: '#8fa3c8' }}>AREA WAVES</div>
      <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1, lineHeight: 1.02, marginTop: 10 }}>
        Neon
        <br />
        Skyline
      </div>
      <div style={{ marginTop: 'auto', fontSize: 12, color: '#8fa3c8' }}>LP · 44 MIN · AREA-007</div>
    </div>
  )
}

/** Vinyl center label (circular). */
export function VinylLabelArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        background: '#e8b64c',
        color: '#1c1a16',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 2,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2 }}>AREA WAVES</div>
      <div style={{ fontSize: 9, letterSpacing: 1 }}>NEON SKYLINE · SIDE A</div>
      <div style={{ fontSize: 8, marginTop: 4 }}>33⅓ RPM · STEREO</div>
    </div>
  )
}

/** TV streaming-app hero. */
export function TVShowArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        background: 'linear-gradient(200deg, #1c2b45 0%, #0a0f1a 70%)',
        color: '#eef2f8',
        display: 'flex',
        flexDirection: 'column',
        padding: 60,
        overflow: 'hidden',
      }}
    >
      <div style={{ fontSize: 26, letterSpacing: 6, color: '#5ad0a6', fontWeight: 700 }}>AREA+ ORIGINAL</div>
      <div style={{ fontSize: 110, fontWeight: 800, letterSpacing: -3, lineHeight: 0.98, marginTop: 24 }}>
        THE RIDGE
      </div>
      <div style={{ fontSize: 30, color: '#9db0cd', marginTop: 18 }}>New season · Fridays</div>
      <div style={{ display: 'flex', gap: 24, marginTop: 'auto' }}>
        {['#25467a', '#2a8f68', '#8a3547', '#66513a', '#31552e'].map((c) => (
          <div key={c} style={{ width: 300, height: 170, borderRadius: 14, background: `linear-gradient(160deg, ${c}, #10151f)` }} />
        ))}
      </div>
    </div>
  )
}

/** Chalkboard menu for the A-frame. */
export function ChalkMenuArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: 24,
        background: '#232823',
        color: '#f0ede4',
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'center',
        fontFamily: serif,
      }}
    >
      <div style={{ fontSize: 30, fontStyle: 'italic' }}>Ridgeline Café</div>
      <svg viewBox="0 0 100 8" style={{ width: '80%', margin: '8px auto 14px' }} aria-hidden>
        <path d="M2 5 Q 25 1, 50 4 T 98 3" fill="none" stroke="#e8b64c" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {[
        ['flat white', '4.5'],
        ['batch brew', '3.5'],
        ['cardamom bun', '5'],
        ['trail toastie', '9'],
      ].map(([item, price]) => (
        <div key={item} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, padding: '7px 8px', borderBottom: '1px dashed rgba(240,237,228,0.25)' }}>
          <span>{item}</span>
          <span style={{ color: '#e8b64c' }}>{price}</span>
        </div>
      ))}
      <div style={{ marginTop: 'auto', fontSize: 14, color: '#b9c4b4' }}>open till dusk ☀</div>
    </div>
  )
}

/** Rear-door panel for the van. */
export function VanRearArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        background: '#ffffff',
        color: '#173229',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        textAlign: 'center',
        padding: 24,
      }}
    >
      <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>
        BLOOM<span style={{ color: '#2a8f68' }}>&amp;CO.</span>
      </div>
      <div style={{ fontSize: 15, letterSpacing: 3 }}>HOW&apos;S MY DRIVING?</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#2a8f68' }}>(555) 010-7788</div>
      <div style={{ marginTop: 12, width: '70%', height: 8, background: '#7fd6b2', borderRadius: 4 }} />
    </div>
  )
}

/** Cargo-van wrap livery. */
export function VanLiveryArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        background: '#ffffff',
        color: '#173229',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 44px',
      }}
    >
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <polygon points="62,0 100,0 100,40 78,40" fill="#2a8f68" />
        <polygon points="74,0 84,0 62,40 52,40" fill="#7fd6b2" />
      </svg>
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>
          BLOOM<span style={{ color: '#2a8f68' }}>&amp;CO.</span>
        </div>
        <div style={{ fontSize: 16, letterSpacing: 4, marginTop: 2 }}>SAME-DAY FLOWER DELIVERY</div>
        <div style={{ display: 'flex', gap: 22, fontSize: 15, fontWeight: 600, marginTop: 16 }}>
          <span>bloomand.co</span>
          <span>(555) 010-7788</span>
        </div>
      </div>
    </div>
  )
}

/** Storefront fascia sign — traditional gilded shop lettering. */
export function StoreSignArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: '0 34px',
        background: 'linear-gradient(180deg, #223a2e 0%, #1a2d24 100%)',
        color: '#e8c476',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 18,
      }}
    >
      <div style={{ fontSize: 12, letterSpacing: 3, color: '#a8b8a0', whiteSpace: 'nowrap' }}>EST. 1987</div>
      <div style={{ fontFamily: serif, fontSize: 34, letterSpacing: 6, whiteSpace: 'nowrap' }}>
        PARCEL &amp; PINE
      </div>
      <div style={{ fontSize: 12, letterSpacing: 3, color: '#a8b8a0', whiteSpace: 'nowrap' }}>GENERAL GOODS</div>
    </div>
  )
}

/** Storefront window poster — seasonal sale card. */
export function StorePosterArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: 18,
        background: '#f3ead9',
        color: '#223a2e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 9, letterSpacing: 3, marginTop: 6 }}>THIS WEEK ONLY</div>
      <div style={{ fontFamily: serif, fontSize: 44, lineHeight: 1, marginTop: 'auto' }}>
        Winter
        <br />
        Sale
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#b0532f', margin: '10px 0 auto' }}>30% off</div>
      <div style={{ fontSize: 9, letterSpacing: 2, marginBottom: 4 }}>EVERYTHING IN STORE</div>
    </div>
  )
}

/** Storefront wall mural — hand-painted-ad look for the brick elevations. */
export function StoreMuralArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: 28,
        background: '#223a2e',
        color: '#f3ead9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 10,
        border: '6px solid #e8c476',
      }}
    >
      <div style={{ fontSize: 13, letterSpacing: 5, color: '#a8b8a0' }}>PARCEL &amp; PINE</div>
      <div style={{ fontFamily: serif, fontSize: 54, lineHeight: 1.05 }}>
        Good goods,
        <br />
        every day.
      </div>
      <div style={{ fontSize: 14, letterSpacing: 3, color: '#e8c476', marginTop: 6 }}>
        CORNER OF 5TH &amp; MAIN
      </div>
    </div>
  )
}

/** Semi-trailer side wrap — coast-to-coast freight brand. */
export function TrailerWrapArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        background: '#ffffff',
        color: '#10263c',
        display: 'flex',
        alignItems: 'stretch',
      }}
    >
      <div
        style={{
          width: '31%',
          background: '#10263c',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingLeft: 36,
          gap: 6,
          clipPath: 'polygon(0 0, 100% 0, 88% 100%, 0 100%)',
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 1, lineHeight: 1 }}>NORTHWIND</div>
        <div style={{ fontSize: 15, letterSpacing: 6, color: '#7fc4e8' }}>FREIGHT CO.</div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 36, padding: '0 44px' }}>
        <div style={{ flex: 1, display: 'grid', gap: 10 }}>
          <svg viewBox="0 0 200 22" aria-hidden style={{ width: '100%' }}>
            <path d="M4 16 C 50 2, 150 24, 196 8" fill="none" stroke="#7fc4e8" strokeWidth="2" strokeDasharray="5 4" />
            <circle cx="4" cy="16" r="3" fill="#10263c" />
            <circle cx="196" cy="8" r="3" fill="#b0532f" />
          </svg>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Coast to coast, carbon neutral.</div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#b0532f', whiteSpace: 'nowrap' }}>northwind.example</div>
      </div>
    </div>
  )
}

/** Semi-trailer rear doors — brand mark between the lock rods. */
export function TrailerRearArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: 24,
        background: '#ffffff',
        color: '#10263c',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 10,
      }}
    >
      <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1 }}>NORTHWIND</div>
      <div style={{ fontSize: 11, letterSpacing: 5, color: '#4a7ea6' }}>FREIGHT CO.</div>
      <div style={{ width: 46, height: 3, background: '#b0532f', margin: '6px 0' }} />
      <div style={{ fontSize: 12, fontWeight: 700 }}>How&apos;s our driving?</div>
      <div style={{ fontSize: 12, color: '#4a7ea6' }}>800-555-0177 · unit 4482</div>
    </div>
  )
}

/** Mailer box lid — kraft-print seed club brand. The layout keeps the
 * middle band clear: the packing tape runs across it. */
export function BoxLidArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: '18px 26px',
        background: '#a9805a',
        color: '#2e2013',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        textAlign: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <svg viewBox="0 0 60 30" aria-hidden style={{ width: 64 }}>
          <path d="M30 28 C 30 12, 18 8, 8 6 C 12 20, 20 26, 30 28 Z" fill="#2e2013" />
          <path d="M30 28 C 30 14, 42 9, 52 8 C 48 20, 40 26, 30 28 Z" fill="none" stroke="#2e2013" strokeWidth="2" />
        </svg>
        <div>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 3 }}>LOAM</div>
          <div style={{ fontSize: 10, letterSpacing: 4 }}>SEED CLUB · NO. 08</div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#5b4630' }}>sow within 12 months · loam.example</div>
    </div>
  )
}

/** Mailer box front panel — wide brand strip. */
export function BoxPanelArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: '0 30px',
        background: '#a9805a',
        color: '#2e2013',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 3 }}>LOAM</div>
      <div style={{ fontSize: 12, letterSpacing: 2, color: '#5b4630' }}>GROW SOMETHING GOOD</div>
      <div style={{ fontSize: 12, fontWeight: 700 }}>loam.example</div>
    </div>
  )
}

/** Shopping bag face — boutique monogram. */
export function BagArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: 24,
        background: 'linear-gradient(180deg, #f6f1e8 0%, #efe6d6 100%)',
        color: '#3c3128',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: 5, marginTop: 18 }}>ATELIER</div>
      <div
        style={{
          fontFamily: serif,
          fontSize: 84,
          lineHeight: 1,
          margin: 'auto 0',
          borderTop: '2px solid #b0532f',
          borderBottom: '2px solid #b0532f',
          padding: '18px 26px',
        }}
      >
        M
      </div>
      <div style={{ fontSize: 11, letterSpacing: 4, marginBottom: 14 }}>MARROW &amp; CO · SINCE 2009</div>
    </div>
  )
}

/** Bus shelter RTPI arrivals board — amber LED rows on a dot-matrix panel. */
export function ArrivalsBoardArt() {
  const rows: [string, string, string][] = [
    ['12', 'Harbor Loop', '2 min'],
    ['4X', 'Union Sq Express', '7 min'],
    ['31', 'Larchmont via Basin Rd', '12 min'],
  ]
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: '8px 14px',
        background: '#0b0c0e',
        color: '#ffb340',
        fontFamily: '"Courier New", monospace',
        fontWeight: 700,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
      }}
    >
      {rows.map(([route, dest, eta]) => (
        <div key={route} style={{ display: 'flex', gap: 12, fontSize: 15, letterSpacing: 1 }}>
          <span style={{ width: 30 }}>{route}</span>
          <span style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>{dest}</span>
          <span>{eta}</span>
        </div>
      ))}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(circle at center, transparent 0.8px, rgba(0,0,0,0.5) 1.1px)',
          backgroundSize: '3px 3px',
        }}
      />
    </div>
  )
}


/** Barcode block shared by the back-of-pack artworks. */
function Barcode({ light = false }: { light?: boolean }) {
  return (
    <div
      aria-hidden
      style={{
        width: 92,
        height: 40,
        padding: '3px 6px',
        boxSizing: 'border-box',
        background: '#fff',
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        opacity: light ? 0.92 : 1,
      }}
    >
      <div
        style={{
          width: '100%',
          flex: 1,
          background:
            'repeating-linear-gradient(90deg, #111 0 2px, #fff 2px 4px, #111 4px 5px, #fff 5px 8px, #111 8px 11px, #fff 11px 13px)',
        }}
      />
      <div style={{ fontSize: 7, letterSpacing: 2, color: '#111' }}>0 723488 100072</div>
    </div>
  )
}

/** Hardcover back board — blurb, praise quote, and barcode. */
export function BookBackArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: '34px 30px 26px',
        background: 'linear-gradient(175deg, #1b3a56 0%, #10263a 100%)',
        color: '#dbe6f0',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ fontFamily: serif, fontSize: 15, fontStyle: 'italic', lineHeight: 1.5 }}>
        &ldquo;A voyage told in soundings and star fixes — the rare atlas that reads like a
        novel.&rdquo;
      </div>
      <div style={{ fontSize: 10, letterSpacing: 2, color: '#8fb0cc' }}>— THE COASTAL REVIEW</div>
      <div style={{ fontSize: 11.5, lineHeight: 1.6, color: '#b6c9da', marginTop: 6 }}>
        Charted across four oceans and twelve years, this collection follows the survey ship
        Meridian from her first anchorage to her last. Includes 40 pages of original charts.
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: '#8fb0cc' }}>
          AREA PRESS
          <br />
          $32.00 US
        </div>
        <Barcode />
      </div>
    </div>
  )
}

/** Hardcover spine strip — title reading top to bottom. */
export function BookSpineArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: '18px 0',
        background: 'linear-gradient(180deg, #1b3a56 0%, #10263a 100%)',
        color: '#dbe6f0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ fontSize: 9, letterSpacing: 1, color: '#8fb0cc' }}>AREA</div>
      <div
        style={{
          fontFamily: serif,
          fontSize: 16,
          letterSpacing: 3,
          writingMode: 'vertical-rl',
        }}
      >
        THE MERIDIAN ATLAS
      </div>
      <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid #8fb0cc' }} />
    </div>
  )
}

/** Magazine back cover — the classic full-page ad. */
export function MagazineBackArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: 30,
        background: 'radial-gradient(120% 100% at 50% 0%, #223042 0%, #0d141d 70%)',
        color: '#e8edf3',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: 5, color: '#7f93ab' }}>ADVERTISEMENT</div>
      <div style={{ fontFamily: serif, fontSize: 40, lineHeight: 1.1, marginTop: 46 }}>
        Hear the city
        <br />
        after midnight.
      </div>
      <svg viewBox="0 0 120 40" aria-hidden style={{ width: 190, marginTop: 34, opacity: 0.85 }}>
        {Array.from({ length: 30 }, (_, i) => (
          <rect key={i} x={i * 4} y={20 - Math.abs(Math.sin(i * 0.7)) * 16} width="2.4" height={Math.abs(Math.sin(i * 0.7)) * 32 + 2} rx="1.2" fill="#5ad0a6" />
        ))}
      </svg>
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 3 }}>AREA WAVES · NEON SKYLINE</div>
        <div style={{ fontSize: 10.5, color: '#7f93ab' }}>ON TOUR THIS FALL · AREAWAVES.EXAMPLE</div>
      </div>
    </div>
  )
}

/** Product box back panel — brew steps and barcode. */
export function BoxBackArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: 26,
        background: '#17385c',
        color: '#b9cfe4',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 12, letterSpacing: 3, color: '#8fb4d9' }}>HOW TO BREW</div>
      {[
        ['01', 'Grind 20 g medium-fine.'],
        ['02', 'Pour 300 g water at 94°C.'],
        ['03', 'Steep four minutes. Press.'],
      ].map(([n, step]) => (
        <div key={n} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f4c534' }}>{n}</div>
          <div style={{ fontSize: 12.5 }}>{step}</div>
        </div>
      ))}
      <div style={{ fontSize: 10.5, lineHeight: 1.55, color: '#7fa0c2', marginTop: 4 }}>
        Roasted weekly in small batches. Whole bean arabica, single origin. Store away from
        light; best within four weeks of the roast date stamped below.
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: '#8fb4d9' }}>
          AREA LABS ROASTWORKS
          <br />
          340 G · DARK ROAST
        </div>
        <Barcode />
      </div>
    </div>
  )
}

/** Product box bottom panel — roast date stamp and lot code. */
export function BoxBottomArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: 16,
        background: '#122c49',
        color: '#8fb4d9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: 2, lineHeight: 1.7 }}>
        ROASTED 2026-07-14
        <br />
        LOT 26-195 · BBE 2026-08-11
      </div>
      <div
        style={{
          fontSize: 10,
          letterSpacing: 1,
          border: '1.5px solid #8fb4d9',
          borderRadius: '50%',
          width: 54,
          height: 54,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'rotate(-12deg)',
        }}
      >
        AREA
      </div>
    </div>
  )
}

/** Mailer box end panel — handling marks. */
export function MailerEndArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: 14,
        background: '#20242b',
        color: '#e8e4dd',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <svg viewBox="0 0 40 24" aria-hidden style={{ width: 52 }}>
        <path d="M14 22 V10 H8 L20 0 L32 10 h-6 v12 Z" fill="none" stroke="#e8e4dd" strokeWidth="2" />
      </svg>
      <div style={{ fontSize: 11, letterSpacing: 3 }}>THIS SIDE UP</div>
      <div style={{ fontSize: 9, letterSpacing: 2, color: '#9aa0a8' }}>HANDLE WITH CARE</div>
    </div>
  )
}

/** Mailer box bottom panel — recycled stamp and origin line. */
export function MailerBottomArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: 22,
        background: '#20242b',
        color: '#9aa0a8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: 2, lineHeight: 1.8 }}>
        100% RECYCLED B-FLUTE
        <br />
        PACKED IN PORTLAND, OR
      </div>
      <svg viewBox="0 0 48 48" aria-hidden style={{ width: 56 }}>
        <path d="M24 6 L31 18 H17 Z M9 34 L16 22 L23 34 Z M39 34 L25 34 L32 22 Z" fill="none" stroke="#9aa0a8" strokeWidth="2.4" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

/** Vinyl back cover — tracklist and credits. */
export function VinylBackArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: 30,
        background: '#101725',
        color: '#c6d1e4',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: 4, color: '#8fa3c8' }}>AREA WAVES · NEON SKYLINE</div>
      <div style={{ display: 'flex', gap: 34, marginTop: 26 }}>
        {[
          ['SIDE A', ['Overpass', 'Sodium Glow', 'Last Train Home', 'Antenna Park']],
          ['SIDE B', ['Neon Skyline', 'Harbor Lights', 'Static Bloom', 'Dawn Chorus']],
        ].map(([side, tracks]) => (
          <div key={side as string} style={{ flex: 1 }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#5ad0a6', marginBottom: 10 }}>{side}</div>
            {(tracks as string[]).map((t, i) => (
              <div key={t} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, lineHeight: 2 }}>
                <span>
                  {i + 1}. {t}
                </span>
                <span style={{ color: '#8fa3c8' }}>{3 + ((i * 7) % 4)}:{String(10 + ((i * 17) % 50)).padStart(2, '0')}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 9.5, lineHeight: 1.7, color: '#8fa3c8' }}>
          RECORDED AT PIER 9 · MIXED BY M. OKAFOR
          <br />
          ℗ 2026 AREA WAVES · AREA-007 · 33⅓ RPM
        </div>
        <Barcode />
      </div>
    </div>
  )
}

/** Vinyl side-B center label (circular). */
export function VinylLabelBArt() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        background: '#1c2c47',
        color: '#e9edf5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 2,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2 }}>AREA WAVES</div>
      <div style={{ fontSize: 9, letterSpacing: 1 }}>NEON SKYLINE · SIDE B</div>
      <div style={{ fontSize: 8, marginTop: 4 }}>33⅓ RPM · STEREO</div>
    </div>
  )
}
