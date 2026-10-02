'use client'

import { Fragment, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type * as PageTree from 'fumadocs-core/page-tree'
import { SidebarSeparator, useFolderDepth } from 'fumadocs-ui/components/sidebar/base'
import { CATEGORIES, DEVICES, OBJECTS } from '@/lib/mockup-catalog.mjs'
import { useModelStatus } from '@/components/model-lifecycle'

interface CatalogEntry {
  id: string
  label: string
  href: string
  thumb: string
  category: string
}

/**
 * A section's entries under the gallery's categories, in the gallery's order.
 *
 * Twenty-odd devices in one undivided grid meant scanning every tile for the
 * one tablet; under "Phones", "Foldables", "Tablets" the eye goes straight to
 * the row. Same names as the gallery's filter chips, so the two agree.
 */
function byCategory(entries: CatalogEntry[]): [string, CatalogEntry[]][] {
  return (CATEGORIES as string[])
    .map((category): [string, CatalogEntry[]] => [category, entries.filter((e) => e.category === category)])
    .filter(([, group]) => group.length > 0)
}

const ALL: CatalogEntry[] = [...DEVICES, ...OBJECTS]

/**
 * Which categories each grid holds. By category rather than by catalog list,
 * so the TV set - an object in the catalog, a display by any other measure -
 * sits with the monitors instead of under a second "Laptops and displays"
 * heading among the print pieces.
 */
const DEVICE_CATEGORIES = new Set(['Phones', 'Foldables', 'Tablets', 'Laptops and displays', 'Wearables'])
const DEVICE_TILES = ALL.filter((e) => DEVICE_CATEGORIES.has(e.category))
const OBJECT_TILES = ALL.filter((e) => !DEVICE_CATEGORIES.has(e.category))

/**
 * The "Devices" and "Objects" sidebar sections, rendered as 2-column grids of
 * mockup screenshots - one tile per device VARIANT (the S26 and the S26 Ultra
 * each get their own) and one per object. Only the newest model of each
 * product line is a tile up front; the ones it superseded fold away under
 * their category (`OlderModels`).
 *
 * Only the separator slot is overridden. The pages these grids stand in for
 * are dropped from the page tree upstream (see `hideGridPages` in
 * lib/sidebar-tree.ts), so every remaining link still renders through
 * Fumadocs' own item component and keeps its stock styling.
 */

/** Pages the grids cover; the tree filter reads the same set. */
export const GRID_URLS: string[] = [...DEVICES, ...OBJECTS].map((e: CatalogEntry) => e.href)

/**
 * Fumadocs styles its sidebar separators in a module-private component
 * (`layouts/docs/slots/sidebar.tsx`), so the class list is mirrored here to
 * keep "Devices" and "Objects" in the same voice as "Guides".
 */
const SEPARATOR_CLASS =
  'inline-flex items-center gap-2 mb-1 px-2 mt-6 empty:mb-0 [&_svg]:size-4 [&_svg]:shrink-0'

/** Matches Fumadocs' own per-depth indent for sidebar rows. */
function useItemOffset() {
  const depth = useFolderDepth()
  return { paddingInlineStart: `calc(${2 + 3 * depth} * var(--spacing))` }
}

function Tile({ entry }: { entry: CatalogEntry }) {
  const pathname = usePathname()
  const statusOf = useModelStatus()
  return (
    <Link
      href={entry.href}
      className="mockup-tile"
      data-active={pathname === entry.href}
      data-older={statusOf(entry.href) !== 'current' || undefined}
    >
      <span className="mockup-tile-thumb">
        {/* Pre-rendered shot of the real WebGL mockup (scripts/generate-thumbs.mjs). */}
        <img src={entry.thumb} alt="" loading="lazy" width="120" height="62" />
      </span>
      <span className="mockup-tile-label">
        {entry.label}
        {statusOf(entry.href) === 'deprecated' && <span className="mockup-tile-note">Deprecated</span>}
      </span>
    </Link>
  )
}

/**
 * A category's superseded models, folded away under one row.
 *
 * Once a newer model in the same line is in the catalog - the 18 Pro beside
 * the 17 Pro - listing both up front doubles the rows a reader scans to find
 * the device they came for, and the older one is rarely it. They stay one
 * click away rather than gone: every one is still supported, and someone
 * mocking up an app for last year's phone needs exactly that tile.
 *
 * A native `<details>`, so it is a disclosure to assistive tech and keyboard
 * users with no ARIA of our own. Open when the page being read is one of
 * them - on the server render too, so the active tile is in view without the
 * sidebar shifting after hydration - and opened again by a later navigation
 * to one; closing it is the reader's choice from then on.
 */
function OlderModels({ entries }: { entries: CatalogEntry[] }) {
  const pathname = usePathname()
  const style = useItemOffset()
  const holdsActive = entries.some((e) => e.href === pathname)
  const [open, setOpen] = useState(holdsActive)
  useEffect(() => {
    if (holdsActive) setOpen(true)
  }, [holdsActive])

  return (
    <details className="mockup-older" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="mockup-older-summary" style={style}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m9 18 6-6-6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {entries.length} older {entries.length === 1 ? 'model' : 'models'}
      </summary>
      <div className="mockup-grid">
        {entries.map((e) => (
          <Tile key={e.id} entry={e} />
        ))}
      </div>
    </details>
  )
}

function GridSection({ label, entries }: { label: string; entries: CatalogEntry[] }) {
  const style = useItemOffset()
  const statusOf = useModelStatus()
  return (
    <>
      <SidebarSeparator className={`${SEPARATOR_CLASS} w-full justify-between`} style={style}>
        {label}
        <span className="text-xs tabular-nums">{entries.length}</span>
      </SidebarSeparator>
      <div className="mockup-grid">
        {byCategory(entries).map(([category, group]) => {
          const older = group.filter((e) => statusOf(e.href) !== 'current')
          return (
            <Fragment key={category}>
              {/* Indented like the separator above it, so the two labels line up. */}
              <span className="mockup-grid-heading" style={style}>
                {category}
              </span>
              {group
                .filter((e) => statusOf(e.href) === 'current')
                .map((e) => (
                  <Tile key={e.id} entry={e} />
                ))}
              {older.length > 0 && <OlderModels entries={older} />}
            </Fragment>
          )
        })}
      </div>
    </>
  )
}

export function DocsSidebarSeparator({ item }: { item: PageTree.Separator }) {
  const style = useItemOffset()
  const label = typeof item.name === 'string' ? item.name : undefined
  if (label === 'Devices') return <GridSection label="Devices" entries={DEVICE_TILES} />
  if (label === 'Objects') return <GridSection label="Objects" entries={OBJECT_TILES} />
  return (
    <SidebarSeparator className={`${SEPARATOR_CLASS} first:mt-0`} style={style}>
      {item.icon}
      {item.name}
    </SidebarSeparator>
  )
}
