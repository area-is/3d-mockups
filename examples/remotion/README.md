# react-3d-mockups × Remotion

A [Remotion](https://www.remotion.dev) project that renders react-3d-mockups
to video, over animated [Tabbied](https://tabbied.com) pattern backgrounds.

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

It is not an npm workspace: it installs the package from `../../packages/react`
the way an app would, so build the package first.

```bash
npm install                        # at the repository root: builds packages/react
cd examples/remotion
npm install
npm run studio                     # preview in Remotion Studio
npm run render                     # out/mockup-reel.mp4
```

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
