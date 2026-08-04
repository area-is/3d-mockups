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

/**
 * Steps `screenRasterScale` may return. Powers of two so a screen that changes
 * step lands on a scale the compositor has likely already rastered content at,
 * and so the step boundaries are far apart - a viewport that drifts by a few
 * pixels can never sit on one and re-raster the screen every resize.
 */
const RASTER_STEPS = [1, 1 / 2, 1 / 4, 1 / 8, 1 / 16] as const

/**
 * How much of the virtual display to actually PAINT, as a fraction of its CSS
 * size. 1 paints every declared pixel; 1/4 lays the content out at the full
 * `resolution` and paints it a quarter of the size.
 *
 * Why a screen ever paints smaller than it is declared: Chromium rasterizes a
 * layer at a scale derived from the transform that draws it, but a transform
 * with PERSPECTIVE has no meaningful 2d scale, so it falls back to the device
 * scale factor - and the HTML bridge puts every screen under a CSS
 * `perspective`. A 1512x982 laptop display is therefore rasterized at
 * 1512x982 x dpr REGARDLESS of how small the mockup is on the page: 4536x2946
 * device pixels on a 3x phone, ~53 MB of tile memory, for a screen occupying
 * perhaps 120 pixels of it. Past the compositor's tile budget the tiles it
 * cannot afford are simply never rasterized, and they composite as holes - the
 * blank rectangles that appear over a phone's mockup screens, and that a drag
 * brings back because moving the layer re-prioritizes every tile.
 *
 * The bound is the canvas: a screen is drawn INTO the mockup canvas, so it can
 * never be shown larger than the canvas is, and painting it at more device
 * pixels than the canvas has can add no detail. Scaling until the painted
 * layer just covers the canvas keeps the screen sampled at or above 1:1 at any
 * pose while cutting tile memory by the square of the step - the 3x phone
 * above drops to 1134x738, ~3 MB.
 *
 * Returns 1 whenever the display is already smaller than the canvas can show,
 * which is every desktop-density case; only a high-DPI viewport small enough
 * for the fallback to over-rasterize steps down.
 */
export function screenRasterScale({
  layerPx,
  canvasPx,
  devicePixelRatio,
}: {
  /** Longest side of the virtual display, in CSS px. */
  layerPx: number
  /** Longest side of the canvas's drawing buffer, in DEVICE px. */
  canvasPx: number
  /** Raster density the compositor falls back to (`window.devicePixelRatio`). */
  devicePixelRatio: number
}): number {
  if (!(layerPx > 0) || !(canvasPx > 0) || !(devicePixelRatio > 0)) return 1
  const needed = canvasPx / (layerPx * devicePixelRatio)
  if (!Number.isFinite(needed) || needed >= 1) return 1
  // Smallest step that still paints at least `canvasPx` device pixels across.
  let scale: number = RASTER_STEPS[RASTER_STEPS.length - 1]!
  for (const step of RASTER_STEPS) if (step >= needed) scale = step
  return scale
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
