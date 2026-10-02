/**
 * Keeps the numbers the docs quote about the objects, and the model counts,
 * honest against what the library measures. Run by `devices:check` after
 * `sync-device-table.mjs`, which does the same for the devices table.
 *
 *   node scripts/check-docs-data.mjs           check (exit 1 on drift)
 *   node scripts/check-docs-data.mjs --write   rewrite the sizes and counts
 *
 * What it checks:
 *
 * - `docs/objects.mdx`, "Default virtual px": the first size in each cell is
 *   the object's primary region, the one bare children fill. A later size
 *   names its region by label ("960×200 street side"). These are what people
 *   size artwork against, and five of them had drifted.
 * - `docs/objects.mdx`, "Multiple live surfaces": the table of each object's
 *   slots, generated from its region list, so no surface goes unmentioned.
 * - The model counts in the READMEs and the docs' introduction: "all N
 *   models", "N models in all" and "(N devices, N objects)".
 * - `dist/catalog.json` is what the catalog code produces now, so a stale
 *   build cannot ship last release's rows.
 *
 * It reads the built `dist/core/`, so run `npm run build` first.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const pkg = join(here, '..')
const repo = join(pkg, '..', '..')
const load = (path) => import(pathToFileURL(join(pkg, 'dist', 'core', path)).href)
const { mockupInfo, MOCKUP_KINDS, DEVICE_KINDS, DEVICE_LINEUP } = await load('index.js')
const { catalogEntries } = await load('catalog.js')

const OBJECTS_DOC = join(repo, 'apps', 'docs', 'content', 'docs', 'objects.mdx')
const COUNTED = [join(pkg, 'README.md'), join(repo, 'README.md'), join(repo, 'apps', 'docs', 'content', 'docs', 'index.mdx')]

const WRITE = process.argv.slice(2).includes('--write')
const problems = []

/* ---------- The objects table ---------- */

/** Component names whose kind is not the name with its first letter lowered. */
const KIND_OF = { IDCard: 'idCard', TVSet: 'tv', DOOHTotem: 'doohTotem' }
/** The custom shapes have no default size; the column quotes only their width. */
const PROPS_OF = {
  customPanel: { size: { width: 100, height: 200 } },
  customBox: { size: { width: 100, height: 200, depth: 50 } },
}

const kindOf = (component) => KIND_OF[component] ?? component.charAt(0).toLowerCase() + component.slice(1)
const words = (s) => s.toLowerCase().replace(/[^a-z]+/g, ' ').trim()

/** The region a size's trailing words name, by label prefix ("street side" → "Street-side ad"). */
function regionNamed(info, trailing) {
  const want = words(trailing)
  return info.list.find((r) => words(r.label).startsWith(want) || words(r.name) === want)
}

let doc = readFileSync(OBJECTS_DOC, 'utf8')
const tableRows = doc.split('\n').filter((line) => /^\| [^-|][^|]*\| `\w+` \|/.test(line))
const tableComponents = []

for (const line of tableRows) {
  const cells = line.split('|').map((c) => c.trim())
  const component = cells[2].replace(/`/g, '')
  const kind = kindOf(component)
  if (!MOCKUP_KINDS.includes(kind)) {
    problems.push(`objects.mdx: no mockup kind "${kind}" for the row \`${component}\``)
    continue
  }
  tableComponents.push([component, kind])
  const info = mockupInfo(kind, PROPS_OF[kind] ?? {})
  const cell = cells[5]
  let fixed = cell
  // `W×H words`, or `W wide words` where only the width is fixed.
  const sizes = [...cell.matchAll(/(\d+)(?:×(\d+)| wide)([^,\d]*)/g)]
  if (sizes.length === 0) problems.push(`objects.mdx: no size in the \`${component}\` row's "${cell}"`)
  sizes.forEach((m, i) => {
    const region = i === 0 ? info.primary : regionNamed(info, m[3])
    if (!region) {
      problems.push(`objects.mdx: \`${component}\` has no region called "${m[3].trim()}" (${info.list.map((r) => r.label).join(', ')})`)
      return
    }
    const { width, height } = region.px
    const okWidth = Number(m[1]) === width
    const okHeight = m[2] === undefined || Number(m[2]) === height
    if (okWidth && okHeight) return
    const quoted = m[2] === undefined ? `${m[1]} wide` : `${m[1]}×${m[2]}`
    const actual = m[2] === undefined ? `${width} wide` : `${width}×${height}`
    problems.push(`objects.mdx: \`${component}\` ${region.label.toLowerCase()} is ${actual}, the table says ${quoted}`)
    fixed = fixed.replace(m[0], m[0].replace(quoted, actual))
  })
  if (fixed !== cell) doc = doc.replace(line, line.replace(` ${cell} |`, ` ${fixed} |`))
}

