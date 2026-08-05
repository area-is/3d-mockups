/**
 * Gentle idle float shared by the device mockups. Pure math - each binding
 * samples `floatPose` once per frame and applies it to the device's group.
 *
 * Apply it *before* the orbit controls and the HTML screen bridge update
 * (frame priority -2 in react-three-fiber) so the DOM screen is positioned
 * from this frame's device pose and never trails the WebGL body.
 */

export interface FloatPose {
  rotationX: number
  rotationY: number
  rotationZ: number
  positionY: number
}

/**
 * The media query every binding checks before animating on its own.
 *
 * Idle float and auto-rotate run without anyone asking for them, which is
 * exactly the motion `prefers-reduced-motion` is about. Gestures are never
 * gated on it - a drag is the visitor's own request.
 */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/** The pose a mockup rests at when motion is suppressed. */
export const FLOAT_REST_POSE: FloatPose = {
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  positionY: 0,
}

/**
 * The float pose at `elapsed` seconds. `intensity` scales rotation and bob
 * amplitudes (1 = phone-sized default); `phase` offsets the cycle so multiple
 * mockups on one page don't bob in unison.
 */
export function floatPose(elapsed: number, intensity = 1, phase = 0): FloatPose {
  const t = phase + elapsed * 0.4
  return {
    rotationX: Math.cos(t) * 0.025 * intensity,
    rotationY: Math.sin(t) * 0.025 * intensity,
    rotationZ: Math.sin(t) * 0.01 * intensity,
    positionY: Math.sin(t) * 0.05 * intensity,
  }
}

/** A random phase for `floatPose` - call once when the mockup mounts. */
export function randomFloatPhase(): number {
  return Math.random() * Math.PI * 2
}
