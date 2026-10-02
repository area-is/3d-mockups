import { afterEach, describe, expect, it, vi } from 'vitest'
import pkg from '../../../package.json'
import { mockupInfo, type MockupKind, type MockupPropsMap } from '../metrics'
import {
  DEVICE_KINDS,
  DEVICE_LINEUP,
  REMOVED_DEVICES,
  checkColorway,
  checkDeviceVariant,
  deprecationMessage,
  deviceLifecycle,
  type DeviceKind,
  type DeviceLifecycle,
  type DeviceRelease,
  type RemovedDevice,
} from '../lifecycle'
import { GALAXY_DEFAULT_VARIANT, GALAXY_VARIANTS } from '../devices/galaxy/dimensions'
import { IPHONE_DEFAULT_VARIANT, IPHONE_VARIANTS } from '../devices/iphone/dimensions'
import { LAPTOP_DEFAULT_VARIANT, LAPTOP_VARIANTS } from '../devices/laptop/dimensions'
import {
  GALAXY_TAB_DEFAULT_VARIANT,
  GALAXY_TAB_VARIANTS,
  IPAD_DEFAULT_VARIANT,
  IPAD_VARIANTS,
} from '../devices/tablet/dimensions'
import {
  APPLE_WATCH_DEFAULT_VARIANT,
  APPLE_WATCH_VARIANTS,
  GALAXY_WATCH_DEFAULT_VARIANT,
  GALAXY_WATCH_VARIANTS,
} from '../devices/watch/dimensions'
import {
  FOLD_DEFAULT_VARIANT,
  FOLD_VARIANTS,
  IPHONE_DUO_DEFAULT_VARIANT,
  IPHONE_DUO_VARIANTS,
} from '../devices/fold/dimensions'
import { FLIP_DEFAULT_VARIANT, FLIP_VARIANTS } from '../devices/flip/dimensions'

/**
 * The device lifecycle's rules, enforced.
 *
 * The lineup is hand-written data, and every way it can go wrong is silent:
 * a variant missing from it is a model nobody can deprecate, a deprecated
 * default moves the default the day it is removed, and a `removeIn` nobody
 * acts on is a promise in the changelog the release quietly breaks. The last
 * one is the reason this file reads the package version.
 */

/** Each device kind's spec table and the variant its components default to. */
const FAMILIES: Record<DeviceKind, { variants: object; defaultVariant: string }> = {
  galaxy: { variants: GALAXY_VARIANTS, defaultVariant: GALAXY_DEFAULT_VARIANT },
  iphone: { variants: IPHONE_VARIANTS, defaultVariant: IPHONE_DEFAULT_VARIANT },
  laptop: { variants: LAPTOP_VARIANTS, defaultVariant: LAPTOP_DEFAULT_VARIANT },
  ipad: { variants: IPAD_VARIANTS, defaultVariant: IPAD_DEFAULT_VARIANT },
  galaxyTab: { variants: GALAXY_TAB_VARIANTS, defaultVariant: GALAXY_TAB_DEFAULT_VARIANT },
  appleWatch: { variants: APPLE_WATCH_VARIANTS, defaultVariant: APPLE_WATCH_DEFAULT_VARIANT },
  galaxyWatch: { variants: GALAXY_WATCH_VARIANTS, defaultVariant: GALAXY_WATCH_DEFAULT_VARIANT },
  fold: { variants: FOLD_VARIANTS, defaultVariant: FOLD_DEFAULT_VARIANT },
  iphoneDuo: { variants: IPHONE_DUO_VARIANTS, defaultVariant: IPHONE_DUO_DEFAULT_VARIANT },
  flip: { variants: FLIP_VARIANTS, defaultVariant: FLIP_DEFAULT_VARIANT },
}

/*
 * A kind that takes a `variant` and is not a `DeviceKind` fails to typecheck
 * here, so a new device family cannot skip the lineup. The TV is the one
 * exception: its variants are two makers' designs, not generations of a line.
 * (`Record<string, never>` props have every key, hence the second test.)
 */
type KindsWithVariants = {
  [K in MockupKind]: 'variant' extends keyof MockupPropsMap[K]
    ? string extends keyof MockupPropsMap[K]
      ? never
      : K
    : never
}[MockupKind]
const everyDeviceKindListed: [Exclude<KindsWithVariants, DeviceKind | 'tv'>] extends [never] ? true : false = true

