/**
 * Compile-time contract tests for the public API. Nothing here runs - the
 * file only has to typecheck (`npm run typecheck`), pinning the shapes an API
 * refactor must not silently change. It is not part of the published bundle
 * (only `index.ts`/`core.ts` are tsup entries).
 */
import * as React from 'react'
import type { TVProps, TVSetProps, DoohTotemSize, DOOHTotemSize } from './index'
import {
  mockupInfo,
  useSurface,
  useSurfaceOptional,
  type MockupInfo,
  type MockupRegions,
  type MockupKind,
  type RegionInfo,
  type SurfaceInfo,
  BookMockup,
  AFrameSignMockup,
  type AFrameSignMockupProps,
  AFrameSign,
  type AFrameSignProps,
  BrochureMockup,
  CustomBoxMockup,
  CustomPanelMockup,
  type CustomBoxMockupProps,
  IPhoneMockup,
  IPhoneDuoMockup,
  GalaxyMockup,
  type GalaxyProps,
  type IPhoneProps,
  type LaptopProps,
  type VanProps,
  type MockupCanvasProps,
  type MockupProps,
  type SlotProps,
  type SurfaceProps,
} from './index'

type Expect<T extends true> = T
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false
type Has<K extends PropertyKey, T> = K extends keyof T ? true : false
type Not<T extends boolean> = T extends true ? false : true

// ---- the old region-prop API is gone -------------------------------------------------
type _noBackProp = Expect<Not<Has<'back', AFrameSignProps>>>
type _noFaceBackground = Expect<Not<Has<'faceBackground', AFrameSignProps>>>
type _noDeviceProps = Expect<Not<Has<'deviceProps', AFrameSignMockupProps>>>
type _noPanelsProp = Expect<Not<Has<'panels', React.ComponentProps<typeof BrochureMockup>>>>

// ---- surface vocabulary is unified ---------------------------------------------------
type _surfaceBackground = Expect<Has<'surfaceBackground', AFrameSignProps>>
// one vocabulary: a slot and its mockup spell the same setting the same way
type _slotMatchesDefaults = Expect<Equal<Omit<SlotProps, 'children'>, SurfaceProps>>
type _slotShape = Expect<Equal<keyof SurfaceProps, 'surfaceBackground' | 'resolution' | 'surfaceStyle'>>
type _slotChildren = Expect<Has<'children', SlotProps>>

// ---- mockups are decorative: there is no input/occlusion vocabulary ------------------
type _noAllowInput = Expect<Not<Has<'allowInput', AFrameSignProps>>>
type _noDragToRotate = Expect<Not<Has<'dragToRotate', AFrameSignProps>>>
type _noSlotAllowInput = Expect<Not<Has<'allowInput', SlotProps>>>
type _noMockupAllowInput = Expect<Not<Has<'allowInput', AFrameSignMockupProps>>>

// ---- the front camera is hardware, not a prop ----------------------------------------
type _noPunchHole = Expect<Not<Has<'punchHole', GalaxyProps>>>
type _noDynamicIsland = Expect<Not<Has<'dynamicIsland', IPhoneProps>>>
type _noNotch = Expect<Not<Has<'notch', LaptopProps>>>

// ---- `color` absorbed `colorway`, and stays a plain string ---------------------------
type _colorIsString = Expect<Equal<GalaxyProps['color'], string | undefined>>
type _noColorway = Expect<Not<Has<'colorway', GalaxyProps>>>

// ---- coverage absorbed wrapOverWindows; no mixed-primitive unions left ---------------
type _coverage = Expect<Equal<VanProps['coverage'], 'panel' | 'full' | 'perforated' | undefined>>
type _noWrapOverWindows = Expect<Not<Has<'wrapOverWindows', VanProps>>>

// ---- wrappers merge stage + object props, and transforms are first-class -------------
type _stageProps = Expect<Has<'autoRotate', AFrameSignMockupProps>>
type _transformProps = Expect<Has<'rotation', AFrameSignMockupProps>>
type _floatProp = Expect<Has<'float', AFrameSignMockupProps>>
type _sizeRequired = Expect<Equal<CustomBoxMockupProps['size'], { width: number; height: number; depth: number }>>
type _mockupPropsRoundtrip = Expect<Equal<MockupProps<AFrameSignProps>, AFrameSignMockupProps>>

