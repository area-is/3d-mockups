// All-in-one 3D mockups (canvas + device in one component).
export { GalaxyMockup, type GalaxyMockupProps } from './galaxy-mockup'
export { IPhoneMockup, type IPhoneMockupProps } from './iphone-mockup'
export { LaptopMockup, type LaptopMockupProps } from './laptop-mockup'
export { IPadMockup, type IPadMockupProps } from './ipad-mockup'
export { GalaxyTabMockup, type GalaxyTabMockupProps } from './galaxy-tab-mockup'
export { AppleWatchMockup, type AppleWatchMockupProps } from './apple-watch-mockup'
export { GalaxyWatchMockup, type GalaxyWatchMockupProps } from './galaxy-watch-mockup'
export { StudioDisplayMockup, type StudioDisplayMockupProps } from './studio-display-mockup'
export { FoldMockup, type FoldMockupProps } from './fold-mockup'
export { FlipMockup, type FlipMockupProps } from './flip-mockup'
export { TumbleControls, type TumbleControlsProps, type TumbleControlsHandle } from './tumble-controls'

// All-in-one 3D object mockups (print, packaging, out-of-home, vehicles).
export { BookMockup, type BookMockupProps } from './book-mockup'
export { MagazineMockup, type MagazineMockupProps } from './magazine-mockup'
export { BrochureMockup, type BrochureMockupProps } from './brochure-mockup'
export { BusinessCardMockup, type BusinessCardMockupProps } from './business-card-mockup'
export { PosterFrameMockup, type PosterFrameMockupProps } from './poster-frame-mockup'
export { BillboardMockup, type BillboardMockupProps } from './billboard-mockup'
export { VanMockup, type VanMockupProps } from './van-mockup'
export { IDCardMockup, type IDCardMockupProps } from './id-card-mockup'
export { BusMockup, type BusMockupProps } from './bus-mockup'
export { ProductBoxMockup, type ProductBoxMockupProps } from './product-box-mockup'
export { RollupBannerMockup, type RollupBannerMockupProps } from './rollup-banner-mockup'
export { BusShelterMockup, type BusShelterMockupProps } from './bus-shelter-mockup'
export { GreetingCardMockup, type GreetingCardMockupProps } from './greeting-card-mockup'
export { VinylRecordMockup, type VinylRecordMockupProps } from './vinyl-record-mockup'
export { TVSetMockup, type TVSetMockupProps } from './tv-mockup'
export { AFrameSignMockup, type AFrameSignMockupProps } from './a-frame-sign-mockup'
export { DOOHTotemMockup, type DOOHTotemMockupProps } from './dooh-totem-mockup'
export { StorefrontMockup, type StorefrontMockupProps } from './storefront-mockup'
export { SemiTrailerMockup, type SemiTrailerMockupProps } from './semi-trailer-mockup'
export { MailerBoxMockup, type MailerBoxMockupProps } from './mailer-box-mockup'
export { ShoppingBagMockup, type ShoppingBagMockupProps } from './shopping-bag-mockup'
export { CustomPanelMockup, type CustomPanelMockupProps } from './custom-panel-mockup'
export { CustomBoxMockup, type CustomBoxMockupProps } from './custom-box-mockup'

// The slot machinery + wrapper factory (advanced: build your own mockup objects
// with the same compound-slot API and stage framing the built-ins use).
export { createMockup, type CreateMockupOptions, type MockupProps } from './create-mockup'
export {
  createSlot,
  createSlots,
  collectSlots,
  resolveSurface,
  type Slot,
  type SlotProps,
  type SlotsFor,
  type CollectedSlots,
  type SurfaceProps,
  type SurfaceDefaults,
  type ResolvedSurface,
} from './slots'
export { type BrochurePanelProps } from './objects/brochure/brochure'

