'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import {
  GalaxyMockup,
  IPhoneMockup,
  FoldMockup,
  FlipMockup,
  LaptopMockup,
  IPadMockup,
  GalaxyTabMockup,
  AppleWatchMockup,
  GalaxyWatchMockup,
  StudioDisplayMockup,
  GALAXY_COLORWAYS,
  IPHONE_COLORWAYS,
  FOLD_COLORWAYS,
  FLIP_COLORWAYS,
  LAPTOP_COLORWAYS,
  IPAD_COLORWAYS,
  GALAXY_TAB_COLORWAYS,
  APPLE_WATCH_COLORWAYS,
  GALAXY_WATCH_COLORWAYS,
  STUDIO_DISPLAY_COLORWAYS,
  mockupInfo,
  type Colorway,
  type MockupKind,
} from 'area-3d-mockups'
import { MusicPlayer } from '../screens/music-player'
import { LockScreen } from '../screens/lock-screen'
import { DesktopScreen } from '../screens/desktop-screen'
import { WatchFace, GalaxyWatchFace } from '../screens/watch-face'

/** What each slot's mockup receives from the carousel. */
interface SlotState {
  /** Retail colorway id (each component resolves it to color + frameColor). */
  color: string
  /** Only the centered device gets drag controls and the floating idle. */
  active: boolean
}

interface Entry {
  id: string
  name: string
  /** Logical resolution readout, e.g. "360 × 780". */
  res: string
  /** Wrapper box the mockup canvas fills, in px. */
  w: number
  h: number
  /** Relative size vs the other devices (design: bigger devices read bigger). */
  scale: number
  colorways: Colorway[]
  render: (slot: SlotState) => ReactNode
}

/** "360 × 780" for the primary screen of a mockup kind. */
function resOf(kind: MockupKind, props?: object): string {
  const info = mockupInfo(kind as never, props as never)
  const region = (info.regions as Record<string, { px?: { width: number; height: number } } | { px?: { width: number; height: number } }[]>).screen
  const px = (Array.isArray(region) ? region[0] : region)?.px
  return px ? `${px.width} × ${px.height}` : ''
}

const POSE: [number, number, number] = [0, -0.3, 0]

