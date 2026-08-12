import Link from 'next/link'
import { HeroCarousel } from '@/components/hero-carousel'

const importSnippet = `import { GalaxyMockup } from 'area-3d-mockups'

<GalaxyMockup autoRotate float>
  <YourApp />
</GalaxyMockup>`

export default function HomePage() {
  return (
    <>
      {/* Title only: the carousel's own readout - index, object, size, colours -
          is what sits under the headline now, so the hero says what the page is
          and the carousel says what you are looking at. */}
      <section className="hero">
        <p className="eyebrow">GPU-accelerated mockups for React</p>
        <h1>Your app. In 3D.</h1>
      </section>

      <HeroCarousel />

      <section className="stat-band">
        <div className="stat-band-inner">
          <div className="stat">
            <div className="stat-value">22</div>
            <div className="stat-label">devices, generated at runtime</div>
          </div>
          <div className="stat">
            <div className="stat-value">24</div>
            <div className="stat-label">print, packaging &amp; OOH objects</div>
          </div>
          <div className="stat">
            <div className="stat-value">0</div>
            <div className="stat-label">3D asset files to host</div>
          </div>
        </div>
      </section>

      <section className="quickstart">
        <div className="quickstart-copy">
          <h2>Quick start</h2>
          <p>One component. Anything you pass as children shows up on the glass, live.</p>
          <Link className="accent-link" href="/docs">
            Read the docs →
          </Link>
        </div>
        <div className="quickstart-code">
          {/* One package: three, fiber and drei are peers, and npm 7+/pnpm 8+
              pull peers in on their own. The docs' Installation page carries
              the long version, including the Yarn caveat. */}
          <pre>
            <span className="prompt">$</span> npm install area-3d-mockups
          </pre>
          <pre>{importSnippet}</pre>
        </div>
      </section>
    </>
  )
}
