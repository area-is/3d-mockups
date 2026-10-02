/**
 * Device lifecycle: which product line every device variant belongs to, when
 * it was announced, and - once it is on its way out - the release that removes
 * it.
 *
 * A model moves through four stages, and only the last two are decisions
 * anybody makes:
 *
 * - **current** - the newest model in its line.
 * - **superseded** - a newer model in the same line is in the catalog. Derived,
 *   never declared: adding the iPhone 19 Pro supersedes the 18 Pro without an
 *   edit to the 18 Pro's entry. Fully supported; the docs list it behind
 *   "older models" instead of up front.
 * - **deprecated** - scheduled for removal, with `deprecated: { since, removeIn }`.
 *   It still renders, and says so once in development. Only a superseded model
 *   that is not its family's default can be deprecated (the tests hold both),
 *   so there is always a newer model to point at and removing it never moves a
 *   default.
 * - **removed** - the spec is gone. Its entry in `REMOVED_DEVICES` turns the
 *   variant id into an error naming the replacement, rather than a TypeError
 *   from deep inside a scene component.
 *
 * Removal is enforced, not remembered: once the package version reaches a
 * model's `removeIn`, the unit tests fail until the model is gone, so the
 * release that promised the removal cannot ship without it.
 *
 * Pure data and string math, and no spec imports - a scene component checks
 * its variant here without pulling in every other family's geometry.
 */

import type { MockupPropsMap } from './metrics'

/** The mockup kinds that model real devices in variants, and so in generations. */
export type DeviceKind =
  | 'galaxy'
  | 'iphone'
  | 'laptop'
  | 'ipad'
  | 'galaxyTab'
  | 'appleWatch'
  | 'galaxyWatch'
  | 'fold'
  | 'iphoneDuo'
  | 'flip'

/** The `variant` ids a device kind takes - `'pro'`, `'fold8'`… */
export type DeviceVariant<K extends DeviceKind> = NonNullable<MockupPropsMap[K]['variant']>

/** A release scheduled to remove a model. */
export interface DeviceDeprecation {
  /** The release that deprecates it - the next version, while the change is unreleased. */
  since: string
  /**
   * The release that removes it: a minor or major (`0.4.0`), because removing
   * a variant is a breaking change, and later than `since`.
   */
  removeIn: string
}

export interface DeviceRelease {
  /** The model's name: `'iPhone 17 Pro'`. */
  name: string
  /**
   * The product line - the models that replace one another. The 18 Pro
   * replaces the 17 Pro and not the 17 Pro Max, which is a line of its own:
   * tiers and sizes are separate lines because their makers refresh them on
   * separate schedules (the 14″ MacBook Pro took the M5 five months before
   * the 16″ did). Lines never cross kinds.
   */
  line: string
  /**
   * The month the model was announced, `'YYYY-MM'`. It orders a line: the
   * models announced in its latest month are current, everything before is
   * superseded by them.
   */
  announced: string
  /** Set to schedule the model's removal. See the stages above. */
  deprecated?: DeviceDeprecation
}

/**
 * Every device variant, by kind. Keyed by the variant ids themselves, so a
 * variant added to a `*_VARIANTS` table without a row here fails to typecheck.
 */
