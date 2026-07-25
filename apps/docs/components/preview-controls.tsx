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
import { LazyScene } from './lazy-scene'

/**
 * Every live preview on this docs site is a playground: the mockup gets zoom +
 * full-screen overlays, and a prop bar under the canvas exposes *every* public
 * prop of the mockup it wraps — the model's own props, the shared screen props,
 * and the stage props from `MockupCanvas` — wired to the real props a caller
 * would pass in code. Rather than hand-editing the ~130 demo instances, we
 * inject everything here at the single point where a scene is mounted.
 *
 * Only plumbing stays out of the bar: `children` (that's the demo's content),
 * `camera` / `shadowY` (computed per model from its core framing),
 * `surfaceStyle` / `className` / `style` (free-form CSS) and the group
 * transforms (`position` / `rotation` / `scale`).
 *
 * A control is *unset* until touched, so each demo starts exactly as authored
 * and untouched props keep the library's own defaults; the input still shows
 * the value in force (the demo's, or the documented default).
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

/** One control bound to one public prop: swatch, toggle, select, slider or a mm size. */
interface Control {
  prop: string
  label: string
  kind: 'color' | 'toggle' | 'select' | 'range' | 'size'
  /** Tooltip; falls back to the prop name. */
  title?: string
  options?: { value: string; label: string }[]
  /** Turn a select's string value into the prop's real value. */
  parse?: (value: string) => unknown
  /** Values a toggle switches between, for enum props like `orientation`. */
  on?: string
  off?: string
  min?: number
  max?: number
  step?: number
  /** Millimeter size object: its sub-fields, with the spec's own defaults. */
  dims?: { key: string; preset: number }[]
  /** The value in force before anything sets this prop (the library default). */
  preset?: string | number | boolean
}

const COVERAGE: Control = {
  prop: 'coverage',
  label: 'coverage',
  kind: 'select',
  options: [
    { value: 'panel', label: 'panel' },
    { value: 'full', label: 'full wrap' },
  ],
  preset: 'panel',
}

const WRAP_OVER_WINDOWS = (preset: boolean): Control => ({
  prop: 'wrapOverWindows',
  label: 'over glass',
  kind: 'toggle',
  preset,
  title: 'Carry the wrap across the glazing',
})

const ORIENTATION: Control = {
  prop: 'orientation',
  label: 'landscape',
  kind: 'toggle',
  on: 'landscape',
  off: 'portrait',
  preset: 'portrait',
  title: 'Rotate the device into landscape',
}

const OPEN: Control = {
  prop: 'open',
  label: 'open',
  kind: 'toggle',
  preset: true,
  title: 'Flat open (off folds it shut) — the shorthand for openAngle 180 / 0',
}

const openAngle = (min: number, max: number, preset: number): Control => ({
  prop: 'openAngle',
  label: 'angle',
  kind: 'range',
  min,
  max,
  step: 1,
  preset,
  title: 'Degree of openness',
})

/** A color prop. The `color` prop gets a per-model label ('paper', 'aluminum'…). */
const swatch = (prop: string, label: string): Control => ({ prop, label, kind: 'color' })
const toggle = (prop: string, label: string, preset: boolean, title?: string): Control => ({
  prop,
  label,
  kind: 'toggle',
  preset,
  title,
})

/**
 * A millimeter size prop. The presets mirror the defaults in the object's core
 * spec builder, so an untouched field reads the size actually on screen.
 */
const size = (label: string, dims: [string, number][]): Control => ({
  prop: 'size',
  label,
  kind: 'size',
  min: 10,
  max: 4000,
  dims: dims.map(([key, preset]) => ({ key, preset })),
})

interface ModelControls {
  variants?: { value: string; label: string }[]
  /** Retail colorways, per variant or one flat catalog. */
  catalogs?: Record<string, Colorway[]>
  catalog?: Colorway[]
  /** `false` for the one model without a `color` prop (the magazine). */
  color?: false
  controls?: Control[]
}