const DEVICES: Entry[] = [
  {
    id: 'galaxy-s26',
    name: 'Galaxy S26',
    res: resOf('galaxy', { variant: 's26' }),
    w: 340,
    h: 620,
    scale: 1,
    colorways: GALAXY_COLORWAYS.s26,
    render: ({ color, active }) => (
      <GalaxyMockup variant="s26" color={color} controls={active} float={active} rotation={POSE}>
        <MusicPlayer />
      </GalaxyMockup>
    ),
  },
  {
    id: 'galaxy-s26-ultra',
    name: 'Galaxy S26 Ultra',
    res: resOf('galaxy', { variant: 's26ultra' }),
    w: 340,
    h: 620,
    scale: 1.06,
    colorways: GALAXY_COLORWAYS.s26ultra,
    render: ({ color, active }) => (
      <GalaxyMockup variant="s26ultra" color={color} controls={active} float={active} rotation={POSE}>
        <MusicPlayer />
      </GalaxyMockup>
    ),
  },
  {
    id: 'iphone-17',
    name: 'iPhone 17',
    res: resOf('iphone', { variant: '17' }),
    w: 340,
    h: 620,
    scale: 1.02,
    colorways: IPHONE_COLORWAYS['17'],
    render: ({ color, active }) => (
      <IPhoneMockup variant="17" color={color} controls={active} float={active} rotation={POSE}>
        <MusicPlayer />
      </IPhoneMockup>
    ),
  },
  {
    id: 'iphone-17-air',
    name: 'iPhone 17 Air',
    res: resOf('iphone', { variant: 'air' }),
    w: 340,
    h: 620,
    scale: 1.05,
    colorways: IPHONE_COLORWAYS.air,
    render: ({ color, active }) => (
      <IPhoneMockup variant="air" color={color} controls={active} float={active} rotation={POSE}>
        <LockScreen />
      </IPhoneMockup>
    ),
  },
  {
    id: 'iphone-17-pro',
    name: 'iPhone 17 Pro',
    res: resOf('iphone', { variant: 'pro' }),
    w: 340,
    h: 620,
    scale: 1.05,
    colorways: IPHONE_COLORWAYS.pro,
    render: ({ color, active }) => (
      <IPhoneMockup variant="pro" color={color} controls={active} float={active} rotation={POSE}>
        <MusicPlayer />
      </IPhoneMockup>
    ),
  },
  {
    id: 'iphone-17-pro-max',
    name: 'iPhone 17 Pro Max',
    res: resOf('iphone', { variant: 'promax' }),
    w: 340,
    h: 620,
    scale: 1.1,
    colorways: IPHONE_COLORWAYS.promax,
    render: ({ color, active }) => (
      <IPhoneMockup variant="promax" color={color} controls={active} float={active} rotation={POSE}>
        <LockScreen />
      </IPhoneMockup>
    ),
  },
  {
    id: 'galaxy-z-fold7',
    name: 'Galaxy Z Fold 7',
    res: resOf('fold', { open: true }),
    w: 620,
    h: 620,
    scale: 1.02,
    colorways: FOLD_COLORWAYS.fold7,
    render: ({ color, active }) => (
      <FoldMockup color={color} controls={active} float={active} rotation={POSE}>
        <DesktopScreen />
      </FoldMockup>
    ),
  },
  {
    id: 'galaxy-z-flip7',
    name: 'Galaxy Z Flip 7',
    res: resOf('flip', { open: true }),
    w: 340,
    h: 620,
    scale: 1,
    colorways: FLIP_COLORWAYS.flip7,
    render: ({ color, active }) => (
      <FlipMockup color={color} controls={active} float={active} rotation={POSE}>
        <MusicPlayer />
      </FlipMockup>
    ),
  },
  {
    id: 'macbook-air-13',
    name: 'MacBook Air 13″',
    res: resOf('laptop', { variant: 'air13' }),
    w: 700,
    h: 540,
    scale: 1,
    colorways: LAPTOP_COLORWAYS.air13,
    render: ({ color, active }) => (
      <LaptopMockup variant="air13" color={color} controls={active} float={active} rotation={POSE}>
        <DesktopScreen />
      </LaptopMockup>
    ),
  },
  {
    id: 'macbook-air-15',
    name: 'MacBook Air 15″',
    res: resOf('laptop', { variant: 'air15' }),
    w: 700,
    h: 540,
    scale: 1.05,
    colorways: LAPTOP_COLORWAYS.air15,
    render: ({ color, active }) => (
      <LaptopMockup variant="air15" color={color} controls={active} float={active} rotation={POSE}>
        <DesktopScreen />
      </LaptopMockup>
    ),
  },
  {
    id: 'macbook-pro-14',
    name: 'MacBook Pro 14″',
    res: resOf('laptop', { variant: 'pro14' }),
    w: 700,
    h: 540,
    scale: 1.02,
    colorways: LAPTOP_COLORWAYS.pro14,
    render: ({ color, active }) => (
      <LaptopMockup variant="pro14" color={color} controls={active} float={active} rotation={POSE}>
        <DesktopScreen />
      </LaptopMockup>
    ),
  },
  {
    id: 'macbook-pro-16',
    name: 'MacBook Pro 16″',
    res: resOf('laptop', { variant: 'pro16' }),
    w: 700,
    h: 540,
    scale: 1.08,
    colorways: LAPTOP_COLORWAYS.pro16,
    render: ({ color, active }) => (
      <LaptopMockup variant="pro16" color={color} controls={active} float={active} rotation={POSE}>
        <DesktopScreen />
      </LaptopMockup>
    ),
  },
  {
    id: 'ipad-pro-13',
    name: 'iPad Pro 13″',
    res: resOf('ipad', { variant: 'ipadpro13' }),
    w: 500,
    h: 620,
    scale: 1.08,
    colorways: IPAD_COLORWAYS.ipadpro13,
    render: ({ color, active }) => (
      <IPadMockup variant="ipadpro13" color={color} controls={active} float={active} rotation={POSE}>
        <LockScreen />
      </IPadMockup>
    ),
  },
  {
    id: 'ipad-pro-11',
    name: 'iPad Pro 11″',
    res: resOf('ipad', { variant: 'ipadpro11' }),
    w: 500,
    h: 620,
    scale: 1,
    colorways: IPAD_COLORWAYS.ipadpro11,
    render: ({ color, active }) => (
      <IPadMockup variant="ipadpro11" color={color} controls={active} float={active} rotation={POSE}>
        <LockScreen />
      </IPadMockup>
    ),
  },
  {
    id: 'ipad-air-13',
    name: 'iPad Air 13″',
    res: resOf('ipad', { variant: 'ipadair13' }),
    w: 500,
    h: 620,
    scale: 1.08,
    colorways: IPAD_COLORWAYS.ipadair13,
    render: ({ color, active }) => (
      <IPadMockup variant="ipadair13" color={color} controls={active} float={active} rotation={POSE}>
        <LockScreen />
      </IPadMockup>
    ),
  },
  {
    id: 'ipad-air-11',
    name: 'iPad Air 11″',
    res: resOf('ipad', { variant: 'ipadair11' }),
    w: 500,
    h: 620,
    scale: 1,
    colorways: IPAD_COLORWAYS.ipadair11,
    render: ({ color, active }) => (
      <IPadMockup variant="ipadair11" color={color} controls={active} float={active} rotation={POSE}>
        <LockScreen />
      </IPadMockup>
    ),
  },
  {
    id: 'ipad-11',
    name: 'iPad 11″',
    res: resOf('ipad', { variant: 'ipad11' }),
    w: 500,
    h: 620,
    scale: 1,
    colorways: IPAD_COLORWAYS.ipad11,
    render: ({ color, active }) => (
      <IPadMockup variant="ipad11" color={color} controls={active} float={active} rotation={POSE}>
        <LockScreen />
      </IPadMockup>
    ),
  },
  {
    id: 'galaxy-tab-s11',
    name: 'Galaxy Tab S11',
    res: resOf('galaxyTab', { variant: 'tabs11' }),
    w: 500,
    h: 620,
    scale: 1,
    colorways: GALAXY_TAB_COLORWAYS.tabs11,
    render: ({ color, active }) => (
      <GalaxyTabMockup variant="tabs11" color={color} controls={active} float={active} rotation={POSE}>
        <LockScreen />
      </GalaxyTabMockup>
    ),
  },
  {
    id: 'galaxy-tab-s11-ultra',
    name: 'Galaxy Tab S11 Ultra',
    res: resOf('galaxyTab', { variant: 'tabs11ultra' }),
    w: 500,
    h: 620,
    scale: 1.12,
    colorways: GALAXY_TAB_COLORWAYS.tabs11ultra,
    render: ({ color, active }) => (
      <GalaxyTabMockup variant="tabs11ultra" color={color} controls={active} float={active} rotation={POSE}>
        <LockScreen />
      </GalaxyTabMockup>
    ),
  },
  {
    id: 'apple-watch-series-11',
    name: 'Apple Watch Series 11',
    res: resOf('appleWatch'),
    w: 420,
    h: 520,
    scale: 1,
    colorways: APPLE_WATCH_COLORWAYS.series11,
    render: ({ color, active }) => (
      <AppleWatchMockup color={color} controls={active} float={active} rotation={POSE}>
        <WatchFace />
      </AppleWatchMockup>
    ),
  },
  {
    id: 'galaxy-watch-8',
    name: 'Galaxy Watch 8',
    res: resOf('galaxyWatch'),
    w: 420,
    h: 520,
    scale: 1,
    colorways: GALAXY_WATCH_COLORWAYS.watch8,
    render: ({ color, active }) => (
      <GalaxyWatchMockup color={color} controls={active} float={active} rotation={POSE}>
        <GalaxyWatchFace />
      </GalaxyWatchMockup>
    ),
  },
  {
    id: 'studio-display',
    name: 'Studio Display 27″',
    res: resOf('studioDisplay'),
    w: 760,
    h: 580,
    scale: 1,
    colorways: STUDIO_DISPLAY_COLORWAYS,
    render: ({ color, active }) => (
      <StudioDisplayMockup color={color} controls={active} float={active} rotation={POSE}>
        <DesktopScreen />
      </StudioDisplayMockup>
    ),
  },
]

