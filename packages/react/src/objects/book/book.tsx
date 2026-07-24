import * as React from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { BOOK, BOOK_REGIONS, bookSpec, type BookSize } from '@area-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { roundedRectShape } from '@area-mockups/core'
import { useScreenOccluders } from '../../screen/occluders'
import { collectSlots, createSlots, resolveSurface, type SurfaceDefaults } from '../../slots'

type GroupProps = ThreeElements['group']

export interface BookProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Cover art — full bleed on the front board. Bare children fill the front
   * cover; name faces explicitly with `<Book.Cover>`, `<Book.Back>` and
   * `<Book.Spine>`.
   */
  children?: React.ReactNode
  /**
   * Physical trim size in millimeters, e.g. `{ width: 216, height: 279 }`
   * for a letter-size art book or `{ thickness: 45 }` for a fat novel.
   * Defaults to the standard 156 x 234 x 27 mm trade hardcover.
   */
  size?: BookSize
  /** Cloth color of the spine, back board and board edges. */
  color?: string
  /** Paper color of the page block edges. */
  pageColor?: string
  /**
   * How cover content hides when the book faces away from the camera.
   * `true` raycasts against the boards (fast, interactive). `'blending'` uses
   * per-pixel depth blending. `false` disables hiding.
   */
  occlude?: boolean | 'blending'
}

/**
 * A procedurally built trade hardcover: cloth-wrapped binder's boards with a
 * convex cloth backbone, french grooves along the spine joints, headbands, a
 * cream page block recessed behind the board overhang, and live full-bleed
 * front cover, back cover, and spine strip. No 3D asset files are loaded.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 *
 * ```tsx
 * <Book color="#1f3a5f">
 *   <Book.Cover><CoverArt /></Book.Cover>
 *   <Book.Spine><SpineTitle /></Book.Spine>
 * </Book>
 * ```
 */
