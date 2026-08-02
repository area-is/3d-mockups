'use client'

import { useState, type ReactNode } from 'react'
import { propSummary, type EditableProp } from './prop-controls'

/**
 * The inspector's widgets: the hand-written rows for the props every mockup
 * shares, plus `PropRow` - one row that renders whatever control
 * `editableProp` inferred for a documented prop.
 */

/* ------------------------------------------------------------------ */
/*  Glyphs                                                             */
/* ------------------------------------------------------------------ */

export function ResetGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M3 3v6h6" />
      <path d="M3.6 15.2A9 9 0 1 0 5.9 5.7L3 9" />
    </svg>
  )
}

/**
 * The inspector's own edge, with the arrow pointing the way it is about to
 * move: `|>` pushes the open panel back out to the right, and the mirrored
 * `<|` pulls it in again.
 */
export function PanelGlyph({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={open ? undefined : { transform: 'scaleX(-1)' }}
      aria-hidden="true"
    >
      <path d="M6 5v14" />
      <path d="M11 7.5 15.5 12 11 16.5" />
    </svg>
  )
}

function ChevronGlyph({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="11"
      height="11"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mx-chevron"
      data-on={open}
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

/** The ⟲ that takes one row back to where the explorer started it. */
function Reset({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="mx-clear" aria-label={`Reset ${label}`} onClick={onClick}>
      <ResetGlyph />
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  The hand-written rows                                              */
/* ------------------------------------------------------------------ */

export function Switch({
  checked,
  onChange,
  label,
  dim,
  note,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  /** Documented, driven, but overridden by another prop right now. */
  dim?: boolean
  note?: string
}) {
  return (
    <div className="mx-row" data-dim={dim} title={note}>
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

export function ColorRow({
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
        {value ? <Reset label={label} onClick={() => onChange('')} /> : null}
      </span>
    </div>
  )
}

export function Segmented<T extends string>({
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
          <button key={option} type="button" data-on={option === value} onClick={() => onChange(option)}>
            {option}
          </button>
        ))}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  The inferred row                                                   */
/* ------------------------------------------------------------------ */

export interface PropRowProps {
  prop: EditableProp
  /** The value in play: what the user set, or where the control starts. */
  value: unknown
  /** Does that differ from where the explorer started this row? */
  set: boolean
  onChange: (value: unknown) => void
  onReset: () => void
}

/**
 * One documented prop, driven by whichever control its type implies.
 *
 * Scalars sit inline. The composites - a transform, a millimetre size, the
 * camera - fold into a disclosure: three or four number fields would crowd
 * every other row off the panel, and they open already holding the value the
 * mockup is using, so nothing moves until a field is typed into.
 */
export function PropRow({ prop, value, set, onChange, onReset }: PropRowProps) {
  const { control, name, doc } = prop
  const reset = set ? <Reset label={name} onClick={onReset} /> : null

  if (control.kind === 'switch') {
    return (
      <div className="mx-row" title={doc.description}>
        <span className="mx-prop">{name}</span>
        <span className="mx-row-controls">
          {reset}
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(value)}
            aria-label={name}
            className="mx-switch"
            data-on={Boolean(value)}
            onClick={() => onChange(!value)}
          >
            <span className="mx-switch-knob" />
          </button>
        </span>
      </div>
    )
  }

  if (control.kind === 'color') {
    const hex = String(value)
    return (
      <div className="mx-row" title={doc.description}>
        <span className="mx-prop">{name}</span>
        <span className="mx-row-controls">
          <span className="mx-hex">{hex}</span>
          <input
            type="color"
            aria-label={name}
            className="mx-color"
            value={hex}
            onChange={(e) => onChange(e.target.value)}
          />
          {reset}
        </span>
      </div>
    )
  }

  if (control.kind === 'number') {
    return (
      <div className="mx-row" title={doc.description}>
        <span className="mx-prop">{name}</span>
        <span className="mx-row-controls">
          <input
            type="range"
            className="mx-range"
            aria-label={name}
            min={control.min}
            max={control.max}
            step={control.step}
            value={Number(value)}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <span className="mx-hex">
            {Number(value)}
            {control.unit}
          </span>
          {reset}
        </span>
      </div>
    )
  }

  if (control.kind === 'enum') {
    return (
      <div className="mx-row" title={doc.description}>
        <span className="mx-prop">{name}</span>
        <span className="mx-row-controls">
          <select
            className="mx-select"
            aria-label={name}
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
          >
            {control.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {reset}
        </span>
      </div>
    )
  }

  return <FieldsRow prop={prop} value={value} reset={reset} onChange={onChange} />
}

/** A composite prop: a summary line that folds open onto its number fields. */
function FieldsRow({
  prop,
  value,
  reset,
  onChange,
}: {
  prop: EditableProp
  value: unknown
  reset: ReactNode
  onChange: (value: unknown) => void
}) {
  const { control, name, doc } = prop
  const [open, setOpen] = useState(false)

  // `position` is [x, y, z]; `size` is { width, height }; `camera` is both at
  // once. Reading and writing them through one flat field list keeps the three
  // shapes off this component.
  const fields: { key: string; label: string; value: number; unit?: string }[] =
    control.kind === 'vector'
      ? control.axes.map((axis, i) => ({ ...axis, value: (value as number[])[i] ?? 0 }))
      : control.kind === 'dimensions'
        ? control.axes.map((axis) => ({
            ...axis,
            value: (value as Record<string, number>)[axis.key] ?? 0,
            unit: control.unit,
          }))
        : [
            ...['x', 'y', 'z'].map((key, i) => ({
              key,
              label: key,
              value: (value as { position: number[] }).position[i] ?? 0,
            })),
            { key: 'fov', label: 'fov', value: (value as { fov: number }).fov, unit: '°' },
          ]

  const write = (index: number, next: number) => {
    if (control.kind === 'vector') {
      const axes = [...(value as number[])]
      axes[index] = next
      onChange(axes)
    } else if (control.kind === 'dimensions') {
      onChange({ ...(value as Record<string, number>), [fields[index].key]: next })
    } else {
      const camera = value as { position: number[]; fov: number }
      if (fields[index].key === 'fov') onChange({ ...camera, fov: next })
      else {
        const position = [...camera.position]
        position[index] = next
        onChange({ ...camera, position })
      }
    }
  }

  // Millimetres step whole; world units and a camera pose want finer.
  const step = control.kind === 'vector' ? control.step : control.kind === 'camera' ? 0.1 : 1

  return (
    <div className="mx-fields-row">
      <div className="mx-row">
        <button
          type="button"
          className="mx-disclosure"
          aria-expanded={open}
          title={doc.description}
          onClick={() => setOpen((o) => !o)}
        >
          <ChevronGlyph open={open} />
          <span className="mx-prop">{name}</span>
        </button>
        <span className="mx-row-controls">
          <span className="mx-hex">{propSummary(prop, value)}</span>
          {reset}
        </span>
      </div>
      {open ? (
        <div
          className="mx-fields"
          // Two fields sit side by side, three fill the row, and the camera's
          // four break as an x/y/z row with `fov` under it.
          style={{ gridTemplateColumns: `repeat(${Math.min(fields.length, 3)}, minmax(0, 1fr))` }}
        >
          {fields.map((field, i) => (
            <label key={field.key} className="mx-field">
              <span>
                {field.label}
                {field.unit ? <em>{field.unit}</em> : null}
              </span>
              <input
                type="number"
                className="mx-number"
                aria-label={`${name} ${field.label}`}
                step={step}
                value={field.value}
                onChange={(e) => write(i, Number(e.target.value))}
              />
            </label>
          ))}
        </div>
      ) : null}
    </div>
  )
}
