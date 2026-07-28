import { BUS_SHELTER_FRAMING, BUS_SHELTER_REGIONS, BUS_SHELTER_METRICS } from '@area-3d-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { BusShelter, busShelterSlots, type BusShelterProps } from './objects/bus-shelter/bus-shelter'

export type BusShelterMockupProps = MockupProps<BusShelterProps>

/**
 * The one-liner: a complete, interactive 3D transit shelter mockup with a
 * backlit live 6-sheet and an RTPI arrivals board.
 *
 * ```tsx
 * <BusShelterMockup rotation={[0, 0.6, 0]}>
 *   <BusShelterMockup.Poster><YourPoster /></BusShelterMockup.Poster>
 *   <BusShelterMockup.Arrivals>{['12  City Centre  3 min']}</BusShelterMockup.Arrivals>
 * </BusShelterMockup>
 * ```
 *
 * Bare children are shorthand for the outward 6-sheet poster.
 */
export const BusShelterMockup = createMockup({
  kind: 'busShelter',
  regions: BUS_SHELTER_REGIONS,
  metrics: BUS_SHELTER_METRICS,
  object: BusShelter,
  framing: BUS_SHELTER_FRAMING,
  slots: busShelterSlots,
  displayName: 'BusShelterMockup',
})
