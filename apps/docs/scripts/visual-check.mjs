/**
 * Visual regression check over the /harness route.
 *
 * The harness renders any mockup from URL params on a chrome-less stage with
 * float, controls, shadows and drag switched off, so a frame is deterministic.
 * `regions=1` fills every live region with its own flat, labelled hue - which
 * makes this a *geometry* test: if a surface changes size, moves, or starts
 * bleeding through the body, the coloured rect changes shape and the diff
 * catches it. That is the safety net for moving layout math out of the scene
 * components and down into core specs.
 *
 *   npm run visual            compare against committed baselines
 *   npm run visual -- --update  rewrite the baselines
 *   npm run visual -- --only=bus  run a subset (substring match on case name)
 *
 * Expects the docs dev server on PORT (default 3000, which is what `npm run
 * dev` serves); pass --base to override.
 * WebGL runs on SwiftShader, so results are reproducible across machines
 * without a GPU - at the cost of being slow, hence the generous timeouts.
 */
import { chromium } from 'playwright'
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const BASELINES = join(here, '..', 'visual-baselines')
const DIFFS = join(here, '..', '.visual-diffs')

const args = process.argv.slice(2)
const UPDATE = args.includes('--update')
const ONLY = args.find((a) => a.startsWith('--only='))?.slice(7)
const BASE = args.find((a) => a.startsWith('--base='))?.slice(7) ?? `http://localhost:${process.env.PORT ?? 3000}`

/**
 * One case per pose worth defending. Weighted toward the models whose geometry
 * still lives in their scene components (bus, van, storefront) - those are the
 * ones a refactor can silently break - plus a spread of the rest so a change to
 * shared machinery (DeviceScreen, createMockup, the slot plumbing) shows up.
 */
const CASES = [
  // --- geometry still in the scene components: the refactor targets ---
  ['bus-panel', 'device=bus&regions=1&ry=28&rx=6'],
  ['bus-full', 'device=bus&regions=1&coverage=full&ry=28&rx=6'],
  ['bus-perforated', 'device=bus&regions=1&coverage=perforated&ry=28&rx=6'],
  ['bus-rear', 'device=bus&regions=1&ry=150&rx=6'],
  ['van-panel', 'device=van&regions=1&ry=32&rx=8'],
  ['van-full', 'device=van&regions=1&coverage=full&ry=32&rx=8'],
  ['van-perforated', 'device=van&regions=1&coverage=perforated&ry=32&rx=8'],
  ['van-rear', 'device=van&regions=1&ry=155&rx=8'],
  // Framed on the nose plate. The wide van poses above are a global pixel
  // percentage over a mostly-empty frame, so a small feature barely moves the
  // number: reshaping the plate from 525x126 to 305x152 mm scored 0.0191%
  // against a 0.02% threshold and passed. Anything this small needs its own
  // close-up to be defended at all.
  ['van-plate', 'device=van&regions=1&ry=270&dist=4.5&cy=-0.42'],
  ['store-front', 'device=store&regions=1&ry=18&rx=4'],
  ['store-angle', 'device=store&regions=1&ry=52&rx=10'],

  // --- already measured in core: guards the ported specs ---
  ['book', 'device=book&regions=1&ry=28'],
  ['magazine', 'device=magazine&regions=1&ry=28'],
  ['brochure', 'device=brochure&regions=1&ry=22'],
  // the reverse face, where left/right mirror the front - the one part of the
  // panel mapping with no other automated cover
  ['brochure-back', 'device=brochure&regions=1&ry=200'],
  ['productbox', 'device=productbox&regions=1&ry=32&rx=14'],
  ['mailer', 'device=mailer&regions=1&ry=32&rx=18'],
  ['bag', 'device=bag&regions=1&ry=26'],
  ['vinyl', 'device=vinyl&regions=1&ry=20'],
  ['greeting', 'device=greeting&regions=1&ry=24'],
  ['poster', 'device=poster&regions=1&ry=18'],
  ['semi', 'device=semi&regions=1&ry=30&rx=6'],
  ['totem', 'device=totem&regions=1&ry=24'],
  ['aframe', 'device=aframe&regions=1&ry=22'],
  ['custombox', 'device=custombox&regions=1&w=250&h=90&d=160&ry=34&rx=16'],

  // --- devices: one screen each, but they exercise orientation + poses ---
  ['galaxy', 'device=phone&pvariant=s26&ry=24'],
  ['galaxy-landscape', 'device=phone&pvariant=s26&orientation=landscape&ry=24'],
  ['iphone-promax', 'device=iphone&pvariant=promax&ry=24'],
  ['ipad', 'device=tablet&variant=ipadpro13&ry=22'],
  ['laptop', 'device=laptop&lvariant=pro14&ry=18'],
  ['fold-open', 'device=fold&ry=22'],
  ['fold-closed', 'device=fold&open=0&ry=22'],
  // the flex poses' split screens must meet seamlessly at the crease - the
  // pose that regressed into a dark crevice down the display's middle
  ['fold-flex', 'device=fold&openAngle=110&ry=22'],
  ['flip-flex', 'device=flip&openAngle=100&ry=22'],
  ['flip-closed', 'device=flip&open=0&ry=22'],
  ['watch', 'device=watch&ry=18'],
  ['shelter', 'device=shelter&ry=26'],
  ['tv', 'device=tv&ry=20'],
  // the picture-frame set's rear: One Connect recess, groove, nub, wordmark
  ['tv-frame-back', 'device=tv&tvvariant=frame&ry=205&rx=8'],
].filter(([name]) => !ONLY || name.includes(ONLY))

