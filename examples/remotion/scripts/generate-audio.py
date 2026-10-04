#!/usr/bin/env python3
"""
Generate a campaign film's sound with ElevenLabs: the narration, the sound
effects and the music bed its cue sheet names.

Each film has a cue sheet, `src/campaigns/<film>/sound.json`. The film reads
it to place every file on its shots (`src/campaigns/sound.tsx`), playing
whatever is in `public/audio/<film>/` and nothing that is not, so it renders
silent until the files exist. This script fills that folder:

    ELEVENLABS_API_KEY=... python3 scripts/generate-audio.py kite              # only missing files
    ELEVENLABS_API_KEY=... python3 scripts/generate-audio.py kite vo-03-fold   # just these (regenerates)
    ELEVENLABS_API_KEY=... python3 scripts/generate-audio.py kite --all        # everything again
    python3 scripts/generate-audio.py grove --dry-run                          # the cue sheet, no requests

- Narration: text to speech with the sheet's voice and settings, each line
  sent with the lines either side of it (`previous_text`, `next_text`) so the
  read stays one performance. The silence the model leaves around a line is
  trimmed, so it starts on its cue, and a line longer than its window
  (`maxSeconds`) is reported: shorten the text or regenerate it.
- Effects: the sound-effects endpoint, at each cue's length.
- Music: the music endpoint, one bed the length of the film. The film fades
  it in and out and dips it under every line.

Set ELEVENLABS_VOICE_ID to try another voice without editing the sheet. Use
`--dry-run` to work in the ElevenLabs app instead: it prints every file name
with its text or prompt and length, and the film picks up files saved under
those names.

A whole script read as one take keeps one performance across the lines.
Generate it with a pause between lines (`<break time="1.2s" />`), then cut it:

    python3 scripts/generate-audio.py kite --split take.mp3

`--split` evens the take's loudness, cuts it at its longest silences (one fewer
than there are lines), shortens any pause inside a line to 0.4 s, and writes
each line's file, reporting any that runs past its window.

Needs Python 3 with requests, and ffmpeg/ffprobe on the PATH (Remotion's own
`npx remotion ffmpeg` works too) for trimming and measuring.
"""

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = 'https://api.elevenlabs.io/v1'
FORMAT = 'mp3_44100_128'
# Leading and trailing silence quieter than this is cut from narration.
SILENCE = '-45dB'


def tool(name):
    """ffmpeg/ffprobe from the PATH, or Remotion's copy."""
    return [name] if shutil.which(name) else ['npx', 'remotion', name]


