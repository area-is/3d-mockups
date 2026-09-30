import * as React from 'react'
import type * as THREE from 'three'
import { Group, ShapeGeometry } from 'three'
import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { FiberProvider, useContextBridge } from 'its-fine'
import {
  SCREEN_LAYER_CLASS,
  SCREEN_LAYER_CSS,
  createBackfaceCuller,
  createCaptureHolds,
  roundedRectShapeCorners,
  screenCssHeight,
  screenDistanceFactor,
  screenRasterScale,
  screenSurfaceStyle,
  type ScreenRadius,
} from '../core'
import { SurfaceProvider } from './use-surface'
import { StageContext } from '../stage-context'

export type { ScreenRadius }

/**
 * Every DeviceScreen passes this zIndexRange to drei's <Html>: screens layer
 * in the lower half of the band, with the canvas itself at the midpoint, so
 * their DOM always composites UNDER the canvas.
 *
 * The range is enormous because drei spreads it LINEARLY over the camera's
 * whole near..far span, and screens have to sort against each other by that
 * z-index alone - the DOM is what you actually see through the hole the depth
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
 * (zIndexRange[0] / 2 - OUR range, not drei's default), putting every screen's
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
 * container - isolate the canvas's immediate parent by mistake and the canvas
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
 * screen stacked above it - the failure this whole function exists to
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
 * same margin - inward at the outline, outward around any punched hole.
 */
export const SCREEN_MASK_INSET = 0.004

/*
 * A stable key per element drei portals a screen into, for the <Html> below.
 *
 * drei keeps ONE wrapper element for the life of an <Html>, and when its
 * target changes it unmounts that wrapper's React root and creates a new root
 * on the same element. Every canvas changes the target once: drei reads
 * `events.connected` before r3f's Provider has connected the events, so a
 * screen portals into the canvas's container first and into the event target
 * a moment later. That was harmless while the old root finished unmounting on
 * the spot. @react-three/fiber 9.8 mounts the scene inside <Canvas>'s own
 * layout effect - inside React DOM's commit - where `root.unmount()` cannot
 * flush, so the old root's teardown commits AFTER the new root has rendered
 * the screen, and clearing "its" container wipes the live screen out from
 * under the new root, which never puts it back: a blank screen, for good.
 * Keying the <Html> by its target makes a new target a new <Html>, with a
 * fresh wrapper for the new root, so the late teardown only empties the old,
 * detached one.
 */
const portalTargetKeys = new WeakMap<object, number>()
let nextPortalTargetKey = 0
function portalTargetKey(target: object | null | undefined): number {
  if (!target) return 0
  let key = portalTargetKeys.get(target)
  if (key === undefined) portalTargetKeys.set(target, (key = ++nextPortalTargetKey))
  return key
}

// Staggered retry thresholds for the drei <Html> mount race (see below):
// screens created back-to-back get different frame counts, so their
// remounts land in separate commits instead of re-racing each other.
let retryPhase = 0
function nextRetryThreshold(): number {
  retryPhase = (retryPhase + 1) % 5
  return 6 + retryPhase * 3
}

/**
 * The screen-layer stylesheet, rendered as a React 19 hoistable `<style>`:
 * `href` + `precedence` make React lift it into the document head once and
 * dedupe every other copy, instead of each screen injecting its own element
 * (a carousel of eighteen screens carried eighteen identical stylesheets).
 */
const SCREEN_LAYER_STYLE_HREF = 'react-3d-mockups-screen-layer'

// Typed locally: this is browser code and does not take node's types.
declare const process: { env: { NODE_ENV?: string } }

/**
 * Written as the literal `process.env.NODE_ENV` so every bundler can inline it
 * and drop the warning below from production builds; the try covers an
 * unbundled page, where `process` does not exist and nothing is dev.
 */
const DEV = (() => {
  try {
    return process.env.NODE_ENV !== 'production'
  } catch {
    return false
  }
})()
let warnedOpaque = false

/**
 * Development warning for the one canvas setup that silently hides every
 * screen. Screens are DOM stacked UNDER the canvas and seen through the pixels
 * it leaves transparent; a canvas that paints its own background paints over
 * all of them, and nothing errors - the devices just render with black glass.
 * `MockupCanvas` is transparent unless told otherwise, so this is almost
 * always a `<Canvas>` the caller owns (see "Composing scenes").
 */