const ALL: DeviceLifecycle[] = DEVICE_KINDS.flatMap((kind) =>
  Object.keys(DEVICE_LINEUP[kind]).map((variant) => deviceLifecycle(kind, variant as never))
)

/** `[major, minor, patch, prerelease?]` of a plain semver, or null. */
function parse(version: string): [number, number, number, string | undefined] | null {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(version)
  return m ? [Number(m[1]), Number(m[2]), Number(m[3]), m[4]] : null
}

/** Semver precedence, prerelease below its release (identifiers compared as text). */
function compare(a: string, b: string): number {
  const x = parse(a)!
  const y = parse(b)!
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return (x[i] as number) - (y[i] as number)
  if (x[3] === y[3]) return 0
  if (x[3] === undefined) return 1
  if (y[3] === undefined) return -1
  return x[3] < y[3] ? -1 : 1
}

/**
 * Every rule a deprecation breaks, as messages - a function rather than a
 * loop of `expect`s so it can be pointed at made-up entries below and shown
 * to catch each mistake, not just to pass on today's lineup (which deprecates
 * nothing yet).
 */
function deprecationProblems(model: DeviceLifecycle, defaultVariant: string, version: string): string[] {
  const { deprecated, name } = model
  if (!deprecated) return []
  const problems: string[] = []
  const since = parse(deprecated.since)
  const removeIn = parse(deprecated.removeIn)
  if (!since) problems.push(`${name}: since "${deprecated.since}" is not a version`)
  if (!removeIn) problems.push(`${name}: removeIn "${deprecated.removeIn}" is not a version`)
  if (since && removeIn) {
    if (compare(deprecated.removeIn, deprecated.since) <= 0) {
      problems.push(`${name}: removeIn ${deprecated.removeIn} is not after since ${deprecated.since}`)
    }
    // Removing a variant breaks code that names it, so it waits for a minor
    // (or major) release - never a patch, never a prerelease.
    if (removeIn[2] !== 0 || removeIn[3] !== undefined) {
      problems.push(`${name}: removeIn ${deprecated.removeIn} is not a minor or major release`)
    }
    if (compare(version, deprecated.removeIn) >= 0) {
      problems.push(
        `${name} was due for removal in ${deprecated.removeIn} and the package is at ${version}: ` +
          'remove it (CONTRIBUTING.md, "Deprecating and removing a device"), or move removeIn later'
      )
    }
  }
  if (model.successors.length === 0) {
    problems.push(`${name}: only a model something newer has superseded can be deprecated`)
  }
  if (model.variant === defaultVariant) {
    problems.push(`${name}: the family default cannot be deprecated - change the default first, as its own breaking change`)
  }
  return problems
}

