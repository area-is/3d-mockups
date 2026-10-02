# Contributing

Thanks for taking an interest. This is a small project, so the process is
light, but the checks below are what keep the mockups trustworthy, and they
are all runnable locally.

## Getting set up

Node 22+ (which is what CI runs). npm workspaces, no other package manager.

```bash
npm install        # installs every workspace and builds the package
npm run dev        # package in watch mode + docs at http://localhost:3000
```

## Before you open a pull request

```bash
npm run typecheck     # both workspaces
npm run test          # core unit tests (no DOM, no WebGL)
npm run devices:check # the numbers the docs quote: device and object tables, model counts
npm run size:check    # what importing each mockup costs, against the docs' table
npm run docs:examples # every code example in the READMEs and docs, typechecked
npm run visual        # visual regression (needs `npm run dev` running)
npm run bench         # performance budgets (needs `npm run dev` running)
```

CI runs the first five plus a docs build on every PR, then the benchmark's
budgets against that build (its numbers land in the job summary). The visual
check needs a dev server and takes several minutes on SwiftShader, so it stays
local. Run it whenever you touch geometry.

## Where code goes

The layering rule is in [ARCHITECTURE.md](ARCHITECTURE.md) and it is the thing
most worth reading before a first change:

> If it can be written against **three.js and the DOM** without importing
> React, it lives in `src/core`.

In practice that means **numbers live in specs, not in scene components**. A
rect computed inline in JSX cannot be measured and cannot be unit-tested, and
it silently drops the object out of `mockupInfo`, the generated catalog and the
docs tables.

