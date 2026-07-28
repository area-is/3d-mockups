# area-3d-mockups

GPU-accelerated **3D device mockups for React** — drop any content onto the screen of a
3D phone and it renders live: real DOM on the glass, vector crisp at any angle, videos
playing, iframes loading. The mockups are decorative — you rotate and zoom them, and the
hardware masks the screen pixel for pixel.

Built on [three.js](https://threejs.org) and
[react-three-fiber](https://github.com/pmndrs/react-three-fiber). The starter device is a
procedurally generated Galaxy-style phone — no 3D asset files to load. Beyond devices,
the same live-surface API covers everyday objects — books, magazines,
brochures, cards, packaging (product box, mailer box, shopping bag),
custom-size panels and boxes at any millimeter dimensions, posters, vinyl
records, out-of-home formats (billboard, bus shelter, double-sided DOOH totem,
A-frame, roll-up banner, storefront), a 65" TV, and wrap-ready vehicles (transit
bus, cargo van, 53 ft semi trailer). 2D (CSS/SVG) mockups sharing the same API are
on the roadmap.

```tsx
'use client'

import { GalaxyMockup } from 'area-3d-mockups'

export function Hero() {
  return (
    <GalaxyMockup autoRotate float>
      <YourApp /> {/* any React node, iframe, video… */}
    </GalaxyMockup>
  )
}
```

## Monorepo layout

| Path | npm name | What it is |
| --- | --- | --- |
| [`packages/core`](packages/core) | `@area-3d-mockups/core` | Framework-agnostic core: device/object specs, geometry math, screen & stage behaviors (depends on `three` only) |
| [`packages/react`](packages/react) | `area-3d-mockups` | The React binding — the publishable npm package (bundles the core) |
| [`apps/docs`](apps/docs) | — | Next.js docs & live demos site |

The project is structured so more framework bindings can be added later —
`@area-3d-mockups/svelte` (Threlte) and `@area-3d-mockups/vue` (TresJS) are the planned next
ones — all sharing the same core. See [ARCHITECTURE.md](ARCHITECTURE.md) for the
layering rule and the step-by-step guide to adding a binding.

## Development

Uses npm workspaces. Node 18.18+ required.

```bash
npm install        # installs all workspaces + builds the package (prepare hook)
npm run dev        # package in watch mode + docs at http://localhost:3000
npm run build      # builds the package, then the docs site
npm run typecheck  # typechecks both workspaces
```

## Publishing the package

```bash
cd packages/react
npm publish
```

The `prepare` script builds `dist/` automatically before publish. The core is bundled
into `area-3d-mockups`, so it does not need to be published separately.

## License

[MIT](LICENSE) © subwaymatch
