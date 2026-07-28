import * as React from 'react'
import {
  describeMockup,
  framedShadowY,
  type MeasurableMockup,
  type MockupFraming,
  type MockupInfo,
  type MockupKind,
  type MockupPropsMap,
  type RegionSpec,
} from '@area-3d-mockups/core'
import { MockupCanvas, type MockupCanvasProps } from './mockup-canvas'
import { FloatGroup } from './float-group'
import type { Slot, SlotProps } from './slots'

/**
 * The one-liner factory: canvas + object + per-object framing in one
 * component. Every `*Mockup` is `createMockup(scene component, its framing
 * from core)` - the factory owns the split between stage props and object
 * props, so an object can grow a prop without any wrapper edits, and
 * transforms (`position`, `rotation`, `scale`) flow straight through to the
 * object group.
 */

type CanvasOnlyProps = Omit<MockupCanvasProps, 'children'>

// The full, finite set of stage props. Everything NOT in this list is an
// object prop and is forwarded to the scene component wholesale.
//
// This is the ROUTING list, deliberately wider than the TYPE below: a prop
// only `MockupCanvas` advertises still reaches the canvas rather than being
// spread onto a mesh, so a JavaScript caller who reaches for one gets the
// behavior instead of a three.js warning.
const CANVAS_KEYS: ReadonlySet<string> = new Set([
  'controls',
  'autoRotate',
  'autoRotateSpeed',
  'freeRotation',
  'zoom',
  'fullscreen',
  'shadows',
  'shadowY',
  'background',
  'camera',
  'dpr',
  'className',
  'style',
] satisfies (keyof CanvasOnlyProps)[])

/**
 * The stage props a one-liner mockup advertises: the ones that change what the
 * mockup LOOKS like on the page, or what a visitor can do with it.
 *
 * The rest of `MockupCanvasProps` tunes the rendering machinery rather than the
 * picture - `freeRotation` (a niche orbit constraint), `shadowY` (framing math
 * the mockup already derives from its core spec) and `dpr` (a GPU-load clamp
 * that is already right). Leaving those off this type keeps a mockup's
 * autocomplete to decisions worth making; compose `<MockupCanvas>` directly
 * when you want the rest.
 */
type MockupStageProps = Pick<
  CanvasOnlyProps,
  | 'controls'
  | 'autoRotate'
  | 'autoRotateSpeed'
  | 'zoom'
  | 'fullscreen'
  | 'shadows'
  | 'background'
  | 'camera'
  | 'className'
  | 'style'
>

/** Props of a generated mockup: the staging ones, the object's, plus `float`. */
export type MockupProps<P> = MockupStageProps &
  P & {
    /** Gentle floating idle animation. */
    float?: boolean
  }

export interface CreateMockupOptions<P, S extends Record<string, Slot<SlotProps>>, K extends MockupKind> {
  /** The scene component (device or object) the mockup stages. */
  object: React.ComponentType<P>
  /**
   * The core registry key this mockup measures under. Supplied together with
   * `regions` and `metrics`, it attaches `.info()` and `.regions` to the
   * component - see `MockupStatics`.
   */
  kind?: K
  /** The object's region list from core, surfaced as `Mockup.regions`. */
  regions?: readonly RegionSpec[]
  /**
   * The object's own `*_METRICS` from core. Passed in rather than looked up by
   * `kind` on purpose: a registry lookup would make every mockup reference
   * every spec module, so importing one component would pull in all of them.
   */
  metrics?: MeasurableMockup<MockupPropsMap[K]>['metrics']
  /** Stage framing from the object's core spec (camera, shadow ground line, float). */
  framing?: MockupFraming<P>
  /** The object's compound slots, re-attached to the mockup (`Mockup.Front`…). */
  slots?: S
  /** Component name shown in React devtools. */
  displayName?: string
}

/**
 * The measurement statics a mockup carries when `createMockup` is given a
 * `kind` - the same answers `mockupInfo` gives, reachable from the component
 * you already imported.
 *
 * ```tsx
 * GalaxyMockup.info({ variant: 's26ultra' }).regions.screen.px  // { width: 384, height: 833 }
 * BookMockup.regions // [{ name: 'cover', label: 'Front cover' }, …]
 * ```
 */
export interface MockupStatics<K extends MockupKind> {
  /** Measure this mockup at the given props, without rendering it. */
  info: (props?: MockupPropsMap[K]) => MockupInfo
  /** The live regions this mockup exposes, in declaration order. */
  regions: readonly RegionSpec[]
}

export function createMockup<
  P extends object,
  S extends Record<string, Slot<SlotProps>> = Record<never, never>,
  K extends MockupKind = MockupKind,
>({
  object: ObjectComponent,
  kind,
  regions,
  metrics,
  framing,
  slots,
  displayName,
}: CreateMockupOptions<P, S, K>): React.FC<MockupProps<P>> & S & Partial<MockupStatics<K>> {
  function Mockup(props: MockupProps<P>) {
    const { float = false, ...rest } = props
    const canvasProps: Record<string, unknown> = {}
    const objectProps: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(rest)) {
      ;(CANVAS_KEYS.has(key) ? canvasProps : objectProps)[key] = value
    }

    const scene = <ObjectComponent {...(objectProps as P)} />
    const stage = canvasProps as Partial<CanvasOnlyProps>
    const shadowY = stage.shadowY ?? (framing ? framedShadowY(framing, objectProps as P, float) : undefined)
    const camera =
      stage.camera ??
      (framing?.camera
        ? { position: [...framing.camera.position] as [number, number, number], fov: framing.camera.fov }
        : undefined)

    return (
      <MockupCanvas {...stage} camera={camera} shadowY={shadowY}>
        {float ? <FloatGroup intensity={framing?.floatIntensity}>{scene}</FloatGroup> : scene}
      </MockupCanvas>
    )
  }
  Mockup.displayName = displayName ?? `${ObjectComponent.displayName ?? ObjectComponent.name}Mockup`
  const statics =
    kind === undefined || metrics === undefined
      ? {}
      : {
          info: (infoProps?: MockupPropsMap[K]) =>
            describeMockup({ kind, regions: regions ?? [], metrics }, infoProps),
          regions: regions ?? [],
        }
  return Object.assign(Mockup as React.FC<MockupProps<P>>, slots ?? ({} as S), statics)
}
