import * as React from 'react'
import type * as THREE from 'three'
import { Group, ShapeGeometry } from 'three'
import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import {
  SCREEN_LAYER_CLASS,
  SCREEN_LAYER_CSS,
  createBackfaceCuller,
  createScreenDragHandoff,
  roundedRectShapeCorners,
  screenDistanceFactor,
  screenLayerClass,
  screenSurfaceStyle,
  type ScreenRadius,
} from '@area-mockups/core'
import {
  createScreenOcclusionTester,
  SCREEN_COVER_HIDDEN,
  SCREEN_COVER_VISIBLE,
} from './occluders'

export type { ScreenRadius }

/**
 * Every DeviceScreen passes this zIndexRange to drei's <Html>: raycast and
 * unoccluded screens layer in the upper half, blending screens in the lower
 * half, with the canvas itself at the midpoint.
 *
 * The range is enormous because drei spreads it LINEARLY over the camera's
 * whole near..far span, and blending screens have to sort against each other
 * by that z-index alone — the DOM is what you actually see through the hole
 * the depth mask cuts, so two overlapping screens stack by z-index, not by
 * the depth buffer. A greeting card's cover and its inside face are ~25 mm
 * apart in a 1000-unit frustum; on drei's default band both rounded to the
 * same integer and the inside face painted straight over the cover. A
 * million steps resolves a few thousandths of a unit, which is finer than any
 * two surfaces on one object. `isolateCanvasStack` below keeps the big
 * numbers from ever reaching the page.
 */
const SCREEN_Z_RANGE: [number, number] = [2_000_000, 0]

/**
 * The z-index drei raises the WebGL canvas to while any 'blending' screen
 * is live (zIndexRange[0] / 2 — OUR range, not drei's default) — blending
 * screen DOM stacks below the canvas, raycast screen DOM above it.
 */
const BLENDING_CANVAS_Z = Math.floor(SCREEN_Z_RANGE[0] / 2)

/**
 * Confine that band to the mockup. Making the element that holds the canvas
 * AND its screens a stacking context keeps them sorting among themselves, and
 * leaves the page outside free to layer over the mockup with ordinary small
 * z-indexes; without it a canvas raised to a million covers the whole page.
 *
 * It has to be the element holding BOTH. drei portals a screen into r3f's
 * event target, which is an ANCESTOR of the canvas's own container, not that
 * container — so isolating the canvas's immediate parent seals the canvas
 * into a subtree whose own z-index is `auto`, and the screens, sitting
 * outside it with a z-index in the millions, calmly layer over the canvas:
 * every screen paints over the hardware from every angle.
 */
function isolateScreenStack(content: HTMLElement, canvas: HTMLCanvasElement): void {
  const host = content.closest(`.${SCREEN_LAYER_CLASS}`)?.parentElement ?? canvas.parentElement
  if (host instanceof HTMLElement && host.style.isolation !== 'isolate') {
    host.style.isolation = 'isolate'
  }
}

/**
 * How far inside the screen's own outline the blending depth mask is held, as
 * a fraction of the screen's shorter side. Covers the antialiasing seam where
 * the mask's edge and the DOM's edge coincide (see `silhouette` below).
 * Exported so a component authoring its OWN `occluderGeometry` can hold the
 * same margin — inward at the outline, outward around any punched hole.
 */
export const SCREEN_MASK_INSET = 0.004

/**
 * Time constant, in seconds, for easing a raycast screen's opacity toward the
 * coverage ramp's verdict. The five sample rays give a coverage that steps in
 * fifths, so a screen grazing an edge can rattle between two steps as the
 * camera moves; easing turns that rattle into a steady mid-fade instead of a
 * strobe. Short enough that a screen passing behind a body still reads as
 * being covered by it rather than dimming on its own schedule.
 */
const FADE_TAU = 0.07

// Staggered retry thresholds for the drei <Html> mount race (see below):
// screens created back-to-back get different frame counts, so their
// remounts land in separate commits instead of re-racing each other.
let retryPhase = 0
function nextRetryThreshold(): number {
  retryPhase = (retryPhase + 1) % 5
  return 6 + retryPhase * 3
}

