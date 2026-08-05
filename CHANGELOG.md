# Changelog

Notable changes to `area-3d-mockups`. This project follows
[semantic versioning](https://semver.org/); dates are ISO-8601.

## Unreleased

### Changed (breaking)

- **`open` is now `openAngle` on `FoldMockup`/`FlipMockup`** (and `Fold`/`Flip`,
  and in `mockupInfo('fold' | 'flip', …)`). It matches `LaptopMockup`'s existing
  `openAngle`, and it says what the number means. No alias is kept — the package
  has not been published.

  ```diff
  - <FoldMockup open={110} />
  + <FoldMockup openAngle={110} />
  ```

### Fixed

- **A hinge angle near flat snapped to flat and flickered.** The flat
  single-screen pose claimed everything from 177° up, so three degrees of travel
  all rendered fully flat — a slider felt magnetised to 180 — and each crossing
  of that edge swapped one live screen for two, tearing down the DOM and
  flashing the content. Around the boundary a drag re-crossed it repeatedly. The
  flat pose now claims only genuinely flat angles (`FLAT_EPSILON`), so every
  angle renders its own pose and dragging below flat never rebuilds a screen.

- **`railColor` derived rails in the wrong colour space.** Its HSL constants
  were fitted against sRGB values measured off retail hardware, but three's
  HSL accessors default to the linear working space, so every custom `color`
  produced a rail far too light and too saturated — a Navy back returned
  `#66718e` instead of `#414a60`. Named retail colorways were unaffected
  (they carry a measured `frameColor`).
- **`mockupInfo('van')` and `mockupInfo('bus')` measured the wrong surface.**
  Both resolvers treated an omitted `coverage` as the full wrap while the
  components default to the panel, so the measurement API reported a 5.9 m
  elevation for a van rendering its 3.9 m panel.
- **`mockupInfo('tv')` ignored `size`.** The resolver read an `inches` prop
  no component passes, so every TV measured at the 65″ default.
- **Shared tablet and watch framings fell back to the wrong family.** A
  default `<GalaxyTabMockup />` grounded its contact shadow at the iPad Pro
  13″ extent. `IPAD_FRAMING`, `GALAXY_TAB_FRAMING`, `APPLE_WATCH_FRAMING` and
  `GALAXY_WATCH_FRAMING` are now built per family.
- **`TVSetMockup`, `AppleWatchMockup`, `GalaxyWatchMockup` and
  `GalaxyTabMockup` were missing `.info()` and `.regions`.** Their wrapper
  shells re-attached slots but dropped the measurement statics.
- **A non-tuple `camera` prop broke zoom.** A `THREE.Camera` or `Vector3`
  produced `NaN` orbit limits; `cameraDistance` now validates its input and
  falls back to the stage default.
- **The Galaxy Z Flip 7 cover panel was ~1% too tall**, rendering a 316×353
  screen where its own diagonal and pixel grid give 316×349.

### Added

- **Reduced-motion support.** `autoRotate`, `float` and the `LEDText`
  animations hold still when the visitor's system asks for reduced motion.
  Gestures are untouched. The hook is exported as `usePrefersReducedMotion`.
- **`mockupRegions(kind)`** — the regions a kind advertises, without measuring.
- Unit tests (`npm run test`) covering registry invariants, measurement
  defaults, colour derivation and framing fallbacks.
- `sync-device-table.mjs` now also compares each modelled aspect against the
  hand-maintained Panel column — the one check `devices:sync` cannot satisfy by
  rewriting the columns it verifies.

### Changed

- **Peer dependencies now state what actually works**: `react`/`react-dom`
  `>=19` (react-three-fiber 9 and drei 10 both require React 19, so `>=18` was
  unsatisfiable) and `three` `>=0.179.0` (the bundled CSG engine's floor).

## 0.1.0

First release: 22 procedurally generated devices, 23 print, packaging,
out-of-home and vehicle objects, the live-DOM screen bridge, the measurement
API (`mockupInfo`, `useSurface`, the generated catalog), and the docs site.
