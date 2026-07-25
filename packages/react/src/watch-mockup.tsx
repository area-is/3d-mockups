import { WATCH_FRAMING, watchCameraDistance } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { Watch, watchSlots, type WatchProps } from './devices/watch/watch'

export type WatchMockupProps = MockupProps<WatchProps>

// The factory handles everything but the camera: laid out flat, a band is
// several times the height of the worn loop, which the static
// `MockupFraming.camera` cannot express — a thin shell injects it per render.
const WatchMockupBase = createMockup({
  object: Watch,
  framing: WATCH_FRAMING,
  slots: watchSlots,
})

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
function WatchMockupImpl({ camera, ...props }: WatchMockupProps) {
  const distance = watchCameraDistance(props.variant, props.bandOpen ?? false)
  return (
    <WatchMockupBase
      {...props}
      camera={camera ?? { position: [0, 0.4, distance], fov: WATCH_FRAMING.camera.fov }}
    />
  )
}
WatchMockupImpl.displayName = 'WatchMockup'

export const WatchMockup = Object.assign(WatchMockupImpl, watchSlots)
