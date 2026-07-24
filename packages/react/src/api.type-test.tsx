/**
 * Compile-time contract tests for the public API. Nothing here runs — the
 * file only has to typecheck (`npm run typecheck`), pinning the shapes an API
 * refactor must not silently change. It is not part of the published bundle
 * (only `index.ts`/`core.ts` are tsup entries).
 */
import * as React from 'react'
import {
  AFrameSignMockup,
  type AFrameSignMockupProps,
  AFrameSign,
  type AFrameSignProps,
  BrochureMockup,
  CustomBoxMockup,
  type CustomBoxMockupProps,
  IPhoneMockup,
  PhoneMockup,
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
type _slotShape = Expect<
  Equal<keyof SurfaceProps, 'background' | 'resolution' | 'interactive' | 'dragToRotate' | 'style'>
>
type _slotChildren = Expect<Has<'children', SlotProps>>

// ---- wrappers merge stage + object props, and transforms are first-class -------------
type _stageProps = Expect<Has<'autoRotate', AFrameSignMockupProps>>
type _transformProps = Expect<Has<'rotation', AFrameSignMockupProps>>
type _floatProp = Expect<Has<'float', AFrameSignMockupProps>>
type _sizeRequired = Expect<Equal<CustomBoxMockupProps['size'], { width: number; height: number; depth: number }>>
type _mockupPropsRoundtrip = Expect<Equal<MockupProps<AFrameSignProps>, AFrameSignMockupProps>>

// ---- compound slots exist on both the mockup and the raw scene component -------------
const _slotsUsage = (
  <>
    <AFrameSignMockup autoRotate autoRotateSpeed={0.8} rotation={[0, 0.25, 0]}>
      <AFrameSignMockup.Front background="#20241f">
        <div />
      </AFrameSignMockup.Front>
      <AFrameSignMockup.Back resolution={640} interactive={false}>
        <div />
      </AFrameSignMockup.Back>
    </AFrameSignMockup>

    <AFrameSign>
      <AFrameSign.Front>
        <div />
      </AFrameSign.Front>
    </AFrameSign>

    {/* bare children stay the primary-region shorthand */}
    <PhoneMockup float>
      <div />
    </PhoneMockup>

    <IPhoneMockup variant="pro">
      <IPhoneMockup.Screen background="#000" resolution={860}>
        <div />
      </IPhoneMockup.Screen>
    </IPhoneMockup>

    <CustomBoxMockup size={{ width: 250, height: 90, depth: 160 }}>
      <div />
      <CustomBoxMockup.Top background="#111">
        <div />
      </CustomBoxMockup.Top>
    </CustomBoxMockup>

    {/* repeating slots collect in document order; back side via `side` */}
    <BrochureMockup>
      <BrochureMockup.Panel>
        <div />
      </BrochureMockup.Panel>
      <BrochureMockup.Panel side="back">
        <div />
      </BrochureMockup.Panel>
    </BrochureMockup>
  </>
)

// @ts-expect-error — a mockup must reject a slot region it does not have
const _wrongSlot = <CustomBoxMockup size={{ width: 1, height: 1, depth: 1 }}>{CustomBoxMockup.Spine}</CustomBoxMockup>

// @ts-expect-error — Panel's `side` only accepts front | back
const _wrongSide = <BrochureMockup.Panel side="top" />
