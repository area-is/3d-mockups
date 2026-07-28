'use client'

import { useState } from 'react'

/** A macOS-flavored desktop for the laptop mockup: menu bar, dock, one live window. */
export function DesktopScreen() {
  const [clicks, setClicks] = useState(0)

  return (
    <div className="mac">
      <div className="mac-menubar">
        <span className="mac-menubar-brand"> area-3d-mockups</span>
        <span>9:41 AM</span>
      </div>

      <div className="mac-window">
        <div className="mac-window-titlebar">
          <span className="mac-light mac-light-close" />
          <span className="mac-light mac-light-min" />
          <span className="mac-light mac-light-max" />
          <span className="mac-window-title">counter.app</span>
        </div>
        <div className="mac-window-body">
          <p className="mac-count">{clicks}</p>
          <button type="button" onClick={() => setClicks((c) => c + 1)}>
            Click me
          </button>
        </div>
      </div>

      <div className="mac-dock" aria-hidden>
        <span style={{ background: 'linear-gradient(135deg, #8b7cf8, #22d3ee)' }} />
        <span style={{ background: 'linear-gradient(135deg, #f472b6, #fb7185)' }} />
        <span style={{ background: 'linear-gradient(135deg, #34d399, #a3e635)' }} />
        <span style={{ background: 'linear-gradient(135deg, #fbbf24, #f97316)' }} />
        <span style={{ background: 'linear-gradient(135deg, #60a5fa, #818cf8)' }} />
      </div>
    </div>
  )
}
