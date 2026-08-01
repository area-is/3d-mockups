'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import {
  MockupCanvas,
  Galaxy,
  IPhone,
  Fold,
  Flip,
  Laptop,
  IPad,
  GalaxyTab,
  AppleWatch,
  GalaxyWatch,
  StudioDisplay,
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
import {
  DEFAULT_CAMERA_POSITION,
  FLIP_FRAMING,
  FOLD_FRAMING,
  GALAXY_FRAMING,
  IPHONE_FRAMING,
  LAPTOP_FRAMING,
  STUDIO_DISPLAY_FRAMING,
  TABLET_FRAMING,
  WATCH_FRAMING,
  type MockupFraming,
} from 'area-3d-mockups/core'
import { MusicPlayer } from '../screens/music-player'
import { LockScreen } from '../screens/lock-screen'
import { DesktopScreen } from '../screens/desktop-screen'
import { WatchFace, GalaxyWatchFace } from '../screens/watch-face'

/**
 * The hero carousel: ONE WebGL canvas holding every object on show.
 *
 * Each `*Mockup` component is a canvas plus an object, which is the right
 * shape for a page that shows one device - but a carousel of them would mean
 * a context per slot, and three at once was already enough to get one dropped
 * ("THREE.WebGLRenderer: Context Lost"). So this composes the bare objects
 * (`<Galaxy>`, `<Laptop>`, …) into a single `<MockupCanvas>` and moves them
 * through the scene instead: the devices on the stage and the picker row
 * beneath it are all real geometry in the same context, none of them
 * screenshots, and adding a slot costs geometry rather than a context.
 *
 * Sizing comes from the library's own framing data. A mockup frames its object
 * by placing the camera at a per-family distance, so an object that looks right
 * at distance `d` in its own canvas looks the same here when scaled by
 * `CAMERA_Z / d` - phones, laptops and monitors end up optically matched
 * without a table of hand-tuned scales.
 */

/** Shared camera distance; every object is scaled relative to it. */
const CAMERA_Z = 9
/** How much of the frame the staged device fills, leaving room for the row. */
const STAGE_FILL = 0.74
/** World-space gap between the staged device and each flanking one. */
const SPACING = 4.8
const STAGE_Y = 0.72
const SIDE_SCALE = 0.5
/** The picker row, well below the stage. */
const ROW_Y = -2.2
const ROW_SCALE = 0.17
const ROW_SPACING = 1.25
/** Painted screen for the picker row, matching the sidebar thumbnails. */
const ROW_SURFACE =
  'radial-gradient(120% 90% at 30% 18%, rgba(80,224,66,0.55) 0%, rgba(49,211,34,0.22) 45%, transparent 78%), #0d1016'
/** Resting pose - a slight turn reads as three-dimensional at a glance. */
const BASE_RY = -0.3

/** Framing distance the library itself uses for a family. */
const distanceOf = (framing: MockupFraming<never>): number =>
  framing.camera?.position[2] ?? DEFAULT_CAMERA_POSITION[2]

interface Entry {
  id: string
  name: string
  /** Logical resolution readout, e.g. "360 × 780". */
  res: string
  /** Scale that matches this object to the shared camera. */
  fit: number
  /** Nudge for objects whose origin is not their visual centre (laptops). */
  lift: number
  colorways: Colorway[]
  /**
   * The bare object. `screen` is live DOM for the staged devices; the picker
   * row passes `surface` instead - a painted screen costs no DOM layer.
   */
  render: (props: { color: string; screen: ReactNode; surface?: string }) => ReactNode
}

/** "360 × 780" for the primary screen of a mockup kind. */
function resOf(kind: MockupKind, props?: object): string {
  const info = mockupInfo(kind as never, props as never)
  const region = (
    info.regions as Record<string, { px?: { width: number; height: number } } | { px?: { width: number; height: number } }[]>
  ).screen
  const px = (Array.isArray(region) ? region[0] : region)?.px
  return px ? `${px.width} × ${px.height}` : ''
}

