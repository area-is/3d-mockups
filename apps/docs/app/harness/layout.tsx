import type { Metadata } from 'next'
import { inter, jetbrainsMono } from '@/lib/fonts'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Screenshot harness | area-3d-mockups',
  robots: { index: false },
}

// Root layout for the standalone /harness route - a chrome-less stage used by
// the repo's Playwright screenshot tooling to render any device variant from
// URL params (see page.tsx). Not linked from the site.
export default function HarnessLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