export interface DeviceScreenProps {
  /** Active display size in world units. */
  width: number
  height: number
  /** Corner rounding of the display in world units. */
  radius: ScreenRadius
  /** CSS pixel width of the virtual display; height follows the panel aspect. */
  resolution: number
  /** Where the display plane sits within the parent device group. */
  position: [number, number, number]
  /**
   * Rotation of the display plane within the device group. Used for landscape
   * orientation: the device body is laid on its side while the screen plane
   * counter-rotates, so the DOM content renders upright with swapped
   * dimensions — exactly like a real device rotating into landscape.
   * Always applied explicitly (never undefined) — react-three-fiber does not
   * reset a property when a prop is simply omitted, which would leave a stale
   * rotation behind when toggling back to portrait.
   */
  rotation?: [number, number, number]
  /** CSS background painted behind the content. */
  background?: string
  /**
   * Let pointer events (clicks, scrolling, typing) reach the content. This is
   * also what picks the occlusion mode — the two are the same choice, because
   * only one of the two modes can put the DOM where a pointer can reach it:
   *
   * - `false` (the default) composites per-pixel against the depth buffer,
   *   which is exact but stacks the DOM UNDER the canvas.
   * - `true` raycasts the enclosure meshes in `occluders` instead, which
   *   keeps the DOM on top and clickable but hides the whole screen at once.
   */
  interactive?: boolean
  /** Hand >10px drags off to the orbit controls; taps still reach the content. */
  dragToRotate?: boolean
  /** Enclosure meshes to raycast against; used only in interactive mode. */
  occluders?: React.RefObject<THREE.Mesh>[]
  /**
   * Force per-pixel blending even when `interactive`, for surfaces raycasting
   * cannot describe — a full vehicle wrap with proud mirrors standing over it,
   * glass seen through a shelter's own frame. Such a surface is never
   * clickable, since blending is what puts its DOM under the canvas.
   */
  blending?: boolean
  /**
   * Custom depth-occluder geometry for blending mode, in world units on the
   * screen plane. Defaults to the screen's own silhouette (`width` x `height`
   * rounded by `radius`), which is what the DOM is clipped to. Pass a shape
   * here when the DOM is clipped to something else again — a livery with the
   * glass carved out, a label with a punched hole — or the extra area masks
   * hardware that should stay visible.
   */
  occluderGeometry?: THREE.BufferGeometry
  /** Extra styles merged onto the screen wrapper. */
  screenStyle?: React.CSSProperties
  /** Device-specific overlay (punch hole, notch…) rendered above the content. */
  overlay?: React.ReactNode
  children?: React.ReactNode
}

/**
 * The live screen shared by every device: real DOM, CSS3D-transformed onto the
 * display glass via drei's `<Html transform>`. The behaviors layered on top —
 * compositor-layer promotion, tap-vs-drag handoff, backface culling — live in
 * `@area-mockups/core` (see `SCREEN_LAYER_CSS`, `createScreenDragHandoff` and
 * `createBackfaceCuller` there); this component is the thin React wiring.
 */
