import { describe, expect, it } from 'vitest'
import { CATALOG_AXES, catalogEntries, type CatalogEntry } from '../catalog'
import { MOCKUP_KINDS } from '../metrics'

/**
 * The published `catalog.json`, read where it is made.
 *
 * Version 1 asked for a nonexistent `open` prop on the Fold and the Flip, so
 * `mockupInfo` ignored it and every "folded" row carried the open screen; the
 * iPhone Duo and the TV had one row each. The types now refuse a prop the kind
 * does not take (see `CATALOG_AXES`); these check what the rows say.
 */
const entries = catalogEntries()

const find = (kind: string, props: Record<string, unknown>): CatalogEntry => {
  const match = entries.find(
    (e) => e.kind === kind && Object.entries(props).every(([key, value]) => e.props[key] === value)
  )
  if (!match) throw new Error(`no ${kind} entry with ${JSON.stringify(props)}`)
  return match
}

const primaryPx = (e: CatalogEntry) => e.regions.find((r) => r.name === e.primary)!.px

describe('catalog.json', () => {
  it('catalogues every kind at least once', () => {
    expect(new Set(entries.map((e) => e.kind))).toEqual(new Set(MOCKUP_KINDS))
  })

  it.each([
    ['fold', 'fold7', { width: 820, height: 910 }, { width: 360, height: 835 }],
    ['flip', 'flip7', { width: 360, height: 838 }, { width: 316, height: 349 }],
    ['iphoneDuo', 'duo', { width: 890, height: 626 }, { width: 466, height: 678 }],
  ])('%s %s: the folded rows measure the cover screen', (kind, variant, open, shut) => {
    expect(primaryPx(find(kind, { variant, openAngle: true, orientation: 'portrait' }))).toEqual(open)
    expect(primaryPx(find(kind, { variant, openAngle: false, orientation: 'portrait' }))).toEqual(shut)
  })

  it('enumerates the TV by variant', () => {
    expect(entries.filter((e) => e.kind === 'tv').map((e) => e.props.variant)).toEqual(['legs', 'pedestal', 'frame'])
  })

  it('only enumerates props the kind takes', () => {
    // @ts-expect-error - the Fold has no `open` prop; the catalog once used it.
    const wrong: (typeof CATALOG_AXES)['fold'] = { open: [true, false] }
    expect(wrong).toBeDefined()
  })
})
