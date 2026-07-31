import Link from 'next/link'
import { HeroCarousel } from '@/components/hero-carousel'

const importSnippet = `import { GalaxyMockup } from 'area-3d-mockups'

<GalaxyMockup autoRotate float>
  <YourApp />
</GalaxyMockup>`

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">GPU-accelerated mockups for React</p>
        <h1>Your app. In 3D.</h1>
        <p className="lede">Twenty-two procedural devices. Zero asset files. Fully live.</p>
        <div className="hero-actions">
          <Link className="btn btn-primary" href="/docs">
            Get started
          </Link>
          <Link className="btn btn-secondary" href="/demos">
            Live demos
          </Link>
        </div>
        <p className="install-line">$ npm install area-3d-mockups</p>
      </section>

      <HeroCarousel />

      <section className="stat-band">
        <div className="stat-band-inner">
          <div className="stat">
            <div className="stat-value">22</div>
            <div className="stat-label">devices, generated at runtime</div>
          </div>
          <div className="stat">
            <div className="stat-value">23</div>
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
          <p>One component. Anything you pass as children shows up on the glass — live.</p>
          <Link className="accent-link" href="/docs">
            Read the docs →
          </Link>
        </div>
        <div className="quickstart-code">
          <pre>
            <span className="prompt">$</span> npm install area-3d-mockups three @react-three/fiber
            @react-three/drei
          </pre>
          <pre>{importSnippet}</pre>
        </div>
      </section>
    </>
  )
}
