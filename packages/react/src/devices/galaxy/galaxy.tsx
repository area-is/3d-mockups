import * as React from 'react'
import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'
import {
  GALAXY_COLORWAYS,
  GALAXY_VARIANTS,
  GALAXY_DEFAULT_VARIANT,
  findColorway,
  railColor,
  SCREEN_REGIONS,
  type GalaxyVariant,
  roundedRectShape,
} from '../../core'
import { checkColorway, checkDeviceVariant } from '../../core/lifecycle'
import { DeviceScreen } from '../../screen/device-screen'
import {
  renderStatusBar,
  statusBarSafeAreaTop,
  type StatusBarOption,
  type StatusBarPlacement,
} from '../../screen/status-bar'
import { createLogoGeometry } from '../logos'
import {
  SideKey,
  LensRing,
  FlashModule,
  UsbC,
  EdgeSocket,
  cutGeometry,
  stadiumCutter,
  holeCutter,
  smoothShaded,
  USB_CUT_DEPTH,
} from '../details'

type GroupProps = ThreeElements['group']
import { collectSlots, createSlots, resolveSurface, type SurfaceProps } from '../../slots'

export interface GalaxyProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceProps {
  /**
   * Anything you want on the phone screen: React components, an <iframe>, a
   * <video>… Wrap in `<Galaxy.Screen>` to set per-screen surface props.
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
   * `landscape` lays the device on its side and swaps the virtual display to
   * H×W with upright content - exactly like rotating the real phone.
   */
  orientation?: 'portrait' | 'landscape'
  /**
   * Draw the system status bar across the top of the screen: `true` for the
   * platform's defaults, or an object to set the clock, the meters and the
   * ink. It is placed from this device's own camera cutout and logical grid,
   * so it lines up with the hardware on every variant.
   */
  statusBar?: StatusBarOption
  /**
   * Back panel color, and the whole finish: the metal frame, buttons and
   * (on the Ultra) the camera rings follow from it - the S26's rings are dark
   * chrome on every finish, as on the hardware. A retail colorway id from
   * `GALAXY_COLORWAYS` (`'icyblue'`, `'mint'`…) gets that model's measured
   * rail; any other CSS color gets one derived from it (see `railColor`). A
   * colorway id wins over a CSS color of the same name - pass hex if you
   * meant the CSS one.
   */
  color?: string
  /**
   * CSS pixel width of the virtual display in the current orientation. Height
   * follows the panel aspect. Defaults to the device's logical resolution -
   * e.g. the S26 gives 360×780 in portrait and 780×360 in landscape - so
   * content lays out just like it would on the real device.
   */
  resolution?: number
}

/**
 * A procedurally built Samsung Galaxy S26-family phone. No 3D asset files are
 * loaded - the whole device is generated from geometry at runtime, so it
 * tree-shakes and never pops in. Detail geometry (button
 * pills, camera island, port and speaker cutouts, antenna seams) follows
 * published specifications and product photography.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 */
