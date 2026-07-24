import { ID_CARD_FRAMING, ID_CARD_STAGE_OFFSET_Y } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { IDCard, idCardSlots, type IDCardProps } from './objects/id-card/id-card'

export type IDCardMockupProps = MockupProps<IDCardProps>

/**
 * The badge shifted by the core's stage offset so it (card + hook, with the
 * straps running out of the top of the frame) centers on the stage origin —
 * the one wrapper concern the factory can't express. The framing's extent
 * accounts for the same offset.
 */
function StagedIDCard(props: IDCardProps) {
  return (
    <group position={[0, ID_CARD_STAGE_OFFSET_Y, 0]}>
      <IDCard {...props} />
    </group>
  )
}
StagedIDCard.displayName = 'IDCard'

/**
 * The one-liner: a complete, interactive 3D ID badge mockup hanging from its
 * lanyard, with live front (and optionally back) faces.
 *
 * ```tsx
 * <IDCardMockup lanyardColor="#1d4ed8" float>
 *   <IDCardMockup.Front><BadgeFront /></IDCardMockup.Front>
 *   <IDCardMockup.Back><BadgeBack /></IDCardMockup.Back>
 * </IDCardMockup>
 * ```
 *
 * Bare children are shorthand for the front face.
 */
export const IDCardMockup = createMockup({
  object: StagedIDCard,
  framing: ID_CARD_FRAMING,
  slots: idCardSlots,
  displayName: 'IDCardMockup',
})
