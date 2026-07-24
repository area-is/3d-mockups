import * as React from 'react'
import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { POSTER_FRAME, POSTER_FRAME_REGIONS, posterFrameSpec, type PosterFrameSize } from '@area-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { roundedRectShape } from '@area-mockups/core'
import { useScreenOccluders } from '../../screen/occluders'
import { collectSlots, createSlots, resolveSurface, type SurfaceDefaults } from '../../slots'

type GroupProps = ThreeElements['group']

export interface PosterFrameProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Poster art — any React node. It fills the visible opening, full bleed;
   * wrap in `<PosterFrame.Poster>` to set per-surface props.
   */
  children?: React.ReactNode
  /**
   * Physical sheet size in millimeters, e.g. `{ width: 610, height: 914 }`
   * for 24" x 36" or `{ width: 594, height: 841 }` for A1. Defaults to the
   * 457 x 610 mm (18" x 24") poster.
   */
  size?: PosterFrameSize
  /** Frame molding color. */
  color?: string
  /** Mount the art behind a 2.5" gallery matboard instead of full bleed. */
  mat?: boolean
  /** Matboard color (when `mat` is set). */
  matColor?: string
  /** Simulated glazing: a soft acrylic sheen over the art. */
  glazing?: boolean
  /**
   * How poster content hides when the frame faces away from the camera.
   * `true` raycasts against the frame and backing (fast, interactive).
   * `'blending'` uses per-pixel depth blending. `false` disables hiding.
   */
  occlude?: boolean | 'blending'
}

/**
 * A procedurally built gallery poster frame: an extruded molding whose rabbet
 * lip overlaps the sheet edge like a real frame, a shallowly recessed live
 * 18" x 24" poster behind a clear acrylic glazing pane (plus a soft sheen
 * overlay), an optional gallery matboard, and a kraft dust cover on the back.
 * No 3D asset files are loaded.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 *
 * ```tsx
 * <PosterFrame color="#22262e">
 *   <PosterFrame.Poster><YourPosterArt /></PosterFrame.Poster>
 * </PosterFrame>
 * ```
 */
