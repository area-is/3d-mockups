import { DOOH_TOTEM_FRAMING } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { DOOHTotem, doohTotemSlots, type DOOHTotemProps } from './objects/dooh-totem/dooh-totem'

export type DOOHTotemMockupProps = MockupProps<DOOHTotemProps>

/**
 * The one-liner: a complete, interactive 3D digital street totem with live
 * 9:16 displays on both faces.
 *
 * ```tsx
 * <DOOHTotemMockup rotation={[0, -0.2, 0]}>
 *   <YourCreative />
 *   <DOOHTotemMockup.Back><NightCreative /></DOOHTotemMockup.Back>
 * </DOOHTotemMockup>
 * ```
 *
 * Bare children are shorthand for the front display.
 */
export const DOOHTotemMockup = createMockup({
  object: DOOHTotem,
  framing: DOOH_TOTEM_FRAMING,
  slots: doohTotemSlots,
  displayName: 'DOOHTotemMockup',
})
