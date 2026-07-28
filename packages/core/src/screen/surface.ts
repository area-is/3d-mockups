/**
 * Framework-agnostic pieces of the live device screen: the CSS-pixel math that
 * maps a world-unit display onto a DOM element, the wrapper style for that
 * element, and the compositor-layer CSS every binding must inject.
 *
 * A binding renders its own content into a plain `<div>` styled with
 * `screenSurfaceStyle()` and projects it onto the display glass with its
 * renderer's CSS3D/HTML bridge (drei's `<Html transform>` in React).
 */

/** Per-corner radii in world units (top-left, top-right, bottom-right, bottom-left). */
export type ScreenRadius = number | [number, number, number, number]

/**
 * Class applied to the HTML bridge's portal root so it can be promoted to its
 * own compositor layer (see `SCREEN_LAYER_CSS`).
 */
export const SCREEN_LAYER_CLASS = 'area-3d-mockups-screen-layer'

/**
 * Stylesheet every binding must inject alongside the screen.
 *
 * **Compositor-layer promotion.** The portal root (the element carrying the
 * CSS `perspective`) gets `will-change: transform`. Without it, Chromium can
 * rasterize the perspective → preserve-3d → matrix3d chain against a
 * pixel-snapped origin when the canvas lands on a fractional page offset
 * (e.g. an odd window width centering a max-width layout), painting the
 * screen visibly detached from the glass.
 *
 * Nothing here has to deal with touch: a screen's DOM is composited UNDER the
 * canvas (see `screenSurfaceStyle`), so the canvas owns every gesture and its
 * own `canvasTouchAction` is the only touch policy in play.
 */
export const SCREEN_LAYER_CSS = `.${SCREEN_LAYER_CLASS}{will-change:transform}`

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
  pointerEvents: 'none'
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
}: ScreenSurfaceStyleOptions): ScreenSurfaceStyle {
  const pxPerUnit = screenPxPerUnit(resolution, width)
  return {
    position: 'relative',
    width: resolution,
    height: screenCssHeight(resolution, width, height),
    borderRadius: screenCornerRadiusCss(radius, pxPerUnit),
    overflow: 'hidden',
    background,
    // Mockup screens are decorative: the DOM is composited under the canvas
    // so hardware masks it per-pixel, which also puts it out of reach of the
    // pointer. Declaring it keeps user content from hit-testing if a page
    // ever lifts the wrapper out of that stack.
    pointerEvents: 'none',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    WebkitFontSmoothing: 'antialiased',
  }
}
