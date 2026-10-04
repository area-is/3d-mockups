'use client'

import {
  isValidElement,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Check, Copy, Link2, Zap } from 'lucide-react'
import { MockupCanvas } from 'react-3d-mockups'
import { ChromaSurface } from '../screens/chroma-surface'
import { LiveCounter } from '../screens/live-counter'
import { SurfaceArt } from '../screens/surface-art'
import { carouselArtName, carouselArtNode } from './carousel-art'
import { SCREEN_SOURCES, SOURCE_PARTS } from '@/lib/demo-sources.generated'
import { COMPONENT_PROPS, SHARED_PROPS, type PropDoc } from '@/lib/prop-tables.generated'
import { ColorRow, NumberField, PanelGlyph, PropRow, ResetGlyph, Segmented, Switch, colorInputValue } from './controls'
import {
  acceptValue,
  clamp,
  editableProp,
  isHexColor,
  propAttribute,
  same,
  type EditableProp,
} from './prop-controls'
import { LazyScene } from '../lazy-scene'
import { ModelPoster } from '../model-poster'
import { EXPLORERS, type ExplorerSpec } from './registry'
import { copyText, explorerId, readShared, writeShared } from './share'
import { openInStackBlitz } from './stackblitz'

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

/** One object in an arrangement - see `MockupExplorerProps.arrangement`. */
export interface ArrangementItem {
  /**
   * Stage a DIFFERENT object beside the page's own - the MockupCanvas page's
   * Galaxy-and-iPhone pair. A guest keeps exactly the props written here;
   * only instances of the page's own component follow the inspector, because
   * they are the only ones its rows are guaranteed to be valid for.
   */
  component?: string
  /** This instance's own props: where it stands, and anything it alone sets. */
  props?: Record<string, unknown>
  /**
   * What this instance's surface is standing in for, when the arrangement's
   * whole point is that the objects show different faces - the front-and-back
   * card pair. Labels the artwork; defaults to the object's primary region.
   */
  surface?: string
}

/**
 * Several bare objects in one `MockupCanvas`, instead of a single one-liner
 * mockup - the composition the "row of books" and "gallery wall pair" examples
 * are about.
 */
export interface Arrangement {
  /** Canvas-only props the composition needs (`shadowY`), which own no panel row. */
  canvas?: Record<string, unknown>
  items: ArrangementItem[]
}

export interface MockupExplorerProps {
  /** Component name, e.g. `"GalaxyMockup"`. */
  component: string
  /** Lock the explorer to one variant (used by the per-variant pages). */
  variant?: string
  /**
   * Props to open on, so a page can show a configured example that is still
   * live. These are where the explorer STARTS, not a floor: every one of them
   * has its own control, the reset takes you back here rather than to bare
   * defaults, and the snippet prints them because they really are being
   * passed.
   */
  props?: Record<string, unknown>
  /**
   * What fills every surface. `auto` picks the screen that suits the object -
   * a running app for a device, artwork for a print surface. `chroma` fills
   * them all with broadcast green labelled by slot, which is the
   * "mockup-able areas" view: the same live explorer, showing where content
   * lands rather than what it could look like. `none` passes no children at
   * all, for the objects that document an unprinted state (a blank shipper's
   * flap slabs and shipping label) - so the surface tabs go with it, there
   * being no content to inspect.
   */
  screen?: 'auto' | 'chroma' | 'none'
  /** Stage height in px. */
  stageHeight?: number
  /**
   * Stage bare objects in one shared canvas rather than the all-in-one mockup.
   * The inspector drives what the instances have in common - finish, surface,
   * and the stage they share - and the snippet prints the `MockupCanvas` the
   * page is teaching. `float` and the transform rows drop out of the panel:
   * both are per-instance, and the page owns where each object stands.
   */
  arrangement?: Arrangement
}

interface PropState {
  variant: string
  color: string
  orientation: 'portrait' | 'landscape'
  /** Hinge angle in degrees - 180 flat, 0 shut, anything between is Flex Mode. */
  openAngle: number
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
  /**
   * Everything else the component documents, keyed by prop name. Only props
   * the user actually set live here - the rest are simply absent, which is
   * what the mockup sees and what the snippet prints.
   */
  extra: Record<string, unknown>
}

/**
 * What the components do with no props at all. The code panel diffs against
 * this, so anything the explorer switches on for you still shows up in the
 * snippet you copy.
 */
const libraryDefaults = (spec: ExplorerSpec, lockedVariant?: string): PropState => ({
  variant: lockedVariant ?? spec.variants?.[0]?.id ?? '',
  color: '',
  orientation: 'portrait',
  openAngle: 180,
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
  extra: {},
})

/**
 * Hinge angle a foldable explorer opens on, matching the home-page carousel
 * and the sidebar thumbnails.
 */
const DOCS_OPEN_ANGLE = 150

/**
 * Where the explorer starts. Zoom is on so the stage is immediately
 * scroll/pinch-zoomable and MockupCanvas draws its zoom overlay - the
 * "modified" count and the reset action measure against this, so an untouched
 * explorer still reads as unmodified. `spec.fixed` seeds the same way: a
 * required prop (a custom panel's `size`) has to be passed from the first
 * frame, and starting there means it doesn't read as a modification either.
 */
const initialState = (
  spec: ExplorerSpec,
  lockedVariant?: string,
  seed?: Record<string, unknown>
): PropState => {
  const state: PropState = {
    ...libraryDefaults(spec, lockedVariant),
    zoom: true,
    // A foldable opens partly folded rather than flat: flat, it is just a slab
    // and the hinge - the thing the page is about - is edge-on and invisible.
    // The library's own default is still flat, so the snippet correctly prints
    // `openAngle={150}` (it diffs against the library, not against this).
    ...(spec.openable ? { openAngle: DOCS_OPEN_ANGLE } : {}),
    extra: { ...spec.fixed },
  }
  for (const [name, value] of Object.entries(seed ?? {})) {
    if (name === 'autoRotate') {
      // One prop, two pieces of UI state: the switch and the speed slider.
      state.autoRotate = value !== false && value !== 0
      if (typeof value === 'number') state.autoRotateSpeed = value
    } else if (name === 'openAngle' && spec.openable) {
      state.openAngle = typeof value === 'number' ? value : value === false ? 0 : 180
    } else if (name in state && handWritten(spec, name)) {
      // A hand-written control owns it; the rest are inferred rows in `extra`.
      ;(state as unknown as Record<string, unknown>)[name] = value
    } else {
      state.extra[name] = value
    }
  }
  return state
}

