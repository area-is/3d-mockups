import * as React from 'react'
import { AbsoluteFill } from 'remotion'
import { useThree } from '@react-three/fiber'
import {
  AppleWatch,
  AppleWatchMockup,
  GalaxyWatch,
  IPad,
  IPhone,
  IPhoneDuo,
  Laptop,
  MockupCanvas,
  type IPadVariant,
  type IPhoneVariant,
  type LaptopVariant,
  FlipMockup,
  FoldMockup,
  GalaxyWatchMockup,
  IPhoneDuoMockup,
  type AppleWatchVariant,
  type FlipVariant,
  type FoldVariant,
  type GalaxyWatchVariant,
} from 'react-3d-mockups'
import { useMockupCapture } from '../use-mockup-capture'
import { SANS } from '../reel/screens'

/*
 * Model sheets: one device from several fixed angles on one page, for
 * comparing a model against reference photos, and a foldable at a row of hinge
 * angles, for checking which display is live at each. Stills, not motion -
 * render one frame with `remotion still`.
 */

type Vec3 = [number, number, number]

// The side views slide the watch over and step it back, so the whole strap
// loop behind the case is in the frame - the stage frames the case face.
type WatchView = {
  label: string
  rotation: Vec3
  position?: Vec3
  scale?: number
  camera?: { position: Vec3; fov: number }
}

// A long lens from far off: next to flat, like the side-on product shots the
// model is checked against, where the stage's close camera shows the inside
// of the strap all the way round the loop.
const TELEPHOTO = { position: [0, 0, 44] as Vec3, fov: 7 }

const WATCH_VIEWS: WatchView[] = [
  { label: 'front', rotation: [0, 0, 0] },
  { label: 'three-quarter', rotation: [0.2, -0.7, 0] },
  { label: 'crown side', rotation: [0, -Math.PI / 2, 0], position: [-0.75, 0, 0], scale: 0.8, camera: TELEPHOTO },
  { label: 'left side', rotation: [0, Math.PI / 2, 0], position: [0.75, 0, 0], scale: 0.8, camera: TELEPHOTO },
  { label: 'back', rotation: [0, Math.PI, 0] },
  { label: 'from above', rotation: [Math.PI / 2 - 0.05, 0, 0] },
]

function Cell({ label, children, background = '#e9e9ec' }: { label: string; children: React.ReactNode; background?: string }) {
  return (
    <div style={{ position: 'relative', background, borderRadius: 12, overflow: 'hidden' }}>
      {children}
      <div style={{ position: 'absolute', left: 14, top: 10, fontFamily: SANS, fontSize: 22, color: '#333' }}>{label}</div>
    </div>
  )
}

function WatchFace() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#000', color: '#ff9f0a', display: 'grid', placeItems: 'center', fontFamily: SANS, fontSize: 40, fontWeight: 700 }}>
      10:09
    </div>
  )
}

export type WatchSheetProps = {
  kind: 'apple' | 'galaxy'
  variant: string
  bandOpen?: boolean
  color?: string
  bandColor?: string
  /** Replace the six standard views - close-ups of the band hardware, say. */
  views?: WatchView[]
}

export function WatchSheet({ kind, variant, bandOpen = false, color, bandColor, views = WATCH_VIEWS }: WatchSheetProps) {
  const delayCapture = useMockupCapture()
  return (
    <AbsoluteFill style={{ background: '#fff', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: 12, padding: 12 }}>
      {views.map((view) => (
        <Cell key={view.label} label={`${variant} · ${view.label}`}>
          {kind === 'apple' ? (
            <AppleWatchMockup controls={false} delayCapture={delayCapture} variant={variant as AppleWatchVariant} color={color} bandColor={bandColor} rotation={view.rotation} position={view.position} scale={view.scale} camera={view.camera}>
              <WatchFace />
            </AppleWatchMockup>
          ) : (
            <GalaxyWatchMockup controls={false} delayCapture={delayCapture} variant={variant as GalaxyWatchVariant} bandOpen={bandOpen} color={color} bandColor={bandColor} rotation={view.rotation} position={view.position} scale={view.scale} camera={view.camera}>
              <WatchFace />
            </GalaxyWatchMockup>
          )}
        </Cell>
      ))}
    </AbsoluteFill>
  )
}

/** Hides the worn band, which on a real wrist covers the case back. */
function HideBand() {
  const scene = useThree((state) => state.scene)
  const invalidate = useThree((state) => state.invalidate)
  React.useLayoutEffect(() => {
    scene.traverse((object) => {
      if (object.name === 'watch-band') object.visible = false
    })
    invalidate()
  })
  return null
}

const BACK_VIEWS: { label: string; rotation: Vec3; distance: number; fov: number }[] = [
  { label: 'back', rotation: [0, Math.PI, 0], distance: 14, fov: 15 },
  { label: 'back, three-quarter', rotation: [0.3, Math.PI + 0.55, 0], distance: 14, fov: 15 },
  { label: 'sensor', rotation: [0, Math.PI, 0], distance: 14, fov: 7 },
  { label: 'back, low', rotation: [-0.9, Math.PI, 0], distance: 14, fov: 15 },
]