export const DEVICE_LINEUP: { readonly [K in DeviceKind]: Readonly<Record<DeviceVariant<K>, DeviceRelease>> } = {
  galaxy: {
    s26: { name: 'Galaxy S26', line: 'Galaxy S', announced: '2026-02' },
    s26ultra: { name: 'Galaxy S26 Ultra', line: 'Galaxy S Ultra', announced: '2026-02' },
  },
  iphone: {
    '17': { name: 'iPhone 17', line: 'iPhone', announced: '2025-09' },
    air: { name: 'iPhone 17 Air', line: 'iPhone Air', announced: '2025-09' },
    pro: { name: 'iPhone 17 Pro', line: 'iPhone Pro', announced: '2025-09' },
    promax: { name: 'iPhone 17 Pro Max', line: 'iPhone Pro Max', announced: '2025-09' },
    '18pro': { name: 'iPhone 18 Pro', line: 'iPhone Pro', announced: '2026-09' },
    '18promax': { name: 'iPhone 18 Pro Max', line: 'iPhone Pro Max', announced: '2026-09' },
  },
  laptop: {
    air13: { name: 'MacBook Air 13″', line: 'MacBook Air 13″', announced: '2026-03' },
    air15: { name: 'MacBook Air 15″', line: 'MacBook Air 15″', announced: '2026-03' },
    pro14: { name: 'MacBook Pro 14″', line: 'MacBook Pro 14″', announced: '2025-10' },
    pro16: { name: 'MacBook Pro 16″', line: 'MacBook Pro 16″', announced: '2026-03' },
    neo13: { name: 'MacBook Neo 13″', line: 'MacBook Neo', announced: '2026-03' },
  },
  ipad: {
    ipadpro13: { name: 'iPad Pro 13″', line: 'iPad Pro 13″', announced: '2025-10' },
    ipadpro11: { name: 'iPad Pro 11″', line: 'iPad Pro 11″', announced: '2025-10' },
    ipadair13: { name: 'iPad Air 13″', line: 'iPad Air 13″', announced: '2026-03' },
    ipadair11: { name: 'iPad Air 11″', line: 'iPad Air 11″', announced: '2026-03' },
    ipad11: { name: 'iPad 11″', line: 'iPad', announced: '2025-03' },
  },
  galaxyTab: {
    tabs11: { name: 'Galaxy Tab S11', line: 'Galaxy Tab S', announced: '2025-09' },
    tabs11ultra: { name: 'Galaxy Tab S11 Ultra', line: 'Galaxy Tab S Ultra', announced: '2025-09' },
  },
  appleWatch: {
    series11: { name: 'Apple Watch Series 11', line: 'Apple Watch Series', announced: '2025-09' },
    series12: { name: 'Apple Watch Series 12', line: 'Apple Watch Series', announced: '2026-09' },
    ultra4: { name: 'Apple Watch Ultra 4', line: 'Apple Watch Ultra', announced: '2026-09' },
  },
  galaxyWatch: {
    watch8: { name: 'Galaxy Watch 8', line: 'Galaxy Watch', announced: '2025-07' },
    watch9: { name: 'Galaxy Watch 9', line: 'Galaxy Watch', announced: '2026-07' },
    watchultra2: { name: 'Galaxy Watch Ultra 2', line: 'Galaxy Watch Ultra', announced: '2026-07' },
  },
  fold: {
    fold7: { name: 'Galaxy Z Fold 7', line: 'Galaxy Z Fold', announced: '2025-07' },
    // The wide Fold 8 and the Fold 8 Ultra (the Fold 7's chassis) are one
    // generation of one line: both replace the Fold 7.
    fold8: { name: 'Galaxy Z Fold 8', line: 'Galaxy Z Fold', announced: '2026-07' },
    fold8ultra: { name: 'Galaxy Z Fold 8 Ultra', line: 'Galaxy Z Fold', announced: '2026-07' },
  },
  iphoneDuo: {
    duo: { name: 'iPhone Duo', line: 'iPhone Duo', announced: '2026-09' },
  },
  flip: {
    flip7: { name: 'Galaxy Z Flip 7', line: 'Galaxy Z Flip', announced: '2025-07' },
    flip8: { name: 'Galaxy Z Flip 8', line: 'Galaxy Z Flip', announced: '2026-07' },
  },
}

/** Every device kind in the lineup, in its order. */
export const DEVICE_KINDS = Object.keys(DEVICE_LINEUP) as DeviceKind[]

/**
 * A model that has been removed, kept so its variant id fails with a pointer
 * to what replaced it. `replacement` is typed against the live variants, so
 * removing the replacement in turn fails to typecheck until this is updated.
 */
