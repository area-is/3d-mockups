import * as React from 'react'
import type * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { GREETING_CARD, GREETING_CARD_REGIONS } from '@area-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { useScreenOccluders } from '../../screen/occluders'
import { collectSlots, createSlots, resolveSurface, type SurfaceDefaults } from '../../slots'

type GroupProps = ThreeElements['group']

export interface GreetingCardProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Face content. Bare children fill the front cover; name faces explicitly
   * with `<GreetingCard.Front>`, `<GreetingCard.InsideLeft>`,
   * `<GreetingCard.InsideRight>` and `<GreetingCard.Back>` (the left outer
   * face). Orbit around to see the inside spread.
   */
  children?: React.ReactNode
  /** Opening angle in degrees between the panels. `180` lays the card flat. */
  openAngle?: number
  /** Card stock color — edges and unprinted faces. */
  color?: string
  /**
   * How face content hides when that face turns away from the camera.
   * `true` raycasts against the panels (fast, interactive). `'blending'` uses
   * per-pixel depth blending. `false` disables hiding.
   */
  occlude?: boolean | 'blending'
}

/**
 * A procedurally built A7 greeting card standing like a tent, fold toward
 * the viewer: the front and back covers face outward, and the inside spread
 * lives on the reverse — all four faces are live DOM. No 3D asset files are
 * loaded.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 *
 * ```tsx
 * <GreetingCard>
 *   <GreetingCard.Front><Cover /></GreetingCard.Front>
 *   <GreetingCard.InsideLeft><Note /></GreetingCard.InsideLeft>
 *   <GreetingCard.InsideRight><Art /></GreetingCard.InsideRight>
 * </GreetingCard>
 * ```
 */
function GreetingCardImpl({
  children,
  openAngle = GREETING_CARD.openAngle,
  color = '#f6f3ec',
  surfaceBackground = '#ffffff',
  resolution = GREETING_CARD.resolution,
  interactive = true,
  dragToRotate = true,
  occlude = true,
  surfaceStyle,
  ...groupProps
}: GreetingCardProps) {
  const regions = collectSlots(children, GREETING_CARD_REGIONS)
  const { panel } = GREETING_CARD
  const leftRef = React.useRef<THREE.Mesh>(null!)
  const rightRef = React.useRef<THREE.Mesh>(null!)
  const occludeRefs = useScreenOccluders(leftRef, rightRef)

  // Tent pose with the fold toward the viewer: the panels yaw ∓a around the
  // shared spine, keeping the card centered on the group origin.
  const a = ((180 - openAngle) / 2) * (Math.PI / 180)
  const half = panel.width / 2
  const spineZ = (half * Math.sin(a)) / 1
  const panels = [
    // left panel (back cover outward)
    { x: -half * Math.cos(a), z: spineZ - half * Math.sin(a), yaw: -a, ref: leftRef, outer: regions.back, inner: regions.insideRight },
    // right panel (front cover outward)
    { x: half * Math.cos(a), z: spineZ - half * Math.sin(a), yaw: a, ref: rightRef, outer: regions.front, inner: regions.insideLeft },
  ]

  // paper bows into the crease: darken each face gently toward the spine
  const creaseShade = (side: 'left' | 'right'): React.ReactNode => (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 2147483647,
        background: `linear-gradient(${side === 'left' ? 270 : 90}deg, rgba(0,0,0,0) 62%, rgba(0,0,0,0.1) 100%)`,
      }}
    />
  )

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

  return (
    <group {...groupProps}>
      {/* rounded crease: a slim stock-colored cylinder bridging the panels at
          the fold, so the spine reads as continuous paper rather than a seam */}
      <mesh position={[0, 0, spineZ]}>
        <cylinderGeometry args={[0.022, 0.022, panel.height, 24]} />
        <meshPhysicalMaterial color={color} metalness={0} roughness={0.85} />
      </mesh>

      {panels.map(({ x, z, yaw, ref, outer, inner }, i) => (
        <group key={i} position={[x, 0, z]} rotation-y={yaw}>
          {/* heavy card stock */}
          <mesh ref={ref}>
            <boxGeometry args={[panel.width, panel.height, panel.thickness]} />
            <meshPhysicalMaterial color={color} metalness={0} roughness={0.85} />
          </mesh>

          {/* outward face (front or back cover) */}
          {outer != null && (
            <DeviceScreen
              {...screenProps}
              {...resolveSurface(outer, surfaceDefaults)}
              position={[0, 0, panel.thickness / 2 + 0.003]}
              overlay={creaseShade(i === 0 ? 'right' : 'left')}
            >
              {outer.children}
            </DeviceScreen>
          )}

          {/* inside-spread face */}
          {inner != null && (
            <DeviceScreen
              {...screenProps}
              {...resolveSurface(inner, surfaceDefaults)}
              position={[0, 0, -panel.thickness / 2 - 0.003]}
              rotation={[0, Math.PI, 0]}
              overlay={creaseShade(i === 0 ? 'left' : 'right')}
            >
              {inner.children}
            </DeviceScreen>
          )}
        </group>
      ))}
    </group>
  )
}
GreetingCardImpl.displayName = 'GreetingCard'

/** The card's compound slots, shared by `<GreetingCard>` and `<GreetingCardMockup>`. */
export const greetingCardSlots = createSlots(GREETING_CARD_REGIONS)

export const GreetingCard = Object.assign(GreetingCardImpl, greetingCardSlots)
