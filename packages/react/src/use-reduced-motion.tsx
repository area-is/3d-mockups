import * as React from 'react'
import { REDUCED_MOTION_QUERY } from './core'

const subscribe = (onChange: () => void): (() => void) => {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const query = window.matchMedia(REDUCED_MOTION_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

const getSnapshot = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(REDUCED_MOTION_QUERY).matches

// The server has no media queries, and guessing "reduce" would ship a frozen
// mockup to everyone in the SSR HTML. Assume motion, then correct on hydration.
const getServerSnapshot = (): boolean => false

/**
 * Whether the visitor asked their system to reduce motion.
 *
 * The mockups use this to hold still: `autoRotate` stops turning and `float`
 * settles at its rest pose, while every gesture keeps working - a reader who
 * wants to see the object from another angle still drags it there. Exported so
 * a host page can make the same call for its own motion.
 *
 * ```tsx
 * const still = usePrefersReducedMotion()
 * <GalaxyMockup autoRotate={!still} />
 * ```
 */
export function usePrefersReducedMotion(): boolean {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
