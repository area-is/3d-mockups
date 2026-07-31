/**
 * Keeps the Portrait/Landscape columns of `docs/devices.mdx` honest.
 *
 * Those two columns are the only part of that table the library can derive -
 * everything else (body dimensions, panel diagonal, panel pixels) is hardware
 * fact, hand-maintained. So this doesn't regenerate the table wholesale; it
 * regenerates the drift-prone half from the catalog and leaves the rest alone.
 *
 *   node scripts/sync-device-table.mjs           check (exit 1 on drift)
 *   node scripts/sync-device-table.mjs --write   rewrite the two columns
 *
 * Why it matters: the library derives a screen's CSS height from the *modelled
 * world-unit rect's* aspect (`screenCssHeight` = round(resolution x height /
 * width)), while the table lists the panel's own point grid. They agree only
 * when the modelled aspect matches the panel's pixel aspect. Where it doesn't,
 * the rendered height is off by a pixel or three - and the visual check is
 * blind to it, because render and report share the same slightly-wrong rect.
 *
 * On a mismatch it also prints the spec edit that would close the gap, using
 * the panel's diagonal as an independent reference for which dimension is the
 * wrong one.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
// `import()` of an absolute path only works on POSIX; on Windows `C:\...` reads
// as a `c:` URL scheme and throws. A file:// URL is portable across both.
const core = await import(pathToFileURL(join(here, '..', 'dist', 'core.js')).href)
const { mockupInfo } = core

const DOC = join(here, '..', '..', '..', 'apps', 'docs', 'content', 'docs', 'devices.mdx')

/** Maps a `variant` cell in devices.mdx onto a registry kind + props. */
const ROWS = {
  s26: ['galaxy', { variant: 's26' }],
  s26ultra: ['galaxy', { variant: 's26ultra' }],
  '17': ['iphone', { variant: '17' }],
  air: ['iphone', { variant: 'air' }],
  pro: ['iphone', { variant: 'pro' }],
  promax: ['iphone', { variant: 'promax' }],
  air13: ['laptop', { variant: 'air13' }],
  air15: ['laptop', { variant: 'air15' }],
  pro14: ['laptop', { variant: 'pro14' }],
  pro16: ['laptop', { variant: 'pro16' }],
  ipadpro13: ['ipad', { variant: 'ipadpro13' }],
  ipadpro11: ['ipad', { variant: 'ipadpro11' }],
  ipadair13: ['ipad', { variant: 'ipadair13' }],
  ipadair11: ['ipad', { variant: 'ipadair11' }],
  ipad11: ['ipad', { variant: 'ipad11' }],
  tabs11: ['galaxyTab', { variant: 'tabs11' }],
  tabs11ultra: ['galaxyTab', { variant: 'tabs11ultra' }],
  series11: ['appleWatch', { variant: 'series11' }],
  watch8: ['galaxyWatch', { variant: 'watch8' }],
  'fold7-open': ['fold', { variant: 'fold7', open: true }],
  'fold7-closed': ['fold', { variant: 'fold7', open: false }],
  'flip7-open': ['flip', { variant: 'flip7', open: true }],
  'flip7-closed': ['flip', { variant: 'flip7', open: false }],
  studiodisplay: ['studioDisplay', {}],
}

