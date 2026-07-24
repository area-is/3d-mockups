import { BUSINESS_CARD_FRAMING } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { BusinessCard, businessCardSlots, type BusinessCardProps } from './objects/business-card/business-card'

export type BusinessCardMockupProps = MockupProps<BusinessCardProps>

/**
 * The one-liner: a complete, interactive 3D business card mockup with live
 * front (and optionally back) faces.
 *
 * ```tsx
 * <BusinessCardMockup float>
 *   <BusinessCardMockup.Front><CardFront /></BusinessCardMockup.Front>
 *   <BusinessCardMockup.Back><CardBack /></BusinessCardMockup.Back>
 * </BusinessCardMockup>
 * ```
 *
 * Bare children are shorthand for the front face.
 */
export const BusinessCardMockup = createMockup({
  object: BusinessCard,
  framing: BUSINESS_CARD_FRAMING,
  slots: businessCardSlots,
  displayName: 'BusinessCardMockup',
})
