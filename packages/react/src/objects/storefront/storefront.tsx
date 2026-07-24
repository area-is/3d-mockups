import * as React from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { STOREFRONT, STOREFRONT_REGIONS } from '@area-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { useScreenOccluders } from '../../screen/occluders'
import { collectSlots, createSlots, resolveSurface, type SlotProps, type SurfaceDefaults } from '../../slots'

type GroupProps = ThreeElements['group']

export interface StorefrontProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Region content. Bare children fill the front fascia sign; name regions
   * explicitly with the fascia slots (`<Storefront.Fascia>`,
   * `<Storefront.LeftSign>`, `<Storefront.RightSign>`, `<Storefront.RearSign>`)
   * and the pane slots — `<Storefront.FrontLeft>` and `<Storefront.FrontRight>`
   * are the two display bays either side of the front mullion,
   * `<Storefront.Door>` is the glazed door leaf, and `<Storefront.Left>` /
   * `<Storefront.Right>` / `<Storefront.Rear>` are the wide center panes of
   * the other three elevations (left/right named as you face the shop).
   */
  children?: React.ReactNode
  /** Shopfront paint (fascia surrounds, frames, door, stall risers). */
  color?: string
  /**
   * CSS pixel width of the virtual fascia signs. The window panes keep their
   * own fixed default widths; override per slot with each slot's `resolution`.
   */
  resolution?: number
  /**
   * How content hides when its elevation faces away from the camera.
   * `true` raycasts against the building (fast, interactive). `'blending'`
   * uses per-pixel depth blending. `false` disables hiding.
   */
  occlude?: boolean | 'blending'
}

/**
 * A procedurally built free-standing corner shop: four glazed shopfront
 * elevations under a capped flat roof, the parapet sitting just above the
 * cornice so the painted composition IS the whole building — no masonry.
 * The front (+Z) is the classic high-street shopfront — painted timber
 * surround, stall riser, big display window with a mullion and transom
 * lights, glazed door with a vertical pull, corniced fascia on console
 * brackets. The other three elevations repeat the same composition without
 * the door — windows only — and each carries its own live fascia sign.
 * Every big pane is a mockup surface too: both front display bays, the
 * glazed door leaf and the center pane of each other elevation.
 * The roof is plain hardware. No 3D asset files are loaded.
 *
 * The origin is the building center; the pavement sits
 * `STOREFRONT.standHeight` below it. Must be rendered inside a
 * react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 *
 * ```tsx
 * <Storefront>
 *   <Storefront.Fascia><YourSign /></Storefront.Fascia>
 *   <Storefront.FrontLeft><YourPoster /></Storefront.FrontLeft>
 * </Storefront>
 * ```
 */
