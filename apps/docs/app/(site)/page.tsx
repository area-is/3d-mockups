import Link from 'next/link'
import { CodeBlock } from '@/components/code-block'
import { HeroMockup } from '@/components/hero-mockup'

const usageSnippet = `'use client'

import { GalaxyMockup } from 'area-3d-mockups'

export function Hero() {
  return (
    <GalaxyMockup autoRotate float>
      {/* anything goes here: your app, an <iframe>, a <video>… */}
      <YourApp />
    </GalaxyMockup>
  )
}`

export default function HomePage() {
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <p className="eyebrow">React · three.js · WebGL</p>
          <h1>
            Your app, on a phone, <span className="grad-text">in 3D.</span>
          </h1>
          <p className="lede">
            <code>area-3d-mockups</code> renders GPU-accelerated 3D devices (Galaxy and iPhone
            families, iPad Pro and Galaxy Tab tablets, a MacBook Air, an Apple Watch and a
            Studio Display-style monitor) and maps <em>real, live DOM</em> onto their
            screens. Text stays vector crisp, videos play, iframes load. No 3D asset files,
            no screenshots.
          </p>
          <p className="install-line">$ npm install area-3d-mockups</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/docs">
              Get started
            </Link>
            <Link className="text-link" href="/demos">
              Live demos →
            </Link>
          </div>
        </div>
        <div className="hero-stage">
          <div className="mockup-viewport hero-viewport">
            <HeroMockup />
          </div>
          <p className="viewport-hint">
            Drag to spin. The screen is a live React tree, rendering as you turn it.
          </p>
        </div>
      </section>

      <section className="container features">
        <div className="feature">
          <h3>Real GPU rendering</h3>
          <p>
            WebGL via three.js &amp; react-three-fiber: physically-based materials, studio
            lighting and soft shadows at 60&nbsp;fps, with device-pixel-ratio clamping to keep
            hi-dpi screens cheap.
          </p>
        </div>
        <div className="feature">
          <h3>Any content on screen</h3>
          <p>
            The display is a real DOM layer, CSS3D-transformed onto the glass. Pass React
            components, an <code>&lt;iframe&gt;</code> or a <code>&lt;video&gt;</code> as
            children: state, scrolling and clicks keep working.
          </p>
        </div>
        <div className="feature">
          <h3>Procedural device</h3>
          <p>
            The device is generated from geometry at runtime: no GLB downloads, nothing to
            host, no loading pop-in. The whole package tree-shakes to a few kilobytes.
          </p>
        </div>
        <div className="feature">
          <h3>Composable by design</h3>
          <p>
            Use the one-liner <code>&lt;GalaxyMockup&gt;</code>, or compose{' '}
            <code>&lt;MockupCanvas&gt;</code> and <code>&lt;Galaxy&gt;</code> into an existing
            three.js scene. 2D (CSS-only) mockups are on the roadmap, sharing the same API.
          </p>
        </div>
      </section>

      <section className="container quickstart">
        <div className="quickstart-copy">
          <h2>Quick start</h2>
          <p>
            Install the package and its three.js peers, then wrap any content in{' '}
            <code>&lt;GalaxyMockup&gt;</code>. It renders WebGL, so keep it in a client
            component.
          </p>
          <Link className="text-link" href="/docs">
            Read the full docs →
          </Link>
        </div>
        <div className="quickstart-code">
          <CodeBlock title="terminal">
            npm install area-3d-mockups three @react-three/fiber @react-three/drei
          </CodeBlock>
          <CodeBlock title="hero.tsx">{usageSnippet}</CodeBlock>
        </div>
      </section>
    </>
  )
}