const fitFor = (framing: MockupFraming<never>) => (CAMERA_Z / distanceOf(framing)) * STAGE_FILL

const PHONE_FIT = fitFor(GALAXY_FRAMING as MockupFraming<never>)
const IPHONE_FIT = fitFor(IPHONE_FRAMING as MockupFraming<never>)
const FOLD_FIT = fitFor(FOLD_FRAMING as MockupFraming<never>)
const FLIP_FIT = fitFor(FLIP_FRAMING as MockupFraming<never>)
const LAPTOP_FIT = fitFor(LAPTOP_FRAMING as MockupFraming<never>)
const TABLET_FIT = fitFor(TABLET_FRAMING as MockupFraming<never>)
const WATCH_FIT = fitFor(WATCH_FRAMING as MockupFraming<never>)
const DISPLAY_FIT = fitFor(STUDIO_DISPLAY_FRAMING as MockupFraming<never>)

const DEVICES: Entry[] = [
  {
    id: 'galaxy-s26',
    name: 'Galaxy S26',
    res: resOf('galaxy', { variant: 's26' }),
    fit: PHONE_FIT,
    lift: 0,
    colorways: GALAXY_COLORWAYS.s26,
    render: ({ color, screen, surface }) => (
      <Galaxy variant="s26" color={color} surfaceBackground={surface}>
        {screen}
      </Galaxy>
    ),
  },
  {
    id: 'galaxy-s26-ultra',
    name: 'Galaxy S26 Ultra',
    res: resOf('galaxy', { variant: 's26ultra' }),
    fit: PHONE_FIT,
    lift: 0,
    colorways: GALAXY_COLORWAYS.s26ultra,
    render: ({ color, screen, surface }) => (
      <Galaxy variant="s26ultra" color={color} surfaceBackground={surface}>
        {screen}
      </Galaxy>
    ),
  },
  {
    id: 'iphone-17',
    name: 'iPhone 17',
    res: resOf('iphone', { variant: '17' }),
    fit: IPHONE_FIT,
    lift: 0,
    colorways: IPHONE_COLORWAYS['17'],
    render: ({ color, screen, surface }) => (
      <IPhone variant="17" color={color} surfaceBackground={surface}>
        {screen}
      </IPhone>
    ),
  },
  {
    id: 'iphone-17-air',
    name: 'iPhone 17 Air',
    res: resOf('iphone', { variant: 'air' }),
    fit: IPHONE_FIT,
    lift: 0,
    colorways: IPHONE_COLORWAYS.air,
    render: ({ color, screen, surface }) => (
      <IPhone variant="air" color={color} surfaceBackground={surface}>
        {screen}
      </IPhone>
    ),
  },
  {
    id: 'iphone-17-pro',
    name: 'iPhone 17 Pro',
    res: resOf('iphone', { variant: 'pro' }),
    fit: IPHONE_FIT,
    lift: 0,
    colorways: IPHONE_COLORWAYS.pro,
    render: ({ color, screen, surface }) => (
      <IPhone variant="pro" color={color} surfaceBackground={surface}>
        {screen}
      </IPhone>
    ),
  },
  {
    id: 'iphone-17-pro-max',
    name: 'iPhone 17 Pro Max',
    res: resOf('iphone', { variant: 'promax' }),
    fit: IPHONE_FIT,
    lift: 0,
    colorways: IPHONE_COLORWAYS.promax,
    render: ({ color, screen, surface }) => (
      <IPhone variant="promax" color={color} surfaceBackground={surface}>
        {screen}
      </IPhone>
    ),
  },
  {
    id: 'galaxy-z-fold7',
    name: 'Galaxy Z Fold 7',
    res: resOf('fold', { open: true }),
    fit: FOLD_FIT,
    lift: 0,
    colorways: FOLD_COLORWAYS.fold7,
    render: ({ color, screen, surface }) => (
      <Fold color={color} surfaceBackground={surface}>{screen}</Fold>
    ),
  },
  {
    id: 'galaxy-z-flip7',
    name: 'Galaxy Z Flip 7',
    res: resOf('flip', { open: true }),
    fit: FLIP_FIT,
    lift: 0,
    colorways: FLIP_COLORWAYS.flip7,
    render: ({ color, screen, surface }) => (
      <Flip color={color} surfaceBackground={surface}>{screen}</Flip>
    ),
  },
  {
    id: 'macbook-air-13',
    name: 'MacBook Air 13″',
    res: resOf('laptop', { variant: 'air13' }),
    fit: LAPTOP_FIT,
    lift: 0.55,
    colorways: LAPTOP_COLORWAYS.air13,
    render: ({ color, screen, surface }) => (
      <Laptop variant="air13" color={color} surfaceBackground={surface}>
        {screen}
      </Laptop>
    ),
  },
  {
    id: 'macbook-air-15',
    name: 'MacBook Air 15″',
    res: resOf('laptop', { variant: 'air15' }),
    fit: LAPTOP_FIT,
    lift: 0.55,
    colorways: LAPTOP_COLORWAYS.air15,
    render: ({ color, screen, surface }) => (
      <Laptop variant="air15" color={color} surfaceBackground={surface}>
        {screen}
      </Laptop>
    ),
  },
  {
    id: 'macbook-pro-14',
    name: 'MacBook Pro 14″',
    res: resOf('laptop', { variant: 'pro14' }),
    fit: LAPTOP_FIT,
    lift: 0.55,
    colorways: LAPTOP_COLORWAYS.pro14,
    render: ({ color, screen, surface }) => (
      <Laptop variant="pro14" color={color} surfaceBackground={surface}>
        {screen}
      </Laptop>
    ),
  },
  {
    id: 'macbook-pro-16',
    name: 'MacBook Pro 16″',
    res: resOf('laptop', { variant: 'pro16' }),
    fit: LAPTOP_FIT,
    lift: 0.55,
    colorways: LAPTOP_COLORWAYS.pro16,
    render: ({ color, screen, surface }) => (
      <Laptop variant="pro16" color={color} surfaceBackground={surface}>
        {screen}
      </Laptop>
    ),
  },
  {
    id: 'ipad-pro-13',
    name: 'iPad Pro 13″',
    res: resOf('ipad', { variant: 'ipadpro13' }),
    fit: TABLET_FIT,
    lift: 0,
    colorways: IPAD_COLORWAYS.ipadpro13,
    render: ({ color, screen, surface }) => (
      <IPad variant="ipadpro13" color={color} surfaceBackground={surface}>
        {screen}
      </IPad>
    ),
  },
  {
    id: 'ipad-pro-11',
    name: 'iPad Pro 11″',
    res: resOf('ipad', { variant: 'ipadpro11' }),
    fit: TABLET_FIT,
    lift: 0,
    colorways: IPAD_COLORWAYS.ipadpro11,
    render: ({ color, screen, surface }) => (
      <IPad variant="ipadpro11" color={color} surfaceBackground={surface}>
        {screen}
      </IPad>
    ),
  },
  {
    id: 'ipad-air-13',
    name: 'iPad Air 13″',
    res: resOf('ipad', { variant: 'ipadair13' }),
    fit: TABLET_FIT,
    lift: 0,
    colorways: IPAD_COLORWAYS.ipadair13,
    render: ({ color, screen, surface }) => (
      <IPad variant="ipadair13" color={color} surfaceBackground={surface}>
        {screen}
      </IPad>
    ),
  },
  {
    id: 'ipad-air-11',
    name: 'iPad Air 11″',
    res: resOf('ipad', { variant: 'ipadair11' }),
    fit: TABLET_FIT,
    lift: 0,
    colorways: IPAD_COLORWAYS.ipadair11,
    render: ({ color, screen, surface }) => (
      <IPad variant="ipadair11" color={color} surfaceBackground={surface}>
        {screen}
      </IPad>
    ),
  },
  {
    id: 'ipad-11',
    name: 'iPad 11″',
    res: resOf('ipad', { variant: 'ipad11' }),
    fit: TABLET_FIT,
    lift: 0,
    colorways: IPAD_COLORWAYS.ipad11,
    render: ({ color, screen, surface }) => (
      <IPad variant="ipad11" color={color} surfaceBackground={surface}>
        {screen}
      </IPad>
    ),
  },
  {
    id: 'galaxy-tab-s11',
    name: 'Galaxy Tab S11',
    res: resOf('galaxyTab', { variant: 'tabs11' }),
    fit: TABLET_FIT,
    lift: 0,
    colorways: GALAXY_TAB_COLORWAYS.tabs11,
    render: ({ color, screen, surface }) => (
      <GalaxyTab variant="tabs11" color={color} surfaceBackground={surface}>
        {screen}
      </GalaxyTab>
    ),
  },
  {
    id: 'galaxy-tab-s11-ultra',
    name: 'Galaxy Tab S11 Ultra',
    res: resOf('galaxyTab', { variant: 'tabs11ultra' }),
    fit: TABLET_FIT,
    lift: 0,
    colorways: GALAXY_TAB_COLORWAYS.tabs11ultra,
    render: ({ color, screen, surface }) => (
      <GalaxyTab variant="tabs11ultra" color={color} surfaceBackground={surface}>
        {screen}
      </GalaxyTab>
    ),
  },
  {
    id: 'apple-watch-series-11',
    name: 'Apple Watch Series 11',
    res: resOf('appleWatch'),
    fit: WATCH_FIT,
    lift: 0,
    colorways: APPLE_WATCH_COLORWAYS.series11,
    render: ({ color, screen, surface }) => <AppleWatch color={color} surfaceBackground={surface}>{screen}</AppleWatch>,
  },
  {
    id: 'galaxy-watch-8',
    name: 'Galaxy Watch 8',
    res: resOf('galaxyWatch'),
    fit: WATCH_FIT,
    lift: 0,
    colorways: GALAXY_WATCH_COLORWAYS.watch8,
    render: ({ color, screen, surface }) => <GalaxyWatch color={color} surfaceBackground={surface}>{screen}</GalaxyWatch>,
  },
  {
    id: 'studio-display',
    name: 'Studio Display 27″',
    res: resOf('studioDisplay'),
    fit: DISPLAY_FIT,
    lift: 0.1,
    colorways: STUDIO_DISPLAY_COLORWAYS,
    render: ({ color, screen, surface }) => <StudioDisplay color={color} surfaceBackground={surface}>{screen}</StudioDisplay>,
  },
]

