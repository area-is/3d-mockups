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
  voice: { voiceId: string; name?: string; modelId: string; settings?: Record<string, number | boolean> }
  music: {
    prompt: string
    seconds: number
    volume: number
    duck: number
    /** Lines the music up with the picture: its `second` lands on frame `at` of `shot` (say, the beat drop on a countdown's zero). Without it the music starts with the film. */
    sync?: { shot: string; at: number; second: number }
  }
  /** `duck`, if given, is how far the music dips under that line instead of the sheet's: 1 leaves a quiet passage of the music as it is. */
  lines: { id: string; shot: string; at: number; maxSeconds: number; text: string; duck?: number }[]
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
 * The music starts where its `sync` puts it (trimmed if that is before the
 * film), fades in over its first 12 frames and out over the film's last
 * second, and dips to `duck` of its level for every narration line that has a
 * file, across the line's window (`maxSeconds`, which the generator checks
 * each line fits), so the voice always sits on top.
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
        Math.min(level, interpolate(frame, [line.from - DUCK_RAMP, line.from, line.to, line.to + DUCK_RAMP], [1, line.duck ?? sheet.music.duck, line.duck ?? sheet.music.duck, 1], clamp)),
      1
    )
  const sync = sheet.music.sync
  const musicAt = sync ? at(sync.shot, sync.at) - Math.round(sync.second * fps) : 0
  const musicFrom = Math.max(0, musicAt)
  const fade = (frame: number) => interpolate(frame, [musicFrom, musicFrom + 12, durationInFrames - fps, durationInFrames - 1], [0, 1, 1, 0], clamp)

  return (
    <>
      {has('music') ? (
        <Sequence from={musicFrom} layout="none" name="music">
          {/* the volume callback counts from the music's own start */}
          <Audio
            src={src('music')}
            trimBefore={musicFrom - musicAt}
            volume={(frame) => sheet.music.volume * fade(frame + musicFrom) * duck(frame + musicFrom)}
          />
        </Sequence>
      ) : null}
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