// ---- a mockup advertises what it looks like; machinery stays on MockupCanvas ---------
type _noFreeRotation = Expect<Not<Has<'freeRotation', AFrameSignMockupProps>>>
type _noShadowY = Expect<Not<Has<'shadowY', AFrameSignMockupProps>>>
type _canvasKeepsThem = Expect<Has<'freeRotation', MockupCanvasProps>>
// One prop carries the turntable, so there is no separate speed to advertise.
type _noSeparateSpeed = Expect<Not<Has<'autoRotateSpeed', AFrameSignMockupProps>>>
// When it draws and what assistive tech hears are page decisions: advertised.
type _frameloop = Expect<Equal<AFrameSignMockupProps['frameloop'], 'demand' | 'always' | 'never' | undefined>>
type _label = Expect<Has<'label', AFrameSignMockupProps>>
// Whose clock the motion runs on, and whether the page is being captured,
// are page decisions too.
type _time = Expect<Equal<AFrameSignMockupProps['time'], number | undefined>>
type _delayCapture = Expect<
  Equal<AFrameSignMockupProps['delayCapture'], ((reason: string) => () => void) | undefined>
>
type _screenAccessibility = Expect<
  Equal<AFrameSignMockupProps['screenAccessibility'], 'hidden' | 'visible' | undefined>
>
// Renderer plumbing is a mockup prop too: the performance guide passes it to
// one-liners, and it always routed to the canvas at runtime.
type _gl = Expect<Has<'gl' | 'onCreated' | 'dpr' | 'pauseWhenOffscreen', AFrameSignMockupProps>>
type _glSame = Expect<Equal<AFrameSignMockupProps['gl'], MockupCanvasProps['gl']>>
type _canvasRenderControl = Expect<Has<'gl' | 'onCreated' | 'pauseWhenOffscreen', MockupCanvasProps>>
// ---- studio lighting is not optional -------------------------------------------------
type _noEnvironment = Expect<Not<Has<'environment', MockupCanvasProps>>>

// ---- compound slots exist on both the mockup and the raw scene component -------------
const _slotsUsage = (
  <>
    <AFrameSignMockup autoRotate={0.8} rotation={[0, 0.25, 0]}>
      <AFrameSignMockup.Front surfaceBackground="#20241f">
        <div />
      </AFrameSignMockup.Front>
      <AFrameSignMockup.Back resolution={640}>
        <div />
      </AFrameSignMockup.Back>
    </AFrameSignMockup>

    <AFrameSign>
      <AFrameSign.Front>
        <div />
      </AFrameSign.Front>
    </AFrameSign>

    {/* bare children stay the primary-region shorthand */}
    <GalaxyMockup float>
      <div />
    </GalaxyMockup>

    <IPhoneMockup variant="pro">
      <IPhoneMockup.Screen surfaceBackground="#000" resolution={860}>
        <div />
      </IPhoneMockup.Screen>
    </IPhoneMockup>

    {/* the Duo is a book-fold with the iPhone's vocabulary: the fold's pose
        props, and a screen slot it shares with the Galaxy Z Fold */}
    <IPhoneDuoMockup openAngle={110} statusBar>
      <IPhoneDuoMockup.Screen surfaceBackground="#000">
        <div />
      </IPhoneDuoMockup.Screen>
    </IPhoneDuoMockup>

    <CustomBoxMockup size={{ width: 250, height: 90, depth: 160 }}>
      <div />
      <CustomBoxMockup.Top surfaceBackground="#111">
        <div />
      </CustomBoxMockup.Top>
    </CustomBoxMockup>

    {/* one named slot per panel - position comes from the name, not the order */}
    <BrochureMockup>
      <BrochureMockup.BackRight>
        <div />
      </BrochureMockup.BackRight>
      <BrochureMockup.FrontLeft>
        <div />
      </BrochureMockup.FrontLeft>
    </BrochureMockup>
  </>
)

