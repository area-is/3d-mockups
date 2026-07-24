'use client'

import * as React from 'react'
import {
  AFrameSignMockup,
  BillboardMockup,
  BookMockup,
  BrochureMockup,
  BusMockup,
  BusShelterMockup,
  BusinessCardMockup,
  CustomBoxMockup,
  CustomPanelMockup,
  DOOHTotemMockup,
  FlipMockup,
  FoldMockup,
  GreetingCardMockup,
  IDCardMockup,
  IPhoneMockup,
  LaptopMockup,
  MagazineMockup,
  MailerBoxMockup,
  MockupCanvas,
  MonitorMockup,
  PhoneMockup,
  PosterFrameMockup,
  ProductBoxMockup,
  RollupBannerMockup,
  SemiTrailerMockup,
  ShoppingBagMockup,
  StorefrontMockup,
  TVSetMockup,
  TabletMockup,
  VanMockup,
  VinylRecordMockup,
  WatchMockup,
  FLIP_COLORWAYS,
  FOLD_COLORWAYS,
  GALAXY_COLORWAYS,
  IPHONE_COLORWAYS,
  LAPTOP_COLORWAYS,
  MONITOR_COLORWAYS,
  TABLET_COLORWAYS,
  WATCH_COLORWAYS,
  type Colorway,
} from 'area-mockups'

/**
 * Every live preview on this docs site gets zoom + full-screen controls plus a
 * prop-control bar under the canvas: variant, colorway, custom color,
 * orientation, fold/lid angle, float, auto-rotate and free-rotation — wired to
 * the library's real props. Rather than hand-editing the ~130 demo instances,
 * we inject everything here at the single point where a scene is mounted.
 *
 * The bar is docs-only UI; it drives the same public props users pass in code.
 */

/** Find the mockup element the controls will drive (recursing through DOM wrappers). */
function findMockup(node: React.ReactNode): React.ReactElement | null {
  if (!React.isValidElement(node)) return null
  if (typeof node.type === 'string') {
    const el = node as React.ReactElement<{ children?: React.ReactNode }>
    const children = React.Children.toArray(el.props.children)
    for (const child of children) {
      const found = findMockup(child)
      if (found) return found
    }
    return null
  }
  return node
}

/** Inject props into the first mockup component found (recursing through DOM wrappers). */
function injectProps(node: React.ReactNode, props: Record<string, unknown>): React.ReactNode {
  if (!React.isValidElement(node)) return node
  if (typeof node.type === 'string') {
    const el = node as React.ReactElement<{ children?: React.ReactNode }>
    return React.cloneElement(
      el,
      undefined,
      React.Children.map(el.props.children, (child) => injectProps(child, props)),
    )
  }
  return React.cloneElement(node as React.ReactElement<Record<string, unknown>>, props)
}

/**
 * A generic extra control bound to one public prop: color swatches,
 * boolean toggles, enum selects, numeric sliders and free-text inputs.
 * Together with the shared variant/colorway/orientation/angle controls
 * this makes every non-content prop of every mockup drivable from the bar.
 */
interface ExtraControl {
  prop: string
  label: string
  kind: 'color' | 'toggle' | 'select' | 'range' | 'text'
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  step?: number
  /** Starting value when the demo doesn't set the prop itself. */
  fallback?: string | number | boolean
  placeholder?: string
}

interface DeviceControlSpec {
  variants?: { value: string; label: string }[]
  catalogs?: Record<string, Colorway[]>
  catalog?: Colorway[]
  orientation?: boolean
  /** Fold/lid angle: flip + fold (0–180), laptop lid (its own range). */
  openAngle?: { min: number; max: number; fallback: number }
  /** Watch band color picker. */
  band?: boolean
  float?: boolean
  /** Hide the shared body-color picker (objects list their own color extras). */
  bodyColor?: boolean
  extras?: ExtraControl[]
}

const COVERAGE_OPTIONS = [
  { value: 'panel', label: 'panel' },
  { value: 'full', label: 'full wrap' },
]

