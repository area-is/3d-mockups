import * as React from 'react'
import type * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { CUSTOM_PANEL, CUSTOM_PANEL_REGIONS, customPanelScale, type CustomSizeMm } from '@area-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { useScreenOccluders } from '../../screen/occluders'
import { collectSlots, createSlots, resolveSurface, type SurfaceDefaults } from '../../slots'

type GroupProps = ThreeElements['group']

export interface CustomPanelProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Face designs, full bleed. Bare children fill the front face; name faces
   * explicitly with `<CustomPanel.Front>` and `<CustomPanel.Back>`.
   */
  children?: React.ReactNode
  /** Panel size in real millimeters: `{ width, height, thickness? }`. */
  size: CustomSizeMm
  /** Stock color (edges, and the back when no back content is set). */
  color?: string
  /** Corner rounding in millimeters. */
  cornerRadius?: number
  /**
   * How face content hides when that face turns away from the camera.
   * `true` raycasts against the panel (fast, interactive). `'blending'` uses
   * per-pixel depth blending. `false` disables hiding.
   */
  occlude?: boolean | 'blending'
}

/**
 * A flat rectangular panel at ANY size you specify in millimeters — foam
 * board, acrylic sign, art print, table card. The longest edge normalizes
 * to the stage, so every size fills the default camera; the mm dimensions
 * set the aspect ratio and relative thickness. Front and back are live DOM.
 * No 3D asset files are loaded.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 *
 * ```tsx
 * <CustomPanel size={{ width: 600, height: 900, thickness: 5 }}>
 *   <CustomPanel.Front><YourArtwork /></CustomPanel.Front>
 *   <CustomPanel.Back><BackArtwork /></CustomPanel.Back>
 * </CustomPanel>
 * ```
 */
function CustomPanelImpl({
  children,
  size,
  color = '#f2f1ed',
  cornerRadius = 2,
  surfaceBackground = '#ffffff',
  resolution = CUSTOM_PANEL.resolution,
  interactive = true,
  dragToRotate = true,
  occlude = true,
  surfaceStyle,
  ...groupProps
}: CustomPanelProps) {
  const regions = collectSlots(children, CUSTOM_PANEL_REGIONS)
  const scale = customPanelScale(size)
  const w = size.width * scale
  const h = size.height * scale
  const t = Math.max(0.012, (size.thickness ?? CUSTOM_PANEL.thickness) * scale)
  const radius = Math.min(cornerRadius * scale, t / 2 - 0.001, 0.2)

  const bodyRef = React.useRef<THREE.Mesh>(null!)
  const occludeRefs = useScreenOccluders(bodyRef)

  const surfaceDefaults = {
    background: surfaceBackground,
    resolution,
    interactive,
    dragToRotate,
    style: surfaceStyle,
  }
  const faceProps = {
    width: w,
    height: h,
    radius: Math.max(radius, 0),
    occlude: occlude === true ? occludeRefs : occlude === 'blending' ? ('blending' as const) : undefined,
  }

  return (
    <group {...groupProps}>
      <RoundedBox ref={bodyRef} args={[w, h, t]} radius={Math.max(radius, 0.004)}>
        <meshPhysicalMaterial color={color} metalness={0} roughness={0.65} />
      </RoundedBox>

      <DeviceScreen
        {...faceProps}
        {...resolveSurface(regions.front, surfaceDefaults)}
        position={[0, 0, t / 2 + 0.003]}
      >
        {regions.front?.children}
      </DeviceScreen>
      {regions.back != null && (
        <DeviceScreen
          {...faceProps}
          {...resolveSurface(regions.back, surfaceDefaults)}
          position={[0, 0, -t / 2 - 0.003]}
          rotation={[0, Math.PI, 0]}
        >
          {regions.back.children}
        </DeviceScreen>
      )}
    </group>
  )
}
CustomPanelImpl.displayName = 'CustomPanel'

/** The panel's compound slots, shared by `<CustomPanel>` and `<CustomPanelMockup>`. */
export const customPanelSlots = createSlots(CUSTOM_PANEL_REGIONS)

export const CustomPanel = Object.assign(CustomPanelImpl, customPanelSlots)
