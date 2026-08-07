import * as React from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { MILK_CARTON, MILK_CARTON_REGIONS, milkCartonLayout, type MilkCartonSizeMm } from '@area-3d-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { collectSlots, createSlots, resolveSurface, type SurfaceProps } from '../../slots'

type GroupProps = ThreeElements['group']

export interface MilkCartonProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceProps {
  /**
   * Panel designs, full bleed. Bare children fill the front panel; name the
   * others with `<MilkCarton.Back>`, `<MilkCarton.Right>`,
   * `<MilkCarton.Left>` and the two roof panels,
   * `<MilkCarton.GableFront>` / `<MilkCarton.GableBack>`.
   */
  children?: React.ReactNode
  /**
   * Carton size in real millimeters: `{ width, height, depth }`, where
   * `height` is the overall height with the roof and fin included. The
   * longest edge normalizes to the stage, so any size fills the default
   * camera while the mm dimensions set the true proportions. Defaults to the
   * 95×241×95 mm US half-gallon carton.
   */
  size?: MilkCartonSizeMm
  /** Board color. Poly-coated white by default; try a brand dip or kraft. */
  color?: string
  /** Screw cap color. */
  capColor?: string
  /** Render the screw cap on the front roof panel. */
  cap?: boolean
}

/**
 * A procedurally built gable-top beverage carton: poly-coated board walls, the
 * roof folding up to a ridge, an ear fold pinching each end inward the way the
 * excess board really folds, the sealed fin standing on top, and a screw cap on
 * the front roof panel. Every wall is live DOM, and so are both roof panels -
 * the cap rides over the front one exactly like a real spout rides over the
 * print. No 3D asset files are loaded.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 *
 * ```tsx
 * <MilkCarton>
 *   <YourFrontPanel />
 *   <MilkCarton.Right><NutritionPanel /></MilkCarton.Right>
 * </MilkCarton>
 * ```
 */