export function DeviceScreen({
  width,
  height,
  radius,
  resolution,
  position,
  rotation = [0, 0, 0],
  background = '#000000',
  interactive = false,
  dragToRotate = true,
  occluders,
  blending = false,
  occluderGeometry,
  screenStyle,
  overlay,
  children,
}: DeviceScreenProps) {
  const gl = useThree((state) => state.gl)

  // The two occlusion modes and interactivity are one decision, not two:
  // blending is pixel-exact but stacks the DOM under the canvas (see the
  // pointer-events override below), so a blending surface can never be
  // clicked, and a clickable surface can only occlude by raycast.
  const usingBlending = blending || !interactive
  const clickable = interactive && !blending

  // The depth mask that makes the canvas transparent over the screen so the
  // DOM beneath shows through. drei's default is a plain rectangle, which on
  // any screen the DOM rounds off — a watch face, a round record label —
  // clears the canvas out past the artwork and the PAGE shows through the
  // corners. Build it from the screen's own silhouette instead, the same
  // numbers `border-radius` is built from. `radius` is spread into scalars so
  // a caller passing a fresh array literal doesn't rebuild it every render.
  const [radiusTL, radiusTR, radiusBR, radiusBL] =
    typeof radius === 'number' ? [radius, radius, radius, radius] : radius
  const silhouette = React.useMemo(() => {
    if (!usingBlending || occluderGeometry) return null
    // Held a hair inside the DOM's own edge. Both edges are antialiased, and
    // where they coincide the mask's partial transparency wins over the DOM's
    // partial opacity and a pixel of PAGE bleeds through all the way round.
    // Insetting keeps the canvas solid under that fade, so the boundary is
    // the DOM's edge over device hardware — the seam reads as the display's
    // own rim rather than a hole. Proportional, so it stays a rim at any zoom.
    const inset = Math.min(width, height) * SCREEN_MASK_INSET
    const shrink = (r: number) => Math.max(0, r - inset)
    return new ShapeGeometry(
      roundedRectShapeCorners(width - inset * 2, height - inset * 2, [
        shrink(radiusTL),
        shrink(radiusTR),
        shrink(radiusBR),
        shrink(radiusBL),
      ]),
      24
    )
  }, [usingBlending, occluderGeometry, width, height, radiusTL, radiusTR, radiusBR, radiusBL])
  React.useEffect(() => () => silhouette?.dispose(), [silhouette])
  const blendGeometry = occluderGeometry ?? silhouette

  // drei's 'blending' mode turns the CANVAS to pointer-events:none so DOM
  // stacked under it stays clickable — which silently kills orbit drags on
  // the empty background. We want the opposite trade for mockups: the
  // canvas keeps ALL input (drag-to-orbit works everywhere) and content
  // behind a blending screen is display-only. Parent layout effects run
  // after the child Html's, so this override wins on mount.
  React.useLayoutEffect(() => {
    if (!usingBlending) return
    gl.domElement.style.pointerEvents = 'auto'
  }, [usingBlending, gl])

  // drei's blending setup is a per-<Html> layout effect that mutates GLOBAL
  // canvas style: blending instances raise the canvas (so their DOM slides
  // under it), but every NON-blending instance resets it back to zIndex
  // null. On a device mixing modes (full-wrap sides on 'blending', rear
  // and plate on raycast), whichever <Html> mounts last wins — and a
  // raycast screen mounting after the sides silently breaks the per-pixel
  // compositing (proud hardware vanishes under the wrap DOM). Re-assert
  // the blending canvas config from the frame loop so it always wins,
  // whatever the mount order.
  const blendingCanvasZ = String(BLENDING_CANVAS_Z)

  // Tap-vs-drag handoff: presses stay with the content, real drags are
  // replayed on the canvas so the orbit controls take over the gesture.
  const dragHandoff = React.useMemo(() => createScreenDragHandoff(() => gl.domElement), [gl])
  React.useEffect(() => () => dragHandoff.dispose(), [dragHandoff])

  // Backface culling for the DOM plane — hide it whenever its normal points
  // away from the camera (CSS backface-visibility can't see drei's chain) —
  // plus multi-sample raycast occlusion against every registered body in the
  // scene: one ray to the center (what drei checks) lets a partially covered
  // screen pierce through chassis edges and neighboring devices.
  const anchorRef = React.useRef<Group>(null!)
  const contentRef = React.useRef<HTMLDivElement>(null!)
  // Retry epoch + bookkeeping for the drei <Html> mount race (see the
  // frame loop): bumping the epoch re-commits the <Html> subtree, which
  // re-runs drei's dependency-less render effect on its existing root.
  const [, setHtmlEpoch] = React.useState(0)
  const retryState = React.useRef({ frames: 0, retries: 0 })
  const retryThreshold = React.useMemo(nextRetryThreshold, [])
  const cullBackface = React.useMemo(() => createBackfaceCuller(), [])
  const occlusionCover = React.useMemo(() => createScreenOcclusionTester(), [])
  const occludeMeshes = usingBlending ? undefined : occluders
  // Current eased opacity of a raycast screen. 1 whenever nothing occludes it,
  // which is every frame in blending mode.
  const fade = React.useRef(1)
  useFrame(({ camera }, delta) => {
    if (usingBlending) {
      const canvas = gl.domElement.style
      if (canvas.zIndex !== blendingCanvasZ) canvas.zIndex = blendingCanvasZ
      if (canvas.position !== 'absolute') canvas.position = 'absolute'
      if (canvas.pointerEvents !== 'auto') canvas.pointerEvents = 'auto'
    }
    // Self-healing for a drei <Html> mount race: Html renders its DOM
    // through its own nested ReactDOM root, and when several screens mount
    // in the same busy commit, all but the first can lose that root's
    // initial flush and stay empty shells forever — a whole side of a bus,
    // or nine of the store's ten panes, simply never appear. drei's render
    // effect has no dependency array, so ANY re-commit of the <Html>
    // subtree calls root.render() again on the existing root and lands the
    // lost content. If our content div hasn't materialized after a few
    // frames, bump a state to force that re-commit (staggered so retrying
    // screens don't all re-race in one commit).
    if (!contentRef.current) {
      const retry = retryState.current
      if (retry.retries < 8 && ++retry.frames >= retryThreshold) {
        retry.frames = 0
        retry.retries += 1
        setHtmlEpoch((epoch) => epoch + 1)
      }
    } else {
      retryState.current.frames = 0
    }
    if (!anchorRef.current || !contentRef.current) return
    const content = contentRef.current
    isolateScreenStack(content, gl.domElement)
    cullBackface(anchorRef.current, content, camera)
    // Raycast mode cannot cover a screen partway — the DOM is one element on
    // top of the canvas — so instead of blinking off the moment a majority of
    // sample rays are blocked, it eases across the coverage ramp and dissolves
    // behind whatever is passing in front of it.
    if (!occludeMeshes?.length) {
      if (fade.current !== 1) {
        fade.current = 1
        content.style.opacity = ''
      }
    } else if (content.style.visibility !== 'hidden') {
      const covered = occlusionCover(anchorRef.current, width, height, occludeMeshes, camera)
      const ramp = (covered - SCREEN_COVER_VISIBLE) / (SCREEN_COVER_HIDDEN - SCREEN_COVER_VISIBLE)
      const target = 1 - Math.min(1, Math.max(0, ramp))
      // Frame-rate independent ease, snapped once it is within a step nobody
      // can see so the opacity stops being rewritten every frame.
      fade.current += (target - fade.current) * (1 - Math.exp(-delta / FADE_TAU))
      if (Math.abs(target - fade.current) < 0.004) fade.current = target
      content.style.opacity = fade.current > 0.995 ? '' : fade.current.toFixed(3)
      // Fully faded is the old all-or-nothing hidden state: take it out of
      // hit-testing and off the compositor rather than leaving an invisible
      // pane over the device's back.
      if (fade.current <= 0.004) content.style.visibility = 'hidden'
    }
    // A hidden screen must never intercept pointers either — user content can
    // re-enable its own `visibility`, which would silently eat drags on the
    // device's back (visibility alone doesn't stop such children hit-testing).
    // Nor may a mostly-faded one: opacity does not stop hit-testing at all.
    const pointerEvents =
      content.style.visibility === 'hidden' || !clickable || fade.current < 0.5 ? 'none' : 'auto'
    if (content.style.pointerEvents !== pointerEvents) {
      content.style.pointerEvents = pointerEvents
    }
  })

  const beginScreenDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    // Never let the initial press reach the orbit controls — taps and clicks
    // belong to the screen content. Real drags are handed off by the core.
    event.stopPropagation()
    if (dragToRotate) dragHandoff.onPointerDown(event.nativeEvent)
  }

  return (
    <group ref={anchorRef} position={position} rotation={rotation}>
      <Html
        transform
        occlude={usingBlending ? 'blending' : undefined}
        geometry={
          usingBlending && blendGeometry ? (
            <primitive object={blendGeometry} attach="geometry" />
          ) : undefined
        }
        distanceFactor={screenDistanceFactor(width, resolution)}
        zIndexRange={SCREEN_Z_RANGE}
        wrapperClass={screenLayerClass(dragToRotate)}
        // Keep drei's inner transform div from hit-testing: pointer handling
        // lives on the content div alone (visible + interactive → auto,
        // hidden → none). Otherwise the invisible bridge div spanning the
        // screen rect eats drags over the device's BACK, so drag-to-rotate
        // dies exactly where the body should be grabbable.
        pointerEvents="none"
      >
        <style>{SCREEN_LAYER_CSS}</style>
        <div
          ref={contentRef}
          onPointerDown={beginScreenDrag}
          style={{
            ...screenSurfaceStyle({
              width,
              height,
              radius,
              resolution,
              background,
              interactive: clickable,
              dragToRotate,
            }),
            ...screenStyle,
          }}
        >
          {children}
          {overlay}
        </div>
      </Html>
    </group>
  )
}