export type RemovedDevice = {
  [K in DeviceKind]: {
    kind: K
    variant: string
    name: string
    /** The release that removed it. */
    removedIn: string
    /** The variant to use instead. */
    replacement: DeviceVariant<K>
  }
}[DeviceKind]

/** Removed models, oldest removal first. */
export const REMOVED_DEVICES: readonly RemovedDevice[] = []

/** Where a model stands. `removed` models have no lifecycle - see `REMOVED_DEVICES`. */
export type DeviceStatus = 'current' | 'superseded' | 'deprecated'

export interface DeviceLifecycle<K extends DeviceKind = DeviceKind> extends DeviceRelease {
  kind: K
  variant: DeviceVariant<K>
  status: DeviceStatus
  /**
   * The newest models in the line - what replaces this one, in lineup order.
   * Empty when the model is current itself.
   */
  successors: { variant: DeviceVariant<K>; name: string }[]
}

const isDeviceKind = (kind: string): kind is DeviceKind => Object.hasOwn(DEVICE_LINEUP, kind)

/** The lineup rows of a kind, as `[variant, release]` pairs, in lineup order. */
function rowsOf<K extends DeviceKind>(kind: K): [DeviceVariant<K>, DeviceRelease][] {
  return Object.entries(DEVICE_LINEUP[kind]) as [DeviceVariant<K>, DeviceRelease][]
}

/** A kind's row for a variant id from anywhere - a prop, a URL, JavaScript. */
function releaseOf(kind: DeviceKind, variant: string): DeviceRelease | undefined {
  return Object.hasOwn(DEVICE_LINEUP[kind], variant)
    ? (DEVICE_LINEUP[kind] as Record<string, DeviceRelease>)[variant]
    : undefined
}

/**
 * Where a device variant stands: its line, whether something newer has
 * replaced it, and whether it is scheduled for removal.
 *
 * ```ts
 * deviceLifecycle('iphone', 'pro')
 * // { name: 'iPhone 17 Pro', line: 'iPhone Pro', status: 'superseded',
 * //   successors: [{ variant: '18pro', name: 'iPhone 18 Pro' }], … }
 * ```
 */
export function deviceLifecycle<K extends DeviceKind>(kind: K, variant: DeviceVariant<K>): DeviceLifecycle<K> {
  if (!isDeviceKind(kind)) {
    throw new Error(
      `[react-3d-mockups] deviceLifecycle: "${String(kind)}" is not a device kind. Device kinds: ${DEVICE_KINDS.join(', ')}.`
    )
  }
  const release = releaseOf(kind, String(variant))
  if (!release) {
    throw new Error(`[react-3d-mockups] deviceLifecycle("${kind}"): ${unknownVariant(kind, String(variant))}`)
  }

  const line = rowsOf(kind).filter(([, r]) => r.line === release.line)
  // 'YYYY-MM' sorts as text.
  const latest = line.reduce((max, [, r]) => (r.announced > max ? r.announced : max), release.announced)
  const successors =
    release.announced === latest
      ? []
      : line.filter(([, r]) => r.announced === latest).map(([id, r]) => ({ variant: id, name: r.name }))

  return {
    ...release,
    kind,
    variant,
    status: release.deprecated ? 'deprecated' : successors.length > 0 ? 'superseded' : 'current',
    successors,
  }
}

/** `variant="18pro" (iPhone 18 Pro) or variant="…" (…)` - what to switch to. */
function suggest(options: { variant: string; name: string }[]): string {
  return options.map((o) => `variant="${o.variant}" (${o.name})`).join(' or ')
}

