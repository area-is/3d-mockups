import { BROCHURE_FRAMING, BROCHURE_REGIONS, BROCHURE_METRICS } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { Brochure, brochureSlots, type BrochureProps } from './objects/brochure/brochure'

export type BrochureMockupProps = MockupProps<BrochureProps>

/**
 * The one-liner: a complete, interactive 3D standing tri-fold brochure mockup
 * with three live panels per side.
 *
 * ```tsx
 * <BrochureMockup>
 *   <BrochureMockup.FrontLeft><Cover /></BrochureMockup.FrontLeft>
 *   <BrochureMockup.FrontCenter><Middle /></BrochureMockup.FrontCenter>
 *   <BrochureMockup.BackLeft><Map /></BrochureMockup.BackLeft>
 * </BrochureMockup>
 * ```
 *
 * Bare children are shorthand for `FrontLeft`.
 */
export const BrochureMockup = createMockup({
  kind: 'brochure',
  regions: BROCHURE_REGIONS,
  metrics: BROCHURE_METRICS,
  object: Brochure,
  framing: BROCHURE_FRAMING,
  slots: brochureSlots,
  displayName: 'BrochureMockup',
})
