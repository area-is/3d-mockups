import { MAILER_BOX_FRAMING, MAILER_BOX_REGIONS, MAILER_BOX_METRICS } from './core'
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
  kind: 'mailerBox',
  regions: MAILER_BOX_REGIONS,
  metrics: MAILER_BOX_METRICS,
  object: MailerBox,
  framing: MAILER_BOX_FRAMING,
  slots: mailerBoxSlots,
  displayName: 'MailerBoxMockup',
})
