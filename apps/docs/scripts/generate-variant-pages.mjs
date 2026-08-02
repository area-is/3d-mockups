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

${reference}
`
  writeFileSync(join(API, `${device.id}.mdx`), page)
  console.log('  write', `${device.id}.mdx`)
}

console.log(`\n${DEVICES.length} variant page(s) written to content/docs/api/.`)
