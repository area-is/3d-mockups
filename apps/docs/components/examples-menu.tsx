'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { SITE_EXAMPLES } from './site-examples'

/** "Examples" header dropdown: one entry today, room for more. */
export function ExamplesMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [open])

  return (
    <span className="nav-menu" data-open={open} ref={ref}>
      <button
        type="button"
        className="nav-menu-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        Examples <span className="nav-menu-caret">▼</span>
      </button>
      {open ? (
        <span className="nav-menu-pop" role="menu">
          {SITE_EXAMPLES.map((example) => (
            <Link
              key={example.href}
              href={example.href}
              className="nav-menu-item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <span className="nav-menu-item-title">{example.title}</span>
              <span className="nav-menu-item-desc">{example.description}</span>
            </Link>
          ))}
          <span className="nav-menu-note">More examples soon</span>
        </span>
      ) : null}
    </span>
  )
}
