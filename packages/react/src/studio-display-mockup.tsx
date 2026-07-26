import { STUDIO_DISPLAY_FRAMING, SCREEN_REGIONS } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { StudioDisplay, studioDisplaySlots, type StudioDisplayProps } from './devices/studio-display/studio-display'

export type StudioDisplayMockupProps = MockupProps<StudioDisplayProps>

/**
 * The one-liner: a complete, interactive 3D Studio Display-style monitor mockup.
 *
 * ```tsx
 * <StudioDisplayMockup>
 *   <YourApp />
 * </StudioDisplayMockup>
 * ```
 *
 * Wrap children in `<StudioDisplayMockup.Screen>` to set per-screen surface props:
 *
 * ```tsx
 * <StudioDisplayMockup autoRotate>
 *   <StudioDisplayMockup.Screen background="#0b0d12" resolution={1920}>
 *     <Dashboard />
 *   </StudioDisplayMockup.Screen>
 * </StudioDisplayMockup>
 * ```
 */
export const StudioDisplayMockup = createMockup({
  kind: 'studioDisplay',
  regions: SCREEN_REGIONS,
  object: StudioDisplay,
  framing: STUDIO_DISPLAY_FRAMING,
  slots: studioDisplaySlots,
  displayName: 'StudioDisplayMockup',
})
