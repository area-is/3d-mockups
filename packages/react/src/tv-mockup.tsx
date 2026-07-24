import * as React from 'react'
import { TV_FRAMING, tvCameraFraming } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { TVSet, tvSetSlots, type TVProps } from './objects/tv/tv'

export type TVSetMockupProps = MockupProps<TVProps>

// The factory handles everything but the camera: the TV's default camera
// pulls back with the diagonal (`tvCameraFraming`), which the static
// `MockupFraming.camera` cannot express — a thin shell injects it per render.
const TVSetMockupBase = createMockup({
  object: TVSet,
  framing: TV_FRAMING,
  slots: tvSetSlots,
})

/**
 * The one-liner: a complete, interactive 3D 65-inch TV mockup with a live 1920x1080 screen.
 *
 * ```tsx
 * <TVSetMockup>
 *   <YourShowreel />
 * </TVSetMockup>
 * ```
 *
 * Wrap children in `<TVSetMockup.Screen>` to set per-screen surface props:
 *
 * ```tsx
 * <TVSetMockup size={85}>
 *   <TVSetMockup.Screen background="#000" resolution={1280}>
 *     <YourShowreel />
 *   </TVSetMockup.Screen>
 * </TVSetMockup>
 * ```
 */
function TVSetMockupImpl({ camera, ...props }: TVSetMockupProps) {
  const framed = tvCameraFraming(props.size)
  return (
    <TVSetMockupBase
      {...props}
      camera={
        camera ?? { position: [...framed.position] as [number, number, number], fov: framed.fov }
      }
    />
  )
}
TVSetMockupImpl.displayName = 'TVSetMockup'

export const TVSetMockup = Object.assign(TVSetMockupImpl, tvSetSlots)
