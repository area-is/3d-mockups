import type { MetadataRoute } from 'next'
import { source } from '@/lib/source'
import { SITE_URL } from '@/lib/site'
import { SITE_EXAMPLES } from '@/components/site-examples'

/**
 * Every indexable route.
 *
 * The ~50 per-mockup API pages are the reason this file exists: they are
 * deliberately kept out of the sidebar tree and are only reachable through
 * client-rendered grids, so a crawler following links alone finds few of them.
 * `source.getPages()` enumerates them from the same content collection the
 * pages themselves are built from, so the sitemap cannot drift.
 *
 * `/harness` and `/embedded` are excluded here and disallowed in robots.ts -
 * they are tooling and an iframe target, not pages.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const marketing = ['', '/demos', ...SITE_EXAMPLES.map((e) => e.href)].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.7,
  }))

  const docs = source.getPages().map((page) => ({
    url: `${SITE_URL}${page.url}`,
    changeFrequency: 'weekly' as const,
    priority: page.url === '/docs' ? 0.9 : 0.6,
  }))

  return [...marketing, ...docs]
}
