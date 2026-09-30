import * as React from 'react'
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion'
import { GalaxyMockup, IPhoneMockup } from 'react-3d-mockups'
import { useMockupCapture } from '../use-mockup-capture'

/*
 * A measurement composition, not a showcase. Each frame paints one colour from
 * PROBE_COLORS twice: on a device screen, and on a plain DOM swatch outside the
 * canvas. scripts/probe-sync.py samples both from the rendered frames; if the
 * screen lags the video frame, the two disagree.
 */
export const PROBE_COLORS = [
  '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
  '#ff8000', '#8000ff', '#00ff80', '#ffffff', '#808080', '#000000',
]
const colorAt = (frame: number) => PROBE_COLORS[frame % PROBE_COLORS.length]!

// `offset` turns a Sequence's relative frame back into the composition's.
function ProbeScreen({ offset = 0 }: { offset?: number }) {
  const frame = useCurrentFrame() + offset
  return (
    <div style={{ width: '100%', height: '100%', background: colorAt(frame) }} />
  )
}

export type ProbeProps = {
  frameloop: 'always' | 'demand'
  /** Gate frames with `delayCapture` instead of the docs' old recipe. */
  capture?: boolean
}

function Swatch() {
  const frame = useCurrentFrame()
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 60, height: 60, background: colorAt(frame) }} />
  )
}

export function Probe({ frameloop, capture = false }: ProbeProps) {
  const frame = useCurrentFrame()
  const delayCapture = useMockupCapture()
  // The old recipe goes through a spread so `pauseWhenOffscreen` reaches the
  // canvas even though the one-liner's type does not list it.
  const stage = capture
    ? { controls: false, frameloop, delayCapture }
    : { controls: false, frameloop, pauseWhenOffscreen: false }
  return (
    <AbsoluteFill style={{ background: '#20242c' }}>
      <Sequence durationInFrames={45}>
        <IPhoneMockup {...stage} rotation={[0, Math.sin(frame / 12) * 0.35, 0]}>
          <ProbeScreen />
        </IPhoneMockup>
      </Sequence>
      <Sequence from={45}>
        <GalaxyMockup {...stage} rotation={[0, Math.sin(frame / 12) * 0.35, 0]}>
          <ProbeScreen offset={45} />
        </GalaxyMockup>
      </Sequence>
      <Swatch />
    </AbsoluteFill>
  )
}
