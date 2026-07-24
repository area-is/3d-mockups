import { POSTER_FRAME_FRAMING } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { PosterFrame, posterFrameSlots, type PosterFrameProps } from './objects/poster-frame/poster-frame'

export type PosterFrameMockupProps = MockupProps<PosterFrameProps>

/**
 * The one-liner: a complete, interactive 3D gallery poster frame mockup with
 * a live 18" x 24" sheet.
 *
 * ```tsx
 * <PosterFrameMockup color="#22262e">
 *   <PosterFrameMockup.Poster><YourPosterArt /></PosterFrameMockup.Poster>
 * </PosterFrameMockup>
 * ```
 *
 * Bare children are shorthand for the poster.
 */
export const PosterFrameMockup = createMockup({
  object: PosterFrame,
  framing: POSTER_FRAME_FRAMING,
  slots: posterFrameSlots,
  displayName: 'PosterFrameMockup',
})
