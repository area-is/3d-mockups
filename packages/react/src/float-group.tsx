import * as React from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { Group } from 'three'
import { floatPose, randomFloatPhase, FLOAT_REST_POSE } from './core'
import { usePrefersReducedMotion } from './use-reduced-motion'

/**
 * Gentle idle float shared by the device mockups. The pose itself is core math
 * (`floatPose`); this wrapper samples it at frame priority -2 - before the
 * orbit controls (-1) and before drei's `<Html>` screen sync (0) - so the DOM
 * screen is positioned from this frame's device pose and never trails the
 * WebGL body.
 */
export function FloatGroup({
  children,
  intensity = 1,
  time,
}: {
  children: React.ReactNode
  /** Scales rotation and bob amplitudes (1 = phone-sized default). */
  intensity?: number
  /**
   * Seconds on a clock the caller owns (the canvas's `time`). Set, the pose is
   * a function of it alone: no random phase, no browser clock, and no
   * reduced-motion hold - the caller's timeline decides what moves.
   */
  time?: number
}) {
  const ref = React.useRef<Group>(null!)
  // Random phase so multiple mockups on one page don't bob in unison. Not on
  // a caller's clock: a video render mounts the mockup once per browser tab,
  // and a phase drawn per mount put every tab's frames at a different bob.
  const [phase] = React.useState(randomFloatPhase)
  const clocked = time !== undefined
  // Nobody asked for the bob, so it is the first thing to go when the visitor
  // has asked for less motion. The rest pose still gets written every frame:
  // switching the preference on mid-session has to settle the object, not
  // strand it wherever the last animated frame left it.
  const reduced = usePrefersReducedMotion() && !clocked
  // The float is motion nothing else asks a frame for, so on a canvas that
  // renders on demand it requests the next one itself - and stops requesting
  // once reduced motion holds it at rest, after one frame to settle there. On
  // a caller's clock it asks once per tick of that clock instead.
  const invalidate = useThree((state) => state.invalidate)
  React.useEffect(() => invalidate(), [reduced, time, invalidate])
  useFrame(({ clock }) => {
    const pose = reduced
      ? FLOAT_REST_POSE
      : clocked
        ? floatPose(time, intensity, 0)
        : floatPose(clock.elapsedTime, intensity, phase)
    const group = ref.current
    group.rotation.x = pose.rotationX
    group.rotation.y = pose.rotationY
    group.rotation.z = pose.rotationZ
    group.position.y = pose.positionY
    if (!reduced && !clocked) invalidate()
  }, -2)
  return <group ref={ref}>{children}</group>
}
