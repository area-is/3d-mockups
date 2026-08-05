import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/**
 * `/harness` is the visual-regression fixture and `/embedded` exists to be
 * iframed by a demo; both already carry `robots: { index: false }` in their
 * layouts, and this keeps well-behaved crawlers from spending the budget to
 * find that out.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/harness', '/embedded'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
