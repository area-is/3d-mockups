'use client'

import * as React from 'react'

/**
 * Whether this browser can actually give us a WebGL context.
 *
 * Feature-detected rather than assumed: `dynamic(..., { ssr: false })` resolves
 * happily whether or not WebGL exists, so a visitor with hardware acceleration
 * disabled, a locked-down enterprise profile or an old device previously got
 * either a permanent "Warming up the GPU…" or an uncaught throw out of the
 * renderer. The probe context is released immediately - browsers cap live
 * contexts, and this one must not count against a page full of scenes.
 */
function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    if (!gl) return false
    ;(gl.getExtension('WEBGL_lose_context') as { loseContext(): void } | null)?.loseContext()
    return true
  } catch {
    return false
  }
}

function Fallback({ note }: { note?: string }) {
  return (
    <div className="scene-fallback" role="note">
      <strong>This scene needs WebGL.</strong>
      <span>
        {note ??
          'Your browser could not open a 3D context. Turning on hardware acceleration, or opening this page in a recent Chrome, Safari, Firefox or Edge, brings the mockups back.'}
      </span>
    </div>
  )
}

class SceneErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <Fallback note="The 3D scene stopped unexpectedly. Reloading the page usually clears it." />
      )
    }
    return this.props.children
  }
}

/**
 * Wraps a 3D scene so a browser without WebGL - or a scene that throws mid-
 * render - degrades to an explanation instead of a dead frame.
 *
 * The capability check runs in an effect rather than during render, so the
 * server and the first client render agree; `null` for that one frame keeps
 * the reserved height without flashing a fallback at visitors who do have
 * WebGL.
 */
export function SceneBoundary({ children }: { children: React.ReactNode }) {
  const [supported, setSupported] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    setSupported(detectWebGL())
  }, [])

  if (supported === null) return null
  if (!supported) return <Fallback />
  return <SceneErrorBoundary>{children}</SceneErrorBoundary>
}