function warnIfOpaque(gl: THREE.WebGLRenderer, scene: THREE.Scene): void {
  if (!DEV || warnedOpaque) return
  const reason =
    gl.getContextAttributes()?.alpha === false
      ? '`gl.alpha` is false'
      : scene.background
        ? '`scene.background` is set (e.g. by <color attach="background">)'
        : gl.getClearAlpha() >= 1
          ? 'the clear alpha is 1'
          : null
  if (!reason) return
  warnedOpaque = true
  console.warn(
    `react-3d-mockups: a live screen is inside an opaque canvas (${reason}), so the canvas paints over it. ` +
      'Screens are DOM under the canvas, seen through the pixels it leaves transparent: keep the canvas ' +
      'transparent (`gl={{ alpha: true }}`, no scene background) and give the page or the canvas element a CSS background instead.'
  )
}

/**
 * Reports each commit of a screen's content root (see the capture holds in
 * `BridgedScreen`). Rendered inside that root, after the content, so its
 * layout effect runs once the content's own DOM and refs are in place.
 */
function CommitSignal({ token, onCommit }: { token: object; onCommit: (token: object) => void }) {
  React.useLayoutEffect(() => onCommit(token))
  return null
}

export interface DeviceScreenProps {
  /**
   * The region name this surface renders, surfaced to content through
   * `useSurface()`. Omit and `useSurface().region` is `undefined` rather than
   * a guess.
   */
  region?: string
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
   * dimensions - exactly like a real device rotating into landscape.
   * Always applied explicitly (never undefined) - react-three-fiber does not
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
   * DOM is clipped to something else again - a livery with the glass carved
   * out, a label with a punched hole - or the extra area masks hardware that
   * should stay visible.
   */
  occluderGeometry?: THREE.BufferGeometry
  /** Extra styles merged onto the screen wrapper. */
  screenStyle?: React.CSSProperties
  /** Device-specific overlay (punch hole, notch…) rendered above the content. */
  overlay?: React.ReactNode
  /**
   * The strip of the surface that overlay covers at the top, in the surface's
   * own CSS px - see `statusBarSafeAreaTop`. Published to the content as
   * `--mockup-safe-area-top` and as `useSurface().safeAreaTop`; never applied
   * here, because a wallpaper and a lock screen are supposed to run under the
   * bar and only a layout knows which it is.
   */
  safeAreaTop?: number
  children?: React.ReactNode
}

/**
 * The live screen shared by every device: real DOM, CSS3D-transformed onto the
 * display glass via drei's `<Html transform>`, composited per-pixel against the
 * depth buffer so hardware in front of the screen covers it exactly.
 *
 * Screens are decorative - the DOM stacks under the canvas, which is what makes
 * that per-pixel masking possible and what keeps every pointer gesture with the
 * orbit controls. Content stays live all the same: state and effects run,
 * `<video>` plays, an `<iframe>` loads.
 *
 * The behaviors layered on top - compositor-layer promotion, backface culling -
 * live in `src/core` (see `SCREEN_LAYER_CSS` and
 * `createBackfaceCuller` there); this component is the thin React wiring.
 */
export function DeviceScreen(props: DeviceScreenProps) {
  /*
   * Its own FiberProvider, for the context bridge below. The bridge finds this
   * component's fiber by searching down from the nearest provider, and r3f
   * renders one at the root of every canvas - but that is r3f's copy of
   * its-fine, and an app that ends up with two copies (a nested install, a
   * bundler splitting them) has two unrelated provider contexts: the screen
   * then threw "useFiber must be called within a <FiberProvider />". Providing
   * it here makes the bridge independent of r3f's copy, and turns the search
   * from the whole scene into this one screen's subtree.
   */
  return (
    <FiberProvider>
      <BridgedScreen {...props} />
    </FiberProvider>
  )
}

