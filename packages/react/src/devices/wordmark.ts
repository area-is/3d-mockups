import * as THREE from 'three'

/**
 * A crisp canvas-drawn wordmark (e.g. the "SAMSUNG" imprint on a Galaxy back
 * panel) as a transparent texture. Draws white glyphs - tint via the material
 * `color` so one texture serves any colorway.
 */
export function createWordmarkTexture(
  text: string,
  { width = 1024, height = 160, weight = 700, letterSpacing = 0.32 }: {
    width?: number
    height?: number
    weight?: number
    /** Extra tracking as a fraction of the glyph size (Samsung's mark is wide-set). */
    letterSpacing?: number
  } = {}
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const size = height * 0.72
  ctx.font = `${weight} ${size}px "Helvetica Neue", Arial, sans-serif`
  const spacing = size * letterSpacing
  // Manual tracking (ctx.letterSpacing isn't universal): lay glyphs out one by one.
  const widths = [...text].map((ch) => ctx.measureText(ch).width)
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1)
  const scale = total > width * 0.96 ? (width * 0.96) / total : 1
  ctx.scale(scale, 1)
  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'middle'
  let x = (width / scale - total) / 2
  for (let i = 0; i < text.length; i++) {
    ctx.fillText(text[i]!, x, height / 2)
    x += widths[i]! + spacing
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 4
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
