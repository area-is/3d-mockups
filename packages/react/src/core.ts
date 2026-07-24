// area-mockups/core — the full framework-agnostic core surface.
//
// Everything in `@area-mockups/core` (device/object specs, region registries,
// framing, geometry math, screen & stage behaviors), re-exported behind a
// subpath so advanced users can reach it without the main entry freezing the
// whole core API into its semver contract:
//
//   import { IPHONE_VARIANTS, STUDIO_LIGHTFORMERS } from 'area-mockups/core'
export * from '@area-mockups/core'
