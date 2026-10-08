import * as React from 'react'
import {
  resolveStatusBarContent,
  statusBarLayout,
  type StatusBarBattery,
  type StatusBarContent,
  type StatusBarCutout,
  type StatusBarFormFactor,
  type StatusBarPlatform,
} from '../core'

/**
 * The system status bar, drawn over the top of a live screen.
 *
 * Every glyph is an inline SVG on its own point grid rather than a font glyph
 * or an image: a mockup is looked at closely and at an angle, and the parts
 * people recognise - the four ascending cellular bars, the three Wi-Fi arcs,
 * the battery capsule with its nub - have to stay crisp at any size and take
 * the surface's colour. The proportions are each platform's own, so an iOS
 * battery is Apple's rounded 25x13 capsule and a One UI battery is Samsung's
 * pill with the percentage set into it.
 *
 * It is positioned, never in flow: the bar sits above whatever the caller
 * passes as children and always at the top of the panel, which is what a real
 * status bar does. Content laid out underneath it is the caller's business -
 * the same as on a real device, where the bar overlaps whatever is behind it.
 */

export interface StatusBarProps extends StatusBarContent {
  platform: StatusBarPlatform
  formFactor: StatusBarFormFactor
  /** Surface width in CSS px. */
  width: number
  /** The device's front-camera cutout, when it has one. */
  cutout?: StatusBarCutout
  /** The display's corner radius in CSS px, so the clusters clear the arc. */
  corner?: number
  /**
   * Ink. Defaults to white, which is what sits over the dark wallpapers and
   * full-bleed art these mockups usually carry; pass a dark value for a light
   * screen, exactly as an app picks its status-bar style.
   */
  color?: string
}

/**
 * The face each platform sets its bar in. Apple ships San Francisco and
 * Samsung ships One UI Sans; neither is ours to bundle, so each stack asks for
 * the platform's own face first - on a Mac and on a Galaxy the first name
 * resolves and the bar is set in the real thing - and then for the closest
 * faces a host is likely to have: Inter (SF's nearest open cousin, and often
 * already on the page), Roboto, Segoe UI, Helvetica.
 *
 * `system-ui` is left out on purpose. Off Apple and Windows it is whatever the
 * desktop's UI face happens to be - on most Linux machines, and so in most
 * headless renders, DejaVu Sans, whose wide, open digits look nothing like a
 * phone's. Helvetica and Arial resolve to Liberation Sans there instead.
 *
 * A page that loads its own face overrides both stacks with
 * `--mockup-status-bar-font`.
 */
const FONT_STACKS: Record<StatusBarPlatform, string> = {
  ios: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", Inter, "Inter Variable", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
  oneui:
    '"One UI Sans", "SamsungOne", "Samsung Sans", Roboto, "Roboto Flex", Inter, "Inter Variable", "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
}

/**
 * Trim a run of text to its cap height, so centring it centres the digits.
 * Left alone, a line box is placed by the face's ascent and descent, which
 * differ from face to face - so the same flex centring that sits SF's digits
 * in the middle of the battery left a fallback's riding high in it.
 */
const CAP_TRIM: React.CSSProperties = { textBox: 'trim-both cap alphabetic' }

/** The tint a battery's fill takes in each state, if not the ink. */
const batteryFill = (state: StatusBarBattery, ink: string, low: string, charging: string) =>
  state === 'low' ? low : state === 'charging' ? charging : ink

/** `#rgb`, `#rrggbb`, `rgb()`/`rgba()`, `white`, `black` - as 0-255 channels. */
function parseColor(color: string): [number, number, number] | null {
  const value = color.trim()
  const hex = value.match(/^#([0-9a-f]{3,8})$/i)?.[1]
  if (hex) {
    if (hex.length < 6) return [0, 1, 2].map((i) => Number.parseInt(hex[i]! + hex[i]!, 16)) as [number, number, number]
    return [0, 2, 4].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
  }
  const rgb = value.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i)
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  if (/^white$/i.test(value)) return [255, 255, 255]
  if (/^black$/i.test(value)) return [0, 0, 0]
  return null
}

