import * as React from 'react'
import { Audio, getStaticFiles, interpolate, Sequence, staticFile, useVideoConfig } from 'remotion'

/**
 * A film's sound, as a cue sheet: what the narrator says and when, the effects
 * on the visual beats, and the music bed. One JSON file per film
 * (`grove/sound.json`, `kite/sound.json`) is read both here, to place the
 * audio on the timeline, and by `scripts/generate-audio.py`, which asks
 * ElevenLabs for every file the sheet names.
 *
 * Cues are anchored to a shot and a frame within it, not to the film's
 * timeline, so re-timing a shot moves its narration and effects with it.
 */
export interface SoundSheet {
  film: string
  voice: { voiceId: string; name?: string; modelId: string; settings: Record<string, number | boolean> }
  music: { prompt: string; seconds: number; volume: number; duck: number }
  lines: { id: string; shot: string; at: number; maxSeconds: number; text: string }[]
  sfx: { id: string; shot: string; at: number[]; seconds: number; volume: number; prompt: string }[]
}

/** Where a cue's audio lives under `public/`. */
export const soundFile = (film: string, id: string) => `audio/${film}/${id}.mp3`

/**
 * The frame each shot starts on in a `TransitionSeries` whose transitions all
 * overlap the shots either side by `transition` frames.
 */
export function shotStarts(order: readonly string[], shots: Record<string, number>, transition: number): Record<string, number> {
  const starts: Record<string, number> = {}
  let at = 0
  for (const shot of order) {
    starts[shot] = at
    at += (shots[shot] ?? 0) - transition
  }
  return starts
}

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

/** Frames the music takes to dip under the voice, and to come back. */
const DUCK_RAMP = 8

/**
 * Plays whatever of a sheet's audio is in `public/audio/<film>/` - nothing at
 * all until the files are generated, so the films render silent as before.
 *
 * The music fades in over the first 12 frames and out over the last second,
 * and dips to `duck` of its level for every narration line that has a file,
 * across the line's window (`maxSeconds`, which the generator checks each
 * line fits), so the voice always sits on top.
 */
export function Soundtrack({ sheet, starts }: { sheet: SoundSheet; starts: Record<string, number> }) {
  const { fps, durationInFrames } = useVideoConfig()
  const present = React.useMemo(() => new Set(getStaticFiles().map((file) => file.name)), [])
  const has = (id: string) => present.has(soundFile(sheet.film, id))
  const src = (id: string) => staticFile(soundFile(sheet.film, id))
  const at = (shot: string, frame: number) => {
    const start = starts[shot]
    if (start === undefined) throw new Error(`[sound] ${sheet.film}: a cue names "${shot}", which is not a shot`)
    return start + frame
  }

  const lines = sheet.lines
    .filter((line) => has(line.id))
    .map((line) => ({ ...line, from: at(line.shot, line.at), to: at(line.shot, line.at) + Math.round(line.maxSeconds * fps) }))
  const duck = (frame: number) =>
    lines.reduce(
      (level, line) =>
        Math.min(level, interpolate(frame, [line.from - DUCK_RAMP, line.from, line.to, line.to + DUCK_RAMP], [1, sheet.music.duck, sheet.music.duck, 1], clamp)),
      1
    )
  const fade = (frame: number) => interpolate(frame, [0, 12, durationInFrames - fps, durationInFrames - 1], [0, 1, 1, 0], clamp)

  return (
    <>
      {has('music') ? <Audio src={src('music')} volume={(frame) => sheet.music.volume * fade(frame) * duck(frame)} /> : null}
      {lines.map((line) => (
        <Sequence key={line.id} from={line.from} layout="none" name={line.id}>
          <Audio src={src(line.id)} />
        </Sequence>
      ))}
      {sheet.sfx
        .filter((cue) => has(cue.id))
        .flatMap((cue) =>
          cue.at.map((frame, i) => (
            <Sequence key={`${cue.id}-${i}`} from={at(cue.shot, frame)} layout="none" name={cue.id}>
              <Audio src={src(cue.id)} volume={cue.volume} />
            </Sequence>
          ))
        )}
    </>
  )
}