function PosterFrameImpl({
  children,
  size,
  color = '#22262e',
  mat = false,
  matColor = '#f6f3ec',
  glazing = true,
  surfaceBackground = '#ffffff',
  resolution = POSTER_FRAME.resolution,
  interactive = true,
  dragToRotate = true,
  occlude = true,
  surfaceStyle,
  ...groupProps
}: PosterFrameProps) {
  const posterSlot = collectSlots(children, POSTER_FRAME_REGIONS).poster
  const { poster, opening, frame, recess, matWidth } = React.useMemo(
    () => (size ? posterFrameSpec(size) : POSTER_FRAME),
    [size?.width, size?.height]
  )
  const frameRef = React.useRef<THREE.Mesh>(null!)
  const backingRef = React.useRef<THREE.Mesh>(null!)
  const occludeRefs = useScreenOccluders(frameRef, backingRef)

  const outerWidth = poster.width + frame.width * 2
  const outerHeight = poster.height + frame.width * 2
  // with a mat, the live art shrinks to the mat window
  const art = mat
    ? { width: opening.width - matWidth * 2, height: opening.height - matWidth * 2 }
    : { width: opening.width, height: opening.height }

  const frameGeometry = React.useMemo(() => {
    const shape = roundedRectShape(
      outerWidth - frame.bevel * 2,
      outerHeight - frame.bevel * 2,
      frame.radius - frame.bevel
    )
    // the through-hole is the visible opening — the rabbet lip overlaps the sheet
    shape.holes.push(roundedRectShape(opening.width, opening.height, opening.radius))
    const depth = frame.depth - frame.bevel * 2
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: frame.bevel,
      bevelSize: frame.bevel,
      bevelSegments: 2,
      curveSegments: 12,
    })
    geometry.translate(0, 0, -depth / 2)
    return geometry
  }, [outerWidth, outerHeight, frame, opening])

  const backingGeometry = React.useMemo(
    () => new THREE.ShapeGeometry(roundedRectShape(poster.width, poster.height, poster.radius), 8),
    [poster]
  )

  const matGeometry = React.useMemo(() => {
    if (!mat) return null
    const shape = roundedRectShape(poster.width - 0.01, poster.height - 0.01, poster.radius)
    shape.holes.push(roundedRectShape(art.width, art.height, 0.002))
    return new THREE.ShapeGeometry(shape, 8)
  }, [mat, poster, art.width, art.height])

  const dustCoverGeometry = React.useMemo(
    () =>
      new THREE.ShapeGeometry(
        roundedRectShape(outerWidth - 0.06, outerHeight - 0.06, frame.radius),
        8
      ),
    [outerWidth, outerHeight, frame]
  )

  const glazingGeometry = React.useMemo(
    () =>
      new THREE.ShapeGeometry(
        roundedRectShape(poster.width - 0.02, poster.height - 0.02, poster.radius),
        8
      ),
    [poster]
  )

  React.useEffect(() => {
    return () => {
      frameGeometry.dispose()
      backingGeometry.dispose()
      matGeometry?.dispose()
      dustCoverGeometry.dispose()
      glazingGeometry.dispose()
    }
  }, [frameGeometry, backingGeometry, matGeometry, dustCoverGeometry, glazingGeometry])

  const sheetZ = frame.depth / 2 - recess

  return (
    <group {...groupProps}>
      {/* molding with a true through-hole and overlapping rabbet lip */}
      <mesh ref={frameRef} geometry={frameGeometry}>
        <meshPhysicalMaterial color={color} metalness={0.15} roughness={0.45} clearcoat={0.4} />
      </mesh>

      {/* the sheet/backing continuing behind the lip */}
      <mesh ref={backingRef} geometry={backingGeometry} position-z={sheetZ - 0.008}>
        <meshPhysicalMaterial color="#f4f2ec" metalness={0} roughness={0.9} />
      </mesh>

      {/* optional gallery matboard between backing and art */}
      {matGeometry && (
        <mesh geometry={matGeometry} position-z={sheetZ - 0.003}>
          <meshPhysicalMaterial color={matColor} metalness={0} roughness={0.95} />
        </mesh>
      )}

      {/* clear acrylic glazing: a thin transmissive pane just behind the lip,
          in front of the sheet (the DOM sheen overlay adds the reflections) */}
      {glazing && (
        <mesh geometry={glazingGeometry} position-z={frame.depth / 2 - 0.007}>
          <meshPhysicalMaterial
            transmission={0.9}
            roughness={0.05}
            thickness={0.01}
            ior={1.49}
            metalness={0}
          />
        </mesh>
      )}

      {/* kraft dust cover on the back */}
      <mesh geometry={dustCoverGeometry} rotation-y={Math.PI} position-z={-frame.depth / 2 - 0.002}>
        <meshPhysicalMaterial color="#8d7c62" metalness={0} roughness={0.95} />
      </mesh>

      {/* the live art: real DOM, CSS3D-transformed onto the recessed sheet */}
      <DeviceScreen
        width={art.width}
        height={art.height}
        radius={mat ? 0.002 : opening.radius}
        position={[0, 0, sheetZ]}
        occlude={occlude === true ? occludeRefs : occlude === 'blending' ? 'blending' : undefined}
        {...resolveSurface(posterSlot, {
          background: surfaceBackground,
          resolution,
          interactive,
          dragToRotate,
          style: surfaceStyle,
        })}
        overlay={
          glazing ? (
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 2147483647,
                background:
                  'linear-gradient(115deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 26%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 68%, rgba(255,255,255,0.06) 100%)',
              }}
            />
          ) : undefined
        }
      >
        {posterSlot?.children}
      </DeviceScreen>
    </group>
  )
}
PosterFrameImpl.displayName = 'PosterFrame'

/** The frame's compound slots, shared by `<PosterFrame>` and `<PosterFrameMockup>`. */
export const posterFrameSlots = createSlots(POSTER_FRAME_REGIONS)

export const PosterFrame = Object.assign(PosterFrameImpl, posterFrameSlots)
