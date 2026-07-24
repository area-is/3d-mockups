import * as React from 'react'
import type * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { BROCHURE, BROCHURE_REGIONS, brochureSpec, type BrochureSize } from '@area-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { useScreenOccluders } from '../../screen/occluders'
import { collectSlots, createSlot, resolveSurface, type SlotProps, type SurfaceDefaults } from '../../slots'

type GroupProps = ThreeElements['group']

export interface BrochurePanelProps extends SlotProps {
  /**
   * Which face of the sheet this panel prints on: `front` (default) or
   * `back`. Panels fill left to right in document order — back panels left
   * to right as seen from BEHIND, matching how a real tri-fold is imposed.
   */
  side?: 'front' | 'back'
}

export interface BrochureProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Panel content: repeat `<Brochure.Panel>` left to right (up to three per
   * side; add `side="back"` for the reverse faces). Bare children are
   * shorthand for the first (left) front panel. Panels left out show bare
   * `color` stock; front panels default to `surfaceBackground`.
   */
  children?: React.ReactNode
  /**
   * One panel's physical size in millimeters, e.g.
   * `{ width: 99, height: 210 }` for an A4 tri-fold. Defaults to the US
   * letter Z-fold panel (93 x 216 mm).
   */
  size?: BrochureSize
  /** Zig-zag fold angle in degrees. `0` lays the sheet out flat. */
  foldAngle?: number
  /** Paper stock color of the panel backs and edges. */
  color?: string
  /**
   * How panel content hides when the brochure faces away from the camera.
   * `true` raycasts against the panels (fast, interactive). `'blending'` uses
   * per-pixel depth blending. `false` disables hiding.
   */
  occlude?: boolean | 'blending'
}

/**
 * A procedurally built standing tri-fold brochure: three letter-fold panels in
 * a zig-zag accordion, each one a live full-bleed DOM surface. Pass one node
 * as `children` for the front panel, or repeat `<Brochure.Panel>` for more.
 * No 3D asset files are loaded.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 *
 * ```tsx
 * <Brochure>
 *   <Brochure.Panel><Front /></Brochure.Panel>
 *   <Brochure.Panel><Middle /></Brochure.Panel>
 *   <Brochure.Panel side="back"><Back /></Brochure.Panel>
 * </Brochure>
 * ```
 */
function BrochureImpl({
  children,
  size,
  foldAngle = BROCHURE.foldAngle,
  color = '#f5f4f0',
  surfaceBackground = '#ffffff',
  resolution = BROCHURE.resolution,
  interactive = true,
  dragToRotate = true,
  occlude = true,
  surfaceStyle,
  ...groupProps
}: BrochureProps) {
  const paperColor = color
  const { panel } = React.useMemo(
    () => (size ? brochureSpec(size) : BROCHURE),
    [size?.width, size?.height]
  )
  const refs = [
    React.useRef<THREE.Mesh>(null!),
    React.useRef<THREE.Mesh>(null!),
    React.useRef<THREE.Mesh>(null!),
  ]
  const occludeRefs = useScreenOccluders(...refs)

  // Zig-zag accordion: panel yaws alternate +a, -a, +a, hinged edge to edge.
  // Chaining the hinges keeps every panel center on z = 0, so the brochure
  // rotates about its own visual center.
  const a = (foldAngle * Math.PI) / 180
  const yaws = [a, -a, a]
  const layout: { x: number; z: number; yaw: number }[] = []
  const creases: { x: number; z: number }[] = []
  let hinge = { x: (-3 * panel.width * Math.cos(a)) / 2, z: (panel.width * Math.sin(a)) / 2 }
  yaws.forEach((yaw, i) => {
    // each interior hinge (a panel's shared left edge) gets a fold crease
    if (i > 0) creases.push(hinge)
    const dir = { x: Math.cos(yaw), z: -Math.sin(yaw) }
    layout.push({ x: hinge.x + (dir.x * panel.width) / 2, z: hinge.z + (dir.z * panel.width) / 2, yaw })
    hinge = { x: hinge.x + dir.x * panel.width, z: hinge.z + dir.z * panel.width }
  })

  const panelSlots = (collectSlots(children, BROCHURE_REGIONS).panel ?? []) as BrochurePanelProps[]
  const fronts = panelSlots.filter((slot) => slot.side !== 'back')
  const backs = panelSlots.filter((slot) => slot.side === 'back')
  const content = [fronts[0], fronts[1], fronts[2]]
  // back faces, indexed so back panels read left-to-right when viewed from behind
  const backContent = [backs[2], backs[1], backs[0]]

  const surfaceDefaults = {
    background: surfaceBackground,
    resolution,
    interactive,
    dragToRotate,
    style: surfaceStyle,
  }
  const screenProps = {
    width: panel.width,
    height: panel.height,
    radius: panel.radius,
    occlude: occlude === true ? occludeRefs : occlude === 'blending' ? ('blending' as const) : undefined,
  }

  /**
   * Fake the paper's gentle bow with shading: each panel darkens toward its
   * receding hinge (a valley crease as seen from the front). Dead-flat evenly
   * lit facets are the giveaway of a CG fold.
   */
  const foldShade = (yaw: number): React.ReactNode =>
    foldAngle > 2 ? (
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 2147483647,
          background: `linear-gradient(${yaw > 0 ? 90 : 270}deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.13) 100%)`,
        }}
      />
    ) : undefined

  return (
    <group {...groupProps}>
      {/* fold creases: a thin paper-colored cylinder down each hinge line, so
          the folds read as continuous paper rather than butted boxes. The
          hinge positions come from the same chained layout as the panels, so
          they stay correct for any foldAngle. */}
      {creases.map(({ x, z }, i) => (
        <mesh key={`crease-${i}`} position={[x, 0, z]}>
          <cylinderGeometry args={[panel.thickness * 0.8, panel.thickness * 0.8, panel.height, 16]} />
          <meshPhysicalMaterial color={paperColor} metalness={0} roughness={0.85} />
        </mesh>
      ))}

      {layout.map(({ x, z, yaw }, i) => (
        <group key={i} position={[x, 0, z]} rotation-y={yaw}>
          {/* heavy paper stock — bare stock shows wherever a face is unprinted */}
          <mesh ref={refs[i]}>
            <boxGeometry args={[panel.width, panel.height, panel.thickness]} />
            <meshPhysicalMaterial color={paperColor} metalness={0} roughness={0.85} />
          </mesh>

          {/* the live panel: real DOM, CSS3D-transformed onto the front face */}
          <DeviceScreen
            {...screenProps}
            {...resolveSurface(content[i], surfaceDefaults)}
            position={[0, 0, panel.thickness / 2 + 0.003]}
            overlay={foldShade(yaw)}
          >
            {content[i]?.children}
          </DeviceScreen>

          {/* reverse side — only mounted when there's a design for it */}
          {backContent[i] != null && (
            <DeviceScreen
              {...screenProps}
              {...resolveSurface(backContent[i], surfaceDefaults)}
              position={[0, 0, -panel.thickness / 2 - 0.003]}
              rotation={[0, Math.PI, 0]}
              overlay={foldShade(-yaw)}
            >
              {backContent[i]?.children}
            </DeviceScreen>
          )}
        </group>
      ))}
    </group>
  )
}
BrochureImpl.displayName = 'Brochure'

/** The brochure's compound slots, shared by `<Brochure>` and `<BrochureMockup>`. */
export const brochureSlots = {
  Panel: createSlot<BrochurePanelProps>('panel', 'Panel'),
}

export const Brochure = Object.assign(BrochureImpl, brochureSlots)
