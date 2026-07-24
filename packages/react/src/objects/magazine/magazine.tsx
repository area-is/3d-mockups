import * as React from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { MAGAZINE, MAGAZINE_REGIONS, magazineSpec, type MagazineSize } from '@area-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { roundedRectShape } from '@area-mockups/core'
import { useScreenOccluders } from '../../screen/occluders'
import { collectSlots, createSlots, resolveSurface, type SurfaceDefaults } from '../../slots'

type GroupProps = ThreeElements['group']

export interface MagazineProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Cover art — full bleed on the front cover. Bare children fill the front
   * cover; name faces explicitly with `<Magazine.Cover>`, `<Magazine.Back>`
   * and `<Magazine.Spine>`. Spine content is rotated to read top-to-bottom
   * like a real shelf spine: your DOM's left edge lands at the spine's top
   * and its top edge faces the front cover.
   */
  children?: React.ReactNode
  /**
   * Physical trim size in millimeters, e.g. `{ width: 210, height: 297 }`
   * for A4 or `{ thickness: 12 }` for a thick issue. Defaults to the
   * 216 x 279 x 6 mm US letter trim.
   */
  size?: MagazineSize
  /** Paper color of the trimmed page edges. */
  pageColor?: string
  /** Back cover color (the unprinted default is a light stock gray). */
  backColor?: string
  /**
   * Glossy cover stock: a soft diagonal sheen over the cover art and a
   * clearcoat on the spine and back. Off by default — the default stock
   * is matte paper, flat under any light.
   */
  glossy?: boolean
  /**
   * How cover content hides when the magazine faces away from the camera.
   * `true` raycasts against the page block (fast, interactive). `'blending'`
   * uses per-pixel depth blending. `false` disables hiding.
   */
  occlude?: boolean | 'blending'
}

/**
 * A procedurally built perfect-bound magazine: a thin letter-trim page block
 * with visible paper edges, a flat glued spine, and live full-bleed front
 * and back covers on matte stock (opt into `glossy` for a sheen). No 3D
 * asset files are loaded.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 *
 * ```tsx
 * <Magazine glossy>
 *   <Magazine.Cover><CoverArt /></Magazine.Cover>
 *   <Magazine.Back><BackAd /></Magazine.Back>
 * </Magazine>
 * ```
 */
