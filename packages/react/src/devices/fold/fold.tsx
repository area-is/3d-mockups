import * as React from 'react'
import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'
import {
  FOLD_COLORWAYS,
  findColorway,
  FOLD_VARIANTS,
  FOLD_DEFAULT_VARIANT,
  SCREEN_REGIONS,
  type FoldVariant,
} from '@area-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { createLogoGeometry } from '../logos'
import {
  SideKey,
  LensRing,
  UsbC,
  EdgeSocket,
  cutGeometry,
  mixedRoundedRectShape,
  stadiumCutter,
  holeCutter,
  USB_CUT_DEPTH,
} from '../details'
import { roundedRectShape } from '@area-mockups/core'
import { useScreenOccluders } from '../../screen/occluders'
import { collectSlots, createSlots, resolveSurface, type SurfaceDefaults } from '../../slots'

type GroupProps = ThreeElements['group']

export interface FoldProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Anything you want on the active display: React components, an <iframe>, a
   * <video>… Wrap in `<Fold.Screen>` to set per-screen surface props.
   */
  children?: React.ReactNode
  /** Which Galaxy Z Fold device to render. */
  variant?: FoldVariant
  /**
   * A retail colorway id from `FOLD_COLORWAYS` (e.g. the catalog's first
   * entry) presetting the device colors. Explicit color props override it.
   */
  colorway?: string
  /**
   * `true` (default) renders the unfolded tablet — your content fills the large,
   * nearly square inner display (with a faint center crease). `false` renders the
   * folded candy-bar — your content fills the tall cover display and the rear
   * triple camera shows on the back.
   */
  open?: boolean
  /**
   * Degree of openness between the two panels (0 = folded shut, 180 = flat
   * open), overriding `open` when set. Intermediate angles render the real
   * Flex Mode book pose: the panels pivot around the hinge line, the spine's
   * flat band (with its SAMSUNG engraving) bisects the fold, and your
   * content bends across the crease — e.g. `openAngle={110}` for the
   * half-open standing pose. The pose is continuous from nearly shut to
   * nearly flat; only ~0° snaps to the dedicated folded pose and ~177°+
   * to the flat-open one. At intermediate angles the inner display is
   * composited from two planes, so stateful screen content is best kept
   * simple.
   */
  openAngle?: number
  /**
   * `landscape` lays the device on its side and swaps the virtual display to
   * H×W with upright content — exactly like rotating the real device.
   */
  orientation?: 'portrait' | 'landscape'
  /** Back panel colorway. */
  color?: string
  /** Metal frame, buttons and camera-ring color. */
  frameColor?: string
  /**
   * CSS pixel width of the active display in the current orientation. Height
   * follows the panel aspect. Defaults to the device's logical resolution for
   * whichever screen is showing (inner display when open, cover when closed).
   */
  resolution?: number
  /** Show the front-camera punch-hole overlay. */
  punchHole?: boolean
  /**
   * How screen content hides when the device faces away from the camera.
   * `true` raycasts against the body (fast, interactive). `'blending'` uses
   * per-pixel depth blending. `false` disables hiding.
   */
  occlude?: boolean | 'blending'
}

/** An extruded rounded-rect slab with a soft edge bevel (a fold half / the open body). */
function slabGeometry(width: number, height: number, radius: number, depth: number, bevel: number) {
  const shape = roundedRectShape(width - bevel * 2, height - bevel * 2, radius - bevel)
  const core = depth - bevel * 2
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: core,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 16,
  })
  g.translate(0, 0, -core / 2)
  return g
}

/**
 * A procedurally built Samsung Galaxy Z Fold 7. One device, two form factors:
 * the unfolded tablet (big inner display) and the folded candy-bar — two
 * stacked slabs with the real crevice of air between them — switched with the
 * `open` prop. No 3D asset files are loaded — the whole device is generated
 * from geometry at runtime.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 */
