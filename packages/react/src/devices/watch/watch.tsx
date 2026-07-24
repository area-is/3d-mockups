import * as React from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import {
  WATCH_COLORWAYS,
  findColorway,
  WATCH_VARIANTS,
  WATCH_DEFAULT_VARIANT,
  SCREEN_REGIONS,
  type WatchVariant,
} from '@area-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { roundedRectShape, gearShape } from '@area-mockups/core'
import { useScreenOccluders } from '../../screen/occluders'
import { SideKey, cutGeometry, stadiumCutter, holeCutter, EdgeSocket } from '../details'
import { collectSlots, createSlots, resolveSurface, type SurfaceDefaults } from '../../slots'

type GroupProps = ThreeElements['group']

export interface WatchProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Anything you want on the watch screen: React components, a <video>…
   * Wrap in `<Watch.Screen>` to set per-screen surface props.
   */
  children?: React.ReactNode
  /**
   * Which watch to render, at true relative sizes: `series11` (Apple Watch
   * Series 11, 46 mm — default) or `watch8` (Galaxy Watch 8, 44 mm cushion
   * case with a round display).
   */
  variant?: WatchVariant
  /**
   * A retail colorway id from `WATCH_COLORWAYS` (e.g. the catalog's first
   * entry) presetting the device colors. Explicit color props override it.
   */
  colorway?: string
  /** Case colorway. Apple aluminum: Jet Black `#1c1d21` (default), Silver
   * `#dfe0e3`, Rose Gold `#dcb8a8`. Galaxy: Graphite `#33363c`, Silver `#d9dade`. */
  color?: string
  /** Band colorway (Sport-Band-style closed loop). Defaults to a dark band. */
  bandColor?: string
  /**
   * CSS pixel width of the virtual display. The default matches the device's
   * logical grid: 208 gives 208×248 on the Apple Watch; 240 gives a round
   * 240×240 on the Galaxy Watch — so content lays out like on the real device.
   */
  resolution?: number
  /**
   * How screen content hides when the device faces away from the camera.
   * `true` raycasts against the case (fast, interactive). `'blending'` uses
   * per-pixel depth blending. `false` disables hiding.
   */
  occlude?: boolean | 'blending'
}

/**
 * A procedurally built smartwatch — Apple Watch Series 11 (46 mm squircle
 * case, Digital Crown, Sport Band) or Samsung Galaxy Watch 8 (44 mm cushion
 * case with the round display raised on its dial puck, two flat keys, a
 * tapering Dynamic-Lug-style band with keeper and buckle) depending on
 * `variant` — wearing a full closed wristband that hugs an invisible wrist
 * directly behind the case, emerging through the case's band slots. No 3D
 * asset files are loaded — the whole device is generated from geometry at
 * runtime.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 */
