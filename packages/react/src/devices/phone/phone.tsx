import * as React from 'react'
import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'
import {
  GALAXY_COLORWAYS,
  GALAXY_VARIANTS,
  GALAXY_DEFAULT_VARIANT,
  findColorway,
  SCREEN_REGIONS,
  type GalaxyVariant,
} from '@area-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { createLogoGeometry } from '../logos'
import {
  SideKey,
  LensRing,
  UsbC,
  EdgeSocket,
  cutGeometry,
  stadiumCutter,
  holeCutter,
  USB_CUT_DEPTH,
} from '../details'

type GroupProps = ThreeElements['group']
import { roundedRectShape } from '@area-mockups/core'
import { useScreenOccluders } from '../../screen/occluders'
import { collectSlots, createSlots, resolveSurface, type SurfaceDefaults } from '../../slots'

export interface PhoneProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Anything you want on the phone screen: React components, an <iframe>, a
   * <video>… Wrap in `<Phone.Screen>` to set per-screen surface props.
   */
  children?: React.ReactNode
  /**
   * Which Galaxy device to render. All variants use their true relative sizes:
   * `s26` (6.3", three lenses in a vertical pill island) and `s26ultra`
   * (6.9", boxier corners, large proud rings on the pill + tele column and
   * S Pen silo).
   */
  variant?: GalaxyVariant
  /**
   * A retail colorway id from `GALAXY_COLORWAYS` (e.g. `'icyblue'`) presetting
   * `color` and `frameColor`. Explicit color props override it.
   */
  colorway?: string
  /**
   * `landscape` lays the device on its side and swaps the virtual display to
   * H×W with upright content — exactly like rotating the real phone.
   */
  orientation?: 'portrait' | 'landscape'
  /** Back panel colorway. */
  color?: string
  /** Metal frame, buttons and camera-ring color. */
  frameColor?: string
  /**
   * CSS pixel width of the virtual display in the current orientation. Height
   * follows the panel aspect. Defaults to the device's logical resolution —
   * e.g. the S26 gives 360×780 in portrait and 780×360 in landscape — so
   * content lays out just like it would on the real device.
   */
  resolution?: number
  /** Show the front camera punch-hole overlay. */
  punchHole?: boolean
  /**
   * How screen content hides when the device faces away from the camera.
   * `true` raycasts against the phone body (fast, interactive). `'blending'`
   * uses per-pixel depth blending (prettier at grazing angles, but the canvas
   * paints over the DOM, so content is not clickable). `false` disables hiding.
   */
  occlude?: boolean | 'blending'
}

/**
 * A procedurally built Samsung Galaxy S26-family phone. No 3D asset files are
 * loaded — the whole device is generated from geometry at runtime, so it
 * tree-shakes and never pops in. Detail geometry (button
 * pills, camera island, port and speaker cutouts, antenna seams) follows
 * reference scans of the retail devices.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 */
