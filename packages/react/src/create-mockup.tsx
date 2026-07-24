import * as React from 'react'
import { framedShadowY, type MockupFraming } from '@area-mockups/core'
import { MockupCanvas, type MockupCanvasProps } from './mockup-canvas'
import { FloatGroup } from './float-group'
import type { Slot, SlotProps } from './slots'

/**
 * The one-liner factory: canvas + object + per-object framing in one
 * component. Every `*Mockup` is `createMockup(scene component, its framing
 * from core)` — the factory owns the split between stage props and object
 * props, so an object can grow a prop without any wrapper edits, and
 * transforms (`position`, `rotation`, `scale`) flow straight through to the
 * object group.
 */

type CanvasOnlyProps = Omit<MockupCanvasProps, 'children'>

// The full, finite set of stage props. Everything NOT in this list is an
// object prop and is forwarded to the scene component wholesale.
const CANVAS_KEYS: ReadonlySet<string> = new Set([
  'controls',
  'autoRotate',
  'autoRotateSpeed',
  'freeRotation',
  'zoom',
  'fullscreen',
  'shadows',
  'shadowY',
  'environment',
  'background',
  'camera',
  'dpr',
  'className',
  'style',
] satisfies (keyof CanvasOnlyProps)[])

/** Props of a generated mockup: the stage's, the object's, plus `float`. */
export type MockupProps<P> = CanvasOnlyProps &
  P & {
    /** Gentle floating idle animation. */
    float?: boolean
  }

export interface CreateMockupOptions<P, S extends Record<string, Slot<SlotProps>>> {
  /** The scene component (device or object) the mockup stages. */
  object: React.ComponentType<P>
  /** Stage framing from the object's core spec (camera, shadow ground line, float). */
  framing?: MockupFraming<P>
  /** The object's compound slots, re-attached to the mockup (`Mockup.Front`…). */
  slots?: S
  /** Component name shown in React devtools. */
  displayName?: string
}

export function createMockup<P extends object, S extends Record<string, Slot<SlotProps>> = Record<never, never>>({
  object: ObjectComponent,
  framing,
  slots,
  displayName,
}: CreateMockupOptions<P, S>): React.FC<MockupProps<P>> & S {
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
  return Object.assign(Mockup as React.FC<MockupProps<P>>, slots ?? ({} as S))
}