function specFor(el: React.ReactElement): DeviceControlSpec | null {
  switch (el.type) {
    case PhoneMockup:
      return {
        variants: [
          { value: 's26', label: 'Galaxy S26' },
          { value: 's26ultra', label: 'Galaxy S26 Ultra' },
        ],
        catalogs: GALAXY_COLORWAYS as Record<string, Colorway[]>,
        orientation: true,
        float: true,
      }
    case IPhoneMockup:
      return {
        variants: [
          { value: '17', label: 'iPhone 17' },
          { value: 'air', label: 'iPhone 17 Air' },
          { value: 'pro', label: 'iPhone 17 Pro' },
          { value: 'promax', label: 'iPhone 17 Pro Max' },
        ],
        catalogs: IPHONE_COLORWAYS as Record<string, Colorway[]>,
        orientation: true,
        float: true,
      }
    case TabletMockup:
      return {
        variants: [
          { value: 'ipadpro13', label: 'iPad Pro 13″' },
          { value: 'ipadpro11', label: 'iPad Pro 11″' },
          { value: 'ipadair13', label: 'iPad Air 13″' },
          { value: 'ipadair11', label: 'iPad Air 11″' },
          { value: 'ipad11', label: 'iPad (A16)' },
          { value: 'tabs11', label: 'Galaxy Tab S11' },
          { value: 'tabs11ultra', label: 'Tab S11 Ultra' },
        ],
        catalogs: TABLET_COLORWAYS as Record<string, Colorway[]>,
        orientation: true,
        float: true,
      }
    case LaptopMockup:
      return {
        variants: [
          { value: 'air13', label: 'MacBook Air 13″' },
          { value: 'air15', label: 'MacBook Air 15″' },
          { value: 'pro14', label: 'MacBook Pro 14″' },
          { value: 'pro16', label: 'MacBook Pro 16″' },
        ],
        catalogs: LAPTOP_COLORWAYS as Record<string, Colorway[]>,
        openAngle: { min: 40, max: 130, fallback: 110 },
        float: true,
      }
    case FoldMockup:
      return {
        catalog: FOLD_COLORWAYS.fold7,
        orientation: true,
        openAngle: { min: 0, max: 180, fallback: 180 },
        float: true,
        extras: [
          { prop: 'frameColor', label: 'frame', kind: 'color' },
          { prop: 'punchHole', label: 'punch hole', kind: 'toggle', fallback: true },
        ],
      }
    case FlipMockup:
      return {
        catalog: FLIP_COLORWAYS.flip7,
        orientation: true,
        openAngle: { min: 0, max: 180, fallback: 180 },
        float: true,
        extras: [
          { prop: 'frameColor', label: 'frame', kind: 'color' },
          { prop: 'punchHole', label: 'punch hole', kind: 'toggle', fallback: true },
        ],
      }
    case WatchMockup:
      return {
        variants: [
          { value: 'series11', label: 'Apple Watch S11' },
          { value: 'watch8', label: 'Galaxy Watch 8' },
        ],
        catalogs: WATCH_COLORWAYS as Record<string, Colorway[]>,
        band: true,
        float: true,
      }
    case MonitorMockup:
      return { catalog: MONITOR_COLORWAYS, float: false }
    case BusMockup:
      return {
        float: false,
        extras: [
          { prop: 'coverage', label: 'coverage', kind: 'select', options: COVERAGE_OPTIONS, fallback: 'panel' },
          { prop: 'wrapOverWindows', label: 'over glass', kind: 'toggle', fallback: true },
          { prop: 'surfaceBackground', label: 'surface bg', kind: 'color' },
        ],
      }
    case VanMockup:
      return {
        float: false,
        extras: [
          { prop: 'coverage', label: 'coverage', kind: 'select', options: COVERAGE_OPTIONS, fallback: 'panel' },
          { prop: 'wrapOverWindows', label: 'over glass', kind: 'toggle', fallback: false },
          { prop: 'surfaceBackground', label: 'surface bg', kind: 'color' },
        ],
      }
    case SemiTrailerMockup:
      return {
        float: false,
        extras: [
          { prop: 'skirtColor', label: 'skirt', kind: 'color' },
          { prop: 'surfaceBackground', label: 'surface bg', kind: 'color' },
        ],
      }
    case BusShelterMockup:
      return {
        float: false,
        extras: [
          { prop: 'surfaceBackground', label: 'surface bg', kind: 'color' },
        ],
      }
    case TVSetMockup:
      return {
        float: false,
        extras: [{ prop: 'size', label: 'inches', kind: 'range', min: 32, max: 98, step: 1, fallback: 65 }],
      }
    case StorefrontMockup:
      return { float: false, extras: [{ prop: 'surfaceBackground', label: 'surface bg', kind: 'color' }] }
    case MagazineMockup:
      return {
        float: true,
        extras: [
          { prop: 'glossy', label: 'glossy', kind: 'toggle', fallback: false },
          { prop: 'pageColor', label: 'pages', kind: 'color' },
          { prop: 'backColor', label: 'back', kind: 'color' },
        ],
      }
    case IDCardMockup:
      return {
        float: true,
        extras: [
          { prop: 'lanyardColor', label: 'lanyard', kind: 'color' },
          { prop: 'surfaceBackground', label: 'surface bg', kind: 'color' },
        ],
      }
    case BillboardMockup:
      return { float: false, extras: [{ prop: 'surfaceBackground', label: 'surface bg', kind: 'color' }] }
    case BookMockup:
      return {
        float: true,
        extras: [
          { prop: 'pageColor', label: 'pages', kind: 'color' },
          { prop: 'surfaceBackground', label: 'surface bg', kind: 'color' },
        ],
      }
    case BrochureMockup:
      return {
        float: true,
        extras: [
          { prop: 'foldAngle', label: 'fold', kind: 'range', min: 0, max: 60, step: 1, fallback: 24 },
          { prop: 'color', label: 'paper', kind: 'color' },
        ],
      }
    case BusinessCardMockup:
      return {
        float: true,
        extras: [
          { prop: 'edgeColor', label: 'edge', kind: 'color' },
          { prop: 'surfaceBackground', label: 'surface bg', kind: 'color' },
        ],
      }
    case CustomBoxMockup:
    case ProductBoxMockup:
      return { float: true, extras: [{ prop: 'surfaceBackground', label: 'surface bg', kind: 'color' }] }
    case CustomPanelMockup:
      return {
        float: true,
        extras: [
          { prop: 'cornerRadius', label: 'corner', kind: 'range', min: 0, max: 20, step: 1, fallback: 2 },
          { prop: 'surfaceBackground', label: 'surface bg', kind: 'color' },
        ],
      }
    case DOOHTotemMockup:
      return { float: false }
    case GreetingCardMockup:
      return {
        float: true,
        extras: [
          { prop: 'openAngle', label: 'open', kind: 'range', min: 20, max: 150, step: 1, fallback: 65 },
          { prop: 'surfaceBackground', label: 'surface bg', kind: 'color' },
        ],
      }
    case MailerBoxMockup:
      return {
        float: true,
        extras: [
          { prop: 'tapeColor', label: 'tape', kind: 'color' },
          { prop: 'surfaceBackground', label: 'surface bg', kind: 'color' },
        ],
      }
    case PosterFrameMockup:
      return {
        float: false,
        extras: [
          { prop: 'mat', label: 'mat', kind: 'toggle', fallback: false },
          { prop: 'matColor', label: 'mat color', kind: 'color' },
          { prop: 'glazing', label: 'glazing', kind: 'toggle', fallback: true },
          { prop: 'surfaceBackground', label: 'surface bg', kind: 'color' },
        ],
      }
    case RollupBannerMockup:
      return { float: false, extras: [{ prop: 'surfaceBackground', label: 'surface bg', kind: 'color' }] }
    case ShoppingBagMockup:
      return {
        float: true,
        extras: [
          { prop: 'handleColor', label: 'handles', kind: 'color' },
          { prop: 'surfaceBackground', label: 'surface bg', kind: 'color' },
        ],
      }
    case VinylRecordMockup:
      return {
        float: true,
        extras: [
          { prop: 'vinylColor', label: 'vinyl', kind: 'color' },
          { prop: 'surfaceBackground', label: 'surface bg', kind: 'color' },
        ],
      }
    case AFrameSignMockup:
      return { float: false, extras: [{ prop: 'surfaceBackground', label: 'surface bg', kind: 'color' }] }
    case MockupCanvas:
    default:
      return null
  }
}

