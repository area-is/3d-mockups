import * as React from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import {
  IPHONE_COLORWAYS,
  findColorway,
  railColor,
  IPHONE_VARIANTS,
  IPHONE_DEFAULT_VARIANT,
  SCREEN_REGIONS,
  type IPhoneVariant,
  roundedRectShape,
} from '../../core'
import { checkDeviceVariant } from '../../core/lifecycle'
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
  SensorWindow,
  UsbC,
  EdgeSocket,
  cutGeometry,
  stadiumCutter,
  holeCutter,
  smoothShaded,
  USB_CUT_DEPTH,
} from '../details'
import { collectSlots, createSlots, resolveSurface, type SurfaceProps } from '../../slots'

type GroupProps = ThreeElements['group']

export interface IPhoneProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceProps {
  /**
   * Anything you want on the phone screen: React components, an <iframe>, a
   * <video>… Wrap in `<IPhone.Screen>` to set per-screen surface props.
   */
  children?: React.ReactNode
  /**
   * Which iPhone to render. All variants use their true relative sizes:
   * `'17'` (6.3", two-lens pill), `air` (6.5", ultra-thin, single-lens bar),
   * `pro` (6.3") and `promax` (6.9") with the full-width triple-lens plateau,
   * and `'18pro'` / `'18promax'` - the same two Pro bodies with the
   * generation's narrower Dynamic Island and colour-matched back.
   */
  variant?: IPhoneVariant
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
   * Back glass color, and the whole finish: the chassis rail, buttons and
   * camera rings follow from it. A retail colorway id from
   * `IPHONE_COLORWAYS[variant]` (`'black'`, `'mistblue'`, `'cosmicorange'`,
   * the 18 Pros' `'glacier'` and `'burgundy'`…) gets that model's measured
   * rail; any other CSS color gets one derived from it (see `railColor`). A
   * colorway id wins over a CSS color of the same name - pass hex if you meant
   * the CSS one.
   */
  color?: string
  /**
   * CSS pixel width of the virtual display in the current orientation. Height
   * follows the panel aspect. Defaults to the device's logical point grid -
   * e.g. the iPhone 17 gives 402×874 in portrait and 874×402 in landscape -
   * so content lays out just like it would on the real device.
   */
  resolution?: number
}

/**
 * A procedurally built Apple iPhone - the 17 family and the 18 Pros: flat
 * frame, Dynamic Island (the 18 Pros' narrower one), and the per-model rear
 * camera architecture (vertical pill on the 17, single-lens bar on the Air,
 * full-width triple-lens plateau on the Pros). No 3D asset files are loaded -
 * the whole device is generated from geometry at runtime.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 */
function IPhoneImpl({
  children,
  variant = IPHONE_DEFAULT_VARIANT,
  orientation = 'portrait',
  color: colorProp,
  surfaceBackground = '#000000',
  resolution,
  surfaceStyle,
  statusBar,
  ...groupProps
}: IPhoneProps) {
  checkDeviceVariant('iphone', variant, 'IPhone')
  const screen = collectSlots(children, SCREEN_REGIONS).screen
  const spec = IPHONE_VARIANTS[variant]
  // `color` doubles as the colorway selector: a catalog id resolves to
  // that retail finish, anything else is passed through as a raw CSS
  // color. Ids win over same-named CSS colors - pass hex for those.
  const retail = findColorway(IPHONE_COLORWAYS[variant], colorProp)
  const color = retail?.color ?? colorProp ?? '#1a1c20'
  const frameColor = retail?.frameColor ?? railColor(color)
  const { body, glass, display, island, rearCamera, backWindow, buttons, buttonProfile } = spec
  const landscape = orientation === 'landscape'
  const aspect = display.height / display.width
  const res = resolution ?? Math.round(spec.resolution * (landscape ? aspect : 1))

  // Chassis: an extruded rounded-rect with lightly beveled edges - the flat
  // aluminum/titanium frame. The shape is inset by the bevel size so the final
  // silhouette lands exactly on the spec body. The bottom edge's USB-C, the
  // drilled speaker/mic holes and the two screw recesses are then machined out
  // with CSG so each opening is a real cavity.
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
    for (const screw of edge.screws ?? []) {
      cutters.push(holeCutter(screw.r, 0.028).translate(screw.x, bottom, 0))
    }
    for (const hole of edge.speakers ?? []) {
      cutters.push(holeCutter(hole.r, 0.05).translate(hole.x, bottom, 0))
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

  // The Ceramic Shield glass window - a thin raised rounded-rect panel so its
  // edge reads as a real seam against the aluminum unibody, not just a color
  // change. Covers most of the lower back below the plateau.
  const backWindowGeometry = React.useMemo(() => {
    if (!backWindow) return null
    const bevel = 0.01
    const shape = roundedRectShape(
      backWindow.width - bevel * 2,
      backWindow.height - bevel * 2,
      backWindow.radius - bevel
    )
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.006,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 2,
      curveSegments: 16,
    })
  }, [backWindow])
  React.useEffect(() => () => backWindowGeometry?.dispose(), [backWindowGeometry])

