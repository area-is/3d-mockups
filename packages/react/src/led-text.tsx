import * as React from 'react'
import {
  LED_CYCLE_INTERVAL,
  LED_DOT_SIZE,
  LED_MARQUEE_SPEED,
  LED_ANIM_ATTR,
  ledCycleKeyframes,
  ledMarqueeKeyframes,
  ledMaskStyle,
  ledPanelStyle,
  LED_TEXT_BACKGROUND,
  LED_TEXT_COLOR,
} from '@area-3d-mockups/core'

// The screens only exist client-side (inside the WebGL canvas), but the docs
// site renders through Next - keep the server pass warning-free.
const useIsoLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect

export interface LEDTextProps {
  /**
   * What the sign says. A single string renders one line (scrolling as a
   * marquee when it doesn't fit); an array renders alternating pages
   * (`cycle`) or a multi-row board (`rows`), depending on `mode`.
   */
  text: string | readonly string[]
  /**
   * `'auto'` (default): a single string scrolls only when it overflows, an
   * array cycles page by page. `'marquee'` always scrolls, `'static'` never
   * does, `'cycle'` flips through the strings like an alternating
   * destination sign, `'rows'` stacks them as board rows (each row still
   * scrolls if it overflows - an arrivals board).
   */
  mode?: 'auto' | 'marquee' | 'static' | 'cycle' | 'rows'
  /** Lit-LED color. Amber by default; try `#ff9d1e`, `#ffd23c` or LED green. */
  color?: string
  /** Unlit panel color (also the grid between the LED dots). */
  background?: string
  /** Marquee speed in the panel's virtual CSS px per second. */
  speed?: number
  /** Seconds each page holds in `cycle` mode. */
  interval?: number
  /** LED pitch of the dot-matrix mask in CSS px; `0` disables the mask. */
  dotSize?: number
  /** Text alignment when a line fits without scrolling. */
  align?: 'left' | 'center' | 'right'
  /** Extra styles merged onto the panel root. */
  style?: React.CSSProperties
}

const JUSTIFY = { left: 'flex-start', center: 'center', right: 'flex-end' } as const

/**
 * One LED line: renders static text, upgrading itself to a seamless CSS
 * marquee when the text overflows (or when forced). The marquee duration is
 * derived from the measured text width, so the scroll speed stays constant
 * across messages and panel sizes.
 */
function LedLine({
  text,
  scroll,
  speed,
  align,
  fontSize,
}: {
  text: string
  scroll: 'auto' | 'always' | 'never'
  speed: number
  align: 'left' | 'center' | 'right'
  fontSize: string
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLSpanElement>(null)
  const [metrics, setMetrics] = React.useState({ overflow: false, width: 0 })

  useIsoLayoutEffect(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return
    const measure = () => {
      const width = content.offsetWidth
      setMetrics((prev) => {
        const overflow = width > container.clientWidth + 1
        return prev.overflow === overflow && prev.width === width ? prev : { overflow, width }
      })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    observer.observe(content)
    return () => observer.disconnect()
  }, [text])

  const scrolling = scroll === 'always' || (scroll === 'auto' && metrics.overflow)
  const name = `led-marquee-${React.useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  // One marquee loop travels exactly one copy (text + gap), measured in px.
  const duration = metrics.width > 0 ? metrics.width / speed : 8

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: scrolling ? 'flex-start' : JUSTIFY[align],
        fontSize,
      }}
    >
      {scrolling ? (
        <>
          <style>{ledMarqueeKeyframes(name)}</style>
          <div
            {...{ [LED_ANIM_ATTR]: name }}
            style={{
              display: 'inline-flex',
              // `pre` keeps run-of-spaces column alignment (arrivals rows)
              // and never wraps - LED boards are single-line.
              whiteSpace: 'pre',
              animation: `${name} ${duration}s linear infinite`,
            }}
          >
            <span ref={contentRef} style={{ paddingRight: '2.4em' }}>
              {text}
            </span>
            <span aria-hidden style={{ paddingRight: '2.4em' }}>
              {text}
            </span>
          </div>
        </>
      ) : (
        <span ref={contentRef} style={{ whiteSpace: 'pre' }}>
          {text}
        </span>
      )}
    </div>
  )
}

/**
 * The built-in LED sign renderer behind the string form of `destinationSign`
 * (bus) and `arrivals` (bus shelter) - exported so you can compose it
 * directly or restyle it anywhere else (a custom panel, a DOOH loop…).
 *
 * Pure CSS at runtime: glowing monospaced text behind a dot-matrix mask,
 * with a constant-speed marquee for overflowing lines and an instant page
 * flip for alternating messages. Font sizes use container-query units, so
 * the type scales with whatever screen region it's rendered into.
 */
export function LEDText({
  text,
  mode = 'auto',
  color = LED_TEXT_COLOR,
  background = LED_TEXT_BACKGROUND,
  speed = LED_MARQUEE_SPEED,
  interval = LED_CYCLE_INTERVAL,
  dotSize = LED_DOT_SIZE,
  align = 'center',
  style,
}: LEDTextProps) {
  const pages = React.useMemo(() => (typeof text === 'string' ? [text] : [...text]), [text])
  const resolved =
    mode === 'auto' ? (pages.length > 1 ? 'cycle' : 'single') : mode === 'cycle' && pages.length < 2 ? 'single' : mode
  const cycleName = `led-cycle-${React.useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  const panel: React.CSSProperties = {
    ...(ledPanelStyle({ color, background }) as React.CSSProperties),
    padding: resolved === 'rows' ? '4cqh 3cqw' : '0 3cqw',
    ...style,
  }
  const mask = dotSize > 0 && (
    <div aria-hidden style={ledMaskStyle(background, dotSize) as React.CSSProperties} />
  )

  if (resolved === 'rows') {
    return (
      <div style={panel}>
        {pages.map((row, i) => (
          <div
            key={i}
            style={{ flex: 1, minHeight: 0, display: 'flex', containerType: 'size' }}
          >
            <LedLine text={row} scroll="auto" speed={speed} align={align} fontSize="58cqh" />
          </div>
        ))}
        {mask}
      </div>
    )
  }

  if (resolved === 'cycle') {
    return (
      <div style={panel}>
        <style>{ledCycleKeyframes(cycleName, pages.length)}</style>
        <div
          {...{ [LED_ANIM_ATTR]: cycleName }}
          style={{ animation: `${cycleName} ${pages.length * interval}s steps(${pages.length}) infinite` }}
        >
          {pages.map((page, i) => (
            <div key={i} style={{ height: '100cqh', display: 'flex', alignItems: 'center' }}>
              <LedLine text={page} scroll="auto" speed={speed} align={align} fontSize="52cqh" />
            </div>
          ))}
        </div>
        {mask}
      </div>
    )
  }

  return (
    <div style={panel}>
      <LedLine
        text={pages.join(' · ')}
        scroll={resolved === 'marquee' ? 'always' : resolved === 'static' ? 'never' : 'auto'}
        speed={speed}
        align={align}
        fontSize="52cqh"
      />
      {mask}
    </div>
  )
}

/**
 * Whether a live-sign prop value is plain text meant for the built-in LED
 * renderer (a string or an array of strings) rather than custom JSX.
 */
export function isLedText(value: unknown): value is string | readonly string[] {
  return (
    typeof value === 'string' ||
    (Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string'))
  )
}
