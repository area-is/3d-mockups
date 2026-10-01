import * as React from 'react'
import { useThree } from '@react-three/fiber'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { IPhone, MockupCanvas } from 'react-3d-mockups'
import { flux } from 'tabbied/patterns'
import { useMockupCapture } from '../use-mockup-capture'
import { Backdrop } from '../reel/backdrop'
import { MusicScreen } from '../reel/screens'

/** Where render time goes: the same turning phone with parts of the stage switched off. */
export type BenchProps = {
  webgl: boolean
  shadows: boolean
  antialias: boolean
  backdrop: boolean
  /** Turn the camera instead of the phone, so the contact shadow never redraws. */
  orbit: boolean
}

function Orbit({ angle }: { angle: number }) {
  const camera = useThree((state) => state.camera)
  React.useLayoutEffect(() => {
    camera.position.set(Math.sin(angle) * 7.4, 0.5, Math.cos(angle) * 7.4)
    camera.lookAt(0, 0, 0)
  })
  return null
}

export function Bench({ webgl, shadows, antialias, backdrop, orbit }: BenchProps) {
  const frame = useCurrentFrame()
  const delayCapture = useMockupCapture()
  const angle = -0.6 + frame * 0.06
  return (
    <AbsoluteFill style={{ background: '#20242c' }}>
      {backdrop && <Backdrop pattern={flux} seed="bench" rotate={frame * 0.2} />}
      {webgl && (
        <MockupCanvas controls={false} delayCapture={delayCapture} shadows={shadows} gl={{ antialias }}>
          {orbit && <Orbit angle={-angle} />}
          <IPhone variant="18promax" color="burgundy" rotation={[0, orbit ? 0 : angle, 0]}>
            <MusicScreen />
          </IPhone>
        </MockupCanvas>
      )}
    </AbsoluteFill>
  )
}