/**
 * Whether the panel's hand-written control for this prop is switched on for
 * this component. The state has a `variant` field for every component, but
 * only a family with `variants` in its spec reads it - a TV's `variant` is an
 * inferred row driven from its prop table, and lives in `extra` like any
 * other. Seeding the field the panel ignores left the page's `variant:
 * 'pedestal'` in a slot nothing rendered, so the preview opened on legs.
 */
const handWritten = (spec: ExplorerSpec, name: string) => {
  switch (name) {
    case 'variant':
      return !!spec.variants
    case 'orientation':
      return !!spec.orientation
    case 'coverage':
      return !!spec.coverage
    default:
      return true
  }
}

/** The fields that differ from where an explorer opens - what a share link carries. */
type Changes = Partial<Omit<PropState, 'extra'>> & { extra?: Record<string, unknown> }

/**
 * Everything that differs from `base`: the comparison the "modified" count
 * makes, kept as the values rather than counted. A prop that is no longer
 * passed at all is `null`, JSON having no `undefined`.
 */
function changesFrom(p: PropState, base: PropState): Changes {
  const changes: Record<string, unknown> = {}
  for (const key of Object.keys(base) as (keyof PropState)[]) {
    if (key !== 'extra' && p[key] !== base[key]) changes[key] = p[key]
  }
  const extra: Record<string, unknown> = {}
  for (const name of new Set([...Object.keys(p.extra), ...Object.keys(base.extra)])) {
    if (!same(p.extra[name], base.extra[name])) extra[name] = p.extra[name] ?? null
  }
  if (Object.keys(extra).length) changes.extra = extra
  return changes as Changes
}

/** What the panel offers a control for here - all that a link is allowed to set. */
interface Offered {
  spec: ExplorerSpec
  lockedVariant?: string
  hasColor: boolean
  arranged: boolean
  /** Props an arrangement writes on its instances, which have no row. */
  owned: Set<string>
  /** The inferred rows, which own everything in `extra`. */
  editable: EditableProp[]
}

/**
 * Where a share link opens this explorer: its own starting point, with the
 * link's changes laid over it.
 *
 * A link is input from anyone, so each change is taken only if the panel
 * offers a control for it here and the value is one that control could have
 * produced - otherwise that change is dropped and the rest still apply. Every
 * string that survives is one of a known set, a hex colour, or a text field's
 * value - held to its length and printed only as an escaped string literal -
 * which also keeps a crafted link from writing code of its own into the
 * snippet, and from there into a StackBlitz project.
 */
function restoreShared(base: PropState, link: Record<string, unknown>, offered: Offered): PropState {
  const { spec, lockedVariant, hasColor, arranged, owned, editable } = offered
  const next: PropState = { ...base, extra: { ...base.extra } }
  const oneOf = <T,>(value: unknown, options: readonly T[]) =>
    options.includes(value as T) ? (value as T) : undefined
  const flag = (value: unknown) => (typeof value === 'boolean' ? value : undefined)
  const colour = (value: unknown) => (value === '' || isHexColor(value) ? value : undefined)
  const within = (value: unknown, min: number, max: number) =>
    typeof value === 'number' && Number.isFinite(value) ? clamp(value, min, max) : undefined

  if (spec.variants && !lockedVariant && !owned.has('variant')) {
    next.variant = oneOf(link.variant, spec.variants.map((v) => v.id)) ?? next.variant
    // The select clears the colour when the model changes, a colorway being
    // one model's; a link that does the same without naming one gets that too.
    if (next.variant !== base.variant) next.color = ''
  }
  if (hasColor) {
    const ids = (spec.colorways?.[spec.variants ? next.variant : ''] ?? []).map((c) => c.id)
    next.color = colour(link.color) ?? oneOf(link.color, ids) ?? next.color
  }
  if (spec.orientation && !owned.has('orientation')) {
    next.orientation = oneOf(link.orientation, ['portrait', 'landscape'] as const) ?? next.orientation
  }
  if (spec.coverage && !owned.has('coverage')) {
    next.coverage = oneOf(link.coverage, ['panel', 'full', 'perforated'] as const) ?? next.coverage
  }
  if (spec.openable && !owned.has('openAngle')) {
    next.openAngle = within(link.openAngle, 0, 180) ?? next.openAngle
  }
  if (!arranged) next.float = flag(link.float) ?? next.float
  next.surfaceBackground = colour(link.surfaceBackground) ?? next.surfaceBackground
  // Zero is "not passed"; anything else is held to the field's own bounds,
  // which the field states but a typist can step past.
  next.resolution =
    link.resolution === 0 ? 0 : Math.round(within(link.resolution, 200, 1600) ?? next.resolution)
  next.controls = flag(link.controls) ?? next.controls
  next.autoRotate = flag(link.autoRotate) ?? next.autoRotate
  const speed = within(link.autoRotateSpeed, 0.25, 4)
  if (speed !== undefined) next.autoRotateSpeed = Math.round(speed * 4) / 4
  next.zoom = flag(link.zoom) ?? next.zoom
  next.fullscreen = flag(link.fullscreen) ?? next.fullscreen
  next.shadows = flag(link.shadows) ?? next.shadows
  next.background = colour(link.background) ?? next.background

  const extra = link.extra && typeof link.extra === 'object' && !Array.isArray(link.extra) ? link.extra : {}
  for (const [name, value] of Object.entries(extra)) {
    const prop = editable.find((row) => row.name === name)
    if (!prop) continue
    // `null` is a prop the sender stopped passing: back to where the row starts.
    const accepted = value === null ? base.extra[name] : acceptValue(prop, value)
    if (value !== null && accepted === undefined) continue
    // As `rowProps` has it, landing on the documented default is not passing it.
    if (accepted === undefined || (base.extra[name] === undefined && same(accepted, prop.fallback))) {
      delete next.extra[name]
    } else {
      next.extra[name] = accepted
    }
  }
  return next
}

/**
 * Everything a component accepts, from the API docs' own tables, minus the
 * props the inspector already hand-writes a control for - sorted into where
 * each belongs in the panel.
 *
 * The rest used to be a read-only list. They are now driven too, from the type
 * their prop table states, so the panel answers "what can I pass?" and "what
 * can I click?" with the same list. What is left over - `surfaceStyle`,
 * `className`, `style` - is documented, but there is nothing for a live demo
 * to do with it.
 */
interface PanelProps {
  /** The component's own props, in the order its API page lists them. */
  object: EditableProp[]
  /** `position` / `rotation` / `scale`. */
  transform: EditableProp[]
  /** The stage camera, which belongs with the other stage props. */
  camera?: EditableProp
  /** The canvas's own inferred props (`dpr`), shown under the stage. */
  stage: EditableProp[]
  /** Documented, but not something a live demo can drive. */
  readOnly: PropDoc[]
}

