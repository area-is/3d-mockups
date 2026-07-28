import type { Vector3 } from 'three'

/**
 * The shared mockup stage: camera, orbit, shadow and touch defaults every
 * framework binding builds its canvas from, plus the imperative helpers
 * (zoom, fullscreen) behind the overlay controls.
 */

/** Default camera pose shared by all mockups. */
export const DEFAULT_CAMERA_POSITION: [number, number, number] = [0, 0.5, 7.4]
export const DEFAULT_CAMERA_FOV = 40
/** Orbit distance assumed when a mockup doesn't configure its own camera. */
export const DEFAULT_CAMERA_DISTANCE = 7.4

/**
 * Y position (world units) of the default contact-shadow plane. Sits just
 * under the bundled phone (body height 4, centered on the origin), grounding
 * the device on its shadow instead of leaving it floating in mid-air.
 */
export const DEFAULT_SHADOW_Y = -2.05

/** Soft contact shadow under the device. */
export const CONTACT_SHADOW = { opacity: 0.45, scale: 13, blur: 2.6, far: 4.5 } as const

/**
 * Rotation feel shared by all mockups: pan stays disabled (the axis is always
 * the stage center) and motion is damped. By default vertical rotation stays
 * within the classic polar clamp below; opting into free rotation removes the
 * clamp for a full 360° tumble in every direction - see `TumbleOrbit`.
 */
export const ORBIT = {
  enablePan: false,
  dampingFactor: 0.08,
  /** Default polar clamp (radians from the top pole) when free rotation is off. */
  minPolarAngle: 0.5,
  maxPolarAngle: Math.PI - 0.5,
} as const

/** Camera distance from the origin, or the stage default if none is configured. */
export function cameraDistance(position?: readonly [number, number, number]): number {
  return position ? Math.hypot(position[0], position[1], position[2]) : DEFAULT_CAMERA_DISTANCE
}

/**
 * Orbit-zoom range for whatever camera the mockup configured: a wide stage
 * (billboard, van) must not snap back to a closer maxDistance on the first drag.
 */
export function orbitDistanceRange(distance: number): { min: number; max: number } {
  // The near limit allows ~8x magnification over the configured distance -
  // deep enough to inspect seams and ports close up.
  return { min: distance * 0.12, max: Math.max(12, distance * 1.35) }
}

/**
 * touch-action for the WebGL canvas. pan-y keeps pages scrollable on touch:
 * vertical swipes scroll past the mockup, horizontal drags (and mouse) orbit
 * the device. With zoom on, the trade flips: pinch must reach the controls,
 * so the canvas keeps `none` - the mockup owns two-finger gestures and
 * vertical page scrolling starts outside it.
 */
export function canvasTouchAction(zoom: boolean): 'none' | 'pan-y' {
  return zoom ? 'none' : 'pan-y'
}

/** The slice of an orbit-controls instance the zoom buttons need (three-stdlib compatible). */
export interface OrbitZoomControls {
  object: { position: Vector3 }
  target: Vector3
  minDistance: number
  maxDistance: number
  update(): void
}

/** Dolly the orbit camera toward/away from its target, clamped to the controls' range. */
export function orbitZoomBy(controls: OrbitZoomControls, factor: number): void {
  const camera = controls.object
  const offset = camera.position.clone().sub(controls.target)
  const length = Math.min(
    Math.max(offset.length() * factor, controls.minDistance),
    controls.maxDistance
  )
  offset.setLength(length)
  camera.position.copy(controls.target).add(offset)
  controls.update()
}

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element
  webkitExitFullscreen?: () => Promise<void> | void
}
type FullscreenTarget = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
}

/** The element currently in fullscreen, if any (WebKit-prefixed engines included). */
export function activeFullscreenElement(doc: Document = document): Element | null {
  const d = doc as FullscreenDocument
  return d.fullscreenElement ?? d.webkitFullscreenElement ?? null
}

/** Expand `el` to fullscreen, or collapse if something is already fullscreen. */
export function toggleFullscreen(el: HTMLElement): void {
  const doc = el.ownerDocument as FullscreenDocument
  const target = el as FullscreenTarget
  if (activeFullscreenElement(doc)) {
    ;(doc.exitFullscreen ?? doc.webkitExitFullscreen)?.call(doc)
  } else {
    ;(target.requestFullscreen ?? target.webkitRequestFullscreen)?.call(target)
  }
}
