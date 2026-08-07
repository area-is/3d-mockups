import {
  AFrameSignMockup,
  AppleWatchMockup,
  Billboard,
  BillboardMockup,
  Book,
  BookMockup,
  BrochureMockup,
  BusMockup,
  BusShelterMockup,
  BusinessCard,
  BusinessCardMockup,
  CustomBoxMockup,
  CustomPanelMockup,
  DOOHTotemMockup,
  FlipMockup,
  FoldMockup,
  Galaxy,
  GalaxyMockup,
  GalaxyTabMockup,
  GalaxyWatchMockup,
  GreetingCardMockup,
  IDCardMockup,
  IPadMockup,
  IPhone,
  IPhoneMockup,
  LaptopMockup,
  MagazineMockup,
  MailerBoxMockup,
  MilkCartonMockup,
  PosterFrame,
  PosterFrameMockup,
  ProductBoxMockup,
  RollupBanner,
  RollupBannerMockup,
  SemiTrailerMockup,
  ShoppingBagMockup,
  StorefrontMockup,
  StudioDisplayMockup,
  TVSetMockup,
  VanMockup,
  VinylRecordMockup,
  APPLE_WATCH_COLORWAYS,
  FLIP_COLORWAYS,
  FOLD_COLORWAYS,
  GALAXY_COLORWAYS,
  GALAXY_TAB_COLORWAYS,
  GALAXY_WATCH_COLORWAYS,
  IPAD_COLORWAYS,
  IPHONE_COLORWAYS,
  LAPTOP_COLORWAYS,
  STUDIO_DISPLAY_COLORWAYS,
  type Colorway,
  type MockupKind,
} from 'area-3d-mockups'

/**
 * What the prop explorer needs to know about one mockup, over and above what
 * the component already tells it.
 *
 * Regions come off the component itself (`Mockup.regions`) and measurements
 * from `Mockup.info()`, so areas and resolutions can never drift from the
 * library; `color` comes off the component's own prop table. Only the things
 * neither of those answers live here: the shapes of the props whose controls
 * are hand-written, and the retail colorways.
 */
export interface ExplorerSpec {
  /** The mockup component, with its slots and measurement statics. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: any
  /** Import name shown in the generated snippet. */
  name: string
  /** Registry key used for measurement. */
  kind: MockupKind
  /** Human label for the object button in the header. */
  label: string
  /**
   * The bare object behind the one-liner, for the pages that stage several of
   * them in one `MockupCanvas` (`MockupExplorer`'s `arrangement`). Only the
   * objects the docs actually compose carry one - everything else is reached
   * through its wrapper, which is the API those pages teach.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bare?: any
  /** Import name of that bare object, for the generated snippet. */
  bareName?: string
  /** Selectable variants, when the family has more than one. */
  variants?: { id: string; label: string }[]
  /** Retail colorways per variant id (`''` for families without variants). */
  colorways?: Record<string, Colorway[]>
  /** Does it accept `orientation`? */
  orientation?: boolean
  /** Foldables: `open`. */
  openable?: boolean
  /** Vehicles: `coverage`. */
  coverage?: boolean
  /** Props every snippet must carry (a required size, say). */
  fixed?: Record<string, unknown>
  /** Print/packaging surfaces read better with artwork than an app screen. */
  print?: boolean
}

const single = (list: Colorway[]): Record<string, Colorway[]> => ({ '': list })

const DEVICES: Record<string, ExplorerSpec> = {
  GalaxyMockup: {
    Component: GalaxyMockup,
    name: 'GalaxyMockup',
    kind: 'galaxy',
    label: 'Galaxy S26',
    variants: [
      { id: 's26', label: 'Galaxy S26' },
      { id: 's26ultra', label: 'Galaxy S26 Ultra' },
    ],
    colorways: GALAXY_COLORWAYS,
    orientation: true,
    bare: Galaxy,
    bareName: 'Galaxy',
  },
  IPhoneMockup: {
    Component: IPhoneMockup,
    name: 'IPhoneMockup',
    kind: 'iphone',
    label: 'iPhone 17',
    variants: [
      { id: '17', label: 'iPhone 17' },
      { id: 'air', label: 'iPhone 17 Air' },
      { id: 'pro', label: 'iPhone 17 Pro' },
      { id: 'promax', label: 'iPhone 17 Pro Max' },
    ],
    colorways: IPHONE_COLORWAYS,
    orientation: true,
    bare: IPhone,
    bareName: 'IPhone',
  },
  FoldMockup: {
    Component: FoldMockup,
    name: 'FoldMockup',
    kind: 'fold',
    label: 'Galaxy Z Fold 7',
    colorways: { '': FOLD_COLORWAYS.fold7 },
    orientation: true,
    openable: true,
  },
  FlipMockup: {
    Component: FlipMockup,
    name: 'FlipMockup',
    kind: 'flip',
    label: 'Galaxy Z Flip 7',
    colorways: { '': FLIP_COLORWAYS.flip7 },
    orientation: true,
    openable: true,
  },
  LaptopMockup: {
    Component: LaptopMockup,
    name: 'LaptopMockup',
    kind: 'laptop',
    label: 'MacBook',
    variants: [
      { id: 'air13', label: 'MacBook Air 13"' },
      { id: 'air15', label: 'MacBook Air 15"' },
      { id: 'pro14', label: 'MacBook Pro 14"' },
      { id: 'pro16', label: 'MacBook Pro 16"' },
    ],
    colorways: LAPTOP_COLORWAYS,
  },
  IPadMockup: {
    Component: IPadMockup,
    name: 'IPadMockup',
    kind: 'ipad',
    label: 'iPad',
    variants: [
      { id: 'ipadpro13', label: 'iPad Pro 13"' },
      { id: 'ipadpro11', label: 'iPad Pro 11"' },
      { id: 'ipadair13', label: 'iPad Air 13"' },
      { id: 'ipadair11', label: 'iPad Air 11"' },
      { id: 'ipad11', label: 'iPad' },
    ],
    colorways: IPAD_COLORWAYS,
    orientation: true,
  },
  GalaxyTabMockup: {
    Component: GalaxyTabMockup,
    name: 'GalaxyTabMockup',
    kind: 'galaxyTab',
    label: 'Galaxy Tab S11',
    variants: [
      { id: 'tabs11', label: 'Galaxy Tab S11' },
      { id: 'tabs11ultra', label: 'Galaxy Tab S11 Ultra' },
    ],
    colorways: GALAXY_TAB_COLORWAYS,
    orientation: true,
  },
  AppleWatchMockup: {
    Component: AppleWatchMockup,
    name: 'AppleWatchMockup',
    kind: 'appleWatch',
    label: 'Apple Watch Series 11',
    colorways: { '': APPLE_WATCH_COLORWAYS.series11 },
  },
  GalaxyWatchMockup: {
    Component: GalaxyWatchMockup,
    name: 'GalaxyWatchMockup',
    kind: 'galaxyWatch',
    label: 'Galaxy Watch 8',
    colorways: { '': GALAXY_WATCH_COLORWAYS.watch8 },
  },
  StudioDisplayMockup: {
    Component: StudioDisplayMockup,
    name: 'StudioDisplayMockup',
    kind: 'studioDisplay',
    label: 'Studio Display',
    colorways: single(STUDIO_DISPLAY_COLORWAYS),
  },
}

