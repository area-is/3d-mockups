# react-3d-mockups × Remotion

A [Remotion](https://www.remotion.dev) project that renders react-3d-mockups
to video: a reel over animated [Tabbied](https://tabbied.com) pattern
backgrounds, and three campaign films that use no patterns at all.

- **`MockupReel`**: a ~30 s reel at 1920×1080. It opens on a title card,
  then gives single mockups a shot each - an iPhone 18 Pro Max turning
  through three finishes, a Galaxy Z Fold8 opening from shut to flat, a
  MacBook Neo's lid opening into a push-in, an Apple Watch Ultra close-up,
  and a record, a book and a box - then puts four devices on one stage at
  their true relative sizes under a moving camera. A code caption on each
  mockup shot shows the props driving it, values updating live.
- **`ProbeDemand`, `ProbeAlways`, `ProbeCapture`**: measurement compositions.
  Each frame paints the same colour on a device screen and on a plain DOM
  swatch, and `scripts/probe-sync.py` checks the rendered frames agree. See
  [What the probes found](#what-the-probes-found).
- **`Bench`**: the same turning phone with parts of the stage switched off,
  to see where render time goes.
- **`WatchSheet`, `WatchBackSheet`, `FoldSheet`**: stills for checking a model
  against reference photos - a watch from six angles, its side views through a
  long lens like product shots; a watch's case back with the band hidden (worn,
  it covers the back from every square-on angle); or a foldable at ten hinge
  angles to see which display is lit at each. Render one frame:
  `npx remotion still WatchSheet out/ultra4.png --props='{"kind":"apple","variant":"ultra4"}'`.

- **`GroveFilm`, `KiteFilm`, `LumenFilm`**: three ~25 s films, each a
  campaign for a fictional brand carried across the objects and devices it
  would really appear on. See [The campaign films](#the-campaign-films).

It is not an npm workspace: it installs the package from `../../packages/react`
the way an app would, so build the package first.

```bash
npm install                        # at the repository root: builds packages/react
cd examples/remotion
npm install
npm run studio                     # preview in Remotion Studio
npm run render                     # out/mockup-reel.mp4
npm run render:grove               # out/grove.mp4 (also render:kite, render:lumen)
```

## The campaign films

Each film is one brand, told on the surfaces it would be printed or shown
on, with a backdrop made of CSS and photographs rather than a pattern:

- **Grove** (`src/campaigns/grove`), a cold-pressed juice: a gable-top
  carton turning in a pool of morning light, the three-flavour range set down
  on a table, a kraft bag swinging, the corner it is sold on (a bus shelter
  with its LED board and a sidewalk A-frame on one stage, at their true
  relative sizes), the delivery van in a full wrap, and a billboard shot from
  below.
- **KITE** (`src/campaigns/kite`), a running shoe's drop: the shoe tears
  across the title, sits on an iPhone 18 Pro Max product page through its
  three colourways and then lifts off the glass into the next shot; a Galaxy
  Z Fold8 counts down on its cover display and opens on the lookbook; an
  Apple Watch Ultra 4 gets the shipping note mid-run; the shoe box lands on
  the shipper; and the whole drop lies on a desk at true scale, shot from
  straight overhead before the camera cranes down.
- **Lumen** (`src/campaigns/lumen`), a music festival in a glasshouse: the
  invitation opening as a luna moth crosses it, the Z-fold programme
  unfolding, the artist pass turning on its lanyard, the live record spinning
  beside the zine, and the gate at night - a DOOH totem and two roll-up
  banners under string lights.

`src/campaigns/kit.tsx` holds what they share: `Face` (a printed surface
laid out in container units, so one design holds at any `resolution`),
`Cut` and `Drift` (a cut-out on a surface, or in the frame in front of or
behind the transparent canvas, blurred for depth of field, and kept clear of
the mockups), a `CameraRig` keyed by frame, a `Floor` that fades into the
CSS backdrop so a stage has ground for its contact shadow, `settle` (a short
set-down onto a surface), `statusBarFont` and `OverlapProbe` (see below).

### The photographs

Every photograph in the films - fruit, four growers, the shoe in three colours,
runners, musicians, plants, a moth - is a cut-out on a transparent
ground in `public/art`, generated with OpenAI's GPT Image 2.5
(`gpt-image-2.5-sunburst`, `quality: "low"`, `background: "transparent"`).
`scripts/generate-art.py` holds every prompt and regenerates any of them:

```bash
OPENAI_API_KEY=... npm run art                   # only the missing ones
OPENAI_API_KEY=... npm run art -- kite-runner    # just these
```

Two things it learned. Asked for a transparent background alone, the model
stood a lemon on an opaque white studio floor; naming every kind of ground it
must leave out (floor, shadow, backdrop, reflection, glow) gave clean
cut-outs. And the shoe's sky and ember colourways and its three-quarter view
are edits of the volt image rather than fresh generations, so all four are
the same shoe. The script needs Python 3 with Pillow and requests.

### Sound

KITE and Grove are cut for narration, a music bed and effects from
[ElevenLabs](https://elevenlabs.io). Each film's cue sheet,
`src/campaigns/<film>/sound.json`, holds what the narrator says and when, the
effects on the visual beats, and a prompt for the music. Every cue is anchored
to a shot and a frame within it, so re-timing a shot carries its sound along.
`src/campaigns/sound.tsx` plays whatever of the sheet is in
`public/audio/<film>/` and nothing that is not, so the films render silent
until the files exist:

```bash
ELEVENLABS_API_KEY=... npm run audio -- kite          # generate what is missing
ELEVENLABS_API_KEY=... npm run audio -- kite vo-03-fold
npm run audio -- grove --dry-run                      # the cue sheet, no requests
```

Working in the ElevenLabs app instead, `--dry-run` lists every file name with
its text or prompt and length; save each file under its name and the film
picks it up. The mix is in the sheet: the music fades in over the first 12
frames and out over the last second, and dips to `duck` (40%) for each line's
window. Each line has a window (`maxSeconds`) that ends before the next shot,
and the script reports any read that runs past it. The script trims the
silence the voice model leaves around a line, so it starts on its cue.

The narration is written for the voice, not the screen: "Aero Two", "October
ninth" and "Kite" rather than "AERO 2", "10.09" and "KITE", which a
text-to-speech model may read as a decimal or spell out. Each line is one
short sentence or two per shot (1.3 to 2.6 words a second), so it lands
inside the shot with room to breathe. Each line complements the type on
screen rather than reading it out.

| KITE | Narration | Effects |
| --- | --- | --- |
| 0:00.4 title | This is Aero Two. | whoosh as the shoe tears past (0:00.1) |
| 0:03.2 app | Three colours. One seriously light shoe. | taps on each colourway (0:03.8, 0:05.2), lift-off (0:06.1) |
| 0:07.7 Fold | The countdown's on. And the drop is live. | countdown beeps (0:07.6, 0:07.9), launch chime (0:08.3), hinge (0:08.5) |
| 0:11.7 watch | Tempo pace. Easy-day feel. | notification (0:12.9) |
| 0:15.4 boxes | Unbox it. Lace up. Go. | box set down (0:15.1) |
| 0:19.5 desk | October ninth. Only in the Kite app. | camera swoosh (0:19.3) |
| 0:23.4 outro | Kite. Run lighter. | logo sting (0:23.0) |

| Grove | Narration | Effects |
| --- | --- | --- |
| 0:00.7 hero | Squeezed this morning. Not last month. | orchard morning (from 0:00) |
| 0:04.9 line-up | Blood orange. Lemon ginger. Green apple. | cut (0:04.5), three cartons set down (0:04.8 to 0:05.2) |
| 0:09.1 bag | Cold, fresh, and good to go. | paper bag (0:09.0) |
| 0:12.8 corner | On your corner, before you're even up. | street (from 0:12.3) |
| 0:17.6 van | Delivered fresh every morning. | van rolling past (0:17.5) |
| 0:20.9 billboard | Never from concentrate. | wind (from 0:20.7) |
| 0:24.1 outro | Grove. Squeezed this morning. | pour and ding (0:23.7) |

### Notes from making them

- **Set things down; don't drop them.** A spring's overshoot carried a
  dropped carton below the table and the shoe box into the shipper, and its
  wobble read as rubber. A fall at real gravity was worse in a different way:
  from any height worth seeing, it is over in a few frames and looks thrown.
  `settle()` lowers an object the last couple of centimetres at the stage's
  scale (`20 / mmPerUnit`) and slows it to rest as it touches, the way a thing
  put down by hand arrives: straight down, no tip, no spin, no bounce.
- **Check a stage for collisions.** Every multi-object stage names its
  objects and mounts an `OverlapProbe`; render with
  `REMOTION_OVERLAP_PROBE=1` and it logs any frame where one object's
  vertices are inside another's bounds (in that object's own rotated frame):
  `[overlap] frame 50: shoebox enters laptop (973 vertices)`. A scaled-down
  render is enough: `--scale=0.25 --sequence --image-format=jpeg`.
- **Print on the stock, not over it.** A face drawn straight over a kraft
  bag read as a sticker. The bag's ink layer multiplies into the board, is
  mottled through a noise mask and a hair soft at the edges, and the paper -
  grain, the turned-over hem, the shading of a bag that is not quite flat -
  is laid over everything (`OnKraft` in `grove/art.tsx`).
- **Small type is set in sentence case,** at the face's own spacing, never
  in tracked capitals.
- **Name the status bar's face.** A device's status bar asks for SF or One
  UI Sans, which a render machine has neither of. KITE points it at the
  faces the film loads with `statusBarFont()`, which sets
  `--mockup-status-bar-font`: Inter on the iPhones and Roboto on the Fold. The
  product page is a light screen, so its bar is set dark
  (`statusBar={{ color: '#000000' }}`), the way a light app's is.
- **Slots must be direct children.** A component that returns
  `<CustomBox.Top>` and friends is not a slot; a function that returns a
  fragment of them is (`shoeboxFaces(colourway)`).
- **A foldable's content follows the lit display.** Below 30 degrees the
  cover screen is lit, so the Fold shot renders the countdown below it and
  the lookbook above it.
- **A greeting card's spread faces away from the default camera.** Turning
  it by `-π` plus half the fold (`(180 - openAngle) / 2`) keeps the cover
  square to the lens while it is shut and lands on the inside spread when it
  is open.
- **A mailer's `tapeColor` reaches the printed faces only.** The tape on an
  unprinted end stays kraft, so the KITE shipper prints both ends.
- **Lifting something off a screen** is a DOM cut-out placed where the
  on-glass one sits on the lift frame (measured from a still), with the
  on-glass copy hidden from that frame on. The phone holds still and square
  for it, which is why that shot has no idle `float`.
- **Keep transitions flat.** `slide`, `wipe`, `iris`, `clockWipe` and
  `pushCut` move or clip the outgoing shot in 2D and are fine. `flip` puts
  it in a CSS 3D perspective, which compounds with the 3D transforms that
  place each screen's DOM on the glass: the printed faces came off the
  geometry they belong to, and the half-way frame was black. And `pushCut`
  leaves the incoming shot zoomed to 107% when it ends, so the shot jumps
  back to 100% the frame after; Grove passes `incomingStartScale: 1` and
  `incomingEndScale: 1`.
- **Render one film at a time, without `fromSurface`.** Rendered while
  another render (or a batch of stills) shared the CPU, a few frames in
  every thousand came out with a whole canvas, or one surface, missing for
  a single frame - Remotion's own screenshot code notes a frame drop under
  pressure with Chrome's `fromSurface` capture. Rendered one at a time with
  `DISABLE_FROM_SURFACE=1` (which `remotion.config.ts` sets), all three came
  out without one: 15 such frames across the first renders, none in 2,260
  frames of the second. To check a render, look for a frame that differs
  from both of its neighbours far more than they differ from each other.

WebGL in headless Chrome needs a GPU backend. `remotion.config.ts` asks for
`swangle` (SwiftShader under ANGLE, on the CPU), which works anywhere and is
slow; on a machine with a GPU, pass `--gl=angle`. To use a Chrome Headless
Shell you already have instead of Remotion's download, set
`REMOTION_BROWSER_EXECUTABLE`.

## Making a mockup behave in a render

Remotion renders frames out of order, across several browser tabs, and
photographs the page once each frame's React tree has rendered and every
`delayRender()` handle has been cleared. Three rules follow.

1. **Hold the frame until the mockup has drawn it.** Pass `delayCapture`
   (`src/use-mockup-capture.ts` wires it to `delayRender`). The renderer starts
   asynchronously, WebGL redraws on the next animation frame, and each screen
   is a React root of its own that commits after the scene - none of which
   Remotion can see without it.
2. **Every frame is a function of the frame number.** Transforms and props
   come from `useCurrentFrame()`; `autoRotate` and `float` run on the
   browser's clock, so the reel samples the float curve itself with
   `floatPose(frame / fps)` from `react-3d-mockups/core`. Screen content reads
   `useCurrentFrame()` too - the page's context reaches the glass.
3. **Move the camera from inside the canvas.** The `camera` prop is read once,
   when react-three-fiber creates the camera. The solo shots zoom with the
   object's `scale`; the ensemble scene moves the stage camera from a
   `CameraRig` component, which is also cheaper - the contact shadow only
   redraws when an object moves.

### Tabbied backgrounds

`src/reel/backdrop.tsx` renders a `TabbiedPattern` behind the canvas (the
mockup canvas is transparent). A pattern draws its first frame
asynchronously, so the backdrop holds the render until `onReady`. It moves by
a frame-driven CSS transform on an oversized layer - never by reseeding or
resizing the pattern, which re-renders it through Tabbied's ~400 ms cell
transitions on the browser's clock and would come out differently on every
render. Each shot mounts its own pattern with a fixed seed instead.

## What the probes found

Rendered with Remotion 4.0.530 in Chrome Headless Shell 141 on SwiftShader, 90
frames at concurrency 4, the library's documented recipe (`frameloop`, no
capture hold) left **blank frames wherever a mockup mounted**: the first frame
of a `<Sequence>`, or of a render tab, came out with no device at all or a
bare screen hole - frames 2 and 45 on one run, 46 on the next. Frames inside a
running shot were in sync on both runs. With `delayCapture`, all 90 frames
matched.

`frameloop="always"` (which the recipe used to recommend) only costs: every
tab keeps redrawing between captures on the same CPU that renders them.

## What the bench found

`Bench` renders 12 frames of a turning phone at 1280×720 with parts of the
stage switched off. The page without the mockup took 3 s; with it, 126 s, and
neither antialiasing (131 s without it) nor the contact shadow (115 s with a
still object) accounted for it. Four render tabs were no faster than one.

The cost was the studio lighting: every render of the canvas handed drei's
`<Environment>` new children, so it re-rendered its cube map and three.js
re-filtered it into PMREM mip levels - on every frame of a video, whose props
change every frame. With the light formers built once, the same 12 frames
take 25 s in one tab, and the 90-frame probe went from 940 s to 74 s.

On this 4-core machine, one tab is the fastest setting: all tabs share
SwiftShader's single GPU process, and three tabs took 106 s for the probe.
`npm run render` passes `--concurrency=1`; on a machine with a GPU, try more.
The whole reel - 912 frames at 1920×1080, up to two canvases at once during a
transition - rendered in 42 minutes there.

`scripts/probe-sync.py` needs Python 3 with Pillow and numpy:
`python3 scripts/probe-sync.py out/ProbeCapture` after
`npx remotion render ProbeCapture out/ProbeCapture --sequence --image-format=png`.
