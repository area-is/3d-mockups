import * as React from 'react'
import { AbsoluteFill, Series, useCurrentFrame, useVideoConfig } from 'remotion'
import {
  AppleWatchMockup,
  BookMockup,
  FoldMockup,
  IPhoneMockup,
  LaptopMockup,
  ProductBoxMockup,
  VinylRecordMockup,
} from 'react-3d-mockups'
import { bangle, epicentre, flux, lagoon, neon, windowpane, ziggurat } from 'tabbied/patterns'
import { useMockupCapture } from '../use-mockup-capture'
import { Backdrop } from './backdrop'
import { Caption, num, str, vec } from './caption'
import { easeOut, tween, type Vec3 } from './motion'
import {
  BookCover,
  BoxArt,
  DashboardScreen,
  GalleryScreen,
  MusicScreen,
  RecordLabel,
  SleeveArt,
  WatchScreen,
} from './screens'

/*
 * One mockup per shot, each a one-liner `*Mockup` with its own canvas.
 * Everything that moves is a prop computed from the frame: `rotation`,
 * `position`, `scale`, `openAngle`, `color`, and the `camera` itself. `time`
 * puts the mockup's own `float` and `autoRotate` on the video's clock.
 */

/** The stage props every shot shares: no orbit controls, gated captures, the video's clock. */
function useStage() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const delayCapture = useMockupCapture()
  return { controls: false, delayCapture, time: frame / fps, float: true } as const
}

/** iPhone 18 Pro Max: a full turn, with the finish changing each time it is edge-on. */
export function PhoneShot() {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const stage = useStage()
  const turn = tween(frame, 0, durationInFrames - 10, -0.55, -0.55 + Math.PI * 2)
  // Edge-on at 3π/2 and 5π/2 (relative to facing the camera): switch there,
  // where the least of the finish is visible.
  const facing = turn + 0.55
  const color = facing < Math.PI / 2 ? 'glacier' : facing < (Math.PI * 3) / 2 ? 'burgundy' : 'silver'
  const scale = tween(frame, 0, durationInFrames, 0.78, 0.95)
  const rotation: Vec3 = [0.08, turn, 0]
  return (
    <AbsoluteFill>
      <Backdrop pattern={flux} seed="reel-flux" rotate={frame * 0.12} scale={1.05 + frame * 0.0008} dim={0.15} />
      <IPhoneMockup {...stage} variant="18promax" color={color} scale={scale} position={[1.35, -0.18, 0]} rotation={rotation}>
        <MusicScreen />
      </IPhoneMockup>
      <Caption
        kicker="Turntable + colorway"
        component="IPhoneMockup"
        props={[
          ['variant', str('18promax')],
          ['color', str(color)],
          ['rotation', vec(rotation)],
          ['scale', num(scale)],
          ['float time', num(stage.time)],
        ]}
      />
    </AbsoluteFill>
  )
}

const FOLD_PALETTE = ['#140f24', '#5e548e', '#9f86c0', '#be95c4', '#e0b1cb', '#ff8fab'] as const

/** Galaxy Z Fold8: folded shut to flat open, through the Flex poses. */
export function FoldShot() {
  const frame = useCurrentFrame()
  const stage = useStage()
  const openAngle = tween(frame, 12, 96, 0, 180)
  const rotation: Vec3 = [0.12, tween(frame, 0, 120, -0.75, 0.12), 0]
  return (
    <AbsoluteFill>
      <Backdrop pattern={lagoon} seed="reel-lagoon" palette={FOLD_PALETTE} rotate={-frame * 0.08} scale={1.1 - frame * 0.0005} />
      <FoldMockup {...stage} variant="fold8" color="lavender" openAngle={Math.round(openAngle)} position={[1.25, -0.1, 0]} rotation={rotation}>
        <GalleryScreen />
      </FoldMockup>
      <Caption
        kicker="Hinge angle"
        component="FoldMockup"
        props={[
          ['variant', str('fold8')],
          ['openAngle', `{${Math.round(openAngle)}}`],
          ['rotation', vec(rotation)],
        ]}
      />
    </AbsoluteFill>
  )
}

