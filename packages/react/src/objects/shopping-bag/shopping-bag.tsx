import * as React from 'react'
import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { SHOPPING_BAG, SHOPPING_BAG_REGIONS, shoppingBagLayout, type ShoppingBagSizeMm } from '@area-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { useScreenOccluders } from '../../screen/occluders'
import { collectSlots, createSlots, resolveSurface, type SurfaceDefaults } from '../../slots'

type GroupProps = ThreeElements['group']

export interface ShoppingBagProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Face designs, full bleed edge to edge. Bare children fill the front
   * face; name faces explicitly with `<ShoppingBag.Front>` and
   * `<ShoppingBag.Back>`.
   */
  children?: React.ReactNode
  /**
   * Bag size in real millimeters: `{ width, height, depth }`. The longest
   * edge normalizes to the stage, so any size fills the default camera
   * while the mm dimensions set the true proportions. Defaults to the
   * 320×420×140 mm carrier blank.
   */
  size?: ShoppingBagSizeMm
  /** Bag stock color. Kraft by default; try gloss white or a brand dip. */
  color?: string
  /** Rope handle color. */
  handleColor?: string
  /**
   * How face content hides when that face turns away from the camera.
   * `true` raycasts against the bag walls (fast, interactive). `'blending'`
   * uses per-pixel depth blending. `false` disables hiding.
   */
  occlude?: boolean | 'blending'
}

/**
 * A procedurally built kraft shopping bag, hollow like the real thing: four
 * walls and a floor around an open rectangular mouth, side gussets creasing
 * inward at the mouth and folding flat toward the square bottom, the
 * envelope fold showing on the underside, and twisted-rope handles arcing
 * over the rim to glued reinforcement patches inside. The front and back
 * faces are live DOM, full bleed to the top edge. No 3D asset files are
 * loaded.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 *
 * ```tsx
 * <ShoppingBag>
 *   <ShoppingBag.Front><YourBagFace /></ShoppingBag.Front>
 *   <ShoppingBag.Back><BackFace /></ShoppingBag.Back>
 * </ShoppingBag>
 * ```
 */
