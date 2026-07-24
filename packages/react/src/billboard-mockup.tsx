import { BILLBOARD_FRAMING, BILLBOARD_STAGE_OFFSET_Y } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { Billboard, billboardSlots, type BillboardProps } from './objects/billboard/billboard'

export type BillboardMockupProps = MockupProps<BillboardProps>

/**
 * The billboard lifted by the core's stage offset so it (face + pole) stays
 * visually centered on the stage origin the camera and shadow are tuned
 * for — the one wrapper concern the factory can't express. The framing's
 * extent accounts for the same offset.
 */
function StagedBillboard(props: BillboardProps) {
  return (
    <group position={[0, BILLBOARD_STAGE_OFFSET_Y, 0]}>
      <Billboard {...props} />
    </group>
  )
}
StagedBillboard.displayName = 'Billboard'

/**
 * The one-liner: a complete, interactive 3D highway bulletin mockup with a
 * live 14' x 48' face.
 *
 * ```tsx
 * <BillboardMockup rotation={[0, -0.2, 0]}>
 *   <BillboardMockup.Face><YourCreative /></BillboardMockup.Face>
 * </BillboardMockup>
 * ```
 *
 * Bare children are shorthand for the face.
 */
export const BillboardMockup = createMockup({
  object: StagedBillboard,
  framing: BILLBOARD_FRAMING,
  slots: billboardSlots,
  displayName: 'BillboardMockup',
})
