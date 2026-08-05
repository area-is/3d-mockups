import Link from 'next/link'

/**
 * The site's 404. Without one, an unknown URL fell through to Next's built-in
 * page: unstyled, no header, no footer and no way back into the site.
 */
export default function NotFound() {
  return (
    <section className="notfound">
      <p className="eyebrow">404</p>
      <h1>No mockup here.</h1>
      <p className="lede">
        That page does not exist. It may have moved when the per-device pages were split up.
      </p>
      <div className="hero-actions">
        <Link className="btn btn-primary" href="/docs">
          Read the docs
        </Link>
        <Link className="btn btn-secondary" href="/demos">
          Live demos
        </Link>
      </div>
    </section>
  )
}
