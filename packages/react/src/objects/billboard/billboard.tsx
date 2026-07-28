import * as React from 'react'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { BILLBOARD, BILLBOARD_REGIONS } from '@area-3d-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { collectSlots, createSlots, resolveSurface, type SurfaceProps } from '../../slots'

type GroupProps = ThreeElements['group']

export interface BillboardProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceProps {
  /**
   * The creative - any React node. It fills the whole face, full bleed;
   * wrap in `<Billboard.Face>` to set per-surface props.
   */
  children?: React.ReactNode
  /** Steel color (panel, pole, catwalk, light fixtures). */
  color?: string
}

/**
 * A procedurally built highway bulletin: a 14' x 48' live face on a steel
 * panel, monopole column with foundation collar, maintenance catwalk with a
 * railing, and gooseneck floodlights along the top edge. No 3D asset files
 * are loaded.
 *
 * The group origin is the face center; the ground sits
 * `BILLBOARD.standHeight` below it. Must be rendered inside a
 * react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 *
 * ```tsx
 * <Billboard rotation={[0, -0.2, 0]}>
 *   <Billboard.Face><YourCreative /></Billboard.Face>
 * </Billboard>
 * ```
 */
function BillboardImpl({
  children,
  color = '#2c313a',
  surfaceBackground = '#ffffff',
  resolution = BILLBOARD.resolution,
  surfaceStyle,
  ...groupProps
}: BillboardProps) {
  const faceSlot = collectSlots(children, BILLBOARD_REGIONS).face
  const { face, panel, apron, standHeight, pole, catwalk, lights } = BILLBOARD

  const panelTop = panel.height / 2
  const apronCenterY = -panelTop - apron.height / 2 + 0.02
  const steel = { color, metalness: 0.6, roughness: 0.45 }

  // The access ladder and the gap it is held off the pole in. The pole's skin
  // curves away from its centerline, so the bracket at a rail has further to
  // reach than one at the middle would: measure to the skin AT the rail's x,
  // then bury the end a little inside it so no seam opens up at any angle.
  const poleZ = -pole.radius - panel.depth / 2 - 0.02
  const ladder = React.useMemo(() => {
    const railX = 0.11
    const z = poleZ - pole.radius - 0.055
    const skinZ = poleZ - Math.sqrt(Math.max(0, pole.radius ** 2 - railX ** 2))
    return { railX, z, rungs: 12, standoff: skinZ - z + 0.02 }
  }, [poleZ, pole.radius])
  const rungY = (i: number) =>
    -standHeight + 0.35 + i * ((standHeight + apronCenterY - 0.5) / (ladder.rungs - 1))

  return (
    <group {...groupProps}>
      {/* steel face panel with trim lip */}
      <RoundedBox args={[panel.width, panel.height, panel.depth]} radius={panel.radius}>
        <meshPhysicalMaterial {...steel} />
      </RoundedBox>

      {/* torsion box + slatted apron skirt flush under the face - the
          structural band the pole actually connects to */}
      <RoundedBox args={[apron.width, apron.height, apron.depth]} radius={0.02} position={[0, apronCenterY, -0.04]}>
        <meshPhysicalMaterial {...steel} roughness={0.55} />
      </RoundedBox>
      {Array.from({ length: 13 }, (_, i) => (
        <mesh key={i} position={[(i - 6) * (apron.width / 13.4), apronCenterY, apron.depth / 2 - 0.028]}>
          <boxGeometry args={[0.02, apron.height - 0.06, 0.02]} />
          <meshPhysicalMaterial {...steel} roughness={0.65} />
        </mesh>
      ))}

      {/* monopole rising into the apron, and the foundation collar */}
      <mesh position={[0, (apronCenterY - standHeight) / 2, poleZ]}>
        <cylinderGeometry args={[pole.radius, pole.radius, standHeight + apronCenterY + 0.2, 24]} />
        <meshPhysicalMaterial {...steel} />
      </mesh>
      <mesh position={[0, apronCenterY, -panel.depth / 2 - pole.radius / 2]}>
        <boxGeometry args={[0.6, apron.height - 0.08, pole.radius + 0.1]} />
        <meshPhysicalMaterial {...steel} />
      </mesh>
      <mesh position={[0, -standHeight + pole.collarHeight / 2, poleZ]}>
        <cylinderGeometry args={[pole.collarRadius, pole.collarRadius, pole.collarHeight, 24]} />
        <meshPhysicalMaterial {...steel} roughness={0.7} />
      </mesh>

      {/* maintenance catwalk hung off the apron front, with a guardrail */}
      <group position={[0, apronCenterY + apron.height / 2 - catwalk.drop - 0.14, apron.depth / 2 - 0.04 + catwalk.depth / 2]}>
        <mesh>
          <boxGeometry args={[catwalk.width, catwalk.thickness, catwalk.depth]} />
          <meshPhysicalMaterial {...steel} roughness={0.6} />
        </mesh>
        <mesh position={[0, catwalk.railHeight, catwalk.depth / 2 - 0.02]}>
          <boxGeometry args={[catwalk.width, 0.025, 0.025]} />
          <meshPhysicalMaterial {...steel} />
        </mesh>
        <mesh position={[0, catwalk.railHeight * 0.55, catwalk.depth / 2 - 0.02]}>
          <boxGeometry args={[catwalk.width, 0.018, 0.018]} />
          <meshPhysicalMaterial {...steel} />
        </mesh>
        {Array.from({ length: catwalk.posts }, (_, i) => (
          <mesh
            key={i}
            position={[
              (i - (catwalk.posts - 1) / 2) * ((catwalk.width - 0.1) / (catwalk.posts - 1)),
              catwalk.railHeight / 2,
              catwalk.depth / 2 - 0.02,
            ]}
          >
            <boxGeometry args={[0.025, catwalk.railHeight, 0.025]} />
            <meshPhysicalMaterial {...steel} />
          </mesh>
        ))}
      </group>

      {/* floodlights on the catwalk edge, aimed up at the face - classic
          bulletins are bottom-lit from the walkway, not top-lit */}
      {Array.from({ length: lights.count }, (_, i) => {
        const x = (i - (lights.count - 1) / 2) * (face.width / lights.count) * 0.82
        const fixtureY = apronCenterY + apron.height / 2 - catwalk.drop - 0.14 + 0.05
        const fixtureZ = apron.depth / 2 - 0.04 + catwalk.depth - 0.06
        return (
          <group key={i} position={[x, fixtureY, fixtureZ]}>
            <mesh position={[0, 0.07, 0]}>
              <boxGeometry args={[0.03, 0.14, 0.03]} />
              <meshPhysicalMaterial {...steel} />
            </mesh>
            <group position={[0, 0.16, 0]} rotation-x={0.72}>
              <mesh>
                <cylinderGeometry args={[lights.radius, lights.radius * 0.72, 0.15, 16]} />
                <meshPhysicalMaterial {...steel} roughness={0.35} />
              </mesh>
              <mesh position-y={0.078}>
                <cylinderGeometry args={[lights.radius * 0.8, lights.radius * 0.8, 0.01, 16]} />
                <meshPhysicalMaterial color="#fdf6dd" emissive="#ffedb8" emissiveIntensity={0.9} />
              </mesh>
            </group>
          </group>
        )
      })}

      {/* torsion tube behind the face - the heavy member the pole tees into */}
      <mesh rotation-z={Math.PI / 2} position={[0, apronCenterY, -panel.depth / 2 - pole.radius]}>
        <cylinderGeometry args={[pole.radius * 0.72, pole.radius * 0.72, panel.width * 0.7, 18]} />
        <meshPhysicalMaterial {...steel} roughness={0.55} />
      </mesh>

      {/* fixed access ladder up the rear of the pole, bolted on with
          standoff brackets - a fixed ladder is held clear of the structure
          so a climber's boots have somewhere to go, but it is BOLTED to it,
          not floating beside it */}
      <group position={[0, 0, ladder.z]}>
        {([1, -1] as const).map((s) => (
          <mesh key={s} position={[s * ladder.railX, (apronCenterY - standHeight) / 2 + 0.1, 0]}>
            <boxGeometry args={[0.022, standHeight + apronCenterY - 0.1, 0.022]} />
            <meshPhysicalMaterial {...steel} />
          </mesh>
        ))}
        {Array.from({ length: ladder.rungs }, (_, i) => (
          <mesh key={i} rotation-z={Math.PI / 2} position={[0, rungY(i), 0]}>
            <cylinderGeometry args={[0.011, 0.011, 0.22, 8]} />
            <meshPhysicalMaterial {...steel} />
          </mesh>
        ))}
        {/* the brackets: one pair every third rung, each running from the
            rail into the pole's skin so the two read as one assembly */}
        {[0, 3, 6, 9, 11].map((i) =>
          ([1, -1] as const).map((s) => (
            <mesh
              key={`${i}:${s}`}
              position={[s * ladder.railX, rungY(i), ladder.standoff / 2]}
            >
              <boxGeometry args={[0.016, 0.016, ladder.standoff]} />
              <meshPhysicalMaterial {...steel} roughness={0.55} />
            </mesh>
          ))
        )}
      </group>

      {/* the live face: real DOM, CSS3D-transformed onto the vinyl */}
      <DeviceScreen
        width={face.width}
        height={face.height}
        radius={face.radius}
        position={[0, 0, panel.depth / 2 + 0.006]}
        {...resolveSurface(faceSlot, {
          surfaceBackground,
          resolution,
          surfaceStyle,
        })}
      >
        {faceSlot?.children}
      </DeviceScreen>
    </group>
  )
}
BillboardImpl.displayName = 'Billboard'

/** The bulletin's compound slots, shared by `<Billboard>` and `<BillboardMockup>`. */
export const billboardSlots = createSlots(BILLBOARD_REGIONS)

export const Billboard = Object.assign(BillboardImpl, billboardSlots)
