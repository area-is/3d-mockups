import type { Metadata } from 'next'
import Link from 'next/link'
import { DemoGallery } from '@/components/demo-gallery'

export const metadata: Metadata = {
  title: 'Demos | area-mockups',
  description: 'Live demos of area-mockups 3D device mockups.',
}

export default function DemosPage() {
  return (
    <div className="container page">
      <header className="page-header">
        <h1>Demos</h1>
        <p>
          Every mockup below is a live WebGL scene, and every surface is real DOM — device
          screens, book covers, brochure panels, even the van wrap. Drag the models, click
          the buttons, scroll the iframe.
        </p>
        <p>
          Prefer a full-page layout? Visit the{' '}
          <Link className="text-link" href="/examples/hero-phone">
            hero phone example →
          </Link>{' '}
          — an isolated page with one huge, absolutely positioned phone showcasing an app.
        </p>
      </header>
      <DemoGallery />
    </div>
  )
}
