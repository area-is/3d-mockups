import * as React from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import {
  GALAXY_TAB_COLORWAYS,
  GALAXY_TAB_DEFAULT_VARIANT,
  IPAD_COLORWAYS,
  IPAD_DEFAULT_VARIANT,
  findColorway,
  TABLET_VARIANTS,
  SCREEN_REGIONS,
  type Colorway,
  type GalaxyTabVariant,
  type IPadVariant,
  type TabletVariant,
  roundedRectShape,
} from '@area-3d-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { createLogoGeometry } from '../logos'
import { createWordmarkTexture } from '../wordmark'
import { LensRing, UsbC, cutGeometry, stadiumCutter, USB_CUT_DEPTH } from '../details'
import { collectSlots, createSlots, resolveSurface, type SurfaceProps } from '../../slots'

type GroupProps = ThreeElements['group']

// Machined USB-C opening, measured off the reference A16 scan: ~9.9 × 3.2 mm
// stadium at the tablet world scale (64 mm/unit). Same receptacle across the
// lineup — the connector is the standard part, only its edge differs.
const USB_WIDTH = 0.155
const USB_HEIGHT = 0.05

/**
 * Everything both tablet families take. Each brand's component adds its own
 * `variant` union on top.
 */
export interface TabletCommonProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceProps {
  /**
   * Anything you want on the tablet screen: React components, an <iframe>, a
   * <video>… Wrap in `<IPad.Screen>` / `<GalaxyTab.Screen>` to set per-screen
   * surface props.
   */
  children?: React.ReactNode
  /**
   * `landscape` lays the device on its side and swaps the virtual display to
   * H×W with upright content — exactly like rotating the real tablet.
   */
  orientation?: 'portrait' | 'landscape'
  /**
   * Body color. Takes a retail colorway id from the family's catalog
   * (`IPAD_COLORWAYS` / `GALAXY_TAB_COLORWAYS` — iPad Pro Space Black and
   * Silver, iPad Air Space Gray / Starlight / Purple / Blue, Galaxy Tab
   * Gray and Silver) or any CSS color for a custom finish. A colorway id
   * wins over a CSS color of the same name — pass hex if you meant the CSS one.
   */
  color?: string
  /**
   * CSS pixel width of the virtual display in the current orientation. Height
   * follows the panel aspect. Defaults to the device's logical grid — e.g.
   * the 13" iPad Pro gives 1032×1376 in portrait and 1376×1032 in landscape —
   * so content and breakpoints lay out just like on the real device.
   */
  resolution?: number
}

/** The shared implementation's props: one variant space over every spec. */
interface TabletBodyProps extends TabletCommonProps {
  variant: TabletVariant
  /** The family's colorway catalog, for resolving the `colorway` id. */
  catalog: Colorway[]
}

/**
 * The tablet both families are built from — an ultra-thin flat slab machined
 * out of its spec: thin bezels, the spec's rear camera (the iPad Pro's pod with
 * LiDAR and flash, the Air's and iPad's bare single lens, the Galaxy Tab's
 * protruding rings), its buttons, brand mark and model wordmark on the back,
 * speaker machining on the short edges, landscape-edge front camera and USB-C.
 * No 3D asset files are loaded — everything is generated from geometry at
 * runtime.
 */