/** Every mockup's own props, keyed by component. */
const MODELS = new Map<unknown, ModelControls>([
  [
    PhoneMockup,
    {
      variants: [
        { value: 's26', label: 'Galaxy S26' },
        { value: 's26ultra', label: 'Galaxy S26 Ultra' },
      ],
      catalogs: GALAXY_COLORWAYS as Record<string, Colorway[]>,
      controls: [swatch('frameColor', 'frame'), ORIENTATION, toggle('punchHole', 'punch hole', true)],
    },
  ],
  [
    IPhoneMockup,
    {
      variants: [
        { value: '17', label: 'iPhone 17' },
        { value: 'air', label: 'iPhone 17 Air' },
        { value: 'pro', label: 'iPhone 17 Pro' },
        { value: 'promax', label: 'iPhone 17 Pro Max' },
      ],
      catalogs: IPHONE_COLORWAYS as Record<string, Colorway[]>,
      controls: [swatch('frameColor', 'frame'), ORIENTATION, toggle('dynamicIsland', 'dynamic island', true)],
    },
  ],
  [
    TabletMockup,
    {
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
      controls: [ORIENTATION],
    },
  ],
  [
    LaptopMockup,
    {
      variants: [
        { value: 'air13', label: 'MacBook Air 13″' },
        { value: 'air15', label: 'MacBook Air 15″' },
        { value: 'pro14', label: 'MacBook Pro 14″' },
        { value: 'pro16', label: 'MacBook Pro 16″' },
      ],
      catalogs: LAPTOP_COLORWAYS as Record<string, Colorway[]>,
      controls: [openAngle(40, 130, 110), toggle('notch', 'notch', true)],
    },
  ],
  [MonitorMockup, { catalog: MONITOR_COLORWAYS }],
  [
    FoldMockup,
    {
      catalog: FOLD_COLORWAYS.fold7,
      controls: [
        swatch('frameColor', 'frame'),
        ORIENTATION,
        OPEN,
        openAngle(0, 180, 180),
        toggle('punchHole', 'punch hole', true),
      ],
    },
  ],
  [
    FlipMockup,
    {
      catalog: FLIP_COLORWAYS.flip7,
      controls: [
        swatch('frameColor', 'frame'),
        ORIENTATION,
        OPEN,
        openAngle(0, 180, 180),
        toggle('punchHole', 'punch hole', true),
      ],
    },
  ],
  [
    WatchMockup,
    {
      variants: [
        { value: 'series11', label: 'Apple Watch S11' },
        { value: 'watch8', label: 'Galaxy Watch 8' },
      ],
      catalogs: WATCH_COLORWAYS as Record<string, Colorway[]>,
      controls: [swatch('bandColor', 'band'), toggle('bandOpen', 'unbuckled', false)],
    },
  ],
  [AFrameSignMockup, {}],
  [BillboardMockup, {}],
  [
    BookMockup,
    {
      controls: [
        size('trim mm', [['width', 156], ['height', 234], ['thickness', 27]]),
        swatch('pageColor', 'pages'),
      ],
    },
  ],
  [
    BrochureMockup,
    {
      color: false,
      controls: [
        size('panel mm', [['width', 93.1], ['height', 215.9]]),
        { prop: 'foldAngle', label: 'fold', kind: 'range', min: 0, max: 60, step: 1, preset: 24 },
        swatch('color', 'paper'),
      ],
    },
  ],
  [BusMockup, { controls: [COVERAGE, WRAP_OVER_WINDOWS(true)] }],
  [BusShelterMockup, {}],
  [BusinessCardMockup, { controls: [swatch('edgeColor', 'edge')] }],
  [CustomBoxMockup, { controls: [size('box mm', [['width', 180], ['height', 120], ['depth', 60]])] }],
  [
    CustomPanelMockup,
    {
      controls: [
        size('panel mm', [['width', 300], ['height', 200], ['thickness', 5]]),
        { prop: 'cornerRadius', label: 'corner', kind: 'range', min: 0, max: 20, step: 1, preset: 2 },
      ],
    },
  ],
  [DOOHTotemMockup, { controls: [size('cabinet mm', [['width', 1300], ['height', 2800]])] }],
  [GreetingCardMockup, { controls: [openAngle(20, 150, 65)] }],
  [IDCardMockup, { controls: [swatch('lanyardColor', 'lanyard')] }],
  [
    MagazineMockup,
    {
      color: false,
      controls: [
        size('trim mm', [['width', 216], ['height', 279], ['thickness', 6]]),
        swatch('pageColor', 'pages'),
        swatch('backColor', 'back'),
        toggle('glossy', 'glossy', false),
      ],
    },
  ],
  [
    MailerBoxMockup,
    {
      controls: [size('box mm', [['width', 350], ['height', 120], ['depth', 250]]), swatch('tapeColor', 'tape')],
    },
  ],
  [
    PosterFrameMockup,
    {
      controls: [
        size('sheet mm', [['width', 457], ['height', 610]]),
        toggle('mat', 'mat', false),
        swatch('matColor', 'mat color'),
        toggle('glazing', 'glazing', true),
      ],
    },
  ],
  [ProductBoxMockup, { controls: [size('box mm', [['width', 190], ['height', 265], ['depth', 55]])] }],
  [RollupBannerMockup, { controls: [size('graphic mm', [['width', 850], ['height', 2000]])] }],
  [SemiTrailerMockup, { controls: [swatch('skirtColor', 'skirt')] }],
  [
    ShoppingBagMockup,
    {
      controls: [
        size('bag mm', [['width', 320], ['height', 420], ['depth', 140]]),
        swatch('handleColor', 'handles'),
      ],
    },
  ],
  [StorefrontMockup, {}],
  [
    TVSetMockup,
    {
      controls: [{ prop: 'size', label: 'inches', kind: 'range', min: 32, max: 98, step: 1, preset: 65 }],
    },
  ],
  [VanMockup, { controls: [COVERAGE, WRAP_OVER_WINDOWS(false)] }],
  [VinylRecordMockup, { controls: [swatch('vinylColor', 'vinyl')] }],
])

