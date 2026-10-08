'use client'

import { FlipMockup, FoldMockup } from 'react-3d-mockups'
import { FLIP_VARIANTS } from 'react-3d-mockups/core'
import { CoverWidget, INK, TabletApp, type LedgerState } from './ledger-screens'

/**
 * The two foldables further down the page, each on its own canvas because
 * each is its own section. Same state as the hero: add a coffee up there
 * and it is on the Fold's list and the Flip's cover by the time you scroll.
 */

export function FoldScene({ state }: { state: LedgerState }) {
  return (
    <FoldMockup float variant="fold7" color="silvershadow" statusBar surfaceBackground={INK} rotation={[0, -0.26, 0]}>
      <TabletApp state={state} />
    </FoldMockup>
  )
}

/**
 * Shut, a Flip hangs below its crease hinge-up, its cover upside down; the
 * cover widget is read the way the phone is held, hinge-down, so it is turned
 * a half-turn about z and lowered by its folded height back onto its shadow.
 */
const FLIP_SHUT_HEIGHT = FLIP_VARIANTS.flip7.closed.body.height

export function FlipScene({ state }: { state: LedgerState }) {
  return (
    <FlipMockup float variant="flip7" openAngle={false} color="jetblack" surfaceBackground="#000" position={[0, -FLIP_SHUT_HEIGHT, 0]} rotation={[0, -0.32, Math.PI]}>
      <CoverWidget state={state} />
    </FlipMockup>
  )
}
