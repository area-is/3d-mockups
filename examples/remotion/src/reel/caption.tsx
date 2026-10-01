import * as React from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { tween, easeOut } from './motion'
import { MONO, SANS } from './screens'

export interface CaptionProps {
  /** The component on screen, e.g. `IPhoneMockup`. */
  component: string
  /** Its props as they stand this frame - the live values are the point. */
  props: [name: string, value: string][]
  /** A plain-language line above the code. */
  kicker: string
  /** Corner to sit in, clear of the subject. */
  corner?: 'bottom-left' | 'top-left'
}

/**
 * A lower third that shows the JSX driving the shot, values updating live, so
 * the video doubles as a test card for which settings animate.
 */
export function Caption({ component, props, kicker, corner = 'bottom-left' }: CaptionProps) {
  const frame = useCurrentFrame()
  const { durationInFrames, width } = useVideoConfig()
  const unit = width / 1920
  const enter = tween(frame, 4, 22, 0, 1, easeOut)
  const leave = tween(frame, durationInFrames - 16, durationInFrames - 4, 0, 1)
  const shown = enter * (1 - leave)
  return (
    <div
      style={{
        position: 'absolute',
        left: 72 * unit,
        ...(corner === 'top-left' ? { top: 64 * unit } : { bottom: 64 * unit }),
        opacity: shown,
        transform: `translateY(${(1 - enter) * 30 * unit}px)`,
        fontSize: 22 * unit,
        color: '#fff',
      }}
    >
      <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 18 * unit, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 10 * unit, textShadow: '0 1px 12px rgba(0,0,0,.5)' }}>
        {kicker}
      </div>
      <div
        style={{
          fontFamily: MONO,
          lineHeight: 1.5,
          padding: `${16 * unit}px ${22 * unit}px`,
          borderRadius: 14 * unit,
          background: 'rgba(10, 12, 18, 0.72)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
          whiteSpace: 'pre',
        }}
      >
        <span style={{ color: '#7aa2ff' }}>{'<'}{component}</span>
        {props.map(([name, value]) => (
          <div key={name} style={{ paddingLeft: 24 * unit }}>
            <span style={{ color: '#ffcf70' }}>{name}</span>
            <span style={{ color: '#8b93a7' }}>=</span>
            <span style={{ color: '#9ff0c3', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
          </div>
        ))}
        <span style={{ color: '#7aa2ff' }}>{'/>'}</span>
      </div>
    </div>
  )
}

/** `n` to `digits` places, without the "-0.00" a value just under zero rounds to. */
const fixed = (n: number, digits: number) => {
  const text = n.toFixed(digits)
  return Number(text) === 0 ? (0).toFixed(digits) : text
}
export const num = (n: number, digits = 2) => `{${fixed(n, digits)}}`
export const vec = (v: readonly number[], digits = 2) => `{[${v.map((n) => fixed(n, digits)).join(', ')}]}`
export const str = (s: string) => `"${s}"`
