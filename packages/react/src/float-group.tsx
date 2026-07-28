import * as React from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { floatPose, randomFloatPhase } from '@area-3d-mockups/core'

/**
 * Gentle idle float shared by the device mockups. The pose itself is core math
 * (`floatPose`); this wrapper samples it at frame priority -2 — before the
 * orbit controls (-1) and before drei's `<Html>` screen sync (0) — so the DOM
 * screen is positioned from this frame's device pose and never trails the
 * WebGL body.
 */
export function FloatGroup({
  children,
  intensity = 1,
}: {
  children: React.ReactNode
  /** Scales rotation and bob amplitudes (1 = phone-sized default). */
  intensity?: number
}) {
  const ref = React.useRef<Group>(null!)
  // Random phase so multiple mockups on one page don't bob in unison.
  const [phase] = React.useState(randomFloatPhase)
  useFrame(({ clock }) => {
    const pose = floatPose(clock.elapsedTime, intensity, phase)
    const group = ref.current
    group.rotation.x = pose.rotationX
    group.rotation.y = pose.rotationY
    group.rotation.z = pose.rotationZ
    group.position.y = pose.positionY
  }, -2)
  return <group ref={ref}>{children}</group>
}
