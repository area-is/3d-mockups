import { useCallback } from 'react'
import { useDelayRender } from 'remotion'
import type { DelayCapture } from 'react-3d-mockups'

/**
 * `delayCapture` for a mockup in a Remotion composition: every frame the
 * mockup has not drawn yet becomes a `delayRender` handle, so Remotion waits
 * for the renderer to start, the scene to redraw and each screen's content to
 * land on the glass before it takes the frame.
 */
export function useMockupCapture(): DelayCapture {
  const { delayRender, continueRender } = useDelayRender()
  return useCallback(
    (reason: string) => {
      const handle = delayRender(reason)
      return () => continueRender(handle)
    },
    [delayRender, continueRender]
  )
}
