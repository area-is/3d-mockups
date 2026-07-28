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
npm run build      # builds the package, then the docs site as a Worker bundle
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

### CI/CD

CI/CD is [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/),
configured in the Cloudflare dashboard rather than in this repo. Cloudflare clones,
builds and deploys on push, under an API token it generates and holds itself, so there
are no deploy credentials in GitHub and no workflow file here.

Settings live under **Workers & Pages → area-3d-mockups-docs → Settings → Build**:

| Setting | Value |
| --- | --- |
| Root directory | `apps/docs` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Non-production branch deploy command | `npx wrangler versions upload` |
| Git branch | `main` |

Two things that are easy to get wrong:

- **The Worker's name in the dashboard has to be `area-3d-mockups-docs`**, matching
  `name` in `apps/docs/wrangler.jsonc`. A mismatch fails the build rather than
  deploying to the wrong place.
- **Root directory is `apps/docs`, not the repo root.** That is where the Wrangler
  config lives, which is what Cloudflare keys off. It works with npm workspaces
  because `npm ci` walks up to the root lockfile, installs every workspace, and runs
  the `prepare` hooks that build `packages/react/dist` before the docs build reads it.

Those are the stock Workers Builds commands, unedited. They land on OpenNext through
two indirections worth knowing about:

- **`npm run build` in `apps/docs` is `opennextjs-cloudflare build`, not `next build`.**
  Wrangler needs `.open-next/worker.js`, which a plain Next build never produces. The
  Next build survives as `build:next`, and `open-next.config.ts` sets that as OpenNext's
  `buildCommand` — without it the adapter would fall back to its own default of
  `npm run build` and recurse into itself.
- **`wrangler deploy` re-executes itself as `opennextjs-cloudflare deploy`.** It detects
  an OpenNext project from a `next.config.*`, an `open-next.config.*` and an installed
  `@opennextjs/cloudflare`, then hands off. That hand-off is the seam where cache
  population would happen if `open-next.config.ts` ever gains an incremental cache.

`wrangler versions upload` has no such hand-off — it uploads the built Worker directly.
That is equivalent today, because the incremental cache is `dummy` and there is nothing
to populate. If that changes, the non-production command has to become an explicit
`opennextjs-cloudflare upload` rather than the default.

### Worker size

The bundle is about 3.9 MB gzipped, over the
[3 MB Workers Free ceiling](https://developers.cloudflare.com/workers/platform/limits/#worker-size)
and well under the 10 MB paid one, so deploys need a Workers Paid account.

Shiki is the weight: around 400 TextMate grammars end up inlined in the Worker. They
get there because Next externalises `shiki`, so the whole package is traced into the
server bundle and OpenNext's esbuild pass inlines its full-bundle import map. Nothing
ever calls it at runtime, though. Every docs route is prerendered, `/api/search` is
Orama, and `components/code-block.tsx` is a plain `<pre><code>`, so the highlighted
HTML is baked in at build time and the grammars are dead code.

Two things that look like fixes but are not, both measured at 4035 KiB gzipped
against a 4036 KiB baseline:

- `rehypeCodeOptions.langs` in `source.config.ts`. It controls which grammars the
  highlighter *loads*, not which ones are reachable from the module graph.
- `outputFileTracingExcludes` in `next.config.ts`. OpenNext traces `@shikijs` in
  regardless.

What would work is shiki's [fine-grained bundle](https://shiki.style/guide/bundles):
`fumadocs-core/mdx-plugins/rehype-code.core` accepts a `ShikiFactory`, so a highlighter
built from `shiki/core` plus explicit `@shikijs/langs/{tsx,ts,bash}` imports never
references the full-bundle map that pulls the other ~397 in.

## License

[MIT](LICENSE) © subwaymatch
