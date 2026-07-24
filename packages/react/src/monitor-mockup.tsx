import { MONITOR_FRAMING } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { Monitor, monitorSlots, type MonitorProps } from './devices/monitor/monitor'

export type MonitorMockupProps = MockupProps<MonitorProps>

/**
 * The one-liner: a complete, interactive 3D Studio Display-style monitor mockup.
 *
 * ```tsx
 * <MonitorMockup>
 *   <YourApp />
 * </MonitorMockup>
 * ```
 *
 * Wrap children in `<MonitorMockup.Screen>` to set per-screen surface props:
 *
 * ```tsx
 * <MonitorMockup autoRotate>
 *   <MonitorMockup.Screen background="#0b0d12" resolution={1920}>
 *     <Dashboard />
 *   </MonitorMockup.Screen>
 * </MonitorMockup>
 * ```
 */
export const MonitorMockup = createMockup({
  object: Monitor,
  framing: MONITOR_FRAMING,
  slots: monitorSlots,
  displayName: 'MonitorMockup',
})
