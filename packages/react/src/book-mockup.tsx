import { BOOK_FRAMING } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { Book, bookSlots, type BookProps } from './objects/book/book'

export type BookMockupProps = MockupProps<BookProps>

/**
 * The one-liner: a complete, interactive 3D hardcover book mockup with a live
 * full-bleed cover, back cover and spine.
 *
 * ```tsx
 * <BookMockup color="#1f3a5f" float>
 *   <BookMockup.Cover><CoverArt /></BookMockup.Cover>
 *   <BookMockup.Spine><SpineTitle /></BookMockup.Spine>
 * </BookMockup>
 * ```
 *
 * Bare children are shorthand for the front cover.
 */
export const BookMockup = createMockup({
  object: Book,
  framing: BOOK_FRAMING,
  slots: bookSlots,
  displayName: 'BookMockup',
})
