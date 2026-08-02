import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page'
import { createRelativeLink } from 'fumadocs-ui/mdx'
import { source } from '@/lib/source'
import { getMDXComponents } from '@/components/mdx'
import { DEVICES, OBJECTS } from '@/lib/mockup-catalog.mjs'

/**
 * Mockup pages hide the table of contents: their live prop explorer wants
 * every pixel of width it can get, and the headings they carry are few enough
 * that the sidebar grid is the real navigation.
 */
const MOCKUP_PAGES = new Set<string>(
  [...DEVICES, ...OBJECTS].map((e: { href: string }) => e.href)
)

interface PageParams {
  params: Promise<{ slug?: string[] }>
}

export default async function Page(props: PageParams) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const MDX = page.data.body
  const isMockupPage = MOCKUP_PAGES.has(page.url)

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      tableOfContent={{ enabled: !isMockupPage }}
      tableOfContentPopover={{ enabled: !isMockupPage }}
      // Hands the column the missing table of contents would have taken back
      // to the article - see `#nd-page[data-wide]` in docs.css.
      data-wide={isMockupPage || undefined}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(props: PageParams): Promise<Metadata> {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  return {
    title: page.data.title,
    description: page.data.description,
  }
}
