import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { RootProvider } from 'fumadocs-ui/provider/next'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import { source } from '@/lib/source'
import { baseOptions } from '@/lib/layout.shared'
import { DocsSidebarSeparator } from '@/components/docs-sidebar'
import { ModelLifecycleProvider } from '@/components/model-lifecycle'
import { OLDER_MODELS } from '@/lib/model-lifecycle'
import { hideGridPages } from '@/lib/sidebar-tree'
import { fraunces, inter, jetbrainsMono } from '@/lib/fonts'
import { notoSerifKR } from '@/lib/fonts-ko'
import { asset } from '@/lib/base-path.mjs'
import { SITE_URL, socialMetadata } from '@/lib/site'
import './docs.css'
import '../screens.css'

const DOCS_DESCRIPTION = 'Installation, usage guides and API reference for React 3D Mockups.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: '%s | React 3D Mockups',
    default: 'Documentation | React 3D Mockups',
  },
  description: DOCS_DESCRIPTION,
  ...socialMetadata({ title: 'React 3D Mockups documentation', description: DOCS_DESCRIPTION }),
}

// `themeColor` lives on `viewport` in this version of Next. The docs open
// dark (see `DOCS_THEME`), so the browser chrome is dark to match; a reader
// who switches to light keeps it, since the meta tag cannot follow a class.
export const viewport: Viewport = {
  themeColor: '#121212',
}

/**
 * The docs open in dark, like the home page they are one click from, rather
 * than following the system: on a light system the step from the dark home
 * page into a white docs page read as leaving the site. The toggle in the
 * sidebar still switches, and a reader's choice is remembered as before.
 */
const DOCS_THEME = { defaultTheme: 'dark' }

// Root layout for the documentation. It is deliberately separate from the
// site root layout: the docs use Fumadocs UI on Tailwind, the site keeps its
// own stylesheet, and neither can leak resets into the other.
export default function DocsRootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${fraunces.variable} ${notoSerifKR.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        {/*
          * fumadocs' fetch client defaults its endpoint to
          * `join(BASE_PATH, '/api/search')`, where that `BASE_PATH` is
          * `import.meta.env.BASE_URL` - a Vite variable, undefined under Next -
          * so it resolves to a bare `/api/search` and misses our prefix
          * entirely. Pointing it explicitly is the whole fix.
          */}
        <RootProvider theme={DOCS_THEME} search={{ options: { api: asset('/api/search') } }}>
          {/* Which models are older, for the sidebar grid and the gallery. */}
          <ModelLifecycleProvider value={OLDER_MODELS}>
            <DocsLayout
              tree={hideGridPages(source.getPageTree())}
              {...baseOptions()}
              sidebar={{ components: { Separator: DocsSidebarSeparator } }}
            >
              {children}
            </DocsLayout>
          </ModelLifecycleProvider>
        </RootProvider>
      </body>
    </html>
  )
}
