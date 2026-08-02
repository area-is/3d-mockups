import type { PropDoc } from '@/lib/prop-tables.generated'

/**
 * Turns a documented prop into an editable control.
 *
 * The inspector hand-writes a control for the dozen props every mockup shares.
 * Everything else a component accepts is described only by the prop table in
 * its API page - a name, a type, a default - and that turns out to be enough
 * to build the control from: `boolean` is a switch, `number` a slider,
 * `'a' \| 'b'` a select, `{ width?, height? }` a set of millimetre fields, and
 * a `*Color` string a color well. So the explorer drives those too, and the
 * table stays the single source of truth.
 *
 * A prop with a type this can't read stays a read-only row, exactly as the
 * whole group used to be. That is the deliberate fallback: a new prop lands in
 * the panel documented on the day it is written, and grows a control as soon
 * as its type is one of these.
 */

/** Props with no meaning in a live demo - they stay listed, not editable. */
const CODE_ONLY = new Set(['surfaceStyle', 'className', 'style'])

/** r3f transforms, which the docs describe in prose rather than a type. */
const TRANSFORMS = new Set(['position', 'rotation', 'scale'])

/** Defaults that name no value: required props, and "per variant" style notes. */
const NO_DEFAULT = /^(-|–|—|required|per\b|matches\b|stock\b)/i

export interface Axis {
  key: string
  label: string
}

export type Control =
  | { kind: 'color' }
  | { kind: 'switch' }
  | { kind: 'number'; min: number; max: number; step: number; unit?: string }
  | { kind: 'enum'; options: string[] }
  | { kind: 'vector'; axes: Axis[]; min: number; max: number; step: number }
  | { kind: 'dimensions'; axes: Axis[]; unit: string }
  | { kind: 'camera' }

export interface EditableProp {
  name: string
  doc: PropDoc
  control: Control
  /**
   * What the library does when the prop is left out, when the docs name it.
   * Returning a control to this value clears the prop rather than passing it,
   * so the snippet only ever carries props that change something.
   */
  fallback: unknown
  /** Where the control sits before it is touched - `fallback` when there is one. */
  seed: unknown
}

/* ------------------------------------------------------------------ */
/*  Reading the prop table                                             */
/* ------------------------------------------------------------------ */

const firstNumber = (text: string): number | undefined => {
  const match = text.match(/-?\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : undefined
}

const allNumbers = (text: string): number[] =>
  (text.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)

const hex = (text: string): string | undefined => text.match(/#[0-9a-f]{3,8}/i)?.[0]

/** `'legs' | 'pedestal' | 'frame'` - a union of string literals, or nothing. */
const enumOptions = (type: string): string[] | undefined => {
  if (!/^'[^']*'(\s*\|\s*'[^']*')*$/.test(type.trim())) return undefined
  return [...type.matchAll(/'([^']*)'/g)].map((m) => m[1])
}

/** `{ width?, height?, thickness? }` - the keys of a size object, or nothing. */
const objectKeys = (type: string): string[] | undefined => {
  const body = type.trim().match(/^\{([^}]*)\}$/)?.[1]
  if (!body) return undefined
  const keys = body
    .split(',')
    .map((k) => k.replace('?', '').trim())
    .filter(Boolean)
  return keys.length ? keys : undefined
}

/** Sliders need bounds the table doesn't carry, so the few that exist live here. */
const RANGES: Record<string, { min: number; max: number; step: number; unit?: string }> = {
  openAngle: { min: 0, max: 180, step: 1, unit: '°' },
  foldAngle: { min: 0, max: 90, step: 1, unit: '°' },
  cornerRadius: { min: 0, max: 40, step: 0.5, unit: 'mm' },
  // The only numeric `size`: a TV's diagonal, which its own docs clamp.
  size: { min: 32, max: 98, step: 1, unit: '"' },
}

/** Bounds for a number with no entry above - centered on whatever it defaults to. */
const range = (name: string, fallback: number | undefined) =>
  RANGES[name] ?? { min: 0, max: Math.max(10, (fallback ?? 1) * 4), step: 0.5 }

const XYZ: Axis[] = [
  { key: 'x', label: 'x' },
  { key: 'y', label: 'y' },
  { key: 'z', label: 'z' },
]

/* ------------------------------------------------------------------ */
/*  Inference                                                          */
/* ------------------------------------------------------------------ */

