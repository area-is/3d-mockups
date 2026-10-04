import { asset } from './base-path.mjs'

/**
 * The catalog behind the docs sidebar grids, the per-variant docs pages and
 * the thumbnail generator: one entry per device VARIANT (not per family - the
 * S26 and the S26 Ultra each get their own) and one per object.
 *
 * Plain ESM so both the Next app (sidebar components) and the node scripts
 * can import it - keep it dependency-free.
 *
 * - `href`      the entry's own docs page, so the sidebar can highlight
 *               exactly the variant you are reading
 * - `component` the mockup component name, for `<MockupExplorer>`
 * - `variant`   the variant id passed to that component, when it has one
 * - `thumb`     screenshot under public/, produced by `npm run thumbs`
 * - `shot`      /harness query that poses the mockup for its screenshot
 * - `category`  which `CATEGORIES` chip the docs gallery files it under
 * - `keywords`  extra docs-search terms for the entry's page - spellings its
 *               title does not contain. They live here rather than in the
 *               page's frontmatter because the device pages are generated
 *               (scripts/generate-variant-pages.mjs) and would lose them.
 *               A family-wide word ("galaxy", "ipad") goes on the variant a
 *               search for it should land on first; see app/api/search.
 */

/** The gallery's filter chips, in display order. Every entry names one. */
export const CATEGORIES = [
  'Phones',
  'Foldables',
  'Tablets',
  'Laptops and displays',
  'Wearables',
  'Print',
  'Packaging',
  'Out of home',
  'Vehicles',
]

const device = (id, label, component, variant, shot, category, keywords) => ({
  id,
  label,
  component,
  variant,
  href: `/docs/api/${id}`,
  thumb: asset(`/thumbs/${id}.png`),
  shot,
  category,
  keywords,
})

