import * as React from 'react'
import type * as THREE from 'three'
import { Group, ShapeGeometry } from 'three'
import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import {
  SCREEN_LAYER_CLASS,
  SCREEN_LAYER_CSS,
  createBackfaceCuller,
  roundedRectShapeCorners,
  screenDistanceFactor,
  screenSurfaceStyle,
  type ScreenRadius,
} from '@area-mockups/core'

export type { ScreenRadius }

/**
 * Every DeviceScreen passes this zIndexRange to drei's <Html>: screens layer
 * in the lower half of the band, with the canvas itself at the midpoint, so
 * their DOM always composites UNDER the canvas.
 *
 * The range is enormous because drei spreads it LINEARLY over the camera's
 * whole near..far span, and screens have to sort against each other by that
 * z-index alone — the DOM is what you actually see through the hole the depth
 * mask cuts, so two overlapping screens stack by z-index, not by the depth
 * buffer. A greeting card's cover and its inside face are ~25 mm apart in a
 * 1000-unit frustum; on drei's default band both rounded to the same integer
 * and the inside face painted straight over the cover. A million steps
 * resolves a few thousandths of a unit, which is finer than any two surfaces
 * on one object. `isolateScreenStack` below keeps the big numbers from ever
 * reaching the page.
 */
const SCREEN_Z_RANGE: [number, number] = [2_000_000, 0]

/**
 * The z-index drei raises the WebGL canvas to while a screen is live
 * (zIndexRange[0] / 2 — OUR range, not drei's default), putting every screen's
 * DOM below the canvas.
 */
const BLENDING_CANVAS_Z = Math.floor(SCREEN_Z_RANGE[0] / 2)

/**
 * Confine that band to the mockup. Making the element that holds the canvas
 * AND its screens a stacking context keeps them sorting among themselves, and
 * leaves the page outside free to layer over the mockup with ordinary small
 * z-indexes; without it a canvas raised to a million covers the whole page.
 *
 * It has to be the element holding BOTH, so it is derived as their nearest
 * common ancestor rather than guessed at. drei portals a screen into r3f's
 * event target, which is an ANCESTOR of the canvas's own container, not that
 * container — isolate the canvas's immediate parent by mistake and the canvas
 * is sealed into a subtree whose own z-index is `auto`, while the screens,
 * sitting outside it with a z-index in the millions, calmly layer over it:
 * every screen paints over the hardware from every angle.
 *
 * The ancestor is re-derived every frame and the isolation MOVES with it,
 * because the tree it is read from is not stable at mount: drei portals into
 * `portal ?? events.connected ?? gl.domElement.parentNode`, and on a busy
 * commit `events.connected` can still be unset, so the first frames put the
 * screen INSIDE the canvas's own container. Isolate that and leave it
 * isolated, and once r3f connects and drei re-portals the screen out to the
 * event target, the canvas is sealed in a z-index:auto subtree with every
 * screen stacked above it — the failure this whole function exists to
 * prevent, arrived at from the other direction. Only isolation this function
 * applied is ever released (marked with `dataset.areaMockupsIsolated`), so a
 * page that isolates the host itself keeps it.
 */
const ISOLATED_FLAG = 'areaMockupsIsolated'

function isolateScreenStack(content: HTMLElement, canvas: HTMLCanvasElement): HTMLElement | null {
  const above = new Set<HTMLElement>()
  for (let node = canvas.parentElement; node; node = node.parentElement) above.add(node)
  let host = content.parentElement
  while (host && !above.has(host)) host = host.parentElement
  // Never reach past the mockup's own wrapper: <body> and <html> are the page,
  // and they are the root stacking context already, so there is nothing there
  // to confine the band to.
  if (!host || host === document.body || host === document.documentElement) return null
  if (host.style.isolation !== 'isolate') {
    host.style.isolation = 'isolate'
    host.dataset[ISOLATED_FLAG] = ''
  }
  return host
}

function releaseScreenStack(host: HTMLElement | null): void {
  if (host && host.dataset[ISOLATED_FLAG] !== undefined) {
    host.style.isolation = ''
    delete host.dataset[ISOLATED_FLAG]
  }
}

/**
 * How far inside the screen's own outline the depth mask is held, as a
 * fraction of the screen's shorter side. Covers the antialiasing seam where
 * the mask's edge and the DOM's edge coincide (see `silhouette` below).
 * Exported so a component authoring its OWN `occluderGeometry` can hold the
 * same margin — inward at the outline, outward around any punched hole.
 */
