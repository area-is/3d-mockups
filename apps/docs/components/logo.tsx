import type { SVGProps } from 'react'

/**
 * The area-mockups brand mark — the dual-slant "A" from
 * `assets/area-a-dual-slant-green.svg`, inlined rather than loaded from
 * `public/` so it paints with the first HTML byte (the site header is sticky,
 * so a late logo is a visible pop) and so its size follows whatever slot it
 * lands in.
 *
 * The viewBox is cropped to the artwork's own bounds. In the source file the
 * mark fills only x[61.96,382.04] y[46,398] of a 444 box, so `size` would
 * otherwise buy ~20% more box than mark — which is what made it read small
 * next to the wordmark. Cropped, `size` IS the height you get.
 *
 * The solid mark is used everywhere, including the favicon. The outline
 * variant in `assets/` was tried and reverted: it is stroked, and strokes
 * scale with the viewBox, so it thins out at the sizes this site renders
 * the mark at.
 *
 * Decorative by default: every placement sits next to the "area-mockups"
 * wordmark, so announcing it again would just double up for screen readers.
 * Pass `aria-hidden={false}` with a label if it is ever used on its own.
 *
 * Regenerate from the SVG if the artwork changes — the shapes below are a
 * mechanical transcription (attribute names camelCased for JSX), nothing else.
 */