const N = DEVICES.length

/**
 * Shortest signed distance from `x` to 0 on a ring of N - the float version,
 * so a slide that crosses the seam (21 → 0) travels one step rather than
 * winding all the way back. This is what makes the loop endless in both
 * directions.
 */
function wrapDelta(x: number): number {
  const m = ((x % N) + N) % N
  return m > N / 2 ? m - N : m
}

/** The screen each device wears while it is the one on stage. */
function screenFor(id: string): ReactNode {
  if (id.startsWith('macbook') || id === 'studio-display' || id === 'galaxy-z-fold7') return <DesktopScreen />
  if (id === 'apple-watch-series-11') return <WatchFace />
  if (id === 'galaxy-watch-8') return <GalaxyWatchFace />
  if (id.startsWith('ipad') || id.startsWith('galaxy-tab')) return <LockScreen />
  return <MusicPlayer />
}

interface Orbit {
  rx: number
  ry: number
}

/**
 * Eases the ring position toward its target once per frame.
 *
 * Every slot in both rows reads this one number, so the stage and the strip
 * beneath it are the same motion sampled at two scales - the strip cannot
 * drift out of step with the device on stage, and neither of them "swaps":
 * they travel.
 */
function Ticker({ anim, target }: { anim: RefObject<number>; target: RefObject<number> }) {
  useFrame((_, delta) => {
    anim.current += (target.current - anim.current) * (1 - Math.exp(-6 * delta))
  })
  return null
}

