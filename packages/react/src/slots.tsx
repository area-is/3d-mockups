import * as React from 'react'
import type { RegionSpec } from '@area-mockups/core'

/**
 * Compound-slot machinery: how a mockup's regions become child elements.
 *
 * Region names come from the object's spec in `@area-mockups/core`
 * (`A_FRAME_SIGN_REGIONS` → `<AFrameSign.Front>` / `<AFrameSign.Back>`). Slot
 * components render nothing themselves — the parent mockup collects them from
 * its children with `collectSlots` and feeds each region's content and
 * per-surface settings into the matching `DeviceScreen`.
 *
 * Bare (non-slot) children are shorthand for the primary region — the first
 * region in the spec's list — so the single-surface one-liner stays a
 * one-liner: `<PhoneMockup><App/></PhoneMockup>`.
 *
 * Slots must be DIRECT children of the mockup (fragments are flattened). A
 * user component that merely renders a slot element cannot be detected — the
 * slot then renders in place and warns instead of disappearing silently.
 */

// Symbol.for — not a local symbol — so slot detection survives two copies of
// the library on one page (each binding bundles its own core by design).
const REGION = Symbol.for('area-mockups.region')

/** Per-surface settings, available on every slot element. */
export interface SurfaceProps {
  /** CSS background painted behind this region's content. */
  background?: string
  /** CSS pixel width of this region's virtual surface. */
  resolution?: number
  /** Let pointer events (clicks, scrolling, typing) reach this region's content. */
  interactive?: boolean
  /** Hand >10px drags off to the orbit controls; taps still reach the content. */
  dragToRotate?: boolean
  /** Extra styles merged onto this region's surface wrapper. */
  style?: React.CSSProperties
}

/**
 * Mockup-level defaults for every region's surface. A slot's own
 * `SurfaceProps` win over these for that region.
 */
export interface SurfaceDefaults {
  /** CSS background painted behind each region's content. */
  surfaceBackground?: string
  /** CSS pixel width of the (primary) virtual surface; regions share its dpi. */
  resolution?: number
  /** Let pointer events (clicks, scrolling, typing) reach region content. */
  interactive?: boolean
  /** Hand >10px drags off to the orbit controls; taps still reach the content. */
  dragToRotate?: boolean
  /** Extra styles merged onto each region's surface wrapper. */
  surfaceStyle?: React.CSSProperties
}

/** Props of a slot element: its content plus per-surface overrides. */
export interface SlotProps extends SurfaceProps {
  children?: React.ReactNode
}

export type Slot<P extends SlotProps = SlotProps> = React.FC<P>

function warnDev(message: string): void {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn(`[area-mockups] ${message}`)
  }
}

/**
 * Create one slot component for a region. The component never renders through
 * the normal path — `collectSlots` lifts it out of the children — so its body
 * only runs when the slot was NOT a direct child of its mockup, which is
 * exactly when the user needs a warning.
 */
export function createSlot<P extends SlotProps = SlotProps>(region: string, displayName?: string): Slot<P> {
  const name = displayName ?? region.charAt(0).toUpperCase() + region.slice(1)
  const SlotComponent = (_props: P): React.ReactElement | null => {
    warnDev(
      `<${name}> must be a direct child of its mockup — it was rendered somewhere else, so its content is ignored.`
    )
    return null
  }
  SlotComponent.displayName = name
  ;(SlotComponent as unknown as Record<symbol, string>)[REGION] = region
  return SlotComponent
}

/** PascalCase slot components for a spec's region list, keyed `front` → `Front`. */
export type SlotsFor<R extends readonly RegionSpec[]> = {
  [K in R[number] as Capitalize<K['name']>]: Slot
}

/** Build the compound-slot record for a region list from core. */
export function createSlots<const R extends readonly RegionSpec[]>(regions: R): SlotsFor<R> {
  const out: Record<string, Slot> = {}
  for (const region of regions) {
    out[region.name.charAt(0).toUpperCase() + region.name.slice(1)] = createSlot(region.name)
  }
  return out as SlotsFor<R>
}

/** What `collectSlots` returns: per region, its slot props (an array if the region repeats). */
export type CollectedSlots<R extends readonly RegionSpec[]> = {
  [K in R[number] as K['name']]?: K['repeats'] extends true ? SlotProps[] : SlotProps
}

function regionOf(type: unknown): string | undefined {
  return typeof type === 'function' || (typeof type === 'object' && type !== null)
    ? (type as Record<symbol, string | undefined>)[REGION]
    : undefined
}

/**
 * Split a mockup's children into regions. Slot elements land under their
 * region name; everything else is bare content and lands in the primary
 * (first-listed) region. Fragments are flattened; unknown slots (a slot of a
 * different mockup) and duplicate non-repeating slots warn in development —
 * last one wins.
 */
export function collectSlots<const R extends readonly RegionSpec[]>(
  children: React.ReactNode,
  regions: R
): CollectedSlots<R> {
  const specs = new Map(regions.map((region) => [region.name, region]))
  const out: Record<string, SlotProps | SlotProps[]> = {}
  const primary: React.ReactNode[] = []

  const visit = (node: React.ReactNode): void => {
    if (node == null || typeof node === 'boolean') return
    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }
    if (React.isValidElement(node)) {
      if (node.type === React.Fragment) {
        visit((node.props as { children?: React.ReactNode }).children)
        return
      }
      const region = regionOf(node.type)
      if (region !== undefined) {
        const spec = specs.get(region)
        if (!spec) {
          warnDev(`<${String(region)}> is not a region of this mockup — it renders nothing here.`)
          return
        }
        const props = node.props as SlotProps
        if (spec.repeats) {
          ;((out[region] ??= []) as SlotProps[]).push(props)
        } else {
          if (out[region]) {
            warnDev(`Duplicate <${spec.label}> slot — the last one wins.`)
          }
          out[region] = props
        }
        return
      }
    }
    primary.push(node)
  }
  visit(children)

  const first = regions[0]
  if (primary.length > 0 && first) {
    const bare: SlotProps = {
      // Re-parent via createElement varargs so React never sees a keyless
      // array literal it would warn about.
      children: primary.length === 1 ? primary[0] : React.createElement(React.Fragment, null, ...primary),
    }
    if (out[first.name]) {
      warnDev(
        `Both bare children and an explicit ${first.label} slot were given — the explicit slot wins, bare children are ignored.`
      )
    } else {
      out[first.name] = first.repeats ? [bare] : bare
    }
  }

  return out as CollectedSlots<R>
}

/** The resolved per-region settings a `DeviceScreen` consumes. */
export interface ResolvedSurface {
  background?: string
  resolution: number
  interactive: boolean
  dragToRotate: boolean
  screenStyle?: React.CSSProperties
}

/**
 * Merge a slot's per-surface overrides over the mockup-level defaults.
 * `style` merges key-by-key (the slot wins) so a mockup-wide fontFamily
 * survives a slot-level color tweak.
 */
export function resolveSurface(
  slot: SlotProps | undefined,
  defaults: {
    background: string | undefined
    resolution: number
    interactive: boolean
    dragToRotate: boolean
    style: React.CSSProperties | undefined
  }
): ResolvedSurface {
  const style =
    slot?.style && defaults.style ? { ...defaults.style, ...slot.style } : (slot?.style ?? defaults.style)
  return {
    background: slot?.background ?? defaults.background,
    resolution: slot?.resolution ?? defaults.resolution,
    interactive: slot?.interactive ?? defaults.interactive,
    dragToRotate: slot?.dragToRotate ?? defaults.dragToRotate,
    screenStyle: style,
  }
}
