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
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEVICES } from '../lib/mockup-catalog.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const API = join(here, '..', 'content', 'docs', 'api')
const SHARED = join(here, '..', 'content', 'family-reference')

/** Which shared reference each variant composes in. */
const FAMILY_OF = {
  GalaxyMockup: 'galaxy',
  IPhoneMockup: 'iphone',
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
  IPadMockup: 'Apple',
  LaptopMockup: 'Apple',
  AppleWatchMockup: 'Apple',
  StudioDisplayMockup: 'Apple',
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
function forVariant(reference, variant) {
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
      .replace(/\n{3,}/g, '\n\n')
  )
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
    ? `The explorer is pinned to \`variant="${device.variant}"\`; everything below applies to the whole family.`
    : 'Everything below applies to this component.'

  const page = `---
title: ${device.label}
description: The ${device.label} in WebGL, with a live prop explorer and the full ${device.component} reference.
---

Drive every prop from the inspector; the \`demo.tsx\` panel rewrites itself to
exactly what is being passed. ${pinned}

<MockupExplorer component="${device.component}"${variantAttr} />

${dropEmptyHeadings(forVariant(reference, device.variant))}

<DeviceDisclaimer brands="${BRANDS[device.component] ?? 'the manufacturer'}" />
`
  writeFileSync(join(API, `${device.id}.mdx`), page)
  console.log('  write', `${device.id}.mdx`)
}

console.log(`\n${DEVICES.length} variant page(s) written to content/docs/api/.`)
