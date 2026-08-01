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
  DEFAULT_CAMERA_FOV,
  DEFAULT_CAMERA_POSITION,
  ORBIT,
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
/**
 * Vertical limit, matched to the stage's polar clamp: the library's controls
 * orbit the camera between `ORBIT.minPolarAngle` and its mirror, which from a
 * level start is this much tilt either way.
 */
const PITCH_LIMIT = Math.PI / 2 - ORBIT.minPolarAngle

/**
 * Drag-to-rotate with the same feel as every mockup in the docs.
 *
 * Those spin the CAMERA with `TumbleControls`; here the camera has to stay put
 * - it frames the whole carousel - so the staged object turns instead. The
 * numbers are the library's, not new ones: a drag is queued as
 * `2*PI * delta / height` radians (a full-height drag is a full turn), and
 * each frame applies `ORBIT.dampingFactor` of what is pending and decays the
 * rest. That buffer is what keeps a flick spinning after release, slowing to a
 * stop. Rotating the object is the mirror of rotating the camera around it, so
 * both signs are flipped against `TumbleOrbit` to land on the same direction.
 */
interface Tumble {
  pendingYaw: number
  pendingPitch: number
  yaw: number
  pitch: number
}

const restingTumble = (): Tumble => ({ pendingYaw: 0, pendingPitch: 0, yaw: BASE_RY, pitch: 0 })

function advanceTumble(t: Tumble): void {
  const yaw = t.pendingYaw * ORBIT.dampingFactor
  const pitch = t.pendingPitch * ORBIT.dampingFactor
  t.pendingYaw *= 1 - ORBIT.dampingFactor
  t.pendingPitch *= 1 - ORBIT.dampingFactor
  t.yaw += yaw
  t.pitch = Math.min(PITCH_LIMIT, Math.max(-PITCH_LIMIT, t.pitch + pitch))
}

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
  render: (props: {
    color: string
    screen: ReactNode
    surface?: string
    surfaceStyle?: Record<string, unknown>
  }) => ReactNode
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
    render: ({ color, screen, surface, surfaceStyle }) => (
      <Galaxy variant="s26" color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle}>
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
    render: ({ color, screen, surface, surfaceStyle }) => (
      <Galaxy variant="s26ultra" color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle}>
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
    render: ({ color, screen, surface, surfaceStyle }) => (
      <IPhone variant="17" color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle}>
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
    render: ({ color, screen, surface, surfaceStyle }) => (
      <IPhone variant="air" color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle}>
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
    render: ({ color, screen, surface, surfaceStyle }) => (
      <IPhone variant="pro" color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle}>
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
    render: ({ color, screen, surface, surfaceStyle }) => (
      <IPhone variant="promax" color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle}>
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
    render: ({ color, screen, surface, surfaceStyle }) => (
      <Fold color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle}>{screen}</Fold>
    ),
  },
  {
    id: 'galaxy-z-flip7',
    name: 'Galaxy Z Flip 7',
    res: resOf('flip', { open: true }),
    fit: FLIP_FIT,
    lift: 0,
    colorways: FLIP_COLORWAYS.flip7,
    render: ({ color, screen, surface, surfaceStyle }) => (
      <Flip color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle}>{screen}</Flip>
    ),
  },
  {
    id: 'macbook-air-13',
    name: 'MacBook Air 13″',
    res: resOf('laptop', { variant: 'air13' }),
    fit: LAPTOP_FIT,
    lift: 0.55,
    colorways: LAPTOP_COLORWAYS.air13,
    render: ({ color, screen, surface, surfaceStyle }) => (
      <Laptop variant="air13" color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle}>
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
    render: ({ color, screen, surface, surfaceStyle }) => (
      <Laptop variant="air15" color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle}>
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
    render: ({ color, screen, surface, surfaceStyle }) => (
      <Laptop variant="pro14" color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle}>
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
    render: ({ color, screen, surface, surfaceStyle }) => (
      <Laptop variant="pro16" color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle}>
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
    render: ({ color, screen, surface, surfaceStyle }) => (
      <IPad variant="ipadpro13" color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle}>
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
    render: ({ color, screen, surface, surfaceStyle }) => (
      <IPad variant="ipadpro11" color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle}>
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
    render: ({ color, screen, surface, surfaceStyle }) => (
      <IPad variant="ipadair13" color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle}>
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
    render: ({ color, screen, surface, surfaceStyle }) => (
      <IPad variant="ipadair11" color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle}>
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
    render: ({ color, screen, surface, surfaceStyle }) => (
      <IPad variant="ipad11" color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle}>
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
    render: ({ color, screen, surface, surfaceStyle }) => (
      <GalaxyTab variant="tabs11" color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle}>
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
    render: ({ color, screen, surface, surfaceStyle }) => (
      <GalaxyTab variant="tabs11ultra" color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle}>
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
    render: ({ color, screen, surface, surfaceStyle }) => <AppleWatch color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle}>{screen}</AppleWatch>,
  },
  {
    id: 'galaxy-watch-8',
    name: 'Galaxy Watch 8',
    res: resOf('galaxyWatch'),
    fit: WATCH_FIT,
    lift: 0,
    colorways: GALAXY_WATCH_COLORWAYS.watch8,
    render: ({ color, screen, surface, surfaceStyle }) => <GalaxyWatch color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle}>{screen}</GalaxyWatch>,
  },
  {
    id: 'studio-display',
    name: 'Studio Display 27″',
    res: resOf('studioDisplay'),
    fit: DISPLAY_FIT,
    lift: 0.1,
    colorways: STUDIO_DISPLAY_COLORWAYS,
    render: ({ color, screen, surface, surfaceStyle }) => <StudioDisplay color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle}>{screen}</StudioDisplay>,
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

