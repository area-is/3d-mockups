import Link from 'next/link'
import { highlight } from 'fumadocs-core/highlight'
import { HeroCarousel } from '@/components/hero-carousel'
import { HeroRotator } from '@/components/hero-rotator'

const installSnippet = `npm install area-3d-mockups`

const importSnippet = `import { GalaxyMockup } from 'area-3d-mockups'

<GalaxyMockup autoRotate float>
  <YourApp />
</GalaxyMockup>`

/**
 * What the library is, in four claims.
 *
 * No rules between them: the grid's own gutters are the separation, and a
 * border around a paragraph of prose only ever reads as a box to escape from.
 */
const FEATURES = [
  {
    title: 'Real GPU rendering',
    body: (
      <>
        WebGL through three.js and react-three-fiber: physically-based materials, studio
        lighting and soft contact shadows at 60 fps, with device-pixel-ratio clamping so a
        hi-dpi screen costs what a laptop does.
      </>
    ),
  },
  {
    title: 'Any content on the surface',
    body: (
      <>
        The display is a real DOM layer, CSS3D-transformed onto the glass. Pass React
        components, an <code>&lt;iframe&gt;</code> or any element as children and it stays
        live - text selects, buttons click, video plays.
      </>
    ),
  },
  {
    title: 'Procedural objects',
    body: (
      <>
        Every phone, laptop, carton and billboard is built from geometry at runtime: no GLB
        to download, nothing to host, no loading pop-in and no asset pipeline to keep in
        step with your app.
      </>
    ),
  },
  {
    title: 'Composable by design',
    body: (
      <>
        Take the one-liner <code>&lt;GalaxyMockup&gt;</code>, or compose{' '}
        <code>&lt;MockupCanvas&gt;</code> and <code>&lt;Galaxy&gt;</code> into a three.js
        scene you already have. Same objects, either way in.
      </>
    ),
  },
]

/**
 * A code block, coloured by the same Shiki that sets the docs' examples.
 *
 * Shiki's own `<pre>` carries the theme's background and foreground inline,
 * which would win over any stylesheet; dropping the element's attributes keeps
 * the token colours (they are on the spans) and hands the box back to
 * `.quickstart-code pre`.
 */
async function CodeBlock({ code, lang }: { code: string; lang: string }) {
  return highlight(code, {
    lang,
    theme: 'github-dark',
    components: {
      pre: ({ style: _style, className: _className, ...props }) => <pre {...props} />,
    },
  })
}

export default function HomePage() {
  return (
    <>
      {/* Title only: the carousel's own readout - index, object, size, colours -
          is what sits under the headline now, so the hero says what the page is
          and the carousel says what you are looking at. */}
      <section className="hero">
        <p className="eyebrow">GPU-accelerated mockups for React</p>
        {/* The break only exists on a narrow screen: the headline is set on one
            unwrappable line so the rotating noun cannot throw "In 3D." onto a
            second line and back again mid-word, and below ~700px the longest
            noun stops fitting on one. */}
        <h1>
          Your <HeroRotator />.<br className="hero-break" /> In 3D.
        </h1>
      </section>

      <HeroCarousel />

      <section className="features" aria-label="What the library does">
        {FEATURES.map((feature, i) => (
          <article className="feature" key={feature.title}>
            <span className="feature-index" aria-hidden>
              {String(i + 1).padStart(2, '0')}
            </span>
            <h2>{feature.title}</h2>
            <p>{feature.body}</p>
          </article>
        ))}
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
          <div className="quickstart-install">
            <CodeBlock code={installSnippet} lang="bash" />
          </div>
          <CodeBlock code={importSnippet} lang="tsx" />
        </div>
      </section>
    </>
  )
}
