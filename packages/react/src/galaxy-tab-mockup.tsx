import { TABLET_FRAMING, TABLET_ULTRA_CAMERA } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { GalaxyTab, tabletSlots, type GalaxyTabProps } from './devices/tablet/tablet'

export type GalaxyTabMockupProps = MockupProps<GalaxyTabProps>

const GalaxyTabMockupBase = createMockup({
  object: GalaxyTab,
  framing: TABLET_FRAMING,
  slots: tabletSlots,
})

/**
 * The one-liner: a complete, interactive 3D Galaxy Tab S11 mockup.
 *
 * ```tsx
 * <GalaxyTabMockup orientation="landscape" float>
 *   <YourApp />
 * </GalaxyTabMockup>
 * ```
 *
 * Wrap children in `<GalaxyTabMockup.Screen>` to set per-screen surface props:
 *
 * ```tsx
 * <GalaxyTabMockup variant="tabs11ultra" rotation={[0, 0.25, 0]}>
 *   <GalaxyTabMockup.Screen background="#000" resolution={1480}>
 *     <Dashboard />
 *   </GalaxyTabMockup.Screen>
 * </GalaxyTabMockup>
 * ```
 */
function GalaxyTabMockupImpl({ camera, ...props }: GalaxyTabMockupProps) {
  // The framing's camera is the iPad-class pose; the 14.6" Tab Ultra needs a
  // bit more room, which a static framing can't express per variant.
  return (
    <GalaxyTabMockupBase
      {...props}
      camera={
        camera ??
        (props.variant === 'tabs11ultra'
          ? {
              position: [...TABLET_ULTRA_CAMERA.position] as [number, number, number],
              fov: TABLET_ULTRA_CAMERA.fov,
            }
          : undefined)
      }
    />
  )
}
GalaxyTabMockupImpl.displayName = 'GalaxyTabMockup'

export const GalaxyTabMockup = Object.assign(GalaxyTabMockupImpl, tabletSlots)
