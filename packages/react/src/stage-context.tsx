import * as React from 'react'
import type { DelayCapture } from './core'

/**
 * Whether the live screens are part of the page's accessibility tree.
 *
 * - `'hidden'` (the default): each screen layer is `aria-hidden` and `inert`.
 *   A screen is decorative by design - it composites under the canvas and
 *   never takes input - so what is painted on it is usually a picture of an
 *   app, not content. Left exposed it read as page content: demo headings
 *   landed in the document outline (a home page grew three `<h1>`s), a mock
 *   status bar's "9:41" was announced, and a newspaper on a tablet became the
 *   page's main `<article>` for reader modes and crawlers.
 * - `'visible'`: the screen's DOM is left in the accessibility tree, for a
 *   screen that carries text found nowhere else on the page.
 */
export type ScreenAccessibility = 'hidden' | 'visible'

/** Stage-wide settings a mockup's screens read from the canvas they are in. */
export interface StageSettings {
  screenAccessibility: ScreenAccessibility
  /** The canvas's `delayCapture`, which each screen holds while its content lands. */
  delayCapture?: DelayCapture
}

/**
 * Provided by `MockupCanvas` inside its r3f tree. A screen rendered in a
 * canvas the caller owns falls back to the default, which is the safe one:
 * decorative screens stay out of the accessibility tree.
 */
export const StageContext = React.createContext<StageSettings>({ screenAccessibility: 'hidden' })
