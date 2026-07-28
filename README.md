<p align="center">
  <img src="assets/area-a-dual-slant-green.svg" alt="area-3d-mockups" width="128" height="128" />
</p>

# area-3d-mockups

GPU-accelerated **3D device mockups for React** - drop any content onto the screen of a
3D phone and it renders live: real DOM on the glass, vector crisp at any angle, videos
playing, iframes loading. The mockups are decorative - you rotate and zoom them, and the
hardware masks the screen pixel for pixel.

Built on [three.js](https://threejs.org) and
[react-three-fiber](https://github.com/pmndrs/react-three-fiber). The starter device is a
procedurally generated Galaxy-style phone - no 3D asset files to load. Beyond devices,
the same live-surface API covers everyday objects - books, magazines,
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
| [`packages/react`](packages/react) | `area-3d-mockups` | The React binding - the publishable npm package (bundles the core) |
| [`apps/docs`](apps/docs) | - | Next.js docs & live demos site |

Keeping the specs, geometry and stage behavior out of the React layer is what makes
each mockup measurable and testable on its own, and it leaves room for other
renderers later. See [ARCHITECTURE.md](ARCHITECTURE.md) for the layering rule and the
binding contract.

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

## Deploying the docs

The docs site runs on Cloudflare Workers through the
[OpenNext](https://opennext.js.org/cloudflare) adapter. Config lives in
`apps/docs/wrangler.jsonc` and `apps/docs/open-next.config.ts`.

```bash
npm run preview:docs   # build + serve the real Worker locally (workerd, not next dev)
npm run deploy:docs    # build + deploy from your machine
```

`npm run dev` is still the fastest loop for day-to-day work; `preview:docs` is what to
run before trusting a deploy, since it executes the app in the Workers runtime rather
than Node.

CI/CD is `.github/workflows/deploy-docs.yml`: pushes to `main` deploy, pull requests
upload a preview version and print its URL. Both need two repository secrets,
`CLOUDFLARE_API_TOKEN` (an API token with the *Edit Cloudflare Workers* template) and
`CLOUDFLARE_ACCOUNT_ID`.

One sizing note: the Worker bundle is about 3.9 MB gzipped, which is over the
[3 MB Workers Free ceiling](https://developers.cloudflare.com/workers/platform/limits/#worker-size)
and well under the 10 MB paid one, so deploys need a Workers Paid account. Shiki's
bundled grammars are most of that weight, and the docs only ever fence `tsx`, `ts` and
`bash`, so restricting `rehypeCodeOptions.langs` in `source.config.ts` is the lever if
the free plan matters more than fencing arbitrary languages.

## License

[MIT](LICENSE) © subwaymatch
