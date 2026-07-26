/**
 * `mockupInfo` — the measurement API.
 *
 * Every device and object already declares its live regions (`*_REGIONS`) and
 * their geometry (`*_METRICS`) next to its dimensions. This module joins the
 * two into one answer to the question "how big is this surface?", in all three
 * unit systems a developer actually works in:
 *
 * - **world units** — what a three.js scene is built from;
 * - **millimetres** — what a print shop or a spec sheet wants;
 * - **CSS pixels** — what the content you drop onto the surface lays out in.
 *
 * The CSS-pixel numbers come from the same `screenPxPerUnit` / `screenCssHeight`
 * helpers the renderer feeds its screen bridge, so what this reports and what
 * actually renders cannot drift apart.
 *
 * ```ts
 * const info = mockupInfo('galaxy', { variant: 's26', orientation: 'landscape' })
 * info.regions.screen.px    // { width: 780, height: 360 }
 * info.regions.screen.mm    // { width: 145.2, height: 67 }
 * info.regions.screen.units // { width: 3.962, height: 1.829 }
 * ```
 *
 * Pure data in, pure data out: no renderer, no DOM, no React. It runs in a
 * build script or on a server just as well as in a component.
 */

import type { Orientation } from './orientation'
import type { RegionMetrics, RegionRadius, RegionSpec } from './regions'
import { SCREEN_REGIONS } from './regions'
import { screenCssHeight, screenPxPerUnit } from './screen/surface'

import { GALAXY_METRICS, type GalaxyVariant } from './devices/galaxy/dimensions'
import { IPHONE_METRICS, type IPhoneVariant } from './devices/iphone/dimensions'
import { LAPTOP_METRICS, type LaptopVariant } from './devices/laptop/dimensions'
import {
  IPAD_METRICS,
  GALAXY_TAB_METRICS,
  type IPadVariant,
  type GalaxyTabVariant,
} from './devices/tablet/dimensions'
import {
  APPLE_WATCH_METRICS,
  GALAXY_WATCH_METRICS,
  type AppleWatchVariant,
  type GalaxyWatchVariant,
} from './devices/watch/dimensions'
import { STUDIO_DISPLAY_METRICS } from './devices/studio-display/dimensions'
import { FOLD_METRICS, type FoldVariant } from './devices/fold/dimensions'
import { FLIP_METRICS, type FlipVariant } from './devices/flip/dimensions'

import { BOOK_METRICS, BOOK_REGIONS, type BookSize } from './objects/book/dimensions'
import { MAGAZINE_METRICS, MAGAZINE_REGIONS, type MagazineSize } from './objects/magazine/dimensions'
import { BROCHURE_METRICS, BROCHURE_REGIONS, type BrochureSize } from './objects/brochure/dimensions'
import { BUSINESS_CARD_METRICS, BUSINESS_CARD_REGIONS } from './objects/business-card/dimensions'
import {
  POSTER_FRAME_METRICS,
  POSTER_FRAME_REGIONS,
  type PosterFrameSize,
} from './objects/poster-frame/dimensions'
import { BILLBOARD_METRICS, BILLBOARD_REGIONS } from './objects/billboard/dimensions'
import { ID_CARD_METRICS, ID_CARD_REGIONS } from './objects/id-card/dimensions'
import {
  PRODUCT_BOX_METRICS,
  PRODUCT_BOX_REGIONS,
  type ProductBoxSizeMm,
} from './objects/product-box/dimensions'
import { ROLLUP_BANNER_METRICS, ROLLUP_BANNER_REGIONS, type RollupBannerSize } from './objects/rollup-banner/dimensions'
import { BUS_SHELTER_METRICS, BUS_SHELTER_REGIONS } from './objects/bus-shelter/dimensions'
import { GREETING_CARD_METRICS, GREETING_CARD_REGIONS } from './objects/greeting-card/dimensions'
import { VINYL_RECORD_METRICS, VINYL_RECORD_REGIONS } from './objects/vinyl-record/dimensions'
import { TV_METRICS } from './objects/tv/dimensions'
import { A_FRAME_SIGN_METRICS, A_FRAME_SIGN_REGIONS } from './objects/a-frame-sign/dimensions'
import { DOOH_TOTEM_METRICS, DOOH_TOTEM_REGIONS, type DoohTotemSize } from './objects/dooh-totem/dimensions'
import { SEMI_TRAILER_METRICS, SEMI_TRAILER_REGIONS } from './objects/semi-trailer/dimensions'
import { MAILER_BOX_METRICS, MAILER_BOX_REGIONS, type MailerBoxSizeMm } from './objects/mailer-box/dimensions'
import { SHOPPING_BAG_METRICS, SHOPPING_BAG_REGIONS, type ShoppingBagSizeMm } from './objects/shopping-bag/dimensions'
import { CUSTOM_PANEL_METRICS, CUSTOM_PANEL_REGIONS, type CustomSizeMm } from './objects/custom-panel/dimensions'
import { CUSTOM_BOX_METRICS, CUSTOM_BOX_REGIONS, type CustomBoxSizeMm } from './objects/custom-box/dimensions'

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

