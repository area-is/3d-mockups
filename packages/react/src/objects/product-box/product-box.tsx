import * as React from 'react'
import type * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { PRODUCT_BOX, PRODUCT_BOX_REGIONS, productBoxLayout, type ProductBoxSizeMm } from '@area-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { useScreenOccluders } from '../../screen/occluders'
import { collectSlots, createSlots, resolveSurface, type SurfaceDefaults } from '../../slots'

type GroupProps = ThreeElements['group']

export interface ProductBoxProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Panel content. Bare children fill the front panel; name panels explicitly
   * with `<ProductBox.Front>`, `<ProductBox.Right>` (the side visible in a
   * standard 3/4 pose), `<ProductBox.Left>`, `<ProductBox.Top>`,
   * `<ProductBox.Bottom>` (oriented to read from the front when tipped over)
   * and `<ProductBox.Back>`.
   */
  children?: React.ReactNode
  /**
   * Carton size in real millimeters: `{ width, height, depth }`. The longest
   * edge normalizes to the stage, so any size fills the default camera while
   * the mm dimensions set the true proportions. Defaults to the 190×265×55 mm
   * retail blank.
   */
  size?: ProductBoxSizeMm
  /** Carton stock color — every unprinted panel and the fold edges. */
  color?: string
  /**
   * How panel content hides when that panel turns away from the camera.
   * `true` raycasts against the carton (fast, interactive). `'blending'` uses
   * per-pixel depth blending. `false` disables hiding.
   */
  occlude?: boolean | 'blending'
}

/**
 * A procedurally built standing product carton: crisp fold edges, matte
 * coated stock, and all six panels live DOM — front, back, both sides, top
 * and bottom — so a standard 3/4 hero pose shows three printed faces at
 * once and every other pose stays printed too. No 3D asset files are
 * loaded.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 *
 * ```tsx
 * <ProductBox>
 *   <ProductBox.Front><FrontPanel /></ProductBox.Front>
 *   <ProductBox.Right><SidePanel /></ProductBox.Right>
 * </ProductBox>
 * ```
 */
function ProductBoxImpl({
  children,
  size,
  color = '#f4f1ea',
  surfaceBackground = '#ffffff',
  resolution = PRODUCT_BOX.resolution,
  interactive = true,
  dragToRotate = true,
  occlude = true,
  surfaceStyle,
  ...groupProps
}: ProductBoxProps) {
  const regions = collectSlots(children, PRODUCT_BOX_REGIONS)
  const { body, flap } = React.useMemo(
    () => productBoxLayout(size),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size?.width, size?.height, size?.depth]
  )
  const bodyRef = React.useRef<THREE.Mesh>(null!)
  const occludeRefs = useScreenOccluders(bodyRef)
  const flapDepth = body.depth - flap.backGap

  // the glue-seam lap joint scales down with shallow cartons
  const seamWidth = Math.min(0.38, body.depth * 0.43)

  // every panel shares the front panel's dpi so type sizes match across faces
  const pxPerUnit = resolution / body.width

  const shared = {
    radius: body.radius,
    occlude: occlude === true ? occludeRefs : occlude === 'blending' ? ('blending' as const) : undefined,
  }
  const panelDefaults = {
    background: surfaceBackground,
    resolution,
    interactive,
    dragToRotate,
    style: surfaceStyle,
  }
  // the side panels' virtual width follows the carton depth at the front dpi
  const sideDefaults = { ...panelDefaults, resolution: Math.round(body.depth * pxPerUnit) }

  return (
    <group {...groupProps}>
      {/* the carton — satin coated stock, crisp but not razor-sharp folds */}
      <RoundedBox ref={bodyRef} args={[body.width, body.height, body.depth]} radius={body.radius}>
        <meshPhysicalMaterial color={color} metalness={0} roughness={0.55} clearcoat={0.2} clearcoatRoughness={0.7} />
      </RoundedBox>

      {/* tuck flap resting on the top face, its seam short of the back edge */}
      <RoundedBox
        args={[body.width - 0.02, flap.lift * 2, flapDepth]}
        radius={flap.lift * 0.9}
        position={[0, body.height / 2, (body.depth - flapDepth) / 2 - flap.backGap / 2]}
      >
        <meshPhysicalMaterial color={color} metalness={0} roughness={0.55} clearcoat={0.2} clearcoatRoughness={0.7} />
      </RoundedBox>

      {/* manufacturer's glue seam: the vertical lap joint on the left rear edge */}
      <mesh position={[-body.width / 2 - 0.0015, 0, -body.depth / 2 + seamWidth / 2 + 0.01]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[seamWidth, body.height - 0.02]} />
        <meshPhysicalMaterial color={color} metalness={0} roughness={0.62} />
      </mesh>
      <mesh position={[-body.width / 2 - 0.003, 0, -body.depth / 2 + seamWidth + 0.01]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[0.006, body.height - 0.02]} />
        <meshBasicMaterial color="rgba(0,0,0)" transparent opacity={0.22} />
      </mesh>

      {/* front panel */}
      <DeviceScreen
        {...shared}
        {...resolveSurface(regions.front, panelDefaults)}
        width={body.width}
        height={body.height}
        position={[0, 0, body.depth / 2 + 0.003]}
      >
        {regions.front?.children}
      </DeviceScreen>

      {/* right side panel */}
      {regions.right != null && (
        <DeviceScreen
          {...shared}
          {...resolveSurface(regions.right, sideDefaults)}
          width={body.depth}
          height={body.height}
          position={[body.width / 2 + 0.003, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
        >
          {regions.right.children}
        </DeviceScreen>
      )}

      {/* left side panel */}
      {regions.left != null && (
        <DeviceScreen
          {...shared}
          {...resolveSurface(regions.left, sideDefaults)}
          width={body.depth}
          height={body.height}
          position={[-body.width / 2 - 0.003, 0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          {regions.left.children}
        </DeviceScreen>
      )}

      {/* top panel — oriented so its content reads from the front */}
      {regions.top != null && (
        <DeviceScreen
          {...shared}
          {...resolveSurface(regions.top, panelDefaults)}
          width={body.width}
          height={body.depth}
          position={[0, body.height / 2 + 0.003, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          {regions.top.children}
        </DeviceScreen>
      )}

      {/* bottom panel */}
      {regions.bottom != null && (
        <DeviceScreen
          {...shared}
          {...resolveSurface(regions.bottom, panelDefaults)}
          width={body.width}
          height={body.depth}
          position={[0, -body.height / 2 - 0.003, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          {regions.bottom.children}
        </DeviceScreen>
      )}

      {/* back panel */}
      {regions.back != null && (
        <DeviceScreen
          {...shared}
          {...resolveSurface(regions.back, panelDefaults)}
          width={body.width}
          height={body.height}
          position={[0, 0, -body.depth / 2 - 0.003]}
          rotation={[0, Math.PI, 0]}
        >
          {regions.back.children}
        </DeviceScreen>
      )}
    </group>
  )
}
ProductBoxImpl.displayName = 'ProductBox'

/** The carton's compound slots, shared by `<ProductBox>` and `<ProductBoxMockup>`. */
export const productBoxSlots = createSlots(PRODUCT_BOX_REGIONS)

export const ProductBox = Object.assign(ProductBoxImpl, productBoxSlots)
