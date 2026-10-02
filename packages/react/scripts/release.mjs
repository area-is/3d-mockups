/**
 * The two halves of a release that are bookkeeping rather than judgement:
 * bumping the version, and turning CHANGELOG.md into release notes.
 *
 *   node scripts/release.mjs prepare <patch|minor|major|x.y.z>
 *   node scripts/release.mjs notes [x.y.z]
 *
 * `prepare` sets the new version in packages/react/package.json and the root
 * lockfile, and renames the changelog's `## Unreleased` section to
 * `## x.y.z - YYYY-MM-DD` under a fresh, empty `## Unreleased`. Land that on
 * main (prepare-release.yml opens the PR) and release.yml publishes it. It
 * refuses an empty Unreleased section, because a release nobody wrote notes for
 * is usually a release nobody meant to cut.
 *
 * `notes` prints that version's section (default: the manifest's version) for
 * the GitHub Release, and exits 1 when there isn't one, which release.yml runs
 * *before* publishing so a missing entry stops the release rather than shipping
 * it with no notes. It also unwraps the changelog's hard-wrapped lines: GitHub
 * renders a single newline in a release body as a line break, so 80-column
 * prose would come out ragged.
 *
 * The version goes through `npm version -w` rather than a hand edit so the
 * manifest and lockfile are rewritten by npm itself. Against a workspace that
 * command never commits or tags, so neither does this.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = join(here, '..', '..', '..')
const MANIFEST = join(here, '..', 'package.json')
const CHANGELOG = join(ROOT, 'CHANGELOG.md')
const PACKAGE = 'react-3d-mockups'

const VERSION = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/

const readVersion = () => JSON.parse(readFileSync(MANIFEST, 'utf8')).version

function fail(message) {
  console.error(`release: ${message}`)
  process.exit(1)
}

/** Semver precedence: <0, 0 or >0. Build metadata is not accepted at all. */
function compare(a, b) {
  const [, ...pa] = a.match(VERSION)
  const [, ...pb] = b.match(VERSION)
  for (let i = 0; i < 3; i++) {
    if (Number(pa[i]) !== Number(pb[i])) return Number(pa[i]) - Number(pb[i])
  }
  // A prerelease sorts below its release: 1.0.0-rc.1 < 1.0.0.
  if (!pa[3] || !pb[3]) return (pa[3] ? -1 : 0) - (pb[3] ? -1 : 0)
  const ia = pa[3].split('.')
  const ib = pb[3].split('.')
  for (let i = 0; i < Math.max(ia.length, ib.length); i++) {
    if (ia[i] === undefined) return -1
    if (ib[i] === undefined) return 1
    if (ia[i] === ib[i]) continue
    const na = /^\d+$/.test(ia[i])
    const nb = /^\d+$/.test(ib[i])
    if (na && nb) return Number(ia[i]) - Number(ib[i])
    if (na !== nb) return na ? -1 : 1
    return ia[i] < ib[i] ? -1 : 1
  }
  return 0
}

