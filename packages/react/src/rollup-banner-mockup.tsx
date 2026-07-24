import { ROLLUP_BANNER_FRAMING, ROLLUP_BANNER_STAGE_OFFSET_Y } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { RollupBanner, rollupBannerSlots, type RollupBannerProps } from './objects/rollup-banner/rollup-banner'

export type RollupBannerMockupProps = MockupProps<RollupBannerProps>

/**
 * The stand lifted by the core's stage offset so it (graphic + cassette)
 * stays visually centered on the stage origin — the one wrapper concern the
 * factory can't express. The framing's extent accounts for the same offset.
 */
function StagedRollupBanner(props: RollupBannerProps) {
  return (
    <group position={[0, ROLLUP_BANNER_STAGE_OFFSET_Y, 0]}>
      <RollupBanner {...props} />
    </group>
  )
}
StagedRollupBanner.displayName = 'RollupBanner'

/**
 * The one-liner: a complete, interactive 3D roll-up banner stand mockup with
 * a live 850x2000 graphic.
 *
 * ```tsx
 * <RollupBannerMockup rotation={[0, 0.2, 0]}>
 *   <RollupBannerMockup.Banner><YourBannerArt /></RollupBannerMockup.Banner>
 * </RollupBannerMockup>
 * ```
 *
 * Bare children are shorthand for the banner graphic.
 */
export const RollupBannerMockup = createMockup({
  object: StagedRollupBanner,
  framing: ROLLUP_BANNER_FRAMING,
  slots: rollupBannerSlots,
  displayName: 'RollupBannerMockup',
})
