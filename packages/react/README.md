# area-mockups

Interactive, GPU-accelerated **3D device mockups for React**. Put any content on the screen
of a 3D device — real DOM, projected onto WebGL glass, so it stays fully live: buttons click,
videos play, iframes scroll.

- **Seventeen devices** — the Galaxy S26 line (S26, S26 Ultra), the Galaxy Z Fold 7 and
  Z Flip 7 foldables, the full iPhone 17 family (17, 17 Air, 17 Pro, 17 Pro Max), MacBook
  Air 13" and MacBook Pro 14" (M5), iPad Pro 13"/11" (M5), Galaxy Tab S11 / S11 Ultra, an
  Apple Watch Series 11 and a Studio Display-style 27" monitor, all procedurally generated
  at runtime. No GLB files, no
  hosting, no pop-in — importing one mockup costs 6.9–48.1 KB gzipped (the whole
  library: 96.8 KB), peers excluded. The phone, foldable, and
  laptop families carry a small CSG engine that machines their ports and speaker/mic
  holes into the chassis as real cavities; it tree-shakes away for every other mockup.
- **True-to-device screens** — each virtual display matches the real device's logical
  resolution in portrait *and* landscape (table below), so your layouts and breakpoints
  behave exactly like on the hardware.
- **Real GPU rendering** — three.js + react-three-fiber, physically-based materials, studio
  lighting, soft shadows, clamped DPR.
- **Any content on screen** — pass React components, an `<iframe>` or a `<video>` as
  children. Pointer events, state and scrolling keep working.
- **Composable** — use the one-liners `<PhoneMockup>` / `<IPhoneMockup>` / `<LaptopMockup>`
  / `<TabletMockup>` / `<WatchMockup>` / `<MonitorMockup>`, or drop `<Phone>` / `<IPhone>` /
  `<Laptop>` / `<Tablet>` / `<Watch>` / `<Monitor>` into your own react-three-fiber scene.

## Install

```bash
npm install area-mockups three @react-three/fiber @react-three/drei
```

React 18+ (19 recommended). `three`, `@react-three/fiber` and `@react-three/drei` are peer
dependencies.

## Quick start

```tsx
'use client'

import { PhoneMockup } from 'area-mockups'

export function Hero() {
  return (
    <div style={{ height: 560 }}>
      <PhoneMockup autoRotate float>
        <YourApp />
      </PhoneMockup>
    </div>
  )
}
```

Drag anywhere — body, background, or the screen itself — to orbit; taps and clicks on the
screen still go to your content. In Next.js, load it client-side only
(`dynamic(() => import('./mockup'), { ssr: false })`).

## Regions & slots

Bare children always fill a mockup's **primary region** (a phone's screen, a book's
cover). Objects with more printable surfaces expose each one as a **compound slot** —
type `AFrameSignMockup.` and your editor lists exactly the regions the object has:

```tsx
<AFrameSignMockup autoRotate>
  <AFrameSignMockup.Front>
    <MenuBoard />
  </AFrameSignMockup.Front>
  <AFrameSignMockup.Back background="#20241f" interactive={false}>
    <HoursBoard />
  </AFrameSignMockup.Back>
</AFrameSignMockup>
```

Every slot takes per-surface overrides — `background`, `resolution`, `interactive`,
`dragToRotate`, `style` — over the mockup-level defaults (`surfaceBackground`,
`resolution`, `interactive`, `dragToRotate`, `surfaceStyle`). Repeating regions
collect in document order:

```tsx
<BrochureMockup>
  <BrochureMockup.Panel><Front /></BrochureMockup.Panel>
  <BrochureMockup.Panel><Middle /></BrochureMockup.Panel>
  <BrochureMockup.Panel side="back"><Back /></BrochureMockup.Panel>
</BrochureMockup>
```

The same slots exist on the raw scene components (`<AFrameSign.Front>` inside your own
r3f scene). Slots must be direct children of their mockup (fragments are fine); region
names come from each object's spec in the core, so every future binding shares them.

## Components

### `<PhoneMockup>` / `<IPhoneMockup>` / `<LaptopMockup>` / `<TabletMockup>` / `<WatchMockup>` / `<MonitorMockup>` — all-in-one

Every `<MockupCanvas>` prop + every corresponding device appearance prop, plus `float`
(idle floating animation). Transforms are first-class: `position`, `rotation` and `scale`
flow straight through to the device group (`<IPhoneMockup rotation={[0, 0.25, 0]}>`).

