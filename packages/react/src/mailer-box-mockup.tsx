import { MAILER_BOX_FRAMING } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { MailerBox, mailerBoxSlots, type MailerBoxProps } from './objects/mailer-box/mailer-box'

export type MailerBoxMockupProps = MockupProps<MailerBoxProps>

/**
 * The one-liner: a complete, interactive 3D shipping-box mockup with live
 * printed panels under real-feeling packing tape.
 *
 * ```tsx
 * <MailerBoxMockup>
 *   <YourTopPanel />
 *   <MailerBoxMockup.Front><YourSidePanel /></MailerBoxMockup.Front>
 * </MailerBoxMockup>
 * ```
 *
 * Bare children are shorthand for the top panel.
 */
export const MailerBoxMockup = createMockup({
  object: MailerBox,
  framing: MAILER_BOX_FRAMING,
  slots: mailerBoxSlots,
  displayName: 'MailerBoxMockup',
})
