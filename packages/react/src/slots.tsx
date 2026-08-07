import * as React from 'react'
import type { RegionSpec } from '@area-3d-mockups/core'

/**
 * Compound-slot machinery: how a mockup's regions become child elements.
 *
 * Region names come from the object's spec in `@area-3d-mockups/core`
 * (`A_FRAME_SIGN_REGIONS` → `<AFrameSign.Front>` / `<AFrameSign.Back>`). Slot
 * components render nothing themselves - the parent mockup collects them from
 * its children with `collectSlots` and feeds each region's content and
 * per-surface settings into the matching `DeviceScreen`.
 *
 * Bare (non-slot) children are shorthand for the primary region - the first
 * region in the spec's list - so the single-surface one-liner stays a
 * one-liner: `<GalaxyMockup><App/></GalaxyMockup>`.
 *
 * Slots must be DIRECT children of the mockup (fragments are flattened). A
 * user component that merely renders a slot element cannot be detected - the
 * slot then renders in place and warns instead of disappearing silently.
 */

// Symbol.for - not a local symbol - so slot detection survives two copies of
// the library on one page (each binding bundles its own core by design).
const REGION = Symbol.for('area-3d-mockups.region')

/**
 * Settings for a live surface, spelled the same wherever you set them: on a
 * mockup or device they are the defaults for every region, on a slot element
 * they override those defaults for that one region.
 *
 * One vocabulary on purpose. `background` and `style` on a mockup already mean
 * the CANVAS's CSS - its page background and its wrapper styles - so a screen's
 * equivalents have to be named apart from them, and naming them apart at only
 * one of the two levels is how `style` ends up meaning two different things
 * depending on which element you hang it off.
 */
export interface SurfaceProps {
  /**
   * CSS background painted behind the region's content, under whatever you
   * render. Defaults to black on lit screens, white on print surfaces.
   *
   * It only shows where your content does NOT paint: a logo on a transparent
   * PNG, a layout shorter than the surface, a rounded card over the corners,
   * the moment before an `<iframe>` loads. Pass full-bleed opaque artwork and
   * you will never see it - which is why changing it often appears to do
   * nothing.
   *
   * Do not set it to `transparent` expecting the hardware to show through.
   * A screen's DOM sits UNDER the canvas, so transparent pixels fall through
   * to the PAGE, and the mockup reads as a hole.
   */
  surfaceBackground?: string
  /**
   * CSS pixel width of the virtual surface; height follows its aspect. Set on
   * a mockup it sizes the primary surface and every other region shares its
   * dpi; set on a slot it sizes that region alone.
   */
  resolution?: number
  /** Extra styles merged onto the region's surface wrapper. */
  surfaceStyle?: React.CSSProperties
}

/** Props of a slot element: its content plus per-surface overrides. */
export interface SlotProps extends SurfaceProps {
  children?: React.ReactNode
}

/**
 * A slot after collection: what the caller passed, plus the region name
 * `collectSlots` stamps on.
 *
 * Deliberately not part of `SlotProps`. That type is the public surface
 * vocabulary a caller writes on `<BookMockup.Spine>`, and it is pinned to
 * exactly `SurfaceProps` + `children` by a type test — `region` is something
 * the library fills in, never something you pass.
 */
export interface CollectedSlot extends SlotProps {
  region?: string
}

export type Slot<P extends SlotProps = SlotProps> = React.FC<P>

// Every bundler replaces `process.env.NODE_ENV` with a literal at build time,
// so this is the only part of `process` the library ever names. Declaring it
// here rather than depending on @types/node keeps Node's globals out of a
// browser package's typecheck - with them in scope `setTimeout` starts
// returning `NodeJS.Timeout` instead of a number. TypeScript 5 resolved the
// name anyway from whatever @types/node a workspace sibling had hoisted;
// TypeScript 6 no longer does.
declare const process: { env: { NODE_ENV?: string } }

