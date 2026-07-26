/**
 * The measurement engine — pure, and deliberately free of any spec imports.
 *
 * `mockupInfo` in `metrics.ts` is a *registry* over this: convenient when the
 * kind is a runtime string (the generated catalog, docs tooling), but it has
 * to reference every spec module to build its table. A component already knows
 * its own spec, so `createMockup` calls `describeMockup` directly instead —
 * which is what keeps importing one mockup from pulling in all thirty.
 */

import type { RegionMetrics, RegionRadius, RegionSpec } from './regions'
// Type-only, so it is erased at build time: `measure.ts` names the kind union
// without ever pulling in the registry module that owns it.
import type { MockupKind } from './metrics'
import { screenCssHeight, screenPxPerUnit } from './screen/surface'

/** A width/height pair in whichever unit the containing field names. */
export interface Size {
  width: number
  height: number
}

/** Everything known about one live region of a configured mockup. */
export interface RegionInfo {
  /** Region id — the slot name (`front` → `<Mockup.Front>`). */
  name: string
  /** Short human label, e.g. `'Front cover'`. */
  label: string
  /** Whether the region takes any number of slot elements. */
  repeats: boolean
  /** Position within a repeating region; `0` for single regions. */
  index: number
  /** The live rect in three.js world units. */
  units: Size
  /** The live rect in millimetres — the physical size of the printed surface. */
  mm: Size
  /**
   * The live rect in CSS pixels: the viewport your content lays out in at this
   * region's default `resolution`. Pass a `resolution` prop to change it.
   */
  px: Size
  /** CSS pixels per world unit at the default resolution. */
  pxPerUnit: number
  /** Default CSS pixel width of the region's virtual surface. */
  resolution: number
  /** Corner rounding, in world units and in CSS pixels. */
  radius: { units: RegionRadius; px: RegionRadius }
  /** Aspect ratio of the live rect (width ÷ height). */
  aspect: number
}

/** Everything known about a configured mockup. */
export interface MockupInfo {
  /** The mockup kind this describes. */
  kind: MockupKind
  /** Millimetres per world unit for this family. */
  mmPerUnit: number
  /**
   * The primary region — the first one declared, and where bare (non-slot)
   * children render.
   */
  primary: RegionInfo
  /**
   * Every region by name. A repeating region (brochure panels) holds an array,
   * one entry per surface.
   */
  regions: Record<string, RegionInfo | RegionInfo[]>
  /** Every region in declaration order, repeats flattened. */
  list: RegionInfo[]
}


/** Round to `places` decimals without dragging float noise into the output. */
function round(value: number, places: number): number {
  const f = 10 ** places
  return Math.round(value * f) / f
}

function scaleRadius(radius: RegionRadius, factor: number): RegionRadius {
  return typeof radius === 'number'
    ? round(radius * factor, 2)
    : [
        round(radius[0] * factor, 2),
        round(radius[1] * factor, 2),
        round(radius[2] * factor, 2),
        round(radius[3] * factor, 2),
      ]
}

function describe(spec: RegionSpec, metrics: RegionMetrics, mmPerUnit: number, index: number): RegionInfo {
  const { width, height, resolution } = metrics
  const radius = metrics.radius ?? 0
  const pxPerUnit = screenPxPerUnit(resolution, width)
  return {
    name: spec.name,
    label: spec.label,
    repeats: spec.repeats === true,
    index,
    units: { width, height },
    mm: { width: round(width * mmPerUnit, 1), height: round(height * mmPerUnit, 1) },
    // Derived with the renderer's own helper, so the reported height is the
    // height the surface is actually given — rounding included.
    px: { width: resolution, height: screenCssHeight(resolution, width, height) },
    pxPerUnit: round(pxPerUnit, 2),
    resolution,
    radius: { units: radius, px: scaleRadius(radius, pxPerUnit) },
    aspect: round(width / height, 4),
  }
}

/** A spec's own region list and metrics, as every `*_REGIONS` / `*_METRICS` pair supplies them. */
export interface MeasurableMockup<P> {
  kind: MockupKind
  regions: readonly RegionSpec[]
  metrics: {
    mmPerUnit: number | ((props: P) => number)
    regions: (props: P) => Record<string, RegionMetrics | RegionMetrics[]>
  }
}

/**
 * Measure one mockup from its own spec — no registry, so a caller only pays
 * for the spec it names.
 */
export function describeMockup<P>({ kind, regions, metrics }: MeasurableMockup<P>, props?: P): MockupInfo {
  const args = (props ?? {}) as P
  const mmPerUnit = typeof metrics.mmPerUnit === 'function' ? metrics.mmPerUnit(args) : metrics.mmPerUnit
  const resolved = metrics.regions(args)

  const byName: Record<string, RegionInfo | RegionInfo[]> = {}
  const list: RegionInfo[] = []
  for (const spec of regions) {
    const value = resolved[spec.name]
    if (value === undefined) continue
    if (Array.isArray(value)) {
      const many = value.map((m, i) => describe(spec, m, mmPerUnit, i))
      byName[spec.name] = many
      list.push(...many)
    } else {
      const one = describe(spec, value, mmPerUnit, 0)
      byName[spec.name] = one
      list.push(one)
    }
  }

  const primary = list[0]
  if (!primary) {
    throw new Error(`[area-mockups] describeMockup: "${String(kind)}" resolved no regions.`)
  }
  return { kind, mmPerUnit, primary, regions: byName, list }
}
