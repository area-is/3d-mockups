import * as React from 'react'
import type * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { SEMI_TRAILER, SEMI_TRAILER_REGIONS } from '@area-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { useScreenOccluders } from '../../screen/occluders'
import { collectSlots, createSlots, resolveSurface, type SurfaceDefaults } from '../../slots'

type GroupProps = ThreeElements['group']

export interface SemiTrailerProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Wrap content. Bare children fill the curb-side (+Z) panel; name panels
   * explicitly with `<SemiTrailer.CurbSide>`, `<SemiTrailer.StreetSide>` and
   * `<SemiTrailer.Rear>` (the rear-door panel, between the lock rods).
   */
  children?: React.ReactNode
  /** Box paint. Wrap trailers are usually white. */
  color?: string
  /** Side-skirt paint. Defaults to the box `color`. */
  skirtColor?: string
  /**
   * How wrap content hides when the trailer faces away from the camera.
   * `true` raycasts against the box (fast, interactive). `'blending'` uses
   * per-pixel depth blending. `false` disables hiding.
   */
  occlude?: boolean | 'blending'
}

/**
 * A procedurally built 53 ft dry-van semi trailer, parked on its landing
 * gear: smooth wrap-ready sides, tandem rear axles, side skirts, ICC bumper,
 * lock-rod rear doors, mudflaps, and DOT reflective tape along the bottom
 * rail. Both sides and the rear doors are live DOM. No 3D asset files are
 * loaded.
 *
 * The origin is the box center; the road sits `SEMI_TRAILER.groundY` below
 * it. Must be rendered inside a react-three-fiber `<Canvas>` (or
 * `<MockupCanvas>`).
 *
 * ```tsx
 * <SemiTrailer>
 *   <YourWrap />
 *   <SemiTrailer.Rear><RearDoors /></SemiTrailer.Rear>
 * </SemiTrailer>
 * ```
 */
