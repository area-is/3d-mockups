import { LAPTOP_FRAMING } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { Laptop, laptopSlots, type LaptopProps } from './devices/laptop/laptop'

export type LaptopMockupProps = MockupProps<LaptopProps>

/**
 * The one-liner: a complete, interactive 3D MacBook Air-style laptop mockup.
 *
 * ```tsx
 * <LaptopMockup float>
 *   <YourApp />
 * </LaptopMockup>
 * ```
 *
 * Wrap children in `<LaptopMockup.Screen>` to set per-screen surface props:
 *
 * ```tsx
 * <LaptopMockup variant="pro14" openAngle={100}>
 *   <LaptopMockup.Screen background="#000" resolution={1512}>
 *     <Dashboard />
 *   </LaptopMockup.Screen>
 * </LaptopMockup>
 * ```
 */
export const LaptopMockup = createMockup({
  object: Laptop,
  framing: LAPTOP_FRAMING,
  slots: laptopSlots,
  displayName: 'LaptopMockup',
})
