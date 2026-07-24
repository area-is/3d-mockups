'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  BusMockup,
  BusShelterMockup,
  FlipMockup,
  FoldMockup,
  IDCardMockup,
  Laptop,
  type LaptopVariant,
  MagazineMockup,
  MockupCanvas,
  MonitorMockup,
  StorefrontMockup,
  Tablet,
  type TabletVariant,
  TVSetMockup,
  VanMockup,
  Watch,
  type WatchVariant,
} from 'area-mockups'

/**
 * Screenshot harness: renders one device, posed from URL params, on a plain
 * stage — no float, no controls — so Playwright can capture deterministic
 * high-resolution frames for model-vs-photo comparisons.
 *
 * Params:
 *   device      tablet | monitor | flip | fold | watch | laptop
 *               | bus | van | shelter | tv | idcard | store
 *               | magazine (default tablet)
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
  const variant = (params.get('variant') ?? 'ipadpro13') as TabletVariant
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
      <MonitorMockup
        controls={controls}
        camera={{ position: [0, cy, dist], fov: 40 }}
        shadows={shadows}
        rotation={[rx, ry, 0]}
      >
        {screen}
      </MonitorMockup>
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

  if (device === 'watch') {
    const dist = Number(params.get('dist') ?? 6.4)
    return (
      <MockupCanvas controls={controls} camera={{ position: [0, cy, dist], fov: 40 }} shadows={shadows}>
        <Watch
          variant={(params.get('wvariant') ?? 'series11') as WatchVariant}
          colorway={colorway}
          color={color}
          bandColor={params.get('bandColor') ?? undefined}
          rotation={[rx, ry, 0]}
          interactive={false}
          dragToRotate={false}
        >
          {screen}
        </Watch>
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
      <Tablet
        variant={variant}
        colorway={colorway}
        color={color}
        orientation={orientation}
        rotation={[rx, ry, 0]}
        interactive={false}
        dragToRotate={false}
      >
        {screen}
      </Tablet>
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
