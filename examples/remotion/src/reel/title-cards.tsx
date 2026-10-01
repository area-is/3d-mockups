import * as React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { radius } from 'tabbied/patterns'
import { Backdrop } from './backdrop'
import { easeOut, tween } from './motion'
import { DISPLAY, MONO, SANS } from './screens'

const TITLE_PALETTE = ['#0b0f1a', '#3e8bff', '#3fffb2', '#3eecff', '#97f4ff', '#ff3d8b'] as const
const OUTRO_PALETTE = ['#140a1f', '#ff3d8b', '#ffd23e', '#7048e8', '#3eecff', '#ff6b4a'] as const

/** Letters that rise into place one after another. */
function Rise({ text, start, stagger = 1.2 }: { text: string; start: number; stagger?: number }) {
  const frame = useCurrentFrame()
  return (
    <>
      {[...text].map((char, i) => {
        const t = tween(frame, start + i * stagger, start + i * stagger + 14, 0, 1, easeOut)
        return (
          <span key={i} style={{ display: 'inline-block', opacity: t, transform: `translateY(${(1 - t) * 0.5}em)`, whiteSpace: 'pre' }}>
            {char}
          </span>
        )
      })}
    </>
  )
}

function Card({ palette, seed, children }: { palette: readonly string[]; seed: string; children: React.ReactNode }) {
  const frame = useCurrentFrame()
  const { width } = useVideoConfig()
  return (
    <AbsoluteFill>
      <Backdrop pattern={radius} seed={seed} palette={palette} rotate={frame * 0.1} scale={1.15 - frame * 0.0012} vignette={0.6} />
      {/* A scrim under the type: the pattern is at full strength everywhere else. */}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 60% 45% at 50% 50%, rgba(6,8,14,0.82) 0%, rgba(6,8,14,0.55) 55%, rgba(6,8,14,0) 100%)' }} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', color: '#fff', textAlign: 'center', fontSize: width / 1920 }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

export function TitleCard() {
  const frame = useCurrentFrame()
  const { width } = useVideoConfig()
  const u = width / 1920
  const sub = tween(frame, 26, 44, 0, 1, easeOut)
  return (
    <Card palette={TITLE_PALETTE} seed="reel-title">
      <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 150 * u, letterSpacing: '-0.045em', lineHeight: 1, textShadow: '0 10px 60px rgba(0,0,0,.45)' }}>
        <Rise text="react-3d-mockups" start={2} />
      </div>
      <div style={{ fontFamily: SANS, fontSize: 38 * u, marginTop: 28 * u, opacity: sub, transform: `translateY(${(1 - sub) * 16 * u}px)` }}>
        rendered frame by frame with <b>Remotion</b>, over <b>Tabbied</b> patterns
      </div>
    </Card>
  )
}

export function OutroCard() {
  const frame = useCurrentFrame()
  const { width } = useVideoConfig()
  const u = width / 1920
  const code = tween(frame, 18, 36, 0, 1, easeOut)
  return (
    <Card palette={OUTRO_PALETTE} seed="reel-outro">
      <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 96 * u, letterSpacing: '-0.04em', lineHeight: 1.05, textShadow: '0 10px 60px rgba(0,0,0,.45)' }}>
        <Rise text="Every frame is a pure" start={0} stagger={0.8} />
        <br />
        <Rise text="function of the frame." start={10} stagger={0.8} />
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 30 * u,
          marginTop: 44 * u,
          padding: `${16 * u}px ${26 * u}px`,
          borderRadius: 14 * u,
          background: 'rgba(10, 12, 18, 0.72)',
          opacity: code,
        }}
      >
        <span style={{ color: '#ffcf70' }}>delayCapture</span>
        <span style={{ color: '#8b93a7' }}>=</span>
        <span style={{ color: '#9ff0c3' }}>{'{useMockupCapture()}'}</span>
      </div>
    </Card>
  )
}