function SemiTrailerImpl({
  children,
  color = '#eef0f2',
  skirtColor,
  surfaceBackground = '#ffffff',
  resolution = SEMI_TRAILER.resolution,
  interactive = true,
  dragToRotate = true,
  occlude = true,
  surfaceStyle,
  ...groupProps
}: SemiTrailerProps) {
  const regions = collectSlots(children, SEMI_TRAILER_REGIONS)
  const { body, groundY, wheels, landingGear, side, rear: rearSpec } = SEMI_TRAILER
  const boxRef = React.useRef<THREE.Mesh>(null!)
  const occludeRefs = useScreenOccluders(boxRef)

  const steel = { color: '#1d2025', metalness: 0.4, roughness: 0.6 }
  const floorY = -body.height / 2
  // dual tire pair per side: outer tire face tucked just inside the box side
  const dualOuterZ = body.width / 2 - 0.03 - wheels.width / 2
  const dualInnerZ = dualOuterZ - wheels.width - wheels.dualGap

  const surfaceDefaults = { background: surfaceBackground, interactive, dragToRotate, style: surfaceStyle }
  const wrapProps = {
    occlude: occlude === true ? occludeRefs : occlude === 'blending' ? ('blending' as const) : undefined,
  }

  return (
    <group {...groupProps}>
      {/* the box — smooth-sided, wrap-ready */}
      <RoundedBox ref={boxRef} args={[body.length, body.height, body.width]} radius={body.radius}>
        <meshPhysicalMaterial color={color} metalness={0.3} roughness={0.4} clearcoat={0.6} clearcoatRoughness={0.3} />
      </RoundedBox>

      {/* underbody frame, kingpin apron and pin, side skirts */}
      <mesh position={[0, floorY - 0.055, 0]}>
        <boxGeometry args={[body.length - 0.2, 0.11, body.width - 0.16]} />
        <meshPhysicalMaterial color="#0d0e11" metalness={0.1} roughness={0.95} />
      </mesh>
      {/* apron plate spans most of the front 1.2 m of the underside */}
      <mesh position={[2.98, floorY - 0.135, 0]}>
        <boxGeometry args={[0.48, 0.05, 0.84]} />
        <meshPhysicalMaterial {...steel} />
      </mesh>
      {/* the 2" (50.8 mm) fifth-wheel kingpin stub below the apron */}
      <mesh position={[2.85, floorY - 0.176, 0]}>
        <cylinderGeometry args={[0.0102, 0.0102, 0.032, 12]} />
        <meshPhysicalMaterial {...steel} />
      </mesh>
      {/* aero side skirts: thin composite panels (~12 mm), paintable
          separately from the box */}
      {([1, -1] as const).map((s) => (
        <mesh key={s} position={[0.1, floorY - 0.24, s * (body.width / 2 - 0.03)]}>
          <boxGeometry args={[3.2, 0.36, 0.012]} />
          <meshPhysicalMaterial color={skirtColor ?? color} metalness={0.3} roughness={0.5} />
        </mesh>
      ))}

      {/* amber front markers, white inverted-L conspicuity at the rear corners */}
      {([1, -1] as const).map((s) => (
        <mesh key={s} position={[body.length / 2 - 0.06, 0.5, s * (body.width / 2 + 0.002)]}>
          <planeGeometry args={[0.08, 0.045]} />
          <meshPhysicalMaterial color="#f2a33c" emissive="#ffb340" emissiveIntensity={0.4} roughness={0.3} side={2} />
        </mesh>
      ))}
      {([1, -1] as const).map((s) => (
        <group key={s}>
          <mesh position={[-body.length / 2 - 0.002, 0.42, s * 0.47]} rotation-y={-Math.PI / 2}>
            <planeGeometry args={[0.05, 0.26]} />
            <meshPhysicalMaterial color="#e8ecf2" emissive="#f4f7fb" emissiveIntensity={0.25} roughness={0.3} side={2} />
          </mesh>
          <mesh position={[-body.length / 2 - 0.002, 0.53, s * 0.37]} rotation-y={-Math.PI / 2}>
            <planeGeometry args={[0.26, 0.05]} />
            <meshPhysicalMaterial color="#e8ecf2" emissive="#f4f7fb" emissiveIntensity={0.25} roughness={0.3} side={2} />
          </mesh>
        </group>
      ))}

      {/* DOT reflective tape along both bottom rails — ≥50% length coverage */}
      {([1, -1] as const).map((s) =>
        Array.from({ length: 20 }, (_, i) => (
          <mesh key={`${s}${i}`} position={[-body.length / 2 + 0.5 + i * 0.29, floorY + 0.045, s * (body.width / 2 + 0.002)]}>
            <planeGeometry args={[0.17, 0.045]} />
            <meshPhysicalMaterial
              color={i % 2 ? '#c8ccd2' : '#a01822'}
              emissive={i % 2 ? '#e8ecf2' : '#c01a28'}
              emissiveIntensity={0.25}
              roughness={0.3}
              side={2}
            />
          </mesh>
        ))
      )}

      {/* tandem axles: bogie, axles, dual wheels, mudflaps */}
      <mesh position={[(wheels.axles[0] + wheels.axles[1]) / 2, floorY - 0.22, 0]}>
        <boxGeometry args={[1.15, 0.3, 0.8]} />
        <meshPhysicalMaterial {...steel} />
      </mesh>
      {wheels.axles.map((x) => (
        <group key={x}>
          <mesh rotation-x={Math.PI / 2} position={[x, wheels.centerY, 0]}>
            <cylinderGeometry args={[0.045, 0.045, body.width - 0.2, 10]} />
            <meshPhysicalMaterial {...steel} />
          </mesh>
          {/* dual tire pair per side; rim and protruding hub on the outer */}
          {([1, -1] as const).map((s) => (
            <group key={s} position={[x, wheels.centerY, 0]}>
              {[dualOuterZ, dualInnerZ].map((z) => (
                <mesh key={z} rotation-x={Math.PI / 2} position={[0, 0, s * z]}>
                  <cylinderGeometry args={[wheels.radius, wheels.radius, wheels.width, 24]} />
                  <meshPhysicalMaterial color="#15161a" metalness={0} roughness={0.95} />
                </mesh>
              ))}
              <mesh rotation-x={Math.PI / 2} position={[0, 0, s * dualOuterZ]}>
                <cylinderGeometry args={[0.115, 0.115, wheels.width + 0.006, 20]} />
                <meshPhysicalMaterial color="#c6cad1" metalness={0.85} roughness={0.35} />
              </mesh>
              <mesh rotation-x={Math.PI / 2} position={[0, 0, s * (dualOuterZ + wheels.width / 2 + 0.012)]}>
                <cylinderGeometry args={[0.05, 0.05, 0.035, 16]} />
                <meshPhysicalMaterial color="#3c4046" metalness={0.7} roughness={0.4} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      {([1, -1] as const).map((s) => (
        <mesh key={s} position={[wheels.axles[1] - 0.32, groundY + 0.14, s * ((dualOuterZ + dualInnerZ) / 2)]}>
          <boxGeometry args={[0.02, 0.26, 0.3]} />
          <meshPhysicalMaterial color="#0d0e11" metalness={0} roughness={0.95} />
        </mesh>
      ))}

      {/* landing gear: legs, cross brace, foot pads */}
      {([1, -1] as const).map((s) => (
        <group key={s} position={[landingGear.x, 0, s * landingGear.spread]}>
          <mesh position={[0, (floorY - 0.11 + groundY + 0.02) / 2, 0]}>
            <boxGeometry args={[0.08, floorY - 0.11 - groundY - 0.02, 0.08]} />
            <meshPhysicalMaterial {...steel} />
          </mesh>
          <mesh position={[0, groundY + 0.02, 0]}>
            <boxGeometry args={[0.17, 0.04, 0.17]} />
            <meshPhysicalMaterial {...steel} />
          </mesh>
        </group>
      ))}
      <mesh rotation-x={Math.PI / 2} position={[landingGear.x, groundY + 0.28, 0]}>
        <cylinderGeometry args={[0.02, 0.02, landingGear.spread * 2, 8]} />
        <meshPhysicalMaterial {...steel} />
      </mesh>
      {/* landing gear crank handle on the curb side: shaft, arm, grip */}
      <group position={[landingGear.x, -0.78, landingGear.spread]}>
        <mesh rotation-x={Math.PI / 2} position={[0, 0, 0.09]}>
          <cylinderGeometry args={[0.011, 0.011, 0.14, 8]} />
          <meshPhysicalMaterial {...steel} />
        </mesh>
        <mesh position={[0, 0.04, 0.16]}>
          <boxGeometry args={[0.016, 0.08, 0.016]} />
          <meshPhysicalMaterial {...steel} />
        </mesh>
        <mesh rotation-x={Math.PI / 2} position={[0, 0.08, 0.19]}>
          <cylinderGeometry args={[0.009, 0.009, 0.06, 8]} />
          <meshPhysicalMaterial {...steel} />
        </mesh>
      </group>

      {/* rear: ICC bumper (full-width horizontal, verticals tied up to the
          underbody frame) and door lock rods */}
      <mesh position={[-body.length / 2 + 0.02, groundY + 0.2, 0]}>
        <boxGeometry args={[0.05, 0.05, 0.965]} />
        <meshPhysicalMaterial {...steel} />
      </mesh>
      {([1, -1] as const).map((s) => (
        <mesh key={s} position={[-body.length / 2 + 0.03, (groundY + 0.2 + floorY - 0.11) / 2, s * 0.3]}>
          <boxGeometry args={[0.04, floorY - 0.11 - (groundY + 0.2), 0.045]} />
          <meshPhysicalMaterial {...steel} />
        </mesh>
      ))}
      {/* red/white conspicuity segments on the ICC bumper's rear face */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[-body.length / 2 - 0.007, groundY + 0.2, -0.4 + i * 0.16]} rotation-y={-Math.PI / 2}>
          <planeGeometry args={[0.13, 0.04]} />
          <meshPhysicalMaterial
            color={i % 2 ? '#c8ccd2' : '#a01822'}
            emissive={i % 2 ? '#e8ecf2' : '#c01a28'}
            emissiveIntensity={0.25}
            roughness={0.3}
            side={2}
          />
        </mesh>
      ))}
      {/* full-width rear conspicuity tape at bumper-rail height, below the
          rear DeviceScreen's bottom edge */}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[-body.length / 2 - 0.002, floorY + 0.045, -0.42 + i * 0.14]} rotation-y={-Math.PI / 2}>
          <planeGeometry args={[0.12, 0.045]} />
          <meshPhysicalMaterial
            color={i % 2 ? '#c8ccd2' : '#a01822'}
            emissive={i % 2 ? '#e8ecf2' : '#c01a28'}
            emissiveIntensity={0.25}
            roughness={0.3}
            side={2}
          />
        </mesh>
      ))}

      {/* rear frame: corner posts with hinge blocks, header beam across the
          top — all clear of the rear DeviceScreen (its half-width is 0.45) */}
      {([1, -1] as const).map((s) => (
        <group key={s}>
          <mesh position={[-body.length / 2 - 0.012, 0, s * (body.width / 2 - 0.022)]}>
            <boxGeometry args={[0.045, body.height, 0.044]} />
            <meshPhysicalMaterial {...steel} />
          </mesh>
          {[-0.44, -0.15, 0.14, 0.43].map((y) => (
            <mesh key={y} position={[-body.length / 2 - 0.042, y, s * (body.width / 2 - 0.022)]}>
              <boxGeometry args={[0.022, 0.05, 0.055]} />
              <meshPhysicalMaterial {...steel} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[-body.length / 2 - 0.012, body.height / 2 - 0.0175, 0]}>
        <boxGeometry args={[0.045, 0.035, body.width]} />
        <meshPhysicalMaterial {...steel} />
      </mesh>
      {/* three red identification lamps centered on the header beam */}
      {[-0.07, 0, 0.07].map((z) => (
        <mesh key={z} position={[-body.length / 2 - 0.036, body.height / 2 - 0.0175, z]} rotation-y={-Math.PI / 2}>
          <planeGeometry args={[0.045, 0.025]} />
          <meshPhysicalMaterial color="#8c1524" emissive="#c11a30" emissiveIntensity={0.45} roughness={0.3} side={2} />
        </mesh>
      ))}
      {/* red clearance lamps at the upper rear corners */}
      {([1, -1] as const).map((s) => (
        <mesh key={s} position={[-body.length / 2 - 0.036, 0.5, s * (body.width / 2 - 0.022)]} rotation-y={-Math.PI / 2}>
          <planeGeometry args={[0.04, 0.025]} />
          <meshPhysicalMaterial color="#8c1524" emissive="#c11a30" emissiveIntensity={0.45} roughness={0.3} side={2} />
        </mesh>
      ))}
      {([0.24, -0.24, 0.44, -0.44] as const).map((z) => (
        <mesh key={z} rotation-x={0} position={[-body.length / 2 - 0.012, 0, z]}>
          <cylinderGeometry args={[0.013, 0.013, body.height - 0.08, 8]} />
          <meshPhysicalMaterial color="#c6cad1" metalness={0.85} roughness={0.35} />
        </mesh>
      ))}

      {/* the live wraps: both smooth sides and the rear doors */}
      <DeviceScreen
        {...wrapProps}
        {...resolveSurface(regions.curbSide, { ...surfaceDefaults, resolution })}
        width={side.width}
        height={side.height}
        radius={side.radius}
        position={[0, 0.02, body.width / 2 + 0.006]}
      >
        {regions.curbSide?.children}
      </DeviceScreen>
      {regions.streetSide != null && (
        <DeviceScreen
          {...wrapProps}
          {...resolveSurface(regions.streetSide, { ...surfaceDefaults, resolution })}
          width={side.width}
          height={side.height}
          radius={side.radius}
          position={[0, 0.02, -body.width / 2 - 0.006]}
          rotation={[0, Math.PI, 0]}
        >
          {regions.streetSide.children}
        </DeviceScreen>
      )}
      {regions.rear != null && (
        <DeviceScreen
          {...wrapProps}
          {...resolveSurface(regions.rear, {
            ...surfaceDefaults,
            // the rear panel shares the side panel's dpi
            resolution: Math.round(resolution * (rearSpec.width / side.width)),
          })}
          width={rearSpec.width}
          height={rearSpec.height}
          radius={rearSpec.radius}
          position={[-body.length / 2 - 0.03, 0.02, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          overlay={
            <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2147483647 }}>
              {[3, 24.5, 72.5, 94].map((left) => (
                <div
                  key={left}
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: `${left}%`,
                    width: '3%',
                    background:
                      'linear-gradient(90deg, rgba(60,64,70,0.9), rgba(200,204,210,0.95) 45%, rgba(60,64,70,0.9))',
                    boxShadow: '2px 0 4px rgba(0,0,0,0.35)',
                  }}
                />
              ))}
            </div>
          }
        >
          {regions.rear.children}
        </DeviceScreen>
      )}
    </group>
  )
}
SemiTrailerImpl.displayName = 'SemiTrailer'

/** The trailer's compound slots, shared by `<SemiTrailer>` and `<SemiTrailerMockup>`. */
export const semiTrailerSlots = createSlots(SEMI_TRAILER_REGIONS)

export const SemiTrailer = Object.assign(SemiTrailerImpl, semiTrailerSlots)
