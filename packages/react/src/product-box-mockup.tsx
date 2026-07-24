import { PRODUCT_BOX_FRAMING } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { ProductBox, productBoxSlots, type ProductBoxProps } from './objects/product-box/product-box'

export type ProductBoxMockupProps = MockupProps<ProductBoxProps>

/**
 * The one-liner: a complete, interactive 3D product carton mockup with all
 * six panels live.
 *
 * ```tsx
 * <ProductBoxMockup rotation={[0, -0.5, 0]}>
 *   <FrontPanel />
 *   <ProductBoxMockup.Right><SidePanel /></ProductBoxMockup.Right>
 *   <ProductBoxMockup.Top><TopPanel /></ProductBoxMockup.Top>
 * </ProductBoxMockup>
 * ```
 *
 * Bare children are shorthand for the front panel.
 */
export const ProductBoxMockup = createMockup({
  object: ProductBox,
  framing: PRODUCT_BOX_FRAMING,
  slots: productBoxSlots,
  displayName: 'ProductBoxMockup',
})