/**
 * Black or white, whichever reads on `color`: the digits knocked out of a
 * battery's fill. A colour this can't read is taken to be the light ink the
 * bar defaults to, so the knock-out is dark.
 */
function contrastInk(color: string): string {
  const rgb = parseColor(color)
  if (!rgb) return '#000000'
  const [r, g, b] = rgb.map((c) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.36 ? '#000000' : '#ffffff'
}

const BOLT = 'M3.6 0 0 5.6h2.4L1.9 10 6 4.2H3.5z'

/** A charge bolt on a 6x10 grid, as a path for the SVG capsules. */
const BoltPath = ({ x, y, scale, paint }: { x: number; y: number; scale: number; paint: string }) => (
  <path d={BOLT} fill={paint} transform={`translate(${x} ${y}) scale(${scale})`} />
)

/** The same bolt as an inline icon, for the HTML meters. */
const BoltIcon = ({ size, color }: { size: number; color: string }) => (
  <svg
    viewBox="0 0 6 10"
    width={size * 0.6}
    height={size}
    aria-hidden
    focusable="false"
    style={{ display: 'block', flex: 'none', width: size * 0.6, height: size }}
  >
    <path d={BOLT} fill={color} />
  </svg>
)

/**
 * A meter with its number set into it: ink over the empty run of the track,
 * knocked out of the filled run. This is how iOS 16's capsule and One UI 8.5's
 * pill both print the percentage - the digits invert where they cross the
 * fill, so they never vanish into it at any level.
 *
 * HTML rather than SVG text, because a flex box centres the digits - and,
 * asked to, hugs them - in whatever face the host resolves for the platform's
 * font, without measuring anything. (An SVG mask over `<text>` did the job
 * until it met a screen painted at a reduced raster scale, where the mask and
 * the glyphs stopped agreeing about their size.) The knock-out is two copies
 * of the run laid on top of each other: one in ink clipped to the empty run,
 * one in the contrasting ink clipped to the filled run.
 */
function Meter({
  width,
  minWidth,
  height,
  radius,
  level,
  color,
  fill,
  fontSize,
  padding,
  bolt,
  label,
}: {
  /** A fixed width, or nothing to hug the digits. */
  width?: number
  /** When hugging, the narrowest it gets - so two digits are not a dot. */
  minWidth?: number
  height: number
  radius: number
  level: number
  /** Ink: the empty run's track and the digits over it. */
  color: string
  /** The filled run - ink, or a charge or low-battery tint. */
  fill: string
  fontSize: number
  padding: number
  bolt?: boolean
  label: string
}) {
  const filled = Math.min(100, Math.max(0, level * 100))
  const knock = contrastInk(fill)
  // The in-flow copy grows to the meter's width, so it centres its digits in
  // exactly the box the absolute copy does and the two register at the fill.
  const run = (paint: string, clip: string, inFlow: boolean): React.CSSProperties => ({
    position: inFlow ? 'relative' : 'absolute',
    ...(inFlow ? { flex: '1 0 auto' } : { inset: 0 }),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: fontSize * 0.2,
    boxSizing: 'border-box',
    height: '100%',
    padding: `0 ${padding}px`,
    color: paint,
    clipPath: clip,
    fontSize,
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: '-0.02em',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  })
  const content = (paint: string) => (
    <>
      {bolt ? <BoltIcon size={fontSize * 0.92} color={paint} /> : null}
      <span style={CAP_TRIM}>{label}</span>
    </>
  )
  return (
    <span
      aria-hidden
      style={{
        position: 'relative',
        display: 'inline-flex',
        flex: 'none',
        width,
        minWidth,
        height,
        borderRadius: radius,
        overflow: 'hidden',
        verticalAlign: 'middle',
      }}
    >
      <span style={{ position: 'absolute', inset: 0, background: color, opacity: 0.32 }} />
      <span style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${filled}%`, background: fill }} />
      <span style={run(color, `inset(0 0 0 ${filled}%)`, true)}>{content(color)}</span>
      <span style={run(knock, `inset(0 ${100 - filled}% 0 0)`, false)}>{content(knock)}</span>
    </span>
  )
}

/** iOS cellular: four bars, equal width, ascending, square-ish corners. */
function IosSignal({ h, lit, color }: { h: number; lit: number; color: string }) {
  const w = h * 1.42
  const bars = 4
  const barW = (w / bars) * 0.62
  const step = w / bars
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden focusable="false">
      {Array.from({ length: bars }, (_, i) => {
        const barH = h * (0.42 + (i * 0.58) / (bars - 1))
        return (
          <rect
            key={i}
            x={i * step}
            y={h - barH}
            width={barW}
            height={barH}
            rx={barW * 0.3}
            fill={color}
            opacity={i < lit ? 1 : 0.32}
          />
        )
      })}
    </svg>
  )
}

/**
 * A fan of three concentric stripes - the inner wedge and two bands - opening
 * upward from an apex at `(ax, ay)`, `spread` radians either side of vertical.
 * Both systems draw Wi-Fi this way; they differ in the angle and the corners.
 */
function fanStripe(ax: number, ay: number, spread: number, r1: number, r2: number): string {
  const sx = Math.sin(spread)
  const cy = Math.cos(spread)
  return r1 === 0
    ? `M${ax} ${ay} L${ax - r2 * sx} ${ay - r2 * cy} A${r2} ${r2} 0 0 1 ${ax + r2 * sx} ${ay - r2 * cy} Z`
    : `M${ax - r2 * sx} ${ay - r2 * cy} A${r2} ${r2} 0 0 1 ${ax + r2 * sx} ${ay - r2 * cy} ` +
        `L${ax + r1 * sx} ${ay - r1 * cy} A${r1} ${r1} 0 0 0 ${ax - r1 * sx} ${ay - r1 * cy} Z`
}

/**
 * iOS Wi-Fi: a quarter-circle fan, 45 degrees either side of vertical, cut
 * into a wedge and two bands of about equal weight, every corner softened.
 * Not three free-standing semicircles over a dot - that is a broadcast icon.
 */
function IosWifi({ h, lit, color }: { h: number; lit: number; color: string }) {
  const w = h * (16.4 / 12)
  // Drawn on a 16.4x12 grid. The stripes are inset by half the stroke that
  // rounds their corners, so the visible bands are 2.4 thick with 1.35 gaps.
  const round = 0.9
  const stripes: [number, number][] = [
    [0, 3.45],
    [5.7, 7.2],
    [9.45, 10.85],
  ]
  return (
    <svg width={w} height={h} viewBox="0 0 16.4 12" aria-hidden focusable="false" style={{ width: w, height: h }}>
      {stripes.map(([r1, r2], i) => (
        <path
          key={i}
          d={fanStripe(8.2, 11.4, Math.PI / 4, r1, r2)}
          fill={color}
          stroke={color}
          strokeWidth={round}
          strokeLinejoin="round"
          opacity={lit > i ? 1 : 0.32}
        />
      ))}
    </svg>
  )
}

/**
 * iOS battery: Apple's 25x13 rounded capsule with a nub on the trailing edge.
 * Plain, it is a faint outline with the charge inset in it. With the
 * percentage on - which iOS 16 brought to every iPhone - the outline goes and
 * the capsule itself becomes the meter, the number set into it.
 */
function IosBattery({
  h,
  level,
  state,
  color,
  percent,
}: {
  h: number
  level: number
  state: StatusBarBattery
  color: string
  percent: boolean
}) {
  const fill = batteryFill(state, color, '#ff3b30', '#34c759')
  if (percent) {
    const label = String(Math.round(level * 100))
    // The bolt shares the capsule with two digits; with three there is no
    // room, and the green fill already says it is charging. Three digits
    // squeeze down the way SF's compact numerals do on the real thing.
    const bolt = state === 'charging' && label.length < 3
    const size = (label.length >= 3 ? 9.6 : bolt ? 9.2 : 11) * (h / 13)
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', flex: 'none' }}>
        <Meter
          width={h * (25 / 13)}
          height={h}
          radius={h * (4.2 / 13)}
          level={level}
          color={color}
          fill={fill}
          fontSize={size}
          padding={h * (1.6 / 13)}
          bolt={bolt}
          label={label}
        />
        {/* the nub */}
        <span
          aria-hidden
          style={{
            display: 'block',
            width: h * (1.4 / 13),
            height: h * (3.8 / 13),
            marginLeft: h * (0.8 / 13),
            borderRadius: `0 ${h * (1.4 / 13)}px ${h * (1.4 / 13)}px 0`,
            background: color,
            opacity: 0.42,
          }}
        />
      </span>
    )
  }
  const w = h * (27 / 13)
  return (
    <svg width={w} height={h} viewBox="0 0 27 13" aria-hidden focusable="false" style={{ width: w, height: h }}>
      <path d="M25.8 4.6c1 .3 1.4 1 1.4 1.9s-.4 1.6-1.4 1.9z" fill={color} opacity="0.42" />
      <rect
        x="0.6"
        y="0.6"
        width="23.8"
        height="11.8"
        rx="3.6"
        fill="none"
        stroke={color}
        strokeWidth="1.1"
        opacity="0.42"
      />
      <rect x="2.1" y="2.1" width={Math.max(0, 20.8 * level)} height="8.8" rx="2.2" fill={fill} />
      {state === 'charging' ? <BoltPath x={9.6} y={1.6} scale={0.98} paint="#000" /> : null}
    </svg>
  )
}

/** One UI cellular: four bars, tighter and squarer than Apple's. */
function OneUiSignal({ h, lit, color }: { h: number; lit: number; color: string }) {
  const bars = 4
  const w = h * 1.3
  const barW = (w / bars) * 0.7
  const step = w / bars
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden focusable="false">
      {Array.from({ length: bars }, (_, i) => {
        const barH = h * (0.34 + (i * 0.66) / (bars - 1))
        return (
          <rect
            key={i}
            x={i * step}
            y={h - barH}
            width={barW}
            height={barH}
            rx={barW * 0.22}
            fill={color}
            opacity={i < lit ? 1 : 0.3}
          />
        )
      })}
    </svg>
  )
}

/**
 * One UI Wi-Fi: a fan, not Apple's separated arcs - but a fan cut into three
 * concentric stripes, the inner wedge and two bands, each lit or dimmed for
 * the strength. With a `generation`, the small superscript One UI hangs off
 * the fan's shoulder on a Wi-Fi 6 or 7 network.
 */
function OneUiWifi({
  h,
  lit,
  color,
  generation,
}: {
  h: number
  lit: number
  color: string
  generation?: number
}) {
  const w = h * (generation ? 1.6 : 1.3)
  // The fan: apex at the foot, spread 50 degrees either side of vertical.
  const stripe = (r1: number, r2: number) => fanStripe(10, 14, (50 * Math.PI) / 180, r1, r2)
  const stripes: [number, number][] = [
    [0, 4.4],
    [5.6, 8.8],
    [10, 13],
  ]
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${generation ? 24.6 : 20} 15`}
      aria-hidden
      focusable="false"
      style={{ width: w, height: h }}
    >
      {stripes.map(([r1, r2], i) => (
        <path key={i} d={stripe(r1, r2)} fill={color} opacity={lit > i ? 1 : 0.3} />
      ))}
      {generation ? (
        <text x={20} y={6.2} fontSize={6.6} fontWeight={700} fill={color}>
          {generation}
        </text>
      ) : null}
    </svg>
  )
}

