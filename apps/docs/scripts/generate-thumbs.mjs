/**
 * Sidebar thumbnail generator.
 *
 * Renders every device variant and every object from lib/mockup-catalog.mjs
 * through the /harness route and screenshots each one as a transparent PNG
 * into public/thumbs/. The docs sidebar (components/docs-sidebar.tsx) shows
 * these instead of hand-drawn silhouettes, so every tile is the real WebGL
 * render of the mockup it links to.
 *
 *   npm run thumbs                regenerate everything
 *   npm run thumbs -- --only=ipad substring filter on entry id
 *
 * Expects the docs dev server on PORT (default 3000, which is what `npm run
 * dev` serves); pass --base to override.
 * WebGL runs on SwiftShader, so no GPU is needed - at the cost of being slow.
 */
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { DEVICES, OBJECTS } from '../lib/mockup-catalog.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const OUT = join(here, '..', 'public', 'thumbs')

const args = process.argv.slice(2)
const ONLY = args.find((a) => a.startsWith('--only='))?.slice(7)
const BASE =
  args.find((a) => a.startsWith('--base='))?.slice(7) ?? `http://localhost:${process.env.PORT ?? 3000}`

const ENTRIES = [...DEVICES, ...OBJECTS].filter((e) => !ONLY || e.id.includes(ONLY))

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  // SwiftShader: no GPU needed, and the same frames on CI as on a laptop.
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const context = await browser.newContext({ viewport: { width: 360, height: 360 }, deviceScaleFactor: 1 })
const page = await context.newPage()

const failures = []
for (const entry of ENTRIES) {
  const url = `${BASE}/harness?${entry.shot}&screen=green&bg=transparent&shadows=0`
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 180_000 })
    // r3f mounts the canvas, then drei's <Html> portals each screen through a
    // nested root that can need a few frames to land (see device-screen.tsx).
    await page.waitForSelector('canvas', { timeout: 60_000 })
    await page.waitForTimeout(3500)
    const shot = await page.screenshot({ omitBackground: true, timeout: 60_000 })
    writeFileSync(join(OUT, `${entry.id}.png`), shot)
    console.log(`  write  ${entry.id}`)
  } catch (err) {
    failures.push(`${entry.id}: ${String(err).split('\n')[0]}`)
    console.log(`  ERROR  ${entry.id} - ${String(err).split('\n')[0]}`)
  }
}

await browser.close()

if (failures.length) {
  console.error(`\n${failures.length} thumbnail(s) failed:`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}
console.log(`\n${ENTRIES.length} thumbnail(s) written to public/thumbs/.`)
