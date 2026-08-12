import defaultMdxComponents from 'fumadocs-ui/mdx'
import { Card, Cards } from 'fumadocs-ui/components/card'
import { Callout } from 'fumadocs-ui/components/callout'
import type { MDXComponents } from 'mdx/types'
import { BareVsMockup } from './bare-vs-mockup'
import { DeviceDisclaimer } from './device-disclaimer'
// Through a `next/dynamic` shell: every docs page gets this map, and a static
// import here shipped the whole 3D stack to prose-only pages.
import { MockupExplorer } from './lazy-mdx-demos'

// The cast bridges a structural mismatch between fumadocs-ui's component map
// and @types/mdx under our @types/react version; the shapes agree at runtime.
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Card,
    Cards,
    Callout,
    BareVsMockup,
    DeviceDisclaimer,
    MockupExplorer,
    ...components,
  } as unknown as MDXComponents
}

export const useMDXComponents = getMDXComponents
