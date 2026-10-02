import { CREDIT_CARD_FRAMING, CREDIT_CARD_REGIONS, CREDIT_CARD_METRICS } from './core'
import { createMockup, type MockupProps } from './create-mockup'
import { CreditCard, creditCardSlots, type CreditCardProps } from './objects/credit-card/credit-card'

export type CreditCardMockupProps = MockupProps<CreditCardProps>

/**
 * The one-liner: a complete, interactive 3D payment card mockup with live
 * front (and optionally back) faces under real hardware - the chip, the
 * embossed number, name and expiry, the stripe and the signature panel.
 *
 * ```tsx
 * <CreditCardMockup number="4000 1234 5678 9010" name="ALEX MORGAN" tipping="gold" float>
 *   <CreditCardMockup.Front><CardFront /></CreditCardMockup.Front>
 *   <CreditCardMockup.Back><CardBack /></CreditCardMockup.Back>
 * </CreditCardMockup>
 * ```
 *
 * Bare children are shorthand for the front face.
 */
export const CreditCardMockup = createMockup({
  kind: 'creditCard',
  regions: CREDIT_CARD_REGIONS,
  metrics: CREDIT_CARD_METRICS,
  object: CreditCard,
  label: '3D mockup of a credit card',
  framing: CREDIT_CARD_FRAMING,
  slots: creditCardSlots,
  displayName: 'CreditCardMockup',
})
