# Contributing

Thanks for taking an interest. This is a small project, so the process is
light — but the checks below are what keep the mockups trustworthy, and they
are all runnable locally.

## Getting set up

Node 18.18+ (CI runs 22). npm workspaces, no other package manager.

```bash
npm install        # installs every workspace and builds the package
npm run dev        # package in watch mode + docs at http://localhost:3000
```

## Before you open a pull request

```bash
npm run typecheck     # all three workspaces
npm run test          # core unit tests
npm run devices:check # the derived half of the device table, and aspect drift
npm run visual        # visual regression (needs `npm run dev` running)
```

CI runs the first three plus a docs build on every PR. The visual check needs a
browser and a dev server, so it stays local — run it whenever you touch
geometry.

## Where code goes

The layering rule is in [ARCHITECTURE.md](ARCHITECTURE.md) and it is the thing
most worth reading before a first change:

> If it can be written against **three.js and the DOM** without importing a UI
> framework, it lives in `@area-3d-mockups/core`.

In practice that means **numbers live in specs, not in scene components**. A
rect computed inline in JSX cannot be measured, cannot be unit-tested, and has
to be re-derived by every other binding — and it silently drops the object out
of `mockupInfo`, the generated catalog and the docs tables.

Adding a device or object is five pieces, all documented under
[“Adding a device or object”](ARCHITECTURE.md#adding-a-device-or-object).

## The checks, and what each one actually catches

They overlap less than they look:

- **`npm run test`** — registry invariants and pure math. Catches a metrics
  resolver that disagrees with the component it describes: a default that does
  not match the component's default, a region declared but never measured, a
  colour derived in the wrong space. The visual check is blind to all of these,
  because render and report read the same numbers.
- **`npm run visual`** — geometry. Renders every mockup on `/harness` with each
  live region filled in a flat labelled colour and diffs against
  `apps/docs/visual-baselines/`. A surface that moves, resizes or starts
  bleeding through the body fails. Update baselines with
  `npm run visual -- --update`, and **review the diffs in
  `apps/docs/.visual-diffs/` before you do** — a baseline update is a claim that
  the new picture is the correct one.
- **`npm run devices:check`** — the numbers in `docs/devices.mdx`. Two halves:
  the Portrait/Landscape columns against what actually renders (`devices:sync`
  rewrites those), and the modelled aspect against the hand-maintained Panel
  column, which is the one comparison syncing cannot satisfy.

## Style

Match the surrounding code. The one habit worth calling out: comments here
explain *why*, usually by naming the thing that went wrong without them. If you
fix a subtle bug, leave the reason behind in a comment — several of the
trickiest invariants in this repo are only obvious once someone has broken them.

## Commits and pull requests

Describe what changed and why. If a change moves a baseline or a documented
number, say so in the message — those are the diffs a reviewer most needs
pointed out.