export const SCREEN_MASK_INSET = 0.004

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
   * Custom depth-occluder geometry, in world units on the screen plane.
   * Defaults to the screen's own silhouette (`width` x `height` rounded by
   * `radius`), which is what the DOM is clipped to. Pass a shape here when the
   * DOM is clipped to something else again — a livery with the glass carved
   * out, a label with a punched hole — or the extra area masks hardware that
   * should stay visible.
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
 * display glass via drei's `<Html transform>`, composited per-pixel against the
 * depth buffer so hardware in front of the screen covers it exactly.
 *
 * Screens are decorative — the DOM stacks under the canvas, which is what makes
 * that per-pixel masking possible and what keeps every pointer gesture with the
 * orbit controls. Content stays live all the same: state and effects run,
 * `<video>` plays, an `<iframe>` loads.
 *
 * The behaviors layered on top — compositor-layer promotion, backface culling —
 * live in `@area-mockups/core` (see `SCREEN_LAYER_CSS` and
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
  occluderGeometry,
  screenStyle,
  overlay,
  children,
}: DeviceScreenProps) {
  const gl = useThree((state) => state.gl)

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
    if (occluderGeometry) return null
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
  }, [occluderGeometry, width, height, radiusTL, radiusTR, radiusBR, radiusBL])
  React.useEffect(() => () => silhouette?.dispose(), [silhouette])
  const blendGeometry = occluderGeometry ?? silhouette

  // drei's 'blending' mode turns the CANVAS to pointer-events:none so DOM
  // stacked under it stays clickable — which silently kills orbit drags on
  // the empty background. Mockups want the opposite trade: the canvas keeps
  // ALL input, so drag-to-orbit works everywhere, over the screen included.
  // Parent layout effects run after the child Html's, so this override wins
  // on mount.
  React.useLayoutEffect(() => {
    gl.domElement.style.pointerEvents = 'auto'
  }, [gl])

  // drei's blending setup is a per-<Html> layout effect that mutates GLOBAL
  // canvas style, and r3f can reconnect and re-stamp it. Re-assert the
  // config from the frame loop so it always holds, whatever the mount order.
  const blendingCanvasZ = String(BLENDING_CANVAS_Z)

  // Backface culling for the DOM plane — hide it whenever its normal points
  // away from the camera (CSS backface-visibility can't see drei's chain).
  const anchorRef = React.useRef<Group>(null!)
  const contentRef = React.useRef<HTMLDivElement>(null!)
  // Retry epoch + bookkeeping for the drei <Html> mount race (see the
  // frame loop): bumping the epoch re-commits the <Html> subtree, which
  // re-runs drei's dependency-less render effect on its existing root.
  const [, setHtmlEpoch] = React.useState(0)
  const retryState = React.useRef({ frames: 0, retries: 0 })
  const retryThreshold = React.useMemo(nextRetryThreshold, [])
  // The stacking context currently confining the z-index band, so a host this
  // screen isolated before the tree settled can be released (see
  // isolateScreenStack) rather than left behind trapping the canvas.
  // Not released on unmount: several screens share one host, so the last one
  // to leave would strip the isolation the others still need and the page
  // would flash a million-z canvas over itself for the frame it takes them to
  // put it back. A stray `isolation` on a wrapper that held a mockup is inert.
  const isolatedHost = React.useRef<HTMLElement | null>(null)
  const cullBackface = React.useMemo(() => createBackfaceCuller(), [])
  useFrame(({ camera }) => {
    const canvas = gl.domElement.style
    if (canvas.zIndex !== blendingCanvasZ) canvas.zIndex = blendingCanvasZ
    if (canvas.position !== 'absolute') canvas.position = 'absolute'
    if (canvas.pointerEvents !== 'auto') canvas.pointerEvents = 'auto'
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
    const host = isolateScreenStack(content, gl.domElement)
    if (host !== isolatedHost.current) {
      releaseScreenStack(isolatedHost.current)
      isolatedHost.current = host
    }
    cullBackface(anchorRef.current, content, camera)
  })

  return (
    <group ref={anchorRef} position={position} rotation={rotation}>
      <Html
        transform
        occlude="blending"
        geometry={blendGeometry ? <primitive object={blendGeometry} attach="geometry" /> : undefined}
        distanceFactor={screenDistanceFactor(width, resolution)}
        zIndexRange={SCREEN_Z_RANGE}
        wrapperClass={SCREEN_LAYER_CLASS}
        // Keep drei's inner transform div from hit-testing. It spans the
        // screen rect and would otherwise sit in front of user content that
        // legitimately wants to paint over the mockup.
        pointerEvents="none"
      >
        <style>{SCREEN_LAYER_CSS}</style>
        <div
          ref={contentRef}
          style={{
            ...screenSurfaceStyle({ width, height, radius, resolution, background }),
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
