import * as React from 'react'
import { linearTiming, TransitionSeries } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { slide } from '@remotion/transitions/slide'
import { wipe } from '@remotion/transitions/wipe'
import '@fontsource-variable/inter'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/jetbrains-mono/400.css'
import { EnsembleShot } from './ensemble-shot'
import { FoldShot, LaptopShot, ObjectsShot, PhoneShot, WatchShot } from './solo-shots'
import { OutroCard, TitleCard } from './title-cards'

/** Shot lengths in frames at 30 fps; transitions overlap neighbouring shots. */
export const REEL = {
  title: 75,
  phone: 120,
  fold: 120,
  laptop: 120,
  watch: 90,
  objectBeat: 45,
  ensemble: 270,
  outro: 80,
  transition: 14,
}

const TRANSITIONS = 7

export const REEL_DURATION =
  REEL.title + REEL.phone + REEL.fold + REEL.laptop + REEL.watch + REEL.objectBeat * 3 + REEL.ensemble + REEL.outro -
  REEL.transition * TRANSITIONS

export function Reel() {
  const timing = linearTiming({ durationInFrames: REEL.transition })
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={REEL.title}>
        <TitleCard />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: 'from-bottom' })} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={REEL.phone}>
        <PhoneShot />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={wipe({ direction: 'from-left' })} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={REEL.fold}>
        <FoldShot />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={REEL.laptop}>
        <LaptopShot />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={wipe({ direction: 'from-top-right' })} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={REEL.watch}>
        <WatchShot />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: 'from-left' })} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={REEL.objectBeat * 3}>
        <ObjectsShot beat={REEL.objectBeat} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={REEL.ensemble}>
        <EnsembleShot />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={REEL.outro}>
        <OutroCard />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  )
}
