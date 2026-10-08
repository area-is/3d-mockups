#!/usr/bin/env python3
"""
Generate the campaign films' cut-out photographs with OpenAI's GPT Image 2.5.

Every picture on a printed face or a screen in `src/campaigns` is a cut-out:
a photographed subject on a transparent ground, so it stands on whatever the
face is printed on instead of arriving in a rectangle of its own background.
This script asks `gpt-image-2.5-sunburst` for each one at `quality: low` with
`background: transparent`, trims the empty margin, and writes
`public/art/<name>.webp`.

    OPENAI_API_KEY=... python3 scripts/generate-art.py            # only missing files
    OPENAI_API_KEY=... python3 scripts/generate-art.py kite-sky   # just these (regenerates)
    OPENAI_API_KEY=... python3 scripts/generate-art.py --all      # everything again

An entry with `edit` is made from another entry's raw image through the edits
endpoint, so a colourway or a second angle keeps the same shoe. Raw PNGs are
kept in `out/art-raw/` (git-ignored) for that reason.

Needs Python 3 with Pillow and requests.
"""

import base64
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests
from PIL import Image

MODEL = 'gpt-image-2.5-sunburst'
QUALITY = 'low'
ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'out' / 'art-raw'
OUT = ROOT / 'public' / 'art'

# The model reads "transparent" as "a white studio sweep, mostly see-through"
# unless told otherwise: a lemon came back standing on an opaque white floor.
# Ruling out each kind of ground by name is what made the cut-outs clean.
CUTOUT = (
    'Isolated cut-out subject on a fully transparent background: no floor, no ground, '
    'no shadow, no backdrop, no reflection, no glow. Photorealistic commercial '
    'photography, crisp edges.'
)

SQUARE, PORTRAIT, LANDSCAPE = '1024x1024', '1024x1536', '1536x1024'

ART = {
    # ---- Grove: cold-pressed juice -------------------------------------
    'grove-blood-orange': (SQUARE, 'A halved blood orange next to a whole blood orange with two glossy green leaves.'),
    'grove-lemon-ginger': (SQUARE, 'Two bright yellow lemons, one cut in half showing juicy flesh, beside a knob of fresh ginger root and one lemon leaf.'),
    'grove-green-apple': (SQUARE, 'Two crisp green apples, one with a wedge cut out, beside a sprig of fresh mint leaves.'),
    'grove-slice': (SQUARE, 'A single thin round slice of blood orange seen straight from above, translucent ruby flesh and segments, pale rind.'),
    'grove-leaves': (SQUARE, 'A sprig of three glossy dark green citrus leaves with two small white orange blossoms.'),
    'grove-glass': (PORTRAIT, 'A tall clear glass of fresh blood orange juice with ice cubes and condensation droplets, a slice of blood orange on the rim, no straw.'),
    'grove-farmer': (PORTRAIT, 'Waist-up portrait of a smiling citrus farmer in her fifties wearing a straw hat and a linen work shirt, holding a wooden crate full of oranges. Natural daylight.'),
    # The growers on each carton's story side, one per flavour.
    'grove-grower-blood': (PORTRAIT, 'Waist-up portrait of a smiling orange grower in his sixties with a short grey beard, wearing a canvas apron over a rolled-up denim work shirt, holding a halved blood orange in each hand with the deep red flesh facing the camera. Natural daylight.'),
    'grove-grower-lemon': (PORTRAIT, 'Waist-up portrait of a cheerful young woman farmer in her twenties with curly dark hair tied back, wearing a mustard-yellow work jacket, holding a woven basket of bright yellow lemons with a few knobbly fresh ginger roots on top. Natural daylight.'),
    'grove-grower-apple': (PORTRAIT, 'Waist-up portrait of a smiling orchard keeper in his forties with round glasses and a flat cap, wearing a green knit sweater, holding an armful of green granny smith apples with a sprig of fresh mint tucked among them. Natural daylight.'),
    'grove-crate': (LANDSCAPE, 'A rustic wooden fruit crate overflowing with oranges, lemons and green apples with leaves, three-quarter view from slightly above.'),
    # ---- KITE: a running-shoe drop -------------------------------------
    'kite-volt': (LANDSCAPE, 'A modern lightweight running shoe, side profile with the toe pointing right: volt yellow-green engineered mesh upper, thick white foam midsole with a slight rocker, black heel tab and laces, black outsole. No logos or text.'),
    'kite-sky': (LANDSCAPE, 'The exact same running shoe in the exact same pose and framing, recoloured: pale sky-blue mesh upper, white midsole, deep navy heel tab, laces and outsole. Keep the shape identical. No logos or text.', 'kite-volt'),
    'kite-ember': (LANDSCAPE, 'The exact same running shoe in the exact same pose and framing, recoloured: ember orange-red mesh upper, off-white midsole, charcoal heel tab, laces and outsole. Keep the shape identical. No logos or text.', 'kite-volt'),
    'kite-hero': (SQUARE, 'The same running shoe seen from a dynamic three-quarter front angle, tilted toe-up as if mid-stride, floating. Same volt yellow-green upper, white midsole, black details. No logos or text.', 'kite-volt'),
    'kite-runner': (PORTRAIT, 'Full-body athletic young woman running mid-stride, side view, black running shorts and black cropped tank top, plain unbranded volt yellow-green running shoes with a white sole and no logos, stripes or marks of any kind, ponytail flying, powerful and fast. No logos or text anywhere.'),
    'kite-portrait': (PORTRAIT, 'Head-and-shoulders portrait of a confident male distance runner in his twenties, light sweat, black running cap worn backwards, plain black training jacket half zipped with no logos, looking at the camera. No logos or text anywhere.'),
    # ---- Lumen: a music festival in a glasshouse -----------------------
    'lumen-sax': (PORTRAIT, 'Waist-up portrait of a jazz saxophonist in a dark green velvet suit playing a gold tenor saxophone, eyes closed, warm amber stage light from the side.'),
    'lumen-singer': (PORTRAIT, 'Waist-up portrait of a soul singer in a flowing amber silk dress singing into a vintage chrome microphone on a stand, joyful, warm light.'),
    'lumen-producer': (PORTRAIT, 'Waist-up portrait of an electronic music producer with large studio headphones around the neck and a faded denim jacket, smiling slightly, looking at the camera.'),
    'lumen-monstera': (SQUARE, 'A single large glossy monstera deliciosa leaf with its stem.'),
    'lumen-orchid': (PORTRAIT, 'A white moth orchid stem arching with six open blooms and two buds.'),
    'lumen-fern': (PORTRAIT, 'A single long green fern frond, gently curved.'),
    'lumen-moth': (SQUARE, 'A luna moth with pale green wings spread wide, long tails, seen from directly above.'),
}


