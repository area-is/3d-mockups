import type { SVGProps } from 'react'

/**
 * The area-mockups brand mark — the dual-slant "A" from
 * `assets/area-a-dual-slant-outline-regular-green.svg`, inlined rather than
 * loaded from `public/` so it paints with the first HTML byte (the site header
 * is sticky, so a late logo is a visible pop) and so its size follows whatever
 * slot it lands in.
 *
 * The viewBox is cropped to the artwork's own visual bounds. In the source
 * file the mark fills only x[58.71,384.29] y[42.75,400.25] of a 443 box, so
 * `size` would otherwise buy ~20% more box than mark — half of why the mark
 * read small next to the wordmark. Cropped, `size` IS the height you get.
 *
 * This is a stroked mark, and strokes scale with the viewBox: below roughly
 * 20px the two counters in the "A" start closing up. Every placement on this
 * site sits well above that. The favicon is the one thing that can't — at
 * 16px this collapses to a green smudge — so `app/icon.svg` uses the solid
 * mark instead.
 *
 * Decorative by default: every placement sits next to the "area-mockups"
 * wordmark, so announcing it again would just double up for screen readers.
 * Pass `aria-hidden={false}` with a label if it is ever used on its own.
 */
export function Logo({ size = 28, ...props }: Omit<SVGProps<SVGSVGElement>, 'children'> & { size?: number }) {
  return (
    <svg
      viewBox="42.75 42.75 357.5 357.5"
      width={size}
      height={size}
      aria-hidden
      focusable="false"
      {...props}
    >
      <g fill="none" stroke="#31D322" strokeLinejoin="round" strokeLinecap="round">
        <path
          strokeWidth="5.5"
          d="M 91.94 120.30 L 221.50 195.10 L 221.50 397.50 L 175.77 371.10 L 175.77 303.63 L 117.35 269.90 L 107.18 331.50 L 61.46 305.10 Z M 351.06 120.30 L 221.50 195.10 L 221.50 397.50 L 267.23 371.10 L 267.23 303.63 L 325.65 269.90 L 335.82 331.50 L 381.54 305.10 Z M 221.50 45.50 L 351.06 120.30 L 221.50 195.10 L 91.94 120.30 Z M 123.52 232.50 L 175.77 262.67 L 175.77 219.30 L 130.05 192.90 Z M 319.48 232.50 L 267.23 262.67 L 267.23 219.30 L 312.95 192.90 Z"
        />
        <path
          strokeWidth="3.85"
          d="M 123.52 232.50 L 161.08 210.81 M 319.48 232.50 L 281.92 210.81 M 107.18 331.50 L 152.91 305.10 M 335.82 331.50 L 290.09 305.10 M 152.91 305.10 L 155.12 291.71 M 290.09 305.10 L 287.88 291.71"
        />
      </g>
    </svg>
  )
}
