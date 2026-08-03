'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { LiveCounter } from '../screens/live-counter'
import { SurfaceArt } from '../screens/surface-art'
import { SCREEN_SOURCES } from '@/lib/demo-sources.generated'
import { COMPONENT_PROPS, SHARED_PROPS, type PropDoc } from '@/lib/prop-tables.generated'
import { EXPLORERS, type ExplorerSpec } from './registry'

/**
 * The prop explorer from the design handoff: a live mockup, an inspector that
 * drives its real props, and a code panel that rewrites itself to exactly what
 * is being passed.
 *
 * Everything structural is read off the library rather than restated here -
 * regions come from `Mockup.regions`, surface sizes from `Mockup.info()` - so
 * a mockup that grows a surface picks it up with no edit. The design's own
 * prop list was written against an older API (`colorway`, `allowInput`,
 * `punchHole`, `environment`); this drives the props the components actually
 * take today. Zoom and fullscreen are inspector switches rather than header
 * controls, because turning them on makes `MockupCanvas` render its own
 * overlay - duplicating it in the header would give two sets of buttons.
 */

export interface MockupExplorerProps {
  /** Component name, e.g. `"GalaxyMockup"`. */
  component: string
  /** Lock the explorer to one variant (used by the per-variant pages). */
  variant?: string
  /** Stage height in px. */
  stageHeight?: number
}

interface PropState {
  variant: string
  color: string
  frameColor: string
  orientation: 'portrait' | 'landscape'
  open: boolean
  coverage: 'panel' | 'full' | 'perforated'
  float: boolean
  surfaceBackground: string
  resolution: number
  controls: boolean
  autoRotate: boolean
  autoRotateSpeed: number
  zoom: boolean
  fullscreen: boolean
  shadows: boolean
  background: string
}

/**
 * What the components do with no props at all. The code panel diffs against
 * this, so anything the explorer switches on for you still shows up in the
 * snippet you copy.
 */
const libraryDefaults = (spec: ExplorerSpec, lockedVariant?: string): PropState => ({
  variant: lockedVariant ?? spec.variants?.[0]?.id ?? '',
  color: '',
  frameColor: '',
  orientation: 'portrait',
  open: true,
  coverage: 'panel',
  float: false,
  surfaceBackground: '',
  resolution: 0,
  controls: true,
  autoRotate: false,
  autoRotateSpeed: 1,
  zoom: false,
  fullscreen: false,
  shadows: true,
  background: '',
})

/**
 * Where the explorer starts. Zoom is on so the stage is immediately
 * scroll/pinch-zoomable and MockupCanvas draws its zoom overlay - the
 * "modified" count and the reset action measure against this, so an untouched
 * explorer still reads as unmodified.
 */
const initialState = (spec: ExplorerSpec, lockedVariant?: string): PropState => ({
  ...libraryDefaults(spec, lockedVariant),
  zoom: true,
})

/**
 * Everything a component accepts, from the API docs' own tables, minus the
 * props the inspector already gives a control for. Listing the remainder
 * read-only is what makes the panel a complete answer to "what can I pass?"
 * rather than only "what can I click?".
 */
function codeOnlyProps(spec: ExplorerSpec, driven: Set<string>): PropDoc[] {
  const rows = [...(COMPONENT_PROPS[spec.name] ?? []), ...SHARED_PROPS]
  const seen = new Set<string>()
  return rows.filter((row) => {
    if (driven.has(row.name) || seen.has(row.name)) return false
    seen.add(row.name)
    return true
  })
}

/** How long the finish-change spin takes, and the turntable speed that fits. */
const SPIN_MS = 900
const SPIN_SPEED = 60 / (SPIN_MS / 1000)

/**
 * Below this the explorer stacks (see the matching breakpoint in docs.css) and
 * the inspector no longer sits beside the stage but under it - so it starts
 * collapsed, or the reader lands on a wall of controls with the mockup they
 * came for pushed off the screen.
 */
const STACK_BREAKPOINT = 860

