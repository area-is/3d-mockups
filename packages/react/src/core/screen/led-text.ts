/**
 * Framework-agnostic styling for the built-in LED text renderer - the
 * amber dot-matrix look shared by transit LED surfaces (the bus destination
 * sign, the bus shelter's RTPI arrivals board).
 *
 * A binding renders plain strings into this look: a dark panel, glowing
 * monospaced capitals-style text, and a dot-matrix mask overlay. Motion is
 * pure CSS - a horizontal marquee for overflowing lines and a stepped
 * vertical page flip for alternating messages - so the sign animates without
 * per-frame JS. Font sizes use container-query units (`cqh`), so the same
 * styles fit any panel: the element returned by `ledPanelStyle` (and each
 * row in a multi-row board) declares `container-type: size`.
 *
 * Property names are camelCased (React `style` object compatible); other
 * bindings convert as needed.
 */

/** The classic amber of transit LED signage. */
export const LED_TEXT_COLOR = '#ffb424'

/** The unlit panel behind the LEDs. */
export const LED_TEXT_BACKGROUND = '#0a0a08'

/** Default marquee speed, CSS px/s in the panel's virtual pixels. */
export const LED_MARQUEE_SPEED = 70

/** Default seconds each page holds when cycling alternating messages. */
export const LED_CYCLE_INTERVAL = 2.8

/** Default LED pitch (dot-matrix mask cell) in CSS px. */
export const LED_DOT_SIZE = 4

export interface LedPanelStyleOptions {
  /** Lit-LED color. */
  color?: string
  /** Unlit panel color (also the grid between the LED dots). */
  background?: string
}

/**
 * The LED panel root: fills its screen region, paints the unlit panel, sets
 * the glowing LED type and declares itself a size container so the text
 * scales with the panel via `cqh` units.
 */
export function ledPanelStyle({
  color = LED_TEXT_COLOR,
  background = LED_TEXT_BACKGROUND,
}: LedPanelStyleOptions = {}): Record<string, string | number> {
  return {
    position: 'relative',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    background,
    color,
    fontFamily: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    fontWeight: 700,
    letterSpacing: '0.07em',
    lineHeight: 1,
    textShadow: `0 0 0.18em color-mix(in srgb, ${color} 75%, transparent)`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    containerType: 'size',
  }
}

/**
 * The dot-matrix mask overlaid on the whole panel: a repeating radial
 * gradient in the panel color that carves the glowing text into LED dots.
 */
export function ledMaskStyle(
  background: string = LED_TEXT_BACKGROUND,
  dotSize: number = LED_DOT_SIZE
): Record<string, string | number> {
  return {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background: `radial-gradient(circle at center, transparent 34%, ${background} 72%)`,
    backgroundSize: `${dotSize}px ${dotSize}px`,
  }
}

/**
 * Rule that stops an LED animation for visitors asking for reduced motion.
 *
 * The animated elements are inline-styled, so there is no class to hang a
 * media query on - each one carries `data-led-anim="&lt;name&gt;"` instead, and the
 * name is already unique per sign. Suppressed rather than hidden: a stopped
 * marquee still shows the head of its message, which is the readable part.
 */
export function ledReducedMotionRule(name: string): string {
  return `@media (prefers-reduced-motion:reduce){[data-led-anim="${name}"]{animation:none}}`
}

/** The attribute pairing an animated LED element with its reduced-motion rule. */
export const LED_ANIM_ATTR = 'data-led-anim'

/** Keyframes for the horizontal marquee (the strip holds two copies; −50% is one copy). */
export function ledMarqueeKeyframes(name: string): string {
  return `@keyframes ${name}{from{transform:translateX(0)}to{transform:translateX(-50%)}}${ledReducedMotionRule(name)}`
}

/**
 * Keyframes for cycling `pages` alternating messages: the page stack steps
 * up one full panel height per page (pair with `steps(pages)` timing so the
 * sign flips instantly, like real LED signage).
 */
export function ledCycleKeyframes(name: string, pages: number): string {
  return `@keyframes ${name}{from{transform:translateY(0)}to{transform:translateY(-${pages * 100}cqh)}}${ledReducedMotionRule(name)}`
}
