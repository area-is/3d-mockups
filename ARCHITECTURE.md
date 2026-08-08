# Architecture

area-3d-mockups is one npm package for React, built in **two layers**: a
renderer-agnostic core that describes devices, objects and behaviors as data and
math, and the React components that render it. The layers are directories in one
package, not separate packages - the split is about what may import React, not
about shipping.

```
              ┌─────────────────────────────┐
              │      src/core (no React)    │   specs · geometry math ·
              │    (depends on three only)  │   screen behaviors · stage
              └──────────────┬──────────────┘
                  ┌──────────┴──────────┐
                  │  src/*.tsx (React)  │
                  │  (r3f + drei)       │
                  └─────────────────────┘
```

## Layout

| Path | What it is |
| --- | --- |
| [`packages/react`](packages/react) | `area-3d-mockups` - the published package, the whole library. |
| `packages/react/src/core` | Specs, geometry math, screen & stage behaviors. Imports `three` at most, never React. Published as the `area-3d-mockups/core` subpath. |
| `packages/react/src` (the rest) | react-three-fiber scene components, canvas, drei `<Html>` screen bridge. |
| [`apps/docs`](apps/docs) | Next.js docs & live demos site. |

## The layering rule

> If it can be written against **three.js and the DOM** without importing React,
> it lives in `src/core`. Only the declarative scene graph and the HTML-portal
> wiring live in the components.

This is the rule that keeps the numbers measurable: everything in `src/core` is
unit-testable with no DOM, no WebGL and no renderer, which is what
`npm test` exercises. It is enforced by review rather than by a package
boundary - nothing stops a `src/core` file importing React except this rule, so
say so in review when a change crosses it.

What that puts in the core today:

- **Specs** (`src/core/devices/*/dimensions.ts`, `src/core/objects/*/dimensions.ts`) - physical
  dimensions, display panels, camera layouts, per-variant data for every device and
  object. Pure data with zero imports.
