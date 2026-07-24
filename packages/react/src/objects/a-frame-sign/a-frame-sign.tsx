import * as React from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { A_FRAME_SIGN, A_FRAME_SIGN_REGIONS } from '@area-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { roundedRectShape } from '@area-mockups/core'
import { useScreenOccluders } from '../../screen/occluders'
import { collectSlots, createSlots, resolveSurface, type SurfaceDefaults } from '../../slots'

type GroupProps = ThreeElements['group']

export interface AFrameSignProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Panel content. Bare children fill the front panel; name panels explicitly
   * with `<AFrameSign.Front>` and `<AFrameSign.Back>`.
   */
  children?: React.ReactNode
  /** Frame color — classic dark-stained wood by default. */
  color?: string
  /**
   * How panel content hides when that panel turns away from the camera.
   * `true` raycasts against the panels (fast, interactive). `'blending'` uses
   * per-pixel depth blending. `false` disables hiding.
   */
  occlude?: boolean | 'blending'
}

/**
 * A procedurally built sidewalk A-frame sandwich board: two wood-framed
 * 600 x 900 mm panels hinged near the corners and splayed into an A, held by
 * webbing straps at mid-height, standing on four leg tips — both sides live
 * DOM: chalk menus, sale boards, open/closed signs. No 3D asset files are
 * loaded.
 *
 * The origin is mid-height between the panels; the pavement sits at the leg
 * bottoms. Must be rendered inside a react-three-fiber `<Canvas>` (or
 * `<MockupCanvas>`).
 *
 * ```tsx
 * <AFrameSign>
 *   <AFrameSign.Front><MenuBoard /></AFrameSign.Front>
 *   <AFrameSign.Back><HoursBoard /></AFrameSign.Back>
 * </AFrameSign>
 * ```
 */
function AFrameSignImpl({
  children,
  color = '#4a3826',
  surfaceBackground = '#20241f',
  resolution = A_FRAME_SIGN.resolution,
  interactive = true,
  dragToRotate = true,
  occlude = true,
  surfaceStyle,
  ...groupProps
}: AFrameSignProps) {
  const regions = collectSlots(children, A_FRAME_SIGN_REGIONS)
  const { panel, face, splayAngle } = A_FRAME_SIGN
  const frontRef = React.useRef<THREE.Mesh>(null!)
  const backRef = React.useRef<THREE.Mesh>(null!)
  const occludeRefs = useScreenOccluders(frontRef, backRef)

  const frameGeometry = React.useMemo(() => {
    const shape = roundedRectShape(panel.width, panel.height, 0.03)
    shape.holes.push(roundedRectShape(face.width, face.height, face.radius))
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: panel.frameDepth - 0.02,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 2,
      curveSegments: 8,
    })
    geometry.translate(0, 0, -(panel.frameDepth - 0.02) / 2)
    return geometry
  }, [panel, face])

  const boardGeometry = React.useMemo(
    () => new THREE.ShapeGeometry(roundedRectShape(face.width + 0.1, face.height + 0.1, face.radius), 8),
    [face]
  )

  React.useEffect(() => {
    return () => {
      frameGeometry.dispose()
      boardGeometry.dispose()
    }
  }, [frameGeometry, boardGeometry])

  const tilt = (splayAngle * Math.PI) / 180
  // hinge at the top: panels pivot about their top edge
  const topY = (panel.height / 2) * Math.cos(tilt)
  // the frame stiles run ~40 mm past the panel bottom so the board stands on
  // four leg tips; lifting the whole sign by the same drop keeps the leg tips
  // on the original pavement line
  const legDrop = 0.143
  const legLift = legDrop * Math.cos(tilt)
  const surfaceDefaults = {
    background: surfaceBackground,
    resolution,
    interactive,
    dragToRotate,
    style: surfaceStyle,
  }
  const screenProps = {
    width: face.width,
    height: face.height,
    radius: face.radius,
    occlude: occlude === true ? occludeRefs : occlude === 'blending' ? ('blending' as const) : undefined,
  }

  return (
    <group {...groupProps}>
      {([-1, 1] as const).map((dir) => {
        // dir -1 leans toward the viewer (the front face); tops meet at the
        // hinge and bottoms splay apart into the A stance
        const isFront = dir === -1
        const slot = isFront ? regions.front : regions.back
        return (
          <group
            key={dir}
            position={[0, legLift, -dir * (panel.height / 2) * Math.sin(tilt)]}
            rotation-x={dir * tilt}
          >
            {/* wood frame with a true opening */}
            <mesh ref={isFront ? frontRef : backRef} geometry={frameGeometry} rotation-y={isFront ? 0 : Math.PI}>
              <meshPhysicalMaterial color={color} metalness={0} roughness={0.75} />
            </mesh>
            {/* board behind the opening */}
            <mesh geometry={boardGeometry} rotation-y={isFront ? 0 : Math.PI} position-z={isFront ? -0.012 : 0.012}>
              <meshPhysicalMaterial color="#181b17" metalness={0} roughness={0.95} />
            </mesh>
            {/* frame stiles extended past the bottom rail into four leg tips */}
            {([1, -1] as const).map((side) => (
              <mesh
                key={side}
                position={[side * (panel.width / 2 - panel.frameWidth / 2), -panel.height / 2 - legDrop / 2 + 0.05, 0]}
              >
                <boxGeometry args={[panel.frameWidth, legDrop + 0.1, panel.frameDepth - 0.02]} />
                <meshPhysicalMaterial color={color} metalness={0} roughness={0.75} />
              </mesh>
            ))}

            {/* live face */}
            <DeviceScreen
              {...screenProps}
              {...resolveSurface(slot, surfaceDefaults)}
              position={[0, 0, isFront ? panel.frameDepth / 2 - 0.02 : -(panel.frameDepth / 2 - 0.02)]}
              rotation={isFront ? [0, 0, 0] : [0, Math.PI, 0]}
            >
              {slot?.children}
            </DeviceScreen>
          </group>
        )
      })}

      {/* hinge blocks (~80 mm) near the ends — the center gap is the carry-handle area */}
      {([1, -1] as const).map((side) => (
        <mesh key={side} rotation-z={Math.PI / 2} position={[side * (panel.width / 2 - 0.35), legLift + topY + 0.02, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.286, 12]} />
          <meshPhysicalMaterial color="#8f949c" metalness={0.9} roughness={0.35} />
        </mesh>
      ))}

      {/* restraint straps at mid-height: dark webbing on each side, bolted to
          the frame stiles and spanning the panels' inner faces to hold the splay */}
      {([1, -1] as const).map((side) => (
        <mesh key={side} position={[side * (panel.width / 2 - panel.frameWidth / 2), legLift, 0]}>
          <boxGeometry args={[0.02, 0.13, panel.height * Math.sin(tilt) - panel.frameDepth + 0.06]} />
          <meshPhysicalMaterial color="#1c1e21" metalness={0} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}
AFrameSignImpl.displayName = 'AFrameSign'

/** The sign's compound slots, shared by `<AFrameSign>` and `<AFrameSignMockup>`. */
export const aFrameSignSlots = createSlots(A_FRAME_SIGN_REGIONS)

export const AFrameSign = Object.assign(AFrameSignImpl, aFrameSignSlots)
