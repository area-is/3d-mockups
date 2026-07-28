# @area-3d-mockups/core

The framework-agnostic heart of [area-3d-mockups](https://github.com/area-is/3d-mockups):
device and object specs, geometry math, and the live-screen & stage behaviors the
binding is built on. Depends on [three.js](https://threejs.org) only, never on a UI
framework.

You almost certainly want the React package instead:
[`area-3d-mockups`](../react).

## What lives here

- **Specs** - physical dimensions, display panels, camera layouts for every device
  (Galaxy and iPhone families, tablets, watch, laptop, monitor, fold) and object
  (books, packaging, out-of-home formats, vehicles…). Pure data, usable from any
  renderer including the planned 2D (CSS/SVG) ones.
- **Geometry math** - `roundedRectShape` and friends, producing plain three.js values.
- **Screen behaviors** - the CSS-pixel math that maps a world-unit display onto a live
  DOM element, the wrapper styles, and backface culling.
- **Stage** - camera/orbit/shadow defaults, the procedural studio light rig, the idle
  float animation, and the overlay-button chrome (zoom, fullscreen).

## How the binding consumes it

The React binding (`area-3d-mockups`) bundles this package into its published `dist`, so
`@area-3d-mockups/core` does not need to be installed or published separately.

See [ARCHITECTURE.md](../../ARCHITECTURE.md) for the full binding contract.