function ShoppingBagImpl({
  children,
  size,
  color = '#c19a6b',
  handleColor = '#7d6142',
  surfaceBackground = '#ffffff',
  resolution = SHOPPING_BAG.resolution,
  interactive = true,
  dragToRotate = true,
  occlude = true,
  surfaceStyle,
  ...groupProps
}: ShoppingBagProps) {
  const regions = collectSlots(children, SHOPPING_BAG_REGIONS)
  const { body, wall, gusset, handle } = React.useMemo(
    () => shoppingBagLayout(size),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size?.width, size?.height, size?.depth]
  )
  const frontRef = React.useRef<THREE.Mesh>(null!)
  const backRef = React.useRef<THREE.Mesh>(null!)
  const occludeRefs = useScreenOccluders(frontRef, backRef)

  const paper = { color, metalness: 0, roughness: 0.82 }
  const paperInside = { color: '#b08a5e', metalness: 0, roughness: 0.9 }

  // Each side gusset is two ruled panels meeting at an inward crease down the
  // vertical centerline. The crease is deepest at the mouth and dies to
  // nothing at the base — a standing bag folds open to a flat square bottom,
  // so the footprint stays a clean rectangle the floor panel can fill.
  const gussetGeometry = React.useMemo(() => {
    const xo = body.width / 2 - wall / 2
    const zo = body.depth / 2 - wall / 2
    const top = body.height / 2
    const bottom = -body.height / 2
    const positions: number[] = []
    const push = (...vs: [number, number, number][]) => {
      for (const v of vs) positions.push(...v)
    }
    for (const sx of [1, -1] as const) {
      for (const sz of [1, -1] as const) {
        const outerTop: [number, number, number] = [sx * xo, top, sz * zo]
        const outerBottom: [number, number, number] = [sx * xo, bottom, sz * zo]
        const creaseTop: [number, number, number] = [sx * (xo - gusset), top, 0]
        const creaseBottom: [number, number, number] = [sx * xo, bottom, 0]
        // split along the creaseTop–outerBottom diagonal — the fold line a
        // real gusset shows, running from the bottom corner up to the crease
        push(creaseTop, creaseBottom, outerBottom)
        push(creaseTop, outerBottom, outerTop)
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.computeVertexNormals()
    return geometry
  }, [body, wall, gusset])
  React.useEffect(() => () => gussetGeometry.dispose(), [gussetGeometry])

  // The envelope fold on the underside, painted once: diagonal creases from
  // each corner and the glued outer flap's edges, as a white-based map so
  // the bag `color` still tints it.
  const bottomTexture = React.useMemo(() => {
    if (typeof document === 'undefined') return null
    const w = 512
    const h = Math.max(96, Math.round((w * body.depth) / body.width))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    const inset = h / 2
    // the glued flap sits a hair proud — a whisper darker band down the middle
    ctx.fillStyle = 'rgba(0,0,0,0.045)'
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(inset, h * 0.3)
    ctx.lineTo(w - inset, h * 0.3)
    ctx.lineTo(w, 0)
    ctx.lineTo(w, h)
    ctx.lineTo(w - inset, h * 0.7)
    ctx.lineTo(inset, h * 0.7)
    ctx.lineTo(0, h)
    ctx.closePath()
    ctx.fill()
    const crease = (x1: number, y1: number, x2: number, y2: number, alpha: number) => {
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.strokeStyle = `rgba(60,40,20,${alpha})`
      ctx.lineWidth = 2.5
      ctx.stroke()
    }
    // 45° diagonals from each corner to the flap edge
    crease(0, 0, inset, inset, 0.16)
    crease(w, 0, w - inset, inset, 0.16)
    crease(0, h, inset, h - inset, 0.16)
    crease(w, h, w - inset, h - inset, 0.16)
    // the outer flap's cut edges, spanning between the diagonals
    crease(inset, h * 0.3, w - inset, h * 0.3, 0.12)
    crease(inset, h * 0.7, w - inset, h * 0.7, 0.12)
    const texture = new THREE.CanvasTexture(canvas)
    texture.anisotropy = 4
    return texture
  }, [body])
  React.useEffect(() => () => bottomTexture?.dispose(), [bottomTexture])

  const surfaceDefaults = {
    background: surfaceBackground,
    resolution,
    interactive,
    dragToRotate,
    style: surfaceStyle,
  }
  const faceProps = {
    width: body.width,
    height: body.height,
    radius: body.radius,
    occlude: occlude === true ? occludeRefs : occlude === 'blending' ? ('blending' as const) : undefined,
  }

  // handle hardware hangs from the rim in proportion to the handle itself
  const cordDrop = handle.radius * 0.4
  const patchDrop = handle.radius * 0.31

  return (
    <group {...groupProps}>
      {/* front and back walls */}
      <mesh ref={frontRef} position={[0, 0, body.depth / 2 - wall / 2]}>
        <boxGeometry args={[body.width, body.height, wall]} />
        <meshPhysicalMaterial {...paper} />
      </mesh>
      <mesh ref={backRef} position={[0, 0, -body.depth / 2 + wall / 2]}>
        <boxGeometry args={[body.width, body.height, wall]} />
        <meshPhysicalMaterial {...paper} />
      </mesh>

      {/* side gussets — creased at the mouth, flat at the base */}
      <mesh geometry={gussetGeometry}>
        <meshPhysicalMaterial {...paper} side={THREE.DoubleSide} />
      </mesh>

      {/* floor slab, flush with the base and spanning wall to wall */}
      <mesh position={[0, -body.height / 2 + 0.025, 0]}>
        <boxGeometry args={[body.width - wall * 2 - 0.004, 0.05, body.depth - wall * 2 - 0.004]} />
        <meshPhysicalMaterial {...paperInside} />
      </mesh>

      {/* the underside: one clean rectangle carrying the envelope fold */}
      {bottomTexture && (
        <mesh rotation-x={Math.PI / 2} position={[0, -body.height / 2 - 0.0008, 0]}>
          <planeGeometry args={[body.width - 0.006, body.depth - 0.006]} />
          <meshPhysicalMaterial color={color} map={bottomTexture} metalness={0} roughness={0.88} />
        </mesh>
      )}

      {/* twisted-rope handles over the rim, with glued patches inside */}
      {([1, -1] as const).map((s) => (
        <group key={s} position={[0, body.height / 2, s * (body.depth / 2 - wall - 0.03)]}>
          <mesh scale={[1, handle.rise, 1]}>
            <torusGeometry args={[handle.radius, handle.tube, 10, 40, Math.PI]} />
            <meshPhysicalMaterial color={handleColor} metalness={0} roughness={0.8} />
          </mesh>
          {([1, -1] as const).map((x) => (
            <mesh key={x} position={[x * handle.radius, -cordDrop / 2, 0]}>
              <cylinderGeometry args={[handle.tube, handle.tube, cordDrop, 10]} />
              <meshPhysicalMaterial color={handleColor} metalness={0} roughness={0.8} />
            </mesh>
          ))}
          {([1, -1] as const).map((x) => (
            <mesh key={`p${x}`} position={[x * handle.radius, -patchDrop, -s * 0.012]} rotation-y={s === 1 ? Math.PI : 0}>
              <planeGeometry args={[handle.patch.width, handle.patch.height]} />
              <meshPhysicalMaterial color="#a67f52" metalness={0} roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}

      {/* live front face — full bleed to the top edge */}
      <DeviceScreen
        {...faceProps}
        {...resolveSurface(regions.front, surfaceDefaults)}
        position={[0, 0, body.depth / 2 + 0.004]}
      >
        {regions.front?.children}
      </DeviceScreen>

      {/* live back face */}
      {regions.back != null && (
        <DeviceScreen
          {...faceProps}
          {...resolveSurface(regions.back, surfaceDefaults)}
          position={[0, 0, -body.depth / 2 - 0.004]}
          rotation={[0, Math.PI, 0]}
        >
          {regions.back.children}
        </DeviceScreen>
      )}
    </group>
  )
}
ShoppingBagImpl.displayName = 'ShoppingBag'

/** The bag's compound slots, shared by `<ShoppingBag>` and `<ShoppingBagMockup>`. */
export const shoppingBagSlots = createSlots(SHOPPING_BAG_REGIONS)

export const ShoppingBag = Object.assign(ShoppingBagImpl, shoppingBagSlots)
