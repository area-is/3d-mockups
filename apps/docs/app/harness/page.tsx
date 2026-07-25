'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  AFrameSignMockup,
  BillboardMockup,
  BookMockup,
  BrochureMockup,
  BusMockup,
  BusinessCardMockup,
  CustomBoxMockup,
  CustomPanelMockup,
  DOOHTotemMockup,
  GreetingCardMockup,
  IPhone,
  type IPhoneVariant,
  MailerBoxMockup,
  Galaxy,
  type GalaxyVariant,
  PosterFrameMockup,
  ProductBoxMockup,
  RollupBannerMockup,
  SemiTrailerMockup,
  ShoppingBagMockup,
  VinylRecordMockup,
  BusShelterMockup,
  FlipMockup,
  FoldMockup,
  IDCardMockup,
  Laptop,
  type LaptopVariant,
  MagazineMockup,
  MockupCanvas,
  StudioDisplayMockup,
  StorefrontMockup,
  IPad,
  type IPadVariant,
  GalaxyTab,
  type GalaxyTabVariant,
  TVSetMockup,
  VanMockup,
  AppleWatch,
  GalaxyWatch,
} from 'area-mockups'

/**
 * Mockups posed straight from their own framing — no per-device wiring, so
 * every object in the catalog can be probed from arbitrary angles. Anything
 * needing extra props (a variant, a second screen region, a pose) gets its
 * own branch below instead.
 */
const PLAIN = {
  aframe: AFrameSignMockup,
  billboard: BillboardMockup,
  book: BookMockup,
  brochure: BrochureMockup,
  card: BusinessCardMockup,
  totem: DOOHTotemMockup,
  greeting: GreetingCardMockup,
  mailer: MailerBoxMockup,
  poster: PosterFrameMockup,
  productbox: ProductBoxMockup,
  rollup: RollupBannerMockup,
  semi: SemiTrailerMockup,
  bag: ShoppingBagMockup,
  vinyl: VinylRecordMockup,
} as const satisfies Record<string, React.ComponentType<Record<string, unknown>>>

/**
 * Fill EVERY live region of a mockup with its own flat hue, labelled. A DOM
 * screen bridged onto a face cannot depth-test against the WebGL canvas by
 * itself, so a face on the far side of an object can paint straight through
 * it; with one colour per region, any such bleed-through is unmistakable
 * rather than a subtle overlap of two similar gradients.
 *
 * Slots are enumerated off the mockup itself (`createSlots` attaches one
 * capitalized component per region), so this covers objects it has never
 * heard of — including any added later.
 */
function regionProbe(Mockup: object): React.ReactNode {
  const slots = Object.entries(Mockup).filter(
    ([key, value]) => /^[A-Z]/.test(key) && typeof value === 'function'
  ) as [string, React.ComponentType<{ children?: React.ReactNode }>][]
  return slots.map(([name, Slot], i) => (
    <Slot key={name}>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          background: `hsl(${(i * 360) / Math.max(slots.length, 1)} 72% 52%)`,
          color: '#fff',
          font: '700 34px/1 system-ui, sans-serif',
          letterSpacing: '0.04em',
        }}
      >
        {name.toUpperCase()}
      </div>
    </Slot>
  ))
}

/**
 * Screenshot harness: renders one device, posed from URL params, on a plain
 * stage — no float, no controls — so Playwright can capture deterministic
 * high-resolution frames for model-vs-photo comparisons.
 *
 * Params:
 *   device      tablet | monitor | flip | fold | watch | laptop
 *               | phone | iphone | bus | van | shelter | tv | idcard
 *               | store | magazine (default tablet)
 *   pvariant    device variant id                  (phone, iphone)
 *   bandOpen    1 | 0 — unbuckled band             (watch)
 *   variant     device variant id                  (tablet only)
 *   colorway    retail colorway id                 | color=#hex overrides
 *   orientation portrait | landscape               (tablet)
 *   open        1 | 0                              (flip)
 *   coverage    panel | full                       (bus, van)
 *   over        1 | 0 — wrap over the glass        (bus, default 1)
 *   sign        LED text; '|' splits pages         (bus destination sign)
 *   arrivals    LED text; '|' splits board rows    (shelter)
 *   arrivalsBack LED text for the board's back     (shelter; defaults to mirror)
 *   rx, ry      device rotation in degrees         (default 0, 0)
 *   dist        camera distance in world units     (default per device)
 *   cy          camera height                      (default 0)
 *   screen      dark | gradient                    (default gradient)
 *   shadows     1 | 0                              (default 0 — clean poses)
 *   controls    1 | 0                              (default 0 — drag tests)
 */
