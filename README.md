<p align="center">
  <img src="assets/logo-stack-green.svg" alt="react-3d-mockups" width="128" height="128" />
</p>

<h1 align="center">react-3d-mockups</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/react-3d-mockups"><img src="https://img.shields.io/npm/v/react-3d-mockups.svg" alt="npm version" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT license" /></a>
  <a href="https://github.com/area-is/react-3d-mockups/actions/workflows/ci.yml"><img src="https://github.com/area-is/react-3d-mockups/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
</p>

<p align="center">
  <img src="assets/hero.png" alt="A 3D iPhone mockup with a live music-player UI on its screen, flanked by two more devices" width="820" />
</p>

GPU-accelerated **3D device mockups for React** - drop any content onto the screen of a
3D phone and it renders live: real DOM on the glass, vector crisp at any angle, videos
playing, iframes loading. The mockups are decorative - you rotate and zoom them, and the
hardware masks the screen pixel for pixel.

Built on [three.js](https://threejs.org) and
[react-three-fiber](https://github.com/pmndrs/react-three-fiber). Every model is
generated procedurally at runtime - **no 3D asset files to load or host**. The device
lineup is 33 strong: the Galaxy S26 line, two foldable generations (Z Fold 7 and
Z Flip 7, the wide Z Fold 8, the Z Fold 8 Ultra and Z Flip 8) and Apple's
foldable iPhone Duo, the iPhone 17 family and the iPhone 18 Pros, MacBook Air,
Pro and Neo, the iPad and Galaxy Tab families, three Apple Watches (Series 11,
Series 12 and the titanium Ultra 4) and three Galaxy Watches (8, 9 and the
titanium Ultra 2) on full wristbands, and a 27" desktop display. Beyond devices,
the same live-surface API covers everyday objects - books, magazines,
brochures, cards, packaging (product box, mailer box, gable-top milk carton,
shopping bag),
custom-size panels and boxes at any millimeter dimensions, posters, vinyl
records, out-of-home formats (billboard, bus shelter, double-sided DOOH totem,
A-frame, roll-up banner, storefront), a 65" TV, and wrap-ready vehicles (transit
bus, cargo van, 53 ft semi trailer).

```tsx
'use client'

import { GalaxyMockup } from 'react-3d-mockups'

export function Hero() {
  return (
    <GalaxyMockup autoRotate float>
      <YourApp /> {/* any React node, iframe, video… */}
    </GalaxyMockup>
  )
}
```

**[Documentation and live demos →](https://area.is/react-3d-mockups)**
Every device and object has its own page with a live prop explorer.

## Monorepo layout

| Path | npm name | What it is |
| --- | --- | --- |
| [`packages/react`](packages/react) | `react-3d-mockups` | The published npm package - the whole library |
| [`apps/docs`](apps/docs) | - | Next.js docs & live demos site |

Inside the package, `src/core` holds the specs, geometry math and screen/stage
behavior, depends on `three` and never imports React; the rest of `src` is the
react-three-fiber layer that renders it. Keeping the numbers out of the components is
what makes each mockup measurable and unit-testable without a renderer. See
[ARCHITECTURE.md](ARCHITECTURE.md) for the layering rule.

## Development

Uses npm workspaces. Node 22+ required (wrangler, concurrently and vitest all
floor there). This is the toolchain for working *on* the repo - the published
package declares no `engines` and runs in the browser.

```bash
npm install        # installs all workspaces + builds the package (prepare hook)
npm run dev        # package in watch mode + docs at http://localhost:3000
npm run build      # builds the package, then the docs site as a Worker bundle
npm run typecheck  # typechecks both workspaces
npm run test       # core unit tests (no DOM, no WebGL)
npm run visual     # visual regression vs baselines (needs `npm run dev` running)
npm run bench      # performance behaviour vs budgets (needs a running site)
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for what each check catches; they overlap
less than they look.

## Releasing and deploying

- **The package** is published to npm from CI, through npm Trusted Publishing,
  whenever a version bump is merged to `main`; the tag and GitHub Release follow
  automatically. The steps are in [CONTRIBUTING.md](CONTRIBUTING.md#releasing).
- **The docs site** runs on Cloudflare Workers (OpenNext), deployed by Workers
  Builds on push, and is served at a path on the apex. Everything about building,
  deploying and routing it - including the stand-in Worker for the `area.is` apex -
  is in [apps/docs/DEPLOYMENT.md](apps/docs/DEPLOYMENT.md).

## License

[MIT](LICENSE) © [Ye Joo Park](https://github.com/subwaymatch)