/** The screen props every device and object shares (see /docs/screen-content). */
const SCREEN_CONTROLS: Control[] = [
  {
    prop: 'resolution',
    label: 'res',
    kind: 'range',
    min: 240,
    max: 2560,
    step: 8,
    title: 'CSS pixel width of the virtual display (unset = the model’s own default)',
  },
  toggle('interactive', 'interactive', true, 'Let clicks, scrolling and typing reach the content'),
  toggle('dragToRotate', 'drag→rotate', true, 'Hand drags off the screen to the orbit controls'),
  {
    prop: 'occlude',
    label: 'occlude',
    kind: 'select',
    preset: 'true',
    title: 'Hide content when the surface faces away',
    options: [
      { value: 'true', label: 'raycast' },
      { value: 'blending', label: 'blending' },
      { value: 'false', label: 'off' },
    ],
    parse: (value) => (value === 'blending' ? 'blending' : value === 'false' ? false : true),
  },
  { prop: 'surfaceBackground', label: 'surface bg', kind: 'color', preset: '#000000' },
]

/** The two rotation toggles the compact gallery bar keeps alongside the model's. */
const FREE_ROTATION = toggle('freeRotation', '360°', false, 'Free rotation: drag over the top and bottom too')
const AUTO_ROTATE = toggle('autoRotate', 'spin', false, 'Slow auto-orbit')

/** The stage props from `MockupCanvas`, valid on every mockup. */
const STAGE_CONTROLS: Control[] = [
  toggle('controls', 'controls', true, 'Drag-to-rotate orbit controls'),
  FREE_ROTATION,
  AUTO_ROTATE,
  { prop: 'autoRotateSpeed', label: 'spin speed', kind: 'range', min: 0.2, max: 6, step: 0.2, preset: 1 },
  toggle('zoom', 'zoom', false, 'Pinch / wheel zoom plus overlay +/− buttons'),
  toggle('fullscreen', 'fullscreen', false, 'Overlay button that fills the screen'),
  toggle('shadows', 'shadow', true, 'Soft contact shadow under the model'),
  toggle('environment', 'studio env', true, 'Procedural studio lighting and reflections'),
  { prop: 'background', label: 'canvas bg', kind: 'color', title: 'CSS background of the canvas (unset = transparent)' },
  { prop: 'dpr', label: 'dpr', kind: 'range', min: 1, max: 3, step: 0.5, preset: 2 },
]

