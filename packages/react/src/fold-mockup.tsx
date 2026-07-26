import { FOLD_FRAMING } from '@area-mockups/core'
import { createMockup, type MockupProps } from './create-mockup'
import { Fold, foldSlots, type FoldProps } from './devices/fold/fold'

export type FoldMockupProps = MockupProps<FoldProps>

/**
 * The one-liner: a complete, interactive 3D Galaxy Z Fold mockup. Open by
 * default — your content fills the big inner display.
 *
 * ```tsx
 * <FoldMockup autoRotate float>
 *   <YourApp />
 * </FoldMockup>
 *
 * <FoldMockup open={false}>
 *   <CoverUI /> {/* folded: content on the tall cover screen *\/}
 * </FoldMockup>
 * ```
 *
 * Wrap children in `<FoldMockup.Screen>` to set per-screen surface props:
 *
 * ```tsx
 * <FoldMockup openAngle={110}>
 *   <FoldMockup.Screen surfaceBackground="#000" resolution={720}>
 *     <YourApp />
 *   </FoldMockup.Screen>
 * </FoldMockup>
 * ```
 */
export const FoldMockup = createMockup({
  object: Fold,
  framing: FOLD_FRAMING,
  slots: foldSlots,
  displayName: 'FoldMockup',
})
