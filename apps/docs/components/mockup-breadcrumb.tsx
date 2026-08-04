'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DEVICES, OBJECTS } from '@/lib/mockup-catalog.mjs'

interface CatalogEntry {
  href: string
}

const DEVICE_URLS = new Set<string>(DEVICES.map((e: CatalogEntry) => e.href))
const OBJECT_URLS = new Set<string>(OBJECTS.map((e: CatalogEntry) => e.href))

/** Fumadocs draws its own crumb separator with a lucide icon; this matches it. */
function Chevron() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" aria-hidden="true">
      <path
        d="m9 18 6-6-6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Breadcrumb for the per-mockup reference pages.
 *
 * Those pages are deliberately missing from the sidebar tree - the thumbnail
 * grids under "Devices" and "Objects" stand in for them, see `hideGridPages`
 * in lib/sidebar-tree.ts - so Fumadocs' stock breadcrumb, which walks that
 * tree, has nothing to render. This spells the trail out instead: the section,
 * then the grid the page sits in. Class names mirror Fumadocs' own breadcrumb
 * slot so the two are indistinguishable.
 */
export function MockupBreadcrumb() {
  const pathname = usePathname()
  const group = DEVICE_URLS.has(pathname)
    ? { name: 'Devices', url: '/docs/devices' }
    : OBJECT_URLS.has(pathname)
      ? { name: 'Objects', url: '/docs/objects' }
      : null

  const items = [{ name: 'Components', url: '/docs/api' }, ...(group ? [group] : [])]

  return (
    <div className="flex items-center gap-1.5 text-sm text-fd-muted-foreground">
      {items.map((item, i) => (
        <span key={item.url} className="contents">
          {i !== 0 && <Chevron />}
          <Link
            href={item.url}
            className={`truncate transition-opacity hover:opacity-80${
              i === items.length - 1 ? ' text-fd-primary font-medium' : ''
            }`}
          >
            {item.name}
          </Link>
        </span>
      ))}
    </div>
  )
}
