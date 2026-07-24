# Architecture

area-mockups is structured as a **framework-agnostic core plus thin framework
bindings**, so the same devices, objects and behaviors can ship for React today and
Svelte, Vue or plain three.js later — without forking the project per framework.

```
                    ┌─────────────────────────────┐
                    │      @area-mockups/core     │   specs · geometry math ·
                    │   (depends on three only)   │   screen behaviors · stage
                    └──────────────┬──────────────┘
              ┌────────────────────┼────────────────────┐
      ┌───────┴────────┐   ┌───────┴────────┐   ┌───────┴────────┐
      │  area-mockups  │   │ @area-mockups/ │   │ @area-mockups/ │
      │     (React,    │   │     svelte     │   │      vue       │
      │  r3f + drei)   │   │(Threlte, later)│   │ (TresJS, later)│
      └────────────────┘   └────────────────┘   └────────────────┘
```

## Packages

| Path | npm name | What it is |
| --- | --- | --- |
| [`packages/core`](packages/core) | `@area-mockups/core` | Framework-agnostic specs, geometry math, screen & stage behaviors. Depends on `three` only. |
| [`packages/react`](packages/react) | `area-mockups` | The React binding: react-three-fiber scene components, canvas, drei `<Html>` screen bridge. Bundles the core. |
| `packages/svelte` | `@area-mockups/svelte` | Planned — Svelte binding on [Threlte](https://threlte.xyz). |
| `packages/vue` | `@area-mockups/vue` | Planned — Vue binding on [TresJS](https://tresjs.org). |
| [`apps/docs`](apps/docs) | — | Next.js docs & live demos site. |

## The layering rule

> If it can be written against **three.js and the DOM** without importing a UI
> framework, it lives in `@area-mockups/core`. Only the declarative scene graph and
> the framework's HTML-portal wiring live in a binding.

What that puts in the core today:

- **Specs** (`src/devices/*/dimensions.ts`, `src/objects/*/dimensions.ts`) — physical
  dimensions, display panels, camera layouts, per-variant data for every device and
  object. Pure data with zero imports; also intended to drive the planned 2D
  (CSS/SVG) renderers.
- **Regions & framing** (`src/regions.ts` + each spec's `*_REGIONS` / `*_FRAMING`) —
  every live surface a device/object exposes, declared as pure data next to its
  dimensions. Region names are the cross-binding API contract: React derives its
  compound slots from them (`front` → `<AFrameSign.Front>`), Svelte/Vue bindings map
  the same names onto native slots (`slot="front"`, `#front`), and docs can be
  generated from them. The first region is the primary one — bare children render
  there. `*_FRAMING` is the per-object stage math (camera pose, float intensity, the
  ground line under the object) that wrappers used to hand-code; `framedShadowY`
  turns it into the contact-shadow plane's Y in any binding.
- **Geometry math** (`src/geometry`) — e.g. `roundedRectShape`, returning plain
  three.js values any renderer can consume.
- **Screen behaviors** (`src/screen`) — everything that makes the live DOM screen
  work, minus the framework portal itself:
  - `screenSurfaceStyle`, `screenCssHeight`, `screenCornerRadiusCss`,
    `screenDistanceFactor` — the CSS-pixel math mapping a world-unit display onto DOM;
  - `SCREEN_LAYER_CSS` / `screenLayerClass` — the compositor-layer promotion and
    touch-action rules the bridge element needs;
  - `createScreenDragHandoff` — the tap-vs-drag gesture handoff to the orbit controls;
  - `createBackfaceCuller` — hides the DOM plane when it faces away from the camera.
- **Stage** (`src/stage`) — the shared look and feel of every mockup canvas:
  camera pose, orbit constraints and damping, contact-shadow settings, the
  procedural studio light rig (`STUDIO_LIGHTFORMERS`), the idle float animation
  (`floatPose`), touch-action policy, zoom math (`orbitZoomBy`), fullscreen helpers
  and the overlay-button chrome.

What stays in a binding (React's versions in parentheses):

- The **canvas/stage component** wiring core config into the renderer
  (`mockup-canvas.tsx` over r3f `<Canvas>`, drei `Environment`/`ContactShadows`/`OrbitControls`).
- The **HTML screen bridge**: portaling framework content onto the display glass
  (`screen/device-screen.tsx` over drei `<Html transform>`), calling the core's
  drag handoff and backface culler.
- The **device/object scene components** — declarative meshes built from core specs
  (`devices/*/*.tsx`, `objects/*/*.tsx`), plus per-device DOM overlays (punch hole,
  notch) computed from the same specs.
- The **slot machinery** (`slots.tsx`): the compound-slot components generated from
  core region lists (`createSlots`), the children scan that routes slot elements to
  regions and bare children to the primary region (`collectSlots`), and the
  per-surface prop merge (`resolveSurface`).
- The **one-liner mockup wrappers** (`*-mockup.tsx`) — each a `createMockup(...)`
  call (`create-mockup.tsx`) wiring the scene component to its core framing. The
  factory owns the stage-prop/object-prop split, so wrappers carry no per-prop
  forwarding and objects can grow props without wrapper edits.

## The binding contract

A new binding (say `@area-mockups/svelte`) implements four pieces, in order:

1. **Stage** — a `MockupCanvas` equivalent: create the renderer's canvas with
   `DEFAULT_CAMERA_POSITION`/`DEFAULT_CAMERA_FOV`, apply `canvasTouchAction`, add
   lights from `STAGE_AMBIENT_LIGHT`/`STAGE_KEY_LIGHT`, build the environment from
   `STUDIO_LIGHTFORMERS`, contact shadows from `CONTACT_SHADOW`, orbit controls from
   `ORBIT` + `orbitDistanceRange(cameraDistance(...))`, and overlay buttons from
   `OVERLAY_BUTTON_STYLE` + the icon paths (`orbitZoomBy` and `toggleFullscreen`
   already do the work).
2. **Screen** — a `DeviceScreen` equivalent over the renderer's HTML bridge
   (Threlte's `<HTML transform>`, Tres's `CientosHtml`): wrapper class from
   `screenLayerClass`, inject `SCREEN_LAYER_CSS`, scale by `screenDistanceFactor`,
   style the content div with `screenSurfaceStyle`, forward `pointerdown` to
   `createScreenDragHandoff`'s handler after stopping propagation, and run
   `createBackfaceCuller` once per frame.
3. **Devices/objects** — port scene components one at a time from
   `packages/react/src/devices` and `objects`. All numbers come from core specs, so a
   port is a mechanical JSX → framework-template translation; visual parity means
   using the same specs, materials and transforms. Map each spec's `*_REGIONS` onto
   the framework's native slot mechanism (Svelte `<svelte:fragment slot="front">`,
   Vue `#front`) with the same names and the same bare-children-→-primary shorthand.
4. **Wrappers** — the one-liner mockups (`PhoneMockup`…). All per-object stage math
   comes from the core `*_FRAMING` specs (camera via `framing.camera`, shadow via
   `framedShadowY`, float via `framing.floatIntensity`) — a binding writes one
   generic factory like React's `create-mockup.tsx`, not per-object arithmetic.

The float animation is `floatPose` sampled once per frame — run it *before* the orbit
controls and HTML bridge update (r3f frame priority -2) so the DOM screen never
trails the WebGL body.

drei → equivalents cheat sheet:

| React (drei/r3f) | Svelte (Threlte) | Vue (TresJS) |
| --- | --- | --- |
| `<Canvas>` | `<Canvas>` (`@threlte/core`) | `<TresCanvas>` |
| `<Html transform occlude>` | `<HTML transform>` (`@threlte/extras`) | `<Html transform>` (cientos) |
| `<Environment>` + `<Lightformer>` | `<Environment>` / custom env scene | `<Environment>` (cientos) |
| `<ContactShadows>` | `<ContactShadows>` (`@threlte/extras`) | `<ContactShadows>` (cientos) |
| `<OrbitControls>` | `<OrbitControls>` (`@threlte/extras`) | `<OrbitControls>` (cientos) |
| `<RoundedBox>` | `<RoundedBoxGeometry>` or `roundedRectShape` + extrude | cientos `RoundedBox` |
| `useFrame` | `useTask` | `useRenderLoop` |

## How the core is consumed

The core is a normal publishable package (`packages/core`, built with tsup), but the
React binding **bundles it from source** into its own `dist` (see the esbuild `alias`
in `packages/react/tsup.config.ts` and the `paths` mapping in its `tsconfig.json`).
That keeps three properties:

- `npm install area-mockups` stays a single self-contained install;
- workspace builds never depend on build order (`prepare` scripts can run in any order);
- the core is stateless data + pure helpers, so two bindings each bundling their own
  copy can safely coexist on one page.

New bindings should start the same way (alias the core source, bundle it). When
several bindings are published, `@area-mockups/core` graduates to a standalone npm
release and the bindings switch their alias for a real dependency — a build-config
change only, no API change.

## Adding a binding, step by step

1. `mkdir packages/svelte` with a `package.json` named `@area-mockups/svelte`
   (workspaces pick `packages/*` up automatically), a tsconfig extending
   `tsconfig.base.json` with the `@area-mockups/core` → `../core/src/index.ts` paths
   mapping, and a build aliasing the core like `packages/react/tsup.config.ts` does.
2. Implement the stage and screen pieces of the binding contract above.
3. Port `Phone` first — it exercises specs, screen, overlays and orientation; verify
   against the React rendering side by side in the docs app.
4. Port remaining devices/objects and wrappers incrementally; each is independent.
5. Add root scripts (`build`, `typecheck`) for the new workspace, docs examples, and
   a README modeled on `packages/react/README.md`.

## Direction

- **Deeper core**: per-device geometry/material builders (imperative
  `buildPhoneChassis(spec)`-style factories) can migrate from binding scene
  components into `core/src/devices/*` over time, shrinking each binding further.
  Extract on second use — when the second binding lands, whatever it would copy
  from React is what moves down. (Framing and region registries already made this
  move; geometry is next.)
- **2D renderers**: the same specs are designed to drive CSS/SVG mockups that share
  the public API (`PhoneMockup` etc., including the compound slots) without WebGL.
