'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ExamplesMenu } from './examples-menu'
import { SITE_EXAMPLES } from './site-examples'

const GITHUB_URL = 'https://github.com/area-is/3d-mockups'

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" width="19" height="19" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

/**
 * The marketing site's header navigation.
 *
 * Two layouts out of one markup, switched purely in CSS: the wide row of links
 * on desktop, and - below the breakpoint where that row stops fitting - a
 * disclosure button opening a full-width sheet under the header. The links used
 * to be `display: none` on narrow screens, which left phones with no way to
 * reach the docs or the examples at all; the sheet is what puts them back.
 */
export function SiteNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const ref = useRef<HTMLElement>(null)

  // Route changes come from tapping a link in the sheet, so the sheet closes
  // itself rather than every link having to remember to.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    // A resize past the breakpoint swaps the layout under the sheet; drop it
    // rather than leave an open panel hanging off the desktop header.
    const wide = window.matchMedia('(min-width: 761px)')
    const onWide = () => {
      if (wide.matches) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    wide.addEventListener('change', onWide)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
      wide.removeEventListener('change', onWide)
    }
  }, [open])

  return (
    <nav className="site-nav" data-open={open} ref={ref}>
      <span className="site-nav-wide">
        <Link href="/docs" className="nav-plain">
          Docs
        </Link>
        <ExamplesMenu />
      </span>

      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="GitHub"
        className="nav-icon-btn"
      >
        <GitHubMark />
      </a>

      <button
        type="button"
        className="nav-burger"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="site-nav-sheet"
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          {open ? (
            <>
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </>
          ) : (
            <>
              <path d="M3 6h18" />
              <path d="M3 12h18" />
              <path d="M3 18h18" />
            </>
          )}
        </svg>
      </button>

      <div className="nav-sheet" id="site-nav-sheet" hidden={!open}>
        <Link href="/docs" className="nav-sheet-link">
          Docs
        </Link>
        {SITE_EXAMPLES.map((example) => (
          <Link key={example.href} href={example.href} className="nav-sheet-link">
            {example.title} example
          </Link>
        ))}
      </div>
    </nav>
  )
}