const N = DEVICES.length

/** Signed shortest distance from `active` to slot `i` on the ring. */
function ringDistance(i: number, active: number): number {
  let d = (i - active + N) % N
  if (d > N / 2) d -= N
  return d
}

function slotStyle(d: number, entry: Entry): CSSProperties {
  const base: CSSProperties = { width: entry.w, height: entry.h }
  if (d === 0) {
    return {
      ...base,
      transform: `translate(-50%, -50%) scale(calc(var(--carousel-fit, 1) * ${entry.scale}))`,
      opacity: 1,
      zIndex: 3,
    }
  }
  const sign = d === 1 ? '+' : '-'
  return {
    ...base,
    transform: `translate(calc(-50% ${sign} min(460px, 44vw)), -50%) scale(calc(var(--carousel-fit, 1) * ${0.52 * entry.scale}))`,
    opacity: 0.35,
    zIndex: 2,
    filter: 'saturate(0.6) brightness(0.85)',
    cursor: 'pointer',
  }
}

export default function CarouselScene() {
  const [active, setActive] = useState(0)
  // Colorway selection per device, defaulting to each catalog's lead finish.
  const [finish, setFinish] = useState<Record<string, string>>({})
  const [auto, setAuto] = useState(true)

  useEffect(() => {
    if (!auto) return
    const t = setInterval(() => setActive((a) => (a + 1) % N), 4200)
    return () => clearInterval(t)
  }, [auto])

  const stop = () => setAuto(false)
  const go = (i: number) => {
    stop()
    setActive(((i % N) + N) % N)
  }

  const entry = DEVICES[active]!
  const selected = finish[entry.id] ?? entry.colorways[0]!.id
  const counter = `${String(active + 1).padStart(2, '0')} / ${N}`

  return (
    <section className="carousel" aria-label="Device carousel">
      <div className="carousel-glow" aria-hidden />
      <div className="carousel-stage">
        {DEVICES.map((dev, i) => {
          const d = ringDistance(i, active)
          // Only the visible ring (center + both neighbors) holds a live
          // WebGL scene: browsers cap concurrent contexts, and everything
          // further out is invisible anyway.
          if (Math.abs(d) > 1) return null
          const isActive = d === 0
          return (
            <div
              key={dev.id}
              className="carousel-slot"
              style={slotStyle(d, dev)}
              onClick={isActive ? undefined : () => go(i)}
              onPointerDown={isActive ? stop : undefined}
            >
              {dev.render({ color: finish[dev.id] ?? dev.colorways[0]!.id, active: isActive })}
              {isActive ? null : (
                // A dimmed neighbor is one big "bring me to the front" target;
                // without this shield its live screen would eat the click.
                <span style={{ position: 'absolute', inset: 0, zIndex: 5 }} aria-hidden />
              )}
            </div>
          )
        })}
      </div>

      <div className="carousel-bar">
        <div className="carousel-nav">
          <button type="button" className="carousel-arrow" aria-label="Previous device" onClick={() => go(active - 1)}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <p className="carousel-readout" style={{ textTransform: 'uppercase' }}>
            <span className="dim">{counter}</span> · {entry.name} · {entry.res}
          </p>
          <button type="button" className="carousel-arrow" aria-label="Next device" onClick={() => go(active + 1)}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
        <div className="carousel-finishes">
          <span className="carousel-finish-label">FINISH</span>
          <span className="carousel-swatches">
            {entry.colorways.map((c) => (
              <button
                key={c.id}
                type="button"
                className="carousel-swatch"
                aria-label={c.name}
                title={c.name}
                data-selected={c.id === selected}
                style={{ background: c.color }}
                onClick={() => {
                  stop()
                  setFinish((f) => ({ ...f, [entry.id]: c.id }))
                }}
              />
            ))}
          </span>
          <span className="carousel-finish-name" style={{ textTransform: 'uppercase' }}>
            {entry.colorways.find((c) => c.id === selected)?.name}
          </span>
        </div>
      </div>
    </section>
  )
}
