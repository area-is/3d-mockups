'use client'

import { useEffect, useState } from 'react'

export function LockScreen() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const time = now
    ? now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--'
  const date = now
    ? now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
    : ''

  return (
    <div className="screen lock">
      <p className="lock-time">{time}</p>
      <p className="lock-date">{date}</p>

      <div className="lock-notification">
        <span className="lock-notification-icon" aria-hidden>
          ◈
        </span>
        <span>
          <strong>area-3d-mockups</strong>
          <br />
          Your 3D mockup is ready.
        </span>
      </div>

      <div className="lock-fingerprint" aria-hidden>
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <path d="M12 4.5a7.5 7.5 0 0 1 7.5 7.5c0 2.5-.4 4.9-1.2 7" />
          <path d="M12 7.5a4.5 4.5 0 0 1 4.5 4.5c0 2.3-.3 4.5-1 6.6" />
          <path d="M12 10.5a1.5 1.5 0 0 1 1.5 1.5c0 2.1-.3 4.2-.9 6.2" />
          <path d="M4.9 16.5c-.3-1.4-.4-2.9-.4-4.5A7.5 7.5 0 0 1 8 5.6" />
          <path d="M8.4 19.4c-.6-2-.9-4.1-.9-6.4" />
        </svg>
      </div>
      <div className="screen-homebar" aria-hidden />
    </div>
  )
}
