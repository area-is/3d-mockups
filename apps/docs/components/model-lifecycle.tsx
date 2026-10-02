'use client'

import { createContext, useContext, type ReactNode } from 'react'
// Type-only: the module itself imports the library's core, which must stay
// out of the client bundle (see lib/model-lifecycle.ts).
import type { ModelLifecycle } from '@/lib/model-lifecycle'

const OlderModels = createContext<Record<string, ModelLifecycle>>({})

/** Hands the server-computed `OLDER_MODELS` to the sidebar and the gallery. */
export function ModelLifecycleProvider({
  value,
  children,
}: {
  value: Record<string, ModelLifecycle>
  children: ReactNode
}) {
  return <OlderModels value={value}>{children}</OlderModels>
}

/** `statusOf(href)`: `current`, unless a newer model has replaced it or it is on its way out. */
export function useModelStatus(): (href: string) => 'current' | ModelLifecycle['status'] {
  const older = useContext(OlderModels)
  return (href) => older[href]?.status ?? 'current'
}
