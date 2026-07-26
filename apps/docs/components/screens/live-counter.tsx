'use client'

import { useEffect, useState } from 'react'

/**
 * A screen whose React state keeps ticking on the glass: `useState` +
 * `useEffect` running inside the 3D mockup, re-rendering every second like it
 * would anywhere else in the page.
 */
export function LiveCounter() {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="screen live">
      <div className="screen-statusbar">
        <span>9:41</span>
        <span className="screen-statusicons">
          <i className="si si-signal" />
          <i className="si si-wifi" />
          <i className="si si-battery" />
        </span>
      </div>

      <div className="live-body">
        <p className="live-label">seconds on screen</p>
        <p className="live-count" key={seconds}>
          {seconds}
        </p>
        <div className="live-pulse" aria-hidden>
          <span />
          <span />
          <span />
        </div>
      </div>

      <p className="live-footnote">React state, running on a 3D screen.</p>
      <div className="screen-homebar" aria-hidden />
    </div>
  )
}
