# Repository audit — area-3d-mockups

**Date:** 2026-08-05 · **Commit audited:** `6615255` (main) · **Auditor:** Claude Code

## Scope and method

This audit covers the whole repository: the core package (`@area-3d-mockups/core`), the React binding (`area-3d-mockups`), the docs/demo app (`apps/docs`), the documentation content, the home page, the live demos, mobile UX, repo hygiene, and release readiness. Findings were produced by:

- Reading all source in `packages/core` (55 files), `packages/react` (~60 files), and `apps/docs` (app code, components, scripts, config), plus every `.mdx` content page, README.md, and ARCHITECTURE.md.
- Executing the built package (`dist/index.cjs`) to confirm runtime behavior of suspicious code paths (color math, `mockupInfo` measurements, framing extents).
- Running `npm run typecheck` (passes cleanly across all three workspaces) and `npm run devices:check` (passes — but see finding C-6).
- Live-testing the site with headless Chromium (SwiftShader WebGL) at desktop (1440×900) and mobile (375×812, touch) viewports across 9 routes: home, /demos, /docs, /docs/quick-start, /docs/api/galaxy-s26, /docs/api/van, /docs/devices, /examples/hero-phone, and a 404 probe — capturing console errors, page errors, failed requests, horizontal overflow, heading structure, touch-target sizes, and metadata.
- Probing the npm registry for the published package.

Severity legend: **P0** — fix before (or as part of) the first public release; **P1** — high-value, fix soon; **P2** — polish/backlog.

---

## Executive summary

This is an unusually disciplined codebase for its age. The core/binding layering described in ARCHITECTURE.md is real and consistently enforced, three.js resource disposal is near-universal, SSR guards are consistent, WebGL context management in the docs site is genuinely careful (single-canvas carousel, IntersectionObserver-windowed scenes), typecheck is clean under `strict` + `noUncheckedIndexedAccess`, and the live pages render with **zero page errors and zero horizontal overflow at 375 px**. The documented claims that were spot-checked against hardware specs (mm scales, prop tables, colorway ids, canvas defaults) overwhelmingly check out.

The gaps cluster in five places:

