import * as React from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import {
  FLIP_COLORWAYS,
  findColorway,
  FLIP_VARIANTS,
  FLIP_DEFAULT_VARIANT,
  SCREEN_REGIONS,
  type FlipVariant,
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

export interface FlipProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Anything you want on the active display: React components, an <iframe>, a
   * <video>… Wrap in `<Flip.Screen>` to set per-screen surface props.
   */
  children?: React.ReactNode
  /** Which Galaxy Z Flip device to render. */
  variant?: FlipVariant
  /**
   * A retail colorway id from `FLIP_COLORWAYS` (e.g. the catalog's first
   * entry) presetting the device colors. Explicit color props override it.
   */
  colorway?: string
  /**
   * `true` (default) renders the unfolded tall phone — your content fills the
   * 6.85" main display. `false` renders the folded compact — your content
   * fills the nearly-square cover display, with the two lens rings and
   * flash sitting on the glass beside it.
   */
  open?: boolean
  /**
   * Degree of openness between the two halves (0 = folded shut, 180 = flat
   * open), overriding `open` when set. Intermediate angles render the real
   * Flex Mode pose: the halves pivot around the hinge line while the spine's
   * curved housing rolls into the gap between them, and your content bends
   * across the fold — e.g. `openAngle={100}` for the classic half-open
   * standing pose. The pose is continuous from nearly shut to nearly flat;
   * only ~0° snaps to the dedicated folded pose and ~177°+ to the
   * flat-open one. At intermediate angles the main display is composited
   * from two planes, so stateful screen content is best kept simple.
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
   * whichever screen is showing (main display when open, cover when closed).
   */
  resolution?: number
  /** Show the front-camera punch-hole overlay (open pose only). */
  punchHole?: boolean
  /**
   * How screen content hides when the device faces away from the camera.
   * `true` raycasts against the body (fast, interactive). `'blending'` uses
   * per-pixel depth blending. `false` disables hiding.
   */
  occlude?: boolean | 'blending'
}

/** An extruded rounded-rect slab with a soft edge bevel (one flip half / body). */
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

/** Cutters for the free edge's machining (USB-C, speaker slot, mic holes) at `edgeY`. */
function freeEdgeCutters(
  edge: { usb: { x: number; width: number; height: number }; speaker: { x: number; width: number; height: number }; mics: { x: number; r: number }[] },
  edgeY: number
): THREE.BufferGeometry[] {
  return [
    stadiumCutter(edge.usb.width, edge.usb.height, USB_CUT_DEPTH).translate(edge.usb.x, edgeY, 0),
    stadiumCutter(edge.speaker.width, edge.speaker.height, 0.06).translate(edge.speaker.x, edgeY, 0),
    ...edge.mics.map(({ x, r }) => holeCutter(r, 0.05).translate(x, edgeY, 0)),
  ]
}

/**
 * A procedurally built Samsung Galaxy Z Flip 7. One device, two form factors:
 * the unfolded tall phone (6.85" main display) and the folded compact whose
 * front is nearly all cover screen, switched with the `open` prop. Detail
 * geometry (separate protruding lens rings, hinge band with its engraved wordmark, button
 * pills, ports) follows a reference scan of the retail device. No 3D asset
 * files are loaded — everything is generated from geometry at runtime.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 */
