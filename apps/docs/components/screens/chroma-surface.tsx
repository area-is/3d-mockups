/**
 * Chroma-key fill for the "mockup-able areas" view: broadcast green with the
 * slot's name printed across it.
 *
 * Every region of a mockup gets one at once, which is the point - it is the
 * fastest way to see where your content lands and what stays 3D hardware. The
 * label sizes off the surface rather than the page (`cqw`/`cqh` against a size
 * container), so a spine strip and a billboard face both end up legible.
 */
export function ChromaSurface({ label }: { label: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#00b140',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        containerType: 'size',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          fontFamily: 'ui-monospace, monospace',
          fontWeight: 700,
          fontSize: 'min(11cqw, 34cqh)',
          color: '#063d1e',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  )
}