const VIEWPORT = { width: 900, height: 675 }
/**
 * Fraction of pixels allowed to differ.
 *
 * Measured, not guessed: repeat runs of an unchanged build come back at
 * exactly 0.0000% on SwiftShader, so this is pure headroom for a future
 * driver build nudging antialiased edges. It has to stay small - an 8%
 * change to the van's rear panel width only moves 0.10% of the frame when
 * the panel is off-axis, so a percent-scale tolerance would wave real
 * geometry changes through.
 */
const TOLERANCE = 0.0002

mkdirSync(BASELINES, { recursive: true })
mkdirSync(DIFFS, { recursive: true })

/**
 * Compare two PNGs inside the browser (canvas can decode them; Node cannot
 * without a dependency). Returns the mismatched fraction and a diff image
 * with changed pixels painted magenta over a dimmed copy of the baseline.
 */
const COMPARE = async ([aB64, bB64]) => {
  const load = (b64) =>
    new Promise((res) => {
      const im = new Image()
      im.onload = () => res(im)
      im.src = 'data:image/png;base64,' + b64
    })
  const [a, b] = await Promise.all([load(aB64), load(bB64)])
  if (a.width !== b.width || a.height !== b.height) {
    return { sizeMismatch: `${a.width}x${a.height} vs ${b.width}x${b.height}` }
  }
  const grab = (im) => {
    const c = document.createElement('canvas')
    c.width = im.width
    c.height = im.height
    const g = c.getContext('2d', { willReadFrequently: true })
    g.drawImage(im, 0, 0)
    return g.getImageData(0, 0, im.width, im.height)
  }
  const A = grab(a)
  const B = grab(b)
  const out = document.createElement('canvas')
  out.width = a.width
  out.height = a.height
  const og = out.getContext('2d')
  const D = og.createImageData(a.width, a.height)
  let changed = 0
  for (let i = 0; i < A.data.length; i += 4) {
    const d =
      Math.abs(A.data[i] - B.data[i]) +
      Math.abs(A.data[i + 1] - B.data[i + 1]) +
      Math.abs(A.data[i + 2] - B.data[i + 2])
    if (d > 24) {
      changed++
      D.data[i] = 255
      D.data[i + 1] = 0
      D.data[i + 2] = 255
      D.data[i + 3] = 255
    } else {
      D.data[i] = 235 - (255 - A.data[i]) * 0.15
      D.data[i + 1] = 235 - (255 - A.data[i + 1]) * 0.15
      D.data[i + 2] = 235 - (255 - A.data[i + 2]) * 0.15
      D.data[i + 3] = 255
    }
  }
  og.putImageData(D, 0, 0)
  return { fraction: changed / (a.width * a.height), diff: out.toDataURL('image/png') }
}

const browser = await chromium.launch({
  // SwiftShader: no GPU needed, and the same frames on CI as on a laptop.
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 })
const page = await context.newPage()
const comparePage = await context.newPage()

const failures = []
const written = []

for (const [name, query] of CASES) {
  const url = `${BASE}/harness?${query}`
  let shot
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 180_000 })
    // r3f mounts the canvas, then drei's <Html> portals each screen through a
    // nested root that can need a few frames to land (see device-screen.tsx).
    await page.waitForSelector('canvas', { timeout: 60_000 })
    await page.waitForTimeout(4000)
    shot = await page.screenshot({ timeout: 60_000 })
  } catch (err) {
    // One flaky case must not throw away the other thirty-two results.
    failures.push(`${name}: could not capture - ${String(err).split('\n')[0]}`)
    console.log(`  ERROR  ${name} - ${String(err).split('\n')[0]}`)
    continue
  }

  const baselinePath = join(BASELINES, `${name}.png`)
  if (UPDATE || !existsSync(baselinePath)) {
    writeFileSync(baselinePath, shot)
    written.push(name)
    console.log(`  write  ${name}`)
    continue
  }

  const baseline = readFileSync(baselinePath)
  const result = await comparePage.evaluate(COMPARE, [baseline.toString('base64'), shot.toString('base64')])

  if (result.sizeMismatch) {
    failures.push(`${name}: size changed (${result.sizeMismatch})`)
    console.log(`  FAIL   ${name} - ${result.sizeMismatch}`)
    continue
  }
  if (result.fraction > TOLERANCE) {
    writeFileSync(join(DIFFS, `${name}.actual.png`), shot)
    writeFileSync(join(DIFFS, `${name}.diff.png`), Buffer.from(result.diff.split(',')[1], 'base64'))
    failures.push(`${name}: ${(result.fraction * 100).toFixed(3)}% of pixels differ`)
    console.log(`  FAIL   ${name} - ${(result.fraction * 100).toFixed(3)}% differ`)
  } else {
    console.log(`  ok     ${name}${result.fraction ? ` (${(result.fraction * 100).toFixed(4)}%)` : ''}`)
  }
}

await browser.close()

if (written.length) {
  console.log(`\n${written.length} baseline(s) written to visual-baselines/. Review them before committing.`)
}
if (failures.length) {
  console.error(`\n${failures.length} case(s) changed:`)
  for (const f of failures) console.error(`  - ${f}`)
  console.error(`\nDiffs in ${DIFFS} (changed pixels in magenta).`)
  console.error('If the change is intended, re-run with --update and review the new baselines.')
  process.exit(1)
}
console.log(`\n${CASES.length} case(s) unchanged.`)
