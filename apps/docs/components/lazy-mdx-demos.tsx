'use client'

import dynamic from 'next/dynamic'
import type { MockupExplorerProps } from './mockup-explorer'

/**
 * Client-side entry points for the two MDX components that pull in the 3D
 * stack.
 *
 * `getMDXComponents` hands the same component map to every docs page, so a
 * static import of either of these put three.js, r3f and drei — plus the ~40
 * pre-built demo element trees in `object-examples` — into the bundle of pure
 * prose pages that never render a canvas. Loading them through `next/dynamic`
 * with `ssr: false` moves the whole stack behind a chunk that only the pages
 * actually using `<ObjectDemo>` or `<MockupExplorer>` ever fetch, and matches
 * what the marketing pages already do for their scenes.
 *
 * The shells are what make that work: `ssr: false` is only legal from a client
 * component, and the docs pages that consume the map are server components.
 */

function Placeholder({ height }: { height: number }) {
  return (
    <div className="demo-placeholder" style={{ height }}>
      <span>Loading the 3D scene…</span>
    </div>
  )
}

interface ObjectDemoProps {
  demo: string
  height?: number
  checker?: boolean
}

const ObjectDemoInner = dynamic(
  () => import('./object-examples').then((m) => m.ObjectDemo),
  { ssr: false, loading: () => <Placeholder height={440} /> }
)

export function ObjectDemo(props: ObjectDemoProps) {
  return <ObjectDemoInner {...props} />
}

const MockupExplorerInner = dynamic(
  () => import('./mockup-explorer').then((m) => m.MockupExplorer),
  { ssr: false, loading: () => <Placeholder height={520} /> }
)

export function MockupExplorer(props: MockupExplorerProps) {
  return <MockupExplorerInner {...props} />
}
