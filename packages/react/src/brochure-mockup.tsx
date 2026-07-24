import { BROCHURE_FRAMING } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { Brochure, brochureSlots, type BrochureProps } from './objects/brochure/brochure'

export type BrochureMockupProps = MockupProps<BrochureProps>

/**
 * The one-liner: a complete, interactive 3D standing tri-fold brochure mockup
 * with three live panels per side.
 *
 * ```tsx
 * <BrochureMockup>
 *   <BrochureMockup.Panel><Front /></BrochureMockup.Panel>
 *   <BrochureMockup.Panel><Middle /></BrochureMockup.Panel>
 *   <BrochureMockup.Panel side="back"><Back /></BrochureMockup.Panel>
 * </BrochureMockup>
 * ```
 *
 * Bare children are shorthand for the first (left) front panel.
 */
export const BrochureMockup = createMockup({
  object: Brochure,
  framing: BROCHURE_FRAMING,
  slots: brochureSlots,
  displayName: 'BrochureMockup',
})
