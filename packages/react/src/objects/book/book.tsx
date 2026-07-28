import * as React from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { BOOK, BOOK_REGIONS, bookSpec, type BookSize, roundedRectShape } from '@area-3d-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { collectSlots, createSlots, resolveSurface, type SurfaceProps } from '../../slots'

type GroupProps = ThreeElements['group']

export interface BookProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceProps {
  /**
   * Cover art - full bleed on the front board. Bare children fill the front
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
  surfaceStyle,
  ...groupProps
}: BookProps) {
  const regions = collectSlots(children, BOOK_REGIONS)
  const spec = React.useMemo(
    () => (size ? bookSpec(size) : BOOK),
    [size?.width, size?.height, size?.thickness]
  )
  const { board, thickness, pages, spine, groove, headband, cover } = spec

  const surfaceDefaults = {
    surfaceBackground,
    resolution,
    surfaceStyle,
  }
  // A cased-in hardback's backbone is NOT a half-round tube: it is flat
  // across the printed area and rolls off into the joints. Modelling it as a
  // half-cylinder left the flat DOM spine strip floating off the shell
  // everywhere but its centre line - a visible gap down both sides of the
  // spine art. The joint roll is set first (~5 mm of real cloth), and the
  // printed strip is exactly the flat crown that remains, so it sits ON the
  // surface at every point.
  const spineOut = spine.bulge + 0.012
  const spineJoint = Math.min(spineOut * 0.95, thickness * 0.18)
  const spineWidth = thickness - spineJoint * 2
  const spineX = -board.width / 2 + 0.012 - spineOut - 0.002

  // the boards stop short of the spine by the french groove width - the
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

  // The backbone's cross-section, extruded along the book's height: a
  // rounded rectangle whose straight run is the printed crown and whose two
  // rolls are the joints. Only the outboard half is ever seen - the rest is
  // buried behind the page block.
  const spineGeometry = React.useMemo(() => {
    const shape = roundedRectShape(spineOut * 2, thickness, spineJoint)
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: board.height,
      bevelEnabled: false,
      curveSegments: 12,
    })
    geometry.translate(0, 0, -board.height / 2)
    // Extrusion runs along +Z; stand it up so it runs along the book's height.
    geometry.rotateX(-Math.PI / 2)
    return geometry
  }, [spineOut, spineJoint, thickness, board.height])

  React.useEffect(() => {
    return () => {
      boardGeometry.dispose()
      spineGeometry.dispose()
    }
  }, [boardGeometry, spineGeometry])

  const boardZ = thickness / 2 - board.thickness / 2

  return (
    <group {...groupProps}>
      {/* front and back binder's boards, shifted clear of the french groove */}
      <mesh geometry={boardGeometry} position={[groove.width / 2, 0, boardZ]}>
        <meshPhysicalMaterial color={color} metalness={0} roughness={0.72} />
      </mesh>
      <mesh geometry={boardGeometry} position={[groove.width / 2, 0, -boardZ]}>
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

      {/* cloth backbone wrapping OUTSIDE the bound edge and projecting past
          the boards: a flat crown carrying the spine print, rolling off into
          the joints at both hinges */}
      <mesh geometry={spineGeometry} position-x={-board.width / 2 + 0.012}>
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