function BridgedScreen({
  region,
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
  safeAreaTop = 0,
  children,
}: DeviceScreenProps) {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const invalidate = useThree((state) => state.invalidate)
  // drei's own portal target (`portal || events.connected || canvas parent`;
  // no `portal` is passed here). See `portalTargetKey`.
  const connected = useThree((state) => state.events.connected)
  const htmlKey = portalTargetKey(connected || gl.domElement.parentNode)
  const { screenAccessibility, delayCapture } = React.useContext(StageContext)
  /*
   * drei's <Html> renders its children into a SEPARATE React root, and a new
   * root starts with no context at all - so a theme, an i18n provider, a
   * router or a query client above the mockup was invisible to the component
   * on the glass, which then threw or rendered unstyled. The bridge re-provides
   * every context this screen can see (the page's, which r3f already bridges
   * into the canvas, plus any provider inside the canvas) to the screen's root.
   */
  const ContextBridge = useContextBridge()
  // Canvas size in CSS px. Not read for itself - it is what changes when the
  // drawing buffer or the display density does, so it is the dependency that
  // re-derives the raster scale below.
  const size = useThree((state) => state.size)

  /*
   * How much of the declared display to paint (see `screenRasterScale`). The
   * content still LAYS OUT at `resolution`; only the pixels the compositor
   * rasterizes are capped, to what the canvas could ever show. Without it a
   * high-DPI phone rasterizes every screen at full resolution x dpr, blows the
   * tile budget, and the tiles that lose composite as blank rectangles over
   * the glass.
   */
  const cssHeight = screenCssHeight(resolution, width, height)
  const rasterScale = React.useMemo(() => {
    const canvas = gl.domElement
    return screenRasterScale({
      layerPx: Math.max(resolution, cssHeight),
      // Drawing-buffer pixels: the most of the screen the canvas can ever show.
      canvasPx: Math.max(canvas.width, canvas.height),
      // The compositor's own fallback density, not r3f's clamped `dpr` - it is
      // what Chromium rasterizes a perspective-transformed layer at.
      devicePixelRatio: typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1,
      // `size` is the signal that either of those may have changed.
    })
  }, [gl, size, resolution, cssHeight])

  // The depth mask that makes the canvas transparent over the screen so the
  // DOM beneath shows through. drei's default is a plain rectangle, which on
  // any screen the DOM rounds off - a watch face, a round record label -
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
    // the DOM's edge over device hardware - the seam reads as the display's
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
  // stacked under it stays clickable - which silently kills orbit drags on
  // the empty background. Mockups want the opposite trade: the canvas keeps
  // ALL input, so drag-to-orbit works everywhere, over the screen included.
  // Parent layout effects run after the child Html's, so this override wins
  // on mount.
  React.useLayoutEffect(() => {
    gl.domElement.style.pointerEvents = 'auto'
  }, [gl])

  React.useEffect(() => warnIfOpaque(gl, scene), [gl, scene])

  // drei's blending setup is a per-<Html> layout effect that mutates GLOBAL
  // canvas style, and r3f can reconnect and re-stamp it. Re-assert the
  // config from the frame loop so it always holds, whatever the mount order.
  const blendingCanvasZ = String(BLENDING_CANVAS_Z)

  // Backface culling for the DOM plane - hide it whenever its normal points
  // away from the camera (CSS backface-visibility can't see drei's chain).
  const anchorRef = React.useRef<Group>(null!)
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  /*
   * The content element, and the frame it needs to land in.
   *
   * drei positions a screen from its own frame callback, but its root commits
   * the screen's DOM asynchronously - AFTER the frame that mounted it. A canvas
   * rendering every frame never noticed; one rendering on demand has no next
   * frame coming, and the screen sat unplaced (full-canvas size, untransformed)
   * until something happened to move. So the arrival of the content - on
   * mount, on a re-portal, on a mount-race retry - requests that frame itself.
   */
  const setContent = React.useCallback(
    (element: HTMLDivElement | null) => {
      contentRef.current = element
      if (element) invalidate()
    },
    [invalidate]
  )
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

  /*
   * Capture holds (see `delayCapture` on MockupCanvas). The content is a
   * React root of its own: it commits after this component does, and on
   * mount it then waits a frame for drei to place it on the glass. The
   * canvas's own holds end at its draw, which can come first - a capture
   * right after it photographed a bare hole on a new screen, or the previous
   * frame's content on a live one.
   *
   * So every render of this screen holds until the root reports committing
   * THAT render (a fresh token per render, echoed back by CommitSignal), and
   * until the element it committed has been placed in a drawn frame. A screen
   * already placed needs no further frame for new content: the browser
   * composites the DOM by itself.
   */
  const holds = React.useMemo(() => createCaptureHolds(delayCapture), [delayCapture])
  React.useEffect(() => () => holds.release(), [holds])
  const renderToken = {}
  const wantedToken = React.useRef<object | null>(null)
  const committedToken = React.useRef<object | null>(null)
  const placedContent = React.useRef<HTMLDivElement | null>(null)
  const isPlaced = () => contentRef.current !== null && placedContent.current === contentRef.current
  React.useLayoutEffect(() => {
    wantedToken.current = renderToken
    if (committedToken.current !== renderToken || !isPlaced()) {
      holds.hold('react-3d-mockups: placing screen content')
    }
  })
  const onContentCommit = React.useCallback(
    (token: object) => {
      committedToken.current = token
      if (token !== wantedToken.current || !holds.pending) return
      if (isPlaced()) holds.release()
      // Not on the glass yet: ask for the frame that puts it there.
      else invalidate()
    },
    [holds, invalidate]
  )

  useFrame(({ camera }) => {
    const canvas = gl.domElement.style
    if (canvas.zIndex !== blendingCanvasZ) canvas.zIndex = blendingCanvasZ
    if (canvas.position !== 'absolute') canvas.position = 'absolute'
    if (canvas.pointerEvents !== 'auto') canvas.pointerEvents = 'auto'
    // Self-healing for a drei <Html> mount race: Html renders its DOM
    // through its own nested ReactDOM root, and when several screens mount
    // in the same busy commit, all but the first can lose that root's
    // initial flush and stay empty shells forever - a whole side of a bus,
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
      // Counting frames only works if frames keep coming: on a canvas that
      // renders on demand, ask for the next one until the content lands or the
      // retries run out.
      if (retry.retries < 8) invalidate()
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
    // drei placed `content` in its own frame callback, which runs before this
    // one, and the draw follows in this same task.
    placedContent.current = content
    if (holds.pending && committedToken.current === wantedToken.current) queueMicrotask(holds.release)
  })

  /*
   * The surface: `resolution` CSS px of live DOM, carrying the display's own
   * background, rounding and whatever the device layered on through
   * `screenStyle` - clip paths that punch a spindle hole or a lanyard slot are
   * authored in these pixels, so this box keeps its declared size whatever the
   * screen is painted at.
   *
   * It is also where the screen leaves the accessibility tree (see
   * `ScreenAccessibility`): `inert` as well as `aria-hidden`, because a link or
   * a button on a decorative screen would otherwise still take a tab stop the
   * visitor can neither see the focus of nor activate.
   */
  const surface = (
    <div
      ref={rasterScale === 1 ? setContent : undefined}
      aria-hidden={screenAccessibility === 'visible' ? undefined : true}
      inert={screenAccessibility === 'visible' ? undefined : true}
      style={{
        ...screenSurfaceStyle({ width, height, radius, resolution, background }),
        // The inset the system UI costs the content, for CSS to pick up. Set
        // before `screenStyle` so a device can still override it.
        ...({ '--mockup-safe-area-top': `${safeAreaTop}px` } as React.CSSProperties),
        ...screenStyle,
        ...(rasterScale === 1
          ? null
          : {
              // Drawn into the shrunken box below. The scale leads so a
              // transform the device passed still composes in the screen's own
              // coordinates, and backface-visibility moves OUT to that box:
              // left here it composites this element on its own, at its full
              // size, and the shrink would never reach the rasterizer.
              transform: `scale(${rasterScale})${screenStyle?.transform ? ` ${screenStyle.transform}` : ''}`,
              transformOrigin: '0 0',
              backfaceVisibility: 'visible',
              WebkitBackfaceVisibility: 'visible',
            }),
      }}
    >
      <SurfaceProvider
        region={region}
        width={width}
        height={height}
        radius={radius}
        resolution={resolution}
        background={background}
        safeAreaTop={safeAreaTop}
      >
        {children}
      </SurfaceProvider>
      {overlay}
    </div>
  )

  return (
    <group ref={anchorRef} position={position} rotation={rotation}>
      <Html
        key={htmlKey}
        transform
        occlude="blending"
        geometry={blendGeometry ? <primitive object={blendGeometry} attach="geometry" /> : undefined}
        // The bridge scales its OUTERMOST child onto the glass, which is the
        // shrunken box whenever one is in play - so the screen covers the same
        // world units however few pixels it is painted at.
        distanceFactor={screenDistanceFactor(width, resolution * rasterScale)}
        zIndexRange={SCREEN_Z_RANGE}
        wrapperClass={SCREEN_LAYER_CLASS}
        // Keep drei's inner transform div from hit-testing. It spans the
        // screen rect and would otherwise sit in front of user content that
        // legitimately wants to paint over the mockup.
        pointerEvents="none"
      >
        <style href={SCREEN_LAYER_STYLE_HREF} precedence="default">
          {SCREEN_LAYER_CSS}
        </style>
        <ContextBridge>
          {rasterScale === 1 ? (
            surface
          ) : (
            /*
             * The painted box. The surface still LAYS OUT at full size and only
             * draws smaller, so this is sized to the drawn result and clips to
             * it - and it is this element, not the surface, that the compositor
             * promotes, which is what holds the rasterized layer to these bounds
             * instead of the surface's own.
             */
            <div
              ref={setContent}
              style={{
                position: 'relative',
                width: resolution * rasterScale,
                height: cssHeight * rasterScale,
                overflow: 'hidden',
                pointerEvents: 'none',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              {surface}
            </div>
          )}
          <CommitSignal token={renderToken} onCommit={onContentCommit} />
        </ContextBridge>
      </Html>
    </group>
  )
}