### `<MockupCanvas>` — the stage

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `controls` | `boolean` | `true` | Drag-to-orbit controls |
| `freeRotation` | `boolean` | `false` | Allow full 360° vertical rotation (straight over the top); off = classic clamped orbit |
| `autoRotate` | `boolean` | `false` | Slowly orbit the camera |
| `autoRotateSpeed` | `number` | `1` | Orbit speed |
| `zoom` | `boolean` | `false` | Scroll/pinch zoom (off so pages don't lose scroll) |
| `shadows` | `boolean` | `true` | Soft contact shadow |
| `shadowY` | `number` | `-2.05` | Y of the shadow plane (grounds the device) |
| `environment` | `boolean` | `true` | Procedural studio lighting (no HDR downloads) |
| `background` | `string` | — | CSS background of the canvas |
| `camera` | r3f camera | `[0, 0.5, 7.4]`, fov 40 | Camera override |
| `dpr` | `number \| [min, max]` | `[1, 2]` | Device-pixel-ratio clamp |

### `<Phone>` — the device

Render inside any r3f `<Canvas>`. Accepts all group props (`position`, `rotation`, `scale`…).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Screen content |
| `color` | `string` | `'#101216'` | Back-panel colorway |
| `frameColor` | `string` | `'#4a4f59'` | Frame, buttons, camera rings |
| `surfaceBackground` | `string` | `'#000000'` | CSS background behind your content |
| `variant` | `'s26' \| 's26ultra'` | `'s26'` | Which Galaxy S26-family device (true relative sizes + per-model cameras) |
| `colorway` | `string` | — | Retail colorway id (see `GALAXY_COLORWAYS` — every device family ships its catalog); presets `color`/`frameColor`, explicit props override |
| `orientation` | `'portrait' \| 'landscape'` | `'portrait'` | Landscape lays the device sideways and swaps the virtual display |
| `resolution` | `number` | per variant | Virtual display width in CSS px (see resolution table) |
| `punchHole` | `boolean` | `true` | Front-camera punch hole overlay |
| `interactive` | `boolean` | `true` | Let pointer events reach the screen |
| `dragToRotate` | `boolean` | `true` | Drags starting on the screen spin the device (taps still click) |
| `occlude` | `boolean \| 'blending'` | `true` | Hide content when the device faces away |
| `surfaceStyle` | `CSSProperties` | — | Extra styles for the screen wrapper |

### `<IPhone>` — iPhone 17 family

Same API as `<Phone>`, except: `variant` is `'17' | 'air' | 'pro' | 'promax'`,
`dynamicIsland` replaces `punchHole`, and `resolution` defaults to the variant's logical
point grid (see resolution table). Camera architecture follows the real devices: two-lens
pill (17), ultra-thin single-lens bar (Air), full-width triple-lens plateau with flash +
LiDAR (Pro / Pro Max).

### `<Laptop>` — MacBook Air 13" / MacBook Pro 14" (M5)-style

Same screen/interaction API (`interactive`, `dragToRotate`, `occlude`, `surfaceStyle`), plus
`notch` (camera notch overlay), `openAngle` (lid angle, default `110`), and `resolution`
defaulting to the variant's scaled desktop (Air 1280×832, Pro 14 1512×982 — desktop breakpoints
apply). `color` sets the aluminum finish (Sky Blue `#aec6d9`, Starlight `#e8e0d4`,
Midnight `#2e3642`).

## Virtual screen resolutions

Every variant's screen defaults to the real device's logical resolution (CSS px):

