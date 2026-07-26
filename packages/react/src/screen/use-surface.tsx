import * as React from 'react'
import { screenCssHeight, screenPxPerUnit, type ScreenRadius } from '@area-mockups/core'

/**
 * What the surface your content is rendering into actually resolved to.
 *
 * This is the runtime companion to `mockupInfo`. `mockupInfo` answers "how big
 * is an S26 screen?" from pure data; `useSurface` answers "how big am I, right
 * now?" from inside the surface — which is a different question the moment a
 * slot overrides anything:
 *
 * ```tsx
 * <GalaxyMockup.Screen resolution={480}>
 *   <MyApp />   // useSurface() → 480x1040, not the device default 360x780
 * </GalaxyMockup.Screen>
 * ```
 */
export interface SurfaceInfo {
  /**
   * Which region this content is rendering into (`'screen'`, `'cover'`…).
   * `undefined` when the surface did not name itself — never a guessed value.
   */
  region?: string
  /** The surface in CSS pixels — the viewport your layout sees. */
  width: number
  height: number
  /** The same surface in three.js world units. */
  units: { width: number; height: number }
  /** CSS pixels per world unit on this surface. */
  pxPerUnit: number
  /** The resolved `resolution` (CSS pixel width) after any slot override. */
  resolution: number
  /** Corner rounding in world units. */
  radius: ScreenRadius
  /** The CSS background painted behind this content. */
  background?: string
}

const SurfaceContext = React.createContext<SurfaceInfo | null>(null)

export interface SurfaceProviderProps {
  region?: string
  width: number
  height: number
  radius: ScreenRadius
  resolution: number
  background?: string
  children?: React.ReactNode
}

/**
 * Publishes the resolved surface to its content. Rendered by `DeviceScreen`
 * around the children it portals onto the glass — never used directly.
 */
export function SurfaceProvider({
  region,
  width,
  height,
  radius,
  resolution,
  background,
  children,
}: SurfaceProviderProps) {
  const value = React.useMemo<SurfaceInfo>(
    () => ({
      region,
      width: resolution,
      height: screenCssHeight(resolution, width, height),
      units: { width, height },
      pxPerUnit: screenPxPerUnit(resolution, width),
      resolution,
      radius,
      background,
    }),
    [region, width, height, radius, resolution, background]
  )
  return <SurfaceContext.Provider value={value}>{children}</SurfaceContext.Provider>
}

/**
 * Read the surface the calling component is rendering into.
 *
 * Only valid inside a mockup's screen content — the values come from the
 * surface that is actually being rendered, slot overrides included, so they
 * are correct by construction rather than re-derived.
 *
 * ```tsx
 * function StatusBar() {
 *   const { width, pxPerUnit } = useSurface()
 *   return <div style={{ width, height: Math.round(pxPerUnit * 0.1) }} />
 * }
 * ```
 *
 * Throws outside a screen. For a component that renders both inside a mockup
 * and on a normal page, use `useSurfaceOptional`.
 */
export function useSurface(): SurfaceInfo {
  const surface = React.useContext(SurfaceContext)
  if (!surface) {
    throw new Error(
      '[area-mockups] useSurface() must be called from content rendered inside a mockup surface ' +
        '(a device screen or a print face). Use useSurfaceOptional() if the component also renders outside one.'
    )
  }
  return surface
}

/** `useSurface`, but `null` outside a mockup surface instead of throwing. */
export function useSurfaceOptional(): SurfaceInfo | null {
  return React.useContext(SurfaceContext)
}
