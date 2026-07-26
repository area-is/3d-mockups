import { TABLET_FRAMING } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { IPad, tabletSlots, type IPadProps } from './devices/tablet/tablet'

export type IPadMockupProps = MockupProps<IPadProps>

/**
 * The one-liner: a complete, interactive 3D iPad mockup.
 *
 * ```tsx
 * <IPadMockup orientation="landscape" float>
 *   <YourApp />
 * </IPadMockup>
 * ```
 *
 * Wrap children in `<IPadMockup.Screen>` to set per-screen surface props:
 *
 * ```tsx
 * <IPadMockup variant="ipadair11" rotation={[0, 0.25, 0]}>
 *   <IPadMockup.Screen surfaceBackground="#000" resolution={1180}>
 *     <Dashboard />
 *   </IPadMockup.Screen>
 * </IPadMockup>
 * ```
 */
export const IPadMockup = createMockup({
  object: IPad,
  framing: TABLET_FRAMING,
  slots: tabletSlots,
  displayName: 'IPadMockup',
})
