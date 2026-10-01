import * as React from 'react'
import { AbsoluteFill, useDelayRender } from 'remotion'
import { TabbiedPattern } from 'tabbied/react'
import type { PatternDefinition } from 'tabbied'

export interface BackdropProps {
  pattern: PatternDefinition
  seed: string
  /** Background first, then the inks. Keep it a module constant: a new array is a new pattern. */
  palette?: readonly string[]
  /** 0 is Tabbied's coarsest cell (180 px), 1 its finest (36 px). */
  density?: number
  /** Frame-driven motion of the whole layer. */
  scale?: number
  rotate?: number
  x?: number
  y?: number
  /** Darken the edges so the device in front reads first. */
  vignette?: number
  /** Darken the whole pattern, for the loud ones. */
  dim?: number
}

/**
 * A Tabbied pattern as a moving backdrop.
 *
 * Tabbied draws its first frame asynchronously (css-doodle mounts, and the
 * grid fit waits for the box to be measured), so the backdrop holds the
 * render until `onReady`. Motion comes from a transform on a layer larger
 * than the frame - never from reseeding or resizing the pattern, which would
 * re-render it through its ~400ms CSS transitions on the browser's clock and
 * differ from one render to the next.
 */
export function Backdrop({
  pattern,
  seed,
  palette,
  density = 0.35,
  scale = 1,
  rotate = 0,
  x = 0,
  y = 0,
  vignette = 0.45,
  dim = 0,
}: BackdropProps) {
  const { delayRender, continueRender } = useDelayRender()
  const [handle] = React.useState(() => delayRender(`Tabbied pattern "${pattern.slug}"`))
  const onReady = React.useCallback(() => continueRender(handle), [continueRender, handle])
  const colors = React.useMemo(() => (palette ? [...palette] : undefined), [palette])
  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: palette?.[0] ?? pattern.palette?.[0] }}>
      <div
        style={{
          position: 'absolute',
          inset: '-30%',
          transform: `translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scale})`,
          willChange: 'transform',
        }}
      >
        <TabbiedPattern pattern={pattern} seed={seed} palette={colors} density={density} onReady={onReady} />
      </div>
      {dim > 0 && <AbsoluteFill style={{ background: `rgba(0,0,0,${dim})` }} />}
      {vignette > 0 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 35%, rgba(0,0,0,${vignette}) 100%)`,
          }}
        />
      )}
    </AbsoluteFill>
  )
}
