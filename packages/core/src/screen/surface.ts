/**
 * Framework-agnostic pieces of the live device screen: the CSS-pixel math that
 * maps a world-unit display onto a DOM element, the wrapper style for that
 * element, and the compositor-layer CSS every binding must inject.
 *
 * Each framework binding (React today; Svelte/Vue later) renders its own
 * content into a plain `<div>` styled with `screenSurfaceStyle()` and projects
 * it onto the display glass with its renderer's CSS3D/HTML bridge (drei's
 * `<Html transform>` in React, Threlte's `<HTML>`, TresJS's equivalent…).
 */

/** Per-corner radii in world units (top-left, top-right, bottom-right, bottom-left). */
export type ScreenRadius = number | [number, number, number, number]

/**
 * Class applied to the HTML bridge's portal root so it can be promoted to its
 * own compositor layer (see `SCREEN_LAYER_CSS`).
 */
export const SCREEN_LAYER_CLASS = 'area-mockups-screen-layer'

/**
 * Stylesheet every binding must inject alongside the screen:
 *
 * - **Compositor-layer promotion.** The portal root (the element carrying the
 *   CSS `perspective`) gets `will-change: transform`. Without it, Chromium can
 *   rasterize the perspective → preserve-3d → matrix3d chain against a
 *   pixel-snapped origin when the canvas lands on a fractional page offset
 *   (e.g. an odd window width centering a max-width layout), painting the
 *   screen visibly detached from the glass.
 *
 * - **Touch pan-y.** With drag-to-rotate on, `touch-action: pan-y` must cover
 *   the whole transformed div chain — the 3D layers are compositor boundaries,
 *   and Chromium ignores a pan-y set only on the content inside them, which
 *   would trap page scrolling.
 */
export const SCREEN_LAYER_CSS = `.${SCREEN_LAYER_CLASS}{will-change:transform}.${SCREEN_LAYER_CLASS}--pan,.${SCREEN_LAYER_CLASS}--pan>div,.${SCREEN_LAYER_CLASS}--pan>div>div,.${SCREEN_LAYER_CLASS}--pan>div>div>div{touch-action:pan-y}`

/** The wrapper class for the HTML bridge's portal root. */
export function screenLayerClass(dragToRotate: boolean): string {
  return dragToRotate ? `${SCREEN_LAYER_CLASS} ${SCREEN_LAYER_CLASS}--pan` : SCREEN_LAYER_CLASS
}

/** CSS px per world unit for a virtual display `resolution` CSS px wide. */
export function screenPxPerUnit(resolution: number, width: number): number {
  return resolution / width
}

/** CSS pixel height of the virtual display (width is `resolution`). */
export function screenCssHeight(resolution: number, width: number, height: number): number {
  return Math.round((resolution * height) / width)
}

/** CSS `border-radius` value for the display corners at the given px density. */
export function screenCornerRadiusCss(radius: ScreenRadius, pxPerUnit: number): string {
  const corners: [number, number, number, number] =
    typeof radius === 'number' ? [radius, radius, radius, radius] : radius
  return corners.map((r) => `${r * pxPerUnit}px`).join(' ')
}

/**
 * Scale factor for the HTML bridge so `resolution` CSS px span exactly `width`
 * world units (drei's `distanceFactor`, and its equivalents elsewhere).
 */
export function screenDistanceFactor(width: number, resolution: number): number {
  return (400 * width) / resolution
}

export interface ScreenSurfaceStyleOptions {
  /** Active display size in world units. */
  width: number
  height: number
  /** Corner rounding of the display in world units. */
  radius: ScreenRadius
  /** CSS pixel width of the virtual display; height follows the panel aspect. */
  resolution: number
  /** CSS background painted behind the content. */
  background?: string
  /** Let pointer events (clicks, scrolling, typing) reach the content. */
  allowInput?: boolean
  /** Whether >10px drags are handed off to the orbit controls (see drag-handoff). */
  dragToRotate?: boolean
}

/**
 * Style of the screen-content wrapper element. Property names are camelCased
 * (React `style` object compatible); other bindings convert as needed.
 */
export interface ScreenSurfaceStyle {
  position: 'relative'
  width: number
  height: number
  borderRadius: string
  overflow: 'hidden'
  background: string
  pointerEvents: 'auto' | 'none'
  touchAction: 'pan-y' | undefined
  backfaceVisibility: 'hidden'
  WebkitBackfaceVisibility: 'hidden'
  WebkitFontSmoothing: 'antialiased'
}

export function screenSurfaceStyle({
  width,
  height,
  radius,
  resolution,
  background = '#000000',
  allowInput = true,
  dragToRotate = true,
}: ScreenSurfaceStyleOptions): ScreenSurfaceStyle {
  const pxPerUnit = screenPxPerUnit(resolution, width)
  return {
    position: 'relative',
    width: resolution,
    height: screenCssHeight(resolution, width, height),
    borderRadius: screenCornerRadiusCss(radius, pxPerUnit),
    overflow: 'hidden',
    background,
    pointerEvents: allowInput ? 'auto' : 'none',
    // pan-y mirrors the canvas: on touch, vertical swipes over the screen
    // scroll the page; horizontal drags past the threshold rotate the
    // device; taps still click content.
    touchAction: dragToRotate ? 'pan-y' : undefined,
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    WebkitFontSmoothing: 'antialiased',
  }
}
