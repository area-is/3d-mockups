# Changelog

Notable changes to `react-3d-mockups`. This project follows
[semantic versioning](https://semver.org/); dates are ISO-8601. Before 1.0, a
breaking change can ship in a minor release, and is always listed under
*Changed (breaking)* with what to change.

## Unreleased

### Changed

- **The README, which is the package's npm page, says the package is in active
  development** and that its API may change over the next few weeks. 0.1.0
  shipped without that notice.

## 0.1.0 - 2026-10-02

First release: 33 procedurally generated devices and 24 objects (print,
packaging, out-of-home formats, vehicles, a TV, and custom-size panels and
boxes), the live-DOM screen bridge, the measurement API (`mockupInfo`,
`useSurface`, the generated catalog), and the docs site.

**In active development.** The API may change over the next few weeks.
Breaking changes are listed in the [changelog](https://github.com/area-is/react-3d-mockups/blob/main/CHANGELOG.md)
with what to change; pin an exact version
(`npm install --save-exact react-3d-mockups`) if you need it to stay put.

## Before 0.1.0

What changed in this repository while the package was being built, before its
first publish. Each entry compares against an earlier unpublished build, not a
version on npm, so there is nothing here to migrate. All of it is in 0.1.0.

### Added

- **The September 2026 Apple generation: six new devices.** `IPhoneDuoMockup`
  is new - Apple's first foldable, on the wide Z Fold 8's passport shape: the
  same `openAngle` pose vocabulary as `FoldMockup` (open, shut, or any Flex
  angle between), a landscape 7.6" inner panel (890×626 logical) with *no*
  camera hole because the inner FaceTime camera sits under the glass, a 5.4"
  cover screen (466×678) with the camera hole in its top-right corner, the
  horizontal two-lens plateau with its mic and flash and the Apple badge on
  the camera half's back, the volume keys on that half's top edge, Touch ID
  in the side button, near-square hinge corners beside round free ones, a
  mirror-polished titanium frame, a bare hinge cover with no wordmark, and
  iOS's status bar rather than One UI's. It is built on the same spec shape
  and scene body as the Galaxy Z Fold - `FoldSpec` gained a `brand`, an
  optional inner punch hole and spine emboss, per-ring finish figures and
  positions, a back badge, hinge-side corner radii, a cover display offset,
  top-edge keys and a plateau-seated flash and mic - and measures under the
  new `iphoneDuo` kind. `IPhoneMockup` gains `variant="18pro"` and
  `variant="18promax"`: the 17 Pros' chassis to the tenth of a millimetre
  under the generation's Dynamic Island, a quarter narrower, and
  colour-matched Ceramic Shield back, in Black, Silver, Glacier and Burgundy.
  `AppleWatchMockup` gains `variant="series12"` (the Series 11's case a
  millimetre wider, the generation's eight aluminium, titanium and ceramic
  finishes) and `variant="ultra4"` - the 49 mm titanium case the Ultra 3
  introduced, with its raised crown guard, the orange-ringed crown,
  the orange Action button on the left flank (orange whatever the finish,
  because on the hardware it is), a flat crystal over the 422×514 panel
  (211×257 logical) and the buckled Ocean Band; watch keys can now sit on
  either flank. `LaptopMockup` gains `variant="neo13"`, the MacBook Neo 13":
  the first notchless MacBook in the catalog - `LaptopSpec.notch` is optional
  now and a `bezelCamera` puts the camera in the bezel above the 2408×1506
  panel (1204×753 logical) - on a body a hair smaller and thicker than the
  Air 13's, with keycaps colour-matched to the aluminium (`LaptopSpec.keycaps`),
  two USB-C ports and no MagSafe, in Silver, Blush, Citrus and Indigo. Every
  body and panel figure is Apple's published dimension, and the detail
  geometry is measured off Apple's own product-bezel drawings (see
  `agent-outputs/model-review-2026-09-apple.md`).

- **`delayCapture`: frame-accurate video and screenshots.** A mockup draws
  asynchronously in three places - react-three-fiber starts the renderer
  after mount, WebGL redraws on the next animation frame, and each screen is
  a React root of its own that commits after the scene and then waits a frame
  to be placed on the glass - and a tool photographing the page could see
  none of it. Rendered with Remotion, the first frame of a freshly mounted
  mockup came out with no device or a bare screen hole, on different frames
  each render. `delayCapture` (on `MockupCanvas` and every `*Mockup`) is
  called with a reason whenever a frame is on its way that is not drawn yet,
  and returns the function the canvas calls once it is: wire it to Remotion's
  `delayRender`/`continueRender`. While it is set the canvas never pauses off
  screen. The helpers behind it, `takeCaptureHold` and `createCaptureHolds`,
  are in `react-3d-mockups/core`; `examples/remotion` renders a reel with it.

- **`coverScreenUntil` on `FoldMockup`, `FlipMockup` and `IPhoneDuoMockup`**
  (and their bare components): the hinge angle up to which the cover display
  stays lit as the device opens, before your content moves to the inner
  display. Defaults to 30°, where Android's reference foldable swaps; `90`
  keeps the cover on through the half-open tent pose, `0` swaps the moment the
  hinge moves. `mockupInfo` and `.info()` measure whichever display it lights.
  The rule lives in core as `coverScreenLit` and `COVER_SCREEN_UNTIL`.

- **`time`: the stage's motion on your clock.** `autoRotate` and `float` ran on
  the browser's clock, and a video render draws frames out of order across
  several tabs, so each landed on a different point of the spin and the bob
  (and the float's phase was random per mount). `time` (seconds, on
  `MockupCanvas` and every `*Mockup`) makes both a function of it:
  `autoRotate` turns the camera as far as it would have by then, whether or
  not `controls` is on, and `float` samples its bob at that time with a fixed
  phase. Reduced motion does not hold them still on a clock you drive. The
  math is `turntablePosition` and `autoRotateSpeed` in `react-3d-mockups/core`.

- **Render control on every mockup.** `frameloop` (`'demand' | 'always' |
  'never'`), `pauseWhenOffscreen`, `gl` (merged over `CANVAS_GL_DEFAULTS`) and
  `onCreated` on `MockupCanvas`; `frameloop` is advertised on every `*Mockup`
  and the rest route through to the canvas. See *Changed (breaking)* for the
  new defaults.

- **Accessibility.** The canvas is exposed as an image with an accessible name:
  `label`, defaulting on each mockup to what it shows ("3D mockup of an
  iPhone"). `screenAccessibility` decides whether screen content is in the
  accessibility tree. With `controls` on the canvas is focusable: the arrow
  keys turn and tilt it, `+`/`-` zoom when `zoom` is on, and Home puts the
  camera back (`TumbleControlsHandle.reset()` does the same from code).

- **React context reaches the screen.** A screen renders in its own React root,
  which used to start with no context at all: a theme, an i18n provider, a
  router or a query client above the mockup was invisible to the component on
  the glass. Every context the screen can see is now bridged into that root.

- **A development warning for an opaque canvas.** A `<Canvas>` with
  `gl={{ alpha: false }}`, a `scene.background` or `<color attach="background">`
  paints over every screen in it, silently. The first screen rendered in one
  now says so, once, outside production builds.

- **The 2026 Samsung generation: five new devices.** `FoldMockup` gains
  `variant="fold8"` - the generation's new *wide* form factor, folding open
  around the same vertical hinge into a landscape 4:3 tablet (1020×770
  logical, the one display in the catalog whose unrotated pose is wider than
  tall) - and `variant="fold8ultra"`, the Fold 7's chassis carrying the
  sharper 2504×2256 inner panel on the same 820×910 grid. `FlipMockup` gains
  `variant="flip8"` (6.9" main panel on the same grid, unchanged cover).
  `GalaxyWatchMockup` gains `variant="watch9"` (the Watch 8's case, new
  internals) and `variant="watchultra2"` - the 47 mm titanium cushion
  squircle with its 1.52" 498×498 dial, wider strap and the orange Quick
  Button, which stays orange whatever the case finish because on the
  hardware it is. Each variant ships its retail colorways, and every body
  and panel figure is the published hardware dimension.

- **`statusBar` on phones, foldables and tablets.** `<IPhoneMockup statusBar />`
  draws the iOS bar; the Galaxy phones, both foldables and the Galaxy Tabs draw
  One UI's. Pass an object to set the clock, the meters, the carrier or the ink
  (`statusBar={{ time: '14:05', battery: 0.42, batteryPercent: true }}`).

  It is placed from the hardware rather than from a constant: every device
  already carries its front-camera geometry, so the glyph row is centred on the
  Dynamic Island or the punch hole and the band is symmetrical about it - on
  every variant, at whatever `resolution` you set, and including the Z Fold's
  off-centre inner hole. The two platforms differ in layout, not just styling:
  iOS centres the clock in the ear left of the island and the meters in the ear
  right of it, One UI sets both flush to their insets. Landscape has no cutout
  in the way, so both fall back to a plain strip.

  The Flip's cover screen is deliberately excluded - One UI's cover face has its
  own clock and no status bar - as are laptops, monitors, watches and every
  print object.

  `statusBarLayout()`, `statusBarMetrics()` and `resolveStatusBarContent()` are
  exported from `react-3d-mockups/core` for bindings outside React, and
  `<StatusBar>` from the package root for anyone composing one by hand.

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

### Changed (breaking)

- **Mockups render on demand.** `frameloop` defaults to `'demand'`: a mockup
  draws when something changes - a drag and the damping after it, zoom,
  `autoRotate`, `float`, a prop change, a resize - and nothing at rest. It used
  to draw every frame forever, at the full cost of the scene. A composed
  `<MockupCanvas>` whose children animate themselves in `useFrame` needs
  `frameloop="always"`, or a call to r3f's `invalidate()`.

- **Off-screen and hidden canvases stop drawing.** `pauseWhenOffscreen` is on by
  default: a canvas scrolled out of view, or in a background tab, keeps its last
  frame and draws nothing until it is back. Turn it off for an offscreen capture.

- **`powerPreference` is the browser's default.** It was hard-coded to
  `'high-performance'`, which on a dual-GPU laptop wakes the discrete GPU for a
  decorative element. Opt back in with `gl={{ powerPreference: 'high-performance' }}`.

- **Screens are hidden from assistive technology by default.** Each screen
  layer is `aria-hidden` and `inert`: its demo headings were landing in the
  page's outline and its links in the tab order. Pass
  `screenAccessibility="visible"` for a screen whose text appears nowhere else.

- **Print objects print onto their own stock.** On the objects whose `color` is
  the material their surfaces are printed on - `Brochure`, `BusinessCard`,
  `IDCard`, `GreetingCard`, `ProductBox`, `MailerBox`, `MilkCarton`,
  `ShoppingBag`, `VinylRecord`, `CustomPanel`, `CustomBox`, `Bus`, `Van` and
  `SemiTrailer` - `surfaceBackground` now defaults to `color` instead of white.
  Whatever your content leaves clear is the card, the board, the bag or the
  paint, so a transparent logo prints onto kraft without a second prop.
  Full-bleed opaque artwork looks exactly as before. To keep a white ground
  under transparent content, pass `surfaceBackground="#ffffff"`. Objects whose
  `color` is hardware around a separate sheet (frames, signs, the billboard) and
  the book's cover still default to white.

- **Peer ranges are bounded:** React `^19`, `@react-three/fiber` `^9`,
  `@react-three/drei` `^10`, `three` `>=0.179.0 <0.187.0`. They were open-ended,
  so npm would have installed a future drei 11 or fiber 10 - which the screen
  bridge's reliance on drei's `<Html>` internals is unlikely to survive - without
  a warning. Ranges widen as new versions are tested.

- **`three-bvh-csg`, `three-mesh-bvh` and `its-fine` are dependencies**, no
  longer bundled into `dist`. An app now installs and can dedupe or update them
  like any other package, rather than carrying a private copy of
  `three-mesh-bvh` beside drei's.

- **The package is now `react-3d-mockups`.** It was `area-3d-mockups`; nothing
  else moved, so the change is one line in your manifest and one in each import.

  ```diff
  - import { GalaxyMockup } from 'area-3d-mockups'
  + import { GalaxyMockup } from 'react-3d-mockups'
  ```

- **`open` is now `openAngle` on `FoldMockup`/`FlipMockup`** (and `Fold`/`Flip`,
  and in `mockupInfo('fold' | 'flip', …)`). It matches `LaptopMockup`'s existing
  `openAngle`, and it says what the number means. No alias is kept, as the
  package has not been published.

  ```diff
  - <FoldMockup open={110} />
  + <FoldMockup openAngle={110} />
  ```

### Changed

- **Watch bands and the Apple Watch Ultra, checked against product photos.**
  Both families' straps were straight boxes where the hardware was: a buckle
  frame and keeper standing off a curved band as rigid slabs, reading from
  the side as blocks floating beside the strap. The buckle frame (and the
  Ocean Band's titanium loop) is now bar stock bent round the strap it sits
  on, wrapping its edges, in the case's metal, with a rounded tongue; the
  Galaxy's keeper is a moulded sleeve right behind the buckle. The bands
  leave the case through the case end rather than off the back edge - the
  Galaxy's halfway up, falling away at 45° as in Samsung's side render - and
  thicken at the root. The Ocean Band has its moulded ridges, one every
  6.7 mm, with stadium holes cut across it in the troughs; the Galaxy Sport
  Band is 21.8 mm of constant width (it tapered from a 33 mm lug to 16 mm)
  with ten holes across it at Samsung's 5.2 mm pitch. The Ultra 4 has barrel
  flanks under a flat raised lip, rounder corners, a Ø9.6 mm crown of a score
  of coarse lobes, a round-ended crown guard with the side button in a
  pocket and the mic drilled through it, the ten-hole speaker grille, mic and
  siren port on the left in place of two slots, a bright orange Action button
  (at full metalness it read as dark red), and a black ceramic sensor dome.
  The Series has two speaker slots, a Ø7 mm crown and a longer side button.
  Geometry only - no prop changed. The core gains `bendAlongStrap`, and
  `gearShape` a `'lobed'` profile. The `watch`, `watch-ultra4` and
  `watch-ultra2` visual baselines moved.

- **Watch backs, checked against product photos.** Every back was a dark
  disc with two green dots; it is now the real one, laid out in the spec
  (`WatchBack`) and drawn by a new `CaseBack` component. Apple's sensor sits
  under an all-glass crystal whose outer band is the electrode, split across
  the middle: on the Series a Ø25.5 mm crystal standing a hair proud of the
  body-colour back, four LEDs at the quarters and four lenses between them;
  on the Ultra a sunburst of ribs round eight windows and a centre lens, on
  its ceramic dome, with four pentalobe screws. Samsung's is a polished,
  split metal puck round a small dark window - a metal sensor disc, the LEDs
  at the quarters and diamond photodiodes between - with a vent and four
  tri-wing screws; the Watch Ultra 2's sits on a darker round plate and has
  copper band releases. Every back has its band-release button by each lug
  and the model line engraved round the sensor. The fine print is drawn into
  canvas textures; what catches light is geometry. Front views are
  unchanged.

- **Apple cameras, rebuilt to Apple's dimensional drawings.** At a grazing
  angle, as in a turning shot, every Apple lens read as a pale metal cup: the
  bore walls and elements under a glossy smoked cover caught the studio
  lights. Each lens is now built the way Apple draws it. The collar rolls over
  at its top edge onto a flat top and stands its real height: 1.88 mm on the
  17 Pros, 2.11 mm on the 18 Pros (it was 1.2). A glossy black lip crowns just
  above the glass and carries the thin highlight line in the macro shots. The
  sapphire is clear, flush with the collar and reflects little, turning a
  darker lavender-grey at a grazing angle. Under it are a black mask, the
  barrel's dark face, a bore and the front element well below the glass, so
  the optics shift against the collar as the phone turns. The 18 Pro's main
  camera shows its six-blade iris.
  - **The 18 Pros:** their camera was a copy of the 17 Pros'. It now has
    Apple's own figures: Ø16.58 collars (was Ø16.20), a 2.78 mm plateau (was
    2.55), Ø6.90 flash and LiDAR, a Ø1.15 mic, and the telephoto 0.13 mm
    further out.
  - **The 17 Pros:** collars are Ø16.20, where they were Ø15.97 on the Pro and
    Ø16.27 on the Pro Max.
  - **Collar finishes:** the Pros' collars are the plateau's own anodized
    aluminium. The 17's are bead-blasted aluminium, where they were polished.
    The Air's and the Duo's are polished and two-tier, with a raised inner
    collar.
  - **Flash and LiDAR:** the flash is flush, a frosted Fresnel window in a
    polished rim. The LiDAR is flush black glass.
  - **iPad Pro:** the camera module is the back's bead-blasted aluminium where
    it was glossy grey. Its flash, LiDAR and ambient light sensor match the
    iPhones'.
  - **Unchanged:** the Galaxy lenses.
- **MacBook keyboards, checked against Apple's top-down renders.** The keys
  stood on a flat deck, so at an angle the gaps between rows read as pale
  aluminium and the caps as grey slabs. The keyboard now sits in a well
  milled 1.2 mm into the deck (R4.9), with its tops just under the deck line.
  - **The well:** its floor is the Pro's black tray, or on the Air and Neo
    the deck's aluminium in the keys' shade.
  - **Spacing:** caps are 1.5 mm apart (2.1 mm between top faces), where the
    gap was 2.5 mm, at Apple's 19.0 × 18.5 mm pitch.
  - **Caps:** a darker satin finish, near-black under studio light where they
    read mid-grey.
  - **Touch ID:** a Ø9.5 mm disc in a thin metal ring, where it was a grey
    disc.
  - **Legends:**
    - letters and words at Apple's sizes;
    - modifier words in the outer corner;
    - the ▲ ▼ keys split by a hairline;
    - the editing keys on the M5 Airs and the Neo carry ⇥ ⇪ ⇧ ⌫ ↵ (new
      `legends` spec field).
  - **Keyboard and trackpad positions** now follow the renders. Most moved 2
    to 6 mm; the 15" Air's keyboard sat 12.5 mm too far back. The Neo's
    trackpad is 116 × 72.5 mm.
  - **Pro grilles:** they run the well's height on a 0.94 mm square grid.
- **A re-render no longer rebuilds the studio lighting.** drei's
  `<Environment>` re-renders its cube map whenever its children change
  identity, and three.js then re-filters it into PMREM mip levels, and the
  canvas mapped its light formers inline, so every render of `MockupCanvas` -
  every prop change - paid for a new environment. Invisible at rest, a hitch
  in the prop explorer, and most of the frame in a video render, where props
  change every frame: on SwiftShader, 12 frames of a turning phone went from
  112 s to 25 s. The formers are built once now.

- **The contact shadow redraws only when something under it moves.** It used to
  re-render the scene into its shadow map every frame (drei's `ContactShadows`
  default) - roughly half the triangles of a mockup frame. Orbiting moves the
  camera, not the object, so dragging, zooming and auto-rotating now leave the
  shadow alone; `float` or a caller's own animation still updates it.

- **Machined geometry is cached.** The CSG pass that cuts ports and speaker
  holes ran again on every mount; its result is now remembered, keyed by the
  input geometry, so a model coming back into a carousel or a docs example
  scrolling back into view skips it.

- **Damping settles.** The drag's damping used to decay forever through motion
  far below a pixel; it now stops once less than 1e-4 rad is left, so an
  on-demand canvas stops drawing about two seconds after a flick.

- **A screen inside a hidden group is hidden.** A device under
  `<group visible={false}>` left its DOM screen floating on its own; the screen
  now follows the scene graph's visibility.

- **One stylesheet for every screen.** Each screen injected its own copy of the
  screen-layer CSS; it is now a single hoisted `<style>`.

- **The zoom control is one pill: −, the level, +.** It replaces the stack of
  two round buttons with the percentage between them. The level is a button
  now and puts the camera back to 100%. The pill keeps the overlay's dark
  glass by default and reads `--mockup-overlay-bg`, `--mockup-overlay-border`,
  `--mockup-overlay-fg` and `--mockup-overlay-font` first, so a page can dress
  it in its own chrome without a stylesheet from the library.

- **A plain scroll over a zoomable mockup scrolls the page.** With `zoom` on,
  a two-finger scroll on a trackpad (or a bare mouse wheel) used to zoom the
  camera and swallow the scroll. Now only a pinch zooms - on a trackpad, in
  Safari's gesture events as well as the ctrl-wheel the other browsers send -
  and ctrl or ⌘ with a mouse wheel does the same. The step follows the
  delta, so a pinch is continuous and a wheel notch still moves.

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

### Fixed

- **A foldable no longer looks switched off while it opens.** The cover
  display went dark at the first half-degree of hinge travel and the inner
  display took the content, but at small angles that one still faces its own
  other half - so for the first third of every opening nothing was lit that
  the viewer could see. On the hardware one of the two is lit at every angle;
  the cover now stays lit, on the back of the cover half, until
  `coverScreenUntil`.

- **The Flip's folded cover wore its lenses mirrored.** The rings drawn on
  the cover screen read the spec's half-local `x` as if seen from the front,
  but the cover is that half's back: folded, the lenses sat top-right, and
  half-open (where the 3D modules draw them) top-left. Both now sit top-left,
  where the retail Flip has them with the hinge at the bottom.

- **The Remotion recipe compiles and holds its frames.** It passed
  `pauseWhenOffscreen` to a one-liner mockup, which does not accept it in
  TypeScript, and relied on timing alone for its frames to be complete. It
  now uses `delayCapture` and `time`, and keeps `frameloop` at `'demand'`
  (`'always'` only made every render tab redraw between captures).

- **The `camera` prop is live.** react-three-fiber reads it once, when it
  creates the camera, so changing it later did nothing - a dolly or a zoom
  driven from props silently stood still. A new `position` or `fov` now
  moves the camera there, looking at the stage center. Values are compared,
  not the object, so a re-render that passes the same numbers leaves a
  dragged camera where the visitor put it.

- **Screens render under `@react-three/fiber` 9.8.** Fiber 9.8.0 mounts the
  scene inside `<Canvas>`'s own commit, and there drei's `<Html>`, which
  re-roots the same wrapper element once events connect, clears its own new
  screen with the old root's late teardown. Every screen stayed blank, and
  9.8 is the only fiber that accepts React 19.3. Each screen's `<Html>` is now
  keyed by its portal target, so the new root gets a fresh wrapper. Checked
  under fiber 9.7.0 and 9.8.0, and 9.8.0 with React 19.3. In development, 9.8
  still logs React's "synchronously unmount a root" warning once per screen,
  from drei's cleanup; it is harmless.

- **No console warnings from the CSG engine.** `three-bvh-csg` 0.0.18 passes
  `three-mesh-bvh` 0.9 a deprecated option, which printed twenty-odd
  `maxLeafSize` warnings on a page of devices. The library no longer lets that
  reach the console.

- **Package metadata points at the right places**: the repository is
  `area-is/react-3d-mockups` (it named the old `3d-mockups`), and the homepage
  is the docs site.

- **`<ProductBox>` prints its top panel.** The panel sat under the tuck flap's
  mesh, so `<ProductBox.Top>` rendered as blank board whatever was passed to
  it. It now sits on the flap.

- **The phone cameras now match the retail hardware.** Every rear camera was
  reviewed against Apple's and Samsung's product photography and the
  hands-on close-ups, and four things were wrong:

  - *Lens interiors rendered pewter grey.* The front element and the smoked
    cover glass reflected the stage's white softboxes hard enough to wash out
    glass that every photo shows as near-black. Both are toned down, so a bore
    reads as dark glass with one crisp highlight and the coating flare.
  - *Every iPhone wore the Pro's collar.* The iPhone 17's rings are the thin,
    glossy colour-matched rims of the glass-backed models and the iPhone Air's
    the mirror titanium of its frame; both used to render as the Pro's broad
    matte anodized collar. The Pros keep the matte collar at the width Apple's
    close-ups show. The specs now carry `ringFinish` and `ringCollar`, so each
    variant says which it is.
  - *The camera pedestals had a hard, banded step around them.* The 17's pill,
    the Air's bar and the Pro's forged plateau now roll into the back with one
    smooth fillet - the full raise of the pedestal, or the fillet width where
    that is narrower (`wall` on the Pro specs) - with smooth normals on the
    extrusion so the roll shades as a curve rather than a stack of bands.
  - *The Galaxy S26's rings followed the rail.* They are dark chrome on every
    colourway - the white and mint phones were getting silver rings - with the
    hairline rims and the taller bump of the hands-on photography; the Ultra's
    second-column tele rings thin out to match. Samsung's flash was a flat
    cream disc on the S26, S26 Ultra, Fold and Flip; all four now carry the
    same domed LED window the iPhones already had.

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
  were fitted against sRGB values sampled from retail product photography, but three's
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

- **Apple's product bezels as the benchmark for the whole Apple catalog.**
  Measured against the bezel drawings on Apple Design Resources, the display
  corners were too round on every iPad (now 5.6 mm on the Pros, 3.4-3.6 on
  the Airs, 4.6 on the iPad), too tight on the iPhone 17 Pro (10.4 mm, with
  the Pro Max's 12.6 mm body corners) and too round on the Apple Watch Series
  11 (8.0 mm, on the 32.4 × 38.6 mm panel Apple's 1196 mm² implies); the
  MacBook Air 13 and 15 top bezels were 2.6-2.9 mm too deep and their top
  display corners too round (3.9 mm now, 3.8 on the Pros, with the Pro 16's
  5.6 mm top bezel); the iPhone 17, Air and 17 Pro Dynamic Islands were
  0.5-0.6 mm low and the 17 Pro's a millimetre narrow (20.65 mm); and the
  Studio Display's panel corners are square. The older Apple specs carry the
  corrected numbers; nothing about their API changed.