function FlipImpl({
  children,
  variant = FLIP_DEFAULT_VARIANT,
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
}: FlipProps) {
  const screenSlot = collectSlots(children, SCREEN_REGIONS).screen
  const spec = FLIP_VARIANTS[variant]
  const retail = findColorway(FLIP_COLORWAYS[variant], colorway)
  const color = colorProp ?? retail?.color ?? '#22252b'
  const frameColor = frameColorProp ?? retail?.frameColor ?? '#4a4f59'
  // Resolve the pose: an explicit fold angle wins over the boolean; the
  // extremes snap to the dedicated flat-open / folded-shut paths so the
  // default renders are pixel-identical to before. The flex rig pivots on
  // the display surface, so the pose is continuous all the way down —
  // only ~0° itself snaps to the dedicated folded pose.
  const angle = openAngle === undefined ? (open ? 180 : 0) : Math.max(0, Math.min(180, openAngle))
  const mode: 'open' | 'closed' | 'flex' = angle >= 177 ? 'open' : angle < 0.5 ? 'closed' : 'flex'
  const isOpenFace = mode !== 'closed'
  const state = isOpenFace ? spec.open : spec.closed
  const { display } = state
  const cam = spec.rearCamera
  const landscape = orientation === 'landscape'
  const aspect = display.height / display.width
  const res = resolution ?? Math.round(state.resolution * (landscape ? aspect : 1))
  const bodyRef = React.useRef<THREE.Mesh>(null!)
  const lowerBodyRef = React.useRef<THREE.Mesh>(null!)
  const occludeRefs = useScreenOccluders(bodyRef, lowerBodyRef)
  // Screens occlude against OTHER registered bodies only — see the fold's
  // matching note: self-hits at oblique angles black out a visible display,
  // and the backface culler already covers every behind-the-device view.
  const otherOccludeRefs = React.useMemo(
    () => occludeRefs.filter((ref) => ref !== bodyRef && ref !== lowerBodyRef),
    [occludeRefs]
  )

  const openBody = spec.open.body
  const half = spec.closed.body
  // Cover-half center offset from the open body's center (+y = upper half).
  const halfOffsetY = openBody.height / 2 - half.height / 2

  // The open slab with the free-edge kit machined out of its bottom edge.
  const openGeometry = React.useMemo(
    () =>
      cutGeometry(
        slabGeometry(openBody.width, openBody.height, openBody.radius, openBody.depth, openBody.bevel),
        freeEdgeCutters(spec.bottomEdge, -openBody.height / 2)
      ),
    [openBody, spec.bottomEdge]
  )
  // Folded halves: the front (cover) half is uncut; the rear half carries the
  // same kit machined into what becomes the TOP edge of the folded stack.
  const halfGeometry = React.useMemo(
    () => slabGeometry(half.width, half.height, half.radius, half.depth, half.bevel),
    [half]
  )
  const rearHalfGeometry = React.useMemo(
    () =>
      cutGeometry(
        slabGeometry(half.width, half.height, half.radius, half.depth, half.bevel),
        freeEdgeCutters(spec.bottomEdge, half.height / 2)
      ),
    [half, spec.bottomEdge]
  )
  // Flex pose halves: like the closed slabs but with nearly square corners
  // along the fold edge (the display bends there — the real halves run
  // straight into the hinge), so the two stay tight at the crease instead
  // of opening rounded-corner gaps. The lower one also machines the
  // free-edge kit into its own bottom edge (the open-plane orientation,
  // unlike the folded stack where that edge faces up).
  const flexSlab = React.useCallback(
    (foldEdge: 'top' | 'bottom') => {
      const rFree = half.radius - half.bevel
      const rFold = 0.01
      const corners =
        foldEdge === 'bottom'
          ? { tl: rFree, tr: rFree, br: rFold, bl: rFold }
          : { tl: rFold, tr: rFold, br: rFree, bl: rFree }
      const shape = mixedRoundedRectShape(
        half.width - half.bevel * 2,
        half.height - half.bevel * 2,
        corners
      )
      const core = half.depth - half.bevel * 2
      const g = new THREE.ExtrudeGeometry(shape, {
        depth: core,
        bevelEnabled: true,
        bevelThickness: half.bevel,
        bevelSize: half.bevel,
        bevelSegments: 4,
        curveSegments: 16,
      })
      g.translate(0, 0, -core / 2)
      return g
    },
    [half]
  )
  const flexUpperGeometry = React.useMemo(
    () => (mode === 'flex' ? flexSlab('bottom') : null),
    [mode, flexSlab]
  )
  const flexLowerGeometry = React.useMemo(
    () =>
      mode === 'flex'
        ? cutGeometry(flexSlab('top'), freeEdgeCutters(spec.bottomEdge, -half.height / 2))
        : null,
    [mode, flexSlab, half, spec.bottomEdge]
  )
  React.useEffect(
    () => () => {
      openGeometry.dispose()
      halfGeometry.dispose()
      rearHalfGeometry.dispose()
      flexUpperGeometry?.dispose()
      flexLowerGeometry?.dispose()
    },
    [openGeometry, halfGeometry, rearHalfGeometry, flexUpperGeometry, flexLowerGeometry]
  )

  const coverGlassGeometry = React.useMemo(
    () =>
      new THREE.ShapeGeometry(
        roundedRectShape(spec.coverGlass.width, spec.coverGlass.height, spec.coverGlass.radius),
        16
      ),
    [spec.coverGlass]
  )

  // Open-pose back frame: the metal lip surrounding both glass panels, at the
  // SAME height as the panes. Without it the panes float proud of the chassis
  // back face, and past ~12° of tilt they project beyond the rounded-corner
  // silhouette (the dark panel visibly "grows outside" the body). With the
  // frame on the panes' own plane, the border occludes them at every angle —
  // exactly how the real glass sits in its surrounding lip.
  const backFrameGeometry = React.useMemo(() => {
    const outer = roundedRectShape(
      spec.open.body.width - 0.006,
      spec.open.body.height - 0.006,
      spec.open.body.radius - 0.003
    )
    const offsetY = spec.open.body.height / 2 - spec.closed.body.height / 2
    for (const cy of [offsetY, -offsetY]) {
      const pts = roundedRectShape(
        spec.coverGlass.width,
        spec.coverGlass.height,
        spec.coverGlass.radius
      ).getPoints(24)
      outer.holes.push(new THREE.Path(pts.map((p) => new THREE.Vector2(p.x, p.y + cy))))
    }
    return new THREE.ShapeGeometry(outer, 24)
  }, [spec.open.body, spec.closed.body, spec.coverGlass])

  const hingeLogoGeometry = React.useMemo(
    () => createLogoGeometry('samsung', spec.hinge.emboss.length, spec.hinge.emboss.length * 0.155),
    [spec.hinge.emboss.length]
  )

  React.useEffect(() => {
    return () => {
      coverGlassGeometry.dispose()
      hingeLogoGeometry.dispose()
    }
  }, [coverGlassGeometry, hingeLogoGeometry])

  // CSS px per world unit for display overlays.
  const pxPerUnit = res / (landscape ? display.height : display.width)
  const px = (units: number) => units * pxPerUnit

  // Maps a cover-display physical rect (center x,y + size, +y up) to CSS.
  const coverAt = (
    x: number,
    y: number,
    w: number,
    h: number,
    extra: React.CSSProperties
  ): React.CSSProperties => ({
    position: 'absolute',
    ...(landscape
      ? {
          left: `calc(50% - ${px(y) + px(h) / 2}px)`,
          top: `calc(50% - ${px(x) + px(w) / 2}px)`,
          width: px(h),
          height: px(w),
        }
      : {
          left: `calc(50% + ${px(x) - px(w) / 2}px)`,
          top: `calc(50% - ${px(y) + px(h) / 2}px)`,
          width: px(w),
          height: px(h),
        }),
    ...extra,
  })

  // The two separate lens rings + flash, in cover-half local coordinates —
  // each module rises straight from the cover glass with no plate joining
  // them, like the retail device. `sign` is +1 when the cluster faces the
  // viewer (closed front) and -1 on the open back.
  const cameraCluster = (sign: 1 | -1, surfaceZ: number) => (
    <group>
      {cam.rings.map(({ x, y, r, pupil }, i) => (
        <group key={i} position={[x, y, surfaceZ]} rotation-y={sign === 1 ? Math.PI : 0}>
          <LensRing r={r} proud={cam.raise + 0.016} seat={0.03} frameColor={frameColor} pupil={pupil} />
        </group>
      ))}
      <mesh rotation-x={Math.PI / 2} position={[cam.flash.x, cam.flash.y, surfaceZ + sign * 0.006]}>
        <cylinderGeometry args={[cam.flash.r, cam.flash.r, 0.012, 24]} />
        <meshPhysicalMaterial
          color="#e8e4da"
          emissive="#fff3d6"
          emissiveIntensity={0.22}
          roughness={0.35}
          metalness={0.4}
        />
      </mesh>
    </group>
  )

  // Side keys + SIM on the cover half's rails (half-local coordinates).
  const rails = (
    <group>
      {spec.buttons.map(({ y, length }, i) => (
        <SideKey
          key={i}
          side={1}
          railX={half.width / 2}
          y={y}
          length={length}
          thickness={spec.buttonProfile.thickness}
          protrusion={spec.buttonProfile.protrusion}
          color={frameColor}
        />
      ))}
      <RoundedBox
        args={[0.012, spec.sim.length, 0.074]}
        radius={0.005}
        position={[-half.width / 2 + 0.005, spec.sim.y, 0]}
      >
        <meshStandardMaterial color="#15181d" transparent opacity={0.35} roughness={0.5} />
      </RoundedBox>
    </group>
  )

  // Interiors for the free edge's machined cavities (the cavities themselves
  // are cut from the slab geometry): USB-C receptacle, speaker sleeve, mic
  // plugs. `edgeY` is that edge's y in the current pose.
  const freeEdgeKit = (edgeY: number) => {
    const inward: 1 | -1 = edgeY > 0 ? -1 : 1
    return (
      <group>
        <UsbC
          x={spec.bottomEdge.usb.x}
          y={edgeY}
          width={spec.bottomEdge.usb.width}
          height={spec.bottomEdge.usb.height}
          inward={inward}
        />
        <EdgeSocket
          position={[spec.bottomEdge.speaker.x, edgeY, 0]}
          width={spec.bottomEdge.speaker.width}
          height={spec.bottomEdge.speaker.height}
          depth={0.06}
          inward={inward}
        />
        {spec.bottomEdge.mics.map(({ x, r }, i) => (
          <EdgeSocket key={i} position={[x, edgeY, 0]} r={r} depth={0.05} lip={0.008} inward={inward} />
        ))}
      </group>
    )
  }

  // The hinge spine capping the folded bottom: a horizontal capsule whose
  // radius spans the WHOLE folded stack, so its crown is tangent to both
  // the cover-screen face and the back face — the smooth rolled bottom of
  // the retail teardrop hinge, sealing the stack's underside instead of
  // reading as a thin separate rod — with the SAMSUNG engraving on its
  // crown.
  // A hair inside the stack's outer faces so the near-tangent surfaces
  // never coincide (which would shimmer along the touch line).
  const stackR = half.depth + spec.closed.gap / 2 - 0.002
  const hingeBand = (y: number) => (
    <group position={[0, y, 0]}>
      <mesh rotation-z={Math.PI / 2}>
        <capsuleGeometry args={[stackR, openBody.width - 0.03 - stackR * 2, 12, 32]} />
        <meshPhysicalMaterial color={frameColor} metalness={0.75} roughness={0.36} />
      </mesh>
      {/* hairline seams where the roll meets the two faces — without them
          the hinge bottom reads as one featureless pill */}
      {([1, -1] as const).map((s) => (
        <mesh key={s} position={[0, 0, s * (stackR + 0.0028)]}>
          <boxGeometry args={[openBody.width - 0.03 - stackR, 0.012, 0.0012]} />
          <meshStandardMaterial color="#101216" transparent opacity={0.55} roughness={0.7} />
        </mesh>
      ))}
      <mesh geometry={hingeLogoGeometry} rotation-x={Math.PI / 2} position-y={-stackR - 0.002}>
        <meshPhysicalMaterial
          transparent
          opacity={0.45}
          color="#33363c"
          metalness={0.7}
          roughness={0.35}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>
    </group>
  )

  const endSeams = (ys: number[], depth: number) =>
    ys.map((y, i) => (
      <React.Fragment key={i}>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * (openBody.width / 2 - 0.005), y, 0]}>
            <boxGeometry args={[0.012, 0.022, depth * 0.8]} />
            <meshStandardMaterial color="#22262c" transparent opacity={0.35} roughness={0.65} />
          </mesh>
        ))}
      </React.Fragment>
    ))

  // The main display's punch-hole camera — shared by the flat-open screen and
  // the flex pose's upper half (the hole rides the display's top edge, which
  // is that half's top edge too).
  const punchHoleOverlay = (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        ...(landscape
          ? {
              left: px(spec.open.punchHole.offsetY - spec.open.punchHole.radius),
              top: '50%',
              transform: 'translateY(-50%)',
            }
          : {
              top: px(spec.open.punchHole.offsetY - spec.open.punchHole.radius),
              left: '50%',
              transform: 'translateX(-50%)',
            }),
        width: px(spec.open.punchHole.radius * 2),
        height: px(spec.open.punchHole.radius * 2),
        borderRadius: '50%',
        background: 'radial-gradient(circle at 38% 38%, #1b2436 0%, #05060a 55%, #000 100%)',
        boxShadow: '0 0 0 1.5px rgba(255, 255, 255, 0.05)',
        pointerEvents: 'none',
        zIndex: 2147483647,
      }}
    />
  )

  const screen = (
    <DeviceScreen
      width={landscape ? display.height : display.width}
      height={landscape ? display.width : display.height}
      radius={display.radius}
      position={[0, 0, (mode !== 'closed' ? openBody.depth : half.depth) / 2 + 0.006]}
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
        mode === 'open' && punchHole ? (
          punchHoleOverlay
        ) : mode === 'closed' ? (
          // The two lens rings + flash live ON the cover screen — rendered as
          // a DOM overlay so they sit above your live content, like a cutout.
          // No pill behind them: the retail modules protrude individually.
          <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2147483647 }}>
            {cam.rings.map(({ x, y, r }, i) => (
              <div
                key={i}
                style={coverAt(x, y, r * 2, r * 2, {
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 38% 38%, #262f42 0%, #0a0c12 55%, #000 100%)',
                  boxShadow: 'inset 0 0 0 2px rgba(215, 222, 232, 0.35)',
                })}
              />
            ))}
            <div
              style={coverAt(cam.flash.x, cam.flash.y, cam.flash.r * 2, cam.flash.r * 2, {
                borderRadius: '50%',
                background: 'radial-gradient(circle at 45% 40%, #fdf7e4 0%, #d9d2bd 70%, #b7b19e 100%)',
              })}
            />
          </div>
        ) : undefined
      }
    >
      {screenSlot?.children}
    </DeviceScreen>
  )

  if (mode === 'flex') {
    // Each half pivots around a shared virtual axis at the fold line, sitting
    // just inside the main display surface (the panel's neutral axis) — so
    // the screens meet flush when shut and lie coplanar when flat. The
    // Armor FlexHinge spine is a separate rigid body: a cylinder segment the
    // halves' back shells progressively cover as the device opens.
    const alpha = ((180 - angle) / 2) * (Math.PI / 180)
    // Pivot ON the display surface: the two half-screens then meet exactly
    // at the crease at every angle — nearly shut included — instead of
    // interpenetrating (crossed DOM planes glitch near 0°).
    const pz = openBody.depth / 2 + 0.006
    const halfH = half.height
    // Below ~26° the whole rig glides into the folded pose's canonical
    // placement — fold the assembly forward around the hinge, half-turn it
    // upright in-plane, re-center — converging exactly where the dedicated
    // closed pose renders, so the ~0° swap never jumps. Identity above 26°.
    const w = THREE.MathUtils.smoothstep(26 - angle, 0, 26)
    // Spine housing: a cylinder segment tangent to both halves' back shells.
    // The halves pivot on the display's neutral plane, so their back faces
    // stay a constant `spineR` from the axis at every angle — the exposed
    // wedge spans exactly ±alpha and meets each back edge seamlessly, from
    // nearly-shut to nearly-flat, like the real teardrop hinge.
    // Run the spine and its caps essentially edge to edge — the halves'
    // fold-side corners are square now, so a shorter spine would show the
    // V's interior past its ends at shallow angles (the detached-pill read).
    const spineR = pz + half.depth / 2
    const spineLen = openBody.width - 0.03
    const wedge = 2 * alpha
    const spineTheta = Math.PI - alpha
    // Screen halves: the fold splits the panel at the hinge line; each plane
    // shows its half of one shared virtual viewport via a clipped wrapper.
    const r = display.radius
    const halfScreen = (part: 'upper' | 'lower') => {
      const upper = part === 'upper'
      const radius: [number, number, number, number] = landscape
        ? upper
          ? [r, 0, 0, r]
          : [0, r, r, 0]
        : upper
          ? [r, r, 0, 0]
          : [0, 0, r, r]
      const localY = (upper ? 1 : -1) * (display.height / 4 - halfH / 2)
      return (
        <DeviceScreen
          width={landscape ? display.height / 2 : display.width}
          height={landscape ? display.width : display.height / 2}
          radius={radius}
          position={[0, localY, half.depth / 2 + 0.006]}
          rotation={landscape ? [0, 0, -Math.PI / 2] : [0, 0, 0]}
          occlude={occlude === true ? otherOccludeRefs : occlude === 'blending' ? 'blending' : undefined}
          {...resolveSurface(screenSlot, {
            background: surfaceBackground,
            // each half pane carries half the virtual display's height
            resolution: landscape ? res / 2 : res,
            interactive,
            dragToRotate,
            style: surfaceStyle,
          })}
          overlay={
            <>
              {upper && punchHole ? punchHoleOverlay : null}
              {/* the fold's soft shadow falling into the crease */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  pointerEvents: 'none',
                  zIndex: 2147483646,
                  ...(landscape
                    ? upper
                      ? { top: 0, bottom: 0, right: 0, width: px(0.18), background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.24))' }
                      : { top: 0, bottom: 0, left: 0, width: px(0.18), background: 'linear-gradient(to left, transparent, rgba(0,0,0,0.24))' }
                    : upper
                      ? { left: 0, right: 0, bottom: 0, height: px(0.18), background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.24))' }
                      : { left: 0, right: 0, top: 0, height: px(0.18), background: 'linear-gradient(to top, transparent, rgba(0,0,0,0.24))' }),
                }}
              />
            </>
          }
        >
          <div
            style={{
              position: 'absolute',
              left: landscape && !upper ? '-100%' : 0,
              top: !landscape && !upper ? '-100%' : 0,
              width: landscape ? '200%' : '100%',
              height: landscape ? '100%' : '200%',
            }}
          >
            {screenSlot?.children}
          </div>
        </DeviceScreen>
      )
    }

    return (
      <group {...groupProps}>
        <group key="flex" rotation-z={landscape ? Math.PI / 2 : 0}>
          {/* convergence chain: re-center → half-turn upright in-plane
              around the folding compact's center → fold the assembly
              forward around the hinge line — all weighted by `w` */}
          <group position={[0, (halfH / 2) * w, -pz * w]}>
          <group position={[0, -halfH / 2, pz]} rotation-z={Math.PI * w}>
          <group position={[0, halfH / 2, -pz]}>
          <group position={[0, 0, pz]} rotation-x={alpha * w}>
          <group position={[0, 0, -pz]}>
          {/* upper (cover) half folds toward the viewer around the hinge */}
          <group position={[0, 0, pz]} rotation-x={alpha}>
            <group position={[0, halfH / 2, -pz]}>
              <mesh ref={bodyRef} geometry={flexUpperGeometry ?? halfGeometry}>
                <meshPhysicalMaterial color={frameColor} metalness={0.85} roughness={0.32} />
              </mesh>
              <mesh geometry={coverGlassGeometry} rotation-y={Math.PI} position-z={-half.depth / 2 - 0.002}>
                <meshPhysicalMaterial color={coverOffColor(color)} metalness={0.2} roughness={0.18} clearcoat={1} clearcoatRoughness={0.12} />
              </mesh>
              {cameraCluster(-1, -half.depth / 2 - 0.002)}
              {rails}
              {endSeams([halfH / 2 - spec.endSeamInset], half.depth)}
              {halfScreen('upper')}
            </group>
          </group>

          {/* lower half folds the opposite way */}
          <group position={[0, 0, pz]} rotation-x={-alpha}>
            <group position={[0, -halfH / 2, -pz]}>
              <mesh ref={lowerBodyRef} geometry={flexLowerGeometry ?? halfGeometry}>
                <meshPhysicalMaterial color={frameColor} metalness={0.85} roughness={0.32} />
              </mesh>
              <mesh geometry={coverGlassGeometry} rotation-y={Math.PI} position-z={-half.depth / 2 - 0.002}>
                <meshPhysicalMaterial color={color} metalness={0.3} roughness={0.3} clearcoat={1} clearcoatRoughness={0.25} />
              </mesh>
              {freeEdgeKit(-halfH / 2)}
              {endSeams([-(halfH / 2 - spec.endSeamInset)], half.depth)}
              {halfScreen('lower')}
            </group>
          </group>

          {/* the spine housing rolling into the wedge between the halves —
              frame-colored but glossier than the satin rails, with the
              tone-on-tone SAMSUNG engraving centered on the band face while
              the exposed wedge is wide enough to carry it */}
          <group position={[0, 0, pz]}>
            <mesh rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[spineR, spineR, spineLen, 48, 1, true, spineTheta, wedge]} />
              <meshPhysicalMaterial color={frameColor} metalness={0.85} roughness={0.22} clearcoat={0.4} side={THREE.DoubleSide} />
            </mesh>
            {2 * spineR * Math.sin(alpha) > spec.hinge.emboss.length * 0.155 + 0.05 && (
              <mesh geometry={hingeLogoGeometry} rotation-y={Math.PI} position={[0, 0, -spineR - 0.002]}>
                <meshPhysicalMaterial
                  transparent
                  opacity={0.45}
                  color="#33363c"
                  metalness={0.7}
                  roughness={0.35}
                  polygonOffset
                  polygonOffsetFactor={-1}
                />
              </mesh>
            )}
            {/* frame-metal sector caps closing the fold's V at both ends */}
            {([1, -1] as const).map((s) => (
              <mesh key={s} rotation-y={s * (Math.PI / 2)} position={[s * (spineLen / 2 + 0.004), 0, 0]}>
                {/* local theta 0 lands on world -z (the wedge center) for the
                    +x cap and on +z for the -x cap — start each accordingly */}
                <circleGeometry args={[spineR * 0.995, 32, s === 1 ? -wedge / 2 : Math.PI - wedge / 2, wedge]} />
                <meshPhysicalMaterial color={frameColor} metalness={0.7} roughness={0.38} side={THREE.DoubleSide} />
              </mesh>
            ))}
          </group>
          </group>
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
            <meshPhysicalMaterial color={frameColor} metalness={0.85} roughness={0.32} />
          </mesh>

          {/* lower back glass colorway */}
          <mesh geometry={coverGlassGeometry} rotation-y={Math.PI} position={[0, -halfOffsetY, -openBody.depth / 2 - 0.002]}>
            <meshPhysicalMaterial color={color} metalness={0.3} roughness={0.3} clearcoat={1} clearcoatRoughness={0.25} />
          </mesh>

          {/* upper back: the cover screen glass (off, dark tint of the colorway) +
              the lens rings riding it */}
          <group position={[0, halfOffsetY, 0]}>
            <mesh geometry={coverGlassGeometry} rotation-y={Math.PI} position-z={-openBody.depth / 2 - 0.002}>
              <meshPhysicalMaterial color={coverOffColor(color)} metalness={0.2} roughness={0.18} clearcoat={1} clearcoatRoughness={0.12} />
            </mesh>
            {cameraCluster(-1, -openBody.depth / 2 - 0.002)}
            {rails}
          </group>

          {/* the frame lip around both panes, on their plane — keeps the dark
              panels inside the silhouette at every viewing angle */}
          <mesh geometry={backFrameGeometry} rotation-y={Math.PI} position-z={-openBody.depth / 2 - 0.0022}>
            <meshPhysicalMaterial color={frameColor} metalness={0.85} roughness={0.32} />
          </mesh>

          {/* faint hinge seam across the middle of the frame rails */}
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * (openBody.width / 2 - 0.004), 0, 0]}>
              <boxGeometry args={[0.014, 0.05, openBody.depth * 0.9]} />
              <meshStandardMaterial color="#101216" transparent opacity={0.5} roughness={0.6} />
            </mesh>
          ))}

          {/* hinge crevice: fully open, the two back panels don't meet — a
              dark groove runs across the vertical middle (see the retail
              product photos), rail to rail: near-black core seam with soft
              shadowed shoulders where each half's glass edge falls away */}
          <group position={[0, 0, -openBody.depth / 2 - 0.004]} rotation-y={Math.PI}>
            <mesh>
              <planeGeometry args={[openBody.width - 0.05, 0.026]} />
              <meshStandardMaterial color="#07080b" metalness={0.1} roughness={0.7} />
            </mesh>
            {[-1, 1].map((side) => (
              <mesh key={side} position={[0, side * 0.023, 0]}>
                <planeGeometry args={[openBody.width - 0.05, 0.02]} />
                <meshStandardMaterial color="#0a0c10" transparent opacity={0.38} roughness={0.7} />
              </mesh>
            ))}
          </group>
          {endSeams([openBody.height / 2 - spec.endSeamInset, -openBody.height / 2 + spec.endSeamInset], openBody.depth)}

          {freeEdgeKit(-openBody.height / 2)}
          {screen}
        </group>
      </group>
    )
  }

  const halfZ = spec.closed.gap / 2 + half.depth / 2
  const stackBottom = -half.height / 2

  return (
    <group {...groupProps}>
      <group key="closed" rotation-z={landscape ? Math.PI / 2 : 0}>
        {/* front half (cover screen + cameras) and rear half, with the air gap */}
        <group position-z={halfZ}>
          <mesh ref={bodyRef} geometry={halfGeometry}>
            <meshPhysicalMaterial color={frameColor} metalness={0.85} roughness={0.32} />
          </mesh>
          {rails}
          {screen}
        </group>
        <group position-z={-halfZ}>
          <mesh geometry={rearHalfGeometry}>
            <meshPhysicalMaterial color={frameColor} metalness={0.85} roughness={0.32} />
          </mesh>
          {/* back glass colorway on the rear half */}
          <mesh geometry={coverGlassGeometry} rotation-y={Math.PI} position-z={-half.depth / 2 - 0.002}>
            <meshPhysicalMaterial color={color} metalness={0.3} roughness={0.3} clearcoat={1} clearcoatRoughness={0.25} />
          </mesh>
        </group>

        {/* the lower half's edge kit lands on the TOP edge when folded */}
        <group position-z={-halfZ}>{freeEdgeKit(half.height / 2)}</group>

        {/* hinge spine capping the bottom — crown reaching the scan's
            overhang below the stack */}
        {hingeBand(stackBottom - spec.hinge.overhang + stackR)}

        {endSeams([half.height / 2 - spec.endSeamInset], half.depth)}
      </group>
    </group>
  )
}
FlipImpl.displayName = 'Flip'

/** The device's compound slots, shared by `<Flip>` and `<FlipMockup>`. */
export const flipSlots = createSlots(SCREEN_REGIONS)

export const Flip = Object.assign(FlipImpl, flipSlots)

/** The cover screen shows near-black glass when off, tinted faintly by the colorway. */
function coverOffColor(color: string): string {
  return `#${new THREE.Color(color).lerp(new THREE.Color('#06070a'), 0.82).getHexString()}`
}
