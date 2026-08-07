import { MILK_CARTON_FRAMING, MILK_CARTON_REGIONS, MILK_CARTON_METRICS } from '@area-3d-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { MilkCarton, milkCartonSlots, type MilkCartonProps } from './objects/milk-carton/milk-carton'

export type MilkCartonMockupProps = MockupProps<MilkCartonProps>

/**
 * The one-liner: a complete, interactive 3D gable-top carton mockup with live
 * printed panels on every wall and both roof slopes.
 *
 * ```tsx
 * <MilkCartonMockup>
 *   <YourFrontPanel />
 *   <MilkCartonMockup.Right><NutritionPanel /></MilkCartonMockup.Right>
 * </MilkCartonMockup>
 * ```
 *
 * Bare children are shorthand for the front panel.
 */
export const MilkCartonMockup = createMockup({
  kind: 'milkCarton',
  regions: MILK_CARTON_REGIONS,
  metrics: MILK_CARTON_METRICS,
  object: MilkCarton,
  framing: MILK_CARTON_FRAMING,
  slots: milkCartonSlots,
  displayName: 'MilkCartonMockup',
})