function FoldImpl({
  children,
  variant = FOLD_DEFAULT_VARIANT,
  open = true,
  openAngle,
  orientation = 'portrait',
  colorway,
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
}: FoldProps) {
  const screenSlot = collectSlots(children, SCREEN_REGIONS).screen
  const spec = FOLD_VARIANTS[variant]
  const retail = findColorway(FOLD_COLORWAYS[variant], colorway)
  const color = colorProp ?? retail?.color ?? '#3a3d42'
  const frameColor = frameColorProp ?? retail?.frameColor ?? '#54585f'
  // Resolve the pose: an explicit fold angle wins over the boolean; the
  // extremes snap to the dedicated flat-open / folded-shut paths so the
  // default renders are pixel-identical to before. The flex rig pivots on
  // the display surface, so the pose is continuous all the way down —
  // only ~0° itself snaps to the dedicated folded pose.
  const angle = openAngle === undefined ? (open ? 180 : 0) : Math.max(0, Math.min(180, openAngle))
  const mode: 'open' | 'closed' | 'flex' = angle >= 177 ? 'open' : angle < 0.5 ? 'closed' : 'flex'
  const isOpenFace = mode !== 'closed'
  const state = isOpenFace ? spec.open : spec.closed
  const cam = isOpenFace ? spec.rearCamera.open : spec.rearCamera.closed
  const { body, display } = state
  const landscape = orientation === 'landscape'
  const aspect = display.height / display.width
  const res = resolution ?? Math.round(state.resolution * (landscape ? aspect : 1))
  // Open pose: one body mesh. Closed pose: front (cover) + rear (camera) slabs.
  const bodyRef = React.useRef<THREE.Mesh>(null!)
  const rearRef = React.useRef<THREE.Mesh>(null!)
  const occludeRefs = useScreenOccluders(bodyRef, rearRef)
  // This device's screens occlude against OTHER registered bodies only. The
  // backface culler already hides a screen the camera can't face, and at
  // oblique views the sample rays graze our own slabs (or cross the crease
  // into the sibling half), hiding a display that is mostly visible — the
  // all-black main screen at side-on angles. Own shells stay registered so
  // they still occlude every other mockup in the scene.
  const otherOccludeRefs = React.useMemo(
    () => occludeRefs.filter((ref) => ref !== bodyRef && ref !== rearRef),
    [occludeRefs]
  )

  // The folded stack: body.depth spans both slabs plus the crevice between them.
  const gap = spec.closed.gap
  const halfDepth = (spec.closed.body.depth - gap) / 2
  const halfZ = gap / 2 + halfDepth / 2

  // Unfolded chassis with its bottom-edge machining (USB, speakers, mics).
  const openGeometry = React.useMemo(() => {
    const b = spec.open.body
    const edge = spec.bottomEdge.open
    const bottom = -b.height / 2
    return cutGeometry(slabGeometry(b.width, b.height, b.radius, b.depth, b.bevel), [
      stadiumCutter(edge.usb.width, edge.usb.height, USB_CUT_DEPTH).translate(edge.usb.x, bottom, 0),
      ...edge.speakers.map((sp) =>
        stadiumCutter(sp.width, sp.height, 0.06).translate(sp.x, bottom, 0)
      ),
      ...(edge.mics ?? []).map(({ x, r }) => holeCutter(r, 0.05).translate(x, bottom, 0)),
    ])
  }, [spec.open.body, spec.bottomEdge.open])

  // Folded slabs, each machining its own opening: the speaker lives on the
  // cover (front) half, the USB-C on the camera (rear) half — like the scan.
  const frontHalfGeometry = React.useMemo(() => {
    const b = spec.closed.body
    const sp = spec.bottomEdge.closed.speaker
    return cutGeometry(slabGeometry(b.width, b.height, b.radius, halfDepth, b.bevel), [
      stadiumCutter(sp.width, sp.height, 0.06).translate(sp.x, -b.height / 2, 0),
    ])
  }, [spec.closed.body, spec.bottomEdge.closed, halfDepth])
  const rearHalfGeometry = React.useMemo(() => {
    const b = spec.closed.body
    const usb = spec.bottomEdge.closed.usb
    return cutGeometry(slabGeometry(b.width, b.height, b.radius, halfDepth, b.bevel), [
      stadiumCutter(usb.width, usb.height, USB_CUT_DEPTH).translate(usb.x, -b.height / 2, 0),
    ])
  }, [spec.closed.body, spec.bottomEdge.closed, halfDepth])

  // Flex pose panels: the open slab split at the hinge line, each half
  // machining only the bottom-edge openings that live on its side. The
  // fold-side corners are nearly square (the display bends there — the real
  // panels run straight into the hinge), so the two panels stay tight at
  // the crease instead of opening rounded-corner gaps.
  const flexGeometries = React.useMemo(() => {
    if (mode !== 'flex') return null
    const b = spec.open.body
    const hw = b.width / 2
    const edge = spec.bottomEdge.open
    const bottom = -b.height / 2
    const cutters = (side: -1 | 1) => {
      const localX = (x: number) => x - (side * hw) / 2
      const items: THREE.BufferGeometry[] = []
      if (Math.sign(edge.usb.x) === side)
        items.push(stadiumCutter(edge.usb.width, edge.usb.height, USB_CUT_DEPTH).translate(localX(edge.usb.x), bottom, 0))
      for (const sp of edge.speakers)
        if (Math.sign(sp.x) === side)
          items.push(stadiumCutter(sp.width, sp.height, 0.06).translate(localX(sp.x), bottom, 0))
      for (const m of edge.mics ?? [])
        if (Math.sign(m.x) === side)
          items.push(holeCutter(m.r, 0.05).translate(localX(m.x), bottom, 0))
      return items
    }
    const panelSlab = (foldSide: -1 | 1) => {
      const rFree = b.radius - b.bevel
      const rFold = 0.008
      const corners =
        foldSide === 1
          ? { tl: rFree, tr: rFold, br: rFold, bl: rFree }
          : { tl: rFold, tr: rFree, br: rFree, bl: rFold }
      const shape = mixedRoundedRectShape(hw - b.bevel * 2, b.height - b.bevel * 2, corners)
      const core = b.depth - b.bevel * 2
      const g = new THREE.ExtrudeGeometry(shape, {
        depth: core,
        bevelEnabled: true,
        bevelThickness: b.bevel,
        bevelSize: b.bevel,
        bevelSegments: 4,
        curveSegments: 16,
      })
      g.translate(0, 0, -core / 2)
      return g
    }
    return {
      left: cutGeometry(panelSlab(1), cutters(-1)),
      right: cutGeometry(panelSlab(-1), cutters(1)),
      back: new THREE.ShapeGeometry(
        roundedRectShape(hw - 0.05, b.height - 0.05, Math.max(0.02, b.radius - 0.025)),
        16
      ),
      glass: new THREE.ShapeGeometry(
        roundedRectShape(hw - 0.03, b.height - 0.03, Math.max(0.02, b.radius - 0.015)),
        16
      ),
    }
  }, [mode, spec.open.body, spec.bottomEdge.open])
  React.useEffect(
    () => () => {
      flexGeometries?.left.dispose()
      flexGeometries?.right.dispose()
      flexGeometries?.back.dispose()
      flexGeometries?.glass.dispose()
    },
    [flexGeometries]
  )

  const backGeometry = React.useMemo(
    () =>
      new THREE.ShapeGeometry(
        roundedRectShape(body.width - 0.05, body.height - 0.05, Math.max(0.02, body.radius - 0.025)),
        16
      ),
    [body]
  )

  const glassGeometry = React.useMemo(
    () =>
      new THREE.ShapeGeometry(
        roundedRectShape(body.width - 0.03, body.height - 0.03, Math.max(0.02, body.radius - 0.015)),
        16
      ),
    [body]
  )

  // Camera pedestal: the light plateau plate with the dark pill on top of it.
  const pillGeometry = (part: { width: number; height: number; radius: number; raise: number }) => {
    const bevel = 0.014
    const shape = roundedRectShape(part.width - bevel * 2, part.height - bevel * 2, part.radius - bevel)
    return new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(0.008, part.raise - bevel),
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 3,
      curveSegments: 16,
    })
  }
  const plateauGeometry = React.useMemo(() => pillGeometry(cam.plateau), [cam.plateau])
  const islandGeometry = React.useMemo(() => pillGeometry(cam.island), [cam.island])

  // The (off) cover-display glass on the back of the open pose's left half.
  const coverGlassGeometry = React.useMemo(() => {
    if (mode === 'closed') return null
    const c = spec.closed
    return new THREE.ShapeGeometry(
      roundedRectShape(c.display.width + 0.03, c.display.height + 0.06, c.display.radius + 0.02),
      16
    )
  }, [mode, spec.closed])
  React.useEffect(() => () => coverGlassGeometry?.dispose(), [coverGlassGeometry])

  // The vertical SAMSUNG emboss on the hinge spine — vector geometry from the SVG.
  const spineLogoGeometry = React.useMemo(
    () => createLogoGeometry('samsung', spec.hinge.emboss.length, spec.hinge.emboss.length * 0.155),
    [spec.hinge.emboss.length]
  )

  React.useEffect(() => {
    return () => {
      openGeometry.dispose()
      frontHalfGeometry.dispose()
      rearHalfGeometry.dispose()
      backGeometry.dispose()
      glassGeometry.dispose()
      plateauGeometry.dispose()
      islandGeometry.dispose()
      spineLogoGeometry.dispose()
    }
  }, [
    openGeometry,
    frontHalfGeometry,
    rearHalfGeometry,
    backGeometry,
    glassGeometry,
    plateauGeometry,
    islandGeometry,
    spineLogoGeometry,
  ])

  // CSS px per world unit for display overlays.
  const pxPerUnit = res / (landscape ? display.height : display.width)
  const px = (units: number) => units * pxPerUnit

  const holeX = isOpenFace ? spec.open.punchHole.offsetX : 0
  const holeOffsetY = state.punchHole.offsetY
  const holeR = state.punchHole.radius

  const chassisMaterial = (
    <meshPhysicalMaterial color={frameColor} metalness={0.85} roughness={0.32} />
  )

  const spineLogoMaterial = (
    <meshPhysicalMaterial
      transparent
      opacity={0.45}
      color="#3c4046"
      metalness={0.7}
      roughness={0.35}
      polygonOffset
      polygonOffsetFactor={-1}
    />
  )

  // Camera cluster on a back face at `backZ` (local to its slab/body group).
  const cameraCluster = (backZ: number) => (
    <>
      <mesh
        geometry={plateauGeometry}
        rotation-y={Math.PI}
        position={[cam.plateau.x, cam.plateau.y, backZ - 0.002]}
      >
        <meshPhysicalMaterial color={color} metalness={0.4} roughness={0.32} clearcoat={0.8} />
      </mesh>
      {/* the lens housing matches the body color on the real device — an
          anodized boss, not a black plate (only the lens glass is dark) */}
      <mesh
        geometry={islandGeometry}
        rotation-y={Math.PI}
        position={[cam.island.x, cam.island.y, backZ - cam.plateau.raise]}
      >
        <meshPhysicalMaterial color={color} metalness={0.4} roughness={0.32} clearcoat={0.8} />
      </mesh>
      {cam.rings.map(({ y, r, pupil }, i) => (
        <group key={i} position={[cam.island.x, y, backZ - cam.plateau.raise - cam.island.raise]}>
          <LensRing r={r} proud={0.028} seat={0.03} frameColor={frameColor} pupil={pupil} />
        </group>
      ))}
      <mesh rotation-x={Math.PI / 2} position={[cam.flash.x, cam.flash.y, backZ - 0.008]}>
        <cylinderGeometry args={[cam.flash.r, cam.flash.r, 0.016, 32]} />
        <meshPhysicalMaterial
          color="#efe9da"
          emissive="#fff3d6"
          emissiveIntensity={0.25}
          roughness={0.4}
        />
      </mesh>
    </>
  )

  // Side keys on the right rail (closed: they ride the camera slab).
  const sideKeys = (railX: number) =>
    spec.buttons.map(({ y, length }, i) => (
      <SideKey
        key={i}
        side={1}
        railX={railX}
        y={y}
        length={length}
        thickness={spec.buttonProfile.thickness}
        protrusion={spec.buttonProfile.protrusion}
        color={frameColor}
      />
    ))

  // Antenna seam inserts on both rails, sized to the slab that carries them.
  const antennaSeams = (depth: number) =>
    spec.antennaLines?.map((y, i) => (
      <React.Fragment key={i}>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * (body.width / 2 - 0.005), y, 0]}>
            <boxGeometry args={[0.012, 0.026, depth * 0.8]} />
            <meshStandardMaterial color="#22262c" transparent opacity={0.35} roughness={0.65} />
          </mesh>
        ))}
      </React.Fragment>
    ))

  // The inner display's soft center crease and punch-hole camera, positioned
  // in the full virtual-display coordinate space — shared by the flat-open
  // screen (via the overlay slot) and the flex pose (inside each half's
  // clipped full-size wrapper, where the same coordinates apply).
  const creaseOverlay = (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        ...(landscape
          ? { left: 0, right: 0, top: '50%', height: px(0.06), transform: 'translateY(-50%)' }
          : { top: 0, bottom: 0, left: '50%', width: px(0.06), transform: 'translateX(-50%)' }),
        background: landscape
          ? 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.14) 50%, rgba(0,0,0,0) 100%)'
          : 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.14) 50%, rgba(0,0,0,0) 100%)',
        pointerEvents: 'none',
        zIndex: 2147483646,
      }}
    />
  )
  const punchHoleOverlay = (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        ...(landscape
          ? {
              left: px(holeOffsetY - holeR),
              top: `calc(50% - ${px(holeX)}px)`,
              transform: 'translateY(-50%)',
            }
          : {
              top: px(holeOffsetY - holeR),
              left: `calc(50% + ${px(holeX)}px)`,
              transform: 'translateX(-50%)',
            }),
        width: px(holeR * 2),
        height: px(holeR * 2),
        borderRadius: '50%',
        background: 'radial-gradient(circle at 38% 38%, #1b2436 0%, #05060a 55%, #000 100%)',
        boxShadow: '0 0 0 1.5px rgba(255, 255, 255, 0.05)',
        pointerEvents: 'none',
        zIndex: 2147483647,
      }}
    />
  )

  const screen = (surfaceZ: number) => (
    <DeviceScreen
      width={landscape ? display.height : display.width}
      height={landscape ? display.width : display.height}
      radius={display.radius}
      position={[0, 0, surfaceZ]}
      rotation={landscape ? [0, 0, -Math.PI / 2] : [0, 0, 0]}
      occlude={occlude === true ? otherOccludeRefs : occlude === 'blending' ? 'blending' : undefined}
      {...resolveSurface(screenSlot, {
        background: surfaceBackground,
        resolution: res,
        interactive,
        dragToRotate,
        style: surfaceStyle,
      })}
      overlay={
        <>
          {mode === 'open' && creaseOverlay}
          {punchHole && punchHoleOverlay}
        </>
      }
    >
      {screenSlot?.children}
    </DeviceScreen>
  )

  if (mode === 'flex' && flexGeometries) {
    // Each panel pivots around a shared virtual axis at the fold line, at the
    // inner display's neutral plane. Because both back faces stay a constant
    // distance from that axis at every angle, the Armor FlexHinge spine is
    // modeled as a cylinder segment of exactly that radius: it stays tangent
    // to both halves' back shells from nearly-shut to nearly-flat, wrapping
    // the fold like the real teardrop hinge — no seams, no detached band.
    const alpha = ((180 - angle) / 2) * (Math.PI / 180)
    const b = spec.open.body
    const hw = b.width / 2
    // Pivot ON the display surface: the two half-screens then meet exactly
    // at the crease at every angle — nearly shut included — instead of
    // interpenetrating (crossed DOM planes glitch near 0°).
    const pz = b.depth / 2 + 0.006
    // Below ~26° the whole rig glides into the folded pose's canonical
    // placement — a quarter-turn of the assembly around the vertical hinge
    // line plus re-centering onto the spine edge — converging exactly
    // where the dedicated closed pose renders, so the ~0° swap never
    // jumps. Identity above 26°.
    const w = THREE.MathUtils.smoothstep(26 - angle, 0, 26)
    // Tangent radius: pivot plane to the back face. The exposed arc spans
    // ±alpha around straight-back, meeting each half at its back corner.
    // Run the spine and its caps essentially edge to edge — the panels'
    // fold-side corners are square now, so a shorter spine would show the
    // V's interior past its ends at shallow angles (the detached-pill read).
    const spineR = pz + b.depth / 2
    const spineH = b.height - 0.03
    const capT = 0.05
    // The vertical SAMSUNG engraving fits only while the exposed band is
    // wider than the wordmark; flatter than that the spine has retracted.
    const showEmboss = 2 * spineR * Math.sin(alpha) > spec.hinge.emboss.length * 0.155 + 0.06
    // Sector filling the V at each end: center at the axis, arc radius
    // `spineR`, spanning the same ±alpha — the exact cross-section of the
    // fold's opening (shape v runs toward the back; world z = pz − v).
    const capSector = new THREE.Shape()
    capSector.moveTo(0, 0)
    capSector.lineTo(-spineR * Math.sin(alpha), spineR * Math.cos(alpha))
    capSector.absarc(0, 0, spineR, Math.PI / 2 + alpha, Math.PI / 2 - alpha, true)
    capSector.closePath()
    const r = display.radius
    const halfScreen = (side: 'left' | 'right') => {
      const left = side === 'left'
      const radius: [number, number, number, number] = landscape
        ? left
          ? [0, 0, r, r]
          : [r, r, 0, 0]
        : left
          ? [r, 0, 0, r]
          : [0, r, r, 0]
      const localX = (left ? 1 : -1) * (hw / 2 - display.width / 4)
      return (
        <DeviceScreen
          width={landscape ? display.height : display.width / 2}
          height={landscape ? display.width / 2 : display.height}
          radius={radius}
          position={[localX, 0, b.depth / 2 + 0.006]}
          rotation={landscape ? [0, 0, -Math.PI / 2] : [0, 0, 0]}
          occlude={occlude === true ? otherOccludeRefs : occlude === 'blending' ? 'blending' : undefined}
          {...resolveSurface(screenSlot, {
            background: surfaceBackground,
            // each half pane carries half the virtual display's width
            resolution: landscape ? res : res / 2,
            interactive,
            dragToRotate,
            style: surfaceStyle,
          })}
        >
          <div
            style={{
              position: 'absolute',
              left: !landscape && !left ? '-100%' : 0,
              top: landscape && !left ? '-100%' : 0,
              width: landscape ? '100%' : '200%',
              height: landscape ? '200%' : '100%',
            }}
          >
            {screenSlot?.children}
            {creaseOverlay}
            {punchHole && punchHoleOverlay}
          </div>
        </DeviceScreen>
      )
    }

    return (
      <group {...groupProps}>
        <group key="flex" rotation-z={landscape ? Math.PI / 2 : 0}>
          {/* convergence chain: re-center onto the spine edge → quarter-turn
              the assembly around the vertical hinge line — weighted by `w` */}
          <group position={[(-hw / 2) * w, 0, -pz * w]}>
          <group position={[0, 0, pz]} rotation-y={alpha * w}>
          <group position={[0, 0, -pz]}>
          {/* left (cover-screen) panel folds toward the viewer */}
          <group position={[0, 0, pz]} rotation-y={alpha}>
            <group position={[-hw / 2, 0, -pz]}>
              <mesh ref={bodyRef} geometry={flexGeometries.left}>
                {chassisMaterial}
              </mesh>
              <mesh geometry={flexGeometries.back} rotation-y={Math.PI} position-z={-b.depth / 2 - 0.002}>
                <meshPhysicalMaterial color={color} metalness={0.3} roughness={0.34} clearcoat={0.8} clearcoatRoughness={0.3} />
              </mesh>
              <mesh geometry={flexGeometries.glass} position-z={b.depth / 2 + 0.002}>
                <meshPhysicalMaterial color="#040507" metalness={0.1} roughness={0.09} clearcoat={1} />
              </mesh>
              {/* body-coordinate details, shifted into this half's local frame */}
              <group position-x={hw / 2}>
                {coverGlassGeometry && (
                  <group position={[-0.982, 0, 0]}>
                    <mesh geometry={coverGlassGeometry} rotation-y={Math.PI} position-z={-b.depth / 2 - 0.003}>
                      <meshPhysicalMaterial color="#0a0b0f" metalness={0.15} roughness={0.14} clearcoat={1} clearcoatRoughness={0.1} />
                    </mesh>
                    <mesh rotation-x={Math.PI / 2} position={[0, 1.961, -b.depth / 2 - 0.005]}>
                      <cylinderGeometry args={[0.053, 0.053, 0.004, 20]} />
                      <meshPhysicalMaterial color="#1a2130" metalness={0.4} roughness={0.2} clearcoat={1} />
                    </mesh>
                  </group>
                )}
                <EdgeSocket
                  position={[spec.bottomEdge.open.speakers[0]!.x, -b.height / 2, 0]}
                  width={spec.bottomEdge.open.speakers[0]!.width}
                  height={spec.bottomEdge.open.speakers[0]!.height}
                  depth={0.06}
                />
                {spec.antennaLines?.map((y, i) => (
                  <mesh key={i} position={[-(b.width / 2 - 0.005), y, 0]}>
                    <boxGeometry args={[0.012, 0.026, b.depth * 0.8]} />
                    <meshStandardMaterial color="#22262c" transparent opacity={0.35} roughness={0.65} />
                  </mesh>
                ))}
              </group>
              {halfScreen('left')}
            </group>
          </group>

          {/* right (camera) panel folds the opposite way */}
          <group position={[0, 0, pz]} rotation-y={-alpha}>
            <group position={[hw / 2, 0, -pz]}>
              <mesh ref={rearRef} geometry={flexGeometries.right}>
                {chassisMaterial}
              </mesh>
              <mesh geometry={flexGeometries.back} rotation-y={Math.PI} position-z={-b.depth / 2 - 0.002}>
                <meshPhysicalMaterial color={color} metalness={0.3} roughness={0.34} clearcoat={0.8} clearcoatRoughness={0.3} />
              </mesh>
              <mesh geometry={flexGeometries.glass} position-z={b.depth / 2 + 0.002}>
                <meshPhysicalMaterial color="#040507" metalness={0.1} roughness={0.09} clearcoat={1} />
              </mesh>
              <group position-x={-hw / 2}>
                {cameraCluster(-b.depth / 2)}
                {sideKeys(b.width / 2)}
                <UsbC
                  x={spec.bottomEdge.open.usb.x}
                  y={-b.height / 2}
                  width={spec.bottomEdge.open.usb.width}
                  height={spec.bottomEdge.open.usb.height}
                />
                {spec.bottomEdge.open.mics?.filter((m) => m.x > 0).map(({ x, r: mr }, i) => (
                  <EdgeSocket key={i} position={[x, -b.height / 2, 0]} r={mr} depth={0.05} lip={0.008} />
                ))}
                {spec.antennaLines?.map((y, i) => (
                  <mesh key={i} position={[b.width / 2 - 0.005, y, 0]}>
                    <boxGeometry args={[0.012, 0.026, b.depth * 0.8]} />
                    <meshStandardMaterial color="#22262c" transparent opacity={0.35} roughness={0.65} />
                  </mesh>
                ))}
              </group>
              {halfScreen('right')}
            </group>
          </group>

          {/* the spine wrapping the fold: a cylinder segment tangent to both
              back shells, its exposed arc growing as the book closes — plus
              sector end caps closing the V at the top and bottom edges, and
              the vertical SAMSUNG engraving while the band is wide enough */}
          <group position={[0, 0, pz]}>
            <mesh>
              <cylinderGeometry
                args={[spineR, spineR, spineH, 48, 1, true, Math.PI - alpha, 2 * alpha]}
              />
              <meshPhysicalMaterial
                color={frameColor}
                metalness={0.85}
                roughness={0.3}
                side={THREE.DoubleSide}
              />
            </mesh>
            {([1, -1] as const).map((s) => (
              <mesh
                key={s}
                position={[0, s === 1 ? spineH / 2 - capT : -spineH / 2, 0]}
                rotation-x={-Math.PI / 2}
              >
                <extrudeGeometry args={[capSector, { depth: capT, bevelEnabled: false, curveSegments: 24 }]} />
                <meshPhysicalMaterial color={frameColor} metalness={0.8} roughness={0.4} />
              </mesh>
            ))}
            {showEmboss && (
              <mesh
                geometry={spineLogoGeometry}
                rotation={[0, Math.PI, Math.PI / 2]}
                position-z={-spineR - 0.002}
              >
                {spineLogoMaterial}
              </mesh>
            )}
          </group>
          </group>
          </group>
          </group>
        </group>
      </group>
    )
  }

  if (mode === 'open') {
    return (
      <group {...groupProps}>
        <group key="open" rotation-z={landscape ? Math.PI / 2 : 0}>
          {/* chassis */}
          <mesh ref={bodyRef} geometry={openGeometry}>
            {chassisMaterial}
          </mesh>

          {/* back panel colorway */}
          <mesh geometry={backGeometry} rotation-y={Math.PI} position-z={-body.depth / 2 - 0.002}>
            <meshPhysicalMaterial
              color={color}
              metalness={0.3}
              roughness={0.34}
              clearcoat={0.8}
              clearcoatRoughness={0.3}
            />
          </mesh>

          {/* cover glass (the black ring around the active display) */}
          <mesh geometry={glassGeometry} position-z={body.depth / 2 + 0.002}>
            <meshPhysicalMaterial color="#040507" metalness={0.1} roughness={0.09} clearcoat={1} />
          </mesh>

          {/* hinge crevice: fully open the spine retracts flush — only a thin
              dark seam separates the two halves (retail photos), so no wide
              spine band and no wordmark here: a near-black core line with
              soft shadowed shoulders, top to bottom */}
          <group position={[0, 0, -body.depth / 2 - 0.0045]} rotation-y={Math.PI}>
            <mesh>
              <planeGeometry args={[0.016, body.height]} />
              <meshStandardMaterial color="#07080b" metalness={0.1} roughness={0.7} />
            </mesh>
            {[-1, 1].map((side) => (
              <mesh key={side} position={[side * 0.013, 0, 0]}>
                <planeGeometry args={[0.01, body.height]} />
                <meshStandardMaterial color="#0a0c10" transparent opacity={0.3} roughness={0.7} />
              </mesh>
            ))}
          </group>

          {/* the cover display, dark, on the back of the left half */}
          {coverGlassGeometry && (
            <group position={[-0.982, 0, 0]}>
              <mesh
                geometry={coverGlassGeometry}
                rotation-y={Math.PI}
                position-z={-body.depth / 2 - 0.003}
              >
                <meshPhysicalMaterial color="#0a0b0f" metalness={0.15} roughness={0.14} clearcoat={1} clearcoatRoughness={0.1} />
              </mesh>
              {/* its punch camera, top center of the cover panel */}
              <mesh rotation-x={Math.PI / 2} position={[0, 1.961, -body.depth / 2 - 0.005]}>
                <cylinderGeometry args={[0.053, 0.053, 0.004, 20]} />
                <meshPhysicalMaterial color="#1a2130" metalness={0.4} roughness={0.2} clearcoat={1} />
              </mesh>
            </group>
          )}

          {cameraCluster(-body.depth / 2)}
          {sideKeys(body.width / 2)}
          {antennaSeams(body.depth)}

          {/* bottom edge: the machined cavities' interiors */}
          <UsbC
            x={spec.bottomEdge.open.usb.x}
            y={-body.height / 2}
            width={spec.bottomEdge.open.usb.width}
            height={spec.bottomEdge.open.usb.height}
          />
          {spec.bottomEdge.open.speakers.map((sp, i) => (
            <EdgeSocket
              key={i}
              position={[sp.x, -body.height / 2, 0]}
              width={sp.width}
              height={sp.height}
              depth={0.06}
            />
          ))}
          {spec.bottomEdge.open.mics?.map(({ x, r }, i) => (
            <EdgeSocket key={i} position={[x, -body.height / 2, 0]} r={r} depth={0.05} lip={0.008} />
          ))}

          {screen(body.depth / 2 + 0.006)}
        </group>
      </group>
    )
  }

  return (
    <group {...groupProps}>
      <group key="closed" rotation-z={landscape ? Math.PI / 2 : 0}>
        {/* front (cover) slab — carries the cover screen and the speaker slot */}
        <group position-z={halfZ}>
          <mesh ref={bodyRef} geometry={frontHalfGeometry}>
            {chassisMaterial}
          </mesh>
          <mesh geometry={glassGeometry} position-z={halfDepth / 2 + 0.002}>
            <meshPhysicalMaterial color="#040507" metalness={0.1} roughness={0.09} clearcoat={1} />
          </mesh>
          <EdgeSocket
            position={[spec.bottomEdge.closed.speaker.x, -body.height / 2, 0]}
            width={spec.bottomEdge.closed.speaker.width}
            height={spec.bottomEdge.closed.speaker.height}
            depth={0.06}
          />
          {antennaSeams(halfDepth)}
          {screen(halfDepth / 2 + 0.006)}
        </group>

        {/* rear (camera) slab — colorway back, camera stack, buttons, USB-C */}
        <group position-z={-halfZ}>
          <mesh ref={rearRef} geometry={rearHalfGeometry}>
            {chassisMaterial}
          </mesh>
          <mesh geometry={backGeometry} rotation-y={Math.PI} position-z={-halfDepth / 2 - 0.002}>
            <meshPhysicalMaterial
              color={color}
              metalness={0.3}
              roughness={0.34}
              clearcoat={0.8}
              clearcoatRoughness={0.3}
            />
          </mesh>
          {cameraCluster(-halfDepth / 2)}
          {sideKeys(body.width / 2)}
          {antennaSeams(halfDepth)}
          <UsbC
            x={spec.bottomEdge.closed.usb.x}
            y={-body.height / 2}
            width={spec.bottomEdge.closed.usb.width}
            height={spec.bottomEdge.closed.usb.height}
          />
        </group>

        {/* the hinge spine capping the left edge: a vertical capsule whose
            radius spans the WHOLE folded stack, so its crown is tangent to
            both the front and back faces — the smooth book spine of the
            retail device, sealing the crevice at the hinge edge instead of
            reading as a thin separate rod — with the vertical SAMSUNG
            emboss on its crown */}
        {(() => {
          // A hair inside the stack's outer faces so the near-tangent
          // surfaces never coincide (which would shimmer along the line).
          const spineR = spec.closed.body.depth / 2 - 0.002
          const spineLen = body.height - 0.02 - spineR * 2
          return (
            <group position={[-body.width / 2 - spec.hinge.overhang + spineR, 0, 0]}>
              <mesh>
                <capsuleGeometry args={[spineR, spineLen, 12, 32]} />
                <meshPhysicalMaterial color={frameColor} metalness={0.8} roughness={0.34} />
              </mesh>
              {/* hairline seams where the spine's roll meets the two faces —
                  without them the hinge side reads as one featureless pill */}
              {([1, -1] as const).map((s) => (
                <mesh key={s} position={[0, 0, s * (spineR + 0.0028)]}>
                  <boxGeometry args={[0.012, spineLen + spineR, 0.0012]} />
                  <meshStandardMaterial color="#101216" transparent opacity={0.55} roughness={0.7} />
                </mesh>
              ))}
              <mesh
                geometry={spineLogoGeometry}
                rotation={[0, -Math.PI / 2, Math.PI / 2]}
                position-x={-spineR - 0.002}
              >
                {spineLogoMaterial}
              </mesh>
            </group>
          )
        })()}
      </group>
    </group>
  )
}
FoldImpl.displayName = 'Fold'

/** The device's compound slots, shared by `<Fold>` and `<FoldMockup>`. */
export const foldSlots = createSlots(SCREEN_REGIONS)

export const Fold = Object.assign(FoldImpl, foldSlots)