def duration(path):
    out = subprocess.run(
        tool('ffprobe') + ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return float(out)


def trim_silence(path):
    """Cut the silence before and after a line, in place."""
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / path.name
        trim = f'silenceremove=start_periods=1:start_threshold={SILENCE}'
        subprocess.run(
            tool('ffmpeg') + ['-v', 'error', '-y', '-i', str(path), '-af', f'{trim},areverse,{trim},areverse', '-b:a', '128k', str(out)],
            check=True,
        )
        shutil.move(out, path)


def post(session, endpoint, body):
    response = session.post(f'{API}/{endpoint}', params={'output_format': FORMAT}, json=body, timeout=300)
    if response.status_code != 200:
        raise RuntimeError(f'{endpoint}: HTTP {response.status_code}: {response.text[:500]}')
    return response.content


def plan(sheet):
    """Every file the sheet names: (id, kind, what to send, length in seconds)."""
    lines = sheet['lines']
    for i, line in enumerate(lines):
        yield line['id'], 'voice', line['text'], line['maxSeconds'], i
    for cue in sheet['sfx']:
        yield cue['id'], 'sfx', cue['prompt'], cue['seconds'], None
    yield 'music', 'music', sheet['music']['prompt'], sheet['music']['seconds'], None


# A pause inside a line longer than this is shortened to it.
INNER_PAUSE = 0.4


def silences(path, floor='-40dB', shortest=0.3):
    """(start, end) of every silence in a file, from ffmpeg's silencedetect."""
    log = subprocess.run(
        tool('ffmpeg') + ['-v', 'info', '-i', str(path), '-af', f'silencedetect=noise={floor}:d={shortest}', '-f', 'null', '-'],
        capture_output=True, text=True, check=True,
    ).stderr
    starts = [float(m) for m in re.findall(r'silence_start: ([\d.]+)', log)]
    ends = [float(m) for m in re.findall(r'silence_end: ([\d.]+)', log)]
    total = duration(path)
    return [(a, ends[i] if i < len(ends) else total) for i, a in enumerate(starts)], total


def split_take(take, sheet, out_dir):
    """Cut one take of the whole script into the sheet's line files."""
    lines = sheet['lines']
    out_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        even = Path(tmp) / 'take.wav'
        subprocess.run(tool('ffmpeg') + ['-v', 'error', '-y', '-i', str(take), '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '44100', str(even)], check=True)
        gaps, total = silences(even)
        # Leading and trailing silence frame the take; the longest of the rest part the lines.
        head = gaps[0][1] if gaps and gaps[0][0] < 0.05 else 0.0
        tail = gaps[-1][0] if gaps and gaps[-1][1] > total - 0.05 else total
        inner = [g for g in gaps if g[0] >= head and g[1] <= tail]
        if len(inner) < len(lines) - 1:
            sys.exit(f'Found {len(inner)} pauses in {take}, needs at least {len(lines) - 1}: read it with a pause between lines.')
        parts = sorted(sorted(inner, key=lambda g: g[1] - g[0], reverse=True)[: len(lines) - 1])
        bounds = [head] + [x for g in parts for x in g] + [tail]
        over = []
        for i, line in enumerate(lines):
            a, b = bounds[2 * i], bounds[2 * i + 1]
            # Speech pieces of this line, with each pause inside it cut down to INNER_PAUSE.
            pieces, at = [], a
            for g0, g1 in inner:
                if g0 > a and g1 < b and g1 - g0 > INNER_PAUSE:
                    pieces.append((at, g0 + INNER_PAUSE / 2))
                    at = g1 - INNER_PAUSE / 2
            pieces.append((at, b))
            pad = 0.04
            pieces[0] = (max(0.0, pieces[0][0] - pad), pieces[0][1])
            pieces[-1] = (pieces[-1][0], min(total, pieces[-1][1] + pad * 3))
            chain = ''.join(f'[0:a]atrim={p0:.3f}:{p1:.3f},asetpts=PTS-STARTPTS[p{j}];' for j, (p0, p1) in enumerate(pieces))
            chain += ''.join(f'[p{j}]' for j in range(len(pieces))) + f'concat=n={len(pieces)}:v=0:a=1,afade=t=in:d=0.02,areverse,afade=t=in:d=0.03,areverse,asetpts=N/SR/TB[out]'
            path = out_dir / f"{line['id']}.mp3"
            subprocess.run(tool('ffmpeg') + ['-v', 'error', '-y', '-i', str(even), '-filter_complex', chain, '-map', '[out]', '-b:a', '128k', str(path)], check=True)
            length = duration(path)
            note = f"  OVER its {line['maxSeconds']}s window" if length > line['maxSeconds'] else ''
            if note:
                over.append(line['id'])
            print(f"{path.relative_to(ROOT)}: {length:.2f}s{note}  {line['text']}")
        if over:
            print(f'\n{len(over)} line(s) run past their window: {", ".join(over)}.')


def main():
    args = sys.argv[1:]
    if not args or args[0].startswith('-'):
        print(__doc__)
        sys.exit(1)
    film, rest = args[0], args[1:]
    take = None
    if '--split' in rest:
        at = rest.index('--split')
        if at + 1 >= len(rest):
            sys.exit('--split needs the take to cut: --split take.mp3')
        take = Path(rest[at + 1])
        rest = rest[:at] + rest[at + 2 :]
    flags = {a for a in rest if a.startswith('--')}
    only = [a for a in rest if not a.startswith('--')]
    sheet = json.loads((ROOT / 'src' / 'campaigns' / film / 'sound.json').read_text())
    out_dir = ROOT / 'public' / 'audio' / film
    entries = list(plan(sheet))
    unknown = set(only) - {e[0] for e in entries}
    if unknown:
        sys.exit(f'Not in {film}/sound.json: {", ".join(sorted(unknown))}')

    if take is not None:
        split_take(take, sheet, out_dir)
        return

    if '--dry-run' in flags:
        for name, kind, what, seconds, _ in entries:
            print(f'public/audio/{film}/{name}.mp3  [{kind}, {"max " if kind == "voice" else ""}{seconds}s]  {what}')
        return

    key = os.environ.get('ELEVENLABS_API_KEY')
    if not key:
        sys.exit('Set ELEVENLABS_API_KEY (or use --dry-run to print the cue sheet).')
    import requests

    out_dir.mkdir(parents=True, exist_ok=True)

    session = requests.Session()
    session.headers.update({'xi-api-key': key, 'Content-Type': 'application/json'})
    voice = sheet['voice']
    voice_id = os.environ.get('ELEVENLABS_VOICE_ID', voice['voiceId'])
    lines = sheet['lines']
    over = []

    for name, kind, what, seconds, index in entries:
        path = out_dir / f'{name}.mp3'
        wanted = name in only or '--all' in flags or (not only and not path.exists())
        if not wanted:
            continue
        if kind == 'voice':
            body = {'text': what, 'model_id': voice['modelId'], 'voice_settings': voice['settings']}
            if index > 0:
                body['previous_text'] = lines[index - 1]['text']
            if index < len(lines) - 1:
                body['next_text'] = lines[index + 1]['text']
            path.write_bytes(post(session, f'text-to-speech/{voice_id}', body))
            trim_silence(path)
        elif kind == 'sfx':
            path.write_bytes(post(session, 'sound-generation', {'text': what, 'duration_seconds': seconds, 'prompt_influence': 0.5}))
        else:
            path.write_bytes(post(session, 'music', {'prompt': what, 'music_length_ms': int(seconds * 1000)}))
        length = duration(path)
        note = ''
        if kind == 'voice' and length > seconds:
            note = f'  OVER its {seconds}s window'
            over.append(name)
        print(f'{path.relative_to(ROOT)}: {length:.2f}s{note}')

    if over:
        print(f'\n{len(over)} line(s) run past their window: {", ".join(over)}. Shorten the text in sound.json, or regenerate for a brisker read.')


if __name__ == '__main__':
    main()
