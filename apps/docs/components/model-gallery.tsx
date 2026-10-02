'use client'

import Link from 'next/link'
import { useId, useState } from 'react'
import { CATEGORIES, DEVICES, OBJECTS } from '@/lib/mockup-catalog.mjs'
import { useModelStatus } from '@/components/model-lifecycle'

interface CatalogEntry {
  id: string
  label: string
  href: string
  thumb: string
  category: string
}

const MODELS: CatalogEntry[] = [...DEVICES, ...OBJECTS]
const KINDS: string[] = CATEGORIES

/** What a card says under the model's name: its kind, and its age when it is not current. */
const STATUS_NOTE = { current: '', superseded: ' · Older model', deprecated: ' · Deprecated' }

/**
 * Every model in the library as a thumbnail grid, filtered by kind - the
 * Gallery docs page.
 *
 * The thumbnails are the pre-rendered shots the sidebar uses
 * (scripts/generate-thumbs.mjs), so the page costs no WebGL at all: a plain
 * `<img>` each, already basePath-prefixed by the catalog, lazy below the fold.
 * The links go through next/link, which adds the prefix itself - so `href`
 * stays unprefixed.
 *
 * The chips are toggle buttons (`aria-pressed`) in a labelled group: one kind
 * at a time, pressing the pressed one again - or "All" - shows everything. The
 * count under them is a polite live region, so a screen reader hears what a
 * filter did without the focus moving.
 *
 * Only the newest model of each product line shows until "Show older models"
 * is ticked. What is older comes from the library's own lineup (see
 * lib/model-lifecycle.ts), so this page and the sidebar agree on it. The chip
 * counts follow the switch: they count what pressing the chip would show.
 */
export function ModelGallery() {
  const [kind, setKind] = useState<string | null>(null)
  const [showOlder, setShowOlder] = useState(false)
  const labelId = useId()
  const statusOf = useModelStatus()
  const latest = MODELS.filter((m) => statusOf(m.href) === 'current')
  const olderCount = MODELS.length - latest.length
  const pool = showOlder ? MODELS : latest
  const shown = kind ? pool.filter((m) => m.category === kind) : pool
  const count = (k: string) => pool.filter((m) => m.category === k).length
  const hiddenHere = (kind ? MODELS.filter((m) => m.category === kind) : MODELS).length - shown.length

  let status = kind ? `${shown.length} of ${MODELS.length} models: ${kind}` : `All ${MODELS.length} models`
  if (hiddenHere > 0) {
    status = kind
      ? `${status}, ${hiddenHere} older hidden`
      : `${shown.length} of ${MODELS.length} models: the newest in each line`
  }

  return (
    <div className="model-gallery not-prose">
      <div className="model-gallery-chips" role="group" aria-labelledby={labelId}>
        <span id={labelId} className="model-gallery-chips-label">
          Filter by kind
        </span>
        <button
          type="button"
          className="model-gallery-chip"
          aria-pressed={kind === null}
          onClick={() => setKind(null)}
        >
          All <span className="model-gallery-chip-count">{pool.length}</span>
        </button>
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            className="model-gallery-chip"
            aria-pressed={kind === k}
            onClick={() => setKind(kind === k ? null : k)}
          >
            {k} <span className="model-gallery-chip-count">{count(k)}</span>
          </button>
        ))}
      </div>

      <div className="model-gallery-bar">
        <p className="model-gallery-status" aria-live="polite">
          {status}
        </p>
        {olderCount > 0 && (
          <label className="model-gallery-older">
            <input type="checkbox" checked={showOlder} onChange={(e) => setShowOlder(e.currentTarget.checked)} />
            Show older models <span className="model-gallery-chip-count">{olderCount}</span>
          </label>
        )}
      </div>

      <ul className="model-gallery-grid">
        {shown.map((m) => (
          <li key={m.id}>
            <Link href={m.href} className="model-gallery-card">
              <span className="model-gallery-thumb">
                {/* Decorative: the label beside it names the link. */}
                <img src={m.thumb} alt="" width={360} height={360} loading="lazy" decoding="async" />
              </span>
              <span className="model-gallery-label">{m.label}</span>
              <span className="model-gallery-kind">
                {m.category}
                {STATUS_NOTE[statusOf(m.href)]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
