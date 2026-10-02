import * as React from 'react'
import type * as THREE from 'three'
import { Canvas, useFrame, useThree, type CanvasProps } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { FiberProvider, useContextMap } from 'its-fine'
import { TumbleControls, type TumbleControlsHandle } from './tumble-controls'
import { StageShadows } from './stage-shadows'
import { StageContext, type ScreenAccessibility, type StageSettings } from './stage-context'
import {
  CANVAS_GL_DEFAULTS,
  CONTACT_SHADOW,
  DEFAULT_CAMERA_FOV,
  DEFAULT_CAMERA_POSITION,
  DEFAULT_SHADOW_Y,
  ENTER_FULLSCREEN_ICON_PATH,
  EXIT_FULLSCREEN_ICON_PATH,
  OVERLAY_BUTTON_STYLE,
  OVERLAY_ICON_VIEWBOX,
  ZOOM_PILL_BUTTON_STYLE,
  ZOOM_PILL_LEVEL_STYLE,
  ZOOM_PILL_STYLE,
  STAGE_AMBIENT_LIGHT,
  STAGE_KEY_LIGHT,
  STUDIO_ENV_RESOLUTION,
  STUDIO_LIGHTFORMERS,
  activeFullscreenElement,
  autoRotateSpeed,
  cameraDistance,
  canvasTouchAction,
  createCaptureHolds,
  orbitDistanceRange,
  takeCaptureHold,
  toggleFullscreen,
  turntablePosition,
  type CaptureHolds,
  type DelayCapture,
} from './core'

/**
 * react-three-fiber stamps `touch-action: none` on its event target when it
 * connects, which traps page scrolling on touch devices. Pin it to the core's
 * `canvasTouchAction` instead: vertical swipes scroll past the mockup,
 * horizontal drags orbit - unless zoom is on, in which case the canvas owns
 * two-finger gestures. (Checked per frame because r3f can reconnect and
 * re-stamp.)
 */
function TouchScrollFix({ zoom }: { zoom: boolean }) {
  const get = useThree((state) => state.get)
  const touchAction = canvasTouchAction(zoom)
  useFrame(() => {
    const connected = get().events.connected as HTMLElement | undefined
    if (connected?.style && connected.style.touchAction !== touchAction) {
      connected.style.touchAction = touchAction
    }
  })
  return null
}

/**
 * Whether the canvas is worth drawing: on screen (give or take a margin) in a
 * visible tab.
 *
 * A canvas scrolled out of view still ran its whole frame loop - every draw
 * call, every frame, for pixels nobody could see - and so did one in a
 * background tab wherever the browser kept animation frames coming. Paused, a
 * canvas keeps showing its last frame, so resuming a little before it scrolls
 * back in (`PAUSE_MARGIN`) is seamless.
 */
