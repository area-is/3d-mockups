import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { RootProvider } from 'fumadocs-ui/provider/next'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import { source } from '@/lib/source'
import { baseOptions } from '@/lib/layout.shared'
import { DocsSidebarSeparator } from '@/components/docs-sidebar'
import { hideGridPages } from '@/lib/sidebar-tree'
import { inter, jetbrainsMono } from '@/lib/fonts'
import { SITE_URL, socialMetadata } from '@/lib/site'
import './docs.css'
import '../screens.css'

const DOCS_DESCRIPTION = 'Installation, usage guides and API reference for area-3d-mockups.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: '%s | area-3d-mockups',
    default: 'Documentation | area-3d-mockups',
  },
  description: DOCS_DESCRIPTION,
  ...socialMetadata({ title: 'area-3d-mockups documentation', description: DOCS_DESCRIPTION }),
}

// Root layout for the documentation. It is deliberately separate from the
// site root layout: the docs use Fumadocs UI on Tailwind, the site keeps its
// own stylesheet, and neither can leak resets into the other.
export default function DocsRootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        <RootProvider>
          <DocsLayout
            tree={hideGridPages(source.getPageTree())}
            {...baseOptions()}
            sidebar={{ components: { Separator: DocsSidebarSeparator } }}
          >
            {children}
          </DocsLayout>
        </RootProvider>
      </body>
    </html>
  )
}
