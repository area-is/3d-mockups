import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { inter, jetbrainsMono } from '@/lib/fonts'
import '../globals.css'
import '../screens.css'

export const metadata: Metadata = {
  title: 'area-mockups: 3D device mockups for React',
  description:
    'GPU-accelerated 3D device mockups for React, built on three.js. Drop any content onto the screen of a 3D device and it renders live — real DOM, not a texture.',
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
                area-mockups
              </Link>
              <nav className="site-nav">
                <Link href="/docs">Docs</Link>
                <Link href="/demos">Demos</Link>
                <Link href="/examples/hero-phone">Hero phone</Link>
                <a
                  href="https://github.com/subwaymatch/area-mockups"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub
                </a>
              </nav>
            </div>
          </header>

          <main>{children}</main>

          <footer className="site-footer">
            <div className="container footer-inner">
              <span>
                MIT © {new Date().getFullYear()} subwaymatch · built with three.js &
                react-three-fiber
              </span>
              <a href="https://github.com/subwaymatch/area-mockups" target="_blank" rel="noreferrer">
                github.com/subwaymatch/area-mockups
              </a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