function nextVersion(current, bump) {
  if (VERSION.test(bump)) return bump
  if (!['patch', 'minor', 'major'].includes(bump)) {
    fail(`expected patch, minor, major or an exact version like 1.2.3, got "${bump}"`)
  }
  const [, major, minor, patch, pre] = current.match(VERSION)
  // npm's rules for bumping out of a prerelease differ per keyword; spelling
  // the version out is clearer than reproducing them here.
  if (pre) fail(`${current} is a prerelease; pass the exact version to release instead of "${bump}"`)
  if (bump === 'major') return `${Number(major) + 1}.0.0`
  if (bump === 'minor') return `${major}.${Number(minor) + 1}.0`
  return `${major}.${minor}.${Number(patch) + 1}`
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** The body of the `## <title>` section: start/end offsets into `text`. */
function section(text, title) {
  const heading = new RegExp(`^## ${title}[ \\t]*$`, 'm').exec(text)
  if (!heading) return null
  const start = heading.index + heading[0].length
  const next = /^## /m.exec(text.slice(start))
  const end = next ? start + next.index : text.length
  return { headingStart: heading.index, start, end, body: text.slice(start, end).trim() }
}

/**
 * Joins hard-wrapped prose lines back into one line per paragraph or list
 * item. Fenced code is left exactly as written, and a line that starts a new
 * block (heading, list item, quote, table row) is never joined onto the last.
 */
function unwrap(markdown) {
  const out = []
  let fence = null
  let joinable = false
  for (const line of markdown.split('\n')) {
    const trimmed = line.trim()
    if (fence) {
      out.push(line)
      if (trimmed.startsWith(fence) && trimmed.replace(/[`~]/g, '') === '') fence = null
      continue
    }
    const opener = trimmed.match(/^(`{3,}|~{3,})/)
    if (opener) {
      fence = opener[1]
      out.push(line)
      joinable = false
      continue
    }
    if (trimmed === '') {
      out.push(line)
      joinable = false
      continue
    }
    if (joinable && !/^(#{1,6}\s|[-*+]\s|\d+[.)]\s|>|\|)/.test(trimmed)) {
      out[out.length - 1] += ` ${trimmed}`
      continue
    }
    out.push(line)
    joinable = !/^#{1,6}\s/.test(trimmed)
  }
  return out.join('\n')
}

function prepare(bump) {
  if (!bump) fail('usage: release.mjs prepare <patch|minor|major|x.y.z>')
  const current = readVersion()
  const next = nextVersion(current, bump)
  if (compare(next, current) <= 0) fail(`${next} is not newer than the current ${current}`)

  const changelog = readFileSync(CHANGELOG, 'utf8')
  if (section(changelog, `${escape(next)}(?: .*)?`)) fail(`CHANGELOG.md already has a ${next} section`)
  const unreleased = section(changelog, 'Unreleased')
  if (!unreleased) fail('CHANGELOG.md has no "## Unreleased" section to release')
  if (!unreleased.body) fail('the "## Unreleased" section of CHANGELOG.md is empty; describe the release first')

  const npm = (args) =>
    execFileSync('npm', args, {
      cwd: ROOT,
      stdio: ['ignore', 'ignore', 'inherit'],
      shell: process.platform === 'win32',
    })
  // Left to itself, `npm version -w` follows the bump with a full install of
  // every workspace, `prepare` build included: minutes on a laptop, and a
  // failure on a checkout with no node_modules (which is what
  // prepare-release.yml runs on). Bumping without it and then rewriting only
  // the lockfile gives the identical one-line lockfile change in a second.
  npm(['version', next, '-w', PACKAGE, '--no-git-tag-version', '--no-workspaces-update'])
  npm(['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund'])
  if (readVersion() !== next) fail(`npm version did not set ${next} in packages/react/package.json`)

  const date = new Date().toISOString().slice(0, 10)
  writeFileSync(
    CHANGELOG,
    changelog.slice(0, unreleased.headingStart) +
      `## Unreleased\n\n## ${next} - ${date}\n\n${unreleased.body}\n\n` +
      changelog.slice(unreleased.end),
  )
  console.log(`${PACKAGE} ${current} -> ${next}`)
}

function notes(version = readVersion()) {
  if (!VERSION.test(version)) fail(`"${version}" is not a version`)
  const found = section(readFileSync(CHANGELOG, 'utf8'), `${escape(version)}(?: .*)?`)
  if (!found || !found.body) fail(`CHANGELOG.md has no notes for ${version}; add a "## ${version}" section`)
  process.stdout.write(`${unwrap(found.body)}\n`)
}

const [command, arg] = process.argv.slice(2)
if (command === 'prepare') prepare(arg)
else if (command === 'notes') notes(arg)
else fail('usage: release.mjs prepare <patch|minor|major|x.y.z> | notes [x.y.z]')
