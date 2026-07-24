import { CUSTOM_BOX_FRAMING } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { CustomBox, customBoxSlots, type CustomBoxProps } from './objects/custom-box/custom-box'

export type CustomBoxMockupProps = MockupProps<CustomBoxProps>

/**
 * The one-liner: a rectangular box mockup at any size you specify in
 * millimeters, with all six faces printable.
 *
 * ```tsx
 * <CustomBoxMockup size={{ width: 250, height: 90, depth: 160 }}>
 *   <YourFront />
 *   <CustomBoxMockup.Top><YourLid /></CustomBoxMockup.Top>
 * </CustomBoxMockup>
 * ```
 *
 * Bare children are shorthand for the front face.
 */
export const CustomBoxMockup = createMockup({
  object: CustomBox,
  framing: CUSTOM_BOX_FRAMING,
  slots: customBoxSlots,
  displayName: 'CustomBoxMockup',
})