function GalaxyImpl({
  children,
  variant = GALAXY_DEFAULT_VARIANT,
  orientation = 'portrait',
  color: colorProp,
  surfaceBackground = '#000000',
  resolution,
  surfaceStyle,
  statusBar,
  ...groupProps
}: GalaxyProps) {
  checkDeviceVariant('galaxy', variant, 'Galaxy')
  checkColorway(GALAXY_COLORWAYS, variant, colorProp, 'Galaxy')
  const screen = collectSlots(children, SCREEN_REGIONS).screen
  const spec = GALAXY_VARIANTS[variant]
  // `color` doubles as the colorway selector: a catalog id resolves to
  // that retail finish, anything else is passed through as a raw CSS
  // color. Ids win over same-named CSS colors - pass hex for those.
  const retail = findColorway(GALAXY_COLORWAYS[variant], colorProp)
  const color = retail?.color ?? colorProp ?? '#101216'
  const frameColor = retail?.frameColor ?? railColor(color)
  const { body, glass, display, punchHole: hole, rearCamera, buttons, buttonProfile } = spec
  const landscape = orientation === 'landscape'
  const aspect = display.height / display.width
  const res = resolution ?? Math.round(spec.resolution * (landscape ? aspect : 1))

  // Chassis: an extruded rounded-rect with beveled edges. The shape is inset by
  // the bevel size so the final silhouette lands exactly on the spec body. The
  // bottom-edge port, speaker slot and mic holes are then machined out of it
  // with CSG so every opening is a real cavity (SIM tray and S Pen cap stay
  // flush - they're covers, not holes).
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
      bevelSegments: 5,
      curveSegments: 16,
    })
    // smooth normals, so the shoulder reads as one soft roll rather than bands
    return smoothShaded(geometry)
  }, [rearCamera.island])

  // SAMSUNG wordmark on the lower back - real vector geometry from the SVG.
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

  // SIM tray: a thin stadium plate whose rounded ends lie in the edge plane -
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

  // The pill island is tone-on-tone with the back - on the retail devices it
  // reads as a subtle seam and a slightly different sheen, never as a
  // contrasting plate.
  const islandColor = React.useMemo(
    () => `#${new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.06).getHexString()}`,
    [color]
  )
  // The S26's rings are dark chrome whatever the colourway (see the spec);
  // the Ultra's titanium rings follow the rail.
  const ringColor = rearCamera.ringFinish === 'gunmetal' ? '#3a3d43' : frameColor

  /*
   * The bar's placement, derived once. The overlay is drawn from it and the
   * surface publishes the strip it costs as `--mockup-safe-area-top`, so the
   * bar and the content underneath can never disagree about where the band
   * ends. Landscape gets no cutout: the camera is off to the side there, and
   * both systems set a plain strip along the top instead of clearing it.
   */
  const statusBarPlacement = {
    platform: 'oneui',
    formFactor: 'phone',
    width: res,
    corner: px(display.radius),
    cutout: landscape
      ? undefined
      : { halfWidth: px(hole.radius), centerY: px(hole.offsetY), offsetX: 0 },
  } satisfies StatusBarPlacement

  return (
    <group {...groupProps}>
      {/* landscape lays the body on its side (top edge to the left, the classic
          camera-left pose); the screen plane counter-rotates below */}
      <group rotation-z={landscape ? Math.PI / 2 : 0}>
        {/* chassis */}
        <mesh geometry={bodyGeometry}>
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
        {rearCamera.rings.map(({ x, y, r, h, pupil, collar }, i) => (
          <group
            key={i}
            position={[x ?? rearCamera.ringsX, y, backZ(x ?? rearCamera.ringsX, y, 0, raise)]}
          >
            <LensRing
              r={r}
              proud={h ?? rearCamera.ringHeight ?? 0.034}
              frameColor={ringColor}
              pupil={pupil}
              collar={collar ?? rearCamera.ringCollar}
            />
          </group>
        ))}
        {/* the LED flash: a domed window with its warm phosphor showing
            through, seated on the back (or the island) - it used to be a
            flat cream disc, which is what a drawn-on flash looks like */}
        <group
          position={[
            rearCamera.flash.x,
            rearCamera.flash.y,
            backZ(rearCamera.flash.x, rearCamera.flash.y, 0.002, raise + 0.002),
          ]}
        >
          <FlashModule r={rearCamera.flash.r ?? 0.05} />
        </group>
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

        {/* side keys on the right rail - machined pills seated in the frame,
            protruding ~0.5 mm like the real keys (positions as measured) */}
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
            cavities cut from the chassis above - these are their interiors.
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
                {/* the SIM tray is frame-toned metal - only its seam reads dark */}
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
          {...resolveSurface(screen, {
            surfaceBackground,
            resolution: res,
            surfaceStyle,
          })}
          // The front camera is part of the hardware, so it is always drawn:
          // it eats the same corner of your layout here that it eats on the
          // real panel, which is most of the point of looking at a mockup.
          safeAreaTop={statusBarSafeAreaTop(statusBar, statusBarPlacement)}
          overlay={
            <>
            {renderStatusBar(statusBar, statusBarPlacement)}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                // the hole sits at the panel's physical top - the left edge in landscape
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
            </>
          }
        >
          {screen?.children}
        </DeviceScreen>
      </group>
    </group>
  )
}
GalaxyImpl.displayName = 'Galaxy'

/** The device's compound slots, shared by `<Galaxy>` and `<GalaxyMockup>`. */
export const galaxySlots = createSlots(SCREEN_REGIONS)

export const Galaxy = Object.assign(GalaxyImpl, galaxySlots)
