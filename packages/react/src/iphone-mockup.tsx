import { IPHONE_FRAMING } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { IPhone, iPhoneSlots, type IPhoneProps } from './devices/iphone/iphone'

export type IPhoneMockupProps = MockupProps<IPhoneProps>

/**
 * The one-liner: a complete, interactive 3D iPhone mockup.
 *
 * ```tsx
 * <IPhoneMockup variant="promax" autoRotate float>
 *   <YourApp />
 * </IPhoneMockup>
 * ```
 *
 * Wrap children in `<IPhoneMockup.Screen>` to set per-screen surface props:
 *
 * ```tsx
 * <IPhoneMockup variant="pro" rotation={[0, 0.25, 0]}>
 *   <IPhoneMockup.Screen background="#000" resolution={860}>
 *     <MusicPlayer />
 *   </IPhoneMockup.Screen>
 * </IPhoneMockup>
 * ```
 */
export const IPhoneMockup = createMockup({
  object: IPhone,
  framing: IPHONE_FRAMING,
  slots: iPhoneSlots,
  displayName: 'IPhoneMockup',
})
