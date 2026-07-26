import { VINYL_RECORD_FRAMING, VINYL_RECORD_REGIONS } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { VinylRecord, vinylRecordSlots, type VinylRecordProps } from './objects/vinyl-record/vinyl-record'

export type VinylRecordMockupProps = MockupProps<VinylRecordProps>

/**
 * The one-liner: a complete, interactive 3D vinyl LP mockup: live cover, back and disc labels.
 *
 * ```tsx
 * <VinylRecordMockup float>
 *   <VinylRecordMockup.Cover><CoverArt /></VinylRecordMockup.Cover>
 *   <VinylRecordMockup.Label><SideALabel /></VinylRecordMockup.Label>
 * </VinylRecordMockup>
 * ```
 *
 * Bare children are shorthand for the jacket front cover.
 */
export const VinylRecordMockup = createMockup({
  kind: 'vinylRecord',
  regions: VINYL_RECORD_REGIONS,
  object: VinylRecord,
  framing: VINYL_RECORD_FRAMING,
  slots: vinylRecordSlots,
  displayName: 'VinylRecordMockup',
})