/** One staged device, placed from the shared ring position every frame. */
function StageSlot({
  entry,
  index,
  anim,
  orbit,
  live,
  color,
  onSelect,
}: {
  entry: Entry
  index: number
  anim: RefObject<number>
  orbit: RefObject<Orbit>
  live: boolean
  color: string
  onSelect: () => void
}) {
  const group = useRef<Group>(null)

  useFrame((state) => {
    const g = group.current
    if (!g) return
    const d = wrapDelta(index - anim.current)
    // 0 while centred, 1 once a full step out - drives everything that
    // distinguishes the device on stage from the ones flanking it.
    const t = Math.min(Math.abs(d), 1)
    const scale = entry.fit * (1 - (1 - SIDE_SCALE) * t)
    g.position.x = d * SPACING
    g.position.y = STAGE_Y + entry.lift * scale + Math.sin(state.clock.elapsedTime * 1.1) * 0.05 * (1 - t)
    g.position.z = -1.4 * t
    g.scale.setScalar(scale)
    g.rotation.y = BASE_RY + (orbit.current.ry - BASE_RY) * (1 - t)
    g.rotation.x = orbit.current.rx * (1 - t)
  })

  return (
    <group ref={group} onClick={onSelect}>
      {entry.render({
        color,
        // Only the device on stage carries live DOM; the ones sliding past
        // wear a painted screen, which costs no DOM layer and cannot flash
        // as it mounts mid-transition.
        screen: live ? screenFor(entry.id) : null,
        surface: live ? undefined : ROW_SURFACE,
      })}
    </group>
  )
}

