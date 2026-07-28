import { MAGAZINE_FRAMING, MAGAZINE_REGIONS, MAGAZINE_METRICS } from '@area-3d-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { Magazine, magazineSlots, type MagazineProps } from './objects/magazine/magazine'

export type MagazineMockupProps = MockupProps<MagazineProps>

/**
 * The one-liner: a complete, interactive 3D glossy magazine mockup with a
 * live full-bleed cover, back cover and spine.
 *
 * ```tsx
 * <MagazineMockup float>
 *   <MagazineMockup.Cover><CoverArt /></MagazineMockup.Cover>
 *   <MagazineMockup.Back><BackAd /></MagazineMockup.Back>
 * </MagazineMockup>
 * ```
 *
 * Bare children are shorthand for the front cover.
 */
export const MagazineMockup = createMockup({
  kind: 'magazine',
  regions: MAGAZINE_REGIONS,
  metrics: MAGAZINE_METRICS,
  object: Magazine,
  framing: MAGAZINE_FRAMING,
  slots: magazineSlots,
  displayName: 'MagazineMockup',
})
