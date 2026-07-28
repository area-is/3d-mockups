'use client'

import { useState } from 'react'

/**
 * "Stride" - the fictional step-tracking app showcased on the
 * /examples/hero-phone page. Fully live on the device screen: log a walk and
 * the ring, the stat tiles and today's bar all update; tap a day in the week
 * chart to read it out; the tab bar switches its active pill.
 */

const GOAL = 8000

/** Mon–Sat are fixed history; Sunday ("today") is live state. */
const HISTORY = [
  { label: 'Mon', steps: 7420 },
  { label: 'Tue', steps: 9180 },
  { label: 'Wed', steps: 5260 },
  { label: 'Thu', steps: 8040 },
  { label: 'Fri', steps: 6890 },
  { label: 'Sat', steps: 11320 },
]

const RING_R = 64
const RING_C = 2 * Math.PI * RING_R

const TABS = [
  { id: 'today', label: 'Today' },
  { id: 'trends', label: 'Trends' },
  { id: 'you', label: 'You' },
] as const

function TabIcon({ id }: { id: (typeof TABS)[number]['id'] }) {
  if (id === 'today')
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
        <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2.4" opacity="0.35" />
        <path d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    )
  if (id === 'trends')
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
        <path d="M5 19V12M12 19V5M19 19v-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <circle cx="12" cy="8" r="3.6" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M4.8 19.4a7.4 7.4 0 0 1 14.4 0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

export function StrideApp() {
  const [today, setToday] = useState(6214)
  const [selected, setSelected] = useState(HISTORY.length) // today's bar
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('today')

  const week = [...HISTORY, { label: 'Today', steps: today }]
  const scaleMax = Math.max(...week.map((d) => d.steps), GOAL)
  const progress = Math.min(today / GOAL, 1)
  const km = (today * 0.00074).toFixed(1)
  const kcal = Math.round(today * 0.04)
  const picked = week[selected]!

  return (
    <div className="screen std">
      <div className="screen-statusbar">
        <span>9:41</span>
        <span className="screen-statusicons">
          <i className="si si-signal" />
          <i className="si si-wifi" />
          <i className="si si-battery" />
        </span>
      </div>

      <header className="std-head">
        <div>
          <p className="std-date">Sunday, July 12</p>
          <h2 className="std-greeting">Morning, Alex</h2>
        </div>
        <div className="std-avatar" aria-hidden>
          A
        </div>
      </header>

      <section className="std-ring-card">
        <div className="std-ring">
          <svg viewBox="0 0 160 160" width="164" height="164">
            <defs>
              <linearGradient id="std-ring-grad" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <circle cx="80" cy="80" r={RING_R} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="11" />
            <circle
              cx="80"
              cy="80"
              r={RING_R}
              fill="none"
              stroke="url(#std-ring-grad)"
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - progress)}
              transform="rotate(-90 80 80)"
              style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1)' }}
            />
          </svg>
          <div className="std-ring-center">
            <strong className="std-count">{today.toLocaleString('en-US')}</strong>
            <span className="std-goal">of {GOAL.toLocaleString('en-US')} steps</span>
          </div>
        </div>
        <button type="button" className="std-log" onClick={() => setToday((s) => s + 500)}>
          + Log a walk
        </button>
      </section>

      <section className="std-tiles">
        <div className="std-tile">
          <span className="std-tile-label">Distance</span>
          <strong className="std-tile-value">
            {km} <em>km</em>
          </strong>
        </div>
        <div className="std-tile">
          <span className="std-tile-label">Energy</span>
          <strong className="std-tile-value">
            {kcal.toLocaleString('en-US')} <em>kcal</em>
          </strong>
        </div>
        <div className="std-tile">
          <span className="std-tile-label">Streak</span>
          <strong className="std-tile-value">
            12 <em>days</em>
          </strong>
        </div>
      </section>

      <section className="std-week">
        <p className="std-week-readout">
          <span className="std-week-dot" aria-hidden />
          {picked.label} · {picked.steps.toLocaleString('en-US')} steps
        </p>
        <div className="std-chart" role="group" aria-label="Steps this week">
          {week.map((d, i) => (
            <button
              type="button"
              key={d.label}
              className="std-bar-hit"
              data-selected={i === selected || undefined}
              data-today={i === week.length - 1 || undefined}
              aria-label={`${d.label}: ${d.steps.toLocaleString('en-US')} steps`}
              onClick={() => setSelected(i)}
            >
              <span className="std-bar" style={{ height: `${(d.steps / scaleMax) * 100}%` }} />
              <span className="std-bar-day">{d.label === 'Today' ? 'S' : d.label[0]}</span>
            </button>
          ))}
        </div>
      </section>

      <nav className="std-tabs" aria-label="App sections">
        {TABS.map((t) => (
          <button
            type="button"
            key={t.id}
            data-active={tab === t.id || undefined}
            onClick={() => setTab(t.id)}
          >
            <TabIcon id={t.id} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      <div className="screen-homebar" aria-hidden />
    </div>
  )
}
