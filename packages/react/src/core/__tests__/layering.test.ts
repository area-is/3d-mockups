import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * The layering rule, enforced.
 *
 * `src/core` depends on `three` at most and never on React. That used to be
 * guaranteed by a package boundary - the core was its own workspace package,
 * with no React in its dependencies or its tsconfig, so importing a hook was a
 * hard error. Merging the core in made the boundary a directory convention
 * instead, and conventions erode the first time someone is in a hurry.
 *
 * This is what makes the rule cost something to break again. It is also what
 * keeps this suite runnable with no DOM, no WebGL and no renderer: the moment a
 * spec reaches for `useMemo`, the numbers stop being testable on their own.
 *
 * See ARCHITECTURE.md ("The layering rule").
 */
const CORE = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Bare module specifiers that would drag a renderer into the core. */
const FORBIDDEN = [/^react$/, /^react-dom(\/|$)/, /^@react-three\//]

const IMPORT = /(?:^|\n)\s*(?:import|export)\s[^;]*?from\s*['"]([^'"]+)['"]/g

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sources(path)
    return /\.tsx?$/.test(entry.name) ? [path] : []
  })
}

describe('src/core imports nothing from React', () => {
  const files = sources(CORE)

  it('finds the core sources at all', () => {
    // Guards the guard: a rename that empties this list would otherwise turn
    // the whole suite into a silent pass.
    expect(files.length).toBeGreaterThan(30)
  })

  it.each(files.map((file) => [relative(CORE, file), file]))('%s', (_name, file) => {
    const source = readFileSync(file, 'utf8')
    const offenders = [...source.matchAll(IMPORT)]
      .map((match) => match[1] as string)
      .filter((specifier) => FORBIDDEN.some((pattern) => pattern.test(specifier)))
    expect(offenders).toEqual([])
  })
})