/**
 * One UI battery. Since One UI 8.5 it is a pill, a touch taller than the
 * icons beside it, filled to the charge with the percentage set into the
 * fill - so that is the default. It keeps its proportions at two digits
 * rather than closing up around them, and widens only for a face too wide to
 * fit three. Without the percentage it falls back to the squarer outline
 * capsule of the releases before, nub on the trailing edge.
 */
function OneUiBattery({
  h,
  level,
  state,
  color,
  percent,
}: {
  h: number
  level: number
  state: StatusBarBattery
  color: string
  percent: boolean
}) {
  const fill = batteryFill(state, color, '#ff4d4f', '#3ddc84')
  if (percent) {
    const height = h * 1.12
    return (
      <Meter
        minWidth={height * 1.9}
        height={height}
        radius={height / 2}
        level={level}
        color={color}
        fill={fill}
        fontSize={height * (11.6 / 14)}
        padding={height * (2.6 / 14)}
        bolt={state === 'charging'}
        label={String(Math.round(level * 100))}
      />
    )
  }
  const w = h * (24 / 12)
  return (
    <svg width={w} height={h} viewBox="0 0 26 12" aria-hidden focusable="false" style={{ width: w, height: h }}>
      <rect
        x="0.7"
        y="0.7"
        width="22.6"
        height="10.6"
        rx="2.6"
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        opacity="0.45"
      />
      <rect x="24.4" y="3.6" width="1.6" height="4.8" rx="0.8" fill={color} opacity="0.45" />
      <rect x="2.4" y="2.4" width={Math.max(0, 19.2 * level)} height="7.2" rx="1.4" fill={fill} />
      {state === 'charging' ? <BoltPath x={9.4} y={1.2} scale={0.96} paint="#000" /> : null}
    </svg>
  )
}