function HarnessScene() {
  const params = useSearchParams()
  const device = params.get('device') ?? 'tablet'
  const variant = params.get('variant') ?? 'ipadpro13'
  const colorway = params.get('colorway') ?? undefined
  const color = params.get('color') ?? undefined
  const orientation = params.get('orientation') === 'landscape' ? 'landscape' : 'portrait'
  const rx = (Number(params.get('rx') ?? 0) * Math.PI) / 180
  const ry = (Number(params.get('ry') ?? 0) * Math.PI) / 180
  const cy = Number(params.get('cy') ?? 0)
  const shadows = params.get('shadows') === '1'
  const controls = params.get('controls') === '1'
  const screen =
    params.get('screen') === 'dark' ? (
      <div style={{ width: '100%', height: '100%', background: '#000' }} />
    ) : params.get('screen') === 'light' ? (
      <div style={{ width: '100%', height: '100%', background: '#dfe3e8' }} />
    ) : (
      <div
        style={{
          width: '100%',
          height: '100%',
          background:
            'radial-gradient(120% 90% at 30% 20%, #3d6bb0 0%, #24406e 42%, #101d38 78%, #0a1226 100%)',
        }}
      />
    )

  // Everything with no extra wiring: posed from the object's own framing
  // unless `dist` overrides it, so the probe sees what a caller gets.
  const plain = PLAIN[device as keyof typeof PLAIN]
  if (plain) {
    const Mockup = plain as React.ComponentType<Record<string, unknown>>
    const distParam = params.get('dist')
    return (
      <Mockup
        color={color}
        controls={controls}
        camera={distParam ? { position: [0, cy, Number(distParam)], fov: 40 } : undefined}
        shadows={shadows}
        rotation={[rx, ry, 0]}
      >
        {params.get('regions') === '1' ? regionProbe(plain) : screen}
      </Mockup>
    )
  }

  // The two size-driven objects: a shape is a prop, not a spec, so they need
  // one passed in. `w`/`h`/`d` are millimeters.
  if (device === 'custombox' || device === 'custompanel') {
    const mm = (key: string, fallback: number) => Number(params.get(key) ?? fallback)
    const distParam = params.get('dist')
    const camera = distParam ? { position: [0, cy, Number(distParam)] as [number, number, number], fov: 40 } : undefined
    return device === 'custombox' ? (
      <CustomBoxMockup
        size={{ width: mm('w', 180), height: mm('h', 120), depth: mm('d', 60) }}
        color={color}
        controls={controls}
        camera={camera}
        shadows={shadows}
        rotation={[rx, ry, 0]}
      >
        {screen}
      </CustomBoxMockup>
    ) : (
      <CustomPanelMockup
        size={{ width: mm('w', 300), height: mm('h', 200), thickness: mm('d', 5) }}
        color={color}
        controls={controls}
        camera={camera}
        shadows={shadows}
        rotation={[rx, ry, 0]}
      >
        {screen}
      </CustomPanelMockup>
    )
  }

  if (device === 'bus') {
    const dist = Number(params.get('dist') ?? 11.8)
    const sign = params.get('sign')
    return (
      <BusMockup
        coverage={params.get('coverage') === 'full' ? 'full' : 'panel'}
        wrapOverWindows={params.get('over') !== '0'}
        color={color}
        interactive={false}
        dragToRotate={false}
        controls={controls}
        camera={{ position: [0, cy, dist], fov: 40 }}
        shadows={shadows}
        rotation={[rx, ry, 0]}
      >
        {screen}
        {sign ? (
          <BusMockup.DestinationSign>{sign.includes('|') ? sign.split('|') : sign}</BusMockup.DestinationSign>
        ) : null}
        <BusMockup.StreetSide>{screen}</BusMockup.StreetSide>
        <BusMockup.Rear>{screen}</BusMockup.Rear>
      </BusMockup>
    )
  }

  if (device === 'van') {
    const dist = Number(params.get('dist') ?? 10.6)
    return (
      <VanMockup
        coverage={params.get('coverage') === 'full' ? 'full' : 'panel'}
        color={color}
        interactive={false}
        dragToRotate={false}
        controls={controls}
        camera={{ position: [0, cy, dist], fov: 40 }}
        shadows={shadows}
        rotation={[rx, ry, 0]}
      >
        {screen}
        <VanMockup.StreetSide>{screen}</VanMockup.StreetSide>
        <VanMockup.Rear>{screen}</VanMockup.Rear>
      </VanMockup>
    )
  }

  if (device === 'shelter') {
    const dist = Number(params.get('dist') ?? 11)
    const arrivals = params.get('arrivals')
    const arrivalsBack = params.get('arrivalsBack')
    return (
      <BusShelterMockup
        interactive={false}
        dragToRotate={false}
        controls={controls}
        camera={{ position: [0, cy, dist], fov: 40 }}
        shadows={shadows}
        rotation={[rx, ry, 0]}
      >
        {screen}
        {arrivals ? (
          <BusShelterMockup.Arrivals>
            {arrivals.includes('|') ? arrivals.split('|') : arrivals}
          </BusShelterMockup.Arrivals>
        ) : null}
        {arrivalsBack ? (
          <BusShelterMockup.ArrivalsBack>
            {arrivalsBack.includes('|') ? arrivalsBack.split('|') : arrivalsBack}
          </BusShelterMockup.ArrivalsBack>
        ) : null}
      </BusShelterMockup>
    )
  }

  if (device === 'tv') {
    const dist = Number(params.get('dist') ?? 11.6)
    return (
      <TVSetMockup
        size={params.get('inches') ? Number(params.get('inches')) : undefined}
        variant={(params.get('tvvariant') ?? undefined) as 'legs' | 'pedestal' | 'frame' | undefined}
        color={color}
        interactive={false}
        dragToRotate={false}
        controls={controls}
        camera={{ position: [0, cy, dist], fov: 40 }}
        shadows={shadows}
        rotation={[rx, ry, 0]}
      >
        {screen}
      </TVSetMockup>
    )
  }

  if (device === 'store') {
    const dist = Number(params.get('dist') ?? 12)
    return (
      <StorefrontMockup
        interactive={false}
        dragToRotate={false}
        controls={controls}
        camera={{ position: [0, cy, dist], fov: 40 }}
        shadows={shadows}
        rotation={[rx, ry, 0]}
      >
        {screen}
        <StorefrontMockup.FrontLeft>{screen}</StorefrontMockup.FrontLeft>
        <StorefrontMockup.FrontRight>{screen}</StorefrontMockup.FrontRight>
        <StorefrontMockup.Door>{screen}</StorefrontMockup.Door>
        <StorefrontMockup.Left>{screen}</StorefrontMockup.Left>
        <StorefrontMockup.Right>{screen}</StorefrontMockup.Right>
        <StorefrontMockup.Rear>{screen}</StorefrontMockup.Rear>
        <StorefrontMockup.LeftSign>{screen}</StorefrontMockup.LeftSign>
        <StorefrontMockup.RightSign>{screen}</StorefrontMockup.RightSign>
        <StorefrontMockup.RearSign>{screen}</StorefrontMockup.RearSign>
      </StorefrontMockup>
    )
  }

  if (device === 'magazine') {
    const dist = Number(params.get('dist') ?? 8.2)
    return (
      <MagazineMockup
        glossy={params.get('glossy') === '1'}
        interactive={false}
        dragToRotate={false}
        controls={controls}
        camera={{ position: [0, cy, dist], fov: 40 }}
        shadows={shadows}
        rotation={[rx, ry, 0]}
      >
        {screen}
        {params.get('back') === '1' ? <MagazineMockup.Back>{screen}</MagazineMockup.Back> : null}
        {params.get('spine') === '0' ? null : <MagazineMockup.Spine>{screen}</MagazineMockup.Spine>}
      </MagazineMockup>
    )
  }

  if (device === 'idcard') {
    const dist = Number(params.get('dist') ?? 6)
    return (
      <IDCardMockup
        interactive={false}
        dragToRotate={false}
        controls={controls}
        camera={{ position: [0, cy, dist], fov: 40 }}
        shadows={shadows}
        rotation={[rx, ry, 0]}
      >
        {screen}
        {params.get('back') === '1' ? <IDCardMockup.Back>{screen}</IDCardMockup.Back> : null}
      </IDCardMockup>
    )
  }

  if (device === 'monitor') {
    const dist = Number(params.get('dist') ?? 9.4)
    return (
      <StudioDisplayMockup
        controls={controls}
        camera={{ position: [0, cy, dist], fov: 40 }}
        shadows={shadows}
        rotation={[rx, ry, 0]}
      >
        {screen}
      </StudioDisplayMockup>
    )
  }

  if (device === 'flip') {
    const dist = Number(params.get('dist') ?? 7.4)
    return (
      <FlipMockup
        open={params.get('open') !== '0'}
        openAngle={params.get('openAngle') ? Number(params.get('openAngle')) : undefined}
        colorway={colorway}
        color={color}
        controls={controls}
        camera={{ position: [0, cy, dist], fov: 40 }}
        shadows={shadows}
        rotation={[rx, ry, 0]}
      >
        {screen}
      </FlipMockup>
    )
  }

  if (device === 'fold') {
    const dist = Number(params.get('dist') ?? 8.4)
    return (
      <FoldMockup
        open={params.get('open') !== '0'}
        openAngle={params.get('openAngle') ? Number(params.get('openAngle')) : undefined}
        colorway={colorway}
        color={color}
        controls={controls}
        camera={{ position: [0, cy, dist], fov: 40 }}
        shadows={shadows}
        rotation={[rx, ry, 0]}
      >
        {screen}
      </FoldMockup>
    )
  }

  if (device === 'phone' || device === 'iphone') {
    const dist = Number(params.get('dist') ?? 7.4)
    const Device = device === 'phone' ? Galaxy : IPhone
    return (
      <MockupCanvas controls={controls} camera={{ position: [0, cy, dist], fov: 40 }} shadows={shadows}>
        <Device
          variant={(params.get('pvariant') ?? undefined) as GalaxyVariant & IPhoneVariant}
          colorway={colorway}
          color={color}
          orientation={orientation}
          rotation={[rx, ry, 0]}
          interactive={false}
          dragToRotate={false}
        >
          {screen}
        </Device>
      </MockupCanvas>
    )
  }

  // The two watches are separate components; `wvariant=watch8` still selects
  // the Galaxy so existing probe URLs keep working.
  if (device === 'watch') {
    const dist = Number(params.get('dist') ?? 6.4)
    const galaxy = params.get('wvariant') === 'watch8'
    const shared = {
      colorway,
      color,
      bandColor: params.get('bandColor') ?? undefined,
      rotation: [rx, ry, 0] as [number, number, number],
      interactive: false,
      dragToRotate: false,
    }
    return (
      <MockupCanvas controls={controls} camera={{ position: [0, cy, dist], fov: 40 }} shadows={shadows}>
        {galaxy ? (
          <GalaxyWatch {...shared} bandOpen={params.get('bandOpen') === '1'}>
            {screen}
          </GalaxyWatch>
        ) : (
          <AppleWatch {...shared}>{screen}</AppleWatch>
        )}
      </MockupCanvas>
    )
  }

  if (device === 'laptop') {
    const dist = Number(params.get('dist') ?? 7.6)
    return (
      <MockupCanvas controls={controls} camera={{ position: [0, cy, dist], fov: 40 }} shadows={shadows}>
        <Laptop
          variant={(params.get('lvariant') ?? 'pro14') as LaptopVariant}
          colorway={colorway}
          color={color}
          openAngle={params.get('openAngle') ? Number(params.get('openAngle')) : undefined}
          rotation={[rx, ry, 0]}
          interactive={false}
          dragToRotate={false}
        >
          {screen}
        </Laptop>
      </MockupCanvas>
    )
  }

  const dist = Number(params.get('dist') ?? (variant === 'tabs11ultra' ? 9.6 : 8.6))
  return (
    <MockupCanvas
      controls={controls}
      camera={{ position: [0, cy, dist], fov: 40 }}
      shadows={shadows}
    >
      {variant.startsWith('tabs') ? (
        <GalaxyTab
          variant={variant as GalaxyTabVariant}
          colorway={colorway}
          color={color}
          orientation={orientation}
          rotation={[rx, ry, 0]}
          interactive={false}
          dragToRotate={false}
        >
          {screen}
        </GalaxyTab>
      ) : (
        <IPad
          variant={variant as IPadVariant}
          colorway={colorway}
          color={color}
          orientation={orientation}
          rotation={[rx, ry, 0]}
          interactive={false}
          dragToRotate={false}
        >
          {screen}
        </IPad>
      )}
    </MockupCanvas>
  )
}

export default function HarnessPage() {
  return (
    <div id="harness-stage" style={{ width: '100vw', height: '100vh', background: '#f4f5f7' }}>
      <Suspense>
        <HarnessScene />
      </Suspense>
    </div>
  )
}
