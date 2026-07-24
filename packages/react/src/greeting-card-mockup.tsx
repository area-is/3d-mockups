import { GREETING_CARD_FRAMING } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { GreetingCard, greetingCardSlots, type GreetingCardProps } from './objects/greeting-card/greeting-card'

export type GreetingCardMockupProps = MockupProps<GreetingCardProps>

/**
 * The one-liner: a complete, interactive 3D standing greeting card with four live faces.
 *
 * ```tsx
 * <GreetingCardMockup>
 *   <GreetingCardMockup.Front><Cover /></GreetingCardMockup.Front>
 *   <GreetingCardMockup.InsideLeft><Note /></GreetingCardMockup.InsideLeft>
 *   <GreetingCardMockup.InsideRight><Art /></GreetingCardMockup.InsideRight>
 * </GreetingCardMockup>
 * ```
 *
 * Bare children are shorthand for the front cover.
 */
export const GreetingCardMockup = createMockup({
  object: GreetingCard,
  framing: GREETING_CARD_FRAMING,
  slots: greetingCardSlots,
  displayName: 'GreetingCardMockup',
})
