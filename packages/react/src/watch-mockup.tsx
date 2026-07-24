import { WATCH_FRAMING } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { Watch, watchSlots, type WatchProps } from './devices/watch/watch'

export type WatchMockupProps = MockupProps<WatchProps>

/**
 * The one-liner: a complete, interactive 3D smartwatch mockup — Apple Watch
 * Series 11 or Galaxy Watch 8, wearing a full wristband.
 *
 * ```tsx
 * <WatchMockup variant="watch8" float>
 *   <YourWatchFace />
 * </WatchMockup>
 * ```
 *
 * Wrap children in `<WatchMockup.Screen>` to set per-screen surface props:
 *
 * ```tsx
 * <WatchMockup rotation={[0, 0.25, 0]}>
 *   <WatchMockup.Screen background="#000" resolution={416}>
 *     <YourWatchFace />
 *   </WatchMockup.Screen>
 * </WatchMockup>
 * ```
 */
export const WatchMockup = createMockup({
  object: Watch,
  framing: WATCH_FRAMING,
  slots: watchSlots,
  displayName: 'WatchMockup',
})