function StorefrontImpl({
  children,
  color = '#2e4638',
  surfaceBackground = '#ffffff',
  resolution = STOREFRONT.resolution,
  interactive = true,
  dragToRotate = true,
  occlude = true,
  surfaceStyle,
  ...groupProps
}: StorefrontProps) {
  const regions = collectSlots(children, STOREFRONT_REGIONS)
  const { body, fascia, sign, sideSign, rearSign: rearSignSpec, riser, window: win, roof, standHeight } = STOREFRONT
  const wallRef = React.useRef<THREE.Mesh>(null!)
  const roofRef = React.useRef<THREE.Mesh>(null!)
  const occludeRefs = useScreenOccluders(wallRef, roofRef)

  // Shop glass reflects the street: a lighter blue-gray with strong env
  // reflections, instead of a pitch-black hole in the façade.
  const glassMaterial = (
    <meshPhysicalMaterial
      color="#5a6d75"
      metalness={0.5}
      roughness={0.05}
      clearcoat={1}
      clearcoatRoughness={0.08}
      envMapIntensity={1.6}
    />
  )
  const paint = { color, metalness: 0.05, roughness: 0.55, clearcoat: 0.3 }

  const corniceY = fascia.y + fascia.height / 2 + 0.05
  const riserTop = -standHeight + riser.height
  // Corner pilasters end AT the pavement — no leg stubs lifting the shop.
  const postTop = fascia.y + fascia.height / 4 + 0.35
  const cornerPost = { height: postTop + standHeight, y: (postTop - standHeight) / 2 }
  const windowH = win.top - riserTop
  const frontZ = body.depth / 2
  // front window glazing extent (the door bay sits to its right)
  const glazeX = (win.doorX - 0.35 - body.width / 2) / 2
  const glazeW = win.doorX - 0.35 + body.width / 2 - 0.3
  // transom rail ~450 mm below the window head
  const transomY = win.top - 0.409
  // The big display panes (live mockup areas) run riser-top to transom rail.
  const paneTop = transomY - 0.033
  const paneBottom = riserTop + 0.02
  const paneH = paneTop - paneBottom
  const paneCY = (paneTop + paneBottom) / 2
  // Front bays either side of the mullion (mullion is 0.1 wide).
  const bayL = { x0: glazeX - glazeW / 2, x1: win.mullionX - 0.06 }
  const bayR = { x0: win.mullionX + 0.06, x1: glazeX + glazeW / 2 }

  const screenCommon = {
    occlude: occlude === true ? occludeRefs : occlude === 'blending' ? ('blending' as const) : undefined,
  }
  const surfaceDefaults = {
    background: surfaceBackground,
    resolution,
    interactive,
    dragToRotate,
    style: surfaceStyle,
  }

  // One windows-only elevation, built facing local +Z at `faceDist` — the
  // same composition as the front minus the door — with its fascia sign
  // and a live center pane between the two mullions.
  const windowedElevation = (
    faceDist: number,
    faceLen: number,
    signWidth: number,
    signSlot: SlotProps | undefined,
    windowSlot: SlotProps | undefined
  ) => {
    const glazeL = faceLen - 0.6
    return (
      <>
        <RoundedBox args={[faceLen, fascia.height, 0.12]} radius={0.015} position={[0, fascia.y, faceDist + 0.02]}>
          <meshPhysicalMaterial {...paint} />
        </RoundedBox>
        <RoundedBox args={[faceLen + 0.12, 0.12, 0.2]} radius={0.02} position={[0, corniceY, faceDist + 0.03]}>
          <meshPhysicalMaterial {...paint} />
        </RoundedBox>
        {([1, -1] as const).map((s) => (
          <RoundedBox key={s} args={[0.16, cornerPost.height, 0.14]} radius={0.015} position={[s * (faceLen / 2 - 0.08), cornerPost.y, faceDist + 0.02]}>
            <meshPhysicalMaterial {...paint} />
          </RoundedBox>
        ))}
        <RoundedBox args={[faceLen, riser.height, 0.1]} radius={0.012} position={[0, -standHeight + riser.height / 2, faceDist + 0.015]}>
          <meshPhysicalMaterial {...paint} />
        </RoundedBox>
        {/* pilaster-to-pilaster glazing — windows only, no door */}
        <mesh position={[0, riserTop + windowH / 2, faceDist + 0.005]}>
          <planeGeometry args={[glazeL, windowH]} />
          {glassMaterial}
        </mesh>
        {([1, -1] as const).map((s) => (
          <RoundedBox key={s} args={[0.1, windowH, 0.1]} radius={0.012} position={[s * (glazeL / 3), riserTop + windowH / 2, faceDist + 0.02]}>
            <meshPhysicalMaterial {...paint} />
          </RoundedBox>
        ))}
        <RoundedBox args={[faceLen, 0.1, 0.1]} radius={0.012} position={[0, win.top + 0.02, faceDist + 0.02]}>
          <meshPhysicalMaterial {...paint} />
        </RoundedBox>
        <RoundedBox args={[glazeL + 0.1, 0.055, 0.09]} radius={0.012} position={[0, transomY, faceDist + 0.02]}>
          <meshPhysicalMaterial {...paint} />
        </RoundedBox>
        {([-1, 1] as const).map((s) => (
          <RoundedBox key={s} args={[0.045, win.top - transomY, 0.08]} radius={0.01} position={[s * (glazeL / 6), (win.top + transomY) / 2, faceDist + 0.018]}>
            <meshPhysicalMaterial {...paint} />
          </RoundedBox>
        ))}
        {([1, -1] as const).map((s) => (
          <RoundedBox key={s} args={[0.14, 0.26, 0.14]} radius={0.02} position={[s * (faceLen / 2 - 0.15), fascia.y + fascia.height / 2 - 0.13, faceDist + 0.06]}>
            <meshPhysicalMaterial {...paint} />
          </RoundedBox>
        ))}
        {signSlot != null && (
          <DeviceScreen
            {...screenCommon}
            {...resolveSurface(signSlot, surfaceDefaults)}
            width={signWidth}
            height={sign.height}
            radius={sign.radius}
            position={[0, fascia.y, faceDist + 0.085]}
          >
            {signSlot.children}
          </DeviceScreen>
        )}
        {/* live center pane between the two mullions */}
        {windowSlot != null && (
          <DeviceScreen
            {...screenCommon}
            {...resolveSurface(windowSlot, { ...surfaceDefaults, resolution: 420 })}
            width={(glazeL * 2) / 3 - 0.12}
            height={paneH}
            radius={0.004}
            position={[0, paneCY, faceDist + 0.012]}
          >
            {windowSlot.children}
          </DeviceScreen>
        )}
      </>
    )
  }

  return (
    <group {...groupProps}>
      {/* the building volume, painted like the joinery so slivers between
          the applied elements read as the same shopfront timber */}
      <mesh ref={wallRef}>
        <boxGeometry args={[body.width, body.height, body.depth]} />
        <meshPhysicalMaterial {...paint} roughness={0.7} />
      </mesh>

      {/* capped flat roof, overhanging the parapet line all round */}
      <RoundedBox
        ref={roofRef}
        args={[body.width + roof.overhang * 2, roof.thickness, body.depth + roof.overhang * 2]}
        radius={0.02}
        position={[0, body.height / 2 + roof.thickness / 2, 0]}
      >
        <meshPhysicalMaterial color="#33363b" metalness={0.1} roughness={0.85} />
      </RoundedBox>

      {/* ---------- front elevation (+Z): the full shopfront ---------- */}
      <RoundedBox args={[body.width, fascia.height, 0.12]} radius={0.015} position={[0, fascia.y, frontZ + 0.02]}>
        <meshPhysicalMaterial {...paint} />
      </RoundedBox>
      <RoundedBox args={[body.width + 0.12, 0.12, 0.2]} radius={0.02} position={[0, corniceY, frontZ + 0.03]}>
        <meshPhysicalMaterial {...paint} />
      </RoundedBox>
      {([1, -1] as const).map((s) => (
        <RoundedBox key={s} args={[0.16, cornerPost.height, 0.14]} radius={0.015} position={[s * (body.width / 2 - 0.08), cornerPost.y, frontZ + 0.02]}>
          <meshPhysicalMaterial {...paint} />
        </RoundedBox>
      ))}
      {/* stall riser under the windows — it stops at the door bay, so the
          glazed door runs all the way to the pavement instead of being
          cut off at knee height */}
      <RoundedBox
        args={[win.doorX + body.width / 2, riser.height, 0.1]}
        radius={0.012}
        position={[(win.doorX - body.width / 2) / 2, -standHeight + riser.height / 2, frontZ + 0.015]}
      >
        <meshPhysicalMaterial {...paint} />
      </RoundedBox>
      <RoundedBox
        args={[body.width / 2 - win.doorX - win.doorWidth, riser.height, 0.1]}
        radius={0.012}
        position={[(win.doorX + win.doorWidth + body.width / 2) / 2, -standHeight + riser.height / 2, frontZ + 0.015]}
      >
        <meshPhysicalMaterial {...paint} />
      </RoundedBox>
      {/* low threshold plate under the door leaf */}
      <RoundedBox
        args={[win.doorWidth, 0.035, 0.03]}
        radius={0.008}
        position={[win.doorX + win.doorWidth / 2, -standHeight + 0.018, frontZ + 0.028]}
      >
        <meshPhysicalMaterial color="#9aa0a8" metalness={0.7} roughness={0.4} />
      </RoundedBox>

      {/* display glazing: window bays left of the door, door bay right */}
      <mesh position={[glazeX, riserTop + windowH / 2, frontZ + 0.005]}>
        <planeGeometry args={[glazeW, windowH]} />
        {glassMaterial}
      </mesh>
      {/* painted pilaster panel between the window bay and the door bay */}
      <RoundedBox
        args={[win.doorX - (glazeX + glazeW / 2) + 0.08, windowH + riser.height, 0.09]}
        radius={0.012}
        position={[
          (glazeX + glazeW / 2 + win.doorX) / 2,
          riserTop + (windowH - riser.height) / 2,
          frontZ + 0.012,
        ]}
      >
        <meshPhysicalMaterial {...paint} />
      </RoundedBox>
      {/* mullion + window head */}
      <RoundedBox args={[0.1, windowH, 0.1]} radius={0.012} position={[win.mullionX, riserTop + windowH / 2, frontZ + 0.02]}>
        <meshPhysicalMaterial {...paint} />
      </RoundedBox>
      <RoundedBox args={[body.width, 0.1, 0.1]} radius={0.012} position={[0, win.top + 0.02, frontZ + 0.02]}>
        <meshPhysicalMaterial {...paint} />
      </RoundedBox>
      {/* transom rail + dividers: the band above reads as transom lights */}
      <RoundedBox args={[glazeW + 0.1, 0.055, 0.09]} radius={0.012} position={[glazeX, transomY, frontZ + 0.02]}>
        <meshPhysicalMaterial {...paint} />
      </RoundedBox>
      {[-1.61, -0.07, 0.52].map((x) => (
        <RoundedBox key={x} args={[0.045, win.top - transomY, 0.08]} radius={0.01} position={[x, (win.top + transomY) / 2, frontZ + 0.018]}>
          <meshPhysicalMaterial {...paint} />
        </RoundedBox>
      ))}

      {/* glazed door with frame, handle and a doorstep */}
      <RoundedBox args={[win.doorWidth, windowH + riser.height, 0.08]} radius={0.015} position={[win.doorX + win.doorWidth / 2, riserTop + (windowH - riser.height) / 2, frontZ + 0.012]}>
        <meshPhysicalMaterial {...paint} />
      </RoundedBox>
      <mesh position={[win.doorX + win.doorWidth / 2, riserTop + windowH / 2 - 0.15, frontZ + 0.055]}>
        <planeGeometry args={[win.doorWidth - 0.22, windowH + riser.height - 0.34]} />
        {glassMaterial}
      </mesh>
      {/* vertical pull (~300 mm) on the lock stile, ~1 m above the pavement */}
      <mesh position={[win.doorX + 0.16, -standHeight + 0.909, frontZ + 0.075]}>
        <cylinderGeometry args={[0.015, 0.015, 0.273, 10]} />
        <meshPhysicalMaterial color="#c9ccd2" metalness={0.9} roughness={0.3} />
      </mesh>
      {([1, -1] as const).map((s) => (
        <mesh key={s} rotation-x={Math.PI / 2} position={[win.doorX + 0.16, -standHeight + 0.909 + s * 0.11, frontZ + 0.065]}>
          <cylinderGeometry args={[0.008, 0.008, 0.03, 8]} />
          <meshPhysicalMaterial color="#c9ccd2" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}

      {/* console brackets carrying the cornice at the fascia ends */}
      {([1, -1] as const).map((s) => (
        <RoundedBox key={s} args={[0.14, 0.26, 0.14]} radius={0.02} position={[s * (body.width / 2 - 0.15), fascia.y + fascia.height / 2 - 0.13, frontZ + 0.06]}>
          <meshPhysicalMaterial {...paint} />
        </RoundedBox>
      ))}

      {/* front fascia sign */}
      <DeviceScreen
        {...screenCommon}
        {...resolveSurface(regions.fascia, surfaceDefaults)}
        width={sign.width}
        height={sign.height}
        radius={sign.radius}
        position={[0, fascia.y, frontZ + 0.085]}
      >
        {regions.fascia?.children}
      </DeviceScreen>

      {/* the two front display bays, live either side of the mullion */}
      {regions.frontLeft != null && (
        <DeviceScreen
          {...screenCommon}
          {...resolveSurface(regions.frontLeft, { ...surfaceDefaults, resolution: 480 })}
          width={bayL.x1 - bayL.x0}
          height={paneH}
          radius={0.004}
          position={[(bayL.x0 + bayL.x1) / 2, paneCY, frontZ + 0.012]}
        >
          {regions.frontLeft.children}
        </DeviceScreen>
      )}
      {regions.frontRight != null && (
        <DeviceScreen
          {...screenCommon}
          {...resolveSurface(regions.frontRight, { ...surfaceDefaults, resolution: 460 })}
          width={bayR.x1 - bayR.x0}
          height={paneH}
          radius={0.004}
          position={[(bayR.x0 + bayR.x1) / 2, paneCY, frontZ + 0.012]}
        >
          {regions.frontRight.children}
        </DeviceScreen>
      )}
      {/* the glazed door leaf, live above its kick rail */}
      {regions.door != null && (
        <DeviceScreen
          {...screenCommon}
          {...resolveSurface(regions.door, { ...surfaceDefaults, resolution: 260 })}
          width={win.doorWidth - 0.24}
          height={windowH + riser.height - 0.36}
          radius={0.004}
          position={[win.doorX + win.doorWidth / 2, riserTop + windowH / 2 - 0.15, frontZ + 0.062]}
        >
          {regions.door.children}
        </DeviceScreen>
      )}

      {/* ---------- windows-only elevations: right (+X), left (−X), rear (−Z),
          left/right named as you face the shop from the street ---------- */}
      <group rotation-y={Math.PI / 2}>
        {windowedElevation(body.width / 2, body.depth, sideSign.width, regions.rightSign, regions.right)}
      </group>
      <group rotation-y={-Math.PI / 2}>
        {windowedElevation(body.width / 2, body.depth, sideSign.width, regions.leftSign, regions.left)}
      </group>
      <group rotation-y={Math.PI}>
        {windowedElevation(body.depth / 2, body.width, rearSignSpec.width, regions.rearSign, regions.rear)}
      </group>
    </group>
  )
}
StorefrontImpl.displayName = 'Storefront'

/** The shop's compound slots, shared by `<Storefront>` and `<StorefrontMockup>`. */
export const storefrontSlots = createSlots(STOREFRONT_REGIONS)

export const Storefront = Object.assign(StorefrontImpl, storefrontSlots)
