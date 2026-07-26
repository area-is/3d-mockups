import * as React from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

/**
 * Scene-wide screen-occluder registry. A screen must hide behind ANY body
 * standing between it and the camera — with two phones side by side, one
 * phone's screen must not bleed through the other's back. Each mockup
 * registers its chassis meshes here and occludes its screen against the whole
 * scene's set, not just its own body.
 */

type OccluderStore = {
  refs: Set<React.RefObject<THREE.Mesh>>
  version: number
  listeners: Set<() => void>
}

const stores = new WeakMap<THREE.Scene, OccluderStore>()

function storeFor(scene: THREE.Scene): OccluderStore {
  let store = stores.get(scene)
  if (!store) {
    store = { refs: new Set(), version: 0, listeners: new Set() }
    stores.set(scene, store)
  }
  return store
}

/**
 * Register this mockup's chassis meshes as screen occluders and get back
 * every occluder registered in the scene (own meshes included). The returned
 * array is stable between mount changes, so it can be passed straight to
 * drei's `<Html occlude>`.
 */
export function useScreenOccluders(
  ...own: React.RefObject<THREE.Mesh>[]
): React.RefObject<THREE.Mesh>[] {
  const scene = useThree((state) => state.scene)

  React.useEffect(() => {
    const store = storeFor(scene)
    for (const ref of own) store.refs.add(ref)
    store.version++
    store.listeners.forEach((notify) => notify())
    return () => {
      for (const ref of own) store.refs.delete(ref)
      store.version++
      store.listeners.forEach((notify) => notify())
    }
    // The refs are stable useRef objects owned by the calling component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, ...own])

  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const store = storeFor(scene)
      store.listeners.add(onChange)
      return () => {
        store.listeners.delete(onChange)
      }
    },
    [scene]
  )
  const version = React.useSyncExternalStore(
    subscribe,
    () => storeFor(scene).version,
    () => 0
  )

  return React.useMemo(() => {
    void version
    return [...storeFor(scene).refs]
  }, [scene, version])
}

/**
 * The slice of a three-mesh-bvh `MeshBVH` the occlusion test uses. Machined
 * chassis geometries get a `boundsTree` attached by `cutGeometry` (the BVH
 * library is already in that bundle); everything else falls back to three's
 * built-in raycast, so small object mockups don't pay for the BVH code.
 */
interface BoundsTree {
  raycastFirst(ray: THREE.Ray, side: THREE.Side): { point: THREE.Vector3 } | null
}

/**
 * Coverage below which a raycast screen is drawn at full strength, and at or
 * above which it is gone entirely. Between them it fades, which is the whole
 * trick: the samples are five discrete rays, so a screen sliding behind a body
 * steps 2/5 -> 3/5 -> 4/5 and a hard threshold anywhere in there pops. Fading
 * across the middle band turns the step into a ramp, and leaves a dead zone at
 * each end so a screen hovering near the boundary settles instead of blinking.
 */
export const SCREEN_COVER_VISIBLE = 0.4
export const SCREEN_COVER_HIDDEN = 0.8

/**
 * Multi-sample occlusion test for a DOM screen plane. A single ray to the
 * plane's center (what a naive raycast occluder checks) misses partial
 * overlaps, letting the screen pierce through chassis edges and silhouette
 * gaps; this samples the center plus four inset corners.
 *
 * Returns HOW MUCH of the screen is blocked, 0 to 1, rather than a yes/no.
 * The caller ramps that into an opacity (see the constants above): a screen
 * cannot be partly covered by 3D geometry in this mode — the DOM is one
 * element sitting on top of the canvas — so the honest thing it can do while
 * passing behind something is dissolve rather than vanish between frames.
 */
export function createScreenOcclusionTester(): (
  anchor: THREE.Object3D,
  width: number,
  height: number,
  occluders: React.RefObject<THREE.Mesh>[],
  camera: THREE.Camera
) => number {
  // Scratch values reused across frames — no per-frame allocation.
  const sample = new THREE.Vector3()
  const localRay = new THREE.Ray()
  const inverse = new THREE.Matrix4()
  const hitPoint = new THREE.Vector3()
  const localHit = new THREE.Vector3()
  const anchorInverse = new THREE.Matrix4()
  const raycaster = new THREE.Raycaster()
  const intersections: THREE.Intersection[] = []
  const SAMPLES: readonly [number, number][] = [
    [0, 0],
    [-0.35, -0.35],
    [0.35, -0.35],
    [-0.35, 0.35],
    [0.35, 0.35],
  ]
  // Hits this close to the screen's own plane never count as blocking: at
  // near-edge-on views the sample rays run almost parallel to the display
  // and graze the device's own bezel rim or a hinge spine tangent to the
  // plane — hiding a screen that is plainly visible. A real blocker (a
  // roof, another device's body) stands well off the plane.
  const PLANE_EPS = 0.02
  // Once this many are blocked the screen is gone whatever the rest say, and
  // once this many can still come back clear it is at full strength whatever
  // they say — so the loop can stop casting in both cases.
  const HIDES_AT = SCREEN_COVER_HIDDEN * SAMPLES.length
  const SHOWS_UNDER = SCREEN_COVER_VISIBLE * SAMPLES.length
  return (anchor, width, height, occluders, camera) => {
    anchorInverse.copy(anchor.matrixWorld).invert()
    const blockedAt = (point: THREE.Vector3) =>
      Math.abs(localHit.copy(point).applyMatrix4(anchorInverse).z) > PLANE_EPS
    let blocked = 0
    let remaining = SAMPLES.length
    for (const [sx, sy] of SAMPLES) {
      if (blocked >= HIDES_AT) return 1
      if (blocked + remaining <= SHOWS_UNDER) return SCREEN_COVER_VISIBLE
      remaining--
      sample.set(sx * width, sy * height, 0)
      anchor.localToWorld(sample)
      raycaster.ray.origin.setFromMatrixPosition(camera.matrixWorld)
      raycaster.ray.direction.copy(sample).sub(raycaster.ray.origin)
      const distance = raycaster.ray.direction.length()
      raycaster.ray.direction.normalize()
      // Blocked only when a hit is meaningfully NEARER than the sample — the
      // screen's own cover glass just behind the plane never counts.
      raycaster.far = distance - 0.02
      let hitThisSample = false
      for (const ref of occluders) {
        const mesh = ref.current
        if (!mesh?.geometry) continue
        const bvh = (mesh.geometry as THREE.BufferGeometry & { boundsTree?: BoundsTree }).boundsTree
        if (bvh) {
          inverse.copy(mesh.matrixWorld).invert()
          localRay.copy(raycaster.ray).applyMatrix4(inverse)
          const hit = bvh.raycastFirst(localRay, THREE.DoubleSide)
          if (hit) {
            hitPoint.copy(hit.point).applyMatrix4(mesh.matrixWorld)
            if (hitPoint.distanceTo(raycaster.ray.origin) < distance - 0.02 && blockedAt(hitPoint)) {
              hitThisSample = true
            }
          }
        } else {
          intersections.length = 0
          mesh.raycast(raycaster, intersections)
          for (const intersection of intersections) {
            if (blockedAt(intersection.point)) hitThisSample = true
          }
        }
        if (hitThisSample) break
      }
      if (hitThisSample) blocked++
    }
    return blocked / SAMPLES.length
  }
}