/**
 * The props each mockup kind's geometry depends on. Only the plain-data props
 * that move a surface appear here — colors, `float`, transforms and the rest
 * cannot change a measurement, so they are omitted.
 */
export interface MockupPropsMap {
  galaxy: { variant?: GalaxyVariant; orientation?: Orientation }
  iphone: { variant?: IPhoneVariant; orientation?: Orientation }
  laptop: { variant?: LaptopVariant }
  ipad: { variant?: IPadVariant; orientation?: Orientation }
  galaxyTab: { variant?: GalaxyTabVariant; orientation?: Orientation }
  appleWatch: { variant?: AppleWatchVariant }
  galaxyWatch: { variant?: GalaxyWatchVariant }
  studioDisplay: Record<string, never>
  fold: { variant?: FoldVariant; open?: boolean; orientation?: Orientation }
  flip: { variant?: FlipVariant; open?: boolean; orientation?: Orientation }
  book: { size?: BookSize }
  magazine: { size?: MagazineSize }
  brochure: { size?: BrochureSize; panels?: number }
  businessCard: Record<string, never>
  posterFrame: { size?: PosterFrameSize; mat?: boolean }
  billboard: Record<string, never>
  idCard: Record<string, never>
  productBox: { size?: ProductBoxSizeMm }
  rollupBanner: { size?: RollupBannerSize }
  busShelter: Record<string, never>
  greetingCard: Record<string, never>
  vinylRecord: Record<string, never>
  tv: { inches?: number }
  aFrameSign: Record<string, never>
  doohTotem: { size?: DoohTotemSize }
  semiTrailer: Record<string, never>
  mailerBox: { size?: MailerBoxSizeMm }
  shoppingBag: { size?: ShoppingBagSizeMm }
  customPanel: { size: CustomSizeMm }
  customBox: { size: CustomBoxSizeMm }
}

/**
 * Every mockup the library can measure.
 *
 * `van`, `bus` and `storefront` are deliberately absent: their surfaces are
 * still sized inside the React scene components (wrap-coverage variants, ten
 * hand-placed window panes), so there is nothing in core to measure yet.
 * Declaring them here with numbers copied out of a component is exactly the
 * drift this API exists to prevent — they join the registry when their
 * geometry moves down into their specs.
 */
export type MockupKind = keyof MockupPropsMap

interface Entry {
  regions: readonly RegionSpec[]
  // Props are validated by `mockupInfo`'s public signature; inside the registry
  // the 33 prop shapes are deliberately erased so one table can hold them all.
  metrics: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mmPerUnit: number | ((props: any) => number)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    regions: (props: any) => Record<string, RegionMetrics | RegionMetrics[]>
  }
}

/**
 * The registry every measurement is read from. Adding a device or object means
 * adding one row here — and a binding, a docs page or the generated catalog
 * picks it up without further edits.
 */
