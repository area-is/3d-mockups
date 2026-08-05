/**
 * Where this site lives, for everything that needs an absolute URL: canonical
 * links, Open Graph / Twitter cards, `sitemap.xml` and `robots.txt`.
 *
 * ⚠️ SET THIS FOR THE REAL DEPLOYMENT. Nothing else in the repo records the
 * production URL, so the fallback below is a placeholder built from the Worker
 * name in `wrangler.jsonc`. Point it at the actual origin — a custom domain if
 * there is one — by setting `NEXT_PUBLIC_SITE_URL` as a *build* variable
 * (Workers & Pages → area-3d-mockups-docs → Settings → Build → Variables),
 * because `metadataBase` is baked in at build time, not read at runtime.
 *
 * Getting it wrong is not fatal but is visible: social cards would point their
 * image at a host that does not serve it, and canonical links would name the
 * wrong origin.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://area-3d-mockups-docs.workers.dev'
).replace(/\/$/, '')

/** The social card shipped at `public/og.png` (1200×630, a real render). */
export const OG_IMAGE = {
  url: '/og.png',
  width: 1200,
  height: 630,
  alt: 'area-3d-mockups — a live 3D phone mockup with real DOM on the glass',
}

/** Shared Open Graph / Twitter block; pages override `title` and `description`. */
export function socialMetadata({ title, description }: { title: string; description: string }) {
  return {
    openGraph: {
      type: 'website' as const,
      siteName: 'area-3d-mockups',
      title,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      images: [OG_IMAGE.url],
    },
  }
}
