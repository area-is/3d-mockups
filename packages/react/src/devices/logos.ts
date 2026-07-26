import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'

/**
 * Brand marks as real vector geometry, parsed once from inlined SVG path data
 * (no runtime asset fetches, crisp at any zoom). The SVGs are the official
 * wordmark/logo outlines supplied with the project.
 */

const SAMSUNG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7051.4024 1080"><g transform="matrix(12.944053,0,0,-12.944053,-540.03625,1620.0233)"><g transform="translate(558.9328,88.5098)"><path d="m 0,0 v -11.358 h 7.982 v -11.269 c 0.025,-1.007 -0.03,-2.093 -0.203,-2.962 -0.317,-2.102 -2.314,-5.681 -7.98,-5.681 -5.632,0 -7.593,3.579 -7.933,5.681 -0.143,0.869 -0.204,1.955 -0.204,2.962 v 35.593 c 0,1.259 0.085,2.637 0.352,3.68 0.387,1.897 2.068,5.638 7.743,5.638 5.957,0 7.444,-3.944 7.785,-5.638 0.224,-1.122 0.237,-3.004 0.237,-3.004 V 9.32 h 19.613 v 2.555 c 0,0 0.089,2.666 -0.149,5.154 C 25.769,31.638 13.732,36.26 -0.07,36.26 c -13.827,0 -25.62,-4.665 -27.338,-19.231 -0.155,-1.332 -0.392,-3.728 -0.392,-5.154 v -32.742 c 0,-1.426 0.046,-2.53 0.31,-5.136 1.28,-14.207 13.593,-19.243 27.365,-19.243 13.857,0 26.085,5.036 27.387,19.243 0.231,2.606 0.255,3.71 0.286,5.136 V 0 Z m -135.235,34.165 h -19.696 v -57.613 c 0.031,-1.004 0,-2.132 -0.173,-2.959 -0.411,-1.934 -2.05,-5.656 -7.484,-5.656 -5.364,0 -7.046,3.722 -7.426,5.656 -0.197,0.827 -0.222,1.955 -0.197,2.959 v 57.613 h -19.69 V -21.66 c -0.025,-1.439 0.088,-4.379 0.173,-5.149 1.359,-14.547 12.824,-19.27 27.14,-19.27 14.344,0 25.802,4.723 27.186,19.27 0.109,0.77 0.252,3.71 0.167,5.149 z m -180.97,0 -9.825,-60.876 -9.819,60.876 h -31.771 l -1.685,-77.878 h 19.464 l 0.527,72.094 13.392,-72.094 h 19.748 l 13.404,72.094 0.529,-72.094 h 19.513 l -1.742,77.878 z m -117.631,0 -14.426,-77.878 h 21.037 l 10.871,72.094 10.61,-72.094 h 20.891 l -14.366,77.878 z m 367.435,-62.701 -18.34,62.701 h -28.9 v -77.066 h 19.118 l -1.11,64.707 19.696,-64.707 h 27.717 v 77.066 h -19.243 z m -176.838,42.433 c -0.346,1.538 -0.246,3.172 -0.067,4.026 0.557,2.493 2.232,5.212 7.058,5.212 4.498,0 7.135,-2.804 7.135,-7.012 v -4.762 h 19.2 v 5.428 c 0,16.78 -15.044,19.416 -25.936,19.416 -13.718,0 -24.921,-4.522 -26.967,-17.148 -0.541,-3.436 -0.675,-6.486 0.186,-10.378 3.336,-15.743 30.743,-20.31 34.721,-30.266 0.702,-1.886 0.501,-4.291 0.143,-5.708 -0.596,-2.591 -2.339,-5.197 -7.506,-5.197 -4.846,0 -7.763,2.786 -7.763,6.985 l -0.006,7.474 h -20.666 v -5.941 c 0,-17.215 13.484,-22.409 28.007,-22.409 13.909,0 25.397,4.753 27.24,17.637 0.879,6.657 0.216,10.993 -0.137,12.626 -3.22,16.147 -32.431,21.004 -34.642,30.017 m -253.273,0.191 c -0.377,1.57 -0.289,3.227 -0.079,4.091 0.532,2.481 2.217,5.248 7.128,5.248 4.555,0 7.237,-2.831 7.237,-7.073 v -4.82 h 19.425 v 5.471 c 0,16.941 -15.274,19.641 -26.285,19.641 -13.833,0 -25.136,-4.592 -27.204,-17.309 -0.566,-3.491 -0.663,-6.562 0.155,-10.497 3.372,-15.922 31.05,-20.526 35.077,-30.601 0.754,-1.873 0.526,-4.278 0.152,-5.75 -0.639,-2.618 -2.396,-5.261 -7.606,-5.261 -4.865,0 -7.775,2.834 -7.775,7.091 l -0.027,7.494 h -20.898 v -5.955 c 0,-17.412 13.675,-22.648 28.311,-22.648 14.071,0 25.626,4.795 27.511,17.828 0.937,6.718 0.234,11.09 -0.082,12.748 -3.287,16.345 -32.823,21.186 -35.04,30.302"/></g></g></svg>`

const APPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 814 1000"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/></svg>`

/**
 * The Thunderbolt mark printed above a Thunderbolt port — the bolt with its
 * mid step and barbed arrowhead, traced from Apple's own port icon.
 */
const THUNDERBOLT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 60"><path d="M24 0 L32 0 L17 22 L30.5 22.5 L18 41 L14 47 L18.5 50.5 L3 59.5 L6.5 42 L10.5 45.5 L13.5 41.5 L21 27.5 L8 27.5 Z"/></svg>`

const SVGS = { samsung: SAMSUNG_SVG, apple: APPLE_SVG, thunderbolt: THUNDERBOLT_SVG } as const

export type LogoName = keyof typeof SVGS

/**
 * Parses a logo SVG into a flat ShapeGeometry, centered at the origin and
 * uniformly scaled to fit the `width` x `height` box (aspect preserved).
 */
export function createLogoGeometry(name: LogoName, width: number, height: number): THREE.BufferGeometry {
  const data = new SVGLoader().parse(SVGS[name])
  const shapes = data.paths.flatMap((path) => path.toShapes())
  const geometry = new THREE.ShapeGeometry(shapes, 8)
  geometry.computeBoundingBox()
  const box = geometry.boundingBox!
  const size = new THREE.Vector3()
  box.getSize(size)
  const center = new THREE.Vector3()
  box.getCenter(center)
  const s = Math.min(width / size.x, height / size.y)
  geometry.translate(-center.x, -center.y, 0)
  // SVG y runs downward — flip to world y-up, then restore the winding the
  // negative scale inverted so the mark stays visible from its front face.
  geometry.scale(s, -s, 1)
  const index = geometry.getIndex()
  if (index) {
    const a = index.array
    for (let i = 0; i < a.length; i += 3) {
      const t = a[i + 1]
      a[i + 1] = a[i + 2]!
      a[i + 2] = t!
    }
    index.needsUpdate = true
  }
  geometry.computeVertexNormals()
  return geometry
}
