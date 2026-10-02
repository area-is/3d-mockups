/**
 * Writes one docs page per device variant.
 *
 *   npm run docs:variants
 *
 * Every variant is its own page so the sidebar grid can highlight exactly the
 * model you are reading - a family page would light up all four iPhones at
 * once. The pages are generated rather than hand-written because the API
 * reference below the explorer is shared by a whole family: it lives once, in
 * content/family-reference/<family>.mdx, and is composed into each of that
 * family's pages here. Edit the shared file, re-run this, commit the result.
 *
 * Object mockups are 1:1 with their pages already, so they are untouched.
 *
 * The colorway check below reads the catalogs from the built package, so build
 * it first (`npm run build:pkg` at the repo root) if `react-3d-mockups/core`
 * does not resolve.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Color } from 'three'
import {
  APPLE_WATCH_COLORWAYS,
  FLIP_COLORWAYS,
  FOLD_COLORWAYS,
  GALAXY_COLORWAYS,
  GALAXY_TAB_COLORWAYS,
  GALAXY_WATCH_COLORWAYS,
  IPAD_COLORWAYS,
  IPHONE_COLORWAYS,
  IPHONE_DUO_COLORWAYS,
  LAPTOP_COLORWAYS,
  STUDIO_DISPLAY_COLORWAYS,
} from 'react-3d-mockups/core'
import { DEVICES } from '../lib/mockup-catalog.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const API = join(here, '..', 'content', 'docs', 'api')
const SHARED = join(here, '..', 'content', 'family-reference')

/** Which shared reference each variant composes in. */
const FAMILY_OF = {
  GalaxyMockup: 'galaxy',
  IPhoneMockup: 'iphone',
  IPhoneDuoMockup: 'iphone-duo',
  FoldMockup: 'fold',
  FlipMockup: 'flip',
  LaptopMockup: 'laptop',
  IPadMockup: 'ipad',
  GalaxyTabMockup: 'galaxy-tab',
  AppleWatchMockup: 'apple-watch',
  GalaxyWatchMockup: 'galaxy-watch',
  StudioDisplayMockup: 'studio-display',
}


/** Whose marks a family renders, for its page's notice. */
const BRANDS = {
  GalaxyMockup: 'Samsung',
  FoldMockup: 'Samsung',
  FlipMockup: 'Samsung',
  GalaxyTabMockup: 'Samsung',
  GalaxyWatchMockup: 'Samsung',
  IPhoneMockup: 'Apple',
  IPhoneDuoMockup: 'Apple',
  IPadMockup: 'Apple',
  LaptopMockup: 'Apple',
  AppleWatchMockup: 'Apple',
  StudioDisplayMockup: 'Apple',
}

/** Each family's colorway catalog: keyed by variant, or one list for a single model. */
const COLORWAYS = {
  GalaxyMockup: GALAXY_COLORWAYS,
  IPhoneMockup: IPHONE_COLORWAYS,
  IPhoneDuoMockup: IPHONE_DUO_COLORWAYS,
  FoldMockup: FOLD_COLORWAYS,
  FlipMockup: FLIP_COLORWAYS,
  LaptopMockup: LAPTOP_COLORWAYS,
  IPadMockup: IPAD_COLORWAYS,
  GalaxyTabMockup: GALAXY_TAB_COLORWAYS,
  AppleWatchMockup: APPLE_WATCH_COLORWAYS,
  GalaxyWatchMockup: GALAXY_WATCH_COLORWAYS,
  StudioDisplayMockup: STUDIO_DISPLAY_COLORWAYS,
}

/**
 * The shared reference, cut down to the one variant this page is about.
 *
 * A `###` section that opens an explorer on `variant: 'x'` is a section ABOUT
 * variant x - that is already in the data, so no second list of which section
 * belongs where has to be kept in step. Sections for another variant are
 * dropped; sections that name no variant apply to the whole family and stay,
 * with the page's own variant pinned onto their explorer so the example shows
 * the device you are reading about rather than the family default.
 */
