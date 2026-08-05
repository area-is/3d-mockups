import { GALAXY_WATCH_FRAMING, watchCameraDistance, GALAXY_WATCH_DEFAULT_VARIANT, SCREEN_REGIONS, GALAXY_WATCH_METRICS } from '@area-3d-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { GalaxyWatch, watchSlots, type GalaxyWatchProps } from './devices/watch/watch'

export type GalaxyWatchMockupProps = MockupProps<GalaxyWatchProps>

// The factory handles everything but the camera: laid out flat, a band is
// several times the height of the worn loop, which the static
// `MockupFraming.camera` cannot express - a thin shell injects it per render.
const GalaxyWatchMockupBase = createMockup({
  kind: 'galaxyWatch',
  regions: SCREEN_REGIONS,
  metrics: GALAXY_WATCH_METRICS,
  object: GalaxyWatch,
  framing: GALAXY_WATCH_FRAMING,
  slots: watchSlots,
})

/**
 * The one-liner: a complete, interactive 3D Galaxy Watch 8 mockup, wearing its
 * buckled band - worn on the wrist, or laid open with `bandOpen`.
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
 *   <GalaxyWatchMockup.Screen surfaceBackground="#000" resolution={480}>
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
      camera={camera ?? { position: [0, 0.4, distance], fov: GALAXY_WATCH_FRAMING.camera.fov }}
    />
  )
}
GalaxyWatchMockupImpl.displayName = 'GalaxyWatchMockup'

export const GalaxyWatchMockup = Object.assign(GalaxyWatchMockupImpl, watchSlots, {
  // The shell replaces the base as the export, so it has to carry the
  // base's measurement statics too - otherwise `.info()`/`.regions`
  // silently vanish for this mockup alone.
  info: GalaxyWatchMockupBase.info,
  regions: GalaxyWatchMockupBase.regions,
})