export const DEVICES = [
  device('galaxy-s26', 'Galaxy S26', 'GalaxyMockup', 's26', 'device=phone&pvariant=s26&color=icyblue&ry=-24', 'Phones', [
    'galaxy', 'samsung galaxy', 'samsung', 'samsung phone', 'android', 'android phone', 'phone', 'smartphone', 's26',
  ]),
  device('galaxy-s26-ultra', 'Galaxy S26 Ultra', 'GalaxyMockup', 's26ultra', 'device=phone&pvariant=s26ultra&color=titaniumsilverblue&ry=-24', 'Phones', [
    's26 ultra', 'galaxy ultra', 'samsung phone', 'android phone', 'phone', 'smartphone', 's pen', 's26ultra',
  ]),
  device('iphone-17', 'iPhone 17', 'IPhoneMockup', '17', 'device=iphone&pvariant=17&color=mistblue&ry=-24', 'Phones', [
    'iphone', 'apple iphone', 'apple', 'ios', 'phone', 'smartphone',
  ]),
  device('iphone-17-air', 'iPhone 17 Air', 'IPhoneMockup', 'air', 'device=iphone&pvariant=air&color=skyblue&ry=-24', 'Phones', [
    'iphone air', 'ios', 'phone', 'smartphone',
  ]),
  device('iphone-17-pro', 'iPhone 17 Pro', 'IPhoneMockup', 'pro', 'device=iphone&pvariant=pro&color=cosmicorange&ry=-24', 'Phones', [
    'iphone pro', 'ios', 'phone', 'smartphone',
  ]),
  device('iphone-17-pro-max', 'iPhone 17 Pro Max', 'IPhoneMockup', 'promax', 'device=iphone&pvariant=promax&color=deepblue&ry=-24', 'Phones', [
    'iphone pro max', 'pro max', 'promax', 'ios', 'phone', 'smartphone',
  ]),
  device('iphone-18-pro', 'iPhone 18 Pro', 'IPhoneMockup', '18pro', 'device=iphone&pvariant=18pro&color=burgundy&ry=-24', 'Phones', [
    'iphone 18', 'iphone 18 pro', '18pro', 'ios', 'phone', 'smartphone',
  ]),
  device('iphone-18-pro-max', 'iPhone 18 Pro Max', 'IPhoneMockup', '18promax', 'device=iphone&pvariant=18promax&color=glacier&ry=-24', 'Phones', [
    'iphone 18 pro max', '18promax', 'ios', 'phone', 'smartphone',
  ]),
  device('iphone-duo', 'iPhone Duo', 'IPhoneDuoMockup', 'duo', 'device=iphoneduo&openAngle=150&color=nightsky&ry=-20', 'Foldables', [
    'iphone duo', 'iphone fold', 'foldable iphone', 'folding iphone', 'apple foldable', 'foldable', 'foldable phone', 'folding phone', 'duo', 'ios',
  ]),
  device('galaxy-z-fold7', 'Galaxy Z Fold 7', 'FoldMockup', 'fold7', 'device=fold&openAngle=150&color=blueshadow&ry=-20', 'Foldables', [
    'fold', 'z fold', 'galaxy fold', 'foldable', 'foldable phone', 'folding phone', 'fold7', 'samsung',
  ]),
  device('galaxy-z-fold8', 'Galaxy Z Fold 8', 'FoldMockup', 'fold8', 'device=fold&fvariant=fold8&openAngle=150&color=lavender&ry=-20', 'Foldables', [
    'fold 8', 'wide fold', 'foldable', 'foldable phone', 'folding phone', 'fold8', 'samsung',
  ]),
  device('galaxy-z-fold8-ultra', 'Galaxy Z Fold 8 Ultra', 'FoldMockup', 'fold8ultra', 'device=fold&fvariant=fold8ultra&openAngle=150&color=violetshadow&ry=-20', 'Foldables', [
    'fold ultra', 'foldable', 'foldable phone', 'folding phone', 'fold8ultra', 'samsung',
  ]),
  device('galaxy-z-flip7', 'Galaxy Z Flip 7', 'FlipMockup', 'flip7', 'device=flip&openAngle=150&color=coralred&ry=-20', 'Foldables', [
    'flip', 'z flip', 'galaxy flip', 'flip phone', 'clamshell', 'foldable', 'folding phone', 'cover screen', 'flip7', 'samsung',
  ]),
  device('galaxy-z-flip8', 'Galaxy Z Flip 8', 'FlipMockup', 'flip8', 'device=flip&flvariant=flip8&openAngle=150&color=pink&ry=-20', 'Foldables', [
    'flip 8', 'flip phone', 'clamshell', 'foldable', 'folding phone', 'cover screen', 'flip8', 'samsung',
  ]),
  device('macbook-air-13', 'MacBook Air 13″', 'LaptopMockup', 'air13', 'device=laptop&lvariant=air13&color=skyblue&ry=-18', 'Laptops and displays', [
    'macbook', 'laptop', 'notebook', 'mac', 'apple laptop', 'air13',
  ]),
  device('macbook-air-15', 'MacBook Air 15″', 'LaptopMockup', 'air15', 'device=laptop&lvariant=air15&color=midnight&ry=-18', 'Laptops and displays', [
    'macbook air', 'laptop', 'notebook', 'mac', 'air15',
  ]),
  device('macbook-pro-14', 'MacBook Pro 14″', 'LaptopMockup', 'pro14', 'device=laptop&lvariant=pro14&color=spaceblack&ry=-18', 'Laptops and displays', [
    'macbook pro', 'laptop', 'notebook', 'mac', 'pro14',
  ]),
  device('macbook-pro-16', 'MacBook Pro 16″', 'LaptopMockup', 'pro16', 'device=laptop&lvariant=pro16&color=silver&ry=-18', 'Laptops and displays', [
    'laptop', 'notebook', 'mac', 'pro16',
  ]),
  device('macbook-neo-13', 'MacBook Neo 13″', 'LaptopMockup', 'neo13', 'device=laptop&lvariant=neo13&color=indigo&ry=-18', 'Laptops and displays', [
    'macbook neo', 'neo', 'laptop', 'notebook', 'mac', 'budget macbook', 'neo13',
  ]),
  device('ipad-pro-13', 'iPad Pro 13″', 'IPadMockup', 'ipadpro13', 'device=tablet&variant=ipadpro13&color=spaceblack&ry=-22', 'Tablets', [
    'ipad pro', 'tablet', 'ipados', 'ipadpro13',
  ]),
  device('ipad-pro-11', 'iPad Pro 11″', 'IPadMockup', 'ipadpro11', 'device=tablet&variant=ipadpro11&color=silver&ry=-22', 'Tablets', [
    'tablet', 'ipados', 'ipadpro11',
  ]),
  device('ipad-air-13', 'iPad Air 13″', 'IPadMockup', 'ipadair13', 'device=tablet&variant=ipadair13&color=blue&ry=-22', 'Tablets', [
    'ipad air', 'tablet', 'ipados', 'ipadair13',
  ]),
  device('ipad-air-11', 'iPad Air 11″', 'IPadMockup', 'ipadair11', 'device=tablet&variant=ipadair11&color=starlight&ry=-22', 'Tablets', [
    'tablet', 'ipados', 'ipadair11',
  ]),
  device('ipad-11', 'iPad 11″', 'IPadMockup', 'ipad11', 'device=tablet&variant=ipad11&color=blue&ry=-22', 'Tablets', [
    'ipad', 'apple tablet', 'tablet', 'ipados', 'ipad a16', 'ipad11',
  ]),
  device('galaxy-tab-s11', 'Galaxy Tab S11', 'GalaxyTabMockup', 'tabs11', 'device=tablet&variant=tabs11&color=gray&ry=-22', 'Tablets', [
    'galaxy tab', 'samsung tablet', 'android tablet', 'tablet', 'tabs11',
  ]),
  device('galaxy-tab-s11-ultra', 'Galaxy Tab S11 Ultra', 'GalaxyTabMockup', 'tabs11ultra', 'device=tablet&variant=tabs11ultra&color=silver&ry=-22', 'Tablets', [
    'tab ultra', 'samsung tablet', 'android tablet', 'tablet', 'tabs11ultra',
  ]),
  device('apple-watch-series-11', 'Apple Watch Series 11', 'AppleWatchMockup', 'series11', 'device=watch&wvariant=series11&color=jetblack&ry=-18', 'Wearables', [
    'apple watch', 'watch', 'smartwatch', 'wearable', 'watchos', 'series 11',
  ]),
  device('apple-watch-series-12', 'Apple Watch Series 12', 'AppleWatchMockup', 'series12', 'device=watch&wvariant=series12&color=darkbronze&ry=-18', 'Wearables', [
    'watch', 'smartwatch', 'wearable', 'watchos', 'series 12', 'series12',
  ]),
  device('apple-watch-ultra-4', 'Apple Watch Ultra 4', 'AppleWatchMockup', 'ultra4', 'device=watch&wvariant=ultra4&color=black&ry=-18', 'Wearables', [
    'apple watch ultra', 'watch ultra', 'ultra', 'watch', 'smartwatch', 'wearable', 'watchos', 'titanium watch', 'ultra4',
  ]),
  device('galaxy-watch-8', 'Galaxy Watch 8', 'GalaxyWatchMockup', 'watch8', 'device=watch&wvariant=watch8&color=graphite&ry=-18', 'Wearables', [
    'galaxy watch', 'watch', 'smartwatch', 'wearable', 'wear os', 'round watch', 'watch8',
  ]),
  device('galaxy-watch-9', 'Galaxy Watch 9', 'GalaxyWatchMockup', 'watch9', 'device=watch&wvariant=watch9&color=silver&ry=-18', 'Wearables', [
    'watch', 'smartwatch', 'wearable', 'wear os', 'round watch', 'watch9',
  ]),
  device('galaxy-watch-ultra-2', 'Galaxy Watch Ultra 2', 'GalaxyWatchMockup', 'watchultra2', 'device=watch&wvariant=watchultra2&color=titaniumgray&ry=-18', 'Wearables', [
    'watch ultra', 'watch', 'smartwatch', 'wearable', 'wear os', 'titanium watch', 'watchultra2',
  ]),
  device('studio-display', 'Studio Display', 'StudioDisplayMockup', undefined, 'device=monitor&ry=-15', 'Laptops and displays', [
    'monitor', 'display', 'external display', 'desktop', 'apple monitor', 'screen',
  ]),
]

