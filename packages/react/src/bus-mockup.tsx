import { BUS_FRAMING } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { Bus, busSlots, type BusProps } from './objects/bus/bus'

export type BusMockupProps = MockupProps<BusProps>

/**
 * The one-liner: a complete, interactive 3D city transit bus mockup with
 * live ad surfaces on both sides and the tail, plus a live LED destination
 * sign.
 *
 * ```tsx
 * <BusMockup rotation={[0, -0.4, 0]}>
 *   <YourCreative />
 *   <BusMockup.DestinationSign>52 DOWNTOWN</BusMockup.DestinationSign>
 * </BusMockup>
 * ```
 *
 * Bare children are shorthand for the curb-side ad surface.
 */
export const BusMockup = createMockup({
  object: Bus,
  framing: BUS_FRAMING,
  slots: busSlots,
  displayName: 'BusMockup',
})
