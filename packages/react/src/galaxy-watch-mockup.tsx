import { WATCH_FRAMING, watchCameraDistance, GALAXY_WATCH_DEFAULT_VARIANT } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { GalaxyWatch, watchSlots, type GalaxyWatchProps } from './devices/watch/watch'

export type GalaxyWatchMockupProps = MockupProps<GalaxyWatchProps>

// The factory handles everything but the camera: laid out flat, a band is
// several times the height of the worn loop, which the static
// `MockupFraming.camera` cannot express — a thin shell injects it per render.
const GalaxyWatchMockupBase = createMockup({
  object: GalaxyWatch,
  framing: WATCH_FRAMING,
  slots: watchSlots,
})

/**
 * The one-liner: a complete, interactive 3D Galaxy Watch 8 mockup, wearing its
 * buckled band — worn on the wrist, or laid open with `bandOpen`.
 *
 * ```tsx
 * <GalaxyWatchMockup float>
 *   <YourWatchFace />
 * </GalaxyWatchMockup>
 * ```
 *
 * Wrap children in `<GalaxyWatchMockup.Screen>` to set per-screen surface props:
 *
 * ```tsx
 * <GalaxyWatchMockup rotation={[0, 0.25, 0]}>
 *   <GalaxyWatchMockup.Screen background="#000" resolution={480}>
 *     <YourWatchFace />
 *   </GalaxyWatchMockup.Screen>
 * </GalaxyWatchMockup>
 * ```
 */
function GalaxyWatchMockupImpl({ camera, ...props }: GalaxyWatchMockupProps) {
  const distance = watchCameraDistance(
    props.variant ?? GALAXY_WATCH_DEFAULT_VARIANT,
    props.bandOpen ?? false
  )
  return (
    <GalaxyWatchMockupBase
      {...props}
      camera={camera ?? { position: [0, 0.4, distance], fov: WATCH_FRAMING.camera.fov }}
    />
  )
}
GalaxyWatchMockupImpl.displayName = 'GalaxyWatchMockup'

export const GalaxyWatchMockup = Object.assign(GalaxyWatchMockupImpl, watchSlots)
