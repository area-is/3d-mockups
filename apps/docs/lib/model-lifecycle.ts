import { deviceLifecycle, type DeviceDeprecation, type DeviceKind } from 'react-3d-mockups/core'
import { DEVICES } from '@/lib/mockup-catalog.mjs'

/**
 * Where each catalog model stands, from the library's own lineup
 * (`deviceLifecycle` in react-3d-mockups/core): which ones a newer model in
 * their line has superseded, and which are scheduled for removal. The sidebar
 * and the gallery fold those away under "older models", and their pages say
 * what replaced them.
 *
 * Server-side on purpose. `react-3d-mockups/core` is one bundle that imports
 * three.js at its top, and a client component reading this table straight
 * from it carried the whole of three onto every docs page - 374 KB on a page
 * with no 3D in it. So the docs layout reads it here and hands the plain
 * result to the client through `ModelLifecycleProvider`, and the catalog
 * itself stays free of imports the node scripts and the client would share.
 */
export interface ModelLifecycle {
  status: 'superseded' | 'deprecated'
  deprecated?: DeviceDeprecation
  /** The docs pages of the newest models in its line - what replaces it. */
  successors: string[]
}

interface CatalogEntry {
  href: string
  component: string
  variant?: string
}

/** The `mockupInfo` kind each device component measures under. */
const KIND_OF: Record<string, DeviceKind> = {
  GalaxyMockup: 'galaxy',
  IPhoneMockup: 'iphone',
  LaptopMockup: 'laptop',
  IPadMockup: 'ipad',
  GalaxyTabMockup: 'galaxyTab',
  AppleWatchMockup: 'appleWatch',
  GalaxyWatchMockup: 'galaxyWatch',
  FoldMockup: 'fold',
  IPhoneDuoMockup: 'iphoneDuo',
  FlipMockup: 'flip',
}

function lifecycleOf(entry: CatalogEntry): [string, ModelLifecycle][] {
  if (!entry.variant) return []
  const kind = KIND_OF[entry.component]
  // A new device family missing here would otherwise read as current forever.
  if (!kind) throw new Error(`lib/model-lifecycle.ts: no mockupInfo kind for ${entry.component}; add it to KIND_OF.`)
  const { status, deprecated, successors } = deviceLifecycle(kind, entry.variant as never)
  if (status === 'current') return []
  const pages = successors.flatMap(
    (s) => DEVICES.find((e: CatalogEntry) => e.component === entry.component && e.variant === s.variant)?.href ?? []
  )
  return [[entry.href, { status, deprecated, successors: pages }]]
}

/**
 * The catalog's superseded and deprecated models, by docs page. A page that
 * is not here - every current model and every object - is current.
 */
export const OLDER_MODELS: Record<string, ModelLifecycle> = Object.fromEntries(
  (DEVICES as CatalogEntry[]).flatMap(lifecycleOf)
)