/**
 * The clock and the trailing cluster, placed by `statusBarLayout`.
 *
 * The two are absolutely positioned rather than laid out in a flex row,
 * because on iOS they are not a row: each is centred in its own ear either
 * side of the Dynamic Island, and the gap between them is hardware.
 *
 * The trailing cluster runs in each system's own order. iOS reads signal,
 * Wi-Fi, battery; One UI reads Wi-Fi, signal, battery. And the percentage,
 * when shown, goes where each puts it: inside the iPhone's capsule, written
 * out as `100%` before the iPad's, and inside One UI's pill.
 */
export function StatusBar({
  platform,
  formFactor,
  width,
  cutout,
  corner,
  color = '#ffffff',
  ...content
}: StatusBarProps) {
  const layout = statusBarLayout({ platform, formFactor, width, cutout, corner })
  const { time, date, signal, wifi, wifiGeneration, battery, batteryState, batteryPercent, carrier } =
    resolveStatusBarContent(content, platform, formFactor)
  const ios = platform === 'ios'
  const tablet = formFactor === 'tablet'
  const h = layout.iconHeight

  const clusterStyle: React.CSSProperties = {
    position: 'absolute',
    top: layout.centerY,
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: layout.gap,
    lineHeight: 1,
    whiteSpace: 'nowrap',
  }
  const textStyle: React.CSSProperties = {
    ...CAP_TRIM,
    fontSize: layout.fontSize,
    fontWeight: layout.fontWeight,
    letterSpacing: `${layout.letterSpacing}em`,
  }

  return (
    <div
      aria-hidden
      data-status-bar={platform}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height: layout.bandHeight,
        color,
        fontFamily: `var(--mockup-status-bar-font, ${FONT_STACKS[platform]})`,
        fontVariantNumeric: 'tabular-nums',
        pointerEvents: 'none',
        /*
         * No z-index. The bar is the surface's last child, so it already
         * paints over the content, and asking for one costs a great deal more
         * than it buys: a stacking context on a stack of CSS3D-transformed
         * layers pushes Chromium to rasterize each screen on its own
         * full-resolution layer, which blows the tile budget and leaves the
         * glass blank - the same failure the fill-mode note in the docs'
         * carousel describes. Painting order is enough.
         */
      }}
    >
      <div
        style={{
          ...clusterStyle,
          // iOS centres the clock in the left ear, so the anchor is that ear's
          // centre and the text is pulled back by half of itself. One UI sets
          // it flush to the inset, where a left edge is a left edge.
          left: layout.leadingX,
          transform: layout.split ? 'translate(-50%, -50%)' : 'translateY(-50%)',
        }}
      >
        <span style={textStyle}>{time}</span>
        {ios && tablet && date ? (
          <span style={{ ...textStyle, marginLeft: layout.gap * 0.5 }}>{date}</span>
        ) : null}
        {!ios && carrier ? (
          <span style={{ ...CAP_TRIM, fontSize: layout.fontSize * 0.86, fontWeight: 500, opacity: 0.85 }}>
            {carrier}
          </span>
        ) : null}
      </div>

      <div
        style={{
          ...clusterStyle,
          left: layout.trailingX,
          transform: layout.split ? 'translate(-50%, -50%)' : 'translate(-100%, -50%)',
        }}
      >
        {ios ? (
          <>
            <IosSignal h={h} lit={signal} color={color} />
            <IosWifi h={h} lit={wifi} color={color} />
            {tablet && batteryPercent ? (
              <span style={{ ...textStyle, marginLeft: layout.gap * 0.4 }}>
                {Math.round(battery * 100)}%
              </span>
            ) : null}
            <IosBattery
              h={h}
              level={battery}
              state={batteryState}
              color={color}
              percent={batteryPercent && !tablet}
            />
          </>
        ) : (
          <>
            <OneUiWifi h={h} lit={wifi} color={color} generation={wifiGeneration} />
            <OneUiSignal h={h} lit={signal} color={color} />
            <OneUiBattery
              h={h}
              level={battery}
              state={batteryState}
              color={color}
              percent={batteryPercent}
            />
          </>
        )}
      </div>
    </div>
  )
}

