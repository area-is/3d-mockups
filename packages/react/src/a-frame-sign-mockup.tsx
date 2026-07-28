import { A_FRAME_SIGN_FRAMING, A_FRAME_SIGN_REGIONS, A_FRAME_SIGN_METRICS } from '@area-3d-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { AFrameSign, aFrameSignSlots, type AFrameSignProps } from './objects/a-frame-sign/a-frame-sign'

export type AFrameSignMockupProps = MockupProps<AFrameSignProps>

/**
 * The one-liner: a complete, interactive 3D sidewalk A-frame sign with two
 * live panels.
 *
 * ```tsx
 * <AFrameSignMockup>
 *   <AFrameSignMockup.Front><MenuBoard /></AFrameSignMockup.Front>
 *   <AFrameSignMockup.Back><HoursBoard /></AFrameSignMockup.Back>
 * </AFrameSignMockup>
 * ```
 *
 * Bare children are shorthand for the front panel.
 */
export const AFrameSignMockup = createMockup({
  kind: 'aFrameSign',
  regions: A_FRAME_SIGN_REGIONS,
  metrics: A_FRAME_SIGN_METRICS,
  object: AFrameSign,
  framing: A_FRAME_SIGN_FRAMING,
  slots: aFrameSignSlots,
  displayName: 'AFrameSignMockup',
})
