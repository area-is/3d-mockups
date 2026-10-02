import { Fragment } from 'react'
import Link from 'next/link'
import { Callout } from 'fumadocs-ui/components/callout'
import { DEVICES } from '@/lib/mockup-catalog.mjs'
import type { ModelLifecycle } from '@/lib/model-lifecycle'

interface CatalogEntry {
  label: string
  href: string
  variant?: string
}

const BY_HREF = new Map<string, CatalogEntry>(DEVICES.map((e: CatalogEntry) => [e.href, e]))

/** "A", "A and B", "A, B and C" - as links to the models' pages. */
function ModelLinks({ entries }: { entries: CatalogEntry[] }) {
  return entries.map((e, i) => (
    <Fragment key={e.href}>
      {i > 0 && (i === entries.length - 1 ? ' and ' : ', ')}
      {/* next/link, not <a>: it is what adds the site's basePath. */}
      <Link href={e.href}>{e.label}</Link>
    </Fragment>
  ))
}

/**
 * The line a model's page opens with once something has replaced it.
 *
 * The sidebar and the gallery fold superseded models away, but search, old
 * links and a typed URL still land on their pages - and a reader there should
 * learn that a newer model exists, and whether this one is going anywhere,
 * before building on it. Superseded is information (it is still fully
 * supported); deprecated is a warning, because a later release removes it.
 * Driven by `OLDER_MODELS` (lib/model-lifecycle.ts), so it needs nothing in
 * the page.
 */
export function ModelStatusNotice({ entry, lifecycle }: { entry: CatalogEntry; lifecycle: ModelLifecycle }) {
  const successors = lifecycle.successors.flatMap((href) => BY_HREF.get(href) ?? [])
  const variants = successors.map((s, i) => (
    <Fragment key={s.href}>
      {i > 0 && ' or '}
      <code>variant=&quot;{s.variant}&quot;</code>
    </Fragment>
  ))

  if (lifecycle.status === 'deprecated' && lifecycle.deprecated) {
    return (
      <Callout type="warn" title="Deprecated" className="model-status-notice">
        The {entry.label} is deprecated since react-3d-mockups {lifecycle.deprecated.since} and is removed in{' '}
        {lifecycle.deprecated.removeIn}. Switch to the <ModelLinks entries={successors} /> ({variants}) before
        upgrading.
      </Callout>
    )
  }

  return (
    <Callout type="info" title="An older model" className="model-status-notice">
      <ModelLinks entries={successors} /> {successors.length > 1 ? 'have' : 'has'} replaced the {entry.label} in
      its line ({variants}). The {entry.label} is still fully supported.
    </Callout>
  )
}