/** The stage's own box, for anything that has to be sized against it. */
function useStageSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const box = entry?.contentRect
      if (box) setSize({ width: box.width, height: box.height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return size
}

const REGION_LABEL = (name: string) => name.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
/** `coverInner` -> `cover-inner.tsx`, the name the tab carries. */
const REGION_FILE = (name: string) => `${name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}.tsx`
/** `top` -> `Top`, the slot component on the mockup. */
const SLOT_NAME = (name: string) => name.charAt(0).toUpperCase() + name.slice(1)

/**
 * The source behind one surface: the component that fills it, headed by the
 * slot it is mounted through and the size that slot gives it. Every surface of
 * an object shares one component, so the header is what distinguishes the
 * panel you are looking at.
 */
function surfaceSource(
  spec: ExplorerSpec,
  region: string,
  screen: string,
  px?: { width: number; height: number }
): Line[] {
  const size = px ? ` - ${px.width} x ${px.height} px` : ''
  const header = [
    { text: `// <${spec.name}.${SLOT_NAME(region)}>${size}` },
    { text: `//   <${screen} label="${REGION_LABEL(region)}" />` },
    { text: '' },
  ]
  const body = (SCREEN_SOURCES[screen] ?? '').split('\n').map((text) => ({ text }))
  return [...header, ...body]
}

/* ------------------------------------------------------------------ */
/*  Controls                                                           */
/* ------------------------------------------------------------------ */

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <div className="mx-row">
      <span className="mx-prop">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className="mx-switch"
        data-on={checked}
        onClick={() => onChange(!checked)}
      >
        <span className="mx-switch-knob" />
      </button>
    </div>
  )
}

function ColorRow({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string
  value: string
  fallback: string
  onChange: (v: string) => void
}) {
  return (
    <div className="mx-row">
      <span className="mx-prop">{label}</span>
      <span className="mx-row-controls">
        <span className="mx-hex">{value || fallback}</span>
        <input
          type="color"
          aria-label={label}
          className="mx-color"
          value={value || fallback}
          onChange={(e) => onChange(e.target.value)}
        />
        {value ? (
          <button type="button" className="mx-clear" aria-label={`Reset ${label}`} onClick={() => onChange('')}>
            <ResetGlyph />
          </button>
        ) : null}
      </span>
    </div>
  )
}

function ResetGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M3 3v6h6" />
      <path d="M3.6 15.2A9 9 0 1 0 5.9 5.7L3 9" />
    </svg>
  )
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: readonly T[]
  onChange: (v: T) => void
}) {
  return (
    <div className="mx-row">
      <span className="mx-prop">{label}</span>
      <span className="mx-segmented">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            data-on={option === value}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Code generation                                                    */
/* ------------------------------------------------------------------ */

interface Line {
  text: string
  set?: boolean
}

/** The snippet for the current props - only what differs from the defaults. */
function buildSource(spec: ExplorerSpec, p: PropState, stageHeight: number, screen: string): Line[] {
  const base = libraryDefaults(spec)
  const props: string[] = []
  const add = (text: string) => props.push(text)

  if (spec.variants && p.variant !== base.variant) add(`variant="${p.variant}"`)
  if (p.color) add(`color="${p.color}"`)
  if (spec.frameColor && p.frameColor) add(`frameColor="${p.frameColor}"`)
  if (spec.orientation && p.orientation !== 'portrait') add(`orientation="${p.orientation}"`)
  if (spec.openable && !p.open) add('open={false}')
  if (spec.coverage && p.coverage !== 'panel') add(`coverage="${p.coverage}"`)
  if (p.float) add('float')
  if (p.surfaceBackground) add(`surfaceBackground="${p.surfaceBackground}"`)
  if (p.resolution) add(`resolution={${p.resolution}}`)
  if (!p.controls) add('controls={false}')
  if (p.autoRotate) add('autoRotate')
  if (p.autoRotate && p.autoRotateSpeed !== 1) add(`autoRotateSpeed={${p.autoRotateSpeed}}`)
  if (p.zoom) add('zoom')
  if (p.fullscreen) add('fullscreen')
  if (!p.shadows) add('shadows={false}')
  if (p.background) add(`background="${p.background}"`)
  if (spec.fixed?.size) add(`size={${JSON.stringify(spec.fixed.size).replace(/"/g, '')}}`)

  const lines: Line[] = [
    { text: `'use client'` },
    { text: '' },
    { text: `import { ${spec.name} } from 'area-3d-mockups'` },
    { text: `import { ${screen} } from './${screen === 'LiveCounter' ? 'live-counter' : 'surface-art'}'` },
    { text: '' },
    { text: 'export function Demo() {' },
    { text: '  return (' },
    { text: `    <div style={{ height: ${stageHeight} }}>` },
  ]

  if (props.length === 0) {
    lines.push({ text: `      <${spec.name}>` })
  } else if (props.length <= 2) {
    lines.push({ text: `      <${spec.name} ${props.join(' ')}>`, set: true })
  } else {
    lines.push({ text: `      <${spec.name}` })
    for (const prop of props) lines.push({ text: `        ${prop}`, set: true })
    lines.push({ text: '      >' })
  }

  lines.push({ text: `        <${screen} />` })
  lines.push({ text: `      </${spec.name}>` })
  lines.push({ text: '    </div>' })
  lines.push({ text: '  )' })
  lines.push({ text: '}' })
  return lines
}

/** Light syntax colouring: tags, attributes, strings and braces. */
function Code({ text }: { text: string }) {
  const tokens = text.split(/(<\/?[A-Za-z][\w.]*|"[^"]*"|\{[^}]*\}|\b(?:import|from|export|function|return|const)\b|[a-zA-Z]+(?==))/g)
  return (
    <>
      {tokens.map((token, i) => {
        if (!token) return null
        let cls = ''
        if (/^<\/?[A-Z]/.test(token)) cls = 'tok-component'
        else if (/^<\/?[a-z]/.test(token)) cls = 'tok-tag'
        else if (/^"/.test(token)) cls = 'tok-string'
        else if (/^\{/.test(token)) cls = 'tok-brace'
        else if (/^(import|from|export|function|return|const)$/.test(token)) cls = 'tok-keyword'
        else if (/^[a-zA-Z]+$/.test(token) && text.includes(`${token}=`)) cls = 'tok-attr'
        return (
          <span key={i} className={cls || undefined}>
            {token}
          </span>
        )
      })}
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  The explorer                                                       */
/* ------------------------------------------------------------------ */

export function MockupExplorer({ component, variant, stageHeight = 460 }: MockupExplorerProps) {
  const spec = EXPLORERS[component]
  const [p, setP] = useState<PropState>(() => initialState(spec, variant))
  // Open on a wide screen, collapsed once the layout stacks. Resolved after
  // mount so the server and the first client render agree.
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const stageRef = useRef<HTMLDivElement>(null)
  const stageSize = useStageSize(stageRef)
  /*
   * A colour change spins the object once so the finish reads from every
   * side. `autoRotate` is the library's own turntable - one revolution per
   * minute at speed 1 - so SPIN_SPEED is chosen to complete exactly one turn
   * in SPIN_MS. It is layered over the user's own stage props rather than
   * written into them, so the code panel still prints what you set.
   */
  const [spinning, setSpinning] = useState(false)
  const firstColour = useRef(true)
  const [view, setView] = useState<string>('3d')
  const [copied, setCopied] = useState(false)

  const set = <K extends keyof PropState>(key: K, value: PropState[K]) =>
    setP((prev) => ({ ...prev, [key]: value }))

  useEffect(() => {
    if (firstColour.current) {
      firstColour.current = false
      return
    }
    setSpinning(true)
    const t = setTimeout(() => setSpinning(false), SPIN_MS)
    return () => clearTimeout(t)
  }, [p.color, p.frameColor])

  // Only the initial state follows the breakpoint: once the reader has opened
  // or closed the panel, a rotation should not overrule them.
  useEffect(() => {
    if (window.innerWidth <= STACK_BREAKPOINT) setInspectorOpen(false)
  }, [])

  const base = useMemo(() => initialState(spec, variant), [spec, variant])
  const modified = useMemo(
    () => (Object.keys(base) as (keyof PropState)[]).filter((k) => p[k] !== base[k]).length,
    [p, base]
  )

  if (!spec) return null
  const { Component } = spec

  // Regions and measurements come straight off the component.
  const regions: { name: string; label?: string }[] = Component.regions ?? []
  const infoProps: Record<string, unknown> = {
    ...(spec.variants ? { variant: p.variant } : {}),
    ...(spec.orientation ? { orientation: p.orientation } : {}),
    ...(spec.openable ? { open: p.open } : {}),
    ...(spec.coverage ? { coverage: p.coverage } : {}),
    ...(spec.fixed ?? {}),
  }
  let measured: Record<string, { px?: { width: number; height: number } }> = {}
  try {
    measured = (Component.info?.(infoProps)?.regions ?? {}) as typeof measured
  } catch {
    measured = {}
  }
  const pxOf = (name: string) => {
    const entry = measured[name] as unknown
    const first = Array.isArray(entry) ? entry[0] : entry
    return (first as { px?: { width: number; height: number } } | undefined)?.px
  }

  const driven = new Set<string>([
    'color',
    'float',
    'surfaceBackground',
    'resolution',
    'controls',
    'autoRotate',
    'autoRotateSpeed',
    'zoom',
    'fullscreen',
    'shadows',
    'background',
    'children',
    ...(spec.variants ? ['variant'] : []),
    ...(spec.frameColor ? ['frameColor'] : []),
    ...(spec.orientation ? ['orientation'] : []),
    ...(spec.openable ? ['open'] : []),
    ...(spec.coverage ? ['coverage'] : []),
  ])
  const alsoAccepts = codeOnlyProps(spec, driven)

  const colorways = spec.colorways?.[spec.variants ? p.variant : ''] ?? []
  const screenName = spec.print ? 'SurfaceArt' : 'LiveCounter'
  const content = (label: string) =>
    spec.print ? <SurfaceArt label={label} /> : <LiveCounter />

  // Slots are the capitalized components the mockup carries, one per region.
  const slots = Object.entries(Component).filter(
    ([key, value]) => /^[A-Z]/.test(key) && typeof value === 'function'
  ) as [string, React.ComponentType<{ children?: ReactNode }>][]

  const mockupProps: Record<string, unknown> = {
    ...(spec.variants ? { variant: p.variant } : {}),
    ...(p.color ? { color: p.color } : {}),
    ...(spec.frameColor && p.frameColor ? { frameColor: p.frameColor } : {}),
    ...(spec.orientation ? { orientation: p.orientation } : {}),
    ...(spec.openable ? { open: p.open } : {}),
    ...(spec.coverage ? { coverage: p.coverage } : {}),
    ...(p.surfaceBackground ? { surfaceBackground: p.surfaceBackground } : {}),
    ...(p.resolution ? { resolution: p.resolution } : {}),
    ...(p.background ? { background: p.background } : {}),
    ...(spec.fixed ?? {}),
    float: p.float,
    // TumbleControls - and with it the turntable - only exists while controls
    // are on, so the spin borrows them for its duration.
    controls: p.controls || spinning,
    autoRotate: p.autoRotate || spinning,
    autoRotateSpeed: spinning ? SPIN_SPEED : p.autoRotateSpeed,
    zoom: p.zoom,
    fullscreen: p.fullscreen,
    shadows: p.shadows,
  }

  const flatPx = view === '3d' ? undefined : pxOf(view)
  /*
   * One tab per surface next to demo.tsx, and the same `view` drives both -
   * so picking a panel's source shows that panel on the stage, and picking a
   * panel on the stage opens its source. There is no second piece of state to
   * fall out of step.
   */
  const source =
    view === '3d'
      ? buildSource(spec, p, stageHeight, screenName)
      : surfaceSource(spec, view, screenName, flatPx)

  return (
    <div className="mx" data-inspector={inspectorOpen}>
      <div className="mx-header">
        <span className="mx-views">
          <button type="button" data-on={view === '3d'} onClick={() => setView('3d')}>
            {spec.label}
          </button>
          {regions.map((region) => (
            <span key={region.name} className="mx-view-item">
              <span className="mx-divider" aria-hidden />
              <button type="button" data-on={view === region.name} onClick={() => setView(region.name)}>
                {REGION_LABEL(region.name)}
              </button>
            </span>
          ))}
        </span>
        <button
          type="button"
          className="mx-props-btn"
          data-on={inspectorOpen}
          onClick={() => setInspectorOpen((o) => !o)}
        >
          Props
          {modified > 0 ? <span className="mx-badge">{modified}</span> : null}
        </button>
      </div>

      {/* The row owns the height so the inspector scrolls inside it rather
          than stretching the stage past the device. */}
      <div className="mx-body" style={{ height: stageHeight }}>
        <div className="mx-stage" ref={stageRef} style={{ background: p.background || undefined }}>
          {view === '3d' ? (
            <Component {...mockupProps}>
              {content(regions[0]?.name ?? 'screen')}
              {slots.map(([name, Slot]) => (
                <Slot key={name}>{content(REGION_LABEL(name))}</Slot>
              ))}
            </Component>
          ) : (
            <div className="mx-flat">
              <div className="mx-flat-frame">
                <div
                  className="mx-flat-inner"
                  style={{
                    width: flatPx?.width ?? 320,
                    height: flatPx?.height ?? 200,
                    background: p.surfaceBackground || undefined,
                    /*
                     * Scale the true CSS-pixel surface down to fit the stage,
                     * measured rather than assumed: the stage is a different
                     * box with the inspector open, closed, or stacked under it
                     * on a phone, and guessing at those widths left the
                     * surface overflowing its own frame on small screens. The
                     * insets leave room for the dashed frame and the readout.
                     */
                    transform: `scale(${Math.min(
                      ((stageSize.height || stageHeight) - 100) / (flatPx?.height ?? 200),
                      ((stageSize.width || 640) - 60) / (flatPx?.width ?? 320),
                      1
                    )})`,
                  }}
                >
                  {content(REGION_LABEL(view))}
                </div>
              </div>
              <span className="mx-readout">
                {flatPx?.width ?? '?'}
                <span>×</span>
                {flatPx?.height ?? '?'}
                <span>px</span>
              </span>
            </div>
          )}
        </div>

        {inspectorOpen ? (
          <aside className="mx-inspector">
            <div className="mx-inspector-head">
              <span>Props</span>
              <button
                type="button"
                className="mx-reset"
                style={{ visibility: modified ? 'visible' : 'hidden' }}
                onClick={() => setP(initialState(spec, variant))}
              >
                reset {modified} <ResetGlyph />
              </button>
            </div>

            <p className="mx-group">Device</p>
            {spec.variants && !variant ? (
              <div className="mx-row">
                <span className="mx-prop">variant</span>
                <select
                  className="mx-select"
                  aria-label="variant"
                  value={p.variant}
                  onChange={(e) => setP((prev) => ({ ...prev, variant: e.target.value, color: '', frameColor: '' }))}
                >
                  {spec.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {colorways.length ? (
              <div className="mx-swatches">
                {colorways.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="mx-swatch"
                    title={c.name}
                    aria-label={c.name}
                    data-on={p.color === c.color}
                    style={{ background: c.color }}
                    onClick={() =>
                      setP((prev) => ({
                        ...prev,
                        color: c.color,
                        frameColor: c.frameColor ?? prev.frameColor,
                      }))
                    }
                  />
                ))}
              </div>
            ) : null}

            <ColorRow label="color" value={p.color} fallback="#101216" onChange={(v) => set('color', v)} />
            {spec.frameColor ? (
              <ColorRow
                label="frameColor"
                value={p.frameColor}
                fallback="#4a4f59"
                onChange={(v) => set('frameColor', v)}
              />
            ) : null}
            {spec.orientation ? (
              <Segmented
                label="orientation"
                value={p.orientation}
                options={['portrait', 'landscape'] as const}
                onChange={(v) => set('orientation', v)}
              />
            ) : null}
            {spec.coverage ? (
              <Segmented
                label="coverage"
                value={p.coverage}
                options={['panel', 'full', 'perforated'] as const}
                onChange={(v) => set('coverage', v)}
              />
            ) : null}
            {spec.openable ? <Switch label="open" checked={p.open} onChange={(v) => set('open', v)} /> : null}
            <Switch label="float" checked={p.float} onChange={(v) => set('float', v)} />

            <p className="mx-group">Surface</p>
            <div className="mx-row">
              <span className="mx-prop">areas</span>
              <span className="mx-chips">
                {regions.map((r, i) => (
                  <span key={r.name} className="mx-chip">
                    {REGION_LABEL(r.name)}
                    {i === 0 ? <em>primary</em> : null}
                  </span>
                ))}
              </span>
            </div>
            <ColorRow
              label="surfaceBackground"
              value={p.surfaceBackground}
              fallback="#000000"
              onChange={(v) => set('surfaceBackground', v)}
            />
            <div className="mx-row">
              <span className="mx-prop">resolution</span>
              <span className="mx-row-controls">
                <input
                  type="number"
                  className="mx-number"
                  aria-label="resolution"
                  min={200}
                  max={1600}
                  step={2}
                  placeholder={String(pxOf(regions[0]?.name ?? '')?.width ?? '')}
                  value={p.resolution || ''}
                  onChange={(e) => set('resolution', Number(e.target.value))}
                />
                <span className="mx-unit">px</span>
              </span>
            </div>

            <p className="mx-group">Stage</p>
            <Switch label="controls" checked={p.controls} onChange={(v) => set('controls', v)} />
            <Switch label="autoRotate" checked={p.autoRotate} onChange={(v) => set('autoRotate', v)} />
            <div className="mx-row" data-dim={!p.autoRotate}>
              <span className="mx-prop">autoRotateSpeed</span>
              <span className="mx-row-controls">
                <input
                  type="range"
                  className="mx-range"
                  aria-label="autoRotateSpeed"
                  min={0.25}
                  max={4}
                  step={0.25}
                  disabled={!p.autoRotate}
                  value={p.autoRotateSpeed}
                  onChange={(e) => set('autoRotateSpeed', Number(e.target.value))}
                />
                <span className="mx-hex">{p.autoRotateSpeed}x</span>
              </span>
            </div>
            <Switch label="zoom" checked={p.zoom} onChange={(v) => set('zoom', v)} />
            <Switch label="fullscreen" checked={p.fullscreen} onChange={(v) => set('fullscreen', v)} />
            <Switch label="shadows" checked={p.shadows} onChange={(v) => set('shadows', v)} />
            <div className="mx-row">
              <span className="mx-prop">background</span>
              <span className="mx-row-controls">
                {['', '#101318', '#eef0f4'].map((bg) => (
                  <button
                    key={bg || 'none'}
                    type="button"
                    className="mx-bg-swatch"
                    aria-label={bg ? `background ${bg}` : 'transparent background'}
                    data-on={p.background === bg}
                    data-checker={bg === ''}
                    style={bg ? { background: bg } : undefined}
                    onClick={() => set('background', bg)}
                  />
                ))}
                <input
                  type="color"
                  className="mx-color"
                  aria-label="custom background"
                  value={p.background || '#101318'}
                  onChange={(e) => set('background', e.target.value)}
                />
              </span>
            </div>
            {alsoAccepts.length ? (
              <>
                <p className="mx-group">
                  Also accepts
                  <span className="mx-group-note">code only</span>
                </p>
                {alsoAccepts.map((prop) => (
                  <div className="mx-row mx-row-doc" key={prop.name} title={prop.description}>
                    <span className="mx-prop">
                      <span className="mx-dot" aria-hidden />
                      {prop.name}
                    </span>
                    <span className="mx-doc-type">{prop.type}</span>
                  </div>
                ))}
              </>
            ) : null}
          </aside>
        ) : null}
      </div>

      <div className="mx-code">
        <div className="mx-tabs">
          <button type="button" className="mx-tab" data-on={view === '3d'} onClick={() => setView('3d')}>
            demo.tsx
          </button>
          {regions.map((region) => (
            <button
              key={region.name}
              type="button"
              className="mx-tab"
              data-on={view === region.name}
              onClick={() => setView(region.name)}
            >
              {REGION_FILE(region.name)}
            </button>
          ))}
          <button
            type="button"
            className="mx-copy"
            onClick={() => {
              void navigator.clipboard?.writeText(source.map((l) => l.text).join('\n'))
              setCopied(true)
            }}
            onMouseLeave={() => setCopied(false)}
          >
            {copied ? 'copied' : 'copy'}
          </button>
        </div>
        <pre>
          {source.map((line, i) => (
            <span key={i} className="mx-line" data-set={line.set}>
              <span className="mx-gutter">{i + 1}</span>
              <span className="mx-code-text">
                <Code text={line.text} />
              </span>
            </span>
          ))}
        </pre>
      </div>
    </div>
  )
}