function unknownVariant(kind: DeviceKind, variant: string): string {
  const removed = REMOVED_DEVICES.find((r) => r.kind === kind && r.variant === variant)
  if (removed) {
    return (
      `variant="${variant}" (${removed.name}) was removed in react-3d-mockups ${removed.removedIn}. ` +
      `Use ${suggest([{ variant: removed.replacement, name: releaseOf(kind, removed.replacement)?.name ?? removed.replacement }])} instead.`
    )
  }
  const known = rowsOf(kind)
    .map(([id]) => `"${id}"`)
    .join(', ')
  return `unknown variant "${variant}". Known variants: ${known}.`
}

/** The development warning a deprecated model prints when it renders. */
export function deprecationMessage(where: string, lifecycle: DeviceLifecycle): string {
  const { variant, name, deprecated, successors } = lifecycle
  return (
    `${where}: variant="${variant}" (${name}) is deprecated since ${deprecated?.since} and will be removed in ` +
    `react-3d-mockups ${deprecated?.removeIn}.` +
    (successors.length > 0 ? ` Use ${suggest(successors)} instead.` : '')
  )
}

// Typed locally: core is browser code and does not take node's types.
declare const process: { env: { NODE_ENV?: string } }

/**
 * Written as the literal `process.env.NODE_ENV` so every bundler can inline it
 * and drop the warning from production builds; the try covers an unbundled
 * page, where `process` does not exist and nothing is dev.
 */
const DEV = (() => {
  try {
    return process.env.NODE_ENV !== 'production'
  } catch {
    return false
  }
})()

const warned = new Set<string>()

/**
 * Throws a named error when `variant` is not one of `kind`'s - pointing at
 * the replacement when it is a removed model - and is a no-op for anything
 * else, including kinds that are not devices. `where` opens the message.
 */
export function assertDeviceVariant(kind: string, variant: unknown, where: string): void {
  if (variant === undefined || !isDeviceKind(kind)) return
  if (!releaseOf(kind, String(variant))) {
    throw new Error(`[react-3d-mockups] ${where}: ${unknownVariant(kind, String(variant))}`)
  }
}

/**
 * The check every device scene component runs on its `variant`: a named error
 * for an unknown or removed one (instead of a TypeError from reading its
 * spec), and, in development, one warning per deprecated model per page load.
 */
export function checkDeviceVariant<K extends DeviceKind>(kind: K, variant: DeviceVariant<K>, where: string): void {
  assertDeviceVariant(kind, variant, where)
  if (!DEV || !releaseOf(kind, String(variant))?.deprecated) return
  const key = `${kind}:${String(variant)}`
  if (warned.has(key)) return
  warned.add(key)
  // eslint-disable-next-line no-console
  console.warn(`[react-3d-mockups] ${deprecationMessage(where, deviceLifecycle(kind, variant))}`)
}

/**
 * The colorway mistake that fails silently: a `color` that is a colorway id
 * of ANOTHER variant of the family. `findColorway` misses it in this
 * variant's catalog, the id is then read as a CSS color, three.js logs
 * "Unknown color" at best, and the device renders grey -
 * `<GalaxyMockup variant="s26ultra" color="icyblue">` (an S26-only finish).
 * In development this names the variants that do have it, once per id.
 */
export function checkColorway(
  catalogs: Readonly<Record<string, readonly { id: string }[]>>,
  variant: string,
  color: string | undefined,
  where: string
): void {
  if (!DEV || !color) return
  const own = catalogs[variant] ?? []
  if (own.some((c) => c.id === color)) return
  const elsewhere = Object.keys(catalogs).filter((v) => catalogs[v]!.some((c) => c.id === color))
  if (elsewhere.length === 0) return
  const key = `color:${where}:${variant}:${color}`
  if (warned.has(key)) return
  warned.add(key)
  console.warn(
    `[react-3d-mockups] ${where}: color="${color}" is a colorway of ${elsewhere.map((v) => `variant="${v}"`).join(', ')}, ` +
      `not of variant="${variant}", so it was read as a CSS color. This variant's colorways: ` +
      `${own.map((c) => `"${c.id}"`).join(', ') || 'none'} - or pass any CSS color, such as a hex value.`
  )
}
