# @area-mockups/core

The framework-agnostic heart of [area-mockups](https://github.com/subwaymatch/area-mockups):
device and object specs, geometry math, and the live-screen & stage behaviors shared by
every framework binding. Depends on [three.js](https://threejs.org) only — never on React,
Svelte or Vue.

Most users should install a framework binding instead:

| Framework | Package |
| --- | --- |
| React | [`area-mockups`](../react) |
| Svelte | planned — see [ARCHITECTURE.md](../../ARCHITECTURE.md) |
| Vue | planned — see [ARCHITECTURE.md](../../ARCHITECTURE.md) |

## What lives here

- **Specs** — physical dimensions, display panels, camera layouts for every device
  (Galaxy and iPhone families, tablets, watch, laptop, monitor, fold) and object
  (books, packaging, out-of-home formats, vehicles…). Pure data, usable from any
  renderer including the planned 2D (CSS/SVG) ones.
- **Geometry math** — `roundedRectShape` and friends, producing plain three.js values.
- **Screen behaviors** — the CSS-pixel math that maps a world-unit display onto a live
  DOM element, the wrapper styles, and backface culling.
- **Stage** — camera/orbit/shadow defaults, the procedural studio light rig, the idle
  float animation, and the overlay-button chrome (zoom, fullscreen).

## How bindings consume it

The React binding (`area-mockups`) bundles this package into its published `dist`, so
`@area-mockups/core` currently does not need to be installed or published separately.
Future bindings do the same until the core graduates to a standalone npm release.

See [ARCHITECTURE.md](../../ARCHITECTURE.md) for the full binding contract.
