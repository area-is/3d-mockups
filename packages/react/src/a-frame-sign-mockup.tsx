import { A_FRAME_SIGN_FRAMING } from '@area-mockups/core'
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
  object: AFrameSign,
  framing: A_FRAME_SIGN_FRAMING,
  slots: aFrameSignSlots,
  displayName: 'AFrameSignMockup',
})
