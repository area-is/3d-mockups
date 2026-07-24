import * as React from 'react'
import type * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { CUSTOM_BOX, CUSTOM_BOX_REGIONS, customBoxScale, type CustomBoxSizeMm } from '@area-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { useScreenOccluders } from '../../screen/occluders'
import { collectSlots, createSlots, resolveSurface, type SurfaceDefaults } from '../../slots'

type GroupProps = ThreeElements['group']

export interface CustomBoxProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Face content. Bare children fill the front face; name faces explicitly
   * with `<CustomBox.Front>`, `<CustomBox.Back>`, `<CustomBox.Left>`,
   * `<CustomBox.Right>`, `<CustomBox.Top>` and `<CustomBox.Bottom>`.
   */
  children?: React.ReactNode
  /** Box size in real millimeters: `{ width, height, depth }`. */
  size: CustomBoxSizeMm
  /** Stock color for unprinted faces. */
  color?: string
  /**
   * How face content hides when that face turns away from the camera.
   * `true` raycasts against the box (fast, interactive). `'blending'` uses
   * per-pixel depth blending. `false` disables hiding.
   */
  occlude?: boolean | 'blending'
}

/**
 * A rectangular box at ANY size you specify in millimeters, with all six
 * faces printable as live DOM at one shared dpi. The longest edge
 * normalizes to the stage, so every size fills the default camera while
 * the mm dimensions set the true proportions. No 3D asset files are loaded.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 *
 * ```tsx
 * <CustomBox size={{ width: 250, height: 90, depth: 160 }}>
 *   <CustomBox.Front><YourFront /></CustomBox.Front>
 *   <CustomBox.Top background="#111"><YourLid /></CustomBox.Top>
 * </CustomBox>
 * ```
 */
function CustomBoxImpl({
  children,
  size,
  color = '#e8e5df',
  surfaceBackground = '#ffffff',
  resolution = CUSTOM_BOX.resolution,
  interactive = true,
  dragToRotate = true,
  occlude = true,
  surfaceStyle,
  ...groupProps
}: CustomBoxProps) {
  const regions = collectSlots(children, CUSTOM_BOX_REGIONS)
  const scale = customBoxScale(size)
  const w = size.width * scale
  const h = size.height * scale
  const d = size.depth * scale
  const radius = Math.min(0.02, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)

  const bodyRef = React.useRef<THREE.Mesh>(null!)
  const occludeRefs = useScreenOccluders(bodyRef)
  const pxPerUnit = resolution / w

  const shared = {
    radius,
    occlude: occlude === true ? occludeRefs : occlude === 'blending' ? ('blending' as const) : undefined,
  }

  const lift = 0.004
  const faces: {
    slot: (typeof regions)[keyof typeof regions]
    width: number
    height: number
    position: [number, number, number]
    rotation: [number, number, number]
  }[] = [
    { slot: regions.front, width: w, height: h, position: [0, 0, d / 2 + lift], rotation: [0, 0, 0] },
    { slot: regions.back, width: w, height: h, position: [0, 0, -d / 2 - lift], rotation: [0, Math.PI, 0] },
    { slot: regions.left, width: d, height: h, position: [-w / 2 - lift, 0, 0], rotation: [0, -Math.PI / 2, 0] },
    { slot: regions.right, width: d, height: h, position: [w / 2 + lift, 0, 0], rotation: [0, Math.PI / 2, 0] },
    { slot: regions.top, width: w, height: d, position: [0, h / 2 + lift, 0], rotation: [-Math.PI / 2, 0, 0] },
    { slot: regions.bottom, width: w, height: d, position: [0, -h / 2 - lift, 0], rotation: [Math.PI / 2, 0, 0] },
  ]

  return (
    <group {...groupProps}>
      <RoundedBox ref={bodyRef} args={[w, h, d]} radius={Math.max(radius, 0.004)}>
        <meshPhysicalMaterial color={color} metalness={0} roughness={0.7} />
      </RoundedBox>

      {faces.map(
        (face, i) =>
          face.slot != null && (
            <DeviceScreen
              key={i}
              {...shared}
              {...resolveSurface(face.slot, {
                background: surfaceBackground,
                // every face shares the front face's dpi unless its slot overrides
                resolution: Math.round(face.width * pxPerUnit),
                interactive,
                dragToRotate,
                style: surfaceStyle,
              })}
              width={face.width}
              height={face.height}
              position={face.position}
              rotation={face.rotation}
            >
              {face.slot.children}
            </DeviceScreen>
          )
      )}
    </group>
  )
}
CustomBoxImpl.displayName = 'CustomBox'

/** The box's compound slots, shared by `<CustomBox>` and `<CustomBoxMockup>`. */
export const customBoxSlots = createSlots(CUSTOM_BOX_REGIONS)

export const CustomBox = Object.assign(CustomBoxImpl, customBoxSlots)