const object = (
  Component: unknown,
  name: string,
  kind: MockupKind,
  label: string,
  extra: Partial<ExplorerSpec> = {}
): ExplorerSpec => ({ Component, name, kind, label, print: true, ...extra })

const OBJECTS: Record<string, ExplorerSpec> = {
  BookMockup: object(BookMockup, 'BookMockup', 'book', 'Book', { bare: Book, bareName: 'Book' }),
  MagazineMockup: object(MagazineMockup, 'MagazineMockup', 'magazine', 'Magazine'),
  BrochureMockup: object(BrochureMockup, 'BrochureMockup', 'brochure', 'Brochure'),
  BusinessCardMockup: object(BusinessCardMockup, 'BusinessCardMockup', 'businessCard', 'Business card', {
    bare: BusinessCard,
    bareName: 'BusinessCard',
  }),
  IDCardMockup: object(IDCardMockup, 'IDCardMockup', 'idCard', 'ID card'),
  GreetingCardMockup: object(GreetingCardMockup, 'GreetingCardMockup', 'greetingCard', 'Greeting card'),
  PosterFrameMockup: object(PosterFrameMockup, 'PosterFrameMockup', 'posterFrame', 'Poster frame', {
    bare: PosterFrame,
    bareName: 'PosterFrame',
  }),
  ProductBoxMockup: object(ProductBoxMockup, 'ProductBoxMockup', 'productBox', 'Product box'),
  MailerBoxMockup: object(MailerBoxMockup, 'MailerBoxMockup', 'mailerBox', 'Mailer box'),
  MilkCartonMockup: object(MilkCartonMockup, 'MilkCartonMockup', 'milkCarton', 'Milk carton'),
  ShoppingBagMockup: object(ShoppingBagMockup, 'ShoppingBagMockup', 'shoppingBag', 'Shopping bag'),
  VinylRecordMockup: object(VinylRecordMockup, 'VinylRecordMockup', 'vinylRecord', 'Vinyl record'),
  RollupBannerMockup: object(RollupBannerMockup, 'RollupBannerMockup', 'rollupBanner', 'Roll-up banner', {
    bare: RollupBanner,
    bareName: 'RollupBanner',
  }),
  AFrameSignMockup: object(AFrameSignMockup, 'AFrameSignMockup', 'aFrameSign', 'A-frame sign'),
  BusShelterMockup: object(BusShelterMockup, 'BusShelterMockup', 'busShelter', 'Bus shelter'),
  DOOHTotemMockup: object(DOOHTotemMockup, 'DOOHTotemMockup', 'doohTotem', 'DOOH totem'),
  BillboardMockup: object(BillboardMockup, 'BillboardMockup', 'billboard', 'Billboard', {
    bare: Billboard,
    bareName: 'Billboard',
  }),
  StorefrontMockup: object(StorefrontMockup, 'StorefrontMockup', 'storefront', 'Storefront'),
  BusMockup: object(BusMockup, 'BusMockup', 'bus', 'Bus', { coverage: true }),
  VanMockup: object(VanMockup, 'VanMockup', 'van', 'Van', { coverage: true }),
  SemiTrailerMockup: object(SemiTrailerMockup, 'SemiTrailerMockup', 'semiTrailer', 'Semi trailer'),
  TVSetMockup: object(TVSetMockup, 'TVSetMockup', 'tv', 'TV set', { print: false }),
  CustomPanelMockup: object(CustomPanelMockup, 'CustomPanelMockup', 'customPanel', 'Custom panel', {
    fixed: { size: { width: 300, height: 200, thickness: 5 } },
  }),
  CustomBoxMockup: object(CustomBoxMockup, 'CustomBoxMockup', 'customBox', 'Custom box', {
    fixed: { size: { width: 180, height: 120, depth: 60 } },
  }),
}

export const EXPLORERS: Record<string, ExplorerSpec> = { ...DEVICES, ...OBJECTS }
