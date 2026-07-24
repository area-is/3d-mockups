import { VAN_FRAMING } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { Van, vanSlots, type VanProps } from './objects/van/van'

export type VanMockupProps = MockupProps<VanProps>

/**
 * The one-liner: a complete, interactive 3D cargo van mockup with live
 * vinyl-wrap surfaces on both sides and the rear doors.
 *
 * ```tsx
 * <VanMockup rotation={[0, -0.4, 0]}>
 *   <YourLivery />
 *   <VanMockup.Rear><RearDoors /></VanMockup.Rear>
 *   <VanMockup.LicensePlate>AREA 51</VanMockup.LicensePlate>
 * </VanMockup>
 * ```
 *
 * Bare children are shorthand for the curb-side wrap panel.
 */
export const VanMockup = createMockup({
  object: Van,
  framing: VAN_FRAMING,
  slots: vanSlots,
  displayName: 'VanMockup',
})
