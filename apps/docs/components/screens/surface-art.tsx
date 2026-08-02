'use client'

/**
 * The artwork the prop explorer prints onto a mockup's surfaces: the area
 * wordmark over a green field, labelled with whichever region it fills. Print
 * and packaging objects have several panels, so the label is what tells the
 * back cover from the spine while you turn the object around.
 */
export function SurfaceArt({ label }: { label: string }) {
  return (
    <div className="mx-surface-art">
      <span className="mx-surface-art-label">{label}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="mx-surface-art-mark" src="/assets/area_ag_white.svg" alt="area" />
    </div>
  )
}
