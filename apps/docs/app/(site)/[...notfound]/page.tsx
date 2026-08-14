import { notFound } from 'next/navigation'

/**
 * Routes every unmatched top-level URL into the site's own 404.
 *
 * The app has five separate root layouts (site, docs, embedded, examples,
 * harness) so their stylesheets never mix, which means there is no
 * `app/layout.tsx` for a global `app/not-found.tsx` to render inside - an
 * unknown URL fell through to Next's unstyled built-in page instead. A
 * catch-all inside the site group gives those URLs a segment to match, so
 * `(site)/not-found.tsx` renders with the site's header and footer.
 *
 * Concrete segments (`/docs`, `/embedded`, `/examples`, `/harness`) are more
 * specific than a catch-all and still win, so this only ever sees paths
 * nothing else claimed.
 */
export default function CatchAllNotFound(): never {
  notFound()
}
