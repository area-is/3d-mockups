import * as React from 'react'
import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { BUSINESS_CARD, BUSINESS_CARD_REGIONS } from '@area-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { roundedRectShape } from '@area-mockups/core'
import { useScreenOccluders } from '../../screen/occluders'
import { collectSlots, createSlots, resolveSurface, type SurfaceDefaults } from '../../slots'

type GroupProps = ThreeElements['group']

export interface BusinessCardProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Face designs, full bleed. Bare children fill the front face; name faces
   * explicitly with `<BusinessCard.Front>` and `<BusinessCard.Back>` (plain
   * stock when the back is omitted).
   */
  children?: React.ReactNode
  /** Stock color — the faces' base (and the back, behind any back content). */
  color?: string
  /**
   * Painted-edge color, the signature of premium 32 pt stock (think a bright
   * seam of color around the card). Defaults to the stock color (unpainted).
   */
  edgeColor?: string
  /**
   * How face content hides when that face turns away from the camera.
   * `true` raycasts against the card (fast, interactive). `'blending'` uses
   * per-pixel depth blending. `false` disables hiding.
   */
  occlude?: boolean | 'blending'
}

/**
 * A procedurally built business card on premium 32 pt stock: rounded die-cut
 * corners, visible paper edge, and live full-bleed DOM on the front — and,
 * optionally, the back. No 3D asset files are loaded.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 *
 * ```tsx
 * <BusinessCard>
 *   <BusinessCard.Front><CardFront /></BusinessCard.Front>
 *   <BusinessCard.Back><CardBack /></BusinessCard.Back>
 * </BusinessCard>
 * ```
 */
function BusinessCardImpl({
  children,
  color = '#f7f6f2',
  edgeColor,
  surfaceBackground = '#ffffff',
  resolution = BUSINESS_CARD.resolution,
  interactive = true,
  dragToRotate = true,
  occlude = true,
  surfaceStyle,
  ...groupProps
}: BusinessCardProps) {
  const regions = collectSlots(children, BUSINESS_CARD_REGIONS)
  const { body, face } = BUSINESS_CARD
  const bodyRef = React.useRef<THREE.Mesh>(null!)
  const occludeRefs = useScreenOccluders(bodyRef)

  const bodyGeometry = React.useMemo(() => {
    const shape = roundedRectShape(
      body.width - body.bevel * 2,
      body.height - body.bevel * 2,
      body.radius - body.bevel
    )
    const depth = body.thickness - body.bevel * 2
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: body.bevel,
      bevelSize: body.bevel,
      bevelSegments: 2,
      curveSegments: 12,
    })
    geometry.translate(0, 0, -depth / 2)
    return geometry
  }, [body])

  React.useEffect(() => () => bodyGeometry.dispose(), [bodyGeometry])

  const surfaceDefaults = {
    background: surfaceBackground,
    resolution,
    interactive,
    dragToRotate,
    style: surfaceStyle,
  }
  const faceProps = {
    width: face.width,
    height: face.height,
    radius: face.radius,
    occlude: occlude === true ? occludeRefs : occlude === 'blending' ? ('blending' as const) : undefined,
  }

  return (
    <group {...groupProps}>
      {/* the stock — faces in the stock color, die-cut edge optionally painted
          (ExtrudeGeometry material group 0 is the caps, group 1 the sides) */}
      <mesh ref={bodyRef} geometry={bodyGeometry}>
        <meshPhysicalMaterial attach="material-0" color={color} metalness={0} roughness={0.82} />
        <meshPhysicalMaterial
          attach="material-1"
          color={edgeColor ?? color}
          metalness={0}
          roughness={edgeColor ? 0.5 : 0.82}
        />
      </mesh>

      {/* live front face */}
      <DeviceScreen
        {...faceProps}
        {...resolveSurface(regions.front, surfaceDefaults)}
        position={[0, 0, body.thickness / 2 + 0.003]}
      >
        {regions.front?.children}
      </DeviceScreen>

      {/* live back face — only mounted when there's a design for it */}
      {regions.back != null && (
        <DeviceScreen
          {...faceProps}
          {...resolveSurface(regions.back, surfaceDefaults)}
          position={[0, 0, -body.thickness / 2 - 0.003]}
          rotation={[0, Math.PI, 0]}
        >
          {regions.back.children}
        </DeviceScreen>
      )}
    </group>
  )
}
BusinessCardImpl.displayName = 'BusinessCard'

/** The card's compound slots, shared by `<BusinessCard>` and `<BusinessCardMockup>`. */
export const businessCardSlots = createSlots(BUSINESS_CARD_REGIONS)

export const BusinessCard = Object.assign(BusinessCardImpl, businessCardSlots)