/** Pull (label, variantKey, panel, portrait, landscape) out of the spec table. */
function parseDoc() {
  const out = []
  for (const line of readFileSync(DOC, 'utf8').split('\n')) {
    if (!line.startsWith('|') || line.includes('---') || line.includes('Device |')) continue
    const cells = line.split('|').map((c) => c.trim())
    if (cells.length < 7) continue
    const [, label, variantCell, , display, portrait, landscape] = cells
    if (!/\d/.test(display)) continue

    let key = variantCell.replace(/`/g, '').trim()
    if (key.includes('fold7')) key = key.includes('false') ? 'fold7-closed' : 'fold7-open'
    else if (key.includes('flip7')) key = key.includes('false') ? 'flip7-closed' : 'flip7-open'
    else if (key === '-' || key === '') key = 'studiodisplay'

    const panel = display.match(/(\d+)[x×](\d+)/)
    const inches = display.match(/([\d.]+)"/)
    out.push({
      label,
      key,
      inches: inches ? Number(inches[1]) : null,
      panel: panel ? [Number(panel[1]), Number(panel[2])] : null,
      portrait: portrait.match(/(\d+)[x×](\d+)/),
      landscape: landscape.match(/(\d+)[x×](\d+)/),
    })
  }
  return out
}

const WRITE = process.argv.slice(2).includes('--write')
const round = (n, p = 4) => Math.round(n * 10 ** p) / 10 ** p
const rows = parseDoc()
const mismatches = []

console.log('variant'.padEnd(16), 'orient'.padEnd(10), 'docs'.padEnd(12), 'renders'.padEnd(12), 'aspect off')
console.log('-'.repeat(70))

for (const row of rows) {
  const entry = ROWS[row.key]
  if (!entry) {
    console.log(`  (skipped: no registry mapping for "${row.key}" - ${row.label})`)
    continue
  }
  const [kind, baseProps] = entry
  for (const orientation of ['portrait', 'landscape']) {
    const doc = row[orientation]
    if (!doc) continue
    const docPx = { width: Number(doc[1]), height: Number(doc[2]) }
    // Laptops and the Studio Display have a single pose; their props take no
    // orientation, so asking for one would silently return the same rect twice.
    const props = kind === 'laptop' || kind === 'studioDisplay' ? baseProps : { ...baseProps, orientation }
    const info = mockupInfo(kind, props).primary
    const ok = info.px.width === docPx.width && info.px.height === docPx.height
    const modelled = info.units.width / info.units.height
    const documented = docPx.width / docPx.height
    const offPct = 100 * (modelled / documented - 1)
    row.rendered ??= {}
    row.rendered[orientation] = `${info.px.width}×${info.px.height}`
    if (!ok) {
      mismatches.push({ row, kind, props, orientation, docPx, info, modelled, documented, offPct })
    }
    console.log(
      row.key.padEnd(16),
      orientation.padEnd(10),
      `${docPx.width}x${docPx.height}`.padEnd(12),
      `${info.px.width}x${info.px.height}`.padEnd(12),
      ok ? 'ok' : `${offPct >= 0 ? '+' : ''}${round(offPct, 3)}%`
    )
  }
}

console.log(`\n${mismatches.length} mismatch(es).\n`)

if (WRITE) {
  // Rewrite only the last two cells of each spec row; every other column is
  // hardware fact this script has no business touching.
  const lines = readFileSync(DOC, 'utf8').split('\n')
  let touched = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.startsWith('|') || line.includes('---') || line.includes('Device |')) continue
    const cells = line.split('|')
    if (cells.length < 8) continue
    let key = cells[2].replace(/`/g, '').trim()
    if (key.includes('fold7')) key = key.includes('false') ? 'fold7-closed' : 'fold7-open'
    else if (key.includes('flip7')) key = key.includes('false') ? 'flip7-closed' : 'flip7-open'
    else if (key === '-' || key === '') key = 'studiodisplay'
    const row = rows.find((r) => r.key === key)
    if (!row?.rendered) continue
    const next = [...cells]
    if (row.portrait) next[5] = ` ${row.rendered.portrait} `
    if (row.landscape) next[6] = ` ${row.rendered.landscape} `
    const rebuilt = next.join('|')
    if (rebuilt !== line) {
      lines[i] = rebuilt
      touched++
    }
  }
  writeFileSync(DOC, lines.join('\n'))
  console.log(touched ? `Rewrote ${touched} row(s) in devices.mdx.` : 'devices.mdx already matches; nothing to write.')
} else if (mismatches.length) {
  process.exitCode = 1
}

// Portrait and landscape are the same rect transposed, so a bad aspect shows
// up twice; report the underlying variant once, with the fix in millimetres.
const seen = new Set()
for (const m of mismatches) {
  const id = `${m.kind}:${m.row.key}`
  if (seen.has(id)) continue
  seen.add(id)
  const { width, height } = m.info.units
  const mm = m.info.mm
  // `info.units` is already expressed in the requested orientation, so the
  // documented aspect is directly comparable - no transposition.
  const target = m.documented
  // Two ways to close the gap: hold the width and adjust the height, or the reverse.
  const wantH = width / target
  const wantW = height * target
  const newH = (wantH / height) * mm.height
  const newW = (wantW / width) * mm.width

  // Independent check: the panel's own diagonal and pixel aspect fix its
  // physical size exactly, with no reference to the modelled rect. Whichever
  // correction moves TOWARD that is the dimension that was wrong.
  let ref = null
  if (m.row.inches && m.row.panel) {
    const [pw, ph] = m.orientation === 'portrait' ? [m.row.panel[1], m.row.panel[0]] : m.row.panel
    const diagMm = m.row.inches * 25.4
    const diagPx = Math.hypot(pw, ph)
    ref = { width: (diagMm * pw) / diagPx, height: (diagMm * ph) / diagPx }
  }
  const closer = (current, proposed, truth) =>
    truth === null ? null : Math.abs(proposed - truth) < Math.abs(current - truth)

  console.log(`${m.row.label} (${m.row.key}) - modelled aspect off by ${round(m.offPct, 3)}%`)
  console.log(`   panel        ${m.row.panel ? m.row.panel.join(' x ') : '?'} px @ ${m.row.inches}"`)
  console.log(`   modelled     ${mm.width} x ${mm.height} mm`)
  if (ref) console.log(`   diagonal     ${round(ref.width, 2)} x ${round(ref.height, 2)} mm  <- independent reference`)
  const hw = closer(mm.height, newH, ref?.height)
  const hh = closer(mm.width, newW, ref?.width)
  console.log(
    `   hold width   height -> ${round(newH, 2)} mm (delta ${round(newH - mm.height, 2)})` +
      (hw === null ? '' : hw ? '   toward reference' : '   away from reference')
  )
  console.log(
    `   hold height  width  -> ${round(newW, 2)} mm (delta ${round(newW - mm.width, 2)})` +
      (hh === null ? '' : hh ? '   toward reference' : '   away from reference')
  )
  console.log()
}