/** `float` belongs to the mockup wrapper, not to a bare `MockupCanvas`. */
const FLOAT = toggle('float', 'float', false, 'Gentle floating idle animation')

/**
 * Two tones, because the bar lives in two places: `page` sits on the docs page
 * under the canvas (so it follows the light/dark theme), `overlay` floats on a
 * gallery card's dark canvas.
 */
type Tone = 'page' | 'overlay'
const ToneContext = React.createContext<Tone>('page')

const BASE_STYLE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '5px 10px',
  borderRadius: 999,
  font: '600 11px/1 var(--font-mono, monospace)',
  letterSpacing: '0.04em',
  cursor: 'pointer',
}

const TONES: Record<Tone, { pill: React.CSSProperties; active: React.CSSProperties; label: string }> = {
  page: {
    pill: {
      border: '1px solid color-mix(in oklab, var(--color-fd-foreground) 16%, transparent)',
      background: 'color-mix(in oklab, var(--color-fd-foreground) 5%, transparent)',
      color: 'var(--color-fd-muted-foreground)',
    },
    active: {
      border: '1px solid color-mix(in oklab, #546aff 50%, transparent)',
      background: 'color-mix(in oklab, #546aff 16%, transparent)',
      color: 'var(--color-fd-foreground)',
    },
    label: 'color-mix(in oklab, var(--color-fd-muted-foreground) 80%, transparent)',
  },
  overlay: {
    pill: {
      border: '1px solid rgba(148, 158, 176, 0.35)',
      background: 'rgba(16, 18, 22, 0.55)',
      color: '#aab2c0',
      backdropFilter: 'blur(6px)',
    },
    active: {
      border: '1px solid rgba(148, 158, 176, 0.35)',
      background: 'rgba(84, 106, 255, 0.28)',
      color: '#dfe5ff',
    },
    label: 'rgba(148, 158, 176, 0.7)',
  },
}

function usePill() {
  const tone = TONES[React.useContext(ToneContext)]
  return {
    pill: { ...BASE_STYLE, ...tone.pill },
    active: { ...BASE_STYLE, ...tone.active },
    label: tone.label,
  }
}

const NUMBER_STYLE: React.CSSProperties = {
  width: 46,
  padding: '1px 3px',
  borderRadius: 4,
  border: '1px solid currentColor',
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
}

const SPIN_ICON = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 3v6h-6" />
  </svg>
)

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
  const { pill, active } = usePill()
  return (
    <button
      type="button"
      aria-pressed={value}
      title={title}
      onClick={() => onChange(!value)}
      style={value ? active : pill}
    >
      {label}
    </button>
  )
}

