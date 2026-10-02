import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page'
import { createRelativeLink } from 'fumadocs-ui/mdx'
import { getBreadcrumbItems } from 'fumadocs-core/breadcrumb'
import { source } from '@/lib/source'
import { getMDXComponents } from '@/components/mdx'
import { MockupBreadcrumb } from '@/components/mockup-breadcrumb'
import { ModelStatusNotice } from '@/components/model-status-notice'
import { OLDER_MODELS } from '@/lib/model-lifecycle'
import { DEVICES, OBJECTS } from '@/lib/mockup-catalog.mjs'
import { BASE_PATH } from '@/lib/base-path.mjs'
import { SITE_URL, jsonLd, pageMetadata } from '@/lib/site'

interface CatalogEntry {
  href: string
  label: string
  thumb: string
}

/**
 * Mockup pages hide the table of contents: their live prop explorer wants
 * every pixel of width it can get, and the headings they carry are few enough
 * that the sidebar grid is the real navigation.
 */
const MOCKUP_PAGES = new Map<string, CatalogEntry>(
  [...DEVICES, ...OBJECTS].map((e: CatalogEntry) => [e.href, e])
)
const OBJECT_PAGES = new Set<string>(OBJECTS.map((e: CatalogEntry) => e.href))

/**
 * The page's trail as schema.org `BreadcrumbList` data: home, the docs, then
 * wherever the page sits.
 *
 * The mockup pages are left out of the sidebar tree, so the tree has no trail
 * for them; theirs is spelled out the way `MockupBreadcrumb` draws it on the
 * page - Components, then the Devices or Objects grid. Everything else takes
 * the trail from the full page tree (not the sidebar's pruned one).
 */
function breadcrumbData(page: NonNullable<ReturnType<typeof source.getPage>>) {
  const trail: { name: string; url: string }[] = [
    { name: 'React 3D Mockups', url: '' },
    { name: 'Docs', url: '/docs' },
  ]
  if (MOCKUP_PAGES.has(page.url)) {
    trail.push({ name: 'Components', url: '/docs/api' })
    trail.push(OBJECT_PAGES.has(page.url) ? { name: 'Objects', url: '/docs/objects' } : { name: 'Devices', url: '/docs/devices' })
  } else {
    for (const item of getBreadcrumbItems(page.url, source.getPageTree())) {
      // Separators and unlinked folders have nothing to point a crawler at.
      if (typeof item.name === 'string' && item.url && item.url !== '/docs' && item.url !== page.url) {
        trail.push({ name: item.name, url: item.url })
      }
    }
  }
  if (page.url !== '/docs') trail.push({ name: page.data.title, url: page.url })

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.url}`,
    })),
  }
}

interface PageParams {
  params: Promise<{ slug?: string[] }>
}

export default async function Page(props: PageParams) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const MDX = page.data.body
  const isMockupPage = MOCKUP_PAGES.has(page.url)
  const model = MOCKUP_PAGES.get(page.url)
  const lifecycle = OLDER_MODELS[page.url]

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      tableOfContent={{ enabled: !isMockupPage }}
      tableOfContentPopover={{ enabled: !isMockupPage }}
      // The mockup pages are not in the sidebar tree, so the stock breadcrumb
      // comes up empty for them - see components/mockup-breadcrumb.tsx.
      slots={isMockupPage ? { breadcrumb: MockupBreadcrumb } : undefined}
      // Hands the column the missing table of contents would have taken back
      // to the article - see `#nd-page[data-wide]` in docs.css.
      data-wide={isMockupPage || undefined}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbData(page)) }} />
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      {model && lifecycle && <ModelStatusNotice entry={model} lifecycle={lifecycle} />}
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

  let title = page.data.title
  let description = page.data.description ?? ''
  let image: { url: string; width: number; height: number; alt: string } | undefined

  /*
   * A model's page is what someone searching "Galaxy S26 mockup" should land
   * on, and its heading - just "Galaxy S26" - says nothing about mockups. The
   * <title> and description say it instead (the on-page heading stays as it
   * is), and the social card is the model itself rather than the site-wide
   * phone.
   *
   * The catalog's `thumb` already carries the basePath, and `metadataBase`
   * carries it too; resolving the one against the other would print it
   * twice, so it comes off first.
   */
  const model = MOCKUP_PAGES.get(page.url)
  if (model) {
    const name = `${model.label} 3D mockup`
    if (!/3d mockup/i.test(title)) title = name
    if (!/3d mockup/i.test(description)) description = `${name} for React. ${description}`.trim()
    image = {
      url: model.thumb.startsWith(BASE_PATH) ? model.thumb.slice(BASE_PATH.length) : model.thumb,
      width: 360,
      height: 360,
      alt: name,
    }
  }

  return {
    title,
    description,
    // Every docs page is reachable at exactly one URL; saying so keeps the
    // per-variant mockup pages from reading as near-duplicates of each other.
    ...pageMetadata({
      path: page.url,
      title: `${title} | React 3D Mockups`,
      description,
      ...(image ? { image, twitterCard: 'summary' as const } : {}),
    }),
  }
}
