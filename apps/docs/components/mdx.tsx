import defaultMdxComponents from 'fumadocs-ui/mdx'
import { Card, Cards } from 'fumadocs-ui/components/card'
import { Callout } from 'fumadocs-ui/components/callout'
import type { MDXComponents } from 'mdx/types'
import { DeviceDisclaimer } from './device-disclaimer'
import { ObjectDemo } from './object-examples'
import { MockupExplorer } from './mockup-explorer'

// The cast bridges a structural mismatch between fumadocs-ui's component map
// and @types/mdx under our @types/react version; the shapes agree at runtime.
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Card,
    Cards,
    Callout,
    DeviceDisclaimer,
    ObjectDemo,
    MockupExplorer,
    ...components,
  } as unknown as MDXComponents
}

export const useMDXComponents = getMDXComponents