/** One thumbnail in the strip, scrolling on the same ring position. */
function RowSlot({
  entry,
  index,
  anim,
  color,
  onSelect,
}: {
  entry: Entry
  index: number
  anim: RefObject<number>
  color: string
  onSelect: () => void
}) {
  const group = useRef<Group>(null)
  const hovered = useRef(false)

  useFrame(() => {
    const g = group.current
    if (!g) return
    const d = wrapDelta(index - anim.current)
    const near = Math.max(0, 1 - Math.abs(d))
    const scale = entry.fit * ROW_SCALE * (1 + 0.3 * near) * (hovered.current ? 1.1 : 1)
    g.position.x = d * ROW_SPACING
    g.position.y = ROW_Y + entry.lift * scale
    g.scale.setScalar(scale)
    g.rotation.y = BASE_RY
  })

  return (
    <group
      ref={group}
      onClick={onSelect}
      onPointerOver={() => {
        hovered.current = true
      }}
      onPointerOut={() => {
        hovered.current = false
      }}
    >
      {entry.render({ color, screen: null, surface: ROW_SURFACE })}
    </group>
  )
}

export default function CarouselScene() {
  const [active, setActive] = useState(0)
  // Colorway selection per device, defaulting to each catalog's lead finish.
  const [finish, setFinish] = useState<Record<string, string>>({})
  const [auto, setAuto] = useState(true)

  // The ring position: `target` is unbounded so successive steps keep moving
  // in one direction across the seam; `anim` chases it.
  const target = useRef(0)
  const anim = useRef(0)
  const activeRef = useRef(0)
  const orbit = useRef<Orbit>({ rx: 0, ry: BASE_RY })

  const goTo = useCallback((next: number) => {
    const to = ((next % N) + N) % N
    target.current += wrapDelta(to - activeRef.current)
    activeRef.current = to
    orbit.current = { rx: 0, ry: BASE_RY }
    setActive(to)
  }, [])

  const step = useCallback((dir: number) => goTo(activeRef.current + dir), [goTo])

  useEffect(() => {
    if (!auto) return
    const t = setInterval(() => step(1), 6000)
    return () => clearInterval(t)
  }, [auto, step])

  const stop = () => setAuto(false)
  const go = (i: number) => {
    stop()
    goTo(i)
  }

  const drag = useRef<{ x: number; y: number; orbiting: boolean; moved: boolean } | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  /**
   * One canvas means the gesture is split by where it starts rather than by
   * which element it lands on: the middle of the upper stage belongs to the
   * device (drag to spin it), and everywhere else a horizontal swipe steps the
   * carousel. Taps on an object are handled in the scene by r3f's raycaster.
   */
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const r = stageRef.current?.getBoundingClientRect()
    if (!r) return
    const overDevice =
      Math.abs(e.clientX - (r.left + r.width / 2)) < r.width * 0.17 &&
      e.clientY < r.top + r.height * 0.66
    drag.current = { x: e.clientX, y: e.clientY, orbiting: overDevice, moved: false }
    if (overDevice) stop()
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    if (Math.abs(e.clientX - d.x) > 4 || Math.abs(e.clientY - d.y) > 4) d.moved = true
    if (!d.orbiting) return
    orbit.current.ry += (e.clientX - d.x) * 0.007
    orbit.current.rx = Math.max(-0.4, Math.min(0.4, orbit.current.rx - (e.clientY - d.y) * 0.004))
    d.x = e.clientX
    d.y = e.clientY
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    drag.current = null
    if (!d || d.orbiting) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(activeRef.current + (dx < 0 ? 1 : -1))
  }

  /** A tap on an object only counts when the gesture did not become a drag. */
  const select = (i: number) => () => {
    if (drag.current?.moved) return
    go(i)
  }

  const entry = DEVICES[active]!
  const selected = finish[entry.id] ?? entry.colorways[0]!.id
  const colorOf = (dev: Entry) => {
    const id = finish[dev.id] ?? dev.colorways[0]!.id
    return dev.colorways.find((c) => c.id === id)?.color ?? dev.colorways[0]!.color
  }
  const counter = `${String(active + 1).padStart(2, '0')} / ${N}`

  /**
   * Which slots exist. Both windows are wider than what is on screen so a slot
   * mounts out at the faded edge and slides in, rather than appearing in view.
   */
  const inWindow = (i: number, w: number) => Math.abs(wrapDelta(i - active)) <= w

  return (
    <section className="carousel" aria-label="Device carousel">
      <div className="carousel-glow" aria-hidden />
      <div
        className="carousel-stage"
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          drag.current = null
        }}
      >
        <MockupCanvas
          controls={false}
          shadows={false}
          camera={{ position: [0, 0, CAMERA_Z], fov: 40 }}
        >
          <Ticker anim={anim} target={target} />

          {DEVICES.map((dev, i) =>
            inWindow(i, 2) ? (
              <StageSlot
                key={dev.id}
                entry={dev}
                index={i}
                anim={anim}
                orbit={orbit}
                live={i === active}
                color={colorOf(dev)}
                onSelect={select(i)}
              />
            ) : null
          )}

          {DEVICES.map((dev, i) =>
            inWindow(i, 3) ? (
              <RowSlot
                key={`row-${dev.id}`}
                entry={dev}
                index={i}
                anim={anim}
                color={colorOf(dev)}
                onSelect={select(i)}
              />
            ) : null
          )}
        </MockupCanvas>
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
        {/* The strip is geometry in the canvas, so keyboard and screen-reader
            users get the same jumps from real buttons here. */}
        <div className="sr-only">
          {DEVICES.map((dev, i) => (
            <button key={dev.id} type="button" onClick={() => go(i)}>
              Show {dev.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
