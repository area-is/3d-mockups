import { Easing, interpolate } from 'remotion'
import { floatPose, type FloatPose } from 'react-3d-mockups/core'

export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1)
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1)

/** `from` → `to` over frames `start`…`end`, held at either end. */
export function tween(
  frame: number,
  start: number,
  end: number,
  from: number,
  to: number,
  easing: (t: number) => number = easeInOut
): number {
  return interpolate(frame, [start, end], [from, to], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

/**
 * The library's idle float, sampled from the video's clock.
 *
 * A mockup's own `float` prop runs on the browser's clock, and a Remotion
 * render has no single browser clock: it renders frames out of order across
 * several tabs, so every frame would land at a different point of the bob.
 * `floatPose` is the same curve as a pure function of time.
 */
export function floatAt(frame: number, fps: number, intensity = 1, phase = 0): FloatPose {
  return floatPose(frame / fps, intensity, phase)
}

export type Vec3 = [number, number, number]

/** A float pose folded into a transform: rotation offsets and a vertical bob. */
export function floated(pose: FloatPose, position: Vec3, rotation: Vec3): { position: Vec3; rotation: Vec3 } {
  return {
    position: [position[0], position[1] + pose.positionY, position[2]],
    rotation: [rotation[0] + pose.rotationX, rotation[1] + pose.rotationY, rotation[2] + pose.rotationZ],
  }
}
