# Changelog

Notable changes to `area-3d-mockups`. This project follows
[semantic versioning](https://semver.org/); dates are ISO-8601.

## Unreleased

### Changed (breaking)

- **`open` is now `openAngle` on `FoldMockup`/`FlipMockup`** (and `Fold`/`Flip`,
  and in `mockupInfo('fold' | 'flip', …)`). It matches `LaptopMockup`'s existing
  `openAngle`, and it says what the number means. No alias is kept, as the
  package has not been published.

  ```diff
  - <FoldMockup open={110} />
  + <FoldMockup openAngle={110} />
  ```

### Fixed

- **The iPhone 17 Pro and Pro Max rear lenses rendered inside out.** Their
  collars stand 0.7 mm proud of the camera plateau, but `LensRing` laid the
  bezel, barrel, front element and cover glass out at fixed depths behind the
  collar face - depths larger than that collar is tall. Every one of them sank
  into the plateau, which is a solid, so each lens came out as a black annulus
  around a disc of *body-coloured pedestal*: glass the same colour as the
  phone, on the two models whose cameras are the reason to look at the back.
  The stack is now laid out as fractions of the collar's height and closed with
  its own opaque floor, so a 0.5 mm collar and a 2 mm one both show a real bore
  and neither can show the surface it stands on. Lens `pupil` values above 0.45
  were also being clamped away, which had been quietly flattening the iPads'
  wide front elements.

- **A hinge angle near flat snapped to flat and flickered.** The flat
  single-screen pose claimed everything from 177° up, so three degrees of travel
  all rendered fully flat (a slider felt magnetised to 180), and each crossing
  of that edge swapped one live screen for two, tearing down the DOM and
  flashing the content. Around the boundary a drag re-crossed it repeatedly. The
  flat pose now claims only genuinely flat angles (`FLAT_EPSILON`), so every
  angle renders its own pose and dragging below flat never rebuilds a screen.

- **`railColor` derived rails in the wrong colour space.** Its HSL constants
  were fitted against sRGB values measured off retail hardware, but three's
  HSL accessors default to the linear working space, so every custom `color`
  produced a rail far too light and too saturated: a Navy back returned
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
- **The Fold and Flip drew a dark crevice down the display at every flex
  angle.** Each half-screen's depth mask is held a hair inside its own outline
  (`SCREEN_MASK_INSET`), and with the halves abutting at the fold line those
  insets paired into a strip of un-cleared canvas showing the dark glass
  beneath - where the real bent panel is one continuous surface. Each half now
  overhangs the fold line by `CREASE_OVERLAP` (~0.7 mm), so the planes and
  their masks overlap across the crease and both show the shared virtual
  display's own pixels there.
- **The Fold's landscape flex pose windowed each half onto the wrong content.**
  The left half lands at the bottom of the upright landscape content but showed
  the top, so crossing the flat-open threshold mirrored the content across the
  crease.

### Added

- **`MilkCartonMockup` / `MilkCarton`**: a gable-top beverage carton
  (95×241×95 mm, the US half-gallon, resizable in millimeters via `size`):
  poly-coated board walls, the roof folded up to a ridge, an ear fold pinching
  each end inward the way a real carton's excess board folds, the sealed fin,
  and a ribbed screw cap on the front roof panel (knurled from the same
  `gearShape` the watch crown is). Live surfaces on all four walls plus
  both roof panels; the cap rides over the front one the way a real spout
  rides over the print. Measures as `mockupInfo('milkCarton')`.
- **Reduced-motion support.** `autoRotate`, `float` and the `LEDText`
  animations hold still when the visitor's system asks for reduced motion.
  Gestures are untouched. The hook is exported as `usePrefersReducedMotion`.
- **`mockupRegions(kind)`**: the regions a kind advertises, without measuring.
- Unit tests (`npm run test`) covering registry invariants, measurement
  defaults, colour derivation and framing fallbacks.
- `sync-device-table.mjs` now also compares each modelled aspect against the
  hand-maintained Panel column, the one check `devices:sync` cannot satisfy by
  rewriting the columns it verifies.
- **The TV's `frame` variant grew a real back**, proportioned from Samsung's
  published One Connect placement: an inset rear plate whose rim seam is the
  visible gap around the edge, the recessed One Connect bay with the slim
  connector and its cable groove running both ways, the TV controller nub at
  the lower right corner and a faint wordmark. Wall-mount hardware is
  deliberately not modeled.

### Changed

- **The iPhone camera hardware is modelled from Apple's macro photography**,
  not just from the accessory drawings, which stop at the plateau. Lens collars
  are wider (the bore is 0.72 of the collar radius, as measured off the retail
  shots) with a rolled shoulder that carries the bright arc every product photo
  has; the optics are two elements rather than one, so the studio softbox
  reflects as a compact coating flare instead of a white band across the whole
  lens, tinted per lens because the coatings are. The flash is a domed phosphor
  window in a glassy margin instead of a flat cream disc, and the LiDAR scanner
  and the mic beside it are no longer the same dot: one is black glass, the
  other a drilled hole.
- **The 17 Pro / Pro Max back is anodized aluminum, not glass**, and its camera
  plateau is that unibody's own shelf, so both take the same matte finish. The
  plateau used to carry a clearcoat of its own, which put a bright rim around
  its whole outline and made it read as a glossy tile stuck onto the phone. The
  Ceramic Shield charging window below it is now the only glossy panel on a Pro
  back, which is the contrast the two-tone design is built on.
- **Peer dependencies now state what actually works**: `react`/`react-dom`
  `>=19` (react-three-fiber 9 and drei 10 both require React 19, so `>=18` was
  unsatisfiable) and `three` `>=0.179.0` (the bundled CSG engine's floor).

## 0.1.0

First release: 22 procedurally generated devices, 23 print, packaging,
out-of-home and vehicle objects, the live-DOM screen bridge, the measurement
API (`mockupInfo`, `useSurface`, the generated catalog), and the docs site.