def headers():
    key = os.environ.get('OPENAI_API_KEY')
    if not key:
        sys.exit('OPENAI_API_KEY is not set')
    return {'Authorization': f'Bearer {key}'}


def request(name, size, prompt, edit=None):
    fields = {
        'model': MODEL,
        'prompt': f'{prompt} {CUTOUT}',
        'size': size,
        'quality': QUALITY,
        'background': 'transparent',
        'output_format': 'png',
    }
    for attempt in range(4):
        try:
            if edit:
                with open(RAW / f'{edit}.png', 'rb') as source:
                    res = requests.post(
                        'https://api.openai.com/v1/images/edits',
                        headers=headers(),
                        data=fields,
                        files={'image[]': (f'{edit}.png', source, 'image/png')},
                        timeout=300,
                    )
            else:
                res = requests.post('https://api.openai.com/v1/images/generations', headers=headers(), json=fields, timeout=300)
            res.raise_for_status()
            return base64.b64decode(res.json()['data'][0]['b64_json'])
        except requests.RequestException as error:
            body = getattr(error.response, 'text', '')[:300] if getattr(error, 'response', None) is not None else ''
            print(f'  {name}: attempt {attempt + 1} failed: {error} {body}', flush=True)
            time.sleep(2 ** (attempt + 1))
    raise RuntimeError(f'{name}: gave up')


def finish(name):
    """Trim to the subject, drop alpha noise, and write the webp the films load."""
    image = Image.open(RAW / f'{name}.png').convert('RGBA')
    alpha = image.getchannel('A').point(lambda a: 0 if a < 8 else a)
    image.putalpha(alpha)
    box = alpha.point(lambda a: 255 if a > 24 else 0).getbbox()
    if box:
        pad = round(max(image.size) * 0.01)
        image = image.crop((max(0, box[0] - pad), max(0, box[1] - pad), min(image.width, box[2] + pad), min(image.height, box[3] + pad)))
    OUT.mkdir(parents=True, exist_ok=True)
    image.save(OUT / f'{name}.webp', 'WEBP', quality=88, method=6)
    return image.size


def make(name):
    size, prompt, *rest = ART[name]
    edit = rest[0] if rest else None
    started = time.time()
    RAW.mkdir(parents=True, exist_ok=True)
    (RAW / f'{name}.png').write_bytes(request(name, size, prompt, edit))
    width, height = finish(name)
    print(f'{name}: {width}x{height} in {time.time() - started:.0f}s', flush=True)


def main(argv):
    if '--finish' in argv:
        for name in ART:
            if (RAW / f'{name}.png').exists():
                print(name, finish(name))
        return
    wanted = list(ART) if '--all' in argv else [a for a in argv if not a.startswith('--')]
    if not wanted:
        wanted = [name for name in ART if not (OUT / f'{name}.webp').exists()]
    unknown = [name for name in wanted if name not in ART]
    if unknown:
        sys.exit(f'unknown art: {", ".join(unknown)}')
    # Sources first: an edit reads its source's raw PNG.
    sources = [n for n in wanted if len(ART[n]) == 2]
    edits = [n for n in wanted if len(ART[n]) == 3]
    with ThreadPoolExecutor(max_workers=6) as pool:
        list(pool.map(make, sources))
        list(pool.map(make, edits))


if __name__ == '__main__':
    main(sys.argv[1:])