/** One control, rendered from the value in force (set value → demo prop → default). */
function ControlInput({
  control,
  value,
  authored,
  onChange,
  onClear,
}: {
  control: Control
  value: unknown
  authored: unknown
  onChange: (next: unknown) => void
  onClear: () => void
}) {
  const { prop, label, kind, title = prop } = control
  const shown = value !== undefined ? value : authored !== undefined ? authored : control.preset
  const set = value !== undefined
  const { pill } = usePill()

  if (kind === 'toggle') {
    const on = control.on
    return (
      <Toggle
        label={prop === 'freeRotation' ? <>{SPIN_ICON}360°</> : label}
        title={title}
        value={on !== undefined ? shown === on : Boolean(shown)}
        onChange={(next) => onChange(on !== undefined ? (next ? on : control.off) : next)}
      />
    )
  }

  if (kind === 'select') {
    return (
      <select
        aria-label={title}
        title={title}
        value={String(shown ?? '')}
        onChange={(event) => onChange(control.parse ? control.parse(event.target.value) : event.target.value)}
        style={{ ...pill, appearance: 'none' }}
      >
        {control.options!.map(({ value: optionValue, label: optionLabel }) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    )
  }

  if (kind === 'range') {
    const numeric = typeof shown === 'number' ? shown : undefined
    return (
      <label title={title} style={{ ...pill, gap: 8, cursor: 'default' }}>
        {label}
        <input
          type="range"
          aria-label={title}
          min={control.min}
          max={control.max}
          step={control.step}
          value={numeric ?? (control.min! + control.max!) / 2}
          onChange={(event) => onChange(Number(event.target.value))}
          style={{ width: 78, accentColor: '#546aff', cursor: 'pointer' }}
        />
        {numeric ?? 'auto'}
        {set && <ClearButton onClear={onClear} />}
      </label>
    )
  }

  if (kind === 'size') {
    const authoredSize = (authored ?? {}) as Record<string, number | undefined>
    const setSize = (value ?? {}) as Record<string, number | undefined>
    return (
      <label title={title} style={{ ...pill, gap: 6, cursor: 'default' }}>
        {label}
        {control.dims!.map((dim) => (
          <input
            key={dim.key}
            type="number"
            aria-label={`${label} ${dim.key}`}
            min={control.min}
            max={control.max}
            value={setSize[dim.key] ?? authoredSize[dim.key] ?? dim.preset}
            onChange={(event) =>
              onChange({
                ...Object.fromEntries(
                  control.dims!.map((d) => [d.key, setSize[d.key] ?? authoredSize[d.key] ?? d.preset]),
                ),
                [dim.key]: Number(event.target.value),
              })
            }
            style={NUMBER_STYLE}
          />
        ))}
        {set && <ClearButton onClear={onClear} />}
      </label>
    )
  }

  // color
  return (
    <label title={title} style={{ ...pill, padding: '3px 8px' }}>
      {label}
      <input
        type="color"
        aria-label={title}
        value={typeof shown === 'string' ? shown : '#8890a0'}
        onChange={(event) => onChange(event.target.value)}
        style={{ width: 18, height: 18, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
      />
      {set && <ClearButton onClear={onClear} />}
    </label>
  )
}

/** Drops a prop back to the value the demo (or the library) had for it. */
function ClearButton({ onClear }: { onClear: () => void }) {
  return (
    <button
      type="button"
      title="Reset this prop"
      onClick={onClear}
      style={{
        all: 'unset',
        cursor: 'pointer',
        padding: '0 2px',
        lineHeight: 1,
        color: 'inherit',
        opacity: 0.6,
      }}
    >
      ×
    </button>
  )
}

/**
 * Wire a demo scene's mockup to a full set of prop controls. Returns the scene
 * with the set props injected, plus the control rows to render around it.
 */
function useMockupControls(children: React.ReactNode) {
  const mockup = React.useMemo(() => findMockup(children), [children])
  const isCanvas = mockup?.type === MockupCanvas
  const model = mockup && !isCanvas ? MODELS.get(mockup.type) ?? {} : null
  const authored = (mockup?.props ?? {}) as Record<string, unknown>

  // Zoom and full-screen start on in the docs so every preview has its overlay
  // buttons; they are ordinary toggles a reader can turn back off.
  const [values, setValues] = React.useState<Record<string, unknown>>(() => ({
    zoom: authored.zoom ?? true,
    fullscreen: authored.fullscreen ?? true,
  }))
  const variant = (values.variant ?? authored.variant ?? model?.variants?.[0]?.value) as string | undefined
  const catalog = model?.catalog ?? (model?.catalogs && variant ? model.catalogs[variant] : undefined)

  const rows: { label: string; controls: Control[] }[] = []
  if (model) {
    const own: Control[] = []
    if (model.variants) {
      own.push({
        prop: 'variant',
        label: 'variant',
        kind: 'select',
        options: model.variants,
        preset: variant,
      })
    }
    if (catalog?.length) {
      own.push({
        prop: 'colorway',
        label: 'colorway',
        kind: 'select',
        title: 'Retail colorway (presets the colors)',
        options: [{ value: '', label: 'colorway…' }, ...catalog.map((c) => ({ value: c.id, label: c.name }))],
      })
    }
    if (model.color !== false) own.push(swatch('color', 'color'))
    own.push(...(model.controls ?? []), FLOAT)
    rows.push({ label: 'model', controls: own })
    rows.push({ label: 'screen', controls: SCREEN_CONTROLS })
  }
  rows.push({ label: 'stage', controls: STAGE_CONTROLS })

  /**
   * Set one prop. A few props supersede each other in the library, so the bar
   * keeps them consistent: a retail colorway drops explicit colors, and
   * `openAngle` and the `open` shorthand each clear the other.
   */
  const change = (prop: string, next: unknown) =>
    setValues((prev) => {
      if (prop === 'variant') {
        const kept = model?.catalogs?.[next as string]?.some((c) => c.id === prev.colorway)
        return { ...prev, variant: next, colorway: kept ? prev.colorway : undefined }
      }
      if (prop === 'colorway') {
        return { ...prev, colorway: next || undefined, color: undefined, frameColor: undefined }
      }
      if (prop === 'openAngle') return { ...prev, openAngle: next, open: undefined }
      if (prop === 'open') return { ...prev, open: next, openAngle: undefined }
      return { ...prev, [prop]: next }
    })

  const clear = (prop: string) =>
    setValues((prev) => {
      const next = { ...prev }
      delete next[prop]
      return next
    })

  return {
    scene: injectProps(children, values),
    rows,
    values,
    authored,
    change,
    clear,
  }
}

function ControlRow({
  label,
  controls,
  values,
  authored,
  change,
  clear,
  showLabel,
}: {
  label: string
  controls: Control[]
  values: Record<string, unknown>
  authored: Record<string, unknown>
  change: (prop: string, next: unknown) => void
  clear: (prop: string) => void
  showLabel: boolean
}) {
  const { label: labelColor } = usePill()
  return (
    // label in its own column so a wrapped second line stays aligned with the first
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      {showLabel && (
        <span
          style={{
            font: '600 10px/1.9 var(--font-mono, monospace)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: labelColor,
            width: 44,
            flexShrink: 0,
          }}
        >
          {label}
        </span>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, minWidth: 0 }}>
        {controls.map((control) => (
          <ControlInput
            key={`${label}-${control.prop}-${control.label}`}
            control={control}
            value={values[control.prop]}
            authored={authored[control.prop]}
            onChange={(next) => change(control.prop, next)}
            onClear={() => clear(control.prop)}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * A docs-page demo: the scene in its fixed-height frame, with the full prop bar
 * underneath it (outside the frame, so the canvas keeps its height however many
 * rows of controls the model needs).
 */
export function PreviewStage({
  children,
  height,
  checker = false,
}: {
  children: React.ReactNode
  height: number
  checker?: boolean
}) {
  const { scene, rows, values, authored, change, clear } = useMockupControls(children)
  return (
    <>
      <div className={`object-demo${checker ? ' object-demo--checker' : ''}`} style={{ height }}>
        <LazyScene>{scene}</LazyScene>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '-0.75rem 0 1.5rem' }}>
        {rows.map((row) => (
          <ControlRow
            key={row.label}
            {...row}
            values={values}
            authored={authored}
            change={change}
            clear={clear}
            showLabel
          />
        ))}
      </div>
    </>
  )
}

/**
 * The gallery-card flavor: the bar sits inside the card's own viewport, so it
 * carries the model's own props plus the two rotation toggles and nothing else.
 */
export function withPreviewControls(node: React.ReactNode): React.ReactNode {
  return <CompactControls>{node}</CompactControls>
}

function CompactControls({ children }: { children: React.ReactNode }) {
  const { scene, rows, values, authored, change, clear } = useMockupControls(children)
  const own = rows.find((row) => row.label === 'model')?.controls ?? []
  const controls = [...own, FREE_ROTATION, AUTO_ROTATE]
  return (
    <ToneContext.Provider value="overlay">
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
        <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>{scene}</div>
        <div style={{ padding: '8px 10px 2px' }}>
          <ControlRow
            label="model"
            controls={controls}
            values={values}
            authored={authored}
            change={change}
            clear={clear}
            showLabel={false}
          />
        </div>
      </div>
    </ToneContext.Provider>
  )
}
