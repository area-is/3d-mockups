import { describe, expect, it } from 'vitest'
import { createCaptureHolds, takeCaptureHold, type DelayCapture } from '../stage/capture'

/**
 * A capture tool counts holds and takes its picture at zero, so every hold
 * must be released exactly once: one left behind stalls the capture until it
 * times out, and one released twice lets it fire while someone else's is
 * still outstanding.
 */
function counter() {
  const open = new Map<number, string>()
  let next = 0
  const delay: DelayCapture = (reason) => {
    const id = next++
    open.set(id, reason)
    return () => {
      if (!open.has(id)) throw new Error(`hold ${id} released twice`)
      open.delete(id)
    }
  }
  return { delay, open }
}

describe('takeCaptureHold', () => {
  it('releases exactly once however often it is called', () => {
    const { delay, open } = counter()
    const release = takeCaptureHold(delay, 'starting')
    expect([...open.values()]).toEqual(['starting'])
    release()
    release()
    expect(open.size).toBe(0)
  })

  it('is a no-op without a delayCapture', () => {
    expect(() => takeCaptureHold(undefined, 'starting')()).not.toThrow()
  })
})

describe('createCaptureHolds', () => {
  it('releases every hold taken before the frame in one go', () => {
    const { delay, open } = counter()
    const holds = createCaptureHolds(delay)
    expect(holds.pending).toBe(false)
    holds.hold('mount')
    holds.hold('prop change')
    expect(holds.pending).toBe(true)
    expect(open.size).toBe(2)
    holds.release()
    expect(holds.pending).toBe(false)
    expect(open.size).toBe(0)
    // Nothing pending: a second release has nothing to double-release.
    holds.release()
  })

  it('keeps a hold taken during a release for the next batch', () => {
    const { delay, open } = counter()
    const holds = createCaptureHolds((reason) => {
      const release = delay(reason)
      return () => {
        release()
        // The capture tool moves to its next frame as soon as it is released,
        // and that frame's change takes a hold straight away.
        if (reason === 'first') holds.hold('second')
      }
    })
    holds.hold('first')
    holds.release()
    expect([...open.values()]).toEqual(['second'])
    expect(holds.pending).toBe(true)
    holds.release()
    expect(open.size).toBe(0)
  })

  it('takes nothing without a delayCapture', () => {
    const holds = createCaptureHolds(undefined)
    holds.hold('mount')
    expect(holds.pending).toBe(false)
  })
})