// @ts-expect-error - a mockup must reject a slot region it does not have
const _wrongSlot = <CustomBoxMockup size={{ width: 1, height: 1, depth: 1 }}>{CustomBoxMockup.Spine}</CustomBoxMockup>

// @ts-expect-error - panels are named, so a fourth one cannot be expressed
const _noFourthPanel = <BrochureMockup.FrontFar />

// @ts-expect-error - it is FrontCenter, not FrontMiddle
const _wrongPanelName = <BrochureMockup.FrontMiddle />

// ---- the measurement API -------------------------------------------------------------
type _kindIsUnion = Expect<Has<'galaxy', Record<MockupKind, true>>>
type _infoShape = Expect<Equal<ReturnType<typeof mockupInfo<'book'>>, MockupInfo<MockupRegions<'book'>>>>
type _primaryIsRegion = Expect<Equal<MockupInfo['primary'], RegionInfo>>

// Geometry props are typed per kind; unrelated props are rejected.
const _galaxyInfo = mockupInfo('galaxy', { variant: 's26ultra', orientation: 'landscape' })
const _bookInfo = mockupInfo('book', { size: { width: 216, height: 279 } })
const _defaults = mockupInfo('galaxy')
// @ts-expect-error - 's27' is not a Galaxy variant
mockupInfo('galaxy', { variant: 's27' })
// @ts-expect-error - colors cannot change a measurement, so they are not accepted
mockupInfo('galaxy', { color: '#fff' })
const _storeInfo = mockupInfo('storefront')
// bus and van joined the registry once their wrap geometry moved into core
const _busInfo = mockupInfo('bus', { coverage: 'full' })
const _vanInfo = mockupInfo('van', { coverage: 'panel' })
// The Duo measures like a fold - pose props, its own variant space.
const _duoInfo = mockupInfo('iphoneDuo', { openAngle: false, orientation: 'landscape' })
// @ts-expect-error - a Galaxy Z Fold variant is not an iPhone Duo variant
mockupInfo('iphoneDuo', { variant: 'fold8' })

// Regions are typed by name: the documented access typechecks under strict TS...
const _coverPx: { width: number; height: number } = mockupInfo('book').regions.cover.px
const _screenPx: { width: number; height: number } = mockupInfo('galaxy').regions.screen.px
// ...a misspelt region does not...
// @ts-expect-error - there is no `covr` region
mockupInfo('book').regions.covr
// ...and a region painted onto several surfaces is an array.
type _plates = Expect<Equal<MockupRegions<'van'>['licensePlate'], RegionInfo[]>>

// Every region carries all three unit systems.
type _units = Expect<Equal<RegionInfo['units'], { width: number; height: number }>>
type _mm = Expect<Equal<RegionInfo['mm'], { width: number; height: number }>>
type _px = Expect<Equal<RegionInfo['px'], { width: number; height: number }>>

// ---- statics on the component --------------------------------------------------------
// Every built-in carries both statics, typed as present - no `?.` needed.
const _viaComponent = GalaxyMockup.info({ variant: 's26' }).regions.screen.px
const _componentRegions = BookMockup.regions
type _regionsPresent = Expect<Equal<undefined extends typeof BookMockup.regions ? true : false, false>>
type _statics = Expect<Has<'info', typeof GalaxyMockup>>
// Required where the kind's props are: the custom panel cannot be measured without a size.
// @ts-expect-error - CustomPanelMockup.info needs a size
CustomPanelMockup.info()
const _panelInfo = CustomPanelMockup.info({ size: { width: 600, height: 900 } })

// ---- the surface hook ----------------------------------------------------------------
function _ScreenContent() {
  const surface: SurfaceInfo = useSurface()
  const maybe: SurfaceInfo | null = useSurfaceOptional()
  return <div style={{ width: surface.width, height: surface.height }}>{maybe?.resolution}</div>
}

// ---- naming: every component's props are `<Name>Props` -------------------------------
type _tvSetProps = Expect<Equal<TVSetProps, TVProps>>
type _doohSize = Expect<Equal<DOOHTotemSize, DoohTotemSize>>
