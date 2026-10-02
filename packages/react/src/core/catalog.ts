/**
 * What `dist/catalog.json` enumerates: every measurable kind at each value of
 * the props that move its surfaces, with `mockupInfo` already applied.
 *
 * The enumeration lives here, typed against `MockupPropsMap`, rather than in
 * the build script, because the script's untyped table once asked for
 * `open: [true, false]` on the Fold and the Flip. There is no `open` prop -
 * the real one is `openAngle` - so `mockupInfo` ignored it, and every
 * "folded" entry in the published catalog was the open screen. Here a prop
 * that does not exist fails to typecheck, and the tests read the result.
 *
 * Not exported from the core entry: `scripts/build-catalog.mjs` imports the
 * built module directly, and the catalog itself is the published interface.
 */

import { mockupInfo, MOCKUP_KINDS, type MockupKind, type MockupPropsMap } from './metrics'
import { GALAXY_VARIANTS } from './devices/galaxy/dimensions'
import { IPHONE_VARIANTS } from './devices/iphone/dimensions'
import { LAPTOP_VARIANTS } from './devices/laptop/dimensions'
import { IPAD_VARIANTS, GALAXY_TAB_VARIANTS } from './devices/tablet/dimensions'
import { APPLE_WATCH_VARIANTS, GALAXY_WATCH_VARIANTS } from './devices/watch/dimensions'
import { FOLD_VARIANTS, IPHONE_DUO_VARIANTS } from './devices/fold/dimensions'
import { FLIP_VARIANTS } from './devices/flip/dimensions'
import type { TVVariant } from './objects/tv/dimensions'
import type { Orientation } from './orientation'

type Axes<K extends MockupKind> = { [P in keyof MockupPropsMap[K]]?: readonly NonNullable<MockupPropsMap[K][P]>[] }

const keys = <T extends object>(table: T) => Object.keys(table) as (keyof T)[]
const ORIENTATIONS: readonly Orientation[] = ['portrait', 'landscape']
/** Open and shut: the two poses with different screens. */
const POSES: readonly boolean[] = [true, false]
const TV_VARIANTS = ['legs', 'pedestal', 'frame'] as const satisfies readonly TVVariant[]
// Every TV variant listed: adding one to `TVVariant` without listing it here fails to typecheck.
const everyTvVariant: [Exclude<TVVariant, (typeof TV_VARIANTS)[number]>] extends [never] ? true : false = true
void everyTvVariant

/**
 * The props each kind is enumerated over; their Cartesian product is its
 * entries. A kind that is absent is catalogued once, at its default props.
 */
export const CATALOG_AXES: { [K in MockupKind]?: Axes<K> } = {
  galaxy: { variant: keys(GALAXY_VARIANTS), orientation: ORIENTATIONS },
  iphone: { variant: keys(IPHONE_VARIANTS), orientation: ORIENTATIONS },
  laptop: { variant: keys(LAPTOP_VARIANTS) },
  ipad: { variant: keys(IPAD_VARIANTS), orientation: ORIENTATIONS },
  galaxyTab: { variant: keys(GALAXY_TAB_VARIANTS), orientation: ORIENTATIONS },
  appleWatch: { variant: keys(APPLE_WATCH_VARIANTS) },
  galaxyWatch: { variant: keys(GALAXY_WATCH_VARIANTS) },
  fold: { variant: keys(FOLD_VARIANTS), openAngle: POSES, orientation: ORIENTATIONS },
  iphoneDuo: { variant: keys(IPHONE_DUO_VARIANTS), openAngle: POSES, orientation: ORIENTATIONS },
  flip: { variant: keys(FLIP_VARIANTS), openAngle: POSES, orientation: ORIENTATIONS },
  posterFrame: { mat: [false, true] },
  // `perforated` shares `full`'s rects, so enumerating it would duplicate rows.
  bus: { coverage: ['panel', 'full'] },
  van: { coverage: ['panel', 'full'] },
  tv: { variant: TV_VARIANTS },
}

/** The two kinds whose `size` prop is required have no meaningful default. */
export const CATALOG_REQUIRED_PROPS = {
  customPanel: { size: { width: 100, height: 150 } },
  customBox: { size: { width: 250, height: 90, depth: 160 } },
} satisfies { [K in MockupKind]?: MockupPropsMap[K] }

/** One catalog row: a kind at one combination of props, measured. */
export interface CatalogEntry {
  kind: MockupKind
  props: Record<string, unknown>
  mmPerUnit: number
  /** The primary region's name. */
  primary: string
  regions: {
    name: string
    label: string
    index: number
    units: { width: number; height: number }
    mm: { width: number; height: number }
    px: { width: number; height: number }
    resolution: number
    aspect: number
  }[]
}

/** Cartesian product of an axis table, always yielding at least `{}`. */
function combinations(axes: Record<string, readonly unknown[] | undefined> | undefined): Record<string, unknown>[] {
  let out: Record<string, unknown>[] = [{}]
  for (const [key, values] of Object.entries(axes ?? {})) {
    out = out.flatMap((base) => (values ?? []).map((value) => ({ ...base, [key]: value })))
  }
  return out
}

/** Every catalog row, in `MOCKUP_KINDS` order. */
export function catalogEntries(): CatalogEntry[] {
  return MOCKUP_KINDS.flatMap((kind) =>
    combinations(CATALOG_AXES[kind] as Record<string, readonly unknown[]> | undefined).map((combo) => {
      const props = { ...(CATALOG_REQUIRED_PROPS as Record<string, object>)[kind], ...combo }
      const info = (mockupInfo as (k: MockupKind, p: object) => ReturnType<typeof mockupInfo>)(kind, props)
      return {
        kind,
        props,
        mmPerUnit: info.mmPerUnit,
        primary: info.primary.name,
        regions: info.list.map((r) => ({
          name: r.name,
          label: r.label,
          index: r.index,
          units: r.units,
          mm: r.mm,
          px: r.px,
          resolution: r.resolution,
          aspect: r.aspect,
        })),
      }
    })
  )
}
