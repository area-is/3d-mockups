import { SEMI_TRAILER_FRAMING } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { SemiTrailer, semiTrailerSlots, type SemiTrailerProps } from './objects/semi-trailer/semi-trailer'

export type SemiTrailerMockupProps = MockupProps<SemiTrailerProps>

/**
 * The one-liner: a complete, interactive 3D semi-trailer mockup with live
 * wrap panels on both sides and the rear doors.
 *
 * ```tsx
 * <SemiTrailerMockup rotation={[0, -0.35, 0]}>
 *   <YourWrap />
 *   <SemiTrailerMockup.Rear><RearDoors /></SemiTrailerMockup.Rear>
 * </SemiTrailerMockup>
 * ```
 *
 * Bare children are shorthand for the curb-side panel.
 */
export const SemiTrailerMockup = createMockup({
  object: SemiTrailer,
  framing: SEMI_TRAILER_FRAMING,
  slots: semiTrailerSlots,
  displayName: 'SemiTrailerMockup',
})