/** MacBook Neo: the lid opens, then the camera itself pushes in on the dashboard. */
export function LaptopShot() {
  const frame = useCurrentFrame()
  const stage = useStage()
  const openAngle = tween(frame, 6, 54, 0, 108, easeOut)
  const rotation: Vec3 = [tween(frame, 0, 120, 0.42, 0.12), tween(frame, 0, 120, 0.6, -0.22), 0]
  // The `camera` prop is live: a new position or fov moves the camera.
  const camera = {
    position: [0, tween(frame, 40, 120, 0.9, 0.35), tween(frame, 40, 120, 9.6, 6.4)] as Vec3,
    fov: tween(frame, 40, 120, 40, 34),
  }
  return (
    <AbsoluteFill>
      <Backdrop pattern={neon} seed="reel-neon" x={-frame * 1.6} scale={1.15} vignette={0.55} />
      <LaptopMockup {...stage} variant="neo13" color="indigo" openAngle={openAngle} camera={camera} position={[tween(frame, 40, 120, 0.9, 0.5), tween(frame, 40, 120, -0.2, -0.95), 0]} rotation={rotation}>
        <DashboardScreen />
      </LaptopMockup>
      <Caption
        kicker="Lid + push-in"
        component="LaptopMockup"
        props={[
          ['variant', str('neo13')],
          ['openAngle', num(openAngle, 0)],
          ['camera.position', vec(camera.position)],
          ['camera.fov', num(camera.fov, 1)],
        ]}
      />
    </AbsoluteFill>
  )
}

/** Apple Watch Ultra 4: auto-rotate on the video's clock, and a dolly in. */
export function WatchShot() {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const stage = useStage()
  // Negative turns the other way; 9 revolutions a minute is ~0.45 of a turn here.
  const autoRotate = -9
  const camera = { position: [0, 0.4, tween(frame, 0, durationInFrames, 8.4, 6.2)] as Vec3, fov: 40 }
  return (
    <AbsoluteFill>
      <Backdrop pattern={epicentre} seed="reel-epicentre" scale={1 + frame * 0.002} dim={0.35} />
      <AppleWatchMockup {...stage} variant="ultra4" color="natural" autoRotate={autoRotate} camera={camera} rotation={[0.1, 0.9, 0]}>
        <WatchScreen />
      </AppleWatchMockup>
      <Caption
        kicker="autoRotate on the video's clock"
        component="AppleWatchMockup"
        props={[
          ['variant', str('ultra4')],
          ['autoRotate', `{${autoRotate}}`],
          ['time', num(stage.time)],
          ['camera.position', vec(camera.position)],
        ]}
      />
    </AbsoluteFill>
  )
}

/** Beyond devices: a record, a book and a box, one quick beat each. */
export function ObjectsShot({ beat }: { beat: number }) {
  return (
    <Series>
      <Series.Sequence durationInFrames={beat}>
        <RecordBeat />
      </Series.Sequence>
      <Series.Sequence durationInFrames={beat}>
        <BookBeat />
      </Series.Sequence>
      <Series.Sequence durationInFrames={beat}>
        <BoxBeat />
      </Series.Sequence>
    </Series>
  )
}

function RecordBeat() {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const stage = useStage()
  const pose = { position: [1, 0, 0] as Vec3, rotation: [0.1, tween(frame, 0, durationInFrames, -0.7, 0.35), 0] as Vec3 }
  return (
    <AbsoluteFill>
      <Backdrop pattern={bangle} seed="reel-bangle" rotate={frame * 0.2} />
      <VinylRecordMockup {...stage} {...pose}>
        <VinylRecordMockup.Cover>
          <SleeveArt />
        </VinylRecordMockup.Cover>
        <VinylRecordMockup.Label>
          <RecordLabel />
        </VinylRecordMockup.Label>
      </VinylRecordMockup>
      <Caption kicker="Objects too" component="VinylRecordMockup" props={[['rotation', vec(pose.rotation)]]} />
    </AbsoluteFill>
  )
}

function BookBeat() {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const stage = useStage()
  const pose = { position: [1, 0, 0] as Vec3, rotation: [0.05, tween(frame, 0, durationInFrames, 0.9, -0.35), 0] as Vec3 }
  return (
    <AbsoluteFill>
      <Backdrop pattern={windowpane} seed="reel-windowpane" y={-frame * 1.2} />
      <BookMockup {...stage} color="#10203a" {...pose}>
        <BookCover />
      </BookMockup>
      <Caption kicker="Objects too" component="BookMockup" props={[['rotation', vec(pose.rotation)]]} />
    </AbsoluteFill>
  )
}

function BoxBeat() {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const stage = useStage()
  const scale = tween(frame, 0, durationInFrames, 0.9, 1.08)
  const pose = { position: [1, 0, 0] as Vec3, rotation: [0.25, tween(frame, 0, durationInFrames, -0.8, 0.5), 0] as Vec3 }
  return (
    <AbsoluteFill>
      <Backdrop pattern={ziggurat} seed="reel-ziggurat" x={frame * 1.4} />
      <ProductBoxMockup {...stage} color="#f4f1ea" scale={scale} {...pose}>
        <BoxArt />
      </ProductBoxMockup>
      <Caption kicker="Objects too" component="ProductBoxMockup" props={[['rotation', vec(pose.rotation)], ['scale', num(scale)]]} />
    </AbsoluteFill>
  )
}
