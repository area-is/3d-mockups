import * as React from 'react'
import { Canvas, useFrame, useThree, type CanvasProps } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { TumbleControls, type TumbleControlsHandle } from './tumble-controls'
import {
  CONTACT_SHADOW,
  DEFAULT_CAMERA_FOV,
  DEFAULT_CAMERA_POSITION,
  DEFAULT_SHADOW_Y,
  ENTER_FULLSCREEN_ICON_PATH,
  EXIT_FULLSCREEN_ICON_PATH,
  OVERLAY_BUTTON_STYLE,
  OVERLAY_ICON_VIEWBOX,
  STAGE_AMBIENT_LIGHT,
  STAGE_KEY_LIGHT,
  STUDIO_ENV_RESOLUTION,
  STUDIO_LIGHTFORMERS,
  activeFullscreenElement,
  cameraDistance,
  canvasTouchAction,
  orbitDistanceRange,
  toggleFullscreen,
} from '@area-mockups/core'

/**
 * react-three-fiber stamps `touch-action: none` on its event target when it
 * connects, which traps page scrolling on touch devices. Pin it to the core's
 * `canvasTouchAction` instead: vertical swipes scroll past the mockup,
 * horizontal drags orbit — unless zoom is on, in which case the canvas owns
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
  /** Your scene — typically a device such as `<Phone>`. */
  children: React.ReactNode
  /** Drag-to-rotate controls, axis at the stage center. */
  controls?: boolean
  /** Slowly orbit the camera around the device. */
  autoRotate?: boolean
  autoRotateSpeed?: number
  /**
   * Allow the camera to rotate a full 360° vertically — straight over the top
   * and bottom of the device. Off by default: vertical rotation stays within
   * the classic orbit clamp so the device never flips upside down by accident.
   */
  freeRotation?: boolean
  /**
   * Zoom controls: pinch on touch, scroll wheel on desktop, plus overlay
   * +/− buttons. Off by default so an embedded mockup never hijacks page
   * scroll — turning it on gives the canvas the two-finger gesture (vertical
   * page scrolling then starts outside the mockup).
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
  /** Procedural studio lighting + reflections. No HDR downloads — works offline. */
  environment?: boolean
  /** CSS background of the canvas (any CSS color/gradient/image value). */
  background?: string
  /** Override the default camera (position [0, 0.5, 7.4], fov 40). */
  camera?: CanvasProps['camera']
  /** Device-pixel-ratio range; clamped for consistent GPU load on hi-dpi screens. */
  dpr?: CanvasProps['dpr']
  className?: string
  style?: React.CSSProperties
}

/**
 * A ready-made react-three-fiber stage for device mockups: GPU-accelerated
 * WebGL canvas, studio lighting, soft shadows and orbit controls. Compose it
 * with any device model, e.g. `<MockupCanvas><Phone>…</Phone></MockupCanvas>`.
 *
 * The stage itself — camera pose, orbit feel, light rig, shadow softness —
 * is defined once in `@area-mockups/core` and shared with every binding.
 */