// Composable pieces: bring your own scene, or drop a device into an existing one.
export { MockupCanvas, type MockupCanvasProps } from './mockup-canvas'
export { LEDText, type LEDTextProps } from './led-text'
export { Galaxy, type GalaxyProps } from './devices/galaxy/galaxy'
export { IPhone, type IPhoneProps } from './devices/iphone/iphone'
export { Laptop, type LaptopProps } from './devices/laptop/laptop'
export {
  IPad,
  type IPadProps,
  GalaxyTab,
  type GalaxyTabProps,
  type TabletCommonProps,
} from './devices/tablet/tablet'
export {
  AppleWatch,
  type AppleWatchProps,
  GalaxyWatch,
  type GalaxyWatchProps,
  type WatchCommonProps,
} from './devices/watch/watch'
export { StudioDisplay, type StudioDisplayProps } from './devices/studio-display/studio-display'
export { Fold, type FoldProps } from './devices/fold/fold'
export { Flip, type FlipProps } from './devices/flip/flip'
export { Book, type BookProps } from './objects/book/book'
export { Magazine, type MagazineProps } from './objects/magazine/magazine'
export { Brochure, type BrochureProps } from './objects/brochure/brochure'
export { BusinessCard, type BusinessCardProps } from './objects/business-card/business-card'
export { PosterFrame, type PosterFrameProps } from './objects/poster-frame/poster-frame'
export { Billboard, type BillboardProps } from './objects/billboard/billboard'
export { Van, type VanProps } from './objects/van/van'
export { IDCard, type IDCardProps } from './objects/id-card/id-card'
export { Bus, type BusProps } from './objects/bus/bus'
export { ProductBox, type ProductBoxProps } from './objects/product-box/product-box'
export { RollupBanner, type RollupBannerProps } from './objects/rollup-banner/rollup-banner'
export { BusShelter, type BusShelterProps } from './objects/bus-shelter/bus-shelter'
export { GreetingCard, type GreetingCardProps } from './objects/greeting-card/greeting-card'
export { VinylRecord, type VinylRecordProps } from './objects/vinyl-record/vinyl-record'
export { TVSet, type TVProps } from './objects/tv/tv'
export { AFrameSign, type AFrameSignProps } from './objects/a-frame-sign/a-frame-sign'
export { DOOHTotem, type DOOHTotemProps } from './objects/dooh-totem/dooh-totem'
export { Storefront, type StorefrontProps } from './objects/storefront/storefront'
export { SemiTrailer, type SemiTrailerProps } from './objects/semi-trailer/semi-trailer'
export { MailerBox, type MailerBoxProps } from './objects/mailer-box/mailer-box'
export { ShoppingBag, type ShoppingBagProps } from './objects/shopping-bag/shopping-bag'
export { CustomPanel, type CustomPanelProps } from './objects/custom-panel/custom-panel'
export { CustomBox, type CustomBoxProps } from './objects/custom-box/custom-box'

// The curated core surface: the types and pure data an app plausibly needs
// next to the components. The FULL core (every spec constant, geometry helper,
// screen/stage behavior) lives behind the `area-mockups/core` subpath so its
// internals can evolve without breaking this package's semver contract.
export type { Orientation } from '@area-mockups/core'
export {
  type RegionSpec,
  type CameraFraming,
  type MockupFraming,
  SCREEN_REGIONS,
} from '@area-mockups/core'
export {
  type Colorway,
  GALAXY_COLORWAYS,
  IPHONE_COLORWAYS,
  FOLD_COLORWAYS,
  FLIP_COLORWAYS,
  LAPTOP_COLORWAYS,
  IPAD_COLORWAYS,
  GALAXY_TAB_COLORWAYS,
  APPLE_WATCH_COLORWAYS,
  GALAXY_WATCH_COLORWAYS,
  STUDIO_DISPLAY_COLORWAYS,
  findColorway,
} from '@area-mockups/core'
export type {
  GalaxyVariant,
  IPhoneVariant,
  LaptopVariant,
  IPadVariant,
  GalaxyTabVariant,
  AppleWatchVariant,
  GalaxyWatchVariant,
  FoldVariant,
  FlipVariant,
} from '@area-mockups/core'
export type {
  BookSize,
  MagazineSize,
  BrochureSize,
  DoohTotemSize,
  PosterFrameSize,
  RollupBannerSize,
  CustomSizeMm,
  CustomBoxSizeMm,
  ProductBoxSizeMm,
  MailerBoxSizeMm,
  ShoppingBagSizeMm,
} from '@area-mockups/core'