function warnDev(message: string): void {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn(`[area-3d-mockups] ${message}`)
  }
}

/**
 * Create one slot component for a region. The component never renders through
 * the normal path - `collectSlots` lifts it out of the children - so its body
 * only runs when the slot was NOT a direct child of its mockup, which is
 * exactly when the user needs a warning.
 */
export function createSlot<P extends SlotProps = SlotProps>(region: string, displayName?: string): Slot<P> {
  const name = displayName ?? region.charAt(0).toUpperCase() + region.slice(1)
  const SlotComponent = (_props: P): React.ReactElement | null => {
    warnDev(
      `<${name}> must be a direct child of its mockup - it was rendered somewhere else, so its content is ignored.`
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

/** What `collectSlots` returns: per region, the props of the slot that filled it. */
export type CollectedSlots<R extends readonly RegionSpec[]> = {
  [K in R[number] as K['name']]?: CollectedSlot
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
 * different mockup) and duplicate slots warn in development - last one wins.
 */
export function collectSlots<const R extends readonly RegionSpec[]>(
  children: React.ReactNode,
  regions: R
): CollectedSlots<R> {
  const specs = new Map(regions.map((region) => [region.name, region]))
  const out: Record<string, SlotProps> = {}
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
          warnDev(`<${String(region)}> is not a region of this mockup - it renders nothing here.`)
          return
        }
        if (out[region]) {
          warnDev(`Duplicate <${spec.label}> slot - the last one wins.`)
        }
        out[region] = node.props as SlotProps
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
        `Both bare children and an explicit ${first.label} slot were given - the explicit slot wins, bare children are ignored.`
      )
    } else {
      out[first.name] = bare
    }
  }

  /*
   * Tag every region with its own name on the way out.
   *
   * `useSurface().region` is documented as telling content which surface it
   * landed on, but no scene component ever passed one, so it was `undefined`
   * for everybody. Naming them here rather than at the ~74 `<DeviceScreen>`
   * call sites keeps the name and the region it belongs to in one place, and
   * `resolveSurface` carries it through to the screen.
   *
   * Only the regions that were actually filled, never every declared region.
   * Absence is load-bearing: a scene component renders a face's live surface
   * only `if (face.slot != null)`, so seeding empty regions would paint a
   * white DOM screen over all six sides of a box and hide the material
   * underneath. The visual check catches exactly this.
   *
   * Done after collection rather than during it because the duplicate-slot and
   * bare-children-vs-explicit-slot warnings above test `out[region]` for
   * presence too.
   */
  const named: Record<string, CollectedSlot> = {}
  for (const [name, props] of Object.entries(out)) {
    named[name] = { ...props, region: name }
  }
  return named as CollectedSlots<R>
}

/** The resolved per-region settings a `DeviceScreen` consumes. */
export interface ResolvedSurface {
  background?: string
  resolution: number
  screenStyle?: React.CSSProperties
  /** Which region this surface is, surfaced to content via `useSurface()`. */
  region?: string
}

/**
 * Merge a slot's per-surface overrides over the mockup-level defaults.
 * `surfaceStyle` merges key-by-key (the slot wins) so a mockup-wide fontFamily
 * survives a slot-level color tweak.
 */
export function resolveSurface(
  slot: CollectedSlot | undefined,
  defaults: SurfaceProps & { resolution: number }
): ResolvedSurface {
  const style =
    slot?.surfaceStyle && defaults.surfaceStyle
      ? { ...defaults.surfaceStyle, ...slot.surfaceStyle }
      : (slot?.surfaceStyle ?? defaults.surfaceStyle)
  return {
    background: slot?.surfaceBackground ?? defaults.surfaceBackground,
    resolution: slot?.resolution ?? defaults.resolution,
    screenStyle: style,
    // Spread straight onto <DeviceScreen region=…>, so every surface reports
    // itself without any call site having to name it twice.
    region: slot?.region,
  }
}