function TabletBody({
  children,
  variant,
  catalog,
  orientation = 'portrait',
  color: colorProp,
  surfaceBackground = '#000000',
  resolution,
  surfaceStyle,
  ...groupProps
}: TabletBodyProps) {
  const screen = collectSlots(children, SCREEN_REGIONS).screen
  const spec = TABLET_VARIANTS[variant]
  // `color` doubles as the colorway selector: a catalog id resolves to
  // that retail finish, anything else is passed through as a raw CSS
  // color. Ids win over same-named CSS colors — pass hex for those.
  const retail = findColorway(catalog, colorProp)
  const color = retail?.color ?? colorProp ?? '#2b292c'
  const { body, glass, display, rearCamera, stylus, notch, pogo, logo, backText, speakers } = spec
  const landscape = orientation === 'landscape'
  const aspect = display.height / display.width
  const res = resolution ?? Math.round(spec.resolution * (landscape ? aspect : 1))
  const isPad = rearCamera.style !== 'rings'

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
      bevelSegments: 3,
      curveSegments: 16,
    })
    geometry.translate(0, 0, -depth / 2)
    // The USB-C is a true machined cavity, not a decal: subtract a stadium
    // prism from the edge so the opening has a lip, walls and parallax.
    const edgeY = (spec.usbEdge === 'top' ? 1 : -1) * (body.height / 2)
    return cutGeometry(geometry, [
      stadiumCutter(USB_WIDTH, USB_HEIGHT, USB_CUT_DEPTH).translate(0, edgeY, 0),
    ])
  }, [body, spec.usbEdge])

  const glassGeometry = React.useMemo(
    () => new THREE.ShapeGeometry(roundedRectShape(glass.width, glass.height, glass.radius), 16),
    [glass]
  )

  const backGeometry = React.useMemo(
    () =>
      new THREE.ShapeGeometry(
        roundedRectShape(body.width - 0.05, body.height - 0.05, body.radius - 0.025),
        16
      ),
    [body]
  )

  const podGeometry = React.useMemo(() => {
    if (rearCamera.style !== 'pod') return null
    const bevel = 0.016
    const shape = roundedRectShape(
      rearCamera.size - bevel * 2,
      rearCamera.size - bevel * 2,
      rearCamera.radius - bevel
    )
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.02,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 3,
      curveSegments: 16,
    })
  }, [rearCamera])

  // Brand mark on the back: real vector geometry from the SVG. The retail
  // marks are polished inlays reading darker than the aluminum around them —
  // near-black gloss on Space Black, dark steel on the light finishes.
  const logoGeometry = React.useMemo(() => {
    if (!logo) return null
    const geometry = createLogoGeometry(logo.mark, logo.width, logo.height)
    // Samsung's wordmark lies along the edge in portrait. The turn is baked
    // into the geometry (not the mount group) so the back-face mirror keeps
    // the glyphs reading correctly — horizontal, left-to-right, when the
    // tablet is held landscape.
    if (logo.rotate) geometry.rotateZ(Math.PI / 2)
    return geometry
  }, [logo])
  const logoColor = React.useMemo(() => {
    const shift = logo?.mark === 'samsung' ? 0.5 : 0.72
    return `#${new THREE.Color(color).lerp(new THREE.Color('#000000'), shift).getHexString()}`
  }, [color, logo])

  // The model wordmark ("iPad Pro"…) printed small near the back's bottom.
  const backTextTexture = React.useMemo(
    () => (backText ? createWordmarkTexture(backText.text, { letterSpacing: 0.02, weight: 600 }) : null),
    [backText]
  )

  React.useEffect(() => {
    return () => {
      bodyGeometry.dispose()
      glassGeometry.dispose()
      backGeometry.dispose()
      podGeometry?.dispose()
      logoGeometry?.dispose()
      backTextTexture?.dispose()
    }
  }, [bodyGeometry, glassGeometry, backGeometry, podGeometry, logoGeometry, backTextTexture])

  // CSS px per world unit for the display overlay (Tab Ultra notch).
  const pxPerUnit = res / (landscape ? display.height : display.width)
  const px = (units: number) => units * pxPerUnit

  const backZ = -body.depth / 2

  // Machined pill sunk into the frame (top edge or right edge).
  const framePill = (key: React.Key, x: number, y: number, length: number, horizontal: boolean) => (
    <RoundedBox
      key={key}
      args={horizontal ? [length, 0.055, 0.05] : [0.055, length, 0.05]}
      radius={0.024}
      position={[x, y, 0]}
    >
      <meshPhysicalMaterial color={color} metalness={0.9} roughness={0.24} />
    </RoundedBox>
  )

  return (
    <group {...groupProps}>
      {/* landscape lays the body on its side; the screen counter-rotates below */}
      <group rotation-z={landscape ? Math.PI / 2 : 0}>
        {/* chassis — bead-blasted aluminum: mostly dielectric response so the
            anodized albedo reads true under the studio rig */}
        <mesh geometry={bodyGeometry}>
          <meshPhysicalMaterial color={color} metalness={0.6} roughness={0.4} envMapIntensity={0.9} />
        </mesh>

        {/* back panel */}
        <mesh geometry={backGeometry} rotation-y={Math.PI} position-z={backZ - 0.002}>
          <meshPhysicalMaterial color={color} metalness={0.15} roughness={0.5} envMapIntensity={1.2} />
        </mesh>

        {/* cover glass (thin uniform bezel ring around the display) */}
        <mesh geometry={glassGeometry} position-z={body.depth / 2 + 0.002}>
          <meshPhysicalMaterial color="#020205" metalness={0.1} roughness={0.08} clearcoat={1} />
        </mesh>

        {/* front camera — a dot in the bezel on the landscape-top (portrait
            right) edge, where every current iPad and the Tab S11 put it; the
            Tab Ultra's camera lives in its display notch instead */}
        {!notch && (
          <mesh
            rotation-x={Math.PI / 2}
            position={[display.width / 2 + (glass.width - display.width) / 4, 0, body.depth / 2 + 0.004]}
          >
            <cylinderGeometry args={[0.016, 0.016, 0.004, 16]} />
            <meshPhysicalMaterial color="#0a1420" metalness={0.4} roughness={0.2} clearcoat={1} />
          </mesh>
        )}

        {/* rear camera — iPad Pro pod: wide lens + LiDAR on the corner
            column, flash + sensor dot + mic inboard (positions mirror on the
            back, matching the retail pod's back-view layout) */}
        {rearCamera.style === 'pod' && podGeometry && (
          <>
            <mesh
              geometry={podGeometry}
              rotation-y={Math.PI}
              position={[rearCamera.x, rearCamera.y, backZ - 0.002]}
            >
              <meshPhysicalMaterial color={color} metalness={0.75} roughness={0.3} clearcoat={0.6} />
            </mesh>
            {(() => {
              // Apple's drawing places every element on a 20.04 mm-centered pod
              // (both Pro sizes share it): the wide lens and the LiDAR on the
              // outboard column 6.01 mm either side of center, and the ALS,
              // flash and mic on the inboard column 6.78 mm in — the flash
              // exactly on the pod's center line.
              const s = rearCamera.size / 0.4913
              // The pod's extruded face (depth + bevels) — contents sit ON it.
              const podZ = backZ - 0.044
              return (
                <group position={[rearCamera.x, rearCamera.y, podZ]}>
                  {/* 48MP wide — Ø10.83 opening, a flat black window with a
                      subtle dark collar (no bright metal ring on the retail pod) */}
                  <group position={[0.0939 * s, 0.0939 * s, 0]}>
                    <LensRing r={0.0984 * s} proud={0.022} seat={0.02} frameColor="#15171b" pupil={0.62} matte />
                  </group>
                  {/* LiDAR scanner — Ø8.41 black glass circle */}
                  <mesh rotation-x={Math.PI / 2} position={[0.0939 * s, -0.0939 * s, -0.004]}>
                    <cylinderGeometry args={[0.0657 * s, 0.0657 * s, 0.01, 32]} />
                    <meshPhysicalMaterial color="#0a0c11" metalness={0.35} roughness={0.14} clearcoat={1} envMapIntensity={0.5} />
                  </mesh>
                  {/* True Tone flash — Ø6.70 frosted window */}
                  <mesh rotation-x={Math.PI / 2} position={[-0.1059 * s, 0, -0.004]}>
                    <cylinderGeometry args={[0.0523 * s, 0.0523 * s, 0.01, 24]} />
                    <meshPhysicalMaterial color="#e9e6df" emissive="#fff3d6" emissiveIntensity={0.12} roughness={0.35} clearcoat={0.6} />
                  </mesh>
                  {/* ambient light sensor — Ø3.60 */}
                  <mesh rotation-x={Math.PI / 2} position={[-0.1059 * s, 0.1267 * s, -0.003]}>
                    <cylinderGeometry args={[0.0281 * s, 0.0281 * s, 0.008, 20]} />
                    <meshPhysicalMaterial color="#0b0d12" metalness={0.4} roughness={0.25} clearcoat={1} />
                  </mesh>
                  {/* pinhole mic — Ø1.72 */}
                  <mesh rotation-x={Math.PI / 2} position={[-0.1059 * s, -0.1241 * s, -0.002]}>
                    <cylinderGeometry args={[0.0134, 0.0134, 0.008, 12]} />
                    <meshStandardMaterial color="#08090c" roughness={0.6} />
                  </mesh>
                </group>
              )
            })()}
          </>
        )}

        {/* rear camera — iPad Air / iPad bare single lens: a polished ring
            rising straight out of the aluminum (no plate, no flash), with the
            pinhole mic beside it */}
        {rearCamera.style === 'single' && (
          <>
            {/* Apple draws a body-colored mound (Ø16.92) with the black lens
                window (Ø11.89) rising out of it, the whole stack standing
                ~2 mm off the back — blue iPads get a blue mound, exactly like
                the product photography */}
            {rearCamera.boss && (
              <mesh rotation-x={Math.PI / 2} position={[rearCamera.x, rearCamera.y, backZ - 0.009]}>
                <cylinderGeometry args={[rearCamera.boss * 0.96, rearCamera.boss, 0.019, 48]} />
                <meshPhysicalMaterial color={color} metalness={0.55} roughness={0.32} clearcoat={0.5} />
              </mesh>
            )}
            <group position={[rearCamera.x, rearCamera.y, backZ - (rearCamera.boss ? 0.019 : 0)]}>
              <LensRing r={rearCamera.r} proud={0.014} seat={0.03} frameColor={color} pupil={0.6} matte />
            </group>
            <mesh rotation-x={Math.PI / 2} position={[rearCamera.mic.x, rearCamera.mic.y, backZ - 0.004]}>
              <cylinderGeometry args={[0.011, 0.011, 0.008, 12]} />
              <meshStandardMaterial color="#08090c" roughness={0.6} />
            </mesh>
          </>
        )}

        {/* rear camera — Galaxy Tab floating rings + flash dot */}
        {rearCamera.style === 'rings' && (
          <>
            {rearCamera.rings.map(({ x, y, r }, i) => (
              <group key={i} position={[x, y, backZ]}>
                {/* protruding ring — dark gunmetal with a polished chamfer,
                    clearly darker than the body on both colorways */}
                <mesh rotation-x={Math.PI / 2} position-z={-0.016}>
                  <cylinderGeometry args={[r, r, 0.05, 40]} />
                  <meshPhysicalMaterial
                    color={`#${new THREE.Color(color).lerp(new THREE.Color('#0c0d10'), 0.55).getHexString()}`}
                    metalness={0.9}
                    roughness={0.22}
                  />
                </mesh>
                <mesh rotation-x={Math.PI / 2} position-z={-0.042}>
                  <cylinderGeometry args={[r * 0.84, r * 0.84, 0.008, 40]} />
                  <meshPhysicalMaterial color="#05070d" metalness={0.2} roughness={0.12} clearcoat={1} envMapIntensity={0.15} />
                </mesh>
                <mesh rotation-x={Math.PI / 2} position-z={-0.048}>
                  <cylinderGeometry args={[r * 0.4, r * 0.4, 0.008, 32]} />
                  <meshPhysicalMaterial color="#0c1526" metalness={0.4} roughness={0.12} clearcoat={1} envMapIntensity={0.5} />
                </mesh>
              </group>
            ))}
            <mesh rotation-x={Math.PI / 2} position={[rearCamera.flash.x, rearCamera.flash.y, backZ - 0.008]}>
              <cylinderGeometry args={[0.034, 0.034, 0.014, 24]} />
              <meshPhysicalMaterial color="#efe9da" emissive="#fff3d6" emissiveIntensity={0.2} roughness={0.4} />
            </mesh>
          </>
        )}

        {/* brand mark on the back — Apple's glyph centered upright, or the
            SAMSUNG wordmark near the corner diagonal from the cameras, laid
            along the edge in portrait exactly like the print */}
        {logo && logoGeometry && (
          <group position={[logo.x ?? 0, logo.y, backZ - 0.004]} rotation-y={Math.PI}>
            <mesh geometry={logoGeometry}>
              <meshPhysicalMaterial
                color={logoColor}
                metalness={0.75}
                roughness={0.16}
                clearcoat={1}
                clearcoatRoughness={0.12}
                envMapIntensity={0.9}
                polygonOffset
                polygonOffsetFactor={-1}
              />
            </mesh>
          </group>
        )}

        {/* model wordmark printed small near the back's bottom (iPads) */}
        {backText && backTextTexture && (
          <mesh rotation-y={Math.PI} position={[0, backText.y, backZ - 0.004]}>
            <planeGeometry args={[backText.height * 6.4, backText.height]} />
            <meshPhysicalMaterial
              map={backTextTexture}
              transparent
              opacity={0.55}
              color={logoColor}
              metalness={0.6}
              roughness={0.35}
              polygonOffset
              polygonOffsetFactor={-1}
            />
          </mesh>
        )}

        {/* Pencil charging window — the flat antenna strip on the portrait
            right edge (landscape top), flush with the rail. The Galaxy Tabs'
            S Pen clips magnetically to a clean edge, so they render nothing. */}
        {isPad && stylus && (
          <RoundedBox
            args={[0.012, stylus.length, 0.05]}
            radius={0.005}
            position={[body.width / 2 - 0.002, stylus.offsetY, 0]}
          >
            <meshPhysicalMaterial color={color} metalness={0.3} roughness={0.6} envMapIntensity={0.5} />
          </RoundedBox>
        )}

        {/* the standard iPad's edge Smart Connector: a slim stadium plate
            sunk into the left rail, carrying the three contacts */}
        {pogo?.surface === 'edge' && (
          <RoundedBox
            args={[0.012, 0.205, 0.06]}
            radius={0.005}
            position={[-body.width / 2 + 0.001, pogo.y, 0]}
          >
            <meshPhysicalMaterial
              color={`#${new THREE.Color(color).lerp(new THREE.Color('#5c5f66'), 0.4).getHexString()}`}
              metalness={0.6}
              roughness={0.4}
            />
          </RoundedBox>
        )}

        {/* keyboard contacts: the iPads' back Smart Connector row / edge
            dots, or the Galaxy Tabs' silver column near the portrait-left edge */}
        {pogo &&
          [-1, 0, 1].map((i) => {
            const off = i * pogo.spacing
            const pos: [number, number, number] =
              pogo.axis === 'x' ? [pogo.x + off, pogo.y, 0] : [pogo.x, pogo.y + off, 0]
            if (pogo.surface === 'edge') {
              return (
                <mesh
                  key={i}
                  rotation-z={Math.PI / 2}
                  position={[-body.width / 2 + 0.002, pogo.y + off, 0]}
                >
                  {/* Ø3.20 pins per Apple's rail drawing */}
                  <cylinderGeometry args={[0.025, 0.025, 0.006, 20]} />
                  <meshPhysicalMaterial color="#9aa0a8" metalness={0.9} roughness={0.3} />
                </mesh>
              )
            }
            return (
              <mesh
                key={i}
                rotation-x={Math.PI / 2}
                position={[pos[0], pos[1], backZ - 0.004]}
              >
                {/* the iPads' Smart Connector pins are Ø3.40 per Apple's drawing */}
                <cylinderGeometry args={[isPad ? 0.0266 : 0.019, isPad ? 0.0266 : 0.019, 0.006, 20]} />
                <meshPhysicalMaterial color="#c3c7cd" metalness={0.95} roughness={0.3} />
              </mesh>
            )
          })}

        {/* buttons — machined pills seated in the frame. iPads: the top
            (Touch ID) button on the top edge + two separate volume pills on
            the right edge. Tabs: volume rocker nearer the corner, then the
            power key, on the right edge (the top edge in landscape). */}
        {spec.topButton &&
          framePill('top', spec.topButton.x, body.height / 2 - 0.014, spec.topButton.length, true)}
        {spec.sideButtons.map(({ y, length }, i) =>
          framePill(i, body.width / 2 - 0.014, y, length, false)
        )}

        {/* speaker machining on the short edges: iPad drilled hole clusters /
            Galaxy Tab milled slots, mirrored top and bottom */}
        {speakers &&
          [1, -1].map((edge) =>
            speakers.style === 'holes'
              ? speakers.xs.map((cx, ci) => {
                  // The top button truncates the top-right run: drop holes
                  // from the OUTER end, keeping the inner end anchored.
                  const trim = edge === 1 && cx > 0 ? (speakers.topTrim ?? 0) : 0
                  const n = speakers.count - trim
                  const shift = -Math.sign(cx) * (trim * speakers.spacing) / 2
                  return Array.from({ length: n }, (_, hi) => (
                    <mesh
                      key={`${edge}-${ci}-${hi}`}
                      position={[
                        cx + shift + (hi - (n - 1) / 2) * speakers.spacing,
                        edge * (body.height / 2 + 0.001),
                        0,
                      ]}
                    >
                      <cylinderGeometry args={[speakers.r, speakers.r, 0.006, 10]} />
                      <meshStandardMaterial color="#0b0c10" roughness={0.6} />
                    </mesh>
                  ))
                })
              : speakers.xs.map((cx, ci) => (
                  <RoundedBox
                    key={`${edge}-${ci}`}
                    args={[speakers.length, 0.012, speakers.width]}
                    radius={0.005}
                    position={[cx, edge * (body.height / 2 + 0.001), 0]}
                    rotation-x={Math.PI / 2}
                  >
                    <meshStandardMaterial color="#0b0c10" roughness={0.6} />
                  </RoundedBox>
                ))
          )}

        {/* USB-C interior for the cavity machined into the body above:
            stainless receptacle shell, dark floor, gold pin tongue. Centered
            on the bottom edge on iPads; the Galaxy Tabs put it on the
            portrait-top edge (landscape left) */}
        <UsbC
          y={(spec.usbEdge === 'top' ? 1 : -1) * (body.height / 2)}
          width={USB_WIDTH}
          height={USB_HEIGHT}
          inward={spec.usbEdge === 'top' ? -1 : 1}
        />

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
          overlay={
            notch ? (
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  // the Tab Ultra notch lives on the landscape-top edge — the
                  // right edge when the tablet is held in portrait
                  ...(landscape
                    ? { top: 0, left: '50%', transform: 'translateX(-50%)', width: px(notch.width), height: px(notch.height), borderRadius: `0 0 ${px(notch.radius)}px ${px(notch.radius)}px` }
                    : { right: 0, top: '50%', transform: 'translateY(-50%)', width: px(notch.height), height: px(notch.width), borderRadius: `${px(notch.radius)}px 0 0 ${px(notch.radius)}px` }),
                  background: '#04050a',
                  pointerEvents: 'none',
                  zIndex: 2147483647,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: px(0.045),
                    height: px(0.045),
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 38% 38%, #1c2536 0%, #05060a 60%, #000 100%)',
                  }}
                />
              </div>
            ) : undefined
          }
        >
          {screen?.children}
        </DeviceScreen>
      </group>
    </group>
  )
}
TabletBody.displayName = 'TabletBody'