const object = (id, label, component, shot, category, keywords) => ({
  id,
  label,
  component,
  variant: undefined,
  href: `/docs/api/${id}`,
  thumb: asset(`/thumbs/${id}.png`),
  shot,
  category,
  keywords,
})

/** Ordered to match content/docs/api/meta.json. */
export const OBJECTS = [
  object('book', 'Book', 'BookMockup', 'device=book&ry=-28', 'Print', [
    'book', 'hardcover', 'book cover', 'dust jacket', 'spine', 'publishing', 'print',
  ]),
  object('magazine', 'Magazine', 'MagazineMockup', 'device=magazine&ry=-28', 'Print', [
    'magazine', 'magazine cover', 'periodical', 'publication', 'print',
  ]),
  object('brochure', 'Brochure', 'BrochureMockup', 'device=brochure&ry=-22', 'Print', [
    'brochure', 'trifold', 'tri fold', 'leaflet', 'pamphlet', 'flyer', 'print',
  ]),
  object('business-card', 'Business card', 'BusinessCardMockup', 'device=card&ry=-20&rx=8', 'Print', [
    'business card', 'card', 'stationery', 'print',
  ]),
  object('id-card', 'ID card', 'IDCardMockup', 'device=idcard&ry=-20', 'Print', [
    'id card', 'badge', 'name badge', 'lanyard', 'event badge', 'conference badge', 'employee badge',
  ]),
  object('credit-card', 'Credit card', 'CreditCardMockup', 'device=creditcard&ry=-22&rx=8', 'Print', [
    'credit card', 'debit card', 'bank card', 'payment card', 'card', 'emv chip', 'embossed', 'fintech', 'cr80',
  ]),
  object('greeting-card', 'Greeting card', 'GreetingCardMockup', 'device=greeting&ry=-24', 'Print', [
    'greeting card', 'card', 'invitation', 'birthday card', 'folded card', 'print',
  ]),
  object('poster-frame', 'Poster frame', 'PosterFrameMockup', 'device=poster&ry=-18', 'Print', [
    'poster', 'frame', 'framed poster', 'art print', 'wall art', 'print',
  ]),
  object('vinyl-record', 'Vinyl record', 'VinylRecordMockup', 'device=vinyl&ry=-20', 'Print', [
    'vinyl', 'record', 'lp', 'album cover', 'album art', 'record sleeve', 'music',
  ]),
  object('custom-panel', 'Custom panel', 'CustomPanelMockup', 'device=custompanel&ry=-18', 'Print', [
    'custom size', 'custom', 'panel', 'sheet', 'flat print', 'any size',
  ]),
  object('product-box', 'Product box', 'ProductBoxMockup', 'device=productbox&ry=-32&rx=12', 'Packaging', [
    'box', 'product box', 'retail box', 'carton', 'packaging', 'package',
  ]),
  object('mailer-box', 'Mailer box', 'MailerBoxMockup', 'device=mailer&ry=-32&rx=16', 'Packaging', [
    'mailer', 'shipping box', 'shipper', 'ecommerce packaging', 'corrugated box', 'packaging',
  ]),
  object('milk-carton', 'Milk carton', 'MilkCartonMockup', 'device=milkcarton&ry=-28&rx=6', 'Packaging', [
    'carton', 'milk', 'gable top', 'juice carton', 'beverage packaging', 'packaging',
  ]),
  object('shopping-bag', 'Shopping bag', 'ShoppingBagMockup', 'device=bag&ry=-26', 'Packaging', [
    'bag', 'shopping bag', 'paper bag', 'kraft bag', 'carrier bag', 'tote', 'packaging',
  ]),
  object('custom-box', 'Custom box', 'CustomBoxMockup', 'device=custombox&ry=-34&rx=14', 'Packaging', [
    'custom box', 'custom size', 'custom', 'any size box', 'dieline',
  ]),
  object('rollup-banner', 'Roll-up banner', 'RollupBannerMockup', 'device=rollup&ry=-18', 'Out of home', [
    'rollup', 'roll up', 'pull up banner', 'banner', 'banner stand', 'trade show', 'exhibition',
  ]),
  object('a-frame-sign', 'A-frame sign', 'AFrameSignMockup', 'device=aframe&ry=-22', 'Out of home', [
    'a frame', 'sandwich board', 'sidewalk sign', 'pavement sign', 'menu board', 'chalkboard',
  ]),
  object('bus-shelter', 'Bus shelter', 'BusShelterMockup', 'device=shelter&ry=-26', 'Out of home', [
    'bus shelter', 'bus stop', 'six sheet', '6 sheet', 'street furniture', 'out of home', 'ooh',
  ]),
  object('dooh-totem', 'DOOH totem', 'DOOHTotemMockup', 'device=totem&ry=-24', 'Out of home', [
    'dooh', 'digital signage', 'totem', 'kiosk', 'digital out of home', 'out of home', 'ooh',
  ]),
  object('billboard', 'Billboard', 'BillboardMockup', 'device=billboard&ry=-18', 'Out of home', [
    'billboard', 'bulletin', 'hoarding', 'outdoor advertising', 'out of home', 'ooh',
  ]),
  object('storefront', 'Storefront', 'StorefrontMockup', 'device=store&ry=-18&rx=4', 'Out of home', [
    'storefront', 'shop front', 'shopfront', 'fascia', 'shop sign', 'window display', 'retail',
  ]),
  object('bus', 'Bus', 'BusMockup', 'device=bus&ry=-28&rx=6', 'Vehicles', [
    'bus', 'transit', 'bus wrap', 'bus ad', 'livery', 'vehicle wrap', 'destination sign', 'vehicle',
  ]),
  object('van', 'Van', 'VanMockup', 'device=van&ry=-32&rx=8', 'Vehicles', [
    'van', 'cargo van', 'delivery van', 'step van', 'van wrap', 'livery', 'vehicle wrap', 'fleet graphics', 'vehicle',
  ]),
  object('semi-trailer', 'Semi trailer', 'SemiTrailerMockup', 'device=semi&ry=-30&rx=6', 'Vehicles', [
    'semi', 'trailer', 'truck', 'lorry', 'truck wrap', 'livery', 'fleet graphics', 'vehicle',
  ]),
  object('tv', 'TV set', 'TVSetMockup', 'device=tv&ry=-20', 'Laptops and displays', [
    'tv', 'television', 'tv set', 'smart tv', 'display', 'screen',
  ]),
]
