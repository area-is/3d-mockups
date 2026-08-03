/**
 * The standalone examples the site links to.
 *
 * One list, two renderings: the header's `Examples` dropdown on a wide screen
 * and the nav sheet's rows on a narrow one. They were written out separately
 * to begin with, which meant the second example added would have appeared in
 * the dropdown and quietly not on any phone.
 */
export interface SiteExample {
  href: string
  title: string
  /** One line on what it shows - the dropdown has room for it, the sheet doesn't. */
  description: string
}

export const SITE_EXAMPLES: SiteExample[] = [
  {
    href: '/examples/hero-phone',
    title: 'Hero Phone',
    description: 'Product hero with a giant, draggable phone',
  },
]