  // The camera pedestal: a vertical pill (17) or a full-width plateau bar
  // (Air / Pro / Pro Max) - extruded so face corners are truly semicircular.
  const pedestalGeometry = React.useMemo(() => {
    const { frame } = rearCamera
    // `wall` is the rolled edge between the footprint and the top face - wide
    // on the retail pedestals (2.6 mm on the 17's pill, 4.7 mm on the Air's
    // bar, 1.85 mm on the Pro's forged shelf), so it is authored per variant
    // instead of following the raise.
    const wall = frame.wall ?? 0.018
    const raise = frame.raise ?? 0.048
    // The edge is one continuous quarter-ellipse from the back up to the
    // face, `wall` wide and (nearly) the full `raise` tall - the pillowy
    // roll in every product shot. Capping the roll at 60% of the raise left
    // a vertical wall under a shallow chamfer, which rendered as a hard step
    // with a dark band around it - a tile stuck on the phone. Only where the
    // wall is narrower than the raise (the Pro shelf) does a short vertical
    // wall remain under the roll, which is also how the hardware reads.
    const lift = Math.min(wall, raise - 0.003)
    const radius =
      frame.radius ??
      (rearCamera.style === 'pill'
        ? (frame.width - wall * 2) / 2 // fully rounded pill ends
        : Math.min(0.24, (frame.height - wall * 2) / 2))
    const shape = roundedRectShape(
      frame.width - wall * 2,
      frame.height - wall * 2,
      Math.max(0.01, radius - wall)
    )
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(0.003, raise - lift),
      bevelEnabled: true,
      bevelThickness: lift,
      bevelSize: wall,
      bevelSegments: 8,
      curveSegments: 24,
    })
    // smooth normals, or the roll shades as eight flat bands
    return smoothShaded(geometry)
  }, [rearCamera])

  // The back shell's outer face, and the pedestal face standing `raise` proud
  // of it - the pedestal mesh sits 0.002 off the shell, so its top face is
  // that much further out than the raise alone. Camera hardware mounts on one
  // of these two planes and builds outward from it, so getting this wrong
  // sinks the lens stacks into the plateau they stand on.
  const shellZ = body.depth / 2 + 0.002
  const pedestalTop = shellZ + (rearCamera.frame.raise ?? 0.048)
  // A flash or sensor mounts on the pedestal face when it falls inside the
  // pedestal's footprint and on the flat back when it doesn't - on the 17 the
  // mic sits on the pill while the flash is out on the glass beside it.
  const onPedestal = (x: number, y: number) => {
    const { frame } = rearCamera
    return (
      Math.abs(x - frame.x) <= frame.width / 2 && Math.abs(y - frame.y) <= frame.height / 2
    )
  }
  const mountZ = (x: number, y: number) => -(onPedestal(x, y) ? pedestalTop : shellZ)
  // The Pro generation's back is a bead-blasted aluminum unibody and its
  // camera plateau is that unibody's own shelf, not a part glued onto it; the
  // 17 and Air are glass, pill and bar included. So shell and pedestal share
  // one material: a clearcoat on the plateau alone drew a bright rim right
  // around its outline and turned the whole camera into a glossy tile stuck
  // on the phone. On a Pro back that leaves the Ceramic Shield window as the
  // only glossy panel, which is the contrast the two-tone design is built on.
  const aluminum = !!backWindow
  const shellFinish = aluminum
    ? { metalness: 0.6, roughness: 0.5, clearcoat: 0, envMapIntensity: 0.9 }
    : { metalness: 0.28, roughness: 0.31, clearcoat: 1, clearcoatRoughness: 0.2, envMapIntensity: 1 }
  // The glass pedestals are not quite the back they sit on: the 17's pill is
  // a deeper, more saturated cut of the colourway ("a more intense version of
  // the main colour" in the hands-on reviews), and the Air's bar is polished
  // where its back is satin - the glossy element every review remarks on.
  const pedestalColor = React.useMemo(
    () =>
      rearCamera.style === 'pill'
        ? `#${new THREE.Color(color).lerp(new THREE.Color('#000000'), 0.08).getHexString()}`
        : color,
    [color, rearCamera.style]
  )
  const pedestalFinish =
    !aluminum && rearCamera.style === 'bar' ? { ...shellFinish, clearcoatRoughness: 0.08 } : shellFinish
  // Apple badge - real vector geometry from the SVG. The retail logo is
  // tone-on-tone in the back glass ("practically invisible in some light"):
  // a slight tone shift plus a glossier finish, no printed color.
  const logoGeometry = React.useMemo(
    () => (spec.logo ? createLogoGeometry('apple', spec.logo.width, spec.logo.height) : null),
    [spec.logo]
  )
  // Always a touch darker than the glass with a mirror-gloss finish: on dark
  // bodies the retail inlay reads darker still, only GLINTING lighter as it
  // catches light - never a flat lighter gray.
  const logoColor = React.useMemo(
    () => `#${new THREE.Color(color).lerp(new THREE.Color('#000000'), 0.15).getHexString()}`,
    [color]
  )
  React.useEffect(() => () => logoGeometry?.dispose(), [logoGeometry])

  React.useEffect(() => {
    return () => {
      bodyGeometry.dispose()
      glassGeometry.dispose()
      backGeometry.dispose()
      pedestalGeometry.dispose()
    }
  }, [bodyGeometry, glassGeometry, backGeometry, pedestalGeometry])

  // CSS px per world unit for the display overlay (Dynamic Island).
  const pxPerUnit = res / (landscape ? display.height : display.width)
  const px = (units: number) => units * pxPerUnit

  /*
   * The bar's placement, derived once. The overlay is drawn from it and the
   * surface publishes the strip it costs as `--mockup-safe-area-top`, so the
   * bar and the content underneath can never disagree about where the band
   * ends. Landscape gets no cutout: the camera is off to the side there, and
   * both systems set a plain strip along the top instead of clearing it.
   */
  const statusBarPlacement = {
    platform: 'ios',
    formFactor: 'phone',
    width: res,
    corner: px(display.radius),
    cutout: landscape
      ? undefined
      : { halfWidth: px(island.width) / 2, centerY: px(island.offsetY), offsetX: 0 },
  } satisfies StatusBarPlacement

  return (
    <group {...groupProps}>
      {/* landscape lays the body on its side (top edge to the left, the classic
          camera-left pose); the screen plane counter-rotates below */}
      <group rotation-z={landscape ? Math.PI / 2 : 0}>
        {/* chassis */}
        <mesh geometry={bodyGeometry}>
          <meshPhysicalMaterial color={frameColor} metalness={0.8} roughness={0.35} />
        </mesh>

        {/* back shell colorway - glass on the 17 / Air, anodized aluminum on
            the Pros (see `shellFinish`) */}
        <mesh geometry={backGeometry} rotation-y={Math.PI} position-z={-shellZ}>
          <meshPhysicalMaterial color={color} {...shellFinish} />
        </mesh>

        {/* cover glass (the black ring visible around the display) */}
        <mesh geometry={glassGeometry} position-z={body.depth / 2 + 0.002}>
          <meshPhysicalMaterial color="#020205" metalness={0.1} roughness={0.08} clearcoat={1} />
        </mesh>

        {/* Ceramic Shield window on the aluminum unibody (Pro / Pro Max) */}
        {backWindow && backWindowGeometry && (
          <mesh
            geometry={backWindowGeometry}
            rotation-y={Math.PI}
            position={[0, backWindow.y, -body.depth / 2 - 0.003]}
          >
            <meshPhysicalMaterial
              color={color}
              metalness={0.15}
              roughness={0.16}
              clearcoat={1}
              clearcoatRoughness={0.1}
            />
          </mesh>
        )}

        {/* rear camera pedestal (pill or full-width plateau) - same material as
            the shell it is part of */}
        <mesh
          geometry={pedestalGeometry}
          rotation-y={Math.PI}
          position={[rearCamera.frame.x, rearCamera.frame.y, -shellZ]}
        >
          <meshPhysicalMaterial color={pedestalColor} {...pedestalFinish} />
        </mesh>

        {/* lens stacks: the collar standing proud of the pedestal (colour-
            matched aluminium on the 17, mirror titanium on the Air, the
            unibody's own anodized metal on the Pros), black lip, clear
            sapphire and the optics deep under it */}
        {rearCamera.lenses.map(({ x, y, r, h, pupil, glint, bore, iris }, i) => (
          <group key={i} position={[x, y, -pedestalTop]}>
            <LensRing
              r={r}
              proud={h ?? 0.05}
              frameColor={aluminum ? pedestalColor : frameColor}
              element="#0d1524"
              pupil={pupil}
              glint={glint}
              matte={rearCamera.ringFinish !== 'polished'}
              collar={rearCamera.ringCollar}
              step={rearCamera.ringStep}
              bore={bore}
              iris={iris}
              sealed
            />
          </group>
        ))}

        {/* True Tone flash, on the plateau (Pros) or out on the glass (17) */}
        <group
          position={[
            rearCamera.flash.x,
            rearCamera.flash.y,
            mountZ(rearCamera.flash.x, rearCamera.flash.y),
          ]}
        >
          <FlashModule r={rearCamera.flash.r} fresnel />
        </group>

        {/* auxiliary openings: the LiDAR scanner is a black-glass window, the
            mic a drilled hole - identical circles on the drawing, and nothing
            alike to look at */}
        {rearCamera.dots?.map(({ x, y, r, kind }, i) => (
          <group key={i} position={[x, y, mountZ(x, y)]}>
            {kind === 'sensor' ? (
              <SensorWindow r={r} lip={aluminum ? pedestalColor : frameColor} />
            ) : (
              // flush, not a stub standing off the shell: a 1 mm mic hole
              // extruded even a fraction of a millimeter reads as a peg the
              // moment the device turns
              <mesh rotation-y={Math.PI} position-z={-0.0008}>
                <circleGeometry args={[r, 20]} />
                <meshPhysicalMaterial
                  color="#08090c"
                  metalness={0.1}
                  roughness={0.7}
                  envMapIntensity={0.2}
                />
              </mesh>
            )}
          </group>
        ))}

        {/* Apple badge - on the Pros it sits ON the raised Ceramic Shield
            window, so it must clear that panel's outer face, not the bare glass */}
        {spec.logo && logoGeometry && (
          <mesh
            geometry={logoGeometry}
            rotation-y={Math.PI}
            position={[0, spec.logo.y, -body.depth / 2 - (backWindow ? 0.021 : 0.0085)]}
          >
            <meshPhysicalMaterial
              color={logoColor}
              metalness={0.55}
              roughness={0.08}
              clearcoat={1}
              clearcoatRoughness={0.05}
              envMapIntensity={1.2}
              polygonOffset
              polygonOffsetFactor={-1}
            />
          </mesh>
        )}

        {/* side keys, spec-accurate: Action + volume on the left rail, side button
            + the flush Camera Control on the right - pills protruding a true-to-hardware
            ~0.3-0.45 mm (Camera Control sits flush, seated in the rail) */}
        {buttons.map(({ edge, y, length, flush }, i) => (
          <SideKey
            key={i}
            side={edge === 'right' ? 1 : -1}
            railX={body.width / 2}
            y={y}
            length={length}
            thickness={buttonProfile.thickness}
            protrusion={buttonProfile.protrusion}
            color={frameColor}
            flush={flush}
          />
        ))}

        {/* antenna strips crossing both rails */}
        {spec.antennaLines?.map((y, i) => (
          <React.Fragment key={i}>
            {[-1, 1].map((side) => (
              <mesh key={side} position={[side * (body.width / 2 - 0.005), y, 0]}>
                <boxGeometry args={[0.012, 0.04, body.depth * 0.86]} />
                <meshStandardMaterial color="#20242a" transparent opacity={0.32} roughness={0.7} />
              </mesh>
            ))}
          </React.Fragment>
        ))}

        {/* RF window centered on the top edge (Pro Max) */}
        {spec.topWindow && (
          <RoundedBox
            args={[spec.topWindow.width, 0.014, spec.topWindow.height]}
            radius={0.006}
            position={[0, body.height / 2 + 0.001, 0]}
          >
            <meshStandardMaterial color="#22262c" transparent opacity={0.3} roughness={0.7} />
          </RoundedBox>
        )}

        {/* bottom edge: the USB-C, drilled speaker holes and screw recesses are
            real cavities cut from the chassis above - these are their interiors */}
        {spec.bottomEdge && (
          <>
            <UsbC
              x={spec.bottomEdge.usb.x}
              y={-body.height / 2}
              width={spec.bottomEdge.usb.width}
              height={spec.bottomEdge.usb.height}
            />
            {/* pentalobe screw heads, seated just inside their recesses */}
            {spec.bottomEdge.screws?.map(({ x, r }, i) => (
              <mesh key={`s${i}`} position={[x, -body.height / 2 + 0.013, 0]}>
                <cylinderGeometry args={[r - 0.0025, r - 0.0025, 0.008, 16]} />
                <meshPhysicalMaterial color="#caccd0" metalness={0.9} roughness={0.35} />
              </mesh>
            ))}
            {spec.bottomEdge.speakers?.map(({ x, r }, i) => (
              <EdgeSocket
                key={`h${i}`}
                position={[x, -body.height / 2, 0]}
                r={r}
                depth={0.05}
                lip={0.006}
              />
            ))}
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
          // The Dynamic Island is part of the hardware, so it is always drawn:
          // it eats the same strip of your layout here that it eats on the real
          // panel, which is most of the point of looking at a mockup.
          safeAreaTop={statusBarSafeAreaTop(statusBar, statusBarPlacement)}
          overlay={
            <>
            {renderStatusBar(statusBar, statusBarPlacement)}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                // the island hugs the panel's physical top - the left edge in landscape
                ...(landscape
                  ? {
                      left: px(island.offsetY - island.height / 2),
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: px(island.height),
                      height: px(island.width),
                      flexDirection: 'column' as const,
                    }
                  : {
                      top: px(island.offsetY - island.height / 2),
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: px(island.width),
                      height: px(island.height),
                      flexDirection: 'row' as const,
                    }),
                borderRadius: px(island.height / 2),
                background: '#020308',
                boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.04)',
                pointerEvents: 'none',
                zIndex: 2147483647,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                padding: landscape ? `0 0 ${px(0.05)}px 0` : `0 ${px(0.05)}px 0 0`,
              }}
            >
              <div
                style={{
                  width: px(0.09),
                  height: px(0.09),
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle at 38% 38%, #1b2436 0%, #05060a 55%, #000 100%)',
                }}
              />
            </div>
            </>
          }
        >
          {screen?.children}
        </DeviceScreen>
      </group>
    </group>
  )
}
IPhoneImpl.displayName = 'IPhone'

/** The device's compound slots, shared by `<IPhone>` and `<IPhoneMockup>`. */
export const iPhoneSlots = createSlots(SCREEN_REGIONS)

export const IPhone = Object.assign(IPhoneImpl, iPhoneSlots)
