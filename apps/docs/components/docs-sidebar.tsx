'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type * as PageTree from 'fumadocs-core/page-tree'
import { SidebarItem, SidebarSeparator } from 'fumadocs-ui/components/sidebar/base'
import { DEVICES, OBJECTS } from '@/lib/mockup-catalog.mjs'

interface CatalogEntry {
  id: string
  label: string
  href: string
  thumb: string
}

/**
 * Sidebar overrides: the "Devices" and "Objects" sections render as 2-column
 * grids of live-render screenshots - one tile per device VARIANT (the S26 and
 * the S26 Ultra each get their own), one per object. The tree items those
 * grids replace are suppressed so nothing is listed twice.
 */

/** Pages the grids already cover - their plain list items are hidden. */
const GRID_URLS = new Set<string>([...DEVICES, ...OBJECTS].map((e: CatalogEntry) => e.href))

function ThumbGrid({ entries }: { entries: CatalogEntry[] }) {
  const pathname = usePathname()
  return (
    <div className="mockup-grid">
      {entries.map((e) => (
        <Link key={e.id} href={e.href} className="mockup-tile" data-active={pathname === e.href}>
          <span className="mockup-tile-thumb">
            {/* Pre-rendered shot of the real WebGL mockup (scripts/generate-thumbs.mjs). */}
            <img src={e.thumb} alt="" loading="lazy" width="120" height="62" />
          </span>
          <span className="mockup-tile-label">{e.label}</span>
        </Link>
      ))}
    </div>
  )
}

function GridSection({ label, entries }: { label: string; entries: CatalogEntry[] }) {
  return (
    <>
      <p className="mockup-grid-heading">
        {label} <span className="count">{entries.length}</span>
      </p>
      <ThumbGrid entries={entries} />
    </>
  )
}

export function DocsSidebarSeparator({ item }: { item: PageTree.Separator }) {
  const label = typeof item.name === 'string' ? item.name : undefined
  if (label === 'Devices') return <GridSection label="Devices" entries={DEVICES} />
  if (label === 'Objects') return <GridSection label="Objects" entries={OBJECTS} />
  return <SidebarSeparator className="docs-sep">{item.name}</SidebarSeparator>
}

export function DocsSidebarItem({ item }: { item: PageTree.Item }) {
  const pathname = usePathname()
  if (GRID_URLS.has(item.url)) return null
  return (
    <SidebarItem href={item.url} external={item.external} icon={item.icon} active={pathname === item.url}>
      {item.name}
    </SidebarItem>
  )
}
