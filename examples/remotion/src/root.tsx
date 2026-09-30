import * as React from 'react'
import { Composition } from 'remotion'
import { Probe } from './probe/probe'
import { Bench } from './probe/bench'
import { Reel, REEL_DURATION } from './reel/reel'
import { EnsembleShot } from './reel/ensemble-shot'

export function Root() {
  return (
    <>
      <Composition id="MockupReel" component={Reel} durationInFrames={REEL_DURATION} fps={30} width={1920} height={1080} />
      <Composition
        id="Bench"
        component={Bench}
        defaultProps={{ webgl: true, shadows: true, antialias: true, backdrop: false, orbit: false }}
        durationInFrames={16}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition id="Ensemble" component={EnsembleShot} durationInFrames={270} fps={30} width={1920} height={1080} />
      <Composition
        id="ProbeAlways"
        component={Probe}
        defaultProps={{ frameloop: 'always' as const }}
        durationInFrames={90}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="ProbeDemand"
        component={Probe}
        defaultProps={{ frameloop: 'demand' as const }}
        durationInFrames={90}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="ProbeCapture"
        component={Probe}
        defaultProps={{ frameloop: 'demand' as const, capture: true }}
        durationInFrames={90}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  )
}