function forVariant(reference, variant, component) {
  if (!variant) return reference
  // Split at every heading, not just `###`: a `##` that follows a variant
  // section is a sibling of it, not part of it, and must not be dropped along
  // with it. Only `###` chunks are candidates - the preamble carries the
  // family's own intro and prop table and always stays.
  const chunks = reference.split(/\n(?=#{2,3} )/)
  const kept = chunks.filter((chunk) => {
    if (!chunk.startsWith('### ')) return true
    const seeded = chunk.match(/props=\{\{[^}]*variant: '([^']+)'/)
    return !seeded || seeded[1] === variant
  })
  return (
    kept
      .join('\n')
      // Every remaining example is about THIS device.
      .replace(/<MockupExplorer\n  component="(\w+)"\n/g, `<MockupExplorer\n  component="$1"\n  variant="${variant}"\n`)
      .replace(
        /<MockupExplorer component="(\w+)"((?: \w+="[^"]*")*) \/>/g,
        `<MockupExplorer component="$1" variant="${variant}"$2 />`
      )
      // ...so restating it in their props is noise, and would fight the attribute.
      .replace(/props=\{\{ variant: '[^']+', /g, 'props={{ ')
      .replace(/\n  props=\{\{ variant: '[^']+' \}\}\n/g, '\n')
      // The reference opens with its own hero example, which is the explorer
      // this page already renders above - and seeded for whichever variant the
      // family leads with, which on every other page is the wrong device.
      // Exactly the FIRST one, in whichever form it is written: running both a
      // multi-line and a single-line pattern over the text would take the first
      // of each, and the second of those is somebody else's example.
      .replace(/<MockupExplorer(?:\n(?:  [^\n]*\n)*?\/>|[^\n]*\/>)\n\n/, '')
      // The reference's first snippet is written without a variant, so as
      // copied it renders the family default. Pin this page's model onto both
      // the mockup and the bare model in it, and say so.
      .replace(/```tsx\n[\s\S]*?\n```/, (snippet) => {
        const tag = new RegExp(`<(${component.replace(/Mockup$/, '')}(?:Mockup)?)(?=[\\s>])`, 'g')
        return `To render this model, pass \`variant="${variant}"\`.\n\n${snippet.replace(tag, `<$1 variant="${variant}"`)}`
      })
      .replace(/\n{3,}/g, '\n\n')
  )
}

/** Hex, `rgb()` / `hsl()`, or a CSS color name - anything that is a custom finish. */
const isCssColor = (value) =>
  /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value) ||
  /^(rgb|hsl)a?\(/i.test(value) ||
  value.toLowerCase() in Color.NAMES

/**
 * Every example on a device page renders that page's model, so a colorway id
 * in one has to be one of that model's. Another model's id (`silvershadow` on
 * the S26 Ultra) is not an error at runtime: three draws it white and says so
 * only in the console. So it fails the run here instead.
 */
function checkColorways(page, device) {
  const catalog = COLORWAYS[device.component]
  const ids = (Array.isArray(catalog) ? catalog : catalog[device.variant]).map((entry) => entry.id)
  for (const [explorer] of page.matchAll(/<MockupExplorer[\s\S]*?\/>/g)) {
    for (const [, color] of explorer.matchAll(/\bcolor: '([^']+)'/g)) {
      if (ids.includes(color) || isCssColor(color)) continue
      throw new Error(
        `${device.id}.mdx: an example passes color '${color}', which is neither a ${device.label} ` +
          `colorway (${ids.join(', ')}) nor a CSS color. Fix it in content/family-reference/.`
      )
    }
  }
}

/**
 * Headings whose content was another variant's, removed.
 *
 * A heading is empty when the next thing in the document is a heading of the
 * same or a shallower level, or nothing at all. `##` followed by `###` is
 * ordinary nesting and has to survive - which is the whole reason this is not
 * one regex.
 */
function dropEmptyHeadings(text) {
  for (;;) {
    const next = text
      .replace(/\n(##) [^\n]+\n+(?=## )/g, '\n')
      .replace(/\n(###) [^\n]+\n+(?=#{2,3} )/g, '\n')
      .replace(/\n#{2,3} [^\n]+\s*$/g, '\n')
    if (next === text) return text.replace(/\n{3,}/g, '\n\n')
    text = next
  }
}

for (const device of DEVICES) {
  const family = FAMILY_OF[device.component]
  const reference = readFileSync(join(SHARED, `${family}.mdx`), 'utf8').trim()
  const variantAttr = device.variant ? ` variant="${device.variant}"` : ''
  const pinned = device.variant
    ? `The explorer and every example below are pinned to \`variant="${device.variant}"\`; the props, regions and colorways apply to the whole family.`
    : 'Everything below applies to this component.'

  const page = `---
title: ${device.label}
description: The ${device.label} in WebGL, with a live prop explorer and the full ${device.component} reference.
---

Drive every prop from the inspector; the \`demo.tsx\` panel rewrites itself to
exactly what is being passed. ${pinned}

<MockupExplorer component="${device.component}"${variantAttr} />

${dropEmptyHeadings(forVariant(reference, device.variant, device.component))}

<DeviceDisclaimer brands="${BRANDS[device.component] ?? 'the manufacturer'}" />
`
  checkColorways(page, device)
  writeFileSync(join(API, `${device.id}.mdx`), page)
  console.log('  write', `${device.id}.mdx`)
}

console.log(`\n${DEVICES.length} variant page(s) written to content/docs/api/.`)