const CONTROL_STYLE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '5px 10px',
  borderRadius: 999,
  border: '1px solid rgba(148, 158, 176, 0.35)',
  background: 'rgba(16, 18, 22, 0.55)',
  color: '#aab2c0',
  font: '600 11px/1 var(--font-mono, monospace)',
  letterSpacing: '0.04em',
  cursor: 'pointer',
  backdropFilter: 'blur(6px)',
}

const ACTIVE_STYLE: React.CSSProperties = {
  background: 'rgba(84, 106, 255, 0.28)',
  color: '#dfe5ff',
}

function Toggle({
  label,
  title,
  value,
  onChange,
}: {
  label: React.ReactNode
  title: string
  value: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      aria-pressed={value}
      title={title}
      onClick={() => onChange(!value)}
      style={{ ...CONTROL_STYLE, ...(value ? ACTIVE_STYLE : null) }}
    >
      {label}
    </button>
  )
}

function PreviewControls({ children }: { children: React.ReactNode }) {
  const mockup = React.useMemo(() => findMockup(children), [children])
  const spec = mockup ? specFor(mockup) : null
  const initial = (mockup?.props ?? {}) as {
    variant?: string
    orientation?: string
    openAngle?: number
    open?: boolean
    float?: boolean
    autoRotate?: boolean
    bandColor?: string
  }

  const [freeRotation, setFreeRotation] = React.useState(false)
  const [autoRotate, setAutoRotate] = React.useState(Boolean(initial.autoRotate))
  const [float, setFloat] = React.useState(Boolean(initial.float))
  const [variant, setVariant] = React.useState(initial.variant ?? spec?.variants?.[0]?.value ?? '')
  const [colorwayId, setColorwayId] = React.useState('')
  const [customColor, setCustomColor] = React.useState('')
  const [bandColor, setBandColor] = React.useState('')
  const [orientation, setOrientation] = React.useState(initial.orientation ?? 'portrait')
  const [openAngle, setOpenAngle] = React.useState<number>(
    initial.openAngle ?? (initial.open === false ? 0 : spec?.openAngle?.fallback ?? 180)
  )

  const catalog = spec
    ? spec.catalog ?? (spec.catalogs && variant ? spec.catalogs[variant] : undefined)
    : undefined

  const injected: Record<string, unknown> = { zoom: true, fullscreen: true, freeRotation, autoRotate }
  if (spec) {
    injected.float = float
    if (spec.variants) injected.variant = variant
    if (spec.orientation) injected.orientation = orientation
    if (spec.openAngle) {
      injected.openAngle = openAngle
      injected.open = undefined
    }
    if (bandColor) injected.bandColor = bandColor
  }
  if (colorwayId && catalog?.some((c) => c.id === colorwayId)) {
    // A picked colorway must beat the demo's hardcoded colors.
    injected.colorway = colorwayId
    injected.color = undefined
    injected.frameColor = undefined
  }
  if (customColor) {
    injected.color = customColor
    injected.frameColor = undefined
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        {injectProps(children, injected)}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 6,
          padding: '8px 10px 2px',
        }}
      >
        <Toggle
          label={
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                <path d="M21 3v6h-6" />
              </svg>
              360°
            </>
          }
          title="Free rotation: drag over the top and bottom too"
          value={freeRotation}
          onChange={setFreeRotation}
        />
        <Toggle label="spin" title="Slow auto-orbit" value={autoRotate} onChange={setAutoRotate} />
        {spec?.float !== false && spec && (
          <Toggle label="float" title="Gentle floating idle animation" value={float} onChange={setFloat} />
        )}
        {spec?.variants && (
          <select
            aria-label="Variant"
            value={variant}
            onChange={(event) => {
              const next = event.target.value
              setVariant(next)
              // Keep the picked colorway only if the new variant offers it.
              if (colorwayId && !(spec.catalogs?.[next] ?? []).some((c) => c.id === colorwayId)) {
                setColorwayId('')
              }
            }}
            style={{ ...CONTROL_STYLE, appearance: 'none' }}
          >
            {spec.variants.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        )}
        {catalog && catalog.length > 0 && (
          <select
            aria-label="Colorway"
            value={colorwayId}
            onChange={(event) => {
              setColorwayId(event.target.value)
              if (event.target.value) setCustomColor('')
            }}
            style={{ ...CONTROL_STYLE, appearance: 'none' }}
          >
            <option value="">colorway…</option>
            {catalog.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        )}
        {spec && (
          <label title="Custom body color" style={{ ...CONTROL_STYLE, padding: '3px 8px' }}>
            color
            <input
              type="color"
              aria-label="Custom body color"
              value={customColor || '#8890a0'}
              onChange={(event) => {
                setCustomColor(event.target.value)
                setColorwayId('')
              }}
              style={{ width: 18, height: 18, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
            />
          </label>
        )}
        {spec?.band && (
          <label title="Band color" style={{ ...CONTROL_STYLE, padding: '3px 8px' }}>
            band
            <input
              type="color"
              aria-label="Band color"
              value={bandColor || '#33415c'}
              onChange={(event) => setBandColor(event.target.value)}
              style={{ width: 18, height: 18, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
            />
          </label>
        )}
        {spec?.orientation && (
          <Toggle
            label="landscape"
            title="Rotate the device into landscape"
            value={orientation === 'landscape'}
            onChange={(next) => setOrientation(next ? 'landscape' : 'portrait')}
          />
        )}
        {spec?.openAngle && (
          <label title="Degree of openness" style={{ ...CONTROL_STYLE, gap: 8, cursor: 'default' }}>
            angle
            <input
              type="range"
              aria-label="Open angle"
              min={spec.openAngle.min}
              max={spec.openAngle.max}
              value={openAngle}
              onChange={(event) => setOpenAngle(Number(event.target.value))}
              style={{ width: 90, accentColor: '#546aff', cursor: 'pointer' }}
            />
            {openAngle}°
          </label>
        )}
      </div>
    </div>
  )
}

/** Wrap a demo scene with the shared docs preview controls. */
export function withPreviewControls(node: React.ReactNode): React.ReactNode {
  return <PreviewControls>{node}</PreviewControls>
}