/**
 * How a device exposes the bar: `true` for the defaults, or an object to set
 * the time, the meters and the ink.
 *
 * A boolean rather than a component, because the bar is not content - it is
 * part of the device, drawn in the device's own units and placed against the
 * device's own camera cutout. Passing it as children would put the caller in
 * charge of geometry only the model knows.
 */
export type StatusBarOption = boolean | (StatusBarContent & { color?: string })

/**
 * Where a device puts its bar: the platform whose bar it is, plus the geometry
 * only the model knows. Named because two things are derived from it - the bar
 * itself and the strip it costs the content underneath - and they must be
 * derived from the same numbers.
 */
export interface StatusBarPlacement {
  platform: StatusBarPlatform
  formFactor: StatusBarFormFactor
  /** Surface width in CSS px. */
  width: number
  cutout?: StatusBarCutout
  corner?: number
}

/** Resolve the prop into the element the device overlays, or nothing. */
export function renderStatusBar(
  option: StatusBarOption | undefined,
  base: StatusBarPlacement
): React.ReactNode {
  if (!option) return null
  return <StatusBar {...base} {...(option === true ? {} : option)} />
}

/**
 * The strip at the top of the surface that the system draws over, in the
 * surface's own CSS px - what `env(safe-area-inset-top)` answers on the real
 * device. `DeviceScreen` publishes it to content as `--mockup-safe-area-top`
 * and as `useSurface().safeAreaTop`.
 *
 * The cutout counts even with the bar switched off: an island or a punch hole
 * is hardware, drawn either way, and it eats the same strip of the layout
 * either way. A device with no cutout reserves only what the bar itself
 * occupies, so turning the bar off there gives the content the whole panel.
 */
export function statusBarSafeAreaTop(
  option: StatusBarOption | undefined,
  base: StatusBarPlacement
): number {
  if (!option && !base.cutout) return 0
  return statusBarLayout(base).bandHeight
}
