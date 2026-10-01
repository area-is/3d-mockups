import * as React from 'react'
import type { PerspectiveCamera } from 'three'
import { useThree } from '@react-three/fiber'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { AppleWatch, IPad, IPhone, Laptop, MockupCanvas } from 'react-3d-mockups'
import { bokeh } from 'tabbied/patterns'
import { useMockupCapture } from '../use-mockup-capture'
import { Backdrop } from './backdrop'
import { Caption, num, vec } from './caption'
import { easeInOut, floatAt, floated, type Vec3 } from './motion'
import { DashboardScreen, MusicScreen, PlannerScreen, WatchScreen } from './screens'

/*
 * Four devices on one stage, at their true relative sizes. Each family is
 * modelled at its own world scale (`mockupInfo(kind).mmPerUnit`), so each is
 * scaled onto the laptop's: 72.4 mm per unit.
 */
const MM_PER_UNIT = { laptop: 72.4, ipad: 64, iphone: 37.15, watch: 17.7 }
const onLaptopScale = (mmPerUnit: number) => mmPerUnit / MM_PER_UNIT.laptop

const LAPTOP_AT: Vec3 = [0, -0.35, 0]
const IPAD_AT: Vec3 = [-3.55, 0.05, 0.55]
const PHONE_AT: Vec3 = [3.05, -0.55, 1.0]
const WATCH_AT: Vec3 = [1.75, -1.18, 2.15]

/** Where react-three-fiber creates the camera; `CameraRig` moves it from there. */
const INITIAL_CAMERA = { position: [0, 3.6, 12] as Vec3, fov: 40 }

/** A camera pose on an orbit around `target`. */
interface Shot {
  frame: number
  target: Vec3
  distance: number
  /** Radians around the vertical axis; 0 looks straight down -z. */
  azimuth: number
  /** Radians above the horizon. */
  elevation: number
  fov: number
}

const SHOTS: Shot[] = [
  { frame: 0, target: [0, 0.1, 0.4], distance: 12.2, azimuth: -0.5, elevation: 0.3, fov: 40 },
  { frame: 50, target: [0, 0.1, 0.4], distance: 10.8, azimuth: -0.22, elevation: 0.22, fov: 40 },
  { frame: 105, target: PHONE_AT, distance: 5.4, azimuth: -0.42, elevation: 0.14, fov: 34 },
  { frame: 150, target: [WATCH_AT[0], WATCH_AT[1] + 0.1, WATCH_AT[2]], distance: 3.6, azimuth: -0.12, elevation: 0.3, fov: 30 },
  { frame: 205, target: IPAD_AT, distance: 6.4, azimuth: 0.6, elevation: 0.16, fov: 36 },
  { frame: 265, target: [0, 0.1, 0.4], distance: 11.6, azimuth: 0.32, elevation: 0.34, fov: 40 },
]

/** The camera at `frame`: each channel eased between neighbouring shots, held at the ends. */
function cameraAt(frame: number): Shot {
  const next = SHOTS.findIndex((shot) => shot.frame > frame)
  if (next === -1) return SHOTS[SHOTS.length - 1]!
  if (next === 0) return SHOTS[0]!
  const a = SHOTS[next - 1]!
  const b = SHOTS[next]!
  const t = easeInOut((frame - a.frame) / (b.frame - a.frame))
  const mix = (x: number, y: number) => x + (y - x) * t
  return {
    frame,
    target: [mix(a.target[0], b.target[0]), mix(a.target[1], b.target[1]), mix(a.target[2], b.target[2])],
    distance: mix(a.distance, b.distance),
    azimuth: mix(a.azimuth, b.azimuth),
    elevation: mix(a.elevation, b.elevation),
    fov: mix(a.fov, b.fov),
  }
}

function positionOf(shot: Shot): Vec3 {
  const { target, distance, azimuth, elevation } = shot
  return [
    target[0] + distance * Math.cos(elevation) * Math.sin(azimuth),
    target[1] + distance * Math.sin(elevation),
    target[2] + distance * Math.cos(elevation) * Math.cos(azimuth),
  ]
}

/**
 * Drives the stage camera from props. It lives inside the canvas, so its
 * commit is the scene's commit and `delayCapture` holds the frame until the
 * move is drawn. (The canvas's `camera` prop cannot do this: react-three-fiber
 * reads it once, when it creates the camera.) Moving the camera rather than
 * the devices is also the cheap way to animate: the contact shadow is cast
 * straight down, so it only redraws when a device moves.
 */
function CameraRig({ position, target, fov }: { position: Vec3; target: Vec3; fov: number }) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const invalidate = useThree((state) => state.invalidate)
  React.useLayoutEffect(() => {
    camera.position.set(...position)
    camera.fov = fov
    camera.updateProjectionMatrix()
    camera.lookAt(...target)
    // A camera move is not a prop change react-three-fiber sees, so ask for
    // the frame (the capture gate would too, but the rig should not rely on it).
    invalidate()
  })
  return null
}

export function EnsembleShot() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const delayCapture = useMockupCapture()
  const shot = cameraAt(frame)
  const position = positionOf(shot)
  // The devices bob out of step, so the stage never reads as one rigid block.
  const phone = floated(floatAt(frame, fps, 0.5, 0.3), PHONE_AT, [0, -0.42, 0])
  const watch = floated(floatAt(frame, fps, 0.4, 2.1), WATCH_AT, [-0.12, -0.3, 0])
  const ipad = floated(floatAt(frame, fps, 0.3, 4.2), IPAD_AT, [0, 0.45, 0])
  return (
    <AbsoluteFill>
      {/* Parallax: the backdrop slides against the orbit and swells as the camera closes in. */}
      <Backdrop
        pattern={bokeh}
        seed="reel-bokeh"
        density={0.2}
        x={-shot.azimuth * 520}
        y={shot.elevation * 260}
        scale={1 + (12.2 - shot.distance) * 0.025}
        vignette={0.35}
      />
      <MockupCanvas
        controls={false}
        delayCapture={delayCapture}
        camera={INITIAL_CAMERA}
        shadowY={-0.44}
        label="Four devices on one stage"
      >
        <CameraRig position={position} target={shot.target} fov={shot.fov} />
        <Laptop variant="pro14" color="spaceblack" openAngle={104} position={LAPTOP_AT}>
          <DashboardScreen />
        </Laptop>
        <IPad variant="ipadair11" color="purple" orientation="landscape" scale={onLaptopScale(MM_PER_UNIT.ipad)} {...ipad}>
          <PlannerScreen />
        </IPad>
        <IPhone variant="18pro" color="burgundy" scale={onLaptopScale(MM_PER_UNIT.iphone)} {...phone}>
          <MusicScreen />
        </IPhone>
        <AppleWatch variant="series12" color="radiantgold" scale={onLaptopScale(MM_PER_UNIT.watch)} {...watch}>
          <WatchScreen />
        </AppleWatch>
      </MockupCanvas>
      <Caption
        corner="top-left"
        kicker="One stage, a moving camera"
        component="MockupCanvas"
        props={[
          ['camera.position', vec(position, 1)],
          ['camera.fov', num(shot.fov, 1)],
          ['devices', '{4}'],
        ]}
      />
    </AbsoluteFill>
  )
}
