import * as React from 'react'
import * as THREE from 'three'

/**
 * The road wheel shared by every vehicle mockup (van, bus, semi-trailer).
 *
 * A tire is not a cylinder. Its sidewalls bulge out past the tread, the
 * shoulders round over, the tread band carries circumferential grooves and it
 * seats on a rim that dishes inboard — and it is exactly those cues, missing
 * from a plain extruded disc, that make a vehicle read as a toy. The whole
 * carcass is one lathed profile, so the cost is a single draw call per wheel.
 */

/** Points along the tire's meridian: (radius, axial offset from the centre). */
function tireProfile(radius: number, width: number, rimRadius: number): THREE.Vector2[] {
  const hw = width / 2
  const points: THREE.Vector2[] = []
  // Sidewall as a quarter-arc from the bead up to the shoulder, bulging
  // `belly` past the tread band's half-width at its widest point.
  const belly = hw * 1.06
  const shoulderR = radius * 0.965
  const sidewall = (sign: 1 | -1, inward: boolean) => {
    const steps = 9
    for (let i = 0; i <= steps; i++) {
      const t = inward ? 1 - i / steps : i / steps
      // t: 0 at the bead, 1 at the shoulder.
      const r = rimRadius + (shoulderR - rimRadius) * Math.sin((t * Math.PI) / 2)
      const bulge = Math.sin(t * Math.PI) ** 0.7
      const a = hw + (belly - hw) * bulge - (hw - hw * 0.72) * t * t
      points.push(new THREE.Vector2(r, sign * a))
    }
  }
  // Tread band: flat, notched by two circumferential grooves.
  const grooveR = radius * 0.94
  const tread: [number, number][] = [
    [radius, -0.72],
    [radius, -0.46],
    [grooveR, -0.4],
    [grooveR, -0.26],
    [radius, -0.2],
    [radius, 0.2],
    [grooveR, 0.26],
    [grooveR, 0.4],
    [radius, 0.46],
    [radius, 0.72],
  ]

  points.push(new THREE.Vector2(rimRadius, -hw * 0.98))
  sidewall(-1, false)
  // Shoulder round into the tread edge.
  points.push(new THREE.Vector2(radius * 0.995, -hw * 0.79))
  for (const [r, a] of tread) points.push(new THREE.Vector2(r, hw * a))
  points.push(new THREE.Vector2(radius * 0.995, hw * 0.79))
  sidewall(1, true)
  points.push(new THREE.Vector2(rimRadius, hw * 0.98))
  return points
}

export interface RoadWheelProps {
  /** Tire outer radius. */
  radius: number
  /** Tire section width. */
  width: number
  /** Rim (bead seat) radius as a fraction of the tire radius. */
  rimRatio?: number
  /** Which way the rim dishes out: `1` toward +Z, `-1` toward −Z. */
  face?: 1 | -1
  /** Wheel nuts on the bolt circle (6 on a van, 10 on a truck axle). */
  lugs?: number
  /** Rim face colour — bright for a hub cap, dark for a painted steel wheel. */
  rimColor?: string
  /** Tire rubber colour. */
  tireColor?: string
  position?: [number, number, number]
}

/**
 * One wheel: lathed tire, dished rim with hand holes, hub and lug ring. The
 * axis runs along Z; drop it at the axle centre.
 */