/** The control for one documented prop, or `null` to leave it read-only. */
export function editableProp(doc: PropDoc): EditableProp | null {
  if (CODE_ONLY.has(doc.name)) return null
  const type = doc.type.trim()
  const stated = NO_DEFAULT.test(doc.default.trim()) ? undefined : doc.default.trim()
  const of = (control: Control, fallback: unknown, seed: unknown = fallback): EditableProp => ({
    name: doc.name,
    doc,
    control,
    fallback,
    seed,
  })

  if (doc.name === 'camera') {
    // `[0, 0.5, 7.4], fov 40` - the stage's own camera, as the table writes it.
    // Never a `fallback`: most mockups override it from their object's framing,
    // which is core's own data and not something the explorer can read back, so
    // once the camera is set it is always worth printing.
    const [x = 0, y = 0.5, z = 7.4, fov = 40] = allNumbers(doc.default)
    const note = 'Starts from the stage default, so a mockup that frames itself wider moves on the first edit.'
    return {
      name: doc.name,
      doc: { ...doc, description: `${doc.description} ${note}` },
      control: { kind: 'camera' },
      fallback: undefined,
      seed: { position: [x, y, z], fov },
    }
  }

  if (TRANSFORMS.has(doc.name)) {
    const identity = doc.name === 'scale' ? [1, 1, 1] : [0, 0, 0]
    const bounds =
      doc.name === 'scale'
        ? { min: 0.1, max: 3, step: 0.05 }
        : doc.name === 'rotation'
          ? { min: -3.15, max: 3.15, step: 0.05 }
          : { min: -6, max: 6, step: 0.1 }
    return of({ kind: 'vector', axes: XYZ, ...bounds }, identity)
  }

  if (type === 'boolean') {
    return of({ kind: 'switch' }, stated === 'true')
  }

  if (type === 'number') {
    const fallback = stated === undefined ? undefined : firstNumber(stated)
    const bounds = range(doc.name, fallback)
    // No documented default (a foldable's `openAngle`) starts mid-travel, so
    // the slider has somewhere to go in both directions.
    return of(
      { kind: 'number', ...bounds },
      fallback,
      fallback ?? Math.round((bounds.min + bounds.max) / 2)
    )
  }

  // A union of one - `variant: 'series11'`, the only watch there is - has
  // nothing to choose between, so it stays a documented row rather than
  // becoming a select that cannot change anything.
  const options = enumOptions(type)
  if (options && options.length > 1) {
    return of({ kind: 'enum', options }, stated?.replace(/'/g, '') ?? options[0])
  }

  const keys = objectKeys(type)
  if (keys) {
    // `156×234×27` against `{ width?, height?, thickness? }` - the table writes
    // the default in the type's own key order, so they zip.
    const numbers = stated ? allNumbers(stated) : []
    const value = Object.fromEntries(
      keys.map((key, i) => [key, numbers[i] ?? 100])
    ) as Record<string, number>
    return of(
      { kind: 'dimensions', axes: keys.map((key) => ({ key, label: key })), unit: 'mm' },
      numbers.length === keys.length ? value : undefined,
      value
    )
  }

  if (type === 'string' && /color$/i.test(doc.name)) {
    return of({ kind: 'color' }, hex(doc.default), hex(doc.default) ?? '#8a8f98')
  }

  return null
}

/* ------------------------------------------------------------------ */
/*  Back out to JSX                                                    */
/* ------------------------------------------------------------------ */

export const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** Trim float noise a slider leaves behind: `0.30000000000000004` -> `0.3`. */
const num = (value: number) => String(Math.round(value * 1e4) / 1e4)

const vec = (value: unknown, axes: Axis[]) =>
  axes.map((axis) => num(Number((value as Record<string, number>)[axis.key] ?? 0)))

/** The value of a composite prop, short enough to sit on its collapsed row. */
export function propSummary(prop: EditableProp, value: unknown): string {
  switch (prop.control.kind) {
    case 'vector':
      return (value as number[]).map(num).join(', ')
    case 'dimensions':
      return vec(value, prop.control.axes).join(' × ')
    case 'camera': {
      const { position, fov } = value as { position: number[]; fov: number }
      return `${position.map(num).join(', ')} · ${num(fov)}°`
    }
    default:
      return String(value)
  }
}

/** One prop, written the way it would appear in the snippet. */
export function propAttribute(prop: EditableProp, value: unknown): string {
  const { name, control } = prop
  switch (control.kind) {
    case 'switch':
      return value ? name : `${name}={false}`
    case 'number':
      return `${name}={${num(Number(value))}}`
    case 'color':
    case 'enum':
      return `${name}="${String(value)}"`
    case 'vector': {
      const axis = (value as number[]).map(num)
      // A uniform scale reads as one number, which is how anyone writes it.
      if (name === 'scale' && new Set(axis).size === 1) return `${name}={${axis[0]}}`
      return `${name}={[${axis.join(', ')}]}`
    }
    case 'dimensions':
      return `${name}={{ ${vec(value, control.axes)
        .map((n, i) => `${control.axes[i].key}: ${n}`)
        .join(', ')} }}`
    case 'camera': {
      const { position, fov } = value as { position: number[]; fov: number }
      return `${name}={{ position: [${position.map(num).join(', ')}], fov: ${num(fov)} }}`
    }
  }
}
