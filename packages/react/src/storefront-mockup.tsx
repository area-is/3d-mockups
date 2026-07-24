import { STOREFRONT_FRAMING } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { Storefront, storefrontSlots, type StorefrontProps } from './objects/storefront/storefront'

export type StorefrontMockupProps = MockupProps<StorefrontProps>

/**
 * The one-liner: a complete, interactive free-standing 3D shop mockup with
 * live fascia signs on all four glazed elevations plus every big window pane.
 *
 * ```tsx
 * <StorefrontMockup>
 *   <YourSign />
 *   <StorefrontMockup.FrontLeft><YourPoster /></StorefrontMockup.FrontLeft>
 *   <StorefrontMockup.RearSign><YourSign /></StorefrontMockup.RearSign>
 * </StorefrontMockup>
 * ```
 *
 * Bare children are shorthand for the front fascia sign.
 */
export const StorefrontMockup = createMockup({
  object: Storefront,
  framing: STOREFRONT_FRAMING,
  slots: storefrontSlots,
  displayName: 'StorefrontMockup',
})