function MilkCartonImpl({
  children,
  size,
  color = '#f4f3ef',
  capColor = '#d7dbdf',
  cap = true,
  surfaceBackground = '#ffffff',
  resolution = MILK_CARTON.resolution,
  surfaceStyle,
  ...groupProps
}: MilkCartonProps) {
  const regions = collectSlots(children, MILK_CARTON_REGIONS)
  const { body, gable, fin, cap: capSize, height } = React.useMemo(
    () => milkCartonLayout(size),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size?.width, size?.height, size?.depth]
  )

  // The carton is centered on its own group, so the walls run from the base up
  // to the eave and the roof takes it the rest of the way to the fin's top.
  const base = -height / 2
  const eave = base + body.height
  const ridge = eave + gable.rise
  /*
   * The roof panel's pose, from the triangle it spans: it leans back from
   * vertical by `tilt`, and its outward normal (0, normalY, normalZ) is that
   * same triangle's other leg. Both come from the spec's slant rather than
   * from a hand-tuned angle, so a carton of any proportion keeps its roof
   * panels, its cap and its live surfaces on the same plane.
   */
  const tilt = Math.atan2(body.depth / 2, gable.rise)
  const normalY = body.depth / 2 / gable.slant
  const normalZ = gable.rise / gable.slant

  /*
   * The closed roof: a slanted panel front and back, meeting at the ridge,
   * with an ear fold closing each end. One buffer, wound outward - the carton
   * is solid, so nothing needs a back face.
   *
   * The ear folds are the reason an end is not a flat triangle. The side panel
   * carries its full depth up past the eave while the roof narrows toward the
   * ridge, and the excess board has to go somewhere: it creases down the
   * middle and folds INWARD, deepest partway up (`gable.tuckAt`) and pinched
   * back flat where the fin seals it. So each end is two facets meeting along
   * a crease that bows into the carton - flush with the wall at the eave,
   * `gable.tuck` inside it at the peak, back on the ridge line at the top.
   * Flat-shaded off its own faces, so the crease is real geometry catching
   * real light rather than a line painted on a plane.
   */
  const roofGeometry = React.useMemo(() => {
    const hw = body.width / 2
    const hd = body.depth / 2
    const positions: number[] = []
    const push = (...vs: [number, number, number][]) => {
      for (const v of vs) positions.push(...v)
    }
    /** One triangle, wound outward: the far side of a pair mirrors across z or x. */
    const tri = (
      flip: boolean,
      p: [number, number, number],
      q: [number, number, number],
      r: [number, number, number]
    ) => (flip ? push(p, r, q) : push(p, q, r))

    for (const s of [1, -1] as const) {
      // The slant, as seen from outside: eave corners along the bottom, ridge
      // along the top. The far side is wound in reverse - mirroring a face
      // flips which way round its vertices read.
      const a: [number, number, number] = [-hw, eave, s * hd]
      const b: [number, number, number] = [hw, eave, s * hd]
      const c: [number, number, number] = [hw, ridge, 0]
      const d: [number, number, number] = [-hw, ridge, 0]
      tri(s === -1, a, b, c)
      tri(s === -1, a, c, d)

      // The ear fold at the `s` end, as four triangles either side of the
      // crease: eave corners, the crease foot flush in the wall, the crease
      // peak tucked inward, and the pinch point on the ridge.
      const front: [number, number, number] = [s * hw, eave, hd]
      const back: [number, number, number] = [s * hw, eave, -hd]
      const foot: [number, number, number] = [s * hw, eave, 0]
      const peak: [number, number, number] = [
        s * (hw - gable.tuck),
        eave + gable.rise * gable.tuckAt,
        0,
      ]
      const pinch: [number, number, number] = [s * hw, ridge, 0]
      const flip = s === -1
      tri(flip, front, foot, peak)
      tri(flip, front, peak, pinch)
      tri(flip, back, pinch, peak)
      tri(flip, back, peak, foot)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.computeVertexNormals()
    return geometry
  }, [body.width, body.depth, eave, ridge, gable.rise, gable.tuck, gable.tuckAt])
  React.useEffect(() => () => roofGeometry.dispose(), [roofGeometry])

  const board = { color, metalness: 0, roughness: 0.42, clearcoat: 0.45, clearcoatRoughness: 0.35 }

  const panelDefaults = { surfaceBackground, resolution, surfaceStyle }
  const pxPerUnit = resolution / body.width
  // The end panels are as wide as the carton is deep, so they take their own
  // px width at the front panel's dpi rather than the front panel's number.
  const endDefaults = { ...panelDefaults, resolution: Math.round(body.depth * pxPerUnit) }
  const shared = { radius: body.radius }
  // Live surfaces float a hair off the board, clear of z-fighting.
  const LIFT = 0.004

  return (
    <group {...groupProps}>
      {/* the walls */}
      <RoundedBox
        args={[body.width, body.height, body.depth]}
        radius={body.radius}
        position={[0, base + body.height / 2, 0]}
      >
        <meshPhysicalMaterial {...board} />
      </RoundedBox>

      {/* the folded roof */}
      <mesh geometry={roofGeometry}>
        <meshPhysicalMaterial {...board} />
      </mesh>

      {/* the sealed fin, pinched up from all four panels */}
      <mesh position={[0, ridge + fin.height / 2, 0]}>
        <boxGeometry args={[body.width, fin.height, fin.thickness]} />
        <meshPhysicalMaterial {...board} />
      </mesh>

      {/* the screw cap, moulded onto the front roof panel. Its collar sits on
          the panel and the cap stands proud of it, so it masks whatever the
          gable panel is printing - the same way it would on a real carton. */}
      {cap && (
        <group
          position={[
            0,
            eave + gable.rise * capSize.offset,
            (body.depth / 2) * (1 - capSize.offset),
          ]}
          // Rotating +Y onto the panel's outward normal stands the cap up off
          // the slant rather than off the floor.
          rotation-x={Math.atan2(gable.rise, body.depth / 2)}
        >
          <mesh position={[0, capSize.collar / 2, 0]}>
            <cylinderGeometry args={[capSize.flange, capSize.flange, capSize.collar, 32]} />
            <meshPhysicalMaterial color={capColor} metalness={0} roughness={0.45} clearcoat={0.5} />
          </mesh>
          <mesh position={[0, capSize.collar + capSize.height / 2, 0]}>
            <cylinderGeometry args={[capSize.radius, capSize.radius, capSize.height, 32]} />
            <meshPhysicalMaterial color={capColor} metalness={0} roughness={0.35} clearcoat={0.6} />
          </mesh>
        </group>
      )}

      {/* live front panel - always mounted, like the other printed packs: the
          front is the face a carton is designed on, so `surfaceBackground`
          answers for it even before there is artwork */}
      <DeviceScreen
        {...shared}
        {...resolveSurface(regions.front, panelDefaults)}
        width={body.width}
        height={body.height}
        position={[0, base + body.height / 2, body.depth / 2 + LIFT]}
      >
        {regions.front?.children}
      </DeviceScreen>

      {/* live back panel */}
      {regions.back != null && (
        <DeviceScreen
          {...shared}
          {...resolveSurface(regions.back, panelDefaults)}
          width={body.width}
          height={body.height}
          position={[0, base + body.height / 2, -body.depth / 2 - LIFT]}
          rotation={[0, Math.PI, 0]}
        >
          {regions.back.children}
        </DeviceScreen>
      )}

      {/* live end panels */}
      {regions.right != null && (
        <DeviceScreen
          {...shared}
          {...resolveSurface(regions.right, endDefaults)}
          width={body.depth}
          height={body.height}
          position={[body.width / 2 + LIFT, base + body.height / 2, 0]}
          rotation={[0, Math.PI / 2, 0]}
        >
          {regions.right.children}
        </DeviceScreen>
      )}
      {regions.left != null && (
        <DeviceScreen
          {...shared}
          {...resolveSurface(regions.left, endDefaults)}
          width={body.depth}
          height={body.height}
          position={[-body.width / 2 - LIFT, base + body.height / 2, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          {regions.left.children}
        </DeviceScreen>
      )}

      {/* live roof panels. Both are the same surface on the same slant, so the
          back one is the front one seen from the other side: half a turn of
          the group, then the identical local pose. */}
      {([1, -1] as const).map((s) => {
        const slot = s === 1 ? regions.gableFront : regions.gableBack
        if (slot == null) return null
        return (
          <group key={`gable-${s}`} rotation-y={s === 1 ? 0 : Math.PI}>
            <DeviceScreen
              {...shared}
              {...resolveSurface(slot, panelDefaults)}
              width={body.width}
              height={gable.slant}
              position={[
                0,
                eave + gable.rise / 2 + normalY * LIFT,
                body.depth / 4 + normalZ * LIFT,
              ]}
              rotation={[-tilt, 0, 0]}
            >
              {slot.children}
            </DeviceScreen>
          </group>
        )
      })}
    </group>
  )
}
MilkCartonImpl.displayName = 'MilkCarton'

/** The carton's compound slots, shared by `<MilkCarton>` and `<MilkCartonMockup>`. */
export const milkCartonSlots = createSlots(MILK_CARTON_REGIONS)

export const MilkCarton = Object.assign(MilkCartonImpl, milkCartonSlots)
