'use client'

import { useEffect, useState } from 'react'
import { Typewriter } from 'react-simple-typewriter'
import { usePrefersReducedMotion } from 'area-3d-mockups'

/**
 * The one word in the headline that changes.
 *
 * "Your app. In 3D." is only half the story - the library puts a poster on a
 * framed wall and a wrap on a milk carton just as happily as it puts an app on
 * a phone - so the noun cycles through what people actually mount on these
 * objects.
 *
 * `react-simple-typewriter` drives it: a word rotator with no dependencies of
 * its own and no styling framework attached, so it drops into this stylesheet
 * rather than dragging Tailwind in behind it.
 */
const WORDS = ['app', 'design', 'poster', 'artwork', 'prototype', 'ads']

export function HeroRotator() {
  const reducedMotion = usePrefersReducedMotion()
  // The server renders the first word, and so does the first client pass -
  // otherwise the headline would hydrate with a blank where its subject is,
  // which is both a mismatch and the worst possible LCP.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted || reducedMotion) return <span className="hero-rotator">{WORDS[0]}</span>

  return (
    <span className="hero-rotator">
      <Typewriter
        words={WORDS}
        // 0 rather than `true`: the prop counts runs, and false/0 is the
        // library's "forever".
        loop={0}
        cursor
        cursorStyle="_"
        typeSpeed={78}
        deleteSpeed={42}
        delaySpeed={1900}
      />
    </span>
  )
}