function WatchImpl({
  children,
  variant = WATCH_DEFAULT_VARIANT,
  colorway,
  color: colorProp,
  bandColor = '#2a2c31',
  surfaceBackground = '#000000',
  resolution,
  interactive = true,
  dragToRotate = true,
  occlude = true,
  surfaceStyle,
  ...groupProps
}: WatchProps) {
  const screen = collectSlots(children, SCREEN_REGIONS).screen
  const spec = WATCH_VARIANTS[variant]
  const retail = findColorway(WATCH_COLORWAYS[variant], colorway)
  const color = colorProp ?? retail?.color ?? '#1c1d21'
  const { body, glass, display, crown, buttons, mic, speaker, bandSlot, band } = spec
  const res = resolution ?? spec.resolution
  const bodyRef = React.useRef<THREE.Mesh>(null!)
  const occludeRefs = useScreenOccluders(bodyRef)

  // Squircle / cushion case: extruded rounded-rect with a deep bevel for the
  // curved sides (the Galaxy cushion is the same construction, wider and
  // flatter with a bigger bevel). The mic hole, speaker slots, key recesses
  // and band-slot channels are then machined into the chassis with CSG, so
  // every opening is a true cavity with a lip — matching the phone models.
  const bodyGeometry = React.useMemo(() => {
    const shape = roundedRectShape(
      body.width - body.bevel * 2,
      body.height - body.bevel * 2,
      body.radius - body.bevel
    )
    const depth = body.depth - body.bevel * 2
    // Generously tessellated: the case's tight curvature turns per-facet
    // specular into visible mosaic patches at lower segment counts.
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: body.bevel,
      bevelSize: body.bevel,
      bevelSegments: 10,
      curveSegments: 48,
    })
    geometry.translate(0, 0, -depth / 2)

    const wall = body.width / 2
    const cutters: THREE.BufferGeometry[] = []
    if (mic) {
      const cutter = holeCutter(mic.radius, 0.08, 'x')
      cutter.translate(wall, mic.y, mic.z ?? 0)
      cutters.push(cutter)
    }
    for (const slot of speaker) {
      // On an x cut the cutter's width maps to z (the slot's thin dimension)
      // and its height to y (the run along the edge).
      const cutter = stadiumCutter(slot.height, slot.length, 0.07, 'x')
      cutter.translate(-wall, slot.y, slot.z ?? 0)
      cutters.push(cutter)
    }
    for (const button of buttons) {
      // Shallow machined recess the key sits in; where the case wall curves
      // away near the corners the recess (and key) fade out naturally.
      const cutter = stadiumCutter(button.width + 0.06, button.length + 0.06, 0.024, 'x')
      cutter.translate(wall, button.y, 0)
      cutters.push(cutter)
    }
    if (bandSlot) {
      for (const side of [1, -1]) {
        const cutter = stadiumCutter(bandSlot.width, bandSlot.height, 0.14, 'y')
        cutter.translate(0, side * (body.height / 2), bandSlot.z)
        cutters.push(cutter)
      }
    }
    return cutGeometry(geometry, cutters)
  }, [body, mic, speaker, buttons, bandSlot])

  const glassGeometry = React.useMemo(
    () => new THREE.ShapeGeometry(roundedRectShape(glass.width, glass.height, glass.radius), 32),
    [glass]
  )

  // Digital Crown barrel: a gear profile extruded along the crown's axis, so
  // the machined knurling crevices run down the barrel like the real crown.
  const crownGeometry = React.useMemo(() => {
    if (!crown) return null
    return new THREE.ExtrudeGeometry(gearShape(crown.radius, crown.teeth, crown.toothDepth), {
      depth: crown.thickness,
      bevelEnabled: false,
    })
  }, [crown])

  // Dark liners seated inside the machined speaker slots: a slim stadium pill
  // sunk past the cavity lip, so the opening keeps a bright machined chamfer
  // over a dark interior.
  const speakerLinerGeometries = React.useMemo(
    () =>
      speaker.map(({ length, height }) => {
        const shape = roundedRectShape(height - 0.006, length - 0.006, (height - 0.006) / 2 - 0.001)
        return new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false, curveSegments: 16 })
      }),
    [speaker]
  )

  // Full wristband: a rounded-rect cross-section swept along a wrist-hugging
  // ovoid loop. The strap ends stay buried inside the case so the band appears
  // to leave through the band slots in the case's top/bottom edges (as on the
  // real products), then wraps the invisible wrist directly behind the case.
  // The cross-section can taper toward the far side of the wrist (`backWidth`,
  // the Galaxy Dynamic Lug band). Hand-swept as an indexed grid so the vertex
  // normals come out smooth; ExtrudeGeometry's flat shading turns a glossy
  // band into visible facets.
  const bandGeometry = React.useMemo(() => {
    const { ryFront, ryBack, rz, centerZ, startAngle } = band.loop
    const a1 = (startAngle * Math.PI) / 180
    const a2 = Math.PI * 2 - a1
    const rings = 96
    const path: THREE.Vector3[] = []
    const widths: number[] = []
    for (let i = 0; i <= rings; i++) {
      const phi = a1 + ((a2 - a1) * i) / rings
      const ease = (1 - Math.cos(phi)) * 0.5
      const ry = ryFront + (ryBack - ryFront) * ease
      path.push(new THREE.Vector3(0, ry * Math.sin(phi), centerZ + rz * Math.cos(phi)))
      // The strap reaches its tapered width within the first stretch past the
      // case (the wide part is just the lug connector, as on the real bands).
      widths.push(band.width + ((band.backWidth ?? band.width) - band.width) * Math.min(1, ease * 2.2))
    }
    // cross-section: x spans the thickness (radial), y the width (world x)
    const sectionAt = (w: number) => {
      const pts = roundedRectShape(band.thickness, w, band.thickness * 0.33).getPoints(4)
      if (pts.length > 1 && pts[0]!.equals(pts[pts.length - 1]!)) pts.pop()
      return pts
    }
    const cols = sectionAt(band.width).length

    const positions = new Float32Array((rings + 1) * cols * 3)
    const indices: number[] = []
    const tangent = new THREE.Vector3()
    const normal = new THREE.Vector3()
    const binormal = new THREE.Vector3(1, 0, 0) // the path is planar in yz
    for (let i = 0; i <= rings; i++) {
      tangent
        .subVectors(path[Math.min(i + 1, rings)]!, path[Math.max(i - 1, 0)]!)
        .normalize()
      normal.crossVectors(binormal, tangent).normalize()
      const section = sectionAt(widths[i]!)
      for (let j = 0; j < cols; j++) {
        const s = section[j]!
        const o = (i * cols + j) * 3
        positions[o] = path[i]!.x + binormal.x * s.y
        positions[o + 1] = path[i]!.y + normal.y * s.x
        positions[o + 2] = path[i]!.z + normal.z * s.x
      }
      if (i < rings) {
        for (let j = 0; j < cols; j++) {
          const jn = (j + 1) % cols
          const a = i * cols + j
          const b = i * cols + jn
          const c = (i + 1) * cols + j
          const d = (i + 1) * cols + jn
          indices.push(a, c, b, b, c, d)
        }
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    return geometry
  }, [band])

  React.useEffect(() => {
    return () => {
      bodyGeometry.dispose()
      glassGeometry.dispose()
      bandGeometry.dispose()
      crownGeometry?.dispose()
      speakerLinerGeometries.forEach((g) => g.dispose())
    }
  }, [bodyGeometry, glassGeometry, bandGeometry, crownGeometry, speakerLinerGeometries])

  const isGalaxy = spec.style === 'galaxy'
  const dial = spec.dial
  const faceZ = body.depth / 2 + (dial?.height ?? 0)

  // Worn-strap fittings sit on the loop's centerline: point, strap width and
  // tangent tilt at a given sweep angle (0° = the loop's front axis).
  const loopAt = React.useCallback(
    (phiDeg: number) => {
      const { ryFront, ryBack, rz, centerZ } = band.loop
      const phi = (phiDeg * Math.PI) / 180
      const ease = (1 - Math.cos(phi)) * 0.5
      const ry = ryFront + (ryBack - ryFront) * ease
      const dry = ((ryBack - ryFront) / 2) * Math.sin(phi)
      const ty = dry * Math.sin(phi) + ry * Math.cos(phi)
      const tz = -rz * Math.sin(phi)
      return {
        y: ry * Math.sin(phi),
        z: centerZ + rz * Math.cos(phi),
        width: band.width + ((band.backWidth ?? band.width) - band.width) * Math.min(1, ease * 2.2),
        rotX: Math.atan2(tz, ty),
      }
    },
    [band]
  )

  const keeper = isGalaxy ? loopAt(240) : null
  const buckle = isGalaxy ? loopAt(264) : null

  return (
    <group {...groupProps}>
      {/* case — no sharp clearcoat: mirror-reflected light panels turn into
          hard-edged patches on the tight case curvature */}
      <mesh ref={bodyRef} geometry={bodyGeometry}>
        <meshPhysicalMaterial
          color={color}
          metalness={0.85}
          roughness={0.3}
          clearcoat={0.25}
          clearcoatRoughness={0.4}
        />
      </mesh>

      {/* Galaxy cushion design: the round dial rides on a raised black puck,
          leaving the aluminum cushion visible around it */}
      {dial && (
        <>
          <mesh
            rotation-x={Math.PI / 2}
            position-z={body.depth / 2 + dial.height / 2 - 0.03}
          >
            <cylinderGeometry args={[dial.radius, dial.radius, dial.height + 0.06, 48]} />
            <meshPhysicalMaterial
              color="#0b0c10"
              metalness={0.55}
              roughness={0.25}
              clearcoat={0.6}
              clearcoatRoughness={0.3}
            />
          </mesh>
          {/* polished rim ring around the dial puck's top edge, as in the
              review macros of the cushion case */}
          <mesh position-z={body.depth / 2 + dial.height - 0.008}>
            <torusGeometry args={[dial.radius - 0.008, 0.009, 10, 72]} />
            <meshPhysicalMaterial color={color} metalness={0.95} roughness={0.18} envMapIntensity={1.2} />
          </mesh>
        </>
      )}

      {/* cover crystal (black ring around the display; a full circle on Galaxy).
          Softened gloss: a mirror clearcoat blows out white at grazing angles */}
      <mesh geometry={glassGeometry} position-z={faceZ + 0.002}>
        <meshPhysicalMaterial
          color="#020205"
          metalness={0.1}
          roughness={0.12}
          clearcoat={0.8}
          clearcoatRoughness={0.25}
        />
      </mesh>

      {/* back sensor island — spans most of the case back on both watches */}
      <mesh rotation-x={Math.PI / 2} position-z={-body.depth / 2 - 0.01}>
        <cylinderGeometry args={[0.78, 0.85, 0.03, 40]} />
        <meshPhysicalMaterial color="#101114" metalness={0.3} roughness={0.35} clearcoat={1} />
      </mesh>

      {/* Digital Crown, Apple only — a knurled gear-toothed barrel protruding
          ~2 mm past the case, with a flat end cap and a dark seam ring where
          the cap meets the teeth (per Apple's product macros) */}
      {crown && crownGeometry && (
        <group position={[body.width / 2, crown.y, 0]}>
          <mesh
            geometry={crownGeometry}
            rotation-y={Math.PI / 2}
            position-x={crown.proud - crown.thickness}
          >
            <meshPhysicalMaterial color={color} metalness={0.88} roughness={0.32} />
          </mesh>
          {/* dark groove between the knurling and the end cap */}
          <mesh rotation-y={Math.PI / 2} position-x={crown.proud - 0.008}>
            <torusGeometry args={[crown.radius - crown.toothDepth - 0.008, 0.011, 10, 48]} />
            <meshPhysicalMaterial color="#0c0d10" metalness={0.5} roughness={0.45} />
          </mesh>
          {/* flat end cap, slightly proud of the teeth */}
          <mesh rotation-z={Math.PI / 2} position-x={crown.proud - 0.002}>
            <cylinderGeometry
              args={[crown.radius - crown.toothDepth - 0.012, crown.radius - crown.toothDepth - 0.012, 0.02, 40]}
            />
            <meshPhysicalMaterial color={color} metalness={0.9} roughness={0.22} clearcoat={0.4} />
          </mesh>
        </group>
      )}

      {/* keys on the right edge, seated in their machined recesses: Apple's
          near-flush side button, the Galaxy's two raised chamfered keys */}
      {buttons.map(({ y, length, width, proud }) => (
        <SideKey
          key={y}
          side={1}
          railX={body.width / 2}
          y={y}
          length={length}
          thickness={width}
          protrusion={proud}
          color={color}
        />
      ))}

      {/* dark plug inside the drilled microphone hole on the right edge */}
      {mic && (
        <EdgeSocket
          position={[body.width / 2, mic.y, mic.z ?? 0]}
          r={mic.radius}
          depth={0.07}
          lip={0.014}
          axis="x"
          inward={-1}
        />
      )}

      {/* dark liners inside the machined speaker slots on the left edge (one
          long slot on Apple, two short ones on Galaxy) */}
      {speaker.map(({ y, z }, i) => (
        <mesh
          key={y}
          geometry={speakerLinerGeometries[i]!}
          rotation-y={-Math.PI / 2}
          position={[-body.width / 2 + 0.018 + 0.05, y, z ?? 0]}
        >
          <meshPhysicalMaterial color="#08090c" metalness={0.15} roughness={0.6} envMapIntensity={0.3} />
        </mesh>
      ))}

      {/* dark liner inside the band-slot channels machined into the flat
          top/bottom edges (Apple) — kept below the case's corner roll so only
          the cavity mouth and the darkness inside it show */}
      {bandSlot && (
        <>
          {[1, -1].map((side) => (
            <RoundedBox
              key={side}
              args={[bandSlot.width - 0.03, 0.12, bandSlot.height - 0.03]}
              radius={0.05}
              position={[0, side * (body.height / 2 - 0.11 - 0.06), bandSlot.z]}
            >
              <meshPhysicalMaterial color="#0a0b0d" metalness={0.12} roughness={0.65} envMapIntensity={0.3} />
            </RoundedBox>
          ))}
        </>
      )}

      {/* full wristband loop, worn around the invisible wrist. Matte
          fluoroelastomer: a soft sheen only, or grazing angles blow out white */}
      <mesh geometry={bandGeometry}>
        <meshPhysicalMaterial
          color={bandColor}
          metalness={0.05}
          roughness={0.72}
          clearcoat={0.12}
          clearcoatRoughness={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Sport Band pin cap on the outer face at the bottom of the loop */}
      {!isGalaxy && (
        <mesh position={[0, -(band.loop.ryFront + band.loop.ryBack) / 2 - band.thickness / 2 - 0.012, band.loop.centerZ]}>
          <cylinderGeometry args={[0.17, 0.17, 0.024, 20]} />
          <meshPhysicalMaterial color="#9aa0ab" metalness={0.9} roughness={0.3} />
        </mesh>
      )}

      {/* Galaxy Sport Band closure under the wrist: band keeper + metal buckle */}
      {keeper && (
        <RoundedBox
          args={[keeper.width + 0.08, 0.18, band.thickness + 0.07]}
          radius={0.04}
          position={[0, keeper.y, keeper.z]}
          rotation-x={keeper.rotX}
        >
          <meshPhysicalMaterial
            color={bandColor}
            metalness={0.05}
            roughness={0.72}
            clearcoat={0.12}
            clearcoatRoughness={0.7}
          />
        </RoundedBox>
      )}
      {buckle && (
        <RoundedBox
          args={[buckle.width + 0.09, 0.24, band.thickness + 0.08]}
          radius={0.04}
          position={[0, buckle.y, buckle.z]}
          rotation-x={buckle.rotX}
        >
          <meshPhysicalMaterial color="#b9bdc6" metalness={0.85} roughness={0.35} />
        </RoundedBox>
      )}

      {/* the live screen: real DOM, CSS3D-transformed onto the crystal */}
      <DeviceScreen
        width={display.width}
        height={display.height}
        radius={display.radius}
        position={[0, 0, faceZ + 0.006]}
        occlude={occlude === true ? occludeRefs : occlude === 'blending' ? 'blending' : undefined}
        {...resolveSurface(screen, {
          background: surfaceBackground,
          resolution: res,
          interactive,
          dragToRotate,
          style: surfaceStyle,
        })}
      >
        {screen?.children}
      </DeviceScreen>
    </group>
  )
}
WatchImpl.displayName = 'Watch'

/** The device's compound slots, shared by `<Watch>` and `<WatchMockup>`. */
export const watchSlots = createSlots(SCREEN_REGIONS)

export const Watch = Object.assign(WatchImpl, watchSlots)
