import { GALAXY_FRAMING, SCREEN_REGIONS, GALAXY_METRICS } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { Galaxy, galaxySlots, type GalaxyProps } from './devices/galaxy/galaxy'

export type GalaxyMockupProps = MockupProps<GalaxyProps>

/**
 * The one-liner: a complete, interactive 3D Galaxy-style phone mockup.
 *
 * ```tsx
 * <GalaxyMockup autoRotate float>
 *   <YourApp />
 * </GalaxyMockup>
 * ```
 *
 * Wrap children in `<GalaxyMockup.Screen>` to set per-screen surface props:
 *
 * ```tsx
 * <GalaxyMockup variant="s26ultra" rotation={[0, 0.25, 0]}>
 *   <GalaxyMockup.Screen background="#000" resolution={720}>
 *     <MusicPlayer />
 *   </GalaxyMockup.Screen>
 * </GalaxyMockup>
 * ```
 */
export const GalaxyMockup = createMockup({
  kind: 'galaxy',
  regions: SCREEN_REGIONS,
  metrics: GALAXY_METRICS,
  object: Galaxy,
  framing: GALAXY_FRAMING,
  slots: galaxySlots,
  displayName: 'GalaxyMockup',
})