export function Logo({ size = 28, ...props }: Omit<SVGProps<SVGSVGElement>, 'children'> & { size?: number }) {
  return (
    <svg
      viewBox="46 46 352 352"
      width={size}
      height={size}
      aria-hidden
      focusable="false"
      {...props}
    >
      <g transform="translate(222,213.2)" strokeLinejoin="round">
        <polygon points="-45.73,-29.33 0.00,-2.93 0.00,52.80 -45.73,26.40" fill="#276D3E" stroke="#276D3E" strokeWidth="0.6" />
        <polygon points="45.73,-29.33 0.00,-2.93 0.00,52.80 45.73,26.40" fill="#2D9F4F" stroke="#2D9F4F" strokeWidth="0.6" />
        <polygon points="0.00,-55.73 45.73,-29.33 0.00,-2.93 -45.73,-29.33" fill="#31D322" stroke="#31D322" strokeWidth="0.6" />
        <polygon points="-149.88,30.80 -104.15,57.20 -114.32,118.80 -160.04,92.40" fill="#20C531" stroke="#20C531" strokeWidth="0.6" />
        <polygon points="-58.43,30.80 -104.15,57.20 -114.32,118.80 -68.59,92.40" fill="#2D9F4F" stroke="#2D9F4F" strokeWidth="0.6" />
        <polygon points="-104.15,4.40 -58.43,30.80 -104.15,57.20 -149.88,30.80" fill="#31D322" stroke="#31D322" strokeWidth="0.6" />
        <polygon points="58.43,30.80 104.15,57.20 114.32,118.80 68.59,92.40" fill="#276D3E" stroke="#276D3E" strokeWidth="0.6" />
        <polygon points="149.88,30.80 104.15,57.20 114.32,118.80 160.04,92.40" fill="#50E042" stroke="#50E042" strokeWidth="0.6" />
        <polygon points="104.15,4.40 149.88,30.80 104.15,57.20 58.43,30.80" fill="#31D322" stroke="#31D322" strokeWidth="0.6" />
        <polygon points="-45.73,90.93 0.00,117.33 0.00,184.80 -45.73,158.40" fill="#20C531" stroke="#20C531" strokeWidth="0.6" />
        <polygon points="45.73,90.93 0.00,117.33 0.00,184.80 45.73,158.40" fill="#50E042" stroke="#50E042" strokeWidth="0.6" />
        <polygon points="0.00,64.53 45.73,90.93 0.00,117.33 -45.73,90.93" fill="#31D322" stroke="#31D322" strokeWidth="0.6" />
        <polygon points="-143.71,-6.60 0.00,76.37 0.00,117.33 -149.88,30.80" fill="#20C531" stroke="#20C531" strokeWidth="0.6" />
        <polygon points="143.71,-6.60 0.00,76.37 0.00,117.33 149.88,30.80" fill="#50E042" stroke="#50E042" strokeWidth="0.6" />
        <polygon points="0.00,-89.57 143.71,-6.60 0.00,76.37 -143.71,-6.60" fill="#2C8B4A" stroke="#2C8B4A" strokeWidth="0.6" />
        <polygon points="-45.73,-99.00 0.00,-72.60 0.00,-36.77 -45.73,-63.17" fill="#276D3E" stroke="#276D3E" strokeWidth="0.6" />
        <polygon points="45.73,-99.00 0.00,-72.60 0.00,-36.77 45.73,-63.17" fill="#2D9F4F" stroke="#2D9F4F" strokeWidth="0.6" />
        <polygon points="0.00,-125.40 45.73,-99.00 0.00,-72.60 -45.73,-99.00" fill="#31D322" stroke="#31D322" strokeWidth="0.6" />
        <polygon points="-137.18,-46.20 -91.45,-19.80 -97.98,19.80 -143.71,-6.60" fill="#20C531" stroke="#20C531" strokeWidth="0.6" />
        <polygon points="-45.73,-46.20 -91.45,-19.80 -97.98,19.80 -52.26,-6.60" fill="#2D9F4F" stroke="#2D9F4F" strokeWidth="0.6" />
        <polygon points="-91.45,-72.60 -45.73,-46.20 -91.45,-19.80 -137.18,-46.20" fill="#31D322" stroke="#31D322" strokeWidth="0.6" />
        <polygon points="45.73,-46.20 91.45,-19.80 97.98,19.80 52.26,-6.60" fill="#276D3E" stroke="#276D3E" strokeWidth="0.6" />
        <polygon points="137.18,-46.20 91.45,-19.80 97.98,19.80 143.71,-6.60" fill="#50E042" stroke="#50E042" strokeWidth="0.6" />
        <polygon points="91.45,-72.60 137.18,-46.20 91.45,-19.80 45.73,-46.20" fill="#31D322" stroke="#31D322" strokeWidth="0.6" />
        <polygon points="-45.73,6.60 0.00,33.00 0.00,76.37 -45.73,49.97" fill="#20C531" stroke="#20C531" strokeWidth="0.6" />
        <polygon points="45.73,6.60 0.00,33.00 0.00,76.37 45.73,49.97" fill="#50E042" stroke="#50E042" strokeWidth="0.6" />
        <polygon points="0.00,-19.80 45.73,6.60 0.00,33.00 -45.73,6.60" fill="#31D322" stroke="#31D322" strokeWidth="0.6" />
        <polygon points="-129.56,-92.40 0.00,-17.60 0.00,33.00 -137.18,-46.20" fill="#20C531" stroke="#20C531" strokeWidth="0.6" />
        <polygon points="129.56,-92.40 0.00,-17.60 0.00,33.00 137.18,-46.20" fill="#50E042" stroke="#50E042" strokeWidth="0.6" />
        <polygon points="0.00,-167.20 129.56,-92.40 0.00,-17.60 -129.56,-92.40" fill="#31D322" stroke="#31D322" strokeWidth="0.6" />
        <path d="M 129.56 -92.40 L 0.00 -17.60 L 0.00 184.80 L 45.73 158.40 L 45.73 90.93 L 104.15 57.20 L 114.32 118.80 L 160.04 92.40 Z M 97.98 19.80 L 45.73 49.97 L 45.73 6.60 L 91.45 -19.80 Z" fill="#50E042" fillRule="evenodd" stroke="#50E042" strokeWidth="0.6" />
        <path d="M -129.56 -92.40 L 0.00 -17.60 L 0.00 184.80 L -45.73 158.40 L -45.73 90.93 L -104.15 57.20 L -114.32 118.80 L -160.04 92.40 Z M -97.98 19.80 L -45.73 49.97 L -45.73 6.60 L -91.45 -19.80 Z" fill="#20C531" fillRule="evenodd" stroke="#20C531" strokeWidth="0.6" />
      </g>
    </svg>
  )
}