// The slots table under "Multiple live surfaces" is generated: one row per
// object in the table above that has more than one region.
const slotName = (region) => region.charAt(0).toUpperCase() + region.slice(1)
const SLOTS_TABLE = /(\| Object \| Bare children fill \| Slots \|\n\| --- \| --- \| --- \|\n)((?:\|[^\n]*\n)*)/
const slotRows = tableComponents
  .map(([component, kind]) => {
    const { list, primary } = mockupInfo(kind, PROPS_OF[kind] ?? {})
    const slots = [...new Set(list.filter((r) => r.name !== primary.name).map((r) => r.name))]
    if (slots.length === 0) return null
    const named = slots.map((name) => `\`<${component}.${slotName(name)}>\``).join(', ')
    return `| \`${component}\` | ${primary.label.toLowerCase()} | ${named} |\n`
  })
  .filter(Boolean)
  .join('')
const slotsTable = doc.match(SLOTS_TABLE)
if (!slotsTable) {
  problems.push('objects.mdx: no "| Object | Bare children fill | Slots |" table under "Multiple live surfaces"')
} else if (slotsTable[2] !== slotRows) {
  problems.push('objects.mdx: the slots table under "Multiple live surfaces" is out of date')
  doc = doc.replace(SLOTS_TABLE, (_m, head) => head + slotRows)
}

if (WRITE) writeFileSync(OBJECTS_DOC, doc)

/* ---------- Model counts ---------- */

// Every device model is a lineup entry, plus the one-model Studio Display;
// every other kind is one object.
const devices = Object.values(DEVICE_LINEUP).reduce((n, models) => n + Object.keys(models).length, 0) + 1
const objects = MOCKUP_KINDS.filter((k) => !DEVICE_KINDS.includes(k) && k !== 'studioDisplay').length
const models = devices + objects

for (const file of COUNTED) {
  const text = readFileSync(file, 'utf8')
  const next = text
    // "all N models" or "N models in all", wrapped across a line or not.
    // Only the numbers are rewritten, so the line breaks stay where they were.
    .replace(/\ball\s+(\d+)\s+models\b|\b(\d+)\s+models\s+in\s+all\b/g, (m, first, second) => {
      if (Number(first ?? second) !== models) problems.push(`${file}: "${m.replace(/\s+/g, ' ')}", there are ${models}`)
      return m.replace(/\d+/, String(models))
    })
    .replace(/\((\d+)\s+devices,\s+(\d+)\s+objects\)/g, (m, d, o) => {
      if (Number(d) !== devices || Number(o) !== objects) {
        problems.push(`${file}: "${m.replace(/\s+/g, ' ')}", there are ${devices} devices and ${objects} objects`)
      }
      let i = 0
      return m.replace(/\d+/g, () => String(i++ === 0 ? devices : objects))
    })
  if (WRITE && next !== text) writeFileSync(file, next)
}

/* ---------- catalog.json ---------- */

const published = JSON.parse(readFileSync(join(pkg, 'dist', 'catalog.json'), 'utf8'))
if (JSON.stringify(published.entries) !== JSON.stringify(catalogEntries())) {
  problems.push('dist/catalog.json does not match what src/core/catalog.ts produces - rebuild the package')
}

/* ---------- Report ---------- */

console.log(`Objects table: ${tableComponents.length} rows. Models: ${models} (${devices} devices, ${objects} objects).`)
if (problems.length === 0) {
  console.log('Docs data matches the library.')
} else if (WRITE) {
  for (const p of problems) console.log(`  fixed  ${p}`)
  console.log('\nRewrote what it could; a catalog line above needs a rebuild, and a missing table a hand edit.')
} else {
  for (const p of problems) console.error(`  ${p}`)
  console.error(`\n${problems.length} problem(s). \`npm run devices:sync\` rewrites the sizes, counts and slots table.`)
  process.exitCode = 1
}
