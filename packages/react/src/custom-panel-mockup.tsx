import { CUSTOM_PANEL_FRAMING } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { CustomPanel, customPanelSlots, type CustomPanelProps } from './objects/custom-panel/custom-panel'

export type CustomPanelMockupProps = MockupProps<CustomPanelProps>

/**
 * The one-liner: a flat rectangular panel mockup at any size you specify
 * in millimeters.
 *
 * ```tsx
 * <CustomPanelMockup size={{ width: 600, height: 900, thickness: 5 }}>
 *   <YourArtwork />
 *   <CustomPanelMockup.Back><BackArtwork /></CustomPanelMockup.Back>
 * </CustomPanelMockup>
 * ```
 *
 * Bare children are shorthand for the front face.
 */
export const CustomPanelMockup = createMockup({
  object: CustomPanel,
  framing: CUSTOM_PANEL_FRAMING,
  slots: customPanelSlots,
  displayName: 'CustomPanelMockup',
})
