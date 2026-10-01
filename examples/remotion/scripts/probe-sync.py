"""Compare the device screen against the DOM swatch in a rendered probe sequence.

Usage: python3 scripts/probe-sync.py out/ProbeDemand [out/ProbeAlways ...]

Every probe frame paints the same colour on a device screen and on a DOM swatch
(see src/probe/probe.tsx). A screen that is one video frame behind shows the
previous frame's colour; one that never painted shows the page behind it.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
          '#ff8000', '#8000ff', '#00ff80', '#ffffff', '#808080', '#000000']
RGB = np.array([[int(c[i:i + 2], 16) for i in (1, 3, 5)] for c in COLORS], dtype=float)


def nearest(rgb):
    d = np.linalg.norm(RGB - rgb, axis=1)
    i = int(d.argmin())
    return (i if d[i] < 60 else None), rgb


def patch(img, x, y, r=4):
    return np.median(img[y - r:y + r + 1, x - r:x + r + 1].reshape(-1, 3), axis=0)


for folder in sys.argv[1:]:
    frames = sorted(Path(folder).glob('*.png'))
    bad = []
    for path in frames:
        n = int(''.join(ch for ch in path.stem if ch.isdigit())[-3:] or 0)
        img = np.asarray(Image.open(path).convert('RGB')).astype(float)
        h, w, _ = img.shape
        swatch, _ = nearest(patch(img, 30, 30))
        screen, raw = nearest(patch(img, w // 2, h // 2))
        expected = n % len(COLORS)
        if swatch != expected or screen != expected:
            lag = None if screen is None else (expected - screen) % len(COLORS)
            bad.append((n, swatch, screen, lag, raw.astype(int).tolist()))
    print(f'{folder}: {len(frames)} frames, {len(bad)} mismatched')
    for n, swatch, screen, lag, raw in bad:
        print(f'  frame {n:3d}: swatch={swatch} screen={screen} lag={lag} rgb={raw}')
