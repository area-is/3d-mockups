import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { ExamplesMenu } from '@/components/examples-menu'
import { inter, jetbrainsMono } from '@/lib/fonts'
import '../globals.css'
import '../screens.css'

export const metadata: Metadata = {
  title: 'area-3d-mockups: 3D device mockups for React',
  description:
    'GPU-accelerated 3D device mockups for React, built on three.js. Drop any content onto the screen of a 3D device and it renders live - real DOM, not a texture.',
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
              <nav className="site-nav">
                <Link href="/docs" className="nav-plain">
                  Docs
                </Link>
                <Link href="/demos" className="nav-plain">
                  Demos
                </Link>
                <ExamplesMenu />
                <a
                  href="https://github.com/area-is/3d-mockups"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub"
                  className="nav-icon-btn"
                >
                  <svg viewBox="0 0 16 16" width="19" height="19" fill="currentColor" aria-hidden="true">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
                  </svg>
                </a>
              </nav>
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