function PhoneImpl({
  children,
  variant = GALAXY_DEFAULT_VARIANT,
  colorway,
  orientation = 'portrait',
  color: colorProp,
  frameColor: frameColorProp,
  surfaceBackground = '#000000',
  resolution,
  punchHole = true,
  interactive = true,
  dragToRotate = true,
  occlude = true,
  surfaceStyle,
  ...groupProps
}: PhoneProps) {
  const screen = collectSlots(children, SCREEN_REGIONS).screen
  const spec = GALAXY_VARIANTS[variant]
  const retail = findColorway(GALAXY_COLORWAYS[variant], colorway)
  const color = colorProp ?? retail?.color ?? '#101216'
  const frameColor = frameColorProp ?? retail?.frameColor ?? '#4a4f59'
  const { body, glass, display, punchHole: hole, rearCamera, buttons, buttonProfile } = spec
  const landscape = orientation === 'landscape'
  const aspect = display.height / display.width
  const res = resolution ?? Math.round(spec.resolution * (landscape ? aspect : 1))
  const bodyRef = React.useRef<THREE.Mesh>(null!)
  const occludeRefs = useScreenOccluders(bodyRef)

  // Chassis: an extruded rounded-rect with beveled edges. The shape is inset by
  // the bevel size so the final silhouette lands exactly on the spec body. The
  // bottom-edge port, speaker slot and mic holes are then machined out of it
  // with CSG so every opening is a real cavity (SIM tray and S Pen cap stay
  // flush — they're covers, not holes).
  const bodyGeometry = React.useMemo(() => {
    const shape = roundedRectShape(
      body.width - body.bevel * 2,
      body.height - body.bevel * 2,
      body.radius - body.bevel
    )
    const depth = body.depth - body.bevel * 2
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: body.bevel,
      bevelSize: body.bevel,
      bevelSegments: 4,
      curveSegments: 16,
    })
    geometry.translate(0, 0, -depth / 2)
    const edge = spec.bottomEdge
    if (!edge) return geometry
    const bottom = -body.height / 2
    const cutters = [
      stadiumCutter(edge.usb.width, edge.usb.height, USB_CUT_DEPTH).translate(edge.usb.x, bottom, 0),
    ]
    if (edge.speaker) {
      cutters.push(
        stadiumCutter(edge.speaker.width, edge.speaker.height, 0.06).translate(edge.speaker.x, bottom, 0)
      )
    }
    for (const mic of edge.mics ?? []) {
      cutters.push(holeCutter(mic.r, 0.05).translate(mic.x, bottom, 0))
    }
    return cutGeometry(geometry, cutters)
  }, [body, spec.bottomEdge])

  const glassGeometry = React.useMemo(
    () => new THREE.ShapeGeometry(roundedRectShape(glass.width, glass.height, glass.radius), 16),
    [glass]
  )

  const backGeometry = React.useMemo(
    () =>
      new THREE.ShapeGeometry(
        roundedRectShape(body.width - 0.06, body.height - 0.06, body.radius - 0.03),
        16
      ),
    [body]
  )

  // Raised camera island (the S26 line's stadium pill).
  const islandGeometry = React.useMemo(() => {
    const island = rearCamera.island
    if (!island) return null
    const bevel = 0.016
    const shape = roundedRectShape(
      island.width - bevel * 2,
      island.height - bevel * 2,
      island.radius - bevel
    )
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: (island.raise ?? 0.024) - bevel,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 3,
      curveSegments: 16,
    })
    return geometry
  }, [rearCamera.island])

  // SAMSUNG wordmark on the lower back — real vector geometry from the SVG.
  // The retail print is a low-contrast gray: mostly neutral, keeping a hint
  // of the colorway, legible without jumping off the glass.
  const logoGeometry = React.useMemo(
    () => (spec.logo ? createLogoGeometry('samsung', spec.logo.width, spec.logo.height) : null),
    [spec.logo]
  )
  const logoColor = React.useMemo(() => {
    const c = new THREE.Color(color)
    const luminance = c.r * 0.299 + c.g * 0.587 + c.b * 0.114
    return `#${c.lerp(new THREE.Color(luminance > 0.45 ? '#14161a' : '#dfe3e9'), 0.55).getHexString()}`
  }, [color])

  // SIM tray: a thin stadium plate whose rounded ends lie in the edge plane —
  // a RoundedBox can't do that at this aspect (its all-edge radius would
  // balloon a 0.2 mm plate into a thick slab bulging out of the edge).
  const simGeometry = React.useMemo(
    () =>
      spec.bottomEdge?.sim
        ? stadiumCutter(spec.bottomEdge.sim.width, spec.bottomEdge.sim.height, 0.004)
        : null,
    [spec.bottomEdge]
  )

  React.useEffect(() => {
    return () => {
      bodyGeometry.dispose()
      glassGeometry.dispose()
      backGeometry.dispose()
      islandGeometry?.dispose()
      logoGeometry?.dispose()
      simGeometry?.dispose()
    }
  }, [bodyGeometry, glassGeometry, backGeometry, islandGeometry, logoGeometry, simGeometry])

  // CSS px per world unit for the virtual display overlay.
  const pxPerUnit = res / (landscape ? display.height : display.width)
  const px = (units: number) => units * pxPerUnit

  // A back element (ring, flash, sensor) mounts on the raised island only when
  // it sits within the island footprint; otherwise it's flush on the flat back.
  const island = rearCamera.island
  const raise = island?.raise ?? 0.024
  const onIsland = (x: number, y: number) =>
    !!island &&
    Math.abs(x - island.x) <= island.width / 2 &&
    Math.abs(y - island.y) <= island.height / 2
  const backZ = (x: number, y: number, flat: number, raised: number) =>
    -body.depth / 2 - (onIsland(x, y) ? raised : flat)

  const bottomY = -body.height / 2 - 0.002

  // The pill island is tone-on-tone with the back — on the retail devices it
  // reads as a subtle seam and a slightly different sheen, never as a
  // contrasting plate.
  const islandColor = React.useMemo(
    () => `#${new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.06).getHexString()}`,
    [color]
  )

  return (
    <group {...groupProps}>
      {/* landscape lays the body on its side (top edge to the left, the classic
          camera-left pose); the screen plane counter-rotates below */}
      <group rotation-z={landscape ? Math.PI / 2 : 0}>
        {/* chassis */}
        <mesh ref={bodyRef} geometry={bodyGeometry}>
          <meshPhysicalMaterial color={frameColor} metalness={0.85} roughness={0.32} />
        </mesh>

        {/* back panel colorway */}
        <mesh geometry={backGeometry} rotation-y={Math.PI} position-z={-body.depth / 2 - 0.002}>
          <meshPhysicalMaterial
            color={color}
            metalness={0.35}
            roughness={0.3}
            clearcoat={1}
            clearcoatRoughness={0.25}
          />
        </mesh>

        {/* cover glass (the black ring visible around the display) */}
        <mesh geometry={glassGeometry} position-z={body.depth / 2 + 0.002}>
          <meshPhysicalMaterial color="#020205" metalness={0.1} roughness={0.08} clearcoat={1} />
        </mesh>

        {/* rear camera: raised pill island, lens rings, flash, sensors */}
        {island && islandGeometry && (
          <mesh
            geometry={islandGeometry}
            rotation-y={Math.PI}
            position={[island.x, island.y, -body.depth / 2 - 0.002]}
          >
            <meshPhysicalMaterial color={islandColor} metalness={0.4} roughness={0.3} clearcoat={0.9} />
          </mesh>
        )}
        {rearCamera.rings.map(({ x, y, r, h, pupil }, i) => (
          <group
            key={i}
            position={[x ?? rearCamera.ringsX, y, backZ(x ?? rearCamera.ringsX, y, 0, raise)]}
          >
            <LensRing
              r={r}
              proud={h ?? rearCamera.ringHeight ?? 0.034}
              frameColor={frameColor}
              pupil={pupil}
            />
          </group>
        ))}
        <mesh
          rotation-x={Math.PI / 2}
          position={[
            rearCamera.flash.x,
            rearCamera.flash.y,
            backZ(rearCamera.flash.x, rearCamera.flash.y, 0.008, raise + 0.01),
          ]}
        >
          <cylinderGeometry args={[0.05, 0.05, 0.016, 32]} />
          <meshPhysicalMaterial
            color="#efe9da"
            emissive="#fff3d6"
            emissiveIntensity={0.25}
            roughness={0.4}
          />
        </mesh>
        {rearCamera.dots?.map(({ x, y, r }, i) => (
          <mesh
            key={i}
            rotation-x={Math.PI / 2}
            position={[x, y, backZ(x, y, 0.006, raise + 0.008)]}
          >
            <cylinderGeometry args={[r, r, 0.012, 16]} />
            <meshPhysicalMaterial color="#07080c" metalness={0.3} roughness={0.45} />
          </mesh>
        ))}

        {/* SAMSUNG wordmark imprint on the lower back */}
        {spec.logo && logoGeometry && (
          <mesh geometry={logoGeometry} rotation-y={Math.PI} position={[0, spec.logo.y, -body.depth / 2 - 0.0035]}>
            <meshPhysicalMaterial
              color={logoColor}
              metalness={0.45}
              roughness={0.32}
              envMapIntensity={0.7}
              polygonOffset
              polygonOffsetFactor={-1}
            />
          </mesh>
        )}

        {/* side keys on the right rail — machined pills seated in the frame,
            protruding ~0.5 mm like the real keys (positions from the scan) */}
        {buttons.map(({ y, length }, i) => (
          <SideKey
            key={i}
            side={1}
            railX={body.width / 2}
            y={y}
            length={length}
            thickness={buttonProfile.thickness}
            protrusion={buttonProfile.protrusion}
            color={frameColor}
          />
        ))}

        {/* antenna seams wrapping the side rails */}
        {spec.antennaLines?.map((y, i) => (
          <React.Fragment key={i}>
            {[-1, 1].map((side) => (
              <mesh key={side} position={[side * (body.width / 2 - 0.005), y, 0]}>
                <boxGeometry args={[0.012, 0.008, body.depth * 0.82]} />
                <meshStandardMaterial color="#22262c" transparent opacity={0.38} roughness={0.6} />
              </mesh>
            ))}
          </React.Fragment>
        ))}

        {/* bottom-edge machining: the USB-C, speaker slot and mic holes are real
            cavities cut from the chassis above — these are their interiors.
            SIM tray and S Pen cap are flush covers with a seam. */}
        {spec.bottomEdge && (
          <>
            <UsbC
              x={spec.bottomEdge.usb.x}
              y={-body.height / 2}
              width={spec.bottomEdge.usb.width}
              height={spec.bottomEdge.usb.height}
            />
            {spec.bottomEdge.speaker && (
              <EdgeSocket
                position={[spec.bottomEdge.speaker.x, -body.height / 2, 0]}
                width={spec.bottomEdge.speaker.width}
                height={spec.bottomEdge.speaker.height}
                depth={0.06}
              />
            )}
            {spec.bottomEdge.mics?.map(({ x, r }, i) => (
              <EdgeSocket key={i} position={[x, -body.height / 2, 0]} r={r} depth={0.05} lip={0.008} />
            ))}
            {spec.bottomEdge.sim && simGeometry && (
              <mesh
                geometry={simGeometry}
                position={[spec.bottomEdge.sim.x, -body.height / 2 + 0.002, 0]}
              >
                {/* the SIM tray is frame-toned metal — only its seam reads dark */}
                <meshStandardMaterial color="#15181d" transparent opacity={0.35} roughness={0.5} />
              </mesh>
            )}
            {spec.bottomEdge.penCap && (
              <group position={[spec.bottomEdge.penCap.x, bottomY, 0]}>
                {/* S Pen cap: a frame-toned plug with its seam ring */}
                <mesh>
                  <cylinderGeometry
                    args={[spec.bottomEdge.penCap.r, spec.bottomEdge.penCap.r, 0.014, 24]}
                  />
                  <meshPhysicalMaterial color="#15181d" metalness={0.5} roughness={0.4} />
                </mesh>
                <mesh position-y={-0.002}>
                  <cylinderGeometry
                    args={[spec.bottomEdge.penCap.r * 0.8, spec.bottomEdge.penCap.r * 0.8, 0.014, 24]}
                  />
                  <meshPhysicalMaterial color={frameColor} metalness={0.85} roughness={0.3} />
                </mesh>
              </group>
            )}
          </>
        )}

        {/* the live screen: real DOM, CSS3D-transformed onto the display */}
        <DeviceScreen
          width={landscape ? display.height : display.width}
          height={landscape ? display.width : display.height}
          radius={display.radius}
          position={[0, 0, body.depth / 2 + 0.006]}
          rotation={landscape ? [0, 0, -Math.PI / 2] : [0, 0, 0]}
          occlude={occlude === true ? occludeRefs : occlude === 'blending' ? 'blending' : undefined}
          {...resolveSurface(screen, {
            background: surfaceBackground,
            resolution: res,
            interactive,
            dragToRotate,
            style: surfaceStyle,
          })}
          overlay={
            punchHole ? (
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  // the hole sits at the panel's physical top — the left edge in landscape
                  ...(landscape
                    ? { left: px(hole.offsetY - hole.radius), top: '50%', transform: 'translateY(-50%)' }
                    : { top: px(hole.offsetY - hole.radius), left: '50%', transform: 'translateX(-50%)' }),
                  width: px(hole.radius * 2),
                  height: px(hole.radius * 2),
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle at 38% 38%, #1b2436 0%, #05060a 55%, #000 100%)',
                  boxShadow: '0 0 0 1.5px rgba(255, 255, 255, 0.05)',
                  pointerEvents: 'none',
                  zIndex: 2147483647,
                }}
              />
            ) : undefined
          }
        >
          {screen?.children}
        </DeviceScreen>
      </group>
    </group>
  )
}
PhoneImpl.displayName = 'Phone'

/** The device's compound slots, shared by `<Phone>` and `<PhoneMockup>`. */
export const phoneSlots = createSlots(SCREEN_REGIONS)

export const Phone = Object.assign(PhoneImpl, phoneSlots)
