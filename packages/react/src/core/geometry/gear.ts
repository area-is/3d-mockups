import * as THREE from 'three'

/**
 * A centered gear-profile `THREE.Shape`: a circle whose radius alternates
 * between `radius` and `radius - toothDepth` in a trapezoidal wave, producing
 * the machined knurling crevices of a watch crown when extruded. Tooth crests
 * and grooves each span about half a pitch, with short flanks between.
 */
export function gearShape(radius: number, teeth: number, toothDepth: number): THREE.Shape {
  const shape = new THREE.Shape()
  const inner = radius - toothDepth
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