| Device | `variant` | Portrait | Landscape | Basis |
| --- | --- | --- | --- | --- |
| Galaxy S26 | `s26` | 360×780 | 780×360 | 2340×1080 panel at ⅓ (3x) |
| Galaxy S26 Ultra | `s26ultra` | 384×833 | 833×384 | One UI default FHD+ render @ 450 dpi |
| Galaxy Z Fold 7 (open / folded) | `fold7` | 820×910 / 360×835 | swapped | inner 2184×1968, cover 2520×1080 |
| Galaxy Z Flip 7 (open / folded) | `flip7` | 360×838 / 316×353 | swapped | main 2520×1080, cover 948×1048 |
| iPhone 17 | `17` | 402×874 | 874×402 | 2622×1206 @ 3x point grid |
| iPhone 17 Air | `air` | 420×912 | 912×420 | 2736×1260 @ 3x point grid |
| iPhone 17 Pro | `pro` | 402×874 | 874×402 | 2622×1206 @ 3x point grid |
| iPhone 17 Pro Max | `promax` | 440×956 | 956×440 | 2868×1320 @ 3x point grid |
| MacBook Air 13" (M5) | `air13` | — | 1280×832 | 2560×1664 @ 2x default scaled |
| MacBook Pro 14" (M5) | `pro14` | — | 1512×982 | 3024×1964 @ 2x default scaled |
| iPad Pro 13" (M5) | `ipadpro13` | 1032×1376 | 1376×1032 | 2752×2064 @ 2x point grid |
| iPad Pro 11" (M5) | `ipadpro11` | 834×1210 | 1210×834 | 2420×1668 @ 2x point grid |
| iPad Air 13" (M4) | `ipadair13` | 1024×1366 | 1366×1024 | 2732×2048 @ 2x point grid |
| iPad Air 11" (M4) | `ipadair11` | 820×1180 | 1180×820 | 2360×1640 @ 2x point grid |
| iPad (A16) | `ipad11` | 820×1180 | 1180×820 | 2360×1640 @ 2x point grid |
| Galaxy Tab S11 | `tabs11` | 800×1280 | 1280×800 | 2560×1600 panel at ½ (xhdpi) |
| Galaxy Tab S11 Ultra | `tabs11ultra` | 924×1480 | 1480×924 | 2960×1848 panel at ½ (xhdpi) |
| Apple Watch Series 11 46mm | — | 208×248 | — | 416×496 @ 2x point grid |
| Studio Display 27" | — | — | 2560×1440 | 5120×2880 @ 2x point grid |

### `<Tablet>` — the iPad lineup / Galaxy Tab S11 family

Shares the phones' screen/interaction API plus `orientation`, with a `variant` prop
(`'ipadpro13' | 'ipadpro11' | 'ipadair13' | 'ipadair11' | 'ipad11' | 'tabs11' |
'tabs11ultra'`). Fully procedural and per-variant accurate: the Pro's camera pod
(wide lens, LiDAR, flash) and Pencil charging window, the Air's and standard iPad's
bare single lens with the Touch ID top button, back or edge Smart Connector dots and
speaker drill rows; protruding camera rings, quad speaker slots, gold pogo contacts
and (on the Ultra) the U-shaped display notch on the Galaxy Tabs; brand marks as real
vector geometry (Apple glyph, edge-aligned SAMSUNG wordmark) and model wordmarks on
the backs; landscape-edge front cameras, USB-C and machined edge buttons on all.

### `<Watch>` — Apple Watch-style · `<Monitor>` — Studio Display-style

The watch adds `bandColor` (Sport-Band straps) and skips orientation: squircle case,
knurled Digital Crown, side button, sensor dome and straps. The monitor puts the
2026 Studio Display's 27" 5K panel on its tilt stand — uniform bezel, centered
camera, the tight rear 2× Thunderbolt 5 + 2× USB-C slot cluster, the captive power
cord's circular recess framed by the stand's cable hole and, faithfully, no power
button.

Renderer-agnostic device specs (`GALAXY_VARIANTS`, `IPHONE_VARIANTS`, `TABLET_VARIANTS`,
`PHONE`, `IPHONE`, `LAPTOP`… plus each object's region registry and stage framing) are
available from the `area-mockups/core` subpath — the same data will drive the planned
2D (CSS/SVG) renderers.

## Architecture

`area-mockups` is the **React binding** of a framework-agnostic core. All device/object
specs, region registries, stage framing, geometry math and shared screen/stage behaviors
live in
[`@area-mockups/core`](https://github.com/subwaymatch/area-mockups/tree/main/packages/core)
(bundled into this package — nothing extra to install). The main entry re-exports a
curated slice (variants, colorways, size types); the full core surface is available from
`area-mockups/core`. Svelte and Vue bindings sharing the same core are planned; see
[ARCHITECTURE.md](https://github.com/subwaymatch/area-mockups/blob/main/ARCHITECTURE.md).

## Docs & demos

Full documentation and live demos: [github.com/subwaymatch/area-mockups](https://github.com/subwaymatch/area-mockups)

## License

MIT © subwaymatch
