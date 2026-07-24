import { FLIP_FRAMING } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { Flip, flipSlots, type FlipProps } from './devices/flip/flip'

export type FlipMockupProps = MockupProps<FlipProps>

/**
 * The one-liner: a complete, interactive 3D Galaxy Z Flip mockup. Open by
 * default — your content fills the tall main display.
 *
 * ```tsx
 * <FlipMockup autoRotate float>
 *   <YourApp />
 * </FlipMockup>
 *
 * <FlipMockup open={false}>
 *   <CoverWidget /> {/* folded: content on the square cover screen *\/}
 * </FlipMockup>
 * ```
 *
 * Wrap children in `<FlipMockup.Screen>` to set per-screen surface props:
 *
 * ```tsx
 * <FlipMockup openAngle={100}>
 *   <FlipMockup.Screen background="#000" interactive={false}>
 *     <YourApp />
 *   </FlipMockup.Screen>
 * </FlipMockup>
 * ```
 */
export const FlipMockup = createMockup({
  object: Flip,
  framing: FLIP_FRAMING,
  slots: flipSlots,
  displayName: 'FlipMockup',
})
