import { SHOPPING_BAG_FRAMING } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { ShoppingBag, shoppingBagSlots, type ShoppingBagProps } from './objects/shopping-bag/shopping-bag'

export type ShoppingBagMockupProps = MockupProps<ShoppingBagProps>

/**
 * The one-liner: a complete, interactive 3D shopping-bag mockup with live
 * printed front and back faces.
 *
 * ```tsx
 * <ShoppingBagMockup rotation={[0, 0.35, 0]}>
 *   <YourBagFace />
 *   <ShoppingBagMockup.Back><BackFace /></ShoppingBagMockup.Back>
 * </ShoppingBagMockup>
 * ```
 *
 * Bare children are shorthand for the front face.
 */
export const ShoppingBagMockup = createMockup({
  object: ShoppingBag,
  framing: SHOPPING_BAG_FRAMING,
  slots: shoppingBagSlots,
  displayName: 'ShoppingBagMockup',
})
