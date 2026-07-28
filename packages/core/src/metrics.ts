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
 * Building the registry means referencing every spec module, so importing
 * `mockupInfo` pulls the whole catalog in. That is the right trade for a
 * runtime-string lookup, and the wrong one for a component that already knows
 * its own spec — those call `describeMockup` from `./measure` instead.
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
import type { RegionMetrics, RegionSpec } from './regions'
import { SCREEN_REGIONS } from './regions'
import { describeMockup, type MockupInfo, type RegionInfo, type Size } from './measure'

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
import { BUS_METRICS, BUS_REGIONS, type BusCoverage } from './objects/bus/dimensions'
import { VAN_METRICS, VAN_REGIONS, type VanCoverage } from './objects/van/dimensions'
import { STOREFRONT_METRICS, STOREFRONT_REGIONS } from './objects/storefront/dimensions'
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


export { describeMockup, type MeasurableMockup } from './measure'
export type { MockupInfo, RegionInfo, Size } from './measure'

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
  bus: { coverage?: BusCoverage }
  van: { coverage?: VanCoverage }
  storefront: Record<string, never>
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

/** Every mockup the library can measure — the whole catalog. */
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
  bus: { regions: BUS_REGIONS, metrics: BUS_METRICS },
  van: { regions: VAN_REGIONS, metrics: VAN_METRICS },
  storefront: { regions: STOREFRONT_REGIONS, metrics: STOREFRONT_METRICS },
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
      `[area-3d-mockups] mockupInfo: unknown mockup kind "${String(kind)}". Known kinds: ${MOCKUP_KINDS.join(', ')}.`
    )
  }
  return describeMockup({ kind, regions: entry.regions, metrics: entry.metrics }, props)
}
