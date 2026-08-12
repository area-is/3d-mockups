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
npm run devices:check # the derived half of the device table, and aspect drift
npm run visual        # visual regression (needs `npm run dev` running)
```

CI runs the first three plus a docs build on every PR. The visual check needs a
browser and a dev server, so it stays local. Run it whenever you touch
geometry.

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
- **`npm run devices:check`**: the numbers in `docs/devices.mdx`. Two halves:
  the Portrait/Landscape columns against what actually renders (`devices:sync`
  rewrites those), and the modelled aspect against the hand-maintained Panel
  column, which is the one comparison syncing cannot satisfy.

## Style

Match the surrounding code. The one habit worth calling out: comments here
explain *why*, usually by naming the thing that went wrong without them. If you
fix a subtle bug, leave the reason behind in a comment. Several of the
trickiest invariants in this repo are only obvious once someone has broken them.

## Commits and pull requests

Describe what changed and why. If a change moves a baseline or a documented
number, say so in the message; those are the diffs a reviewer most needs
pointed out.

## Releasing

`packages/react` is the only package that ships, as [`area-3d-mockups`]. It is
the whole library: the core layer is a directory inside it (`src/core`), built
as a second entry point and published as the `area-3d-mockups/core` subpath, so
the tarball is one self-contained install.

Releases run on [`.github/workflows/release.yml`](.github/workflows/release.yml)
via npm Trusted Publishing: GitHub mints an OIDC token, npm exchanges it for a
short-lived publish credential, and the tarball gets a provenance attestation
linking it to the commit. There is no `NPM_TOKEN` in this repository.

A tag is the trigger:

```bash
npm version patch -w area-3d-mockups   # or minor / major
git commit -am 'Release area-3d-mockups v0.1.1'
git tag v0.1.1
git push origin main --follow-tags
```

The commit and the tag are separate steps on purpose. Against a workspace
(`-w`), `npm version` only rewrites the manifest and the lockfile: it does not
commit and does not tag, which is the opposite of its single-package behaviour.
Skip them and `--follow-tags` pushes nothing at all: no tag, no workflow run, no
publish, and no error to tell you so.

The workflow refuses any tag that disagrees with `packages/react/package.json`,
so a stale tag fails loudly rather than publishing the wrong tree. To rehearse
the whole thing without spending a version number, run the workflow from the
Actions tab with **Run workflow**. A dispatched run defaults to `--dry-run` and
only packs.

[`area-3d-mockups`]: https://www.npmjs.com/package/area-3d-mockups