- **Regions & framing** (`src/core/regions.ts` + each spec's `*_REGIONS` / `*_FRAMING`) -
  every live surface a device/object exposes, declared as pure data next to its
  dimensions. Region names are the API contract: the compound slots are derived
  from them (`front` → `<AFrameSign.Front>`) and the docs tables are generated
  from them. The first region is the primary one - bare children render there.
  `*_FRAMING` is the per-object stage math (camera pose, float intensity, the
  ground line under the object) that wrappers used to hand-code; `framedShadowY`
  turns it into the contact-shadow plane's Y.
- **Geometry math** (`src/core/geometry`) - `roundedRectShape`, `gearShape`, the
  CSS `clip-path` builders and `sweptStrapGeometry` (a crowned watch-strap
  section swept along a worn-wrist oval), all returning plain three.js values
  any renderer can consume.
- **Screen behaviors** (`src/core/screen`) - everything that makes the live DOM screen
  work, minus the framework portal itself:
  - `screenSurfaceStyle`, `screenCssHeight`, `screenCornerRadiusCss`,
    `screenDistanceFactor` - the CSS-pixel math mapping a world-unit display onto DOM;
  - `SCREEN_LAYER_CLASS` / `SCREEN_LAYER_CSS` - the compositor-layer promotion the
    bridge element needs;
  - `createBackfaceCuller` - hides the DOM plane when it faces away from the camera.

  Screens are decorative by design: their DOM always composites UNDER the canvas so
  the depth buffer masks it per-pixel, which also means nothing has to deal with
  pointer input, hit-testing or gesture handoff on a screen. The canvas owns every
  gesture.
- **Stage** (`src/core/stage`) - the shared look and feel of every mockup canvas:
  camera pose, orbit constraints and damping, contact-shadow settings, the
  procedural studio light rig (`STUDIO_LIGHTFORMERS`), the idle float animation
  (`floatPose`), touch-action policy, zoom math (`orbitZoomBy`), fullscreen helpers
  and the overlay-button chrome.

What stays in the React layer (note that `src/core/screen` and `src/screen`
are different directories - the core half is the math, the React half is the
drei bridge; same for `devices`/`objects`, whose specs and scene components
mirror each other):

- The **canvas/stage component** wiring core config into the renderer
  (`mockup-canvas.tsx` over r3f `<Canvas>`, drei `Environment`/`ContactShadows`,
  and `TumbleControls` over the core `TumbleOrbit`).
- The **HTML screen bridge**: portaling framework content onto the display glass
  (`screen/device-screen.tsx` over drei `<Html transform occlude="blending">`),
  calling the core's backface culler and confining drei's z-index band to the
  mockup's own stacking context.
- The **device/object scene components** - declarative meshes built from core specs
  (`devices/*/*.tsx`, `objects/*/*.tsx`), plus per-device DOM overlays (punch hole,
  notch) computed from the same specs.
- The **slot machinery** (`slots.tsx`): the compound-slot components generated from
  core region lists (`createSlots`), the children scan that routes slot elements to
  regions and bare children to the primary region (`collectSlots`), and the
  per-surface prop merge (`resolveSurface`).
- The **one-liner mockup wrappers** (`*-mockup.tsx`) - each a `createMockup(...)`
  call (`create-mockup.tsx`) wiring the scene component to its core framing. The
  factory owns the stage-prop/object-prop split, so wrappers carry no per-prop
  forwarding and objects can grow props without wrapper edits.

## How the components use the core

Four pieces, and the list doubles as a map of which core export each React file
is built on:

1. **Stage** - a `MockupCanvas` equivalent: create the renderer's canvas with
   `DEFAULT_CAMERA_POSITION`/`DEFAULT_CAMERA_FOV`, apply `canvasTouchAction`, add
   lights from `STAGE_AMBIENT_LIGHT`/`STAGE_KEY_LIGHT`, build the environment from
   `STUDIO_LIGHTFORMERS`, contact shadows from `CONTACT_SHADOW`, orbit controls from
   `ORBIT` + `orbitDistanceRange(cameraDistance(...))`, and overlay buttons from
   `OVERLAY_BUTTON_STYLE` + the icon paths (`orbitZoomBy` and `toggleFullscreen`
   already do the work).
2. **Screen** - a `DeviceScreen` equivalent over the renderer's HTML bridge
   (drei's `<Html transform>` in React): wrapper class
   `SCREEN_LAYER_CLASS`, inject `SCREEN_LAYER_CSS`, scale by `screenDistanceFactor`,
   style the content div with `screenSurfaceStyle`, put the bridge in the renderer's
   depth-blending mode with the screen silhouette as its occluder geometry, and run
   `createBackfaceCuller` once per frame. The canvas keeps `pointer-events: auto`
   throughout - screens never take input.
3. **Devices/objects** - the scene components in `packages/react/src/devices` and
   `objects`. All numbers come from core specs, so a scene component is a mechanical
   translation of spec data into the renderer's scene graph; visual parity means
   using the same specs, materials and transforms. Each spec's `*_REGIONS` maps onto
   the slot mechanism with the same names and the same
   bare-children-→-primary shorthand.
4. **Wrappers** - the one-liner mockups (`GalaxyMockup`…). All per-object stage math
   comes from the core `*_FRAMING` specs (camera via `framing.camera`, shadow via
   `framedShadowY`, float via `framing.floatIntensity`) - one generic factory
   (`create-mockup.tsx`) does it, not per-object arithmetic.

The float animation is `floatPose` sampled once per frame - run it *before* the orbit
controls and HTML bridge update (r3f frame priority -2) so the DOM screen never
trails the WebGL body.

## How the core is built

`src/core` is not a separate package. It is a directory inside `area-3d-mockups`
with its own entry point (`src/core/index.ts`), built as a **second tsup entry**
so it can be imported two ways:

- `import { GalaxyMockup } from 'area-3d-mockups'` - the components, which
  re-export the core symbols they expose;
- `import { GALAXY_VARIANTS } from 'area-3d-mockups/core'` - the specs alone,
  with no components pulled in.

That second entry makes the subpath's **RSC boundary** part of the package
contract. The core carries no `'use client'` directive, so a server component
can import a spec for layout math; a client directive there would turn every
exported constant into a client reference the server cannot read. `banner` is a
whole-build esbuild option, so the package builds its two entries as *two* tsup
configs and stamps the directive on the components entry only - read the
comments in `packages/react/tsup.config.ts` before merging them back together.

The library was previously split across two workspace packages
(`@area-3d-mockups/core` + `area-3d-mockups`), with the core bundled into the
binding at build time by an esbuild alias. Only one package was ever published,
so the split bought an enforced import boundary at the cost of two manifests,
two tsconfigs, two build configs, and an alias whose whole job was to undo the
split. The scope is one React package, so the boundary is now the directory and
the rule above.

## Adding a device or object

Five pieces, all of them in `src/core` except the last two. The first four are
what make an object measurable and documentable without anyone re-deriving
numbers by hand - skip one and the
object silently drops out of `mockupInfo`, the generated catalog and the docs
tables.

1. **`dimensions.ts`** - the physical spec as pure data, with a documented world
   scale. If the object takes a millimetre `size` prop, express the scale as a
   `*Layout(size)` / `*Scale(size)` function (see `productBoxLayout`,
   `customBoxScale`) rather than computing it in the scene component. Everything
   downstream - metrics, the catalog, the docs tables - is a consumer of that
   function.
2. **`*_REGIONS`** - every live surface, in slot order. The first is the primary
   one (bare children land there).
3. **`*_FRAMING`** - camera pose, float intensity, the ground line.
4. **`*_METRICS`** - `mmPerUnit` plus a `regions(props)` resolver returning each
   region's rect in world units and its default `resolution`. Then add the row to
   `REGISTRY` and the props entry to `MockupPropsMap` in `src/core/metrics.ts`.

   > **The geometry must live here, not in the scene component.** A rect computed
   > inline in JSX cannot be measured and cannot be unit-tested. This is the one
   > rule that keeps
   > `mockupInfo` trustworthy - and the reason `van`, `bus` and `storefront` were
   > initially absent from the registry. All three now declare their layout in
   > core (`BUS_FULL_SIDE`, `VAN_FULL_WRAP`, `storefrontLayout`), which is the
   > shape to copy for anything with a derived façade or wrap.

5. **The scene component** (`packages/react/src/…`) - reads its numbers from the
   spec, never the reverse.
6. **The wrapper** - one `createMockup({ kind, regions, metrics, object, framing, slots })`
   call. Passing `metrics` directly rather than looking it up by `kind` is
   deliberate: a registry lookup would make every mockup reference every spec, so
   importing one component would pull in all of them.

A region that resolves to an **array** of rects means exactly one thing: a
single slot painted onto several distinct surfaces, like the van's nose and
tail licence plates. One slot, one design, several places it lands.

The array's length is a count of *surfaces*, not of sizes. The van's two plates
are the same 6 × 12 in rect and it is still an array of two, because a caller
measuring the object should see that there are two of them.

There is deliberately no way to say "this region takes N slot children in
document order." A `repeats` flag used to allow it, for the brochure's panels.
Positional slots make a surface's identity depend on where it sits in the JSX,
so a conditionally rendered panel silently shifts every panel after it onto the
wrong surface - and nothing catches it, because the render is still valid. Give
each surface a name instead. If a future object has surfaces that genuinely
vary in count at runtime, that is worth reopening; nothing so far has.

### Verifying it

`npm run visual` renders every mockup on the `/harness` route and diffs the
frames against `apps/docs/visual-baselines/`. The cases use the harness's
`regions=1` probe, which fills each live region with its own flat labelled
colour - so it is specifically a *geometry* check: a surface that changes size,
moves, or starts bleeding through the body changes a coloured rect and fails.

`npm run devices:check` guards the other half. The Portrait/Landscape columns
of `docs/devices.mdx` are the only part of that table the library can derive,
and they drift silently: a screen's CSS height comes from the *modelled*
world-unit rect's aspect, so when that aspect disagrees with the panel's pixel
aspect the rendered grid stops matching the documented one. The visual check
cannot see this - render and report share the same rect - so the numeric check
is the one that catches it. `npm run devices:sync` rewrites those two columns;
every other column is hardware fact and is left alone.

Run the visual check before and after any change that touches region geometry,
and especially when moving math out of a scene component into a spec. WebGL runs on
SwiftShader, so frames are reproducible without a GPU; repeat runs of an
unchanged build come back bit-identical. Requires the docs dev server
(`npm run dev`), and `npm run visual -- --update` rewrites the baselines once
you have reviewed the diffs in `apps/docs/.visual-diffs/`.

## Direction

- **Deeper core**: per-device geometry/material builders (imperative
  `buildPhoneChassis(spec)`-style factories) can migrate from the scene
  components into `src/core/devices/*` over time. The win is not portability -
  it is that a `useMemo` body in a `.tsx` file cannot be unit-tested, and a
  factory in `src/core` can. (Framing and region registries already made this
  move; geometry is next.)

The scope is deliberately one React package: no other framework bindings, and no
2D (CSS/SVG) renderer. Both were once on this list, and both are what the old
two-package split existed to serve.