export type WatchBackSheetProps = {
  kind: 'apple' | 'galaxy'
  variant: string
  color?: string
}

/**
 * The case back, with the band hidden - worn, the band's far side covers it
 * from every angle that sees it square.
 */
export function WatchBackSheet({ kind, variant, color }: WatchBackSheetProps) {
  const delayCapture = useMockupCapture()
  return (
    <AbsoluteFill style={{ background: '#fff', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: 12, padding: 12 }}>
      {BACK_VIEWS.map((view) => (
        <Cell key={view.label} label={`${variant} · ${view.label}`}>
          <MockupCanvas controls={false} shadows={false} delayCapture={delayCapture} camera={{ position: [0, 0, view.distance], fov: view.fov }}>
            <HideBand />
            {kind === 'apple' ? (
              <AppleWatch variant={variant as AppleWatchVariant} color={color} rotation={view.rotation}>
                <WatchFace />
              </AppleWatch>
            ) : (
              <GalaxyWatch variant={variant as GalaxyWatchVariant} color={color} rotation={view.rotation}>
                <WatchFace />
              </GalaxyWatch>
            )}
          </MockupCanvas>
        </Cell>
      ))}
    </AbsoluteFill>
  )
}

type DetailView = {
  label: string
  rotation?: Vec3
  /** Moves the device so the detail under study sits at the stage centre, where the camera looks. */
  position?: Vec3
  camera: { position: Vec3; fov: number }
}

export type DetailSheetProps = {
  device: 'iphone' | 'ipad' | 'duo' | 'laptop'
  variant?: string
  color?: string
  openAngle?: number
  columns?: number
  /** Cell background - dark to match a reel shot's backdrop. */
  background?: string
  views: DetailView[]
}

/**
 * Close-ups of one part of a device - a keyboard, a camera - from cameras
 * placed per view, for checking a detail against macro product shots.
 */
export function DetailSheet({ device, variant, color, openAngle, columns = 3, background, views }: DetailSheetProps) {
  const delayCapture = useMockupCapture()
  const rows = Math.ceil(views.length / columns)
  return (
    <AbsoluteFill style={{ background: '#fff', display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)`, gap: 12, padding: 12 }}>
      {views.map((view) => (
        <Cell key={view.label} label={`${variant ?? device} · ${view.label}`} background={background}>
          <MockupCanvas controls={false} shadows={false} delayCapture={delayCapture} camera={view.camera}>
            <group position={view.position ?? [0, 0, 0]}>
              <group rotation={view.rotation ?? [0, 0, 0]}>
                {device === 'iphone' ? (
                  <IPhone variant={variant as IPhoneVariant} color={color}>
                    <Numbered label="" />
                  </IPhone>
                ) : device === 'ipad' ? (
                  <IPad variant={variant as IPadVariant} color={color}>
                    <Numbered label="" />
                  </IPad>
                ) : device === 'duo' ? (
                  <IPhoneDuo color={color} openAngle={openAngle ?? false}>
                    <Numbered label="" />
                  </IPhoneDuo>
                ) : (
                  <Laptop variant={variant as LaptopVariant} color={color} openAngle={openAngle}>
                    <Numbered label="" />
                  </Laptop>
                )}
              </group>
            </group>
          </MockupCanvas>
        </Cell>
      ))}
    </AbsoluteFill>
  )
}

const FOLD_ANGLES = [0, 2, 10, 25, 45, 70, 90, 120, 150, 180]

function Numbered({ label }: { label: string }) {
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #3e8bff, #ff3d8b)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: SANS, fontSize: 64, fontWeight: 800 }}>
      {label}
    </div>
  )
}

export type FoldSheetProps = {
  kind: 'fold' | 'flip' | 'duo'
  variant: string
  /** Turn the device so the cover screen (on the outside) faces the camera. */
  coverSide?: boolean
  orientation?: 'portrait' | 'landscape'
  coverScreenUntil?: number
}

export function FoldSheet({ kind, variant, coverSide = false, orientation = 'portrait', coverScreenUntil }: FoldSheetProps) {
  const delayCapture = useMockupCapture()
  return (
    <AbsoluteFill style={{ background: '#fff', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: 10, padding: 10 }}>
      {FOLD_ANGLES.map((angle) => {
        const rotation: Vec3 = coverSide ? [0.1, Math.PI - 0.5, 0] : [0.1, -0.5, 0]
        const common = { controls: false, delayCapture, openAngle: angle, rotation, orientation, coverScreenUntil } as const
        const screen = <Numbered label={`${angle}°`} />
        return (
          <Cell key={angle} label={`${variant} · ${angle}°`}>
            {kind === 'fold' ? (
              <FoldMockup {...common} variant={variant as FoldVariant}>{screen}</FoldMockup>
            ) : kind === 'flip' ? (
              <FlipMockup {...common} variant={variant as FlipVariant}>{screen}</FlipMockup>
            ) : (
              <IPhoneDuoMockup {...common}>{screen}</IPhoneDuoMockup>
            )}
          </Cell>
        )
      })}
    </AbsoluteFill>
  )
}