function MagazineImpl({
  children,
  size,
  pageColor = '#fbfaf7',
  backColor = '#e9e7e2',
  glossy = false,
  surfaceBackground = '#ffffff',
  resolution = MAGAZINE.resolution,
  interactive = true,
  dragToRotate = true,
  occlude = true,
  surfaceStyle,
  ...groupProps
}: MagazineProps) {
  const regions = collectSlots(children, MAGAZINE_REGIONS)
  const { body, cover } = React.useMemo(
    () => (size ? magazineSpec(size) : MAGAZINE),
    [size?.width, size?.height, size?.thickness]
  )
  const bodyRef = React.useRef<THREE.Mesh>(null!)
  const occludeRefs = useScreenOccluders(bodyRef)
  // Screens occlude against OTHER registered bodies only — the page block
  // is convex, so the backface culler already covers every view it could
  // block itself, and own-body ray grazes would false-hide the thin spine
  // strip at the shallow angles a spine is naturally viewed from.
  const otherOccludeRefs = React.useMemo(() => occludeRefs.filter((ref) => ref !== bodyRef), [occludeRefs])

  // The spine and back share one cover-stock finish: matte by default
  // (rough, no clearcoat — flat under any light, like uncoated paper),
  // or the coated gloss look when `glossy` is on.
  const coverStockMaterial = glossy ? (
    <meshPhysicalMaterial color={backColor} metalness={0} roughness={0.35} clearcoat={0.5} />
  ) : (
    <meshPhysicalMaterial color={backColor} metalness={0} roughness={0.72} />
  )

  const glossOverlay = glossy ? (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 2147483647,
        background:
          'linear-gradient(112deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 24%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 72%, rgba(255,255,255,0.05) 100%)',
      }}
    />
  ) : undefined

  const backGeometry = React.useMemo(
    () =>
      new THREE.ShapeGeometry(
        roundedRectShape(body.width - 0.01, body.height - 0.01, body.radius),
        12
      ),
    [body]
  )

  React.useEffect(() => () => backGeometry.dispose(), [backGeometry])

  const surfaceDefaults = {
    background: surfaceBackground,
    resolution,
    interactive,
    dragToRotate,
    style: surfaceStyle,
  }
  const screenOcclude =
    occlude === true ? otherOccludeRefs : occlude === 'blending' ? ('blending' as const) : undefined

  return (
    <group {...groupProps}>
      {/* trimmed page block — the paper edges you see on the three open sides */}
      <RoundedBox ref={bodyRef} args={[body.width, body.height, body.thickness]} radius={body.radius}>
        <meshPhysicalMaterial color={pageColor} metalness={0} roughness={0.9} />
      </RoundedBox>

      {/* perfect-bound spine: the cover stock wraps only the bound edge,
          trimmed flush with the block on the other sides (the hair of
          offset just avoids z-fighting with the page block faces) */}
      <RoundedBox
        args={[0.016, body.height - 0.002, body.thickness + 0.001]}
        radius={0.004}
        position-x={-body.width / 2}
      >
        {coverStockMaterial}
      </RoundedBox>

      {/* back cover, on the same stock as the spine */}
      <mesh geometry={backGeometry} rotation-y={Math.PI} position-z={-body.thickness / 2 - 0.002}>
        {coverStockMaterial}
      </mesh>

      {/* the live cover: real DOM, CSS3D-transformed onto the front */}
      <DeviceScreen
        {...resolveSurface(regions.cover, surfaceDefaults)}
        width={cover.width}
        height={cover.height}
        radius={cover.radius}
        position={[0, 0, body.thickness / 2 + 0.004]}
        occlude={screenOcclude}
        overlay={glossOverlay}
      >
        {regions.cover?.children}
      </DeviceScreen>

      {/* live back cover — same stock, same sheen */}
      {regions.back != null && (
        <DeviceScreen
          {...resolveSurface(regions.back, surfaceDefaults)}
          width={cover.width}
          height={cover.height}
          radius={cover.radius}
          position={[0, 0, -body.thickness / 2 - 0.004]}
          rotation={[0, Math.PI, 0]}
          occlude={screenOcclude}
          overlay={glossOverlay}
        >
          {regions.back.children}
        </DeviceScreen>
      )}

      {/* live spine: the bound edge's narrow strip, rotated so content
          reads top-to-bottom like a real shelf spine — DOM left lands at
          the spine's top, DOM top faces the front cover. Rendered at 3x
          the cover dpi: at print scale the strip is only a few mm tall,
          and small type needs the extra pixels to stay crisp. */}
      {regions.spine != null && (
        <DeviceScreen
          {...resolveSurface(regions.spine, {
            ...surfaceDefaults,
            resolution: Math.round(resolution * 3 * ((body.height - 0.008) / cover.width)),
          })}
          width={body.height - 0.008}
          height={body.thickness - 0.004}
          radius={0.006}
          position={[-body.width / 2 - 0.01, 0, 0]}
          rotation={[0, -Math.PI / 2, -Math.PI / 2]}
          occlude={screenOcclude}
          overlay={glossOverlay}
        >
          {regions.spine.children}
        </DeviceScreen>
      )}
    </group>
  )
}
MagazineImpl.displayName = 'Magazine'

/** The magazine's compound slots, shared by `<Magazine>` and `<MagazineMockup>`. */
export const magazineSlots = createSlots(MAGAZINE_REGIONS)

export const Magazine = Object.assign(MagazineImpl, magazineSlots)
