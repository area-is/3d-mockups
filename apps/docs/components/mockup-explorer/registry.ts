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
  CreditCardMockup,
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
  IPhoneDuo,
  IPhoneDuoMockup,
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
  IPHONE_DUO_COLORWAYS,
  LAPTOP_COLORWAYS,
  STUDIO_DISPLAY_COLORWAYS,
  type Colorway,
  type MockupKind,
} from 'react-3d-mockups'

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
  /**
   * `color` is the stock the artwork is printed on - board, card, paper, a
   * vehicle's paint under its vinyl - rather than hardware around a separate
   * sheet (a frame's moulding, a billboard's steel). The explorer mounts that
   * colour as the surface background and hands it to the artwork, whose own
   * ground is transparent, so changing `color` changes what is printed on.
   */
  stock?: boolean
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
    fixed: { statusBar: true },
    bare: Galaxy,
    bareName: 'Galaxy',
  },
  IPhoneMockup: {
    Component: IPhoneMockup,
    name: 'IPhoneMockup',
    kind: 'iphone',
    label: 'iPhone',
    variants: [
      { id: '17', label: 'iPhone 17' },
      { id: 'air', label: 'iPhone 17 Air' },
      { id: 'pro', label: 'iPhone 17 Pro' },
      { id: 'promax', label: 'iPhone 17 Pro Max' },
      { id: '18pro', label: 'iPhone 18 Pro' },
      { id: '18promax', label: 'iPhone 18 Pro Max' },
    ],
    colorways: IPHONE_COLORWAYS,
    orientation: true,
    fixed: { statusBar: true },
    bare: IPhone,
    bareName: 'IPhone',
  },
  IPhoneDuoMockup: {
    Component: IPhoneDuoMockup,
    name: 'IPhoneDuoMockup',
    kind: 'iphoneDuo',
    label: 'iPhone Duo',
    variants: [{ id: 'duo', label: 'iPhone Duo' }],
    colorways: IPHONE_DUO_COLORWAYS,
    orientation: true,
    openable: true,
    fixed: { statusBar: true },
    bare: IPhoneDuo,
    bareName: 'IPhoneDuo',
  },
  FoldMockup: {
    Component: FoldMockup,
    name: 'FoldMockup',
    kind: 'fold',
    label: 'Galaxy Z Fold',
    variants: [
      { id: 'fold7', label: 'Galaxy Z Fold 7' },
      { id: 'fold8', label: 'Galaxy Z Fold 8' },
      { id: 'fold8ultra', label: 'Galaxy Z Fold 8 Ultra' },
    ],
    colorways: FOLD_COLORWAYS,
    orientation: true,
    openable: true,
    fixed: { statusBar: true },
  },
  FlipMockup: {
    Component: FlipMockup,
    name: 'FlipMockup',
    kind: 'flip',
    label: 'Galaxy Z Flip',
    variants: [
      { id: 'flip7', label: 'Galaxy Z Flip 7' },
      { id: 'flip8', label: 'Galaxy Z Flip 8' },
    ],
    colorways: FLIP_COLORWAYS,
    orientation: true,
    openable: true,
    fixed: { statusBar: true },
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
      { id: 'neo13', label: 'MacBook Neo 13"' },
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
    fixed: { statusBar: true },
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
    fixed: { statusBar: true },
  },
  AppleWatchMockup: {
    Component: AppleWatchMockup,
    name: 'AppleWatchMockup',
    kind: 'appleWatch',
    label: 'Apple Watch',
    variants: [
      { id: 'series11', label: 'Apple Watch Series 11' },
      { id: 'series12', label: 'Apple Watch Series 12' },
      { id: 'ultra4', label: 'Apple Watch Ultra 4' },
    ],
    colorways: APPLE_WATCH_COLORWAYS,
  },
  GalaxyWatchMockup: {
    Component: GalaxyWatchMockup,
    name: 'GalaxyWatchMockup',
    kind: 'galaxyWatch',
    label: 'Galaxy Watch',
    variants: [
      { id: 'watch8', label: 'Galaxy Watch 8' },
      { id: 'watch9', label: 'Galaxy Watch 9' },
      { id: 'watchultra2', label: 'Galaxy Watch Ultra 2' },
    ],
    colorways: GALAXY_WATCH_COLORWAYS,
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
  BrochureMockup: object(BrochureMockup, 'BrochureMockup', 'brochure', 'Brochure', { stock: true }),
  BusinessCardMockup: object(BusinessCardMockup, 'BusinessCardMockup', 'businessCard', 'Business card', {
    stock: true,
    bare: BusinessCard,
    bareName: 'BusinessCard',
  }),
  IDCardMockup: object(IDCardMockup, 'IDCardMockup', 'idCard', 'ID card', { stock: true }),
  CreditCardMockup: object(CreditCardMockup, 'CreditCardMockup', 'creditCard', 'Credit card', { stock: true }),
  GreetingCardMockup: object(GreetingCardMockup, 'GreetingCardMockup', 'greetingCard', 'Greeting card', { stock: true }),
  PosterFrameMockup: object(PosterFrameMockup, 'PosterFrameMockup', 'posterFrame', 'Poster frame', {
    bare: PosterFrame,
    bareName: 'PosterFrame',
  }),
  ProductBoxMockup: object(ProductBoxMockup, 'ProductBoxMockup', 'productBox', 'Product box', { stock: true }),
  MailerBoxMockup: object(MailerBoxMockup, 'MailerBoxMockup', 'mailerBox', 'Mailer box', { stock: true }),
  MilkCartonMockup: object(MilkCartonMockup, 'MilkCartonMockup', 'milkCarton', 'Milk carton', { stock: true }),
  ShoppingBagMockup: object(ShoppingBagMockup, 'ShoppingBagMockup', 'shoppingBag', 'Shopping bag', { stock: true }),
  VinylRecordMockup: object(VinylRecordMockup, 'VinylRecordMockup', 'vinylRecord', 'Vinyl record', { stock: true }),
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
  BusMockup: object(BusMockup, 'BusMockup', 'bus', 'Bus', { stock: true, coverage: true }),
  VanMockup: object(VanMockup, 'VanMockup', 'van', 'Van', { stock: true, coverage: true }),
  SemiTrailerMockup: object(SemiTrailerMockup, 'SemiTrailerMockup', 'semiTrailer', 'Semi trailer', { stock: true }),
  TVSetMockup: object(TVSetMockup, 'TVSetMockup', 'tv', 'TV set', { print: false }),
  CustomPanelMockup: object(CustomPanelMockup, 'CustomPanelMockup', 'customPanel', 'Custom panel', {
    stock: true,
    fixed: { size: { width: 300, height: 200, thickness: 5 } },
  }),
  CustomBoxMockup: object(CustomBoxMockup, 'CustomBoxMockup', 'customBox', 'Custom box', {
    stock: true,
    fixed: { size: { width: 180, height: 120, depth: 60 } },
  }),
}

export const EXPLORERS: Record<string, ExplorerSpec> = { ...DEVICES, ...OBJECTS }