function useWorthDrawing(target: React.RefObject<Element | null>, enabled: boolean): boolean {
  const [worth, setWorth] = React.useState(true)
  React.useEffect(() => {
    if (!enabled) {
      setWorth(true)
      return
    }
    let intersecting = true
    let visible = document.visibilityState !== 'hidden'
    const update = () => setWorth(intersecting && visible)
    const element = target.current
    const observer =
      element && typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            ([entry]) => {
              intersecting = entry?.isIntersecting ?? true
              update()
            },
            { rootMargin: PAUSE_MARGIN }
          )
        : null
    if (element) observer?.observe(element)
    const onVisibility = () => {
      visible = document.visibilityState !== 'hidden'
      update()
    }
    document.addEventListener('visibilitychange', onVisibility)
    update()
    return () => {
      observer?.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [target, enabled])
  return worth
}

/**
 * Holds a capture (see `delayCapture`) until the frame it waits for has been
 * drawn: the frame after every commit of the scene - a prop change, a new
 * child, a context value - including the first.
 *
 * Its own FiberProvider for the same reason `DeviceScreen` has one: the
 * context lookup must not depend on which copy of its-fine r3f was built with.
 */
function CaptureGate({ holds }: { holds: CaptureHolds }) {
  return (
    <FiberProvider>
      <CaptureGateFrame holds={holds} />
    </FiberProvider>
  )
}

function CaptureGateFrame({ holds }: { holds: CaptureHolds }) {
  // Subscribed to every context the scene can see. A commit that only a
  // context drove - a component inside the canvas reading a video's frame
  // counter - re-renders nothing above the canvas, so without this it would
  // move the scene without a hold, and a capture could land before the draw.
  useContextMap()
  const invalidate = useThree((state) => state.invalidate)
  React.useLayoutEffect(() => {
    holds.hold('react-3d-mockups: drawing the next frame')
    invalidate()
  })
  useFrame(() => {
    // Frame callbacks run before the scene is drawn, and the draw follows in
    // this same task: a microtask lands just after it.
    if (holds.pending) queueMicrotask(holds.release)
  })
  return null
}

type Vec3 = [number, number, number]

/** The `camera` prop's position when it is a plain xyz triple - the one shape the stage re-applies. */
function positionTuple(camera: CanvasProps['camera']): Vec3 | null {
  const position = (camera as { position?: unknown } | undefined)?.position
  return Array.isArray(position) &&
    position.length === 3 &&
    position.every((n) => typeof n === 'number' && Number.isFinite(n))
    ? (position as Vec3)
    : null
}

/**
 * Keeps the camera on the `camera` prop after mount, and - on a caller's
 * clock (`time`) - turns it as far round the turntable as `autoRotate` has
 * carried it by that time.
 *
 * react-three-fiber reads its `camera` prop once, when it creates the camera,
 * so a dolly or a zoom driven from props (a video's frame counter, a scroll
 * position) silently stood still. A change of position or fov now moves the
 * camera there, looking at the stage center as the orbit does. Values, not
 * the object, are compared: the one-liners build a fresh camera object on
 * every render, and a drag must survive a re-render that did not move it.
 */
function StageCamera({ position, fov, seconds, speed }: { position: Vec3; fov: number | undefined; seconds: number | undefined; speed: number }) {
  const camera = useThree((state) => state.camera)
  const invalidate = useThree((state) => state.invalidate)
  const [x, y, z] = position
  const mounted = React.useRef(false)
  React.useLayoutEffect(() => {
    // The first pose is the one react-three-fiber just created the camera
    // at; only a clock has anything to add to it.
    const first = !mounted.current
    mounted.current = true
    if (first && seconds === undefined) return
    const at = seconds === undefined ? position : turntablePosition(position, seconds, speed)
    camera.position.set(...at)
    camera.up.set(0, 1, 0)
    const perspective = camera as THREE.PerspectiveCamera
    if (fov !== undefined && perspective.isPerspectiveCamera && perspective.fov !== fov) {
      perspective.fov = fov
      perspective.updateProjectionMatrix()
    }
    camera.lookAt(0, 0, 0)
    invalidate()
    // `position` is read through its components, so a fresh array with the
    // same numbers is not a move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, invalidate, x, y, z, fov, seconds, speed])
  return null
}

/**
 * The studio's light formers, built once for every canvas.
 *
 * drei's <Environment> re-renders its cube map whenever its `children` change
 * identity, and three.js then re-filters the map into its PMREM mip chain on
 * the next draw - a dozen full-screen passes. Mapped inline, the children
 * were new on every render of the canvas, so every prop change paid for a
 * new environment: a hitch in the prop explorer, and in a video render, where
 * props change every frame, most of the frame time (on SwiftShader, 12 frames
 * of a turning phone took 112 s with it and 25 s without). The lights never
 * change, so neither do these.
 */
const STUDIO = STUDIO_LIGHTFORMERS.map((lf, i) => (
  <Lightformer
    key={i}
    form={lf.form}
    intensity={lf.intensity}
    position={lf.position}
    scale={lf.scale}
    rotation-x={lf.rotationX ?? 0}
    rotation-y={lf.rotationY ?? 0}
  />
))

/** How far outside the viewport a canvas starts drawing again. */
const PAUSE_MARGIN = '120px'

// Typed locally: this is browser code and does not take node's types.
declare const process: { env: { NODE_ENV?: string } }

/** Literal `process.env.NODE_ENV`, so bundlers drop dev checks; the try covers an unbundled page. */
const DEV = (() => {
  try {
    return process.env.NODE_ENV !== 'production'
  } catch {
    return false
  }
})()
let warnedNoHeight = false
let warnedContextLost = false

/**
 * A visible focus ring for the keyboard-focusable canvas. Inset, because r3f's
 * container clips its overflow and would cut an outer outline off. Rendered as
 * a React 19 hoistable stylesheet, so any number of mockups share one copy.
 */
const CANVAS_FOCUS_CSS =
  '.react-3d-mockups-canvas:focus-visible{outline:2px solid currentColor;outline-offset:-2px}'

/** Feather-style corner icon for the fullscreen toggle (16px, current color). */
function OverlayIcon({ path }: { path: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox={OVERLAY_ICON_VIEWBOX}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      <path d={path} />
    </svg>
  )
}

export interface MockupCanvasProps {
  /** Your scene - typically a device such as `<Galaxy>`. */
  children: React.ReactNode
  /** Drag-to-rotate controls, axis at the stage center. */
  controls?: boolean
  /**
   * Slowly orbit the camera around the device: `true` for one revolution a
   * minute, or a number for that many times the base speed
   * (`autoRotate={2}` is twice as fast, `autoRotate={0.5}` half).
   */
  autoRotate?: boolean | number
  /**
   * Allow the camera to rotate a full 360° vertically - straight over the top
   * and bottom of the device. Off by default: vertical rotation stays within
   * the classic orbit clamp so the device never flips upside down by accident.
   */
  freeRotation?: boolean
  /**
   * Zoom controls: pinch on touch, pinch on a trackpad (or ctrl/⌘ with a
   * mouse wheel), plus the overlay control. A plain scroll - two fingers on
   * a trackpad, a bare mouse wheel - is never captured: it scrolls the page
   * under the mockup as it would anywhere else. Off by default; on, the
   * canvas owns two-finger gestures on touch screens (vertical page
   * scrolling then starts outside the mockup).
   */
  zoom?: boolean
  /**
   * Full-screen view: adds an overlay button that expands the mockup to fill
   * the whole screen via the Fullscreen API (and collapses it back). Off by
   * default so an embedded mockup never grows a control it wasn't asked for.
   */
  fullscreen?: boolean
  /** Soft contact shadow under the device. */
  shadows?: boolean
  /**
   * Y position (world units) of the contact-shadow plane. The default sits just
   * under the bundled phone (body height 4, centered on the origin), grounding
   * the device on its shadow instead of leaving it floating in mid-air.
   */
  shadowY?: number
  /** CSS background of the canvas (any CSS color/gradient/image value). */
  background?: string
  /** Override the default camera (position [0, 0.5, 7.4], fov 40). */
  camera?: CanvasProps['camera']
  /** Device-pixel-ratio range; clamped for consistent GPU load on hi-dpi screens. */
  dpr?: CanvasProps['dpr']
  /**
   * When the canvas draws a frame.
   *
   * - `'demand'` (default): only when something changes - a drag and the
   *   damping that follows it, zoom, `autoRotate`, `float`, a prop change, a
   *   resize. A mockup at rest draws nothing at all.
   * - `'always'`: every animation frame. For a composed scene that animates
   *   itself in `useFrame` (or call r3f's `invalidate()` from it instead).
   * - `'never'`: frozen on its last frame.
   */
  frameloop?: 'demand' | 'always' | 'never'
  /**
   * Stop drawing while the canvas is scrolled out of view or its tab is
   * hidden, and pick up again on return. On by default; turn it off for an
   * offscreen capture (a video render, a screenshot of a hidden element).
   */
  pauseWhenOffscreen?: boolean
  /**
   * Seconds on a clock you own - a video's `frame / fps`, a scroll position.
   * Set, the stage's own motion follows it instead of the browser's clock:
   * `autoRotate` turns the camera as far as it would have by then, and a
   * mockup's `float` samples its bob at that time, so the same `time` always
   * draws the same picture. A render that draws frames out of order, across
   * several tabs (Remotion does both), needs exactly that. Reduced motion no
   * longer holds either still: the clock is yours, and so is the decision.
   */
  time?: number
  /**
   * Hold an outside capture - a video render, a screenshot - until the
   * picture is complete. The canvas calls it with a reason whenever a frame
   * is on its way that has not been drawn yet (the renderer starting up, a
   * scene change waiting for its redraw, a screen whose content has not
   * landed on the glass), and calls the function it returns once it has. In
   * Remotion, wrap `delayRender` / `continueRender`:
   *
   * ```tsx
   * const { delayRender, continueRender } = useDelayRender()
   * <IPhoneMockup
   *   delayCapture={(reason) => {
   *     const handle = delayRender(reason)
   *     return () => continueRender(handle)
   *   }}
   * />
   * ```
   *
   * While it is set the canvas never pauses (`pauseWhenOffscreen` is
   * ignored), since a paused canvas would hold the capture forever; for the
   * same reason do not combine it with `frameloop="never"`.
   */
  delayCapture?: DelayCapture
  /**
   * WebGL renderer settings, merged over the defaults
   * `{ antialias: true, alpha: true, powerPreference: 'default' }`
   * (`CANVAS_GL_DEFAULTS`). Keep `alpha` on: the screens are seen through the
   * pixels the canvas leaves transparent. A function or a renderer instance
   * is handed to react-three-fiber as is.
   */
  gl?: CanvasProps['gl']
  /** Called once the renderer, scene and camera exist (react-three-fiber's `onCreated`). */
  onCreated?: CanvasProps['onCreated']
  /**
   * Accessible name for the canvas, which is exposed as an image. Defaults to
   * a description of the model on the one-liner mockups, and to "3D mockup"
   * here.
   */
  label?: string
  /**
   * Whether the live screens are in the page's accessibility tree. `'hidden'`
   * (default) marks every screen layer `aria-hidden` and `inert`, since a
   * screen is decorative; `'visible'` exposes a screen whose text is found
   * nowhere else on the page.
   */
  screenAccessibility?: ScreenAccessibility
  className?: string
  style?: React.CSSProperties
}

/**
 * A ready-made react-three-fiber stage for device mockups: GPU-accelerated
 * WebGL canvas, studio lighting, soft shadows and orbit controls. Compose it
 * with any device model, e.g. `<MockupCanvas><Galaxy>…</Galaxy></MockupCanvas>`.
 *
 * The stage itself - camera pose, orbit feel, light rig, shadow softness -
 * is defined once in `src/core` and shared by every mockup.
 */
export function MockupCanvas({
  children,
  controls = true,
  autoRotate = false,
  freeRotation = false,
  zoom = false,
  fullscreen = false,
  shadows = true,
  shadowY = DEFAULT_SHADOW_Y,
  background,
  camera,
  dpr = [1, 2],
  frameloop = 'demand',
  pauseWhenOffscreen = true,
  time,
  delayCapture,
  gl,
  onCreated,
  label = '3D mockup',
  screenAccessibility = 'hidden',
  className,
  style,
}: MockupCanvasProps) {
  // Keep the orbit-zoom range sane for whatever camera the mockup configured:
  // a wide stage (billboard, van) must not snap back to a closer maxDistance
  // on the first drag.
  // `cameraDistance` validates the shape: r3f's `camera` prop also accepts a
  // camera instance or a Vector3 position, neither of which indexes as a tuple.
  const orbitRange = orbitDistanceRange(
    cameraDistance((camera as { position?: unknown } | undefined)?.position)
  )

  // Full-screen view toggles the overlay wrapper into the browser's Fullscreen
  // API. Track the live state so the button flips its icon and label, and so a
  // dark backdrop only appears while actually filling the screen (keeping the
  // transparent-by-default canvas transparent the rest of the time).
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = React.useState(false)

  /*
   * The wrapper fills its container (`height: 100%`), so a container with no
   * height of its own - the first thing anyone writes, `<div><GalaxyMockup /></div>`
   * - gives the canvas none: the mockup renders nothing, and nothing said why.
   * Checked a frame after mount, in development, once per page, and only for a
   * container that is laid out: a hidden tab panel has no height either, and
   * legitimately.
   */
  React.useEffect(() => {
    if (!DEV || warnedNoHeight) return
    const frame = requestAnimationFrame(() => {
      const el = wrapperRef.current
      if (!el || warnedNoHeight || el.offsetParent === null || el.clientWidth === 0 || el.clientHeight > 0) return
      warnedNoHeight = true
      console.warn(
        "[react-3d-mockups] The mockup's container has no height, so nothing is visible. " +
          'Give it one, e.g. <div style={{ height: 560 }}>.'
      )
    })
    return () => cancelAnimationFrame(frame)
  }, [])
  React.useEffect(() => {
    if (!fullscreen) return
    const onChange = () => {
      setIsFullscreen(activeFullscreenElement(document) === wrapperRef.current)
    }
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [fullscreen])

  const controlsRef = React.useRef<TumbleControlsHandle>(null)
  const zoomBy = (factor: number) => {
    controlsRef.current?.zoomBy(factor)
  }

  // Zoom readout: 100% is wherever the camera started; halving the orbit
  // distance reads 200%. Fed by TumbleControls whenever the distance
  // settles on a new value (buttons, wheel and pinch alike).
  const [zoomPercent, setZoomPercent] = React.useState(100)
  const baseDistance = React.useRef<number | null>(null)
  const lastDistance = React.useRef<number | null>(null)
  const handleDistanceChange = React.useCallback((distance: number) => {
    if (baseDistance.current === null) baseDistance.current = distance
    lastDistance.current = distance
    const percent = Math.round((baseDistance.current / distance) * 100)
    setZoomPercent((previous) => (previous === percent ? previous : percent))
  }, [])
  // Back to 100%: the factor that takes the current distance to the first one.
  const zoomReset = () => {
    if (baseDistance.current !== null && lastDistance.current) zoomBy(baseDistance.current / lastDistance.current)
  }

  // The latest `delayCapture` behind one stable function: an inline arrow is
  // a new function on every render, and rebuilding the holds for each one
  // released the previous frame's holds before that frame was drawn.
  const capturing = delayCapture !== undefined
  const delayRef = React.useRef(delayCapture)
  React.useLayoutEffect(() => {
    delayRef.current = delayCapture
  })
  const capture = React.useMemo<DelayCapture | undefined>(
    () => (capturing ? (reason) => takeCaptureHold(delayRef.current, reason) : undefined),
    [capturing]
  )
  const holds = React.useMemo(() => createCaptureHolds(capture), [capture])
  // Held from this component's first commit, not the scene's: react-three-
  // fiber creates the renderer asynchronously, and until it has there is no
  // scene to hold for - a capture in between photographed an empty canvas.
  React.useLayoutEffect(() => {
    holds.hold('react-3d-mockups: starting the renderer')
    // Unmounted, or no longer capturing: nothing will draw for these now.
    return () => holds.release()
  }, [holds])

  const cameraOptions = camera ?? { position: DEFAULT_CAMERA_POSITION, fov: DEFAULT_CAMERA_FOV }
  const stagePosition = positionTuple(cameraOptions)
  const stageFov = (cameraOptions as { fov?: unknown }).fov
  const stageFovValue = typeof stageFov === 'number' ? stageFov : undefined

  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  // A paused canvas draws nothing, so it would hold a capture forever.
  // Observed through the wrapper, which outlives a renderer that is replaced
  // after a lost context (see `contextLost`) and covers the same box.
  const drawing = useWorthDrawing(wrapperRef, pauseWhenOffscreen && !capturing)

  /*
   * A dropped WebGL context. Browsers cap live contexts per page (16 in
   * Chromium) and silently take the oldest when a new one is made, so the
   * twentieth mockup on a page blanked the first - a white box with a
   * broken-image icon, for good. A lost canvas now unmounts (its screens with
   * it) behind an empty placeholder, and comes back as a fresh renderer when
   * it next scrolls into view. Not straight away: a canvas lost while visible
   * would take another visible canvas's context to come back, which would take
   * its own back, and so on.
   */
  const [contextLost, setContextLost] = React.useState(false)
  const [rendererGeneration, setRendererGeneration] = React.useState(0)
  const backInView = useWorthDrawing(wrapperRef, contextLost)
  const leftView = React.useRef(false)
  React.useEffect(() => {
    if (!contextLost) return
    if (!backInView) {
      leftView.current = true
    } else if (leftView.current) {
      leftView.current = false
      setContextLost(false)
      setRendererGeneration((generation) => generation + 1)
    }
  }, [contextLost, backInView])
  const onCreatedRef = React.useRef(onCreated)
  React.useLayoutEffect(() => {
    onCreatedRef.current = onCreated
  })
  const handleCreated = React.useCallback<NonNullable<CanvasProps['onCreated']>>((state) => {
    state.gl.domElement.addEventListener(
      'webglcontextlost',
      () => {
        if (DEV && !warnedContextLost) {
          warnedContextLost = true
          console.warn(
            '[react-3d-mockups] The browser dropped a mockup\'s WebGL context - too many live canvases on one ' +
              'page. It is redrawn when it scrolls back into view. To stay under the limit, render fewer ' +
              'mockups at once or compose several in one <MockupCanvas>: ' +
              'https://area.is/react-3d-mockups/docs/performance#use-fewer-canvases'
          )
        }
        setContextLost(true)
      },
      { once: true }
    )
    onCreatedRef.current?.(state)
  }, [])

  // An image to assistive tech, named for what it shows. r3f spreads its own
  // props onto the container rather than the canvas, and the container also
  // holds the screens, which must not become an image's (unreadable) children
  // when `screenAccessibility` is 'visible' - so the canvas is named directly.
  React.useEffect(() => {
    const element = canvasRef.current
    if (!element) return
    element.setAttribute('role', 'img')
    element.setAttribute('aria-label', label)
  }, [label, contextLost, rendererGeneration])

  const glProps = React.useMemo<CanvasProps['gl']>(
    () =>
      typeof gl === 'function' || (gl && 'render' in gl) ? gl : { ...CANVAS_GL_DEFAULTS, ...gl },
    [gl]
  )
  const stage = React.useMemo<StageSettings>(
    () => ({ screenAccessibility, delayCapture: capture }),
    [screenAccessibility, capture]
  )

  // The canvas's own container is a stacking context (see isolateCanvasStack
  // in device-screen), so the blending band is sealed inside it however large
  // it gets, and these buttons only have to beat the container itself. A
  // small number keeps the mockup from towering over the host page.
  const overlayZ = 2

  const canvas = contextLost ? (
    // Holds the mockup's place while its renderer is gone (see `contextLost`).
    <div aria-hidden="true" style={{ width: '100%', height: '100%' }} />
  ) : (
    <Canvas
      key={rendererGeneration}
      ref={canvasRef}
      className={className}
      // pan-y keeps pages scrollable on touch: vertical swipes scroll past the
      // mockup, horizontal drags (and mouse) orbit the device. With zoom on,
      // the canvas owns the pinch instead (touch-action none).
      style={{ touchAction: canvasTouchAction(zoom), background, ...style }}
      dpr={dpr}
      camera={cameraOptions}
      gl={glProps}
      onCreated={handleCreated}
      frameloop={drawing ? frameloop : 'never'}
    >
      <StageContext.Provider value={stage}>
        <TouchScrollFix zoom={zoom} />
        {capturing && <CaptureGate holds={holds} />}
        {stagePosition && (
          <StageCamera
            position={stagePosition}
            fov={stageFovValue}
            seconds={time}
            speed={autoRotateSpeed(autoRotate)}
          />
        )}
        <ambientLight intensity={STAGE_AMBIENT_LIGHT.intensity} />
        <directionalLight position={STAGE_KEY_LIGHT.position} intensity={STAGE_KEY_LIGHT.intensity} />

        {/* The core's procedural light studio, rendered once into an env map.
            Not optional: it is what gives every material its reflections, and a
            mockup without it reads as flat untextured plastic. No HDR files are
            fetched, so it costs nothing at load and works offline. */}
        <Environment resolution={STUDIO_ENV_RESOLUTION}>{STUDIO}</Environment>

        {children}

        {shadows && <StageShadows y={shadowY} {...CONTACT_SHADOW} />}

        {controls && (
          <TumbleControls
            ref={controlsRef}
            zoom={zoom}
            // On a caller's clock the turntable is StageCamera's, as a
            // function of `time`; stepping it here too would double it.
            autoRotate={time === undefined ? autoRotate : false}
            freeRotation={freeRotation}
            minDistance={orbitRange.min}
            maxDistance={orbitRange.max}
            home={stagePosition ?? undefined}
            onDistanceChange={zoom ? handleDistanceChange : undefined}
          />
        )}
      </StageContext.Provider>
    </Canvas>
  )

  const focusStyle = controls ? (
    <style href="react-3d-mockups-canvas-focus" precedence="default">
      {CANVAS_FOCUS_CSS}
    </style>
  ) : null

  // Zoom's +/− buttons need the orbit controls to move the camera; the
  // full-screen button is independent. With neither overlay, hand back the
  // bare canvas untouched.
  const showZoomButtons = zoom && controls
  if (!showZoomButtons && !fullscreen) {
    return (
      <>
        {focusStyle}
        {canvas}
      </>
    )
  }

  // Wrap so the overlay buttons anchor to the canvas box - and so the
  // Fullscreen API has an element to expand. A dark backdrop fills the letter-
  // boxing only while actually full-screen, using `background` when provided.
  //
  // This wrapper is also the stacking context that confines the screen
  // z-index band (see SCREEN_Z_RANGE): it holds the canvas AND every screen
  // portalled next to it, so isolating it here - statically, in the same
  // render that creates them - settles the question before any screen mounts.
  // DeviceScreen still derives a host at runtime for a foreign <Canvas>, but
  // inside a MockupCanvas it only ever re-finds this element.
  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative',
        isolation: 'isolate',
        width: '100%',
        height: '100%',
        background: isFullscreen ? background ?? '#0b0d12' : undefined,
      }}
    >
      {focusStyle}
      {canvas}
      {fullscreen && (
        <div style={{ position: 'absolute', right: 10, top: 10, zIndex: overlayZ }}>
          <button
            type="button"
            aria-label={isFullscreen ? 'Exit full screen' : 'View full screen'}
            style={OVERLAY_BUTTON_STYLE}
            onClick={() => wrapperRef.current && toggleFullscreen(wrapperRef.current)}
          >
            <OverlayIcon
              path={isFullscreen ? EXIT_FULLSCREEN_ICON_PATH : ENTER_FULLSCREEN_ICON_PATH}
            />
          </button>
        </div>
      )}
      {showZoomButtons && (
        <div
          role="group"
          aria-label="Zoom"
          data-mockup-zoom=""
          style={{ ...ZOOM_PILL_STYLE, position: 'absolute', right: 10, bottom: 10, zIndex: overlayZ }}
        >
          <button type="button" aria-label="Zoom out" title="Zoom out" style={ZOOM_PILL_BUTTON_STYLE} onClick={() => zoomBy(1.25)}>
            −
          </button>
          <button type="button" aria-label="Zoom level" title="Back to 100%" style={ZOOM_PILL_LEVEL_STYLE} onClick={zoomReset}>
            {zoomPercent}%
          </button>
          <button type="button" aria-label="Zoom in" title="Zoom in" style={ZOOM_PILL_BUTTON_STYLE} onClick={() => zoomBy(0.8)}>
            +
          </button>
        </div>
      )}
    </div>
  )
}
