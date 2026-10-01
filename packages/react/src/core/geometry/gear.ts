import * as THREE from 'three'

/**
 * A centered gear-profile `THREE.Shape`: a circle whose radius alternates
 * between `radius` and `radius - toothDepth`, producing the machined knurling
 * of a watch crown when extruded.
 *
 * - `'knurled'` (the default) is a trapezoidal wave: tooth crests and grooves
 *   each span about half a pitch, with short flanks between - the fine
 *   knurling on the Series crown.
 * - `'lobed'` is a run of rounded lobes meeting in sharp valleys - the coarse,
 *   scalloped grip on the Ultra's larger crown, which has a score of lobes
 *   rather than dozens of teeth.
 */
export function gearShape(
  radius: number,
  teeth: number,
  toothDepth: number,
  profile: 'knurled' | 'lobed' = 'knurled'
): THREE.Shape {
  const shape = new THREE.Shape()
  const inner = radius - toothDepth
  if (profile === 'lobed') {
    const samples = teeth * 12
    for (let i = 0; i < samples; i++) {
      const a = (i / samples) * Math.PI * 2
      // |cos| peaks round mid-lobe and pinches to a cusp between lobes; the
      // root flattens the crown of each lobe a little further.
      const lobe = Math.pow(Math.abs(Math.cos((a * teeth) / 2)), 0.6)
      const r = inner + toothDepth * lobe
      if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r)
      else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    }
    shape.closePath()
    return shape
  }
  // Four stops per tooth: crest start, crest end, groove start, groove end.
  // Crests slightly wider than grooves, like the real machining.
  const stops = [0, 0.42, 0.5, 0.92]
  for (let t = 0; t < teeth; t++) {
    for (let s = 0; s < stops.length; s++) {
      const a = ((t + stops[s]!) / teeth) * Math.PI * 2
      const r = s < 2 ? radius : inner
      const x = Math.cos(a) * r
      const y = Math.sin(a) * r
      if (t === 0 && s === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    }
  }
  shape.closePath()
  return shape
}
