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
 */

const device = (id, label, component, variant, shot) => ({
  id,
  label,
  component,
  variant,
  href: `/docs/api/${id}`,
  thumb: `/thumbs/${id}.png`,
  shot,
})

export const DEVICES = [
  device('galaxy-s26', 'Galaxy S26', 'GalaxyMockup', 's26', 'device=phone&pvariant=s26&color=icyblue&ry=-24'),
  device('galaxy-s26-ultra', 'Galaxy S26 Ultra', 'GalaxyMockup', 's26ultra', 'device=phone&pvariant=s26ultra&color=titaniumsilverblue&ry=-24'),
  device('iphone-17', 'iPhone 17', 'IPhoneMockup', '17', 'device=iphone&pvariant=17&color=mistblue&ry=-24'),
  device('iphone-17-air', 'iPhone 17 Air', 'IPhoneMockup', 'air', 'device=iphone&pvariant=air&color=skyblue&ry=-24'),
  device('iphone-17-pro', 'iPhone 17 Pro', 'IPhoneMockup', 'pro', 'device=iphone&pvariant=pro&color=cosmicorange&ry=-24'),
  device('iphone-17-pro-max', 'iPhone 17 Pro Max', 'IPhoneMockup', 'promax', 'device=iphone&pvariant=promax&color=deepblue&ry=-24'),
  device('galaxy-z-fold7', 'Galaxy Z Fold 7', 'FoldMockup', undefined, 'device=fold&openAngle=150&color=blueshadow&ry=-20'),
  device('galaxy-z-flip7', 'Galaxy Z Flip 7', 'FlipMockup', undefined, 'device=flip&openAngle=150&color=coralred&ry=-20'),
  device('macbook-air-13', 'MacBook Air 13″', 'LaptopMockup', 'air13', 'device=laptop&lvariant=air13&color=skyblue&ry=-18'),
  device('macbook-air-15', 'MacBook Air 15″', 'LaptopMockup', 'air15', 'device=laptop&lvariant=air15&color=midnight&ry=-18'),
  device('macbook-pro-14', 'MacBook Pro 14″', 'LaptopMockup', 'pro14', 'device=laptop&lvariant=pro14&color=spaceblack&ry=-18'),
  device('macbook-pro-16', 'MacBook Pro 16″', 'LaptopMockup', 'pro16', 'device=laptop&lvariant=pro16&color=silver&ry=-18'),
  device('ipad-pro-13', 'iPad Pro 13″', 'IPadMockup', 'ipadpro13', 'device=tablet&variant=ipadpro13&color=spaceblack&ry=-22'),
  device('ipad-pro-11', 'iPad Pro 11″', 'IPadMockup', 'ipadpro11', 'device=tablet&variant=ipadpro11&color=silver&ry=-22'),
  device('ipad-air-13', 'iPad Air 13″', 'IPadMockup', 'ipadair13', 'device=tablet&variant=ipadair13&color=blue&ry=-22'),
  device('ipad-air-11', 'iPad Air 11″', 'IPadMockup', 'ipadair11', 'device=tablet&variant=ipadair11&color=starlight&ry=-22'),
  device('ipad-11', 'iPad 11″', 'IPadMockup', 'ipad11', 'device=tablet&variant=ipad11&color=blue&ry=-22'),
  device('galaxy-tab-s11', 'Galaxy Tab S11', 'GalaxyTabMockup', 'tabs11', 'device=tablet&variant=tabs11&color=gray&ry=-22'),
  device('galaxy-tab-s11-ultra', 'Galaxy Tab S11 Ultra', 'GalaxyTabMockup', 'tabs11ultra', 'device=tablet&variant=tabs11ultra&color=silver&ry=-22'),
  device('apple-watch-series-11', 'Apple Watch Series 11', 'AppleWatchMockup', undefined, 'device=watch&color=jetblack&ry=-18'),
  device('galaxy-watch-8', 'Galaxy Watch 8', 'GalaxyWatchMockup', undefined, 'device=watch&wvariant=watch8&color=graphite&ry=-18'),
  device('studio-display', 'Studio Display', 'StudioDisplayMockup', undefined, 'device=monitor&ry=-15'),
]

const object = (id, label, component, shot) => ({
  id,
  label,
  component,
  variant: undefined,
  href: `/docs/api/${id}`,
  thumb: `/thumbs/${id}.png`,
  shot,
})

/** Ordered to match content/docs/api/meta.json. */
export const OBJECTS = [
  object('book', 'Book', 'BookMockup', 'device=book&ry=-28'),
  object('magazine', 'Magazine', 'MagazineMockup', 'device=magazine&ry=-28'),
  object('brochure', 'Brochure', 'BrochureMockup', 'device=brochure&ry=-22'),
  object('business-card', 'Business card', 'BusinessCardMockup', 'device=card&ry=-20&rx=8'),
  object('id-card', 'ID card', 'IDCardMockup', 'device=idcard&ry=-20'),
  object('greeting-card', 'Greeting card', 'GreetingCardMockup', 'device=greeting&ry=-24'),
  object('poster-frame', 'Poster frame', 'PosterFrameMockup', 'device=poster&ry=-18'),
  object('product-box', 'Product box', 'ProductBoxMockup', 'device=productbox&ry=-32&rx=12'),
  object('mailer-box', 'Mailer box', 'MailerBoxMockup', 'device=mailer&ry=-32&rx=16'),
  object('milk-carton', 'Milk carton', 'MilkCartonMockup', 'device=milkcarton&ry=-28&rx=6'),
  object('shopping-bag', 'Shopping bag', 'ShoppingBagMockup', 'device=bag&ry=-26'),
  object('custom-panel', 'Custom panel', 'CustomPanelMockup', 'device=custompanel&ry=-18'),
  object('custom-box', 'Custom box', 'CustomBoxMockup', 'device=custombox&ry=-34&rx=14'),
  object('vinyl-record', 'Vinyl record', 'VinylRecordMockup', 'device=vinyl&ry=-20'),
  object('rollup-banner', 'Roll-up banner', 'RollupBannerMockup', 'device=rollup&ry=-18'),
  object('a-frame-sign', 'A-frame sign', 'AFrameSignMockup', 'device=aframe&ry=-22'),
  object('bus-shelter', 'Bus shelter', 'BusShelterMockup', 'device=shelter&ry=-26'),
  object('dooh-totem', 'DOOH totem', 'DOOHTotemMockup', 'device=totem&ry=-24'),
  object('billboard', 'Billboard', 'BillboardMockup', 'device=billboard&ry=-18'),
  object('storefront', 'Storefront', 'StorefrontMockup', 'device=store&ry=-18&rx=4'),
  object('bus', 'Bus', 'BusMockup', 'device=bus&ry=-28&rx=6'),
  object('van', 'Van', 'VanMockup', 'device=van&ry=-32&rx=8'),
  object('semi-trailer', 'Semi trailer', 'SemiTrailerMockup', 'device=semi&ry=-30&rx=6'),
  object('tv', 'TV set', 'TVSetMockup', 'device=tv&ry=-20'),
]