/**
 * The props this component's own API page lists.
 *
 * The inspector hand-writes a row for `color`, and it is not universal: a
 * magazine is stock and ink, so it takes `pageColor` and `backColor` and no
 * `color` at all. Asking the table is what keeps the panel from offering a
 * control the component would ignore, and the snippet from printing a prop
 * that would not compile.
 */
const documented = (spec: ExplorerSpec) =>
  new Set((COMPONENT_PROPS[spec.name] ?? []).map((doc) => doc.name))

/** Canvas props with an inferred row, which sit with the stage rather than the model. */
const STAGE_PROPS = new Set(['dpr'])

function panelProps(spec: ExplorerSpec, driven: Set<string>): PanelProps {
  const out: PanelProps = { object: [], transform: [], stage: [], readOnly: [] }
  const seen = new Set(driven)
  for (const doc of [...(COMPONENT_PROPS[spec.name] ?? []), ...SHARED_PROPS]) {
    if (seen.has(doc.name)) continue
    seen.add(doc.name)
    const prop = editableProp(doc)
    if (!prop) out.readOnly.push(doc)
    else if (prop.control.kind === 'camera') out.camera = prop
    else if (STAGE_PROPS.has(prop.name)) out.stage.push(prop)
    else if (prop.control.kind === 'vector') out.transform.push(prop)
    else out.object.push(prop)
  }
  return out
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
/** `ChromaSurface` -> `chroma-surface`, for a screen whose module is unknown. */
const KEBAB = (name: string) => name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

/**
 * The module a screen component is written in, as the demo would import it.
 *
 * Read off the source rather than spelled from the name, so the import line in
 * `demo.tsx` names the same file the surface tab prints - `./swiss-art` for
 * the watch face, not a `./swiss-dial-a` that does not exist.
 */
const screenModule = (screen: string) => {
  const home = SCREEN_SOURCES[screen]?.at(-1)?.file
  return `./${home ? home.replace(/^.*\//, '').replace(/\.tsx?$/, '') : KEBAB(screen)}`
}

/** `top` -> `Top`, the slot component on the mockup. */
const SLOT_NAME = (name: string) => name.charAt(0).toUpperCase() + name.slice(1)
/** `BackLabel` -> `backLabel`: back from a slot component to its region. */
const REGION_OF = (slot: string) => slot.charAt(0).toLowerCase() + slot.slice(1)

/**
 * The source behind one surface: headed by the slot it is mounted through, the
 * size that slot gives it and the call the stage really makes, then the WHOLE
 * of what the component is built from - the layout it calls, the helpers that
 * layout uses, the palette it indexes - file by file, in reading order.
 *
 * All of it rather than the component alone, because most of these pieces are
 * one call to something shared - the watch face is a single `<SwissDial …/>`.
 * A panel that printed the piece by itself named the thing and then showed
 * none of it, leaving the reader to guess at everything doing the work.
 *
 * Every surface of an object shares one component, so the header is what
 * distinguishes the panel you are looking at.
 */
function surfaceSource(
  spec: ExplorerSpec,
  region: string,
  screen: string,
  attributes: string[],
  px?: { width: number; height: number }
): Line[] {
  const size = px ? ` - ${px.width} x ${px.height} px` : ''
  const lines = [
    `// <${spec.name}.${SLOT_NAME(region)}>${size}`,
    `//   <${[screen, ...attributes].join(' ')} />`,
  ]
  for (const group of SCREEN_SOURCES[screen] ?? []) {
    lines.push('', `// ${group.file}`)
    if (group.head.length) lines.push('', ...group.head)
    for (const key of group.parts) lines.push('', ...(SOURCE_PARTS[key]?.split('\n') ?? []))
  }
  return lines.map((text) => ({ text }))
}

/* ------------------------------------------------------------------ */
/*  Code generation                                                    */
/* ------------------------------------------------------------------ */

interface Line {
  text: string
  set?: boolean
}

/** A page-supplied value, written the way someone would type it into JSX. */
function literal(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(literal).join(', ')}]`
  if (value && typeof value === 'object')
    return `{ ${Object.entries(value as Record<string, unknown>)
      .map(([key, v]) => `${key}: ${literal(v)}`)
      .join(', ')} }`
  return JSON.stringify(value)
}

/** One prop an arrangement writes itself, rather than one the panel drives. */
const literalAttribute = (name: string, value: unknown): string =>
  typeof value === 'string'
    ? `${name}="${value}"`
    : value === true
      ? name
      : `${name}={${literal(value)}}`

/** The prop an attribute sets - `color="#fff"` and a bare `float` alike. */
const attributeName = (text: string) => text.split('=')[0]

/**
 * One attribute per prop, keeping the LAST - the same precedence the spread
 * that builds the live props has, so a tag never prints a prop twice and never
 * prints the losing side of the two.
 */
const lastWins = (attributes: string[]): string[] => {
  const byName = new Map(attributes.map((text) => [attributeName(text), text]))
  return [...byName.values()]
}

/** The flat view's zoom range, as factors over the fit, and the step a click takes. */
const FLAT_ZOOM_MIN = 0.25
const FLAT_ZOOM_MAX = 8
const FLAT_ZOOM_STEP = 1.25

/**
 * The props an arrangement takes off the object and gives to the canvas or to
 * the individual instances - so neither the stage nor the snippet hands a bare
 * object something the page or the canvas already owns.
 */
const NOT_AN_ARRANGED_OBJECT_PROP = ['camera', 'dpr', 'position', 'rotation', 'scale']

/** The object props in play - what a bare instance would take too. */
function objectAttributes(
  spec: ExplorerSpec,
  p: PropState,
  extras: EditableProp[],
  skip: readonly string[] = []
): string[] {
  const base = libraryDefaults(spec)
  const documents = documented(spec)
  const props: string[] = []
  const add = (text: string) => props.push(text)

  if (spec.variants && p.variant !== base.variant) add(`variant="${p.variant}"`)
  if (documents.has('color') && p.color) add(`color="${p.color}"`)
  if (spec.orientation && p.orientation !== 'portrait') add(`orientation="${p.orientation}"`)
  if (spec.openable && p.openAngle !== 180)
    add(p.openAngle === 0 ? 'openAngle={false}' : `openAngle={${p.openAngle}}`)
  if (spec.coverage && p.coverage !== 'panel') add(`coverage="${p.coverage}"`)
  if (p.surfaceBackground) add(`surfaceBackground="${p.surfaceBackground}"`)
  if (p.resolution) add(`resolution={${p.resolution}}`)
  // Anything still in `extra` is there because it differs from what the
  // component does on its own, so every one of them earns a line.
  for (const prop of extras) {
    if (skip.includes(prop.name)) continue
    if (prop.name in p.extra) add(propAttribute(prop, p.extra[prop.name]))
  }
  return props
}

/** The stage props in play - the canvas ones, wherever the canvas comes from. */
function stageAttributes(p: PropState): string[] {
  const props: string[] = []
  const add = (text: string) => props.push(text)
  if (!p.controls) add('controls={false}')
  // The switch and the speed slider drive one prop: bare when it spins at the
  // library's own rate, a multiplier when it doesn't.
  if (p.autoRotate) add(p.autoRotateSpeed === 1 ? 'autoRotate' : `autoRotate={${p.autoRotateSpeed}}`)
  if (p.zoom) add('zoom')
  if (p.fullscreen) add('fullscreen')
  if (!p.shadows) add('shadows={false}')
  if (p.background) add(`background="${p.background}"`)
  return props
}

/** An open tag: on one line when it is short, one prop per line when it isn't. */
function openTag(name: string, props: string[], indent: string, selfClose = false): Line[] {
  const end = selfClose ? ' />' : '>'
  if (props.length === 0) return [{ text: `${indent}<${name}${end}` }]
  if (props.length <= 2) return [{ text: `${indent}<${name} ${props.join(' ')}${end}`, set: true }]
  return [
    { text: `${indent}<${name}` },
    ...props.map((prop) => ({ text: `${indent}  ${prop}`, set: true })),
    { text: `${indent}${selfClose ? '/>' : '>'}` },
  ]
}

const preamble = (imports: string[], screen: string | null, stageHeight: number): Line[] => [
  { text: `'use client'` },
  { text: '' },
  { text: `import { ${imports.join(', ')} } from 'react-3d-mockups'` },
  ...(screen ? [{ text: `import { ${screen} } from '${screenModule(screen)}'` }] : []),
  { text: '' },
  { text: 'export function Demo() {' },
  { text: '  return (' },
  { text: `    <div style={{ height: ${stageHeight} }}>` },
]

const closing: Line[] = [{ text: '    </div>' }, { text: '  )' }, { text: '}' }]

/** The snippet for the current props - only what differs from the defaults. */
function buildSource(
  spec: ExplorerSpec,
  p: PropState,
  stageHeight: number,
  screen: string | null,
  extras: EditableProp[]
): Line[] {
  const props = [...objectAttributes(spec, p, extras), ...(p.float ? ['float'] : []), ...stageAttributes(p)]
  const head = preamble([spec.name], screen, stageHeight)
  // No screen is the unprinted state, and it is the absence of children that
  // produces it - so the snippet has to close the tag on itself to be true.
  if (!screen) return [...head, ...openTag(spec.name, props, '      ', true), ...closing]
  return [
    ...head,
    ...openTag(spec.name, props, '      '),
    { text: `        <${screen} />` },
    { text: `      </${spec.name}>` },
    ...closing,
  ]
}

/**
 * The snippet for an arrangement: one canvas, several bare objects.
 *
 * The panel's object props are printed on every instance of the page's own
 * component, and its stage props once on the canvas - which is exactly how
 * they are being applied on the stage above.
 */
function buildArrangedSource(
  spec: ExplorerSpec,
  arrangement: Arrangement,
  p: PropState,
  stageHeight: number,
  screen: string,
  extras: EditableProp[]
): Line[] {
  const shared = objectAttributes(spec, p, extras, NOT_AN_ARRANGED_OBJECT_PROP)
  // The camera frames the whole composition, and `dpr` sets the whole
  // canvas's resolution, so both are the canvas's here - there is no
  // one-liner between the panel row and the stage to route them.
  const onCanvas = extras.filter((prop) => (prop.name === 'camera' || prop.name === 'dpr') && prop.name in p.extra)
  const canvas = lastWins([
    ...stageAttributes(p),
    ...Object.entries(arrangement.canvas ?? {}).map(([name, value]) => literalAttribute(name, value)),
    ...onCanvas.map((prop) => propAttribute(prop, p.extra[prop.name])),
  ])
  const lines: Line[] = []
  const imports = new Set(['MockupCanvas'])

  for (const item of arrangement.items) {
    const itemSpec = item.component ? EXPLORERS[item.component] : spec
    const name = itemSpec?.bareName ?? spec.bareName ?? spec.name
    imports.add(name)
    const own = Object.entries(item.props ?? {}).map(([prop, value]) => literalAttribute(prop, value))
    // What the page writes on this instance wins over what the panel sets for
    // all of them - the same way the spread on the stage resolves it.
    const props = lastWins([...(item.component ? [] : shared), ...own])
    lines.push(
      ...openTag(name, props, '        '),
      { text: `          <${screen} />` },
      { text: `        </${name}>` }
    )
  }

  return [
    ...preamble([...imports].sort(), screen, stageHeight),
    ...openTag('MockupCanvas', canvas, '      '),
    ...lines,
    { text: '      </MockupCanvas>' },
    ...closing,
  ]
}

/** Light syntax colouring: comments, tags, attributes, strings and braces. */
function Code({ text }: { text: string }) {
  // The screen sources are as much documentation as code, so a line that is
  // all comment is coloured as one rather than tokenized as if it were JSX.
  if (/^\s*(\/\/|\{?\/\*|\*)/.test(text)) return <span className="tok-comment">{text}</span>
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

/**
 * Resolves the component name before any hook runs.
 *
 * A typo in MDX used to reach `initialState(undefined)` from a `useState`
 * initializer and throw a bare TypeError out of the first render - the
 * `if (!spec)` guard inside the body could never run, because the hooks above
 * it crashed first. Splitting the lookup out keeps the guard reachable and the
 * hook order fixed.
 */
export function MockupExplorer(props: MockupExplorerProps) {
  if (!EXPLORERS[props.component]) {
    return <p className="mx-unknown">Unknown mockup component: {props.component}</p>
  }
  // An arrangement stages the bare objects, so every component it names has to
  // have one registered - caught here rather than as a null element type.
  const missing = (props.arrangement?.items ?? [])
    .map((item) => item.component ?? props.component)
    .find((name) => !EXPLORERS[name]?.bare)
  if (missing) {
    return <p className="mx-unknown">No bare object registered for: {missing}</p>
  }
  return <MockupExplorerImpl {...props} />
}

function MockupExplorerImpl({
  component,
  variant,
  props: seed,
  screen = 'auto',
  stageHeight = 460,
  arrangement,
}: MockupExplorerProps) {
  const spec = EXPLORERS[component]!
  const arranged = arrangement?.items.length ? arrangement : undefined
  const [p, setP] = useState<PropState>(() => initialState(spec, variant, seed))
  // Open on a wide screen, collapsed once the layout stacks. Resolved after
  // mount so the server and the first client render agree.
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const rootRef = useRef<HTMLDivElement>(null)
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
  // Compared rather than flagged: a first-run flag is spent by StrictMode's
  // double effect in development, which then spun every explorer on load.
  const lastColour = useRef<string | null>(null)
  const [view, setView] = useState<string>('3d')
  /**
   * Zoom on the flat view, as a factor over the fit. Kept with the view it
   * was set on rather than reset in an effect: switching surfaces starts the
   * next one at fit, and coming back starts at fit too, which is what "the
   * view fits by default" means.
   */
  const [flatZoom, setFlatZoom] = useState<{ view: string; value: number }>({ view: '3d', value: 1 })
  const zoom = flatZoom.view === view ? flatZoom.value : 1
  const zoomBy = (factor: number) =>
    setFlatZoom({ view, value: Math.min(FLAT_ZOOM_MAX, Math.max(FLAT_ZOOM_MIN, zoom * factor)) })
  const [copied, setCopied] = useState(false)
  const [linked, setLinked] = useState<'idle' | 'copied' | 'failed'>('idle')

  const set = <K extends keyof PropState>(key: K, value: PropState[K]) =>
    setP((prev) => ({ ...prev, [key]: value }))

  const writeExtra = (name: string, value: unknown | undefined) =>
    setP((prev) => {
      const extra = { ...prev.extra }
      if (value === undefined) delete extra[name]
      else extra[name] = value
      return { ...prev, extra }
    })

  useEffect(() => {
    const previous = lastColour.current
    lastColour.current = p.color
    if (previous === null || previous === p.color) return
    setSpinning(true)
    const t = setTimeout(() => setSpinning(false), SPIN_MS)
    return () => clearTimeout(t)
  }, [p.color])

  // Only the initial state follows the breakpoint: once the reader has opened
  // or closed the panel, a rotation should not overrule them.
  useEffect(() => {
    if (window.innerWidth <= STACK_BREAKPOINT) setInspectorOpen(false)
  }, [])

  const seedKey = JSON.stringify(seed ?? null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const base = useMemo(() => initialState(spec, variant, seed), [spec, variant, seedKey])
  const changes = useMemo(() => changesFrom(p, base), [p, base])
  const modified =
    Object.keys(changes).filter((key) => key !== 'extra').length + Object.keys(changes.extra ?? {}).length

  const { Component } = spec

  const documents = documented(spec)

  /**
   * Props the arrangement writes on every one of its own instances. A panel row
   * for one of those could not change anything on the stage - each instance
   * overrides it - so the row is not offered at all. That is what makes a row
   * of three differently-bound books lose its `color` control but keep `size`.
   */
  const ownedByItems = useMemo(() => {
    const own = (arranged?.items ?? [])
      .filter((item) => !item.component)
      .map((item) => Object.keys(item.props ?? {}))
    if (!own.length) return new Set<string>()
    return new Set(own[0].filter((name) => own.every((names) => names.includes(name))))
  }, [arranged])

  const hasColor = documents.has('color') && !ownedByItems.has('color')
  /**
   * What an unset `color` renders as, for its row to show: the component's
   * documented default when that is a plain colour. A single near-black for
   * everything had the row reading #101216 over a book that was plainly navy.
   */
  const colorDefault =
    /^'(#[0-9a-f]{3,8})'$/i.exec(COMPONENT_PROPS[spec.name]?.find((doc) => doc.name === 'color')?.default ?? '')?.[1] ??
    '#101216'

  const driven = new Set<string>([
    'float',
    'surfaceBackground',
    'resolution',
    'controls',
    'autoRotate',
    'zoom',
    'fullscreen',
    'shadows',
    'background',
    'children',
    ...(hasColor ? ['color'] : []),
    ...(spec.variants ? ['variant'] : []),
    ...(spec.orientation ? ['orientation'] : []),
    ...(spec.openable ? ['openAngle'] : []),
    ...(spec.coverage ? ['coverage'] : []),
    // In an arrangement the transforms are what tell the objects apart, and the
    // page has already written one per instance - a single panel row could only
    // move them all onto the same spot.
    ...(arranged ? ['position', 'rotation', 'scale'] : []),
    ...ownedByItems,
  ])
  const panel = panelProps(spec, driven)
  const editable = [...panel.object, ...panel.transform, ...(panel.camera ? [panel.camera] : []), ...panel.stage]

  /** What a row shows: the value in play, whether it moved, and how to move it. */
  const rowProps = (prop: EditableProp) => ({
    prop,
    value: prop.name in p.extra ? p.extra[prop.name] : prop.seed,
    set: !same(p.extra[prop.name], base.extra[prop.name]),
    onChange: (value: unknown) =>
      // Landing back on the documented default is the same as never having
      // passed the prop - unless the explorer had to seed it (`spec.fixed`),
      // in which case there is no "not passed" to go back to.
      writeExtra(
        prop.name,
        base.extra[prop.name] === undefined && same(value, prop.fallback) ? undefined : value
      ),
    onReset: () => writeExtra(prop.name, base.extra[prop.name]),
  })

  /*
   * Share links - see `share.ts` for the hash. The id is a digest of how the
   * page sets this explorer up, so it is the same on every load and differs
   * between the examples on one page.
   */
  const shareId = explorerId({ component, variant, screen, props: seed, arrangement })

  const followLink = useEffectEvent(() => {
    const link = readShared(shareId)
    if (!link) return
    setP(
      restoreShared(base, link, {
        spec,
        lockedVariant: variant,
        hasColor,
        arranged: !!arranged,
        owned: ownedByItems,
        editable,
      })
    )
    // No element carries the hash as its id, so the browser has nothing to
    // scroll to on its own - and the explorer a link names may be the fourth
    // one down the page. Where it sits does not depend on the props just
    // restored, so there is no render to wait for.
    rootRef.current?.scrollIntoView({ block: 'start' })
  })

  // Read on arrival, and again when a link is pasted into a tab already on
  // this page: that changes only the hash, so nothing reloads to read it.
  useEffect(() => {
    const onHashChange = () => followLink()
    onHashChange()
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const share = async () => {
    const url = writeShared(shareId, changes)
    // The link is in the address bar either way, so a refused clipboard
    // still leaves the reader something to copy - the label says where.
    setLinked((await copyText(url)) ? 'copied' : 'failed')
  }

  // Regions and measurements come straight off the component. Only the object's
  // own props reach `info()` - a transform or a camera moves the mockup on the
  // stage without changing a millimetre of what it measures.
  const regions: { name: string; label?: string }[] = Component.regions ?? []
  const geometry = Object.fromEntries(
    panel.object.filter((prop) => prop.name in p.extra).map((prop) => [prop.name, p.extra[prop.name]])
  )
  const infoProps: Record<string, unknown> = {
    ...(spec.variants ? { variant: p.variant } : {}),
    ...(spec.orientation ? { orientation: p.orientation } : {}),
    ...(spec.openable ? { openAngle: p.openAngle } : {}),
    ...(spec.coverage ? { coverage: p.coverage } : {}),
    ...geometry,
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

  // Gated on the colour row itself: a swatch sets `color`, so where an
  // arrangement owns that prop there is nothing for a swatch to set either.
  const colorways = hasColor ? (spec.colorways?.[spec.variants ? p.variant : ''] ?? []) : []
  /*
   * Which retail finish is in play, if any. Matched on id first - that is what
   * a swatch now stores - and on colour as well, so a page that seeds
   * `color: '#3a3d42'` still lights up the swatch that shipped in it.
   */
  const preset = colorways.find((c) => c.id === p.color || c.color === p.color)
  const chroma = screen === 'chroma'
  /** Nothing on any surface - the unprinted state, which is a state worth showing. */
  const unprinted = screen === 'none'
  /*
   * The finish the artwork is printed onto, as a colour the art can reason
   * about. `p.color` is either a swatch id or a raw CSS colour, so the resolved
   * preset comes first; a page that sets no colour at all falls back to the
   * first swatch, which is the finish the object is standing in anyway, and
   * failing that to the component's own default - a kraft bag's kraft. The
   * pieces that print onto the material flip their ink on this, so handing
   * them an id would have printed dark ink on a dark board.
   */
  const rawColor = typeof p.color === 'string' ? p.color : undefined
  const finish =
    preset?.color ??
    (rawColor?.startsWith('#') ? rawColor : undefined) ??
    colorways[0]?.color ??
    colorDefault
  /*
   * What is behind the artwork when the reader has not picked a surface. On
   * an object whose `color` is the stock it is printed on (`spec.stock`) the
   * library paints that stock there, and the sample artwork has no ground of
   * its own, so `color` changes what it is printed on. The flat view is the
   * one place that has to paint it by hand - it is plain DOM, not the model.
   */
  const surfaceDoc = [...(COMPONENT_PROPS[spec.name] ?? []), ...SHARED_PROPS].find((doc) => doc.name === 'surfaceBackground')
  const surfaceDefault = spec.stock ? finish : (/^'(#[0-9a-f]{3,8})'$/i.exec(surfaceDoc?.default ?? '')?.[1] ?? '#000000')

  /**
   * What is staged on one region.
   *
   * `auto` prefers the artwork the home page's carousel puts on this object,
   * so the reference page is the carousel's own claim rather than a stand-in -
   * see `carousel-art.tsx`. Objects and faces the carousel does not stage keep
   * the generic demos, which is also what `screen="chroma"` and `"none"` ask
   * for explicitly.
   */
  const artFor = (region: string) => (chroma || unprinted ? null : carouselArtName(spec.kind, region))
  const nameFor = (region: string): string | null =>
    unprinted
      ? null
      : chroma
        ? 'ChromaSurface'
        : (artFor(region) ?? (spec.print ? 'SurfaceArt' : 'LiveCounter'))
  /** The primary face's name, which is what the `demo.tsx` snippet prints. */
  const screenName = nameFor(regions[0]?.name ?? 'screen')
  const content = (region: string, labelOverride?: string, stock: string = finish) => {
    const label = labelOverride ?? REGION_LABEL(region)
    if (chroma) return <ChromaSurface label={label} />
    const art = artFor(region)
    if (art) return carouselArtNode(art, stock, { region, coverage: spec.coverage ? p.coverage : undefined })
    return spec.print ? <SurfaceArt label={label} material={spec.stock ? stock : undefined} /> : <LiveCounter />
  }
  /**
   * The props the surface is really mounted with, read off the element the
   * stage builds rather than restated. The pieces that print onto the object
   * take its finish and the generic demos take a label, so a header written
   * by hand would have been wrong for one or the other - and was: it printed
   * `label` on artwork that has never had one.
   */
  const surfaceAttributes = (region: string) => {
    const node = content(region)
    if (!isValidElement(node)) return []
    return Object.entries(node.props as Record<string, unknown>).map(([name, value]) =>
      literalAttribute(name, value)
    )
  }

  // Slots are the capitalized components the mockup carries, one per region.
  const slots = Object.entries(Component).filter(
    ([key, value]) => /^[A-Z]/.test(key) && typeof value === 'function'
  ) as [string, React.ComponentType<{ children?: ReactNode }>][]
  /** The surfaces the reader can open - none of them when none are printed. */
  const views = unprinted ? [] : regions

  /**
   * The props that describe the OBJECT - the ones a bare instance takes too.
   *
   * An arrangement takes five of them back. `camera` frames the composition
   * and `dpr` sets the canvas's resolution rather than any one object's, and
   * the one-liner is not there to route them to the canvas; the transforms
   * are the page's, one per instance. Both are gone
   * from the panel too, so nothing here is silently dropping a live row.
   */
  const objectProps: Record<string, unknown> = {
    ...(spec.variants ? { variant: p.variant } : {}),
    ...(hasColor && p.color ? { color: p.color } : {}),
    ...(spec.orientation ? { orientation: p.orientation } : {}),
    ...(spec.openable ? { openAngle: p.openAngle } : {}),
    ...(spec.coverage ? { coverage: p.coverage } : {}),
    ...(p.surfaceBackground ? { surfaceBackground: p.surfaceBackground } : {}),
    ...(p.resolution ? { resolution: p.resolution } : {}),
    ...p.extra,
  }
  if (arranged) for (const name of NOT_AN_ARRANGED_OBJECT_PROP) delete objectProps[name]

  /** The props that describe the STAGE - the canvas's, wherever it comes from. */
  const stageProps: Record<string, unknown> = {
    ...(p.background ? { background: p.background } : {}),
    // TumbleControls - and with it the turntable - only exists while controls
    // are on, so the spin borrows them for its duration.
    controls: p.controls || spinning,
    autoRotate: spinning ? SPIN_SPEED : p.autoRotate && p.autoRotateSpeed,
    zoom: p.zoom,
    fullscreen: p.fullscreen,
    shadows: p.shadows,
    ...(arranged
      ? {
          ...arranged.canvas,
          ...(p.extra.camera ? { camera: p.extra.camera } : {}),
          ...('dpr' in p.extra ? { dpr: p.extra.dpr } : {}),
        }
      : {}),
  }

  const flatPx = view === '3d' ? undefined : pxOf(view)
  /**
   * The surface at true size, the factor that fits it, and the box that lands.
   *
   * Measured rather than assumed: the stage is a different box with the
   * inspector open, closed, or stacked under it on a phone, and the hard-coded
   * widths this used to carry were wrong on a phone and slightly wrong on
   * desktop too. The insets leave room for the dashed frame and the readout.
   */
  const flatSize = (() => {
    const px = { width: flatPx?.width ?? 320, height: flatPx?.height ?? 200 }
    const fit = Math.min(
      ((stageSize.height || stageHeight) - 100) / px.height,
      ((stageSize.width || 640) - 60) / px.width,
      1
    )
    const scale = fit * zoom
    return { px, scale, width: px.width * scale, height: px.height * scale }
  })()
  // Built whichever tab is open: StackBlitz always gets `demo.tsx`, a surface
  // file on its own being nothing that runs.
  const demo = arranged
    ? buildArrangedSource(spec, arranged, p, stageHeight, screenName ?? '', editable)
    : buildSource(spec, p, stageHeight, screenName, editable)
  /*
   * One tab per surface next to demo.tsx, and the same `view` drives both -
   * so picking a panel's source shows that panel on the stage, and picking a
   * panel on the stage opens its source. There is no second piece of state to
   * fall out of step.
   */
  const source =
    view !== '3d'
      ? surfaceSource(spec, view, nameFor(view) ?? '', surfaceAttributes(view), flatPx)
      : demo

  return (
    <div className="mx" ref={rootRef} data-inspector={inspectorOpen}>
      <div className="mx-header">
        <span className="mx-views">
          <button
            type="button"
            data-on={view === '3d'}
            aria-pressed={view === '3d'}
            onClick={() => setView('3d')}
          >
            {spec.label}
          </button>
          {views.map((region) => (
            <span key={region.name} className="mx-view-item">
              <span className="mx-divider" aria-hidden />
              <button
                type="button"
                data-on={view === region.name}
                aria-pressed={view === region.name}
                onClick={() => setView(region.name)}
              >
                {REGION_LABEL(region.name)}
              </button>
            </span>
          ))}
        </span>
        <button
          type="button"
          className="mx-props-btn"
          data-on={inspectorOpen}
          aria-expanded={inspectorOpen}
          title={inspectorOpen ? 'Hide the props panel' : 'Show the props panel'}
          onClick={() => setInspectorOpen((o) => !o)}
        >
          <PanelGlyph open={inspectorOpen} />
          Props
          {modified > 0 ? <span className="mx-badge">{modified}</span> : null}
        </button>
      </div>

      {/* The row owns the height so the inspector scrolls inside it rather
          than stretching the stage past the device. */}
      <div className="mx-body" style={{ height: stageHeight }}>
        <div className="mx-stage" ref={stageRef} style={{ background: p.background || undefined }}>
          {view === '3d' ? (
            <LazyScene poster={arranged ? null : <ModelPoster component={component} variant={spec.variants ? p.variant : undefined} />}>
              {(ready) => arranged ? (
                /*
                 * One canvas, the bare objects inside it - the composition the
                 * page is teaching, with the inspector driving what they share.
                 * One surface each rather than every slot: an arrangement is
                 * about where the objects stand, and nine slot lines for three
                 * books would bury that in the snippet. The other surfaces are
                 * still a tab away.
                 */
                <MockupCanvas {...stageProps} onCreated={ready}>
                  {arranged.items.map((item, i) => {
                    const itemSpec = item.component ? EXPLORERS[item.component]! : spec
                    const Bare = itemSpec.bare
                    // An instance that brings its own stock prints on it, so its
                    // artwork has to set its ink for that stock.
                    const own = item.props?.color
                    const itemStock =
                      spec.stock && !item.component && typeof own === 'string' && own.startsWith('#') ? own : undefined
                    return (
                      <Bare key={i} {...(item.component ? {} : objectProps)} {...item.props}>
                        {content(
                          itemSpec.Component.regions?.[0]?.name ?? 'children',
                          item.surface,
                          itemStock ?? finish
                        )}
                      </Bare>
                    )
                  })}
                </MockupCanvas>
              ) : (
                /*
                  Every surface through its own named slot, including the
                  primary one. Passing bare children *and* the primary slot is
                  the one combination the library rejects - it warned on every
                  device page and dropped the bare children - and naming all of
                  them also means each surface gets its own region label.
                */
                <Component {...objectProps} {...stageProps} float={p.float} onCreated={ready}>
                  {unprinted
                    ? null
                    : slots.map(([name, Slot]) => (
                        <Slot key={name}>{content(REGION_OF(name))}</Slot>
                      ))}
                </Component>
              )}
            </LazyScene>
          ) : (
            <>
            {/* The scrolling box holds only the frame. The readout and the
                zoom pill are siblings of it, pinned to the stage: anything
                absolutely positioned INSIDE a box that scrolls scrolls with
                it, which is how the pill first went for a ride under a
                zoomed surface. */}
            <div className="mx-flat">
              {/* The frame is sized from the SCALED surface, not the surface.
                  `transform` only changes what a box looks like, never how much
                  room it takes, so a frame wrapped around the untransformed
                  element would be drawn at the full 360x780 - metres wide of the
                  shrunken screen, and tall enough for the stage to clip its top
                  and bottom off. Reserving the scaled box here is what makes the
                  dashes actually hug the surface they are measuring. */}
              <div className="mx-flat-frame" style={{ width: flatSize.width, height: flatSize.height }}>
                <div
                  className="mx-flat-inner"
                  style={{
                    width: flatSize.px.width,
                    height: flatSize.px.height,
                    background: p.surfaceBackground || (spec.stock ? finish : undefined),
                    // Content still lays out at true CSS pixel size - that is the
                    // whole point of the view - and only the picture is scaled.
                    transform: `scale(${flatSize.scale})`,
                  }}
                >
                  {content(view)}
                </div>
              </div>
            </div>
              <span className="mx-readout">
                {flatPx?.width ?? '?'}
                <span>×</span>
                {flatPx?.height ?? '?'}
                <span>px</span>
              </span>
              {/* Zoom, as the 3D stage has it. The middle button reads the
                  scale against the surface's true pixels - 100% is one CSS
                  pixel per pixel - and puts the view back to fit. */}
              <span className="mx-zoom" role="group" aria-label="Zoom">
                <button type="button" title="Zoom out" aria-label="Zoom out" disabled={zoom <= FLAT_ZOOM_MIN} onClick={() => zoomBy(1 / FLAT_ZOOM_STEP)}>
                  −
                </button>
                <button type="button" className="mx-zoom-level" title="Fit to the stage" onClick={() => setFlatZoom({ view, value: 1 })}>
                  {Math.round(flatSize.scale * 100)}%
                </button>
                <button type="button" title="Zoom in" aria-label="Zoom in" disabled={zoom >= FLAT_ZOOM_MAX} onClick={() => zoomBy(FLAT_ZOOM_STEP)}>
                  +
                </button>
              </span>
            </>
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
                onClick={() => setP(initialState(spec, variant, seed))}
              >
                reset {modified} <ResetGlyph />
              </button>
            </div>

            <p className="mx-group">Device</p>
            {spec.variants && !variant && !ownedByItems.has('variant') ? (
              <div className="mx-row">
                <span className="mx-prop">variant</span>
                <select
                  className="mx-select"
                  aria-label="variant"
                  value={p.variant}
                  onChange={(e) => setP((prev) => ({ ...prev, variant: e.target.value, color: '' }))}
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
              <div className="mx-row">
                <span className="mx-prop">preset</span>
                <span className="mx-swatches">
                  {colorways.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="mx-swatch"
                      title={c.name}
                      aria-label={c.name}
                      aria-pressed={preset?.id === c.id}
                      data-on={preset?.id === c.id}
                      style={{ background: c.color }}
                      /*
                       * The id, not the hex. A colorway id brings the finish's
                       * MEASURED frame and hinge with it; the same colour as a
                       * raw hex only gets a derived rail, so clicking a retail
                       * swatch used to render a subtly different device than
                       * the one it names - and the snippet copied the hex.
                       */
                      onClick={() => set('color', c.id)}
                    />
                  ))}
                </span>
              </div>
            ) : null}

            {hasColor ? (
              <ColorRow
                label="color"
                value={p.color}
                fallback={colorDefault}
                presetName={preset?.name}
                swatch={preset?.color}
                onChange={(v) => set('color', v)}
              />
            ) : null}
            {spec.orientation && !ownedByItems.has('orientation') ? (
              <Segmented
                label="orientation"
                value={p.orientation}
                options={['portrait', 'landscape'] as const}
                onChange={(v) => set('orientation', v)}
              />
            ) : null}
            {spec.coverage && !ownedByItems.has('coverage') ? (
              <Segmented
                label="coverage"
                value={p.coverage}
                options={['panel', 'full', 'perforated'] as const}
                onChange={(v) => set('coverage', v)}
              />
            ) : null}
            {spec.openable && !ownedByItems.has('openAngle') ? (
              <div className="mx-row" title="180 flat, 0 shut, anything between is Flex Mode">
                <span className="mx-prop">openAngle</span>
                <span className="mx-row-controls">
                  <NumberField
                    label="openAngle"
                    value={p.openAngle}
                    min={0}
                    max={180}
                    step={1}
                    unit="°"
                    onChange={(v) => set('openAngle', v)}
                  />
                </span>
              </div>
            ) : null}
            {/* `float` belongs to the one-liner, not to a bare object, so an
                arrangement has no row for it - the panel only ever offers what
                the snippet beside it could actually carry. */}
            {arranged ? null : (
              <Switch label="float" checked={p.float} onChange={(v) => set('float', v)} />
            )}
            {panel.object.map((prop) => (
              <PropRow key={prop.name} {...rowProps(prop)} />
            ))}

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
              fallback={surfaceDefault}
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
                  value={colorInputValue(p.background || '#101318')}
                  onChange={(e) => set('background', e.target.value)}
                />
              </span>
            </div>
            {panel.camera ? <PropRow {...rowProps(panel.camera)} /> : null}
            {panel.stage.map((prop) => (
              <PropRow key={prop.name} {...rowProps(prop)} />
            ))}

            {panel.transform.length ? (
              <>
                <p className="mx-group">
                  Transform
                  <span className="mx-group-note">r3f group props</span>
                </p>
                {panel.transform.map((prop) => (
                  <PropRow key={prop.name} {...rowProps(prop)} />
                ))}
              </>
            ) : null}

            {panel.readOnly.length ? (
              <>
                <p className="mx-group">
                  Also accepts
                  <span className="mx-group-note">code only</span>
                </p>
                {panel.readOnly.map((prop) => (
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
          <button
            type="button"
            className="mx-tab"
            data-on={view === '3d'}
            aria-pressed={view === '3d'}
            onClick={() => setView('3d')}
          >
            demo.tsx
          </button>
          {views.map((region) => (
            <button
              key={region.name}
              type="button"
              className="mx-tab"
              data-on={view === region.name}
              aria-pressed={view === region.name}
              onClick={() => setView(region.name)}
            >
              {REGION_FILE(region.name)}
            </button>
          ))}
          {/* Named by aria-label, not their text: below 520px the text goes
              and only the icon is left. */}
          <span className="mx-actions">
            <button
              type="button"
              className="mx-action"
              aria-label="Share a link to these props"
              title={
                linked === 'failed'
                  ? 'The clipboard is unavailable - copy the link from the address bar'
                  : 'Copy a link that opens this explorer with these props'
              }
              onClick={share}
              onMouseLeave={() => setLinked('idle')}
            >
              {linked === 'copied' ? <Check size={13} aria-hidden /> : <Link2 size={13} aria-hidden />}
              <span className="mx-action-label">
                {linked === 'copied' ? 'link copied' : linked === 'failed' ? 'link in address bar' : 'share'}
              </span>
            </button>
            <button
              type="button"
              className="mx-action"
              aria-label="Open in StackBlitz"
              title="Open demo.tsx as a runnable Vite project on StackBlitz"
              onClick={() => openInStackBlitz(demo.map((l) => l.text).join('\n'), spec.name)}
            >
              <Zap size={13} aria-hidden />
              <span className="mx-action-label">StackBlitz</span>
            </button>
            <button
              type="button"
              className="mx-action"
              aria-label="Copy code"
              onClick={async () => setCopied(await copyText(source.map((l) => l.text).join('\n')))}
              onMouseLeave={() => setCopied(false)}
            >
              {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
              <span className="mx-action-label">{copied ? 'copied' : 'copy'}</span>
            </button>
          </span>
          {/* Beside the buttons, not in them: a button's contents are
              presentational, and a live region inside one is never exposed. */}
          <span className="sr-only" aria-live="polite">
            {linked === 'copied'
              ? 'Link copied to the clipboard'
              : linked === 'failed'
                ? 'Could not copy the link; it is in the address bar'
                : copied
                  ? 'Code copied to the clipboard'
                  : ''}
          </span>
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