/** The compound slots both tablets share with their mockups. */
export const tabletSlots = createSlots(SCREEN_REGIONS)

export interface IPadProps extends TabletCommonProps {
  /**
   * Which iPad to render, at true relative sizes: `ipadpro13` (default) or
   * `ipadpro11` — camera pod with LiDAR, Face ID, Thunderbolt — `ipadair13` /
   * `ipadair11` (bare single lens, Touch ID top button), or `ipad11`, the
   * standard A16 iPad.
   */
  variant?: IPadVariant
}

/**
 * A procedurally built iPad: the ultra-thin flat slab with thin uniform
 * bezels, the family's rear camera (the Pro's rounded-square pod carrying the
 * wide lens, LiDAR and flash; the Air's and iPad's bare polished lens), the
 * top button, volume pills, Apple Pencil charging strip, Smart Connector pogo
 * dots, the Apple glyph and model wordmark on the back, and drilled speaker
 * clusters in both short edges.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 */
function IPadImpl({ variant = IPAD_DEFAULT_VARIANT, ...props }: IPadProps) {
  return <TabletBody variant={variant} catalog={IPAD_COLORWAYS[variant]} {...props} />
}
IPadImpl.displayName = 'IPad'

export const IPad = Object.assign(IPadImpl, tabletSlots)

export interface GalaxyTabProps extends TabletCommonProps {
  /**
   * Which Galaxy Tab to render, at true relative sizes: `tabs11` (Tab S11,
   * 11" — the default) or `tabs11ultra` (Tab S11 Ultra, 14.6", with the
   * display notch and dual camera rings).
   */
  variant?: GalaxyTabVariant
}

/**
 * A procedurally built Galaxy Tab S11: the ultra-thin slab with its floating
 * camera rings and flash, volume rocker and power key, the magnetic S Pen
 * side-mount, keyboard pogo column, SAMSUNG wordmark set for the landscape
 * hold, milled speaker slots near all four corners — and, on the Ultra, the
 * front camera's display notch.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 */
function GalaxyTabImpl({ variant = GALAXY_TAB_DEFAULT_VARIANT, ...props }: GalaxyTabProps) {
  return <TabletBody variant={variant} catalog={GALAXY_TAB_COLORWAYS[variant]} {...props} />
}
GalaxyTabImpl.displayName = 'GalaxyTab'

export const GalaxyTab = Object.assign(GalaxyTabImpl, tabletSlots)
