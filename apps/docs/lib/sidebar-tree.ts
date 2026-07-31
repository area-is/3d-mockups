import type * as PageTree from 'fumadocs-core/page-tree'
import { DEVICES, OBJECTS } from '@/lib/mockup-catalog.mjs'

const GRID_URLS = new Set<string>(
  [...DEVICES, ...OBJECTS].map((e: { href: string }) => e.href)
)

/**
 * Drop the device and object API pages from the sidebar tree.
 *
 * They are still real, routable, searchable pages - the sidebar just reaches
 * them through the thumbnail grids under "Devices" and "Objects"
 * (components/docs-sidebar.tsx) instead of listing them twice. Filtering here
 * rather than rendering `null` from an item override matters: every link that
 * survives is rendered by Fumadocs itself and keeps its stock styling.
 */
export function hideGridPages(tree: PageTree.Root): PageTree.Root {
  const walk = (nodes: PageTree.Node[]): PageTree.Node[] =>
    nodes.flatMap<PageTree.Node>((node) => {
      if (node.type === 'page') return GRID_URLS.has(node.url) ? [] : [node]
      if (node.type === 'folder') return [{ ...node, children: walk(node.children) }]
      return [node]
    })

  return { ...tree, children: walk(tree.children) }
}
