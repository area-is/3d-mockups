# Deploying the docs site

Two halves: how the site is built and deployed at all (Workers Builds, the
OpenNext indirections, the bundle size), and the URL it answers on - a path on
the `area.is` apex, which is the one deployment change with enough moving parts
to be worth writing down.

## Building and deploying

The docs site runs on Cloudflare Workers through the
[OpenNext](https://opennext.js.org/cloudflare) adapter. Config lives in
`wrangler.jsonc` and `open-next.config.ts`.

```bash
npm run preview:docs   # build + serve the real Worker locally (workerd, not next dev)
npm run deploy:docs    # build + deploy from your machine
```

`npm run dev` is still the fastest loop for day-to-day work; `preview:docs` is what to
run before trusting a deploy, since it executes the app in the Workers runtime rather
than Node.

### CI/CD

**Deploys** are [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/),
configured in the Cloudflare dashboard rather than in this repo. Cloudflare clones,
builds and deploys on push, under an API token it generates and holds itself, so there
are no deploy credentials in GitHub and no deploy workflow here.

The workflows that *are* here do everything else: `ci.yml` typechecks, tests and builds
every pull request, `release.yml` publishes to npm when a version bump lands on `main`,
and `cloudflare-build-pr-comments.yml` reports each Workers build back onto its PR.

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
  `buildCommand`. Without it the adapter would fall back to its own default of
  `npm run build` and recurse into itself.
- **`wrangler deploy` re-executes itself as `opennextjs-cloudflare deploy`.** It detects
  an OpenNext project from a `next.config.*`, an `open-next.config.*` and an installed
  `@opennextjs/cloudflare`, then hands off. That hand-off is the seam where cache
  population would happen if `open-next.config.ts` ever gains an incremental cache.

`wrangler versions upload` has no such hand-off: it uploads the built Worker directly.
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

# Serving the site at `area.is/react-3d-mockups`

The site is served at a **path on the apex** rather than on its own hostname.
That is two changes that have to land together, and the code half is done:
this file records what is in place, and what a human still has to do in the
Cloudflare dashboard.

## Why it is not just a routing change

A hostname binding gives the Worker an entire origin: every request to
`3d-mockups.area.is` reaches it, so the app can serve from `/` and emit
root-absolute URLs (`/docs`, `/_next/static/…`, `/thumbs/ipad-pro-13.png`) that
all land back on itself.

Under `area.is/react-3d-mockups` the Worker sees **only** requests beginning
with that prefix. Every root-absolute URL the app emits now points at the
apex's root - somebody else's site - and 404s. So the routing change has to be
matched by teaching the app that it lives under a prefix, which in Next.js is
`basePath`.

## Part 1 - Cloudflare

### A Custom Domain cannot do this

Workers **Custom Domains** bind a whole hostname and have no path component -
which is what `3d-mockups.area.is` is. A path prefix must be a **Route**:

| | Custom Domain | Route |
| --- | --- | --- |
| Path | whole hostname only | pattern with a path |
| DNS | creates its own record | needs an existing **proxied** record |
| Certificate | issued for you | uses the zone's |

A route is only consulted for requests Cloudflare is already terminating:
"all domains and subdomains must have a DNS record to be proxied on Cloudflare
and used to invoke a Worker."

### The apex record — ✅ done

`area.is` had no `A`, `AAAA` or `CNAME` at all (`NODATA`), and `www.area.is`
did not exist. The zone was already on Cloudflare, so there was nothing to
migrate - there was simply nothing at the apex to attach a route to.

It now carries a proxied placeholder:

| Type | Name | IPv6 address | Proxy |
| --- | --- | --- | --- |
| `AAAA` | `@` | `100::` | Proxied (orange) |

`100::` is the RFC 6666 discard prefix, the conventional Cloudflare black
hole. With it in place `area.is/react-3d-mockups*` reaches this Worker and
every other apex path errors, there being no origin behind it yet - which is
the correct state for an apex that is not live. **Swap it for the real record
when the Next.js apex app ships; keep it proxied.** Grey-cloud it and this
Worker stops being reachable at that path.

### The routes — ✅ done, in `wrangler.jsonc`

```jsonc
"routes": [
  { "pattern": "area.is/react-3d-mockups", "zone_name": "area.is" },
  { "pattern": "area.is/react-3d-mockups/*", "zone_name": "area.is" }
]
```

Kept in the config rather than clicked into the dashboard, so the binding is
reviewable and redeployable. Two patterns, not one `…/react-3d-mockups*`: a
single trailing wildcard would also swallow `/react-3d-mockups-anything-else`.
Add `www.area.is/react-3d-mockups…` as well if `www` is ever served rather
than redirected.

### Precedence over whatever serves the apex

Routes match most-specific-first - Cloudflare's own example is that
`example.com/hello/*` takes precedence over `example.com/*` - so these win
over a broader `area.is/*`. The same holds against a Custom Domain, which is a
whole-hostname binding with no path: the route is matched first, and the
route's Worker can even `fetch(request)` through to the Worker on the Custom
Domain. A Worker route likewise wins over a Cloudflare Pages project on the
same hostname.

None of that is automatic in the other direction. **Whoever sets up the apex
app must leave this route alone and keep the apex record proxied.** A Custom
Domain on `area.is` is fine; deleting the route, or grey-clouding the apex, is
what breaks this.

### Where the apex app is hosted decides whether this works at all

| The apex app runs on | Apex DNS | Does the route fire? |
| --- | --- | --- |
| Cloudflare Workers (OpenNext, like this one) | its Custom Domain, proxied | **Yes** |
| Cloudflare Pages | proxied, managed by Pages | **Yes** |
| Vercel / Netlify / any external origin | must be **proxied** (orange) | **Only if proxied.** Grey-cloud is what those platforms recommend, and it bypasses Workers entirely - the route never runs |

That last row is the trap. If `area.is` ends up on Vercel with a DNS-only
record, this whole arrangement is inert, and the alternative is to let the
apex app own the path instead - a Next.js `rewrite` from
`/react-3d-mockups/:path*` to this Worker's own hostname. That works from any
host, at the cost of a proxy hop and of making this site's availability depend
on the apex app's.

## Part 2 - the app — ✅ done

### One prefix, one place

`lib/base-path.mjs` holds `BASE_PATH` and an `asset()` helper. Plain `.mjs`
with no imports, because `next.config.ts`, the build scripts and the client
components all read it and have no other module format in common. It is a
literal rather than an environment variable on purpose: `basePath` is inlined
into the client bundle at build time and cannot be switched at runtime, so a
variable would only create the illusion that it could be.

`next.config.ts` feeds it to Next as `basePath`, which rewrites everything
Next itself emits: `next/link` hrefs, router navigations, `/_next/*` assets,
route handlers.

Two things it was worth checking by hand, and both are fine. `usePathname()`
returns the path **without** the prefix (app-router resolves it as
`hasBasePath(p) ? removeBasePath(p) : p`), so the `/docs/api/<id>` comparisons
in `components/mockup-breadcrumb.tsx` and `lib/sidebar-tree.ts` keep working
untouched. And `metadataBase` keeps its own path when it resolves a relative
one - Next joins them - so the social card comes out at
`https://area.is/react-3d-mockups/og.png`.

### What `basePath` does not reach

Anything the repo hard-codes as a root-absolute string is invisible to it.
Every one of these now goes through `asset()`:

1. **Sidebar thumbnails.** `thumb` in `lib/mockup-catalog.mjs`, rendered by
   `components/docs-sidebar.tsx` as a plain `<img>`. (`href` in the same
   catalog must **not** be prefixed - it is fed to `<Link>`, which adds the
   prefix itself, and `sidebar-tree.ts` compares against it unprefixed.)
2. **Every `<img>` in the artwork** - thirteen of them across
   `image-demo.tsx`, `surface-art.tsx`, `carton-art.tsx`, `package-art.tsx`,
   `device-apps.tsx`, `book-jacket.tsx` and `record-sleeve.tsx`. None goes
   through `next/image`, so none of them was prefixed for us.
3. **Search.** `fumadocs-core`'s fetch client defaults its endpoint to
   `join(BASE_PATH, '/api/search')`, where that `BASE_PATH` comes from
   `import.meta.env.BASE_URL` - a Vite variable, undefined under Next - so it
   resolved to a bare `/api/search`. `app/docs/layout.tsx` now points it
   explicitly.
4. **`robots.txt`.** Prefixed *inside the file*, because a robots.txt path is
   resolved against the origin root and never against `basePath`. Note that
   `app/robots.ts` is **not** the file that governs this site: crawlers only
   read `https://area.is/robots.txt`, which this Worker never sees. It is kept
   as the written record of the rules, and because it is correct to paste
   straight into the apex's own robots.txt.
5. **The screenshot scripts.** `visual-check.mjs` and `generate-thumbs.mjs`
   request `${BASE}/harness?…`; their default base now carries the prefix, so
   `npm run visual` and `npm run thumbs` work with no extra flags. Both still
   take `--base` for anything else. (`generate-thumbs.mjs` writes to
   `public/thumbs/` through its own constant, so the prefixed `thumb` value
   does not move its output.)

`lib/site.ts` carries the production URL as its fallback, prefix included, so
a plain checkout builds correct canonicals with nothing set in the dashboard.
`NEXT_PUBLIC_SITE_URL` still overrides it, and still has to be a **build**
variable.

### What the build looks like afterwards

`.open-next/assets` is now nested under `react-3d-mockups/`, so Workers Assets
serves `/react-3d-mockups/_next/static/…`, `/art/…` and `/thumbs/…` straight
off the edge under exactly the paths the routes match.

## Part 3 - what is left to do

Steps 1 and 2 are the two ✅ sections above. The rest needs a human with
Cloudflare access (and so does the apex stand-in, below):

3. **Deploy** with the routes in place and the old Custom Domain **still
   there**. Both URLs now serve; the old one is the fallback.
4. **Verify** `https://area.is/react-3d-mockups` in a clean browser profile.
   Watch the network panel for 404s on `/_next/*`, `/thumbs/*` and
   `/api/search` - those are the three a missed prefix shows up as. Workers &
   Pages → `area-3d-mockups-docs` → Settings → Domains & Routes shows the
   Custom Domain and the new routes side by side, so you can confirm the
   routes registered before touching anything.
5. **Remove the Custom Domain** from that same screen. Its DNS row is locked
   and managed by the Custom Domain, so it disappears on its own - do not try
   to delete it from the DNS tab.

   No redirect, and no placeholder record behind it: this project has no users
   on `3d-mockups.area.is`, so there is nothing to carry across. If that ever
   stops being true, the redirect needs a **proxied** record left on the old
   hostname, because a Redirect Rule only runs if Cloudflare terminates the
   request.

The `*.workers.dev` URLs serve the site too and are toggled separately, if you
eventually want exactly one address.

## The apex: `area.is/`, `/robots.txt`, `/sitemap.xml`

Until the apex app ships, nothing answered on the apex but this Worker's
prefix. `https://area.is/`, `/robots.txt` and `/sitemap.xml` all went to the
`100::` placeholder above and came back as Cloudflare **522**s - and that
reaches the docs too. A crawler reads robots.txt only at the host root, a
robots.txt that keeps failing with a 5xx can be read as "do not crawl this
host" (docs included), and the `Sitemap:` line in `app/robots.ts` is only ever
served at `/react-3d-mockups/robots.txt`, a path no crawler reads rules from.

[`infra/apex`](../../infra/apex) is the stand-in: a dependency-free Worker
routed at `area.is/*` that answers

| Path | Response |
| --- | --- |
| `/` | `302` to `/react-3d-mockups` (temporary on purpose - the apex will be its own site) |
| `/robots.txt` | the rules from `app/robots.ts`, prefixed, plus `Sitemap: https://area.is/react-3d-mockups/sitemap.xml` |
| `/sitemap.xml` | a sitemap index pointing at the docs' sitemap |
| anything else | a plain `404` page linking to the docs (not a redirect: that would be a soft 404) |

The docs Worker's routes are more specific, so they keep winning for
everything under `/react-3d-mockups`. The apex record stays exactly as it is,
proxied; the route is what makes it answer.

To deploy it (a human with Cloudflare access, once):

```bash
cd infra/apex
npx wrangler deploy          # needs a Cloudflare login with access to the area.is zone
curl -I https://area.is/robots.txt   # 200, text/plain
```

When the real apex app ships, delete this Worker (Workers & Pages →
`area-apex` → Settings → Delete) and carry the robots.txt lines over to the
new app - `app/robots.ts` stays the written record of them.

## Things that change quietly

- **Origin.** The site now shares `https://area.is` with everything else on
  the apex: same cookie jar, same `localStorage`, same service-worker scope. If
  the apex app sets cookies at the apex, this app sends them on every request.
- **Search Console.** `area.is/react-3d-mockups` is a URL-prefix property, not
  a domain property.
