/**
 * Holding an outside capture until the picture it would take is complete.
 *
 * A mockup does not draw in one place at one time. WebGL draws the device on
 * the animation frame after a change, the renderer itself starts up
 * asynchronously, and every screen is a React root of its own that commits
 * its DOM after the scene's commit, then waits a frame to be placed on the
 * glass. A tool that photographs the page - Remotion between video frames, a
 * screenshot script - cannot see any of that, and captures whatever happens
 * to be on screen: the first frame of a freshly mounted mockup came out with
 * no device at all or with a bare hole where the screen belongs.
 *
 * `delayCapture` is how a canvas tells it. The canvas calls it with a reason
 * whenever a frame is on its way that has not been drawn, and calls the
 * function it returns once that frame is on screen. The shape is Remotion's
 * `delayRender`/`continueRender` pair folded into one call, and anything that
 * counts outstanding work can sit behind it.
 */
export type DelayCapture = (reason: string) => () => void

const noop = () => {}

/**
 * Take one hold. The release is idempotent - it is called from effect
 * cleanups and frame callbacks alike, and a hold released twice would
 * release someone else's in a counter behind it.
 */
export function takeCaptureHold(delay: DelayCapture | undefined, reason: string): () => void {
  if (!delay) return noop
  let release: (() => void) | null = delay(reason)
  return () => {
    const done = release
    release = null
    done?.()
  }
}

/**
 * Holds taken while a frame is on its way, released together once it lands.
 *
 * Several holds can pile up before the frame they wait for - a prop change
 * and a context change in one commit, a mount and its first update - and one
 * drawn frame answers all of them, so they are kept as a batch rather than
 * matched one to one.
 */
export interface CaptureHolds {
  /** Take a hold, released by the next `release()`. Does nothing without a `delayCapture`. */
  hold(reason: string): void
  /** Whether any hold is waiting. */
  readonly pending: boolean
  /** Release every hold taken so far. Safe to call with none pending. */
  release(): void
}

export function createCaptureHolds(delay: DelayCapture | undefined): CaptureHolds {
  let held: (() => void)[] = []
  return {
    hold(reason) {
      if (delay) held.push(takeCaptureHold(delay, reason))
    },
    get pending() {
      return held.length > 0
    },
    release() {
      // Swapped out before releasing: a release that synchronously takes a
      // new hold (a capture tool advancing to its next frame) must land in the
      // next batch, not be released by this one.
      const batch = held
      held = []
      for (const release of batch) release()
    },
  }
}
