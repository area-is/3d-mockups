import { APPLE_WATCH_FRAMING, watchCameraDistance, APPLE_WATCH_DEFAULT_VARIANT, SCREEN_REGIONS, APPLE_WATCH_METRICS } from '@area-3d-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { AppleWatch, watchSlots, type AppleWatchProps } from './devices/watch/watch'

export type AppleWatchMockupProps = MockupProps<AppleWatchProps>

const AppleWatchMockupBase = createMockup({
  kind: 'appleWatch',
  regions: SCREEN_REGIONS,
  metrics: APPLE_WATCH_METRICS,
  object: AppleWatch,
  framing: APPLE_WATCH_FRAMING,
  slots: watchSlots,
})

/**
 * The one-liner: a complete, interactive 3D Apple Watch Series 11 mockup,
 * wearing its seamless Solo Loop.
 *
 * ```tsx
 * <AppleWatchMockup float>
 *   <YourWatchFace />
 * </AppleWatchMockup>
 * ```
 *
 * Wrap children in `<AppleWatchMockup.Screen>` to set per-screen surface props:
 *
 * ```tsx
 * <AppleWatchMockup rotation={[0, 0.25, 0]}>
 *   <AppleWatchMockup.Screen surfaceBackground="#000" resolution={416}>
 *     <YourWatchFace />
 *   </AppleWatchMockup.Screen>
 * </AppleWatchMockup>
 * ```
 */
function AppleWatchMockupImpl({ camera, ...props }: AppleWatchMockupProps) {
  const distance = watchCameraDistance(props.variant ?? APPLE_WATCH_DEFAULT_VARIANT, false)
  return (
    <AppleWatchMockupBase
      {...props}
      camera={camera ?? { position: [0, 0.4, distance], fov: APPLE_WATCH_FRAMING.camera.fov }}
    />
  )
}
AppleWatchMockupImpl.displayName = 'AppleWatchMockup'

export const AppleWatchMockup = Object.assign(AppleWatchMockupImpl, watchSlots, {
  // The shell replaces the base as the export, so it has to carry the
  // base's measurement statics too - otherwise `.info()`/`.regions`
  // silently vanish for this mockup alone.
  info: AppleWatchMockupBase.info,
  regions: AppleWatchMockupBase.regions,
})