/**
 * Eases the ring position toward its target once per frame.
 *
 * Every slot in both rows reads this one number, so the stage and the strip
 * beneath it are the same motion sampled at two scales - the strip cannot
 * drift out of step with the device on stage, and neither of them "swaps":
 * they travel.
 */
function Ticker({
  anim,
  target,
  tumble,
}: {
  anim: RefObject<number>
  target: RefObject<number>
  tumble: RefObject<Tumble>
}) {
  // Priority -2: the ring position and the tumble are inputs to every slot's
  // own -1 pass, which in turn has to land before drei's default-priority
  // <Html> sync (see StageSlot).
  useFrame((_, delta) => {
    anim.current += (target.current - anim.current) * (1 - Math.exp(-6 * delta))
    advanceTumble(tumble.current)
  }, -2)
  return null
}

/** One staged device, placed from the shared ring position every frame. */
function StageSlot({
  entry,
  index,
  anim,
  tumble,
  color,
}: {
  entry: Entry
  index: number
  anim: RefObject<number>
  tumble: RefObject<Tumble>
  color: string
}) {
  const group = useRef<Group>(null)
  const hovered = useRef(false)

  /*
   * Priority -1, then an explicit matrix flush.
   *
   * drei's <Html transform> places each live screen from its own
   * default-priority frame callback, reading the matrix three last computed -
   * during the PREVIOUS frame's render. Moving the object at -1 is only half
   * the fix; without recomputing the matrix here the screen still positions
   * itself from where the device used to be, and the DOM visibly trails the
   * body while a slide is in flight.
   */
  useFrame((state) => {
    const g = group.current
    if (!g) return
    const d = wrapDelta(index - anim.current)
    // 0 while centred, 1 once a full step out - drives everything that
    // distinguishes the device on stage from the ones flanking it.
    const t = Math.min(Math.abs(d), 1)
    const near = 1 - t
    const scale = entry.fit * (1 - (1 - SIDE_SCALE) * t) * (hovered.current && t > 0.5 ? 1.05 : 1)
    g.position.x = d * SPACING
    g.position.y = STAGE_Y + entry.lift * scale + Math.sin(state.clock.elapsedTime * 1.1) * 0.05 * near
    g.position.z = -1.4 * t
    g.scale.setScalar(scale)
    g.rotation.y = BASE_RY + (tumble.current.yaw - BASE_RY) * near
    g.rotation.x = tumble.current.pitch * near
    g.updateMatrixWorld(true)
  }, -1)

  return (
    <group
      ref={group}
      onPointerOver={() => {
        hovered.current = true
      }}
      onPointerOut={() => {
        hovered.current = false
      }}
    >
      {entry.render({
        color,
        /*
         * Every staged slot carries its screen for as long as it exists -
         * including the two waiting off-stage. Mounting them as a device
         * reached the middle meant a fast run through the carousel was a
         * stream of screens arriving and leaving; now the DOM is created out
         * past the fade and simply travels with its device.
         */
        screen: screenFor(entry.id),
        surfaceStyle: { animation: 'screen-fade-in 320ms ease both' },
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
    g.updateMatrixWorld(true)
  }, -1)

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
  const tumble = useRef<Tumble>(restingTumble())

  /** Move the readout and the render window without disturbing the ring. */
  const syncActive = useCallback((to: number) => {
    if (to === activeRef.current) return
    activeRef.current = to
    setActive(to)
  }, [])

  const goTo = useCallback(
    (next: number) => {
      const to = ((next % N) + N) % N
      target.current += wrapDelta(to - activeRef.current)
      tumble.current = restingTumble()
      syncActive(to)
    },
    [syncActive]
  )

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

  const drag = useRef<{
    /** Where the gesture started; `x` tracks the latest move for velocity. */
    x0: number
    x: number
    y: number
    zone: Zone
    orbiting: boolean
    moved: boolean
    /** Ring position when the gesture started, for direct-manipulation scroll. */
    from: number
    /** Slots per pixel at the stage's scale. */
    perPx: number
    /** Most recent horizontal speed, in px/ms, for the flick. */
    vx: number
    at: number
  } | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const moved = useRef(false)

  /**
   * Where a pointer is, in the terms the gestures care about.
   *
   * `device` spins the staged object, `left`/`right` browse, and `row` is the
   * strip - whose taps belong to r3f's raycaster, since which thumbnail you
   * hit is the whole point there.
   */
  type Zone = 'device' | 'left' | 'right' | 'row'

  const zoneAt = (clientX: number, clientY: number): Zone => {
    const r = stageRef.current?.getBoundingClientRect()
    if (!r) return 'row'
    if (clientY > r.top + r.height * 0.7) return 'row'
    if (Math.abs(clientX - (r.left + r.width / 2)) < r.width * 0.17) return 'device'
    return clientX < r.left + r.width / 2 ? 'left' : 'right'
  }

  /**
   * How far one slot is on screen. The stage's height covers a known slice of
   * the world at the camera's distance and fov, which converts world units to
   * pixels - so a browse drag can move the ring by exactly as much as the
   * cursor moved, and the device under the pointer stays under it.
   */
  const slotsPerPixel = () => {
    const height = stageRef.current?.clientHeight || 1
    const worldPerPx = (2 * CAMERA_Z * Math.tan((DEFAULT_CAMERA_FOV * Math.PI) / 360)) / height
    return worldPerPx / SPACING
  }

  /**
   * Which gesture the pointer is over, written straight to the element rather
   * than through state - this fires on every move. `left`/`right` also light
   * the matching edge, so the navigable region is visible before you commit.
   */
  const setZone = (clientX: number, clientY: number) => {
    const el = stageRef.current
    if (el) el.dataset.zone = zoneAt(clientX, clientY)
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const zone = zoneAt(e.clientX, e.clientY)
    // r3f fires its click AFTER pointerup, by which time `drag` is cleared -
    // so whether the gesture moved has to outlive it, or a nudge on the staged
    // device reads as a tap and resets the very rotation it just started.
    moved.current = false
    drag.current = {
      x0: e.clientX,
      x: e.clientX,
      y: e.clientY,
      zone,
      orbiting: zone === 'device',
      moved: false,
      from: anim.current,
      perPx: slotsPerPixel(),
      vx: 0,
      at: performance.now(),
    }
    if (stageRef.current) stageRef.current.dataset.dragging = 'true'
    stop()
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) {
      setZone(e.clientX, e.clientY)
      return
    }
    if (Math.abs(e.clientX - d.x0) > 4 || Math.abs(e.clientY - d.y) > 4) {
      d.moved = true
      moved.current = true
    }

    if (d.orbiting) {
      const height = stageRef.current?.clientHeight || 1
      tumble.current.pendingYaw += (2 * Math.PI * (e.clientX - d.x)) / height
      tumble.current.pendingPitch += (2 * Math.PI * (e.clientY - d.y)) / height
      d.x = e.clientX
      d.y = e.clientY
      return
    }

    // Browse drag: the ring follows the cursor one-for-one. `anim` is set with
    // `target` so the easing has nothing to catch up on mid-gesture - it takes
    // over only once the drag ends and the ring snaps to a slot.
    const now = performance.now()
    d.vx = (e.clientX - d.x) / Math.max(1, now - d.at)
    d.at = now
    d.x = e.clientX
    target.current = d.from - (e.clientX - d.x0) * d.perPx
    anim.current = target.current
    syncActive(((Math.round(anim.current) % N) + N) % N)
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    drag.current = null
    if (stageRef.current) stageRef.current.dataset.dragging = 'false'
    if (!d) return
    if (!d.moved) {
      // A click, not a drag. Either half of the stage steps one slot towards
      // the side you clicked - the side device, the chevron and the empty
      // space around them all do the same thing, every time. The strip is left
      // alone so its taps can pick out a specific thumbnail, and a click on
      // the staged device does nothing rather than resetting its pose.
      if (d.zone === 'left') step(-1)
      else if (d.zone === 'right') step(1)
      return
    }
    if (d.orbiting) return
    // Carry the flick a little past where the finger stopped, then settle on
    // whichever slot that lands nearest.
    const flick = Math.max(-1.2, Math.min(1.2, -d.vx * d.perPx * 220))
    target.current = Math.round(anim.current + flick)
    tumble.current = restingTumble()
    syncActive(((Math.round(target.current) % N) + N) % N)
  }

  /** A tap on a thumbnail only counts when the gesture did not become a drag. */
  const select = (i: number) => () => {
    if (moved.current) return
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
          if (stageRef.current) stageRef.current.dataset.dragging = 'false'
        }}
        onPointerLeave={() => {
          if (stageRef.current) stageRef.current.dataset.zone = ''
        }}
      >
        <MockupCanvas
          controls={false}
          shadows={false}
          camera={{ position: [0, 0, CAMERA_Z], fov: DEFAULT_CAMERA_FOV }}
        >
          <Ticker anim={anim} target={target} tumble={tumble} />

          {DEVICES.map((dev, i) =>
            inWindow(i, 2) ? (
              <StageSlot
                key={dev.id}
                entry={dev}
                index={i}
                anim={anim}
                tumble={tumble}
                color={colorOf(dev)}
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

      {/* Lights the half you are hovering, so the drag-to-browse region is
          visible rather than merely implied by the cursor. */}
      <div className="carousel-edges" aria-hidden>
        <span className="carousel-centre">
          <span className="carousel-rotate-badge">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v6h-6" />
            </svg>
            Drag to rotate
          </span>
        </span>
        <span className="carousel-edge" data-side="left">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </span>
        <span className="carousel-edge" data-side="right">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
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
                  // One full turn, queued into the same buffer a flick uses -
                  // so the finish is seen from every side, and it decelerates
                  // into place instead of stopping dead.
                  tumble.current.pendingYaw += 2 * Math.PI
                }}
              />
            ))}
          </span>
          <span className="carousel-finish-name" style={{ textTransform: 'uppercase' }}>
            {entry.colorways.find((c) => c.id === selected)?.name}
          </span>
        </div>
        <p className="carousel-hint">
          Drag the device to spin it · drag either side to browse
        </p>
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