describe('the device lineup', () => {
  it('lists every device kind that has variants', () => {
    expect(everyDeviceKindListed).toBe(true)
    expect(DEVICE_KINDS).toEqual(Object.keys(FAMILIES))
  })

  it.each(DEVICE_KINDS)('%s: one row per variant, in the spec table’s order', (kind) => {
    expect(Object.keys(DEVICE_LINEUP[kind])).toEqual(Object.keys(FAMILIES[kind].variants))
  })

  it.each(ALL.map((m) => [m.name, m] as const))('%s: announced is a YYYY-MM month', (_name, model) => {
    expect(model.announced).toMatch(/^20\d\d-(0[1-9]|1[0-2])$/)
  })

  it('names every model once', () => {
    const names = ALL.map((m) => m.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('never lets a line cross kinds', () => {
    // A successor is always a variant of the same component, which is what
    // makes "use variant=… instead" a change of one prop.
    const kindOfLine = new Map<string, DeviceKind>()
    for (const { line, kind } of ALL) {
      expect(kindOfLine.get(line) ?? kind, line).toBe(kind)
      kindOfLine.set(line, kind)
    }
  })
})

describe('superseded models', () => {
  it('derives current from the newest month in each line', () => {
    for (const model of ALL) {
      const line = ALL.filter((m) => m.kind === model.kind && m.line === model.line)
      const latest = line.map((m) => m.announced).sort().at(-1)
      expect(model.successors.length === 0, model.name).toBe(model.announced === latest)
      for (const successor of model.successors) {
        const next = deviceLifecycle(model.kind, successor.variant as never)
        expect(next.line).toBe(model.line)
        expect(next.announced).toBe(latest)
        expect(next.status).not.toBe('superseded')
      }
    }
  })

  it('supersedes the 2025 models the 2026 generation replaced', () => {
    const older = ALL.filter((m) => m.status !== 'current').map((m) => `${m.kind}:${String(m.variant)}`)
    for (const id of ['iphone:pro', 'iphone:promax', 'fold:fold7', 'flip:flip7', 'appleWatch:series11', 'galaxyWatch:watch8']) {
      expect(older).toContain(id)
    }
  })

  it('keeps tiers and sizes in separate lines', () => {
    // The 18 Pro replaces the 17 Pro; the 17 Pro Max waits for the 18 Pro Max.
    expect(deviceLifecycle('iphone', 'promax').successors.map((s) => s.variant)).not.toContain('18pro')
    // The 14″ MacBook Pro is the older M5, and still the newest 14″.
    expect(deviceLifecycle('laptop', 'pro14').status).toBe('current')
  })

  it('names both Fold 8s as the Fold 7’s successors', () => {
    const fold7 = deviceLifecycle('fold', 'fold7')
    expect(fold7.successors.map((s) => s.variant).sort()).toEqual(['fold8', 'fold8ultra'])
  })

  it('throws by name for an unknown kind or variant', () => {
    expect(() => deviceLifecycle('tv' as DeviceKind, 'x' as never)).toThrow(/"tv" is not a device kind/)
    expect(() => deviceLifecycle('iphone', 'nope' as never)).toThrow(/unknown variant "nope".*"18pro"/)
  })
})

describe('deprecations', () => {
  it.each(DEVICE_KINDS)('%s: every deprecation follows the rules', (kind) => {
    const problems = ALL.filter((m) => m.kind === kind).flatMap((m) =>
      deprecationProblems(m, FAMILIES[kind].defaultVariant, pkg.version)
    )
    expect(problems).toEqual([])
  })

  /** The iPhone 17 Pro, as if deprecated with `deprecated`. */
  const proWith = (deprecated: DeviceRelease['deprecated']): DeviceLifecycle => ({
    ...deviceLifecycle('iphone', 'pro'),
    status: 'deprecated',
    deprecated,
  })

  it('accepts a well-formed deprecation of a superseded model', () => {
    expect(deprecationProblems(proWith({ since: '0.2.0', removeIn: '0.4.0' }), '17', '0.2.0')).toEqual([])
    // A prerelease of the removing version is still before it.
    expect(deprecationProblems(proWith({ since: '0.2.0', removeIn: '1.0.0' }), '17', '1.0.0-rc.1')).toEqual([])
  })

  it('fails the release that was meant to remove it', () => {
    const due = proWith({ since: '0.2.0', removeIn: '0.4.0' })
    expect(deprecationProblems(due, '17', '0.3.9')).toEqual([])
    expect(deprecationProblems(due, '17', '0.4.0')).toEqual([expect.stringMatching(/due for removal in 0\.4\.0/)])
    expect(deprecationProblems(due, '17', '0.5.0')).toHaveLength(1)
  })

  it('rejects removal in a patch, or before the deprecation', () => {
    expect(deprecationProblems(proWith({ since: '0.2.0', removeIn: '0.2.1' }), '17', '0.1.1')).toEqual([
      expect.stringMatching(/not a minor or major/),
    ])
    expect(deprecationProblems(proWith({ since: '0.3.0', removeIn: '0.3.0' }), '17', '0.1.1')).toEqual([
      expect.stringMatching(/not after since/),
    ])
    expect(deprecationProblems(proWith({ since: 'soon', removeIn: '0.3.0' }), '17', '0.1.1')).toEqual([
      expect.stringMatching(/not a version/),
    ])
  })

  it('rejects deprecating a current model or a default', () => {
    const current = { ...deviceLifecycle('iphone', '18pro'), deprecated: { since: '0.2.0', removeIn: '0.3.0' } }
    expect(deprecationProblems(current, '17', '0.1.1')).toEqual([expect.stringMatching(/superseded/)])
    expect(deprecationProblems(proWith({ since: '0.2.0', removeIn: '0.3.0' }), 'pro', '0.1.1')).toEqual([
      expect.stringMatching(/family default/),
    ])
  })
})

describe('removed models', () => {
  // One test over the list rather than `it.each`: the list starts empty, and
  // an empty `each` leaves a suite with no tests, which vitest fails.
  it('stay removed, each with a live replacement', () => {
    for (const removed of REMOVED_DEVICES) {
      const live = Object.keys(DEVICE_LINEUP[removed.kind])
      expect(live, removed.name).not.toContain(removed.variant)
      expect(live, removed.name).toContain(removed.replacement)
      // A tombstone is written by the release that removes the model, never ahead of it.
      expect(parse(removed.removedIn), removed.name).not.toBeNull()
      expect(compare(removed.removedIn, pkg.version), removed.name).toBeLessThanOrEqual(0)
    }
  })
})

describe('checkDeviceVariant', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('names an unknown variant and the known ones, where the props were passed', () => {
    expect(() => checkDeviceVariant('iphone', 'nope' as never, 'IPhone')).toThrow(
      /\[react-3d-mockups\] IPhone: unknown variant "nope"\. Known variants: "17", "air"/
    )
    expect(() => mockupInfo('iphone', { variant: 'nope' as never })).toThrow(/mockupInfo\("iphone"\): unknown variant "nope"/)
  })

  it('passes a live variant, and leaves kinds without generations alone', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => checkDeviceVariant('iphone', 'pro', 'IPhone')).not.toThrow()
    expect(() => mockupInfo('tv', { variant: 'frame' })).not.toThrow()
    expect(warn).not.toHaveBeenCalled()
  })

  it('points a removed variant at its replacement', () => {
    const removed: RemovedDevice = {
      kind: 'iphone',
      variant: '16pro',
      name: 'iPhone 16 Pro',
      removedIn: '0.1.0',
      replacement: '18pro',
    }
    ;(REMOVED_DEVICES as RemovedDevice[]).push(removed)
    try {
      expect(() => checkDeviceVariant('iphone', '16pro' as never, 'IPhone')).toThrow(
        /IPhone: variant="16pro" \(iPhone 16 Pro\) was removed in react-3d-mockups 0\.1\.0\. Use variant="18pro" \(iPhone 18 Pro\) instead\./
      )
    } finally {
      ;(REMOVED_DEVICES as RemovedDevice[]).pop()
    }
  })

  it('warns once per deprecated model, naming the release and the successor', () => {
    const lineup = DEVICE_LINEUP.iphone as Record<string, DeviceRelease>
    const original = lineup.promax!
    lineup.promax = { ...original, deprecated: { since: '0.2.0', removeIn: '0.4.0' } }
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      checkDeviceVariant('iphone', 'promax', 'IPhone')
      checkDeviceVariant('iphone', 'promax', 'IPhone')
      expect(warn).toHaveBeenCalledTimes(1)
      expect(warn.mock.calls[0]![0]).toBe(
        '[react-3d-mockups] IPhone: variant="promax" (iPhone 17 Pro Max) is deprecated since 0.2.0 and will be ' +
          'removed in react-3d-mockups 0.4.0. Use variant="18promax" (iPhone 18 Pro Max) instead.'
      )
    } finally {
      lineup.promax = original
    }
  })

  it('lists every successor when a line has several', () => {
    const fold7 = { ...deviceLifecycle('fold', 'fold7'), deprecated: { since: '0.2.0', removeIn: '0.3.0' } }
    expect(deprecationMessage('Fold', fold7)).toMatch(
      /Use variant="fold8" \(Galaxy Z Fold 8\) or variant="fold8ultra" \(Galaxy Z Fold 8 Ultra\) instead\.$/
    )
  })
})

describe('checkColorway', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('names the variants that have a colorway this one lacks, once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const catalogs = { s26: [{ id: 'icyblue' }, { id: 'navy' }], s26ultra: [{ id: 'titaniumgray' }] }
    checkColorway(catalogs, 's26ultra', 'icyblue', 'Galaxy')
    checkColorway(catalogs, 's26ultra', 'icyblue', 'Galaxy')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]![0]).toMatch(
      /Galaxy: color="icyblue" is a colorway of variant="s26", not of variant="s26ultra".*"titaniumgray"/
    )
  })

  it('stays quiet for its own colorways and for plain CSS colors', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const catalogs = { a: [{ id: 'red-ish' }], b: [{ id: 'blue-ish' }] }
    checkColorway(catalogs, 'a', 'red-ish', 'X')
    checkColorway(catalogs, 'a', '#ff0000', 'X')
    checkColorway(catalogs, 'a', 'rebeccapurple', 'X')
    checkColorway(catalogs, 'a', undefined, 'X')
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('the TV', () => {
  it('names an unknown design instead of falling back to the default', () => {
    expect(() => mockupInfo('tv', { variant: 'wall' as never })).toThrow(/TVSet: unknown variant "wall"\. Known variants: "legs"/)
  })
})
