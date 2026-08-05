import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { SiteNav } from '@/components/site-nav'
import { inter, jetbrainsMono } from '@/lib/fonts'
import { SITE_URL, socialMetadata } from '@/lib/site'
import '../globals.css'
import '../screens.css'

const SITE_TITLE = 'area-3d-mockups: 3D device mockups for React'
const SITE_DESCRIPTION =
  'GPU-accelerated 3D device mockups for React, built on three.js. Drop any content onto the screen of a 3D device and it renders live - real DOM, not a texture.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: '%s | area-3d-mockups' },
  description: SITE_DESCRIPTION,
  ...socialMetadata({ title: SITE_TITLE, description: SITE_DESCRIPTION }),
}

// Root layout for the marketing site (home, demos). The docs and embedded
// routes have their own root layouts, so the site styles never mix with the
// Fumadocs/Tailwind styles and vice versa.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <div className="site">
          <header className="site-header">
            <div className="container header-inner">
              <Link href="/" className="brand">
                <Logo size={28} className="brand-logo" />
                area-3d-mockups
              </Link>
              <SiteNav />
            </div>
          </header>

          <main>{children}</main>

          <footer className="site-footer">
            <div className="container footer-inner">
              <span>MIT © {new Date().getFullYear()} subwaymatch</span>
              <a href="https://github.com/area-is/3d-mockups" target="_blank" rel="noreferrer">
                github.com/area-is/3d-mockups
              </a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
