'use client'

import dynamic from 'next/dynamic'
import type { MockupExplorerProps } from './mockup-explorer'

/**
 * Client-side entry point for the one MDX component that pulls in the 3D
 * stack.
 *
 * `getMDXComponents` hands the same component map to every docs page, so a
 * static import here put three.js, r3f and drei into the bundle of pure prose
 * pages that never render a canvas. Loading it through `next/dynamic` with
 * `ssr: false` moves the whole stack behind a chunk that only the pages
 * actually using `<MockupExplorer>` ever fetch, and matches what the marketing
 * pages already do for their scenes.
 *
 * The shell is what makes that work: `ssr: false` is only legal from a client
 * component, and the docs pages that consume the map are server components.
 */

function Placeholder({ height }: { height: number }) {
  return (
    <div className="demo-placeholder" style={{ height }}>
      <span>Loading the 3D scene…</span>
    </div>
  )
}

const MockupExplorerInner = dynamic(
  () => import('./mockup-explorer').then((m) => m.MockupExplorer),
  { ssr: false, loading: () => <Placeholder height={520} /> }
)

export function MockupExplorer(props: MockupExplorerProps) {
  return <MockupExplorerInner {...props} />
}
