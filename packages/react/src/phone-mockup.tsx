import { PHONE_FRAMING } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { Phone, phoneSlots, type PhoneProps } from './devices/phone/phone'

export type PhoneMockupProps = MockupProps<PhoneProps>

/**
 * The one-liner: a complete, interactive 3D Galaxy-style phone mockup.
 *
 * ```tsx
 * <PhoneMockup autoRotate float>
 *   <YourApp />
 * </PhoneMockup>
 * ```
 *
 * Wrap children in `<PhoneMockup.Screen>` to set per-screen surface props:
 *
 * ```tsx
 * <PhoneMockup variant="s26ultra" rotation={[0, 0.25, 0]}>
 *   <PhoneMockup.Screen background="#000" resolution={720}>
 *     <MusicPlayer />
 *   </PhoneMockup.Screen>
 * </PhoneMockup>
 * ```
 */
export const PhoneMockup = createMockup({
  object: Phone,
  framing: PHONE_FRAMING,
  slots: phoneSlots,
  displayName: 'PhoneMockup',
})