1. **The package is not actually on npm** while every install path in the README, home page, and docs assumes it is — the single most user-visible issue.
2. **Peer-dependency metadata is wrong** in ways that will break real installs (`react >=18` is unsatisfiable with fiber 9/drei 10; `three >=0.160` contradicts the bundled CSG engine's `>=0.179` floor).
3. **Two runtime correctness bugs in core** (rail-color math runs in the wrong color space; `mockupInfo('van'|'bus')` measures a different surface than the component renders by default).
4. **Zero automated tests** anywhere (the only guards are a type-test file and the visual harness), so several of the bugs above were invisible to the existing checks.
5. **Accessibility and SEO omissions** in the docs site: no `prefers-reduced-motion` handling anywhere, no Open Graph/Twitter metadata, no sitemap/robots, an unstyled default 404, and sub-32 px touch targets on swatches and controls.

### Top 10 action items

| # | Priority | Action |
|---|----------|--------|
| 1 | P0 | Publish `area-3d-mockups@0.1.0` to npm (or add a prominent "not yet published — install from git" note everywhere installs are shown) |
| 2 | P0 | Fix peer ranges: `react`/`react-dom` → `>=19`, `three` → `>=0.179.0` (R-1, R-2) |
| 3 | P0 | Fix `railColor` color-space bug — every custom `color` prop currently gets a visibly wrong rail (C-1) |
| 4 | P0 | Fix `mockupInfo('van'|'bus')` default-coverage inversion — print-dimension API returns the wrong physical size (C-2) |
| 5 | P0 | Fix the pre-release docs drift: broken `/docs/api/galaxy` and `/docs/api/galaxy-watch` links, "Seventeen devices" vs 22, phantom `PHONE`/`LAPTOP`/`TABLET` exports, stale package README size/device tables (D-1…D-5, R-5) |
| 6 | P1 | Add `prefers-reduced-motion` support to the library (`autoRotate`, `float`, LED animations) and the site (carousel auto-advance, CSS animations) (A-1) |
| 7 | P1 | Add `not-found.tsx`, a WebGL-unavailable fallback, OG/Twitter metadata + `metadataBase`, `sitemap.ts`, and `robots.ts` to the docs app (S-1…S-3) |
| 8 | P1 | Stop statically importing the 3D stack into every docs page — wrap `ObjectDemo`/`MockupExplorer` in `dynamic(..., { ssr: false })` like the site pages already do (S-4) |
| 9 | P1 | Stand up a real test runner (vitest) starting with the registry-invariant, slot-routing, and color golden-value tests listed in "Testing" below (T-1) |
| 10 | P1 | Add repo hygiene files: CONTRIBUTING.md, CHANGELOG.md, issue templates; add a docs-site link, screenshot/GIF, and badges to README (H-1, H-2) |

---

## 1. Release readiness (P0 cluster)

### 1.1 The package is not published

`https://registry.npmjs.org/area-3d-mockups` returns `Not found` (checked 2026-08-05), yet:

- The home page hero prints `$ npm install area-3d-mockups` (`apps/docs/app/(site)/page.tsx:25`) and the quick-start section repeats it with peers.
- `apps/docs/content/docs/index.mdx:40` and the README both document the npm install as the entry point.
- `.github/workflows/release.yml:8-13` itself notes the first publish must happen by hand before trusted publishing can take over.

**Action:** do the manual `v0.1.0` publish and attach the trusted publisher (the workflow documents the exact steps), or clearly mark the library as pre-release everywhere an install command appears. Items 1.2–1.4 and the docs-drift fixes below should land first so the first published artifact is correct.

### 1.2 Peer dependency ranges break installs (packages/react/package.json:68-74)

- **R-1 (High):** `react: ">=18"` is unsatisfiable: `@react-three/fiber@9` peer-requires `react >=19 <19.3` and `@react-three/drei@10` requires `^19`. React 18 users hit ERESOLVE on install. The code targets the fiber-9 API regardless. `packages/react/README.md:37` repeats the "React 18+" claim. → Change to `>=19` and fix the README.
- **R-2 (High):** `three: ">=0.160.0"` contradicts the bundled `three-bvh-csg@0.0.18`, which requires `three >=0.179.0`. Because the CSG engine is inlined into `dist`, its own peer check never runs for consumers — three 0.160–0.178 is an undeclared-compatibility window where the machined-port geometry can silently degrade (the `try/catch` at `packages/react/src/devices/details.tsx:328-330` swallows failures). → Raise the floor to `>=0.179.0`.
- **R-3 (Medium):** The CJS entry (`dist/index.cjs`) does `require("three")`, but three ships ESM-only — `require()` of it throws `ERR_REQUIRE_ESM` on Node < 22.12. Bundlers are unaffected, but the `exports.require` condition advertises something that fails on common LTS runtimes. → Consider ESM-only, or document the Node floor.
- **R-4 (Low):** `exports` lacks `"./package.json"`; some tooling reads it. Core's package.json additionally lacks `publishConfig: { access: "public" }` (needed if it ever "graduates to a standalone release" as ARCHITECTURE.md plans) and the nested `types` condition for its `require` branch, so `index.d.cts` is unreachable under node16 resolution.

### 1.3 The npm registry page will show stale claims (packages/react/README.md)

**R-5 (Medium):** Line 9 claims "Seventeen devices" (there are 22 variants); the resolution table is missing `air15`, `pro16`, and Galaxy Watch 8; the size claims ("6.9–48.1 KB per mockup … whole library: 96.8 KB") are stale — re-running `scripts/measure-size.mjs` today yields 7.1–48.4 KB and **103.2 KB**. → Re-run `measure-size` and `devices:sync` against this README before publishing.

### 1.4 Dev workflow deletes a published export

**R-6 (Medium):** `npm run dev` runs `tsup --watch` with `clean: true` (`packages/react/tsup.config.ts:9`), which wipes `dist/catalog.json` on startup; only `build`/`prepare` regenerate it (`build-catalog.mjs` runs after tsup, never in watch mode). Confirmed: after `npm install` + `npm run dev`, `dist/catalog.json` is gone, so the documented `area-3d-mockups/catalog.json` export dangles during development. → Emit the catalog from tsup's `onSuccess` (runs after every watch rebuild), or exclude it from `clean`.

---

## 2. Core package (`@area-3d-mockups/core`)

Runtime claims below were confirmed by executing the built package. The registry itself is complete — all 23 object specs and 10 device kinds have matching `REGIONS`/`METRICS`/`FRAMING` and a registry row, and spot-checked mm scales round-trip to published hardware sizes.

### High

- **C-1. `railColor` computes in the wrong color space** (`packages/core/src/colorways.ts:209-215`). `Color.getHSL`/`setHSL` operate in three's *linear* working space since r152, but the `RAIL_*` constants were fitted in sRGB. Confirmed: `railColor('#2a3245')` returns `#66718e` instead of the in-family `#414a60`/`#3f485c` the docstring promises — every custom `color` prop gets an over-light, over-saturated rail on every supported three version. → Pass `THREE.SRGBColorSpace` to both `getHSL` and `setHSL`; add a golden-value test.
- **C-2. `mockupInfo('van')`/`mockupInfo('bus')` measure the wrong surface for default props** (`packages/core/src/objects/van/dimensions.ts:130`, `bus/dimensions.ts:146`). Both resolvers use `coverage !== 'panel'` to mean "full", so `coverage: undefined` selects the **full wrap** — but the components default to `'panel'`. Confirmed: `mockupInfo('van')` reports the 5.62×2.07-unit full side while `<VanMockup/>` renders the 3.72×1.52 panel — a print shop gets the wrong physical dimensions, violating metrics.ts's own "defaults match the component" contract. → Invert the test (`coverage === 'full' || coverage === 'perforated'`).

### Medium

- **C-3. `mockupInfo('customPanel')` crashes with a raw TypeError** (`metrics.ts:202`, `custom-panel/dimensions.ts:57`): `props?` erases the required `size`, so the no-props call type-checks then throws `Cannot read properties of undefined (reading 'width')`. Same hole in `describeMockup` (`measure.ts:127`). → Conditional-type the props parameter; throw a descriptive error.
- **C-4. TV metrics prop is `inches`, everything else says `size`** (`tv/dimensions.ts:211` vs `:221`): `mockupInfo('tv', {size: 85})` silently measures the 65″ default. → Rename to `size` (deprecated alias if needed). Related nit: `MockupPropsMap.posterFrame.mat` is `boolean` but the component accepts `boolean | string`.
- **C-5. Shared `TABLET_FRAMING`/`WATCH_FRAMING` default to the other family's variant** (`tablet/dimensions.ts:434`, `watch/dimensions.ts:346`): a default `<GalaxyTabMockup/>` grounds its contact shadow for the iPad Pro 13 extent (2.200 vs 1.983) — the shadow sits ~14 mm too low. → Split per-family framings, mirroring the metrics.
- **C-6. Four modelled display rects contradict the panel grids quoted in the same files** (`galaxy/dimensions.ts:143`, `fold/dimensions.ts:108`, `flip/dimensions.ts:91,99`): S26 Ultra renders 384×833 vs the documented 384×832; Fold cover 360×835 vs 840; Flip main 360×838 vs 840; Flip cover 316×353 vs 349. `devices:check` cannot catch this class — it compares docs-vs-render, which share the same rect, and the docs were synced to the wrong values. → Correct the world rects; extend `sync-device-table.mjs` to compare modelled aspect against the hand-maintained Panel column.
- **C-7. Fold/flip framing vs scene thresholds disagree** (`flip/dimensions.ts:170-192`, `fold/dimensions.ts:210-229`): metrics/scenes switch closed↔open at 0.5°, framing at 3°, so the shadow plane teleports ~1 world unit across `open={3}` → `{3.01}`; and below 26° the scenes glide into the folded pose while framing keeps the pure-V formula, leaving the shadow plane inside the body at e.g. `open={10}`. → Unify thresholds and blend the extent with the same 26° smoothstep.

### Low

- **C-8.** Phantom `panels?: number` on `MockupPropsMap.brochure` and unconsumed `BROCHURE_PANELS_PER_SIDE` — leftovers of the removed `repeats` era (`metrics.ts:111`, `brochure/dimensions.ts:78`). Remove.
- **C-9.** `spine` region conventions are transposed between book and magazine (orientation and dpi policy differ for the same-named region); box faces are listed in three different orders/label styles across `productBox`/`mailerBox`/`customBox`. Document or align.
- **C-10.** `measure.ts:134` silently skips a declared region with no metrics key — a typo shrinks `mockupInfo` output instead of failing. Warn or throw.
- **C-11.** `ScreenRadius` (`screen/surface.ts:12`) rejects the specs' own `readonly` tuples, forcing element-by-element re-spreads (`laptop.tsx:1015`). Accept `readonly`.
- **C-12.** Doc-comment rot: a stranded grounding comment floats above `*_MM_PER_UNIT` in ~20 spec files; `van/dimensions.ts:65` misplaces a docblock; `id-card/dimensions.ts:53` claims ~300 dpi where the math gives ~198; `galaxy/dimensions.ts:5-7` overstates cross-family scale consistency.
- **C-13.** Dead exports: `VAN_WRAP_ASPECT`; duplicate re-exports of `describeMockup` types in `metrics.ts:90-91`.

---

## 3. React package (`area-3d-mockups`)

Verified sound (worth keeping): no module-scope `window`/`document` anywhere; every `useMemo`-built geometry/texture spot-checked has a matching dispose; no per-frame allocations in hot paths except one deliberate, documented walk; all 33 wrappers supply `kind`/`regions`/`metrics`/`framing`/`slots` with slot names generated from core regions.

### Medium

- **R-7. `useSurface().region` is documented but never populated** (`screen/device-screen.tsx:117-121`, `screen/use-surface.tsx:19-23`): no scene component ever passes `region=`, so every consumer gets `undefined`, always. → Pass the region name from each `DeviceScreen` call site, or remove the field.
- **R-8. Four wrappers drop the `.info()`/`.regions` statics** (`tv-mockup.tsx:51`, `apple-watch-mockup.tsx:47`, `galaxy-watch-mockup.tsx:53`, `galaxy-tab-mockup.tsx:55`): the camera-injecting shells re-attach slots but not the statics `create-mockup.tsx:106-120` documents; the other 29 wrappers carry them. → `Object.assign(Impl, slots, { info: Base.info, regions: Base.regions })`.
- **R-9. A non-tuple `camera` prop produces NaN orbit limits** (`mockup-canvas.tsx:139-140` → `stage.ts:40-42` → `tumble-controls.tsx:59-62`): `CanvasProps['camera']` admits a `THREE.Camera`, `Vector3`, or scalar, all of which make `position[0]` undefined → NaN min/max distance, breaking the zoom clamp. → Normalize or fall back to the default distance.
- **R-10. Console-warning spam from dependencies in every consumer app:** `three-bvh-csg@0.0.18` passes the deprecated `maxLeafSize` to `three-mesh-bvh@0.9` (via `devices/details.tsx:324`), and drei's float/tumble path triggers `THREE.Clock` deprecation warnings. Observed on every 3D page load during live testing. → Pin/patch versions or file upstream; a clean console is part of the first-run impression.

### Low

- **R-11.** Grouped disposal effects (e.g. `galaxy.tsx:194-203`, `laptop.tsx:750-758`) dispose all sibling geometries when any one dep changes — a GPU re-upload hiccup, not a leak; per-geometry effects are precise for free.
- **R-12.** `cutGeometry`'s catch path leaks the merged cutter geometry (`details.tsx:320-330`).
- **R-13.** `MockupStatics` typed as `Partial` even when always present (`create-mockup.tsx:134`), forcing `?.` on `GalaxyMockup.info`.
- **R-14.** `CANVAS_KEYS` membership is type-checked but completeness is not (`create-mockup.tsx:34-47`) — an omitted canvas prop silently routes to the mesh. Add an exhaustiveness check.
- **R-15.** `SCREEN_MASK_INSET`, `DeviceScreen`, and `SurfaceProvider` aren't exported from the public entry, yet `createMockup`/`createSlots` are advertised as the "build your own mockup" path — which therefore has no way to render a live surface (`index.ts:39-46`).
- **R-16.** Zoom readout baseline never resets when the `camera` prop changes (`mockup-canvas.tsx:169-175`).
- **R-17.** `warnDev` dereferences `process.env` unguarded (`slots.tsx:71-75`) — a `ReferenceError` in bundler-less browser ESM.
- **R-18.** `TVSet`'s props type is `TVProps`, the one deviation from the `XProps` convention (`objects/tv/tv.tsx:19`).

---

## 4. Docs site — app code (`apps/docs`)

Verified from live testing: all 18 page checks returned HTTP 200 (404 probe correctly 404s), zero page errors, zero failed requests, zero horizontal overflow at both viewports, exactly one `h1` per page, `title`/`description` present everywhere, and all images have alt text.

### High

- **S-1. No `not-found.tsx`** — confirmed live: an unknown URL renders Next's unstyled default 404 with no site chrome and no way back. There are five root layouts and none has one; `notFound()` from `app/docs/[[...slug]]/page.tsx:26` lands there too. → Add `not-found.tsx` under `app/(site)/` and `app/docs/` at minimum.
- **S-2. No social/SEO metadata** — confirmed live: `ogTags: []` and `canonical: null` on every page; no `metadataBase`, no `sitemap.ts`, no `robots.ts` (the ~50 API pages are reachable only through client-rendered grids, so a sitemap materially helps discovery; `/harness` and `/embedded` rely on meta robots alone). → Add `metadataBase` + OG/Twitter blocks (one static device-render OG image goes a long way), `app/sitemap.ts` driven by `source.getPages()`, and `app/robots.ts`.
- **S-3. No WebGL/error fallback** — no `error.tsx` anywhere; if WebGL is unavailable the dynamic scene loaders either throw uncaught or leave "Warming up the GPU…" forever (`hero-carousel.tsx:8-12`). The pre-rendered `public/thumbs/*.png` are a ready-made static fallback. → Feature-check `WebGLRenderingContext` and add an error boundary around scenes.
- **S-4. The whole 3D stack is statically imported into every docs page** (`components/mdx.tsx:6-7` → `object-examples.tsx`, `mockup-explorer/registry.ts`): `getMDXComponents` always includes `ObjectDemo`/`MockupExplorer`, and `object-examples.tsx` builds all ~40 demo trees at module scope — so pure-text guide pages ship and parse three.js too. The site pages do this correctly with `dynamic(..., { ssr: false })`. This also falsifies the `wrangler.jsonc:12-16` comment that three.js "never enter[s] the Worker". → Wrap both in thin dynamic shells and move the registry behind the boundary.

### Medium

- **S-5. `MockupExplorer` crashes on an unknown `component` name** (`mockup-explorer/index.tsx:354-355` vs `412`): `EXPLORERS[component]` feeds hooks before the `if (!spec) return null` guard can run — a typo in MDX throws a client TypeError. → Guard before the hooks; render an "unknown component" row like `ObjectDemo` does.
- **S-6. The explorer violates the library's own slot contract on every device page** (`mockup-explorer/index.tsx:576-581`): it renders bare children *and* an explicit slot for every region including the primary, so each device API page logs the library's "Both bare children and an explicit Screen slot were given — the explicit slot wins" warning (observed 8× during live testing) and renders dead bare children. → Skip the primary region in the `slots.map`, or drop the bare child.
- **S-7. Extractor scripts fail silently** (`scripts/extract-demo-sources.mjs:51-56,74-91`, `extract-prop-tables.mjs:97`): format drift truncates/drops demo sources or empties a prop table with a success exit; nothing verifies the committed `lib/*.generated.ts` match sources. → Exit non-zero on empty results; add a CI `git diff --exit-code` check.

### Low

- **S-8.** Inspector open/close initial state causes a visible collapse on phone first paint (`mockup-explorer/index.tsx:357-358,396-398`); the 860 px stack breakpoint is duplicated between TS and CSS (`index.tsx:197` vs `docs.css:897`).
- **S-9.** Device/object counts are hardcoded on the home page ("Twenty-two", `22`, `23` — `app/(site)/page.tsx:16,33-42`) and the carousel duplicates a 22-entry device list parallel to `lib/mockup-catalog.mjs`; both drift silently when a mockup is added. → Derive from the catalog.
- **S-10.** The two control systems disagree on `resolution` bounds (200–1600 step 2 vs 240–2560 step 8 — `mockup-explorer/index.tsx:733-738` vs `preview-controls.tsx:395-404`).
- **S-11.** Dead code: `components/code-block.tsx` is imported nowhere; ~150 lines of dead site CSS (`globals.css:962-1010,1018-1023,1040-1122`: `.prose`, `.viewport-hint`, `.codeblock`, `.table-scroll`, `.props-table`).
- **S-12.** Footer year uses `new Date()` in a statically-rendered layout (freezes at build time — `app/(site)/layout.tsx:37`); no security headers configured (only relevant if framing beyond `/embedded` should be restricted); the PR-comment workflow posts a new comment per build event (noisy) and matches check names regardless of emitting app.
- **S-13.** Docs sidebar thumbs declare `width="120" height="62"` against square 360×360 PNGs (`docs-sidebar.tsx:58`); thumbs could be WebP for ~50–70 % savings.

---

## 5. Documentation content

Verified accurate (no action): meta.json navigation (no orphans, no dead entries), frontmatter on all 58 routed pages, prop tables on all 13 spot-checked API pages (names, types, defaults, colorway ids, resolutions, canvas defaults), all 46 `<ObjectDemo>` ids and 33 `<MockupExplorer>` names, all MDX sample imports against real exports, LICENSE (valid MIT, correct holder/year).

### High

- **D-1. Landing page contradicts the library's core design** (`content/docs/index.mdx:32-33`): "Pointer events, state, and scrolling keep working" — screens are decorative by design; `screen-content.mdx:62-85` and the code say pointer events *never* reach the screen. → Reword to "state, effects, and media playback keep running".
- **D-2. Broken internal links that 404 on the live site:** `/docs/api/galaxy` (in `family-reference/iphone.mdx:14` + 4 generated iPhone pages) and `/docs/api/galaxy-watch` (in `family-reference/apple-watch.mdx:17` + generated page). Device pages are per-variant; those slugs don't exist. → Fix the family-reference sources and re-run `npm run docs:variants`.

### Medium

- **D-3. Stale device count and enumeration** (`index.mdx:13-18` "Seventeen devices", omitting 5 shipped variants; `devices.mdx:100` "17 devices" directly under a 22-row table). → Update counts; re-measure the "whole library" bundle row.
- **D-4. Docs claim exports that don't exist:** `PHONE`, `IPHONE`, `LAPTOP`, `TABLET`, `MONITOR` (`devices.mdx:111-114`, `roadmap.mdx:7`) — real names are `GALAXY_VARIANTS`/`IPHONE_VARIANTS`/…/`STUDIO_DISPLAY`, and they live on the `area-3d-mockups/core` subpath, which neither page mentions. → Correct names and import path.
- **D-5. API overview drift** (`api/index.mdx:8-18`): names a nonexistent `Phone` component (it's `Galaxy`), omits `FoldMockup`/`FlipMockup`, `TumbleControls`, and 16 of 23 object mockups. → Regenerate the lists from `index.ts`.
- **D-6. Roadmap promises already-shipped things** (`roadmap.mdx:9-10`): TVs, foldables, and packaging all exist. → Prune to genuinely future items.
- **D-7. Undocumented public API:** `TumbleControls`, `LEDText`, `createMockup`, `createSlot(s)`/`collectSlots`/`resolveSurface`, `findColorway`, `SCREEN_REGIONS` have no docs page — while `index.ts:39-40` advertises the slot machinery as the "build your own mockup" path. → Add an advanced guide (pairs with R-15).
- **D-8. No troubleshooting/FAQ page** — the common WebGL pitfalls (SSR, duplicate `three` copies) are scattered across index/nextjs pages.

### Low

- **D-9.** `objects.mdx:18` book thickness 30 mm vs spec's 27 mm; TV row omits the 32–98″ `size` range documented on its own page.
- **D-10.** S26 Ultra resolution off-by-one across family reference vs pipeline (832 vs 833) — same root cause as C-6.
- **D-11.** `ARCHITECTURE.md:73` names drei `OrbitControls`; the binding ships its own `TumbleControls`. `mockup-canvas.tsx:66` JSDoc still says `<Phone>`.
- **D-12.** README: "typechecks both workspaces" (three); "no workflow file here" (two exist now); the manual-publish section never mentions the tag-triggered trusted-publishing flow in `release.yml` — two publishing procedures that will drift.
- **D-13.** `customPanelScale` documented as "exported" without noting it's only on the `/core` subpath (`api/custom-panel.mdx:49-50`).

---

## 6. Home page, demos, and mobile UX (live testing)

What works well — confirmed at 375×812 with touch emulation: no horizontal overflow on any page; the nav collapses to a burger + full-width sheet with Escape/outside-tap/resize handling; the carousel renders a single WebGL canvas with correct tap vs drag discrimination (the stationary-pointermove tap bug is fixed and documented in the code); the demos page mounts only ~1 canvas at a time via `LazyScene`; docs tables fit; the explorer stacks below 860 px; quick-start code blocks scroll horizontally inside their own boxes.

Remaining issues, mostly consolidated from the sections above:

- **U-1 (Medium). Touch targets below 32 px are pervasive:** carousel swatches 24×24, explorer swatches 19×19, demo-page controls ~23 px tall, copy buttons 24×24, header text links 35–47×23 (measured live; Apple HIG asks 44 pt, WCAG 2.5.8 asks 24 px minimum with spacing). The nav/arrow buttons are a correct 40–44 px. → Enlarge hit areas via padding, keeping visual size.
- **U-2 (Medium). Carousel a11y:** auto-advances every 6 s with no pause control (WCAG 2.2.2) and no `aria-live` on the readout, so the sr-only "Show {device}" buttons produce no announced feedback. The hint says "Drag the device to spin it" — there's no keyboard path to the same action (the arrow buttons do cover browsing).
- **U-3 (Low).** Demos page heading structure jumps h1 → h3 (`demo-scenes.tsx:96`).
- **U-4 (Low).** `--text-low` (#6b7280 on #08090c ≈ 4.1:1) is used for sub-13 px text (install line, stat labels, carousel hint) — below AA. The explorer's `.mx-readout` white-on-accent is ≈2:1 on dark theme (`docs.css:732-748`) — the worst single contrast failure.
- **U-5 (Low).** Console noise on every 3D page (see R-10) — visible to any developer evaluating the library via DevTools, which is exactly this site's audience.

---

## 7. Accessibility (cross-cutting)

- **A-1 (High). No `prefers-reduced-motion` handling anywhere** — verified zero matches across the repo. Library: `autoRotate` (`tumble-controls.tsx:167-180`), `float` (`float-group.tsx:24-31`), LED marquee (`led-text.tsx:110-128`). Site: carousel auto-advance, infinite CSS animations (`pulse`/`bob`/`eq` in `globals.css`, `screens.css`). WCAG 2.3.3 matters more than usual for a library whose host pages will autoplay motion. → Gate defaults on `matchMedia('(prefers-reduced-motion: reduce)')` in the library, add the CSS media block on the site, and pause the carousel timer.
- **A-2 (Medium). The canvas has no keyboard or AT path in the library:** orbit/zoom are pointer/wheel-only, the `<canvas>` carries no role/label/tabindex, and the zoom readout is a plain div (`mockup-canvas.tsx:291-303`). → Arrow-key rotation + `+`/`-` zoom on a focusable wrapper; `role="status"` on the readout.
- **A-3 (Medium).** `examples-menu.tsx:22-49` declares `role="menu"`/`menuitem` without any of the menu keyboard contract — either implement it or downgrade to a disclosure.
- **A-4 (Low).** Explorer view-switcher/code tabs/segmented controls expose active state only via `data-on` styling — add `aria-pressed`/tabs semantics. Copy-button "copied" state resets only on `mouseleave`.

---

## 8. Testing and CI

- **T-1 (High). There are no tests.** No runner, no config, no `*.test.*` anywhere — confirmed in both packages and the app. The existing guards (typecheck, `api.type-test.tsx`, the visual harness, `devices:check`) are good but blind to exactly the bug classes found above: C-1/C-2/C-4 (registry/metrics invariants), C-6 (aspect drift — `devices:check` compares two derivatives of the same rect), R-8 (statics dropped by shell wrappers). Highest-value order:
  1. Registry invariants: every `MockupKind` resolves ≥1 region with defaults; metrics keys match `*_REGIONS` names; metrics defaults match component defaults (catches C-2, C-3, C-4).
  2. `collectSlots`/`resolveSurface` routing rules (pure, zero-dependency, the silent-failure surface).
  3. Modelled-rect aspect vs documented panel grid for every device (catches C-6/D-10).
  4. `railColor` golden values under default color management (catches C-1).
  5. `framedShadowY` continuity across `open` (catches C-7); `createMockup` statics presence on all exported wrappers (catches R-8); clip-path snapshot strings; script output shapes (`build-catalog.mjs`, `sync-device-table.mjs`).
- **T-2 (Medium). No CI runs tests or checks on PRs.** Deploys are Workers Builds (dashboard-side) and `release.yml` typechecks only on tags. A minimal `ci.yml` running typecheck + (future) unit tests + the generated-file drift check (S-7) on every PR would catch most of this report's classes before merge. The visual check needs a dev server and SwiftShader — it already aggregates failures and is reproducible, so it can join CI later.
- **T-3 (Low).** The documented visual-check flow fails out of the box: ARCHITECTURE.md says it "requires the docs dev server (`npm run dev`)", but `npm run dev` serves on port 3000 while `visual-check.mjs:32` defaults to 3311 — a plain `npm run dev` + `npm run visual` gets 33 × `ERR_CONNECTION_REFUSED` (reproduced during this audit; it works with `--base=http://localhost:3000`). → Default `BASE` to 3000, or document `PORT=3311`. *(Visual-check pass/fail results from this audit are noted in the method section.)*

---

## 9. Repo hygiene

- **H-1 (Medium).** Missing: `CONTRIBUTING.md`, `CHANGELOG.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `.github/ISSUE_TEMPLATE/`, PR template. For a repo soliciting an npm audience, CONTRIBUTING + CHANGELOG matter most (the release workflow implies versioned releases with nothing recording what changed).
- **H-2 (Medium).** Root README has no screenshot or GIF — for a visual library, one hero render is worth most of the prose — no badges, and **no link to the hosted docs site** anywhere in the repo (the Worker is deployed but a GitHub visitor has no URL to it; no canonical production URL appears in any config or metadata either, which also blocks S-2's `metadataBase`).
- **H-3 (Low).** `assets/temp.txt` ("Logo files will be added to this folder.") is a stale placeholder — delete. `agent-outputs/` (this report) may warrant a `.gitignore` entry or a README note if it becomes a recurring drop zone.

---

## Suggested sequencing

1. **Pre-publish correctness pass (P0):** C-1, C-2, R-1, R-2, R-5, D-1…D-5 — then publish v0.1.0 and attach the trusted publisher.
2. **First-impressions pass (P1):** S-1…S-4, A-1, U-1, R-10, H-2 (docs link + screenshot + badges).
3. **Foundations (P1):** T-1 (vitest + the five test families above), T-2 (minimal PR CI), H-1.
4. **Backlog (P2):** everything marked Low, C-9 naming alignments, D-7 advanced guide, S-11 dead-code sweep.

---

*Method note: browser findings come from scripted Chromium runs against `next dev` (SwiftShader WebGL, desktop 1440×900 and mobile 375×812 + touch), capturing console output, request failures, DOM measurements, and full-page screenshots; package findings were verified by executing the built `dist` artifacts; registry status checked against `registry.npmjs.org` on the audit date. The repo's own visual regression check was run as part of this audit: **36/36 cases unchanged** against `apps/docs/visual-baselines/` (after working around the port mismatch in T-3), so all geometry findings above are API/measurement issues, not rendering regressions.*
