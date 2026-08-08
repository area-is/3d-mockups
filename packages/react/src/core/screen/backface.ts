import type { Camera, Object3D } from 'three'
import { Quaternion, Vector3 } from 'three'

/**
 * Hide the DOM screen whenever its plane faces away from the camera.
 *
 * CSS backface-visibility can't see the HTML bridge's transform chain, and two
 * overlapping DOM planes (a card's front and back) otherwise paint in DOM
 * order - the reverse face would bleed through, mirrored. Hiding the plane
 * whenever its normal points away from the camera is deterministic, and the
 * depth mask alone cannot do it (a back-facing screen's mask still clears the
 * canvas over it).
 *
 * Bindings call the returned function once per frame with the screen's anchor
 * object, its content element, and the active camera.
 */
export type BackfaceCuller = (anchor: Object3D, content: HTMLElement, camera: Camera) => void

/**
 * Facing threshold below which the plane also hides: within a fraction of a
 * degree of edge-on the DOM plane is a degenerate sub-pixel sliver whose
 * CSS3D matrix shimmers and paints OVER chassis parts (the browser composites
 * the bridge above WebGL). Occlusion by the body is the depth mask's job, so
 * this stays tiny - a slanted side view must keep showing the foreshortened
 * live screen, exactly like a real device seen edge-ish on.
 */
const GRAZING_DOT = 0.015

export function createBackfaceCuller(): BackfaceCuller {
  // Scratch values reused across frames - no per-frame allocation.
  const n = new Vector3()
  const p = new Vector3()
  const q = new Quaternion()
  return (anchor, content, camera) => {
    anchor.getWorldQuaternion(q)
    anchor.getWorldPosition(p)
    n.set(0, 0, 1).applyQuaternion(q)
    p.subVectors(camera.position, p).normalize()
    const visibility = n.dot(p) > GRAZING_DOT ? '' : 'hidden'
    if (content.style.visibility !== visibility) content.style.visibility = visibility
  }
}
