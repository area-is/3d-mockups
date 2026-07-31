/**
 * The catalog behind the docs sidebar grids and the thumbnail generator:
 * one entry per device VARIANT (not per family - the S26 and the S26 Ultra
 * each get their own tile) and one entry per object.
 *
 * Plain ESM so both the Next app (sidebar components) and the node script
 * (scripts/generate-thumbs.mjs) can import it - keep it dependency-free.
 *
 * - `href`   docs page the tile links to (variants share their family page)
 * - `thumb`  screenshot under public/, produced by `npm run thumbs`
 * - `shot`   /harness query that poses the mockup for its screenshot
 */

const thumb = (id) => `/thumbs/${id}.png`

const device = (id, label, href, shot) => ({ id, label, href, thumb: thumb(id), shot })

export const DEVICES = [
  device('galaxy-s26', 'Galaxy S26', '/docs/api/galaxy', 'device=phone&pvariant=s26&color=icyblue&ry=-24'),
  device('galaxy-s26-ultra', 'Galaxy S26 Ultra', '/docs/api/galaxy', 'device=phone&pvariant=s26ultra&color=titaniumsilverblue&ry=-24'),
  device('iphone-17', 'iPhone 17', '/docs/api/iphone', 'device=iphone&pvariant=17&color=mistblue&ry=-24'),
  device('iphone-17-air', 'iPhone 17 Air', '/docs/api/iphone', 'device=iphone&pvariant=air&color=skyblue&ry=-24'),
  device('iphone-17-pro', 'iPhone 17 Pro', '/docs/api/iphone', 'device=iphone&pvariant=pro&color=cosmicorange&ry=-24'),
  device('iphone-17-pro-max', 'iPhone 17 Pro Max', '/docs/api/iphone', 'device=iphone&pvariant=promax&color=deepblue&ry=-24'),
  device('galaxy-z-fold7', 'Galaxy Z Fold 7', '/docs/api/fold', 'device=fold&color=blueshadow&ry=-20'),
  device('galaxy-z-flip7', 'Galaxy Z Flip 7', '/docs/api/flip', 'device=flip&color=coralred&ry=-20'),
  device('macbook-air-13', 'MacBook Air 13″', '/docs/api/laptop', 'device=laptop&lvariant=air13&color=skyblue&ry=-18'),
  device('macbook-air-15', 'MacBook Air 15″', '/docs/api/laptop', 'device=laptop&lvariant=air15&color=midnight&ry=-18'),
  device('macbook-pro-14', 'MacBook Pro 14″', '/docs/api/laptop', 'device=laptop&lvariant=pro14&color=spaceblack&ry=-18'),
  device('macbook-pro-16', 'MacBook Pro 16″', '/docs/api/laptop', 'device=laptop&lvariant=pro16&color=silver&ry=-18'),
  device('ipad-pro-13', 'iPad Pro 13″', '/docs/api/ipad', 'device=tablet&variant=ipadpro13&color=spaceblack&ry=-22'),
  device('ipad-pro-11', 'iPad Pro 11″', '/docs/api/ipad', 'device=tablet&variant=ipadpro11&color=silver&ry=-22'),
  device('ipad-air-13', 'iPad Air 13″', '/docs/api/ipad', 'device=tablet&variant=ipadair13&color=blue&ry=-22'),
  device('ipad-air-11', 'iPad Air 11″', '/docs/api/ipad', 'device=tablet&variant=ipadair11&color=starlight&ry=-22'),
  device('ipad-11', 'iPad 11″', '/docs/api/ipad', 'device=tablet&variant=ipad11&color=blue&ry=-22'),
  device('galaxy-tab-s11', 'Galaxy Tab S11', '/docs/api/galaxy-tab', 'device=tablet&variant=tabs11&color=gray&ry=-22'),
  device('galaxy-tab-s11-ultra', 'Galaxy Tab S11 Ultra', '/docs/api/galaxy-tab', 'device=tablet&variant=tabs11ultra&color=silver&ry=-22'),
  device('apple-watch-series-11', 'Apple Watch Series 11', '/docs/api/apple-watch', 'device=watch&color=jetblack&ry=-18'),
  device('galaxy-watch-8', 'Galaxy Watch 8', '/docs/api/galaxy-watch', 'device=watch&wvariant=watch8&color=graphite&ry=-18'),
  device('studio-display', 'Studio Display', '/docs/api/studio-display', 'device=monitor&ry=-15'),
]

const object = (id, label, shot) => ({
  id,
  label,
  href: `/docs/api/${id}`,
  thumb: thumb(id),
  shot,
})

/** Ordered to match content/docs/api/meta.json. */
export const OBJECTS = [
  object('book', 'Book', 'device=book&ry=-28'),
  object('magazine', 'Magazine', 'device=magazine&ry=-28'),
  object('brochure', 'Brochure', 'device=brochure&ry=-22'),
  object('business-card', 'Business card', 'device=card&ry=-20&rx=8'),
  object('id-card', 'ID card', 'device=idcard&ry=-20'),
  object('greeting-card', 'Greeting card', 'device=greeting&ry=-24'),
  object('poster-frame', 'Poster frame', 'device=poster&ry=-18'),
  object('product-box', 'Product box', 'device=productbox&ry=-32&rx=12'),
  object('mailer-box', 'Mailer box', 'device=mailer&ry=-32&rx=16'),
  object('shopping-bag', 'Shopping bag', 'device=bag&ry=-26'),
  object('custom-panel', 'Custom panel', 'device=custompanel&ry=-18'),
  object('custom-box', 'Custom box', 'device=custombox&ry=-34&rx=14'),
  object('vinyl-record', 'Vinyl record', 'device=vinyl&ry=-20'),
  object('rollup-banner', 'Roll-up banner', 'device=rollup&ry=-18'),
  object('a-frame-sign', 'A-frame sign', 'device=aframe&ry=-22'),
  object('bus-shelter', 'Bus shelter', 'device=shelter&ry=-26'),
  object('dooh-totem', 'DOOH totem', 'device=totem&ry=-24'),
  object('billboard', 'Billboard', 'device=billboard&ry=-18'),
  object('storefront', 'Storefront', 'device=store&ry=-18&rx=4'),
  object('bus', 'Bus', 'device=bus&ry=-28&rx=6'),
  object('van', 'Van', 'device=van&ry=-32&rx=8'),
  object('semi-trailer', 'Semi trailer', 'device=semi&ry=-30&rx=6'),
  object('tv', 'TV set', 'device=tv&ry=-20'),
]