const REGISTRY: Record<MockupKind, Entry> = {
  galaxy: { regions: SCREEN_REGIONS, metrics: GALAXY_METRICS },
  iphone: { regions: SCREEN_REGIONS, metrics: IPHONE_METRICS },
  laptop: { regions: SCREEN_REGIONS, metrics: LAPTOP_METRICS },
  ipad: { regions: SCREEN_REGIONS, metrics: IPAD_METRICS },
  galaxyTab: { regions: SCREEN_REGIONS, metrics: GALAXY_TAB_METRICS },
  appleWatch: { regions: SCREEN_REGIONS, metrics: APPLE_WATCH_METRICS },
  galaxyWatch: { regions: SCREEN_REGIONS, metrics: GALAXY_WATCH_METRICS },
  studioDisplay: { regions: SCREEN_REGIONS, metrics: STUDIO_DISPLAY_METRICS },
  fold: { regions: SCREEN_REGIONS, metrics: FOLD_METRICS },
  flip: { regions: SCREEN_REGIONS, metrics: FLIP_METRICS },
  book: { regions: BOOK_REGIONS, metrics: BOOK_METRICS },
  magazine: { regions: MAGAZINE_REGIONS, metrics: MAGAZINE_METRICS },
  brochure: { regions: BROCHURE_REGIONS, metrics: BROCHURE_METRICS },
  businessCard: { regions: BUSINESS_CARD_REGIONS, metrics: BUSINESS_CARD_METRICS },
  posterFrame: { regions: POSTER_FRAME_REGIONS, metrics: POSTER_FRAME_METRICS },
  billboard: { regions: BILLBOARD_REGIONS, metrics: BILLBOARD_METRICS },
  idCard: { regions: ID_CARD_REGIONS, metrics: ID_CARD_METRICS },
  productBox: { regions: PRODUCT_BOX_REGIONS, metrics: PRODUCT_BOX_METRICS },
  rollupBanner: { regions: ROLLUP_BANNER_REGIONS, metrics: ROLLUP_BANNER_METRICS },
  busShelter: { regions: BUS_SHELTER_REGIONS, metrics: BUS_SHELTER_METRICS },
  greetingCard: { regions: GREETING_CARD_REGIONS, metrics: GREETING_CARD_METRICS },
  vinylRecord: { regions: VINYL_RECORD_REGIONS, metrics: VINYL_RECORD_METRICS },
  tv: { regions: SCREEN_REGIONS, metrics: TV_METRICS },
  aFrameSign: { regions: A_FRAME_SIGN_REGIONS, metrics: A_FRAME_SIGN_METRICS },
  doohTotem: { regions: DOOH_TOTEM_REGIONS, metrics: DOOH_TOTEM_METRICS },
  semiTrailer: { regions: SEMI_TRAILER_REGIONS, metrics: SEMI_TRAILER_METRICS },
  mailerBox: { regions: MAILER_BOX_REGIONS, metrics: MAILER_BOX_METRICS },
  shoppingBag: { regions: SHOPPING_BAG_REGIONS, metrics: SHOPPING_BAG_METRICS },
  customPanel: { regions: CUSTOM_PANEL_REGIONS, metrics: CUSTOM_PANEL_METRICS },
  customBox: { regions: CUSTOM_BOX_REGIONS, metrics: CUSTOM_BOX_METRICS },
}

/** Every measurable mockup kind, in a stable order (devices first). */
export const MOCKUP_KINDS = Object.keys(REGISTRY) as MockupKind[]

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

/**
 * Measure a mockup without rendering it.
 *
 * @param kind  Which mockup — `'galaxy'`, `'book'`, `'customBox'`…
 * @param props The geometry-affecting props you would pass the component
 *              (`variant`, `orientation`, `size`, `open`…). Defaults match the
 *              component's own defaults, so `mockupInfo('galaxy')` describes
 *              exactly what `<GalaxyMockup />` renders.
 */
export function mockupInfo<K extends MockupKind>(kind: K, props?: MockupPropsMap[K]): MockupInfo {
  const entry = REGISTRY[kind]
  if (!entry) {
    throw new Error(
      `[area-mockups] mockupInfo: unknown mockup kind "${String(kind)}". Known kinds: ${MOCKUP_KINDS.join(', ')}.`
    )
  }
  const args = props ?? {}
  const mmPerUnit =
    typeof entry.metrics.mmPerUnit === 'function' ? entry.metrics.mmPerUnit(args) : entry.metrics.mmPerUnit
  const resolved = entry.metrics.regions(args)

  const regions: Record<string, RegionInfo | RegionInfo[]> = {}
  const list: RegionInfo[] = []
  for (const spec of entry.regions) {
    const value = resolved[spec.name]
    if (value === undefined) continue
    if (Array.isArray(value)) {
      const many = value.map((m, i) => describe(spec, m, mmPerUnit, i))
      regions[spec.name] = many
      list.push(...many)
    } else {
      const one = describe(spec, value, mmPerUnit, 0)
      regions[spec.name] = one
      list.push(one)
    }
  }

  const primary = list[0]
  if (!primary) {
    throw new Error(`[area-mockups] mockupInfo: "${String(kind)}" resolved no regions.`)
  }
  return { kind, mmPerUnit, primary, regions, list }
}