export function MockupCanvas({
  children,
  controls = true,
  autoRotate = false,
  autoRotateSpeed = 1,
  freeRotation = false,
  zoom = false,
  fullscreen = false,
  shadows = true,
  shadowY = DEFAULT_SHADOW_Y,
  environment = true,
  background,
  camera,
  dpr = [1, 2],
  className,
  style,
}: MockupCanvasProps) {
  // Keep the orbit-zoom range sane for whatever camera the mockup configured:
  // a wide stage (billboard, van) must not snap back to a closer maxDistance
  // on the first drag.
  const cameraPosition = (camera as { position?: [number, number, number] } | undefined)?.position
  const orbitRange = orbitDistanceRange(cameraDistance(cameraPosition))

  // Full-screen view toggles the overlay wrapper into the browser's Fullscreen
  // API. Track the live state so the button flips its icon and label, and so a
  // dark backdrop only appears while actually filling the screen (keeping the
  // transparent-by-default canvas transparent the rest of the time).
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
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
  const handleDistanceChange = React.useCallback((distance: number) => {
    if (baseDistance.current === null) baseDistance.current = distance
    const percent = Math.round((baseDistance.current / distance) * 100)
    setZoomPercent((previous) => (previous === percent ? previous : percent))
  }, [])

  // The canvas's own container is a stacking context (see isolateCanvasStack
  // in device-screen), so the blending band is sealed inside it however large
  // it gets, and these buttons only have to beat the container itself. A
  // small number keeps the mockup from towering over the host page.
  const overlayZ = 2

  const canvas = (
    <Canvas
      className={className}
      // pan-y keeps pages scrollable on touch: vertical swipes scroll past the
      // mockup, horizontal drags (and mouse) orbit the device. With zoom on,
      // the canvas owns the pinch instead (touch-action none).
      style={{ touchAction: canvasTouchAction(zoom), background, ...style }}
      dpr={dpr}
      camera={camera ?? { position: DEFAULT_CAMERA_POSITION, fov: DEFAULT_CAMERA_FOV }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <TouchScrollFix zoom={zoom} />
      <ambientLight intensity={STAGE_AMBIENT_LIGHT.intensity} />
      <directionalLight position={STAGE_KEY_LIGHT.position} intensity={STAGE_KEY_LIGHT.intensity} />

      {environment && (
        <Environment resolution={STUDIO_ENV_RESOLUTION}>
          {/* The core's procedural light studio, rendered once into an env map. */}
          {STUDIO_LIGHTFORMERS.map((lf, i) => (
            <Lightformer
              key={i}
              form={lf.form}
              intensity={lf.intensity}
              position={lf.position}
              scale={lf.scale}
              rotation-x={lf.rotationX ?? 0}
              rotation-y={lf.rotationY ?? 0}
            />
          ))}
        </Environment>
      )}

      {children}

      {shadows && <ContactShadows position={[0, shadowY, 0]} {...CONTACT_SHADOW} />}

      {controls && (
        <TumbleControls
          ref={controlsRef}
          zoom={zoom}
          autoRotate={autoRotate}
          autoRotateSpeed={autoRotateSpeed}
          freeRotation={freeRotation}
          minDistance={orbitRange.min}
          maxDistance={orbitRange.max}
          onDistanceChange={zoom ? handleDistanceChange : undefined}
        />
      )}
    </Canvas>
  )

  // Zoom's +/− buttons need the orbit controls to move the camera; the
  // full-screen button is independent. With neither overlay, hand back the
  // bare canvas untouched.
  const showZoomButtons = zoom && controls
  if (!showZoomButtons && !fullscreen) return canvas

  // Wrap so the overlay buttons anchor to the canvas box — and so the
  // Fullscreen API has an element to expand. A dark backdrop fills the letter-
  // boxing only while actually full-screen, using `background` when provided.
  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: isFullscreen ? background ?? '#0b0d12' : undefined,
      }}
    >
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
          style={{
            position: 'absolute',
            right: 10,
            bottom: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            zIndex: overlayZ,
          }}
        >
          <button type="button" aria-label="Zoom in" style={OVERLAY_BUTTON_STYLE} onClick={() => zoomBy(0.8)}>
            +
          </button>
          <div
            aria-label="Zoom level"
            style={{
              alignSelf: 'center',
              padding: '2px 0',
              font: '600 10px/1 var(--font-mono, monospace)',
              color: '#7c8492',
              textAlign: 'center',
              userSelect: 'none',
            }}
          >
            {zoomPercent}%
          </div>
          <button type="button" aria-label="Zoom out" style={OVERLAY_BUTTON_STYLE} onClick={() => zoomBy(1.25)}>
            −
          </button>
        </div>
      )}
    </div>
  )
}