export function RoadWheel({
  radius,
  width,
  rimRatio = 0.56,
  face = 1,
  lugs = 6,
  rimColor = '#aeb4bd',
  tireColor = '#15161a',
  position,
}: RoadWheelProps) {
  const rim = radius * rimRatio
  const tireGeometry = React.useMemo(() => {
    const geometry = new THREE.LatheGeometry(tireProfile(radius, width, rim), 32)
    geometry.rotateX(Math.PI / 2)
    return geometry
  }, [radius, width, rim])
  React.useEffect(() => () => tireGeometry.dispose(), [tireGeometry])

  // The rim face sits at the outer bead, level with the sidewall's outer
  // face: recess it further and the bulging sidewall occludes the whole
  // wheel from any three-quarter angle, leaving a featureless black disc.
  const dishZ = face * width * 0.46
  const holeR = rim * 0.62
  const lugR = rim * 0.34

  return (
    <group position={position}>
      <mesh geometry={tireGeometry}>
        <meshPhysicalMaterial color={tireColor} metalness={0} roughness={0.92} envMapIntensity={0.35} />
      </mesh>

      {/* rim barrel closing the bead seats, then the dished face */}
      <mesh rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[rim * 0.99, rim * 0.99, width * 0.94, 28]} />
        <meshPhysicalMaterial color="#26292e" metalness={0.6} roughness={0.55} envMapIntensity={0.5} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position-z={dishZ}>
        <cylinderGeometry args={[rim, rim * 0.96, width * 0.1, 28]} />
        <meshPhysicalMaterial color={rimColor} metalness={0.82} roughness={0.34} envMapIntensity={1.1} />
      </mesh>
      {/* the flange lip standing just proud of the bead */}
      <mesh position-z={dishZ + face * width * 0.06}>
        <torusGeometry args={[rim * 0.99, width * 0.035, 8, 36]} />
        <meshPhysicalMaterial color={rimColor} metalness={0.86} roughness={0.28} envMapIntensity={1.2} />
      </mesh>

      {/* hand holes punched through the rim face */}
      {Array.from({ length: lugs === 10 ? 8 : 5 }, (_, i) => {
        const angle = (i / (lugs === 10 ? 8 : 5)) * Math.PI * 2 + Math.PI / 8
        return (
          <mesh
            key={i}
            rotation-x={Math.PI / 2}
            position={[Math.cos(angle) * holeR, Math.sin(angle) * holeR, dishZ]}
          >
            <cylinderGeometry args={[rim * 0.17, rim * 0.17, width * 0.16, 14]} />
            <meshPhysicalMaterial color="#101216" metalness={0.3} roughness={0.8} envMapIntensity={0.2} />
          </mesh>
        )
      })}

      {/* hub cap over the axle nut, with the lug ring around it */}
      <mesh rotation-x={Math.PI / 2} position-z={dishZ + face * width * 0.05}>
        <cylinderGeometry args={[rim * 0.3, rim * 0.34, width * 0.14, 20]} />
        <meshPhysicalMaterial color={rimColor} metalness={0.85} roughness={0.3} envMapIntensity={1.1} />
      </mesh>
      {Array.from({ length: lugs }, (_, i) => {
        const angle = (i / lugs) * Math.PI * 2
        return (
          <mesh
            key={i}
            rotation-x={Math.PI / 2}
            position={[Math.cos(angle) * lugR, Math.sin(angle) * lugR, dishZ + face * width * 0.05]}
          >
            <cylinderGeometry args={[rim * 0.085, rim * 0.085, width * 0.09, 6]} />
            <meshPhysicalMaterial color="#7e848d" metalness={0.8} roughness={0.35} />
          </mesh>
        )
      })}
    </group>
  )
}

export interface WheelArchFlareProps {
  /** Arch cutout radius in the body side. */
  radius: number
  /** Lip thickness. */
  tube?: number
  /** Side face Z the flare sits on. */
  z: number
  /** `1` for the +Z side, `-1` for −Z (the lip stands proud outward). */
  side: 1 | -1
  color?: string
  position?: [number, number, number]
}

/**
 * The raised lip around a wheel arch. Without it the arch reads as a hole
 * printed on a flat slab; with it the opening has a rolled edge catching its
 * own highlight, which is most of what says "pressed sheet metal".
 */
export function WheelArchFlare({
  radius,
  tube = 0.045,
  z,
  side,
  color = '#1b1d21',
  position = [0, 0, 0],
}: WheelArchFlareProps) {
  return (
    <group position={[position[0], position[1], z + side * tube * 0.55]}>
      <mesh>
        <torusGeometry args={[radius, tube, 10, 44, Math.PI]} />
        <meshPhysicalMaterial color={color} metalness={0.15} roughness={0.72} envMapIntensity={0.5} />
      </mesh>
    </group>
  )
}