Adding a device or object is five pieces, all documented under
[“Adding a device or object”](ARCHITECTURE.md#adding-a-device-or-object).

## The checks, and what each one actually catches

They overlap less than they look:

- **`npm run test`**: registry invariants and pure math. Catches a metrics
  resolver that disagrees with the component it describes: a default that does
  not match the component's default, a region declared but never measured, a
  colour derived in the wrong space. The visual check is blind to all of these,
  because render and report read the same numbers.
- **`npm run visual`**: geometry. Renders every mockup on `/harness` with each
  live region filled in a flat labelled colour and diffs against
  `apps/docs/visual-baselines/`. A surface that moves, resizes or starts
  bleeding through the body fails. Update baselines with
  `npm run visual -- --update`, and **review the diffs in
  `apps/docs/.visual-diffs/` before you do**. A baseline update is a claim that
  the new picture is the correct one.
- **`npm run bench`**: behaviour that costs battery rather than pixels. Loads
  the home page and a docs page in Chromium with every draw call, WebGL
  context, layout shift and long frame counted, and fails when a mockup at rest
  draws at all, an off-screen or hidden carousel keeps drawing or advancing,
  the home page shifts (CLS), or a docs page holds more live contexts than
  `LazyScene` allows. Timings are reported but never enforced: under
  SwiftShader they only compare run to run on one machine (`--gpu` for real
  numbers, `--mobile` and `--cpu=4` for a phone-class profile). Both scripts
  take `CHROMIUM_EXECUTABLE` to use a Chromium other than Playwright's own.
- **`npm run devices:check`**: the numbers the docs quote. In
  `docs/devices.mdx`, the Portrait/Landscape columns against what actually
  renders (`devices:sync` rewrites those), and the modelled aspect against the
  hand-maintained Panel column, which is the one comparison syncing cannot
  satisfy. In `docs/objects.mdx`, the default sizes and the slots table, both
  from `mockupInfo`. Then the model counts in the READMEs, and whether
  `dist/catalog.json` matches the catalog code. It reads the built package, so
  run `npm run build` first.
- **`npm run size:check`**: what importing each mockup really costs an app,
  bundled from the built `dist/` with the peers left out. It fails when an
  import grows more than 10% past the table in `docs/devices.mdx`; if the
  growth is intended, `npm run size:write` rewrites the table.
- **`npm run docs:examples`**: every `tsx` and `ts` block in the READMEs and
  the docs, compiled with strict TypeScript against the built package. An
  excerpt is completed only as far as an excerpt needs - library exports and
  React hooks imported, your own components (`<YourApp />`) declared - so a
  rejected prop, a wrong export name or a misspelt region fails with the docs
  file and line. A block that must not compile opts out with `nocheck` in its
  fence.

## Deprecating and removing a device

Every device variant has a row in `DEVICE_LINEUP`
(`packages/react/src/core/lifecycle.ts`): its product line and the month it was
announced. When a newer model joins a line, nothing else changes. The newest
month in a line is *current*, and every older model in it becomes
*superseded*. The docs sidebar and gallery fold superseded models away under
"older models", and their pages point to the newer model. They stay fully
supported.

Removing a model breaks code that names its `variant`, so it takes two
releases:

1. **Deprecate it.** Add `deprecated: { since, removeIn }` to its row. `since`
   is the next release. `removeIn` is a later minor or major (`0.4.0`), never a
   patch. List it under *Deprecated* in the changelog's Unreleased section.
   From then on the model logs one development warning naming its replacement
   when it renders, its docs page carries a warning, and its sidebar tile is
   marked. `npm run test` refuses two kinds of deprecation:
   - a model nothing newer has superseded, because there would be nothing to
     switch to;
   - a family's default variant. Change the default first, as its own
     breaking change, so a removal never moves a default without saying so.
2. **Remove it in the `removeIn` release.** Once the package version reaches
   `removeIn`, `npm run test` fails until the model is gone, so the release PR
   cannot go green while the model is still there. To remove it:
   - delete its spec from `*_VARIANTS`, its colorways, its `DEVICE_LINEUP` row,
     and its entry in `apps/docs/lib/mockup-catalog.mjs`;
   - delete its docs page and thumbnail;
   - search the repo for the variant id and the page id. Examples, the
     explorer registry, the home-page carousel, the family reference, the
     device table and `sync-device-table.mjs` all name variants;
   - add a `REMOVED_DEVICES` entry naming the replacement, so `variant="…"`
     fails with a pointer to it rather than a TypeError;
   - add a redirect from its docs URL to the replacement's page in
     `apps/docs/next.config.ts`;
   - list it under *Changed (breaking)*.

When to deprecate is a judgement call, not a rule. A reasonable default is to
deprecate a model once a second newer generation of its line ships (the
17 Pro when a 19 Pro arrives) and to remove it no sooner than the following
minor.

## Style

Match the surrounding code. The one habit worth calling out: comments here
explain *why*, usually by naming the thing that went wrong without them. If you
fix a subtle bug, leave the reason behind in a comment. Several of the
trickiest invariants in this repo are only obvious once someone has broken them.

## Commits and pull requests

Describe what changed and why. If a change moves a baseline or a documented
number, say so in the message; those are the diffs a reviewer most needs
pointed out.

## Peer dependency ranges

The peers are bounded to what has been tested: React 19, react-three-fiber 9,
drei 10, and a `three` range whose upper bound is the newest release checked.
The screen bridge leans on drei's `<Html>` internals, so an untested major can
break it while installing cleanly. To widen a range, install the new version,
run the full check list above (the visual check especially), then raise the
bound in `packages/react/package.json` and say so in the changelog.

[`three-compat.yml`](.github/workflows/three-compat.yml) typechecks, tests and
builds the package against the oldest `three` the range allows and against the
newest release, on every change to the package and once a week - and warns when
the newest release is outside the range, which is the cue to do the above.

## Releasing

`packages/react` is the only package that ships, as [`react-3d-mockups`]. It is
the whole library: the core layer is a directory inside it (`src/core`), built
as a second entry point and published as the `react-3d-mockups/core` subpath, so
the tarball is one self-contained install.

A release is a version bump landing on `main`; everything after that is
automatic. To cut one, either run **Prepare a release** from the Actions tab
with `patch`, `minor`, `major` or an exact version, which opens the PR for you,
or do the same locally and open the PR yourself:

```bash
npm run release -- minor   # or patch / major / 0.3.0
```

That bumps `packages/react/package.json` and the lockfile, and renames the
changelog's `## Unreleased` section to `## 0.3.0 - <date>` under a fresh empty
one. It refuses an empty Unreleased section, so write the entries as you go.
Merge the PR and [`release.yml`](.github/workflows/release.yml) typechecks,
tests and builds, publishes the version to npm, then tags the merge commit
`v0.3.0` and writes a GitHub Release from that changelog section. A prerelease
version (`1.0.0-rc.1`) goes to the `next` dist-tag, not `latest`.

It decides what to do by asking the registry, not by trusting the event: a
version already on npm is not republished and an existing tag is not recreated.
A run that failed halfway is finished by re-running it, and a commit that
touches the manifest without changing the version does nothing. To rehearse
without spending a version number, run **Release react-3d-mockups** from the
Actions tab: a dispatched run defaults to a dry run that only packs, and it
works from any branch. Only `main` is ever published.

Publishing uses npm Trusted Publishing: GitHub mints an OIDC token, npm
exchanges it for a short-lived publish credential bound to this repository and
workflow file, and the tarball gets a provenance attestation linking it to the
commit. There is no long-lived `NPM_TOKEN`. The one exception is the very
first publish, because npm can only attach a trusted publisher to a package
that already exists. That bootstrap, a temporary token and then
`npm trust github ...`, is spelled out at the top of `release.yml`.

[`react-3d-mockups`]: https://www.npmjs.com/package/react-3d-mockups