function BookImpl({
  children,
  size,
  color = '#1f3a5f',
  pageColor = '#f4eede',
  surfaceBackground = '#ffffff',
  resolution = BOOK.resolution,
  interactive = true,
  dragToRotate = true,
  occlude = true,
  surfaceStyle,
  ...groupProps
}: BookProps) {
  const regions = collectSlots(children, BOOK_REGIONS)
  const spec = React.useMemo(
    () => (size ? bookSpec(size) : BOOK),
    [size?.width, size?.height, size?.thickness]
  )
  const { board, thickness, pages, spine, groove, headband, cover } = spec
  const frontRef = React.useRef<THREE.Mesh>(null!)
  const backRef = React.useRef<THREE.Mesh>(null!)
  const occludeRefs = useScreenOccluders(frontRef, backRef)

  const surfaceDefaults = {
    background: surfaceBackground,
    resolution,
    interactive,
    dragToRotate,
    style: surfaceStyle,
  }
  const screenProps = {
    occlude: occlude === true ? occludeRefs : occlude === 'blending' ? ('blending' as const) : undefined,
  }
  // spine strip: rides the crown of the convex backbone, narrowed so its
  // flat DOM plane stays tight against the curved shell
  const spineWidth = thickness * 0.75
  const spineX = -board.width / 2 + 0.012 - (spine.bulge + 0.012) - 0.002

  // the boards stop short of the spine by the french groove width — the
  // groove itself is a thinner recessed strip added separately below
  const boardGeometry = React.useMemo(() => {
    const shape = roundedRectShape(
      board.width - groove.width - board.bevel * 2,
      board.height - board.bevel * 2,
      board.radius - board.bevel
    )
    const depth = board.thickness - board.bevel * 2
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: board.bevel,
      bevelSize: board.bevel,
      bevelSegments: 2,
      curveSegments: 12,
    })
    geometry.translate(0, 0, -depth / 2)
    return geometry
  }, [board, groove])

  React.useEffect(() => () => boardGeometry.dispose(), [boardGeometry])

  const boardZ = thickness / 2 - board.thickness / 2

  return (
    <group {...groupProps}>
      {/* front and back binder's boards, shifted clear of the french groove */}
      <mesh ref={frontRef} geometry={boardGeometry} position={[groove.width / 2, 0, boardZ]}>
        <meshPhysicalMaterial color={color} metalness={0} roughness={0.72} />
      </mesh>
      <mesh ref={backRef} geometry={boardGeometry} position={[groove.width / 2, 0, -boardZ]}>
        <meshPhysicalMaterial color={color} metalness={0} roughness={0.72} />
      </mesh>

      {/* french grooves: a shallow recessed cloth strip on each cover along
          the spine joint (the front one tucks under the cover art's edge) */}
      {[1, -1].map((sign) => (
        <mesh
          key={sign}
          position={[-board.width / 2 + (groove.width + 0.01) / 2, 0, sign * (boardZ - groove.depth / 2)]}
        >
          <boxGeometry args={[groove.width + 0.01, board.height - 0.016, board.thickness - groove.depth]} />
          <meshPhysicalMaterial color={color} metalness={0} roughness={0.72} />
        </mesh>
      ))}

      {/* page block, flush at the spine and recessed behind the board squares
          on the three open edges (the fore edge overhang is what you see) */}
      <RoundedBox
        args={[pages.width, pages.height, pages.thickness]}
        radius={0.008}
        position-x={-pages.inset / 2}
      >
        <meshPhysicalMaterial color={pageColor} metalness={0} roughness={0.92} />
      </RoundedBox>

      {/* convex cloth backbone: a half-cylinder shell wrapping OUTSIDE the
          bound edge, projecting past the boards (scaled unit cylinder so the
          shell spans the full closed thickness) */}
      <mesh position-x={-board.width / 2 + 0.012} scale={[spine.bulge + 0.012, 1, thickness / 2]}>
        <cylinderGeometry args={[1, 1, board.height, 24, 1, false, Math.PI, Math.PI]} />
        <meshPhysicalMaterial color={color} metalness={0} roughness={0.72} />
      </mesh>

      {/* headbands at the head and tail of the spine, spanning the text block */}
      {[1, -1].map((sign) => (
        <mesh
          key={sign}
          rotation-x={Math.PI / 2}
          position={[-board.width / 2 + 0.01, sign * (pages.height / 2), 0]}
        >
          <cylinderGeometry args={[headband.radius, headband.radius, pages.thickness, 12]} />
          <meshPhysicalMaterial color="#b6403a" metalness={0} roughness={0.6} />
        </mesh>
      ))}

      {/* the live cover: real DOM, CSS3D-transformed onto the front board */}
      <DeviceScreen
        {...screenProps}
        {...resolveSurface(regions.cover, surfaceDefaults)}
        width={cover.width}
        height={cover.height}
        radius={cover.radius}
        position={[0, 0, thickness / 2 + 0.004]}
      >
        {regions.cover?.children}
      </DeviceScreen>

      {/* live back cover */}
      {regions.back != null && (
        <DeviceScreen
          {...screenProps}
          {...resolveSurface(regions.back, surfaceDefaults)}
          width={cover.width}
          height={cover.height}
          radius={cover.radius}
          position={[0, 0, -thickness / 2 - 0.004]}
          rotation={[0, Math.PI, 0]}
        >
          {regions.back.children}
        </DeviceScreen>
      )}

      {/* live spine strip on the backbone crown */}
      {regions.spine != null && (
        <DeviceScreen
          {...screenProps}
          {...resolveSurface(regions.spine, {
            ...surfaceDefaults,
            // the spine shares the cover's dpi unless its slot overrides
            resolution: Math.max(48, Math.round((resolution / cover.width) * spineWidth)),
          })}
          width={spineWidth}
          height={board.height - 0.03}
          radius={0.01}
          position={[spineX, 0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          {regions.spine.children}
        </DeviceScreen>
      )}
    </group>
  )
}
BookImpl.displayName = 'Book'

/** The book's compound slots, shared by `<Book>` and `<BookMockup>`. */
export const bookSlots = createSlots(BOOK_REGIONS)

export const Book = Object.assign(BookImpl, bookSlots)
