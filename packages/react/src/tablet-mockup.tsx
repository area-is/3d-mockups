import { TABLET_FRAMING, TABLET_ULTRA_CAMERA } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { Tablet, tabletSlots, type TabletProps } from './devices/tablet/tablet'

export type TabletMockupProps = MockupProps<TabletProps>

const TabletMockupBase = createMockup({
  object: Tablet,
  framing: TABLET_FRAMING,
  slots: tabletSlots,
  displayName: 'TabletMockup',
})

function TabletMockupImpl({ camera, ...props }: TabletMockupProps) {
  // The framing's camera is the iPad-class pose; the 14.6" Tab Ultra needs a
  // bit more room, which a static framing can't express per variant.
  return (
    <TabletMockupBase
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
TabletMockupImpl.displayName = 'TabletMockup'

/**
 * The one-liner: a complete, interactive 3D iPad Pro-style tablet mockup.
 *
 * ```tsx
 * <TabletMockup orientation="landscape" float>
 *   <YourApp />
 * </TabletMockup>
 * ```
 *
 * Wrap children in `<TabletMockup.Screen>` to set per-screen surface props:
 *
 * ```tsx
 * <TabletMockup variant="tabs11ultra" rotation={[0, 0.25, 0]}>
 *   <TabletMockup.Screen background="#000" resolution={1480}>
 *     <Dashboard />
 *   </TabletMockup.Screen>
 * </TabletMockup>
 * ```
 */
export const TabletMockup = Object.assign(TabletMockupImpl, tabletSlots)
