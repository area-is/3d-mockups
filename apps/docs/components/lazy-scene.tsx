'use client'

import { useEffect, useRef, useState } from 'react'
import { SceneBoundary } from './scene-boundary'

/**
 * Mounts its children only while the wrapper is near the viewport, and
 * unmounts them once it scrolls well away.
 *
 * Browsers cap the number of live WebGL contexts (as few as 8 on mobile
 * Chrome) and silently kill the oldest context when the cap is exceeded -
 * on a page carrying several canvases that leaves the earlier ones showing
 * the "sad canvas" icon with the CSS3D screen floating detached. Keeping
 * only the nearby scenes mounted stays far under the cap and also skips the
 * GPU cost of rendering off-screen scenes.
 *
 * The wrapper fills its parent, so it must sit inside a container with a
 * fixed height (`.mockup-viewport`) for layout to hold while unmounted.
 */
export function LazyScene({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry?.isIntersecting ?? false),
      // Pre-mount roughly one card ahead of the scroll direction; the same
      // margin on the way out gives natural hysteresis (the fixed-height
      // viewport means mounting never shifts layout under the observer).
      { rootMargin: '320px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} style={{ width: '100%', height: '100%' }}>
      {visible ? <SceneBoundary>{children}</SceneBoundary> : null}
    </div>
  )
}
