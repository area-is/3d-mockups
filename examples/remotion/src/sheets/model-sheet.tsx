import * as React from 'react'
import { AbsoluteFill } from 'remotion'
import {
  AppleWatchMockup,
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

const WATCH_VIEWS: { label: string; rotation: Vec3 }[] = [
  { label: 'front', rotation: [0, 0, 0] },
  { label: 'three-quarter', rotation: [0.2, -0.7, 0] },
  { label: 'crown side', rotation: [0, -Math.PI / 2, 0] },
  { label: 'left side', rotation: [0, Math.PI / 2, 0] },
  { label: 'back', rotation: [0, Math.PI, 0] },
  { label: 'from above', rotation: [Math.PI / 2 - 0.05, 0, 0] },
]

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', background: '#e9e9ec', borderRadius: 12, overflow: 'hidden' }}>
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
}

export function WatchSheet({ kind, variant, bandOpen = false }: WatchSheetProps) {
  const delayCapture = useMockupCapture()
  return (
    <AbsoluteFill style={{ background: '#fff', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: 12, padding: 12 }}>
      {WATCH_VIEWS.map((view) => (
        <Cell key={view.label} label={`${variant} · ${view.label}`}>
          {kind === 'apple' ? (
            <AppleWatchMockup controls={false} delayCapture={delayCapture} variant={variant as AppleWatchVariant} rotation={view.rotation}>
              <WatchFace />
            </AppleWatchMockup>
          ) : (
            <GalaxyWatchMockup controls={false} delayCapture={delayCapture} variant={variant as GalaxyWatchVariant} bandOpen={bandOpen} rotation={view.rotation}>
              <WatchFace />
            </GalaxyWatchMockup>
          )}
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
