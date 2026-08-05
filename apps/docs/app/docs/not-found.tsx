import Link from 'next/link'

/**
 * The docs 404, rendered inside the docs shell so the sidebar and search stay
 * available - a mistyped `/docs/...` URL is usually one letter from the page
 * the reader wanted, and the sidebar is the fastest way to that page.
 */
export default function DocsNotFound() {
  return (
    <div className="docs-notfound">
      <p className="docs-notfound-code">404</p>
      <h1>That page is not in the docs.</h1>
      <p>
        Device and object references live under their own pages - try the sidebar, the search box,
        or start from the{' '}
        <Link href="/docs">introduction</Link>.
      </p>
      <p>
        <Link href="/docs/api">Browse the component reference →</Link>
      </p>
    </div>
  )
}
