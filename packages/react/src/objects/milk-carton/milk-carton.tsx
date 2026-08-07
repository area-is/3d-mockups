import * as React from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import {
  MILK_CARTON,
  MILK_CARTON_REGIONS,
  gearShape,
  milkCartonLayout,
  type MilkCartonSizeMm,
} from '@area-3d-mockups/core'
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
   * The ridge, flattened by the width of its own fold (`gable.crease`).
   *
   * Board creased on a rule comes off it rounded, so the two roof planes never
   * actually meet in a line: they run out onto a narrow flat that the fin
   * stands on. Both planes stay exactly where the spec puts them - the flat is
   * where they would have crossed, which is why its top sits a hair below the
   * nominal ridge and the fin grows by the same amount to keep the carton its
   * documented height.
   */
  const ridgeDrop = (gable.crease * gable.rise) / (body.depth / 2)
  const apex = ridge - ridgeDrop

  /*
   * The closed roof: a slanted panel front and back, running out onto the
   * ridge flat, with an ear fold closing each end. One buffer, wound outward -
   * the carton is solid, so nothing needs a back face.
   *
   * The ear folds are the reason an end is not a flat triangle. The side panel
   * carries its full depth up past the eave while the roof narrows toward the
   * ridge, and the excess board has to go somewhere: it creases down the
   * middle and folds INWARD, deepening the whole way up until the two halves
   * close on each other just under the fin (`gable.tuckAt`) and are pinched
   * flat to be sealed into it. So each end is two facets meeting along a
   * crease that dives into the carton - flush with the wall at the eave,
   * `gable.tuck` inside it just below the fin, back out to the fin at the top.
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

    const crease = gable.crease
    for (const s of [1, -1] as const) {
      // The slant, as seen from outside: eave corners along the bottom, the
      // ridge flat's near edge along the top. The far side is wound in reverse
      // - mirroring a face flips which way round its vertices read.
      const a: [number, number, number] = [-hw, eave, s * hd]
      const b: [number, number, number] = [hw, eave, s * hd]
      const c: [number, number, number] = [hw, apex, s * crease]
      const d: [number, number, number] = [-hw, apex, s * crease]
      tri(s === -1, a, b, c)
      tri(s === -1, a, c, d)
    }

    // The ridge flat itself, bridging the two planes.
    tri(false, [-hw, apex, crease], [hw, apex, crease], [hw, apex, -crease])
    tri(false, [-hw, apex, crease], [hw, apex, -crease], [-hw, apex, -crease])

    for (const s of [1, -1] as const) {
      /*
       * The ear fold at the `s` end: a fan from the tucked crease peak out to
       * every corner of the opening it closes - the two eave corners with the
       * crease's foot between them, and the two ends of the ridge flat above.
       * Walking the rim in order keeps every triangle wound the same way.
       */
      const peak: [number, number, number] = [
        s * (hw - gable.tuck),
        eave + gable.rise * gable.tuckAt,
        0,
      ]
      const rim: [number, number, number][] = [
        [s * hw, eave, hd],
        [s * hw, eave, 0],
        [s * hw, eave, -hd],
        [s * hw, apex, -crease],
        [s * hw, apex, crease],
      ]
      for (let i = 0; i < rim.length; i++) {
        tri(s === -1, rim[i]!, rim[(i + 1) % rim.length]!, peak)
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.computeVertexNormals()
    return geometry
  }, [body.width, body.depth, eave, apex, gable.rise, gable.tuck, gable.tuckAt, gable.crease])
  React.useEffect(() => () => roofGeometry.dispose(), [roofGeometry])

  /*
   * The cap's grip: the same gear profile the watch crown is machined from,
   * extruded down the cap's axis so the ribs run the height of the skirt. A
   * closure is knurled for the same reason a crown is - so a wet hand can
   * turn it - and it is the detail that separates a screw cap from a puck.
   *
   * Extruded along +Z and stood upright by the mesh, because that is the axis
   * ExtrudeGeometry works on.
   */
  const capGeometry = React.useMemo(() => {
    if (!cap) return null
    const skirt = capSize.height - capSize.rim * 2
    return new THREE.ExtrudeGeometry(gearShape(capSize.radius, capSize.flutes, capSize.fluteDepth), {
      depth: Math.max(skirt, capSize.height * 0.2),
      bevelEnabled: false,
    })
  }, [cap, capSize.radius, capSize.flutes, capSize.fluteDepth, capSize.height, capSize.rim])
  React.useEffect(() => () => capGeometry?.dispose(), [capGeometry])

  const board = { color, metalness: 0, roughness: 0.42, clearcoat: 0.45, clearcoatRoughness: 0.35 }
  const plastic = { color: capColor, metalness: 0, roughness: 0.38, clearcoat: 0.55 }

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

      {/* The sealed fin, pinched up from all four panels: four plies and the
          seal between them, so it is thin - and pressed, so its edges are
          rounded. It stands on the ridge flat and makes up the drop, leaving
          the carton exactly as tall as the spec says. */}
      <RoundedBox
        args={[body.width, fin.height + ridgeDrop, fin.thickness]}
        radius={fin.radius}
        steps={1}
        smoothness={3}
        position={[0, apex + (fin.height + ridgeDrop) / 2, 0]}
      >
        <meshPhysicalMaterial {...board} />
      </RoundedBox>

      {/* the screw cap, moulded onto the front roof panel. Its collar sits on
          the panel and the cap stands proud of it, so it masks whatever the
          gable panel is printing - the same way it would on a real carton. */}
      {cap && capGeometry && (
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
          {/* the moulded neck flange the cap screws onto */}
          <mesh position={[0, capSize.collar / 2, 0]}>
            <cylinderGeometry args={[capSize.flange, capSize.flange, capSize.collar, 48]} />
            <meshPhysicalMaterial {...plastic} roughness={0.45} />
          </mesh>
          {/* the smooth band the ribs run out into at the foot of the skirt */}
          <mesh position={[0, capSize.collar + capSize.rim / 2, 0]}>
            <cylinderGeometry args={[capSize.radius, capSize.radius, capSize.rim, 48]} />
            <meshPhysicalMaterial {...plastic} />
          </mesh>
          {/* the ribbed skirt itself */}
          <mesh
            geometry={capGeometry}
            position={[0, capSize.collar + capSize.rim, 0]}
            rotation-x={-Math.PI / 2}
          >
            <meshPhysicalMaterial {...plastic} />
          </mesh>
          {/* the flat top, drawn in a hair over the skirt like a moulded
              closure's, so the ribs end on a shoulder rather than an edge */}
          <mesh position={[0, capSize.collar + capSize.height - capSize.rim / 2, 0]}>
            <cylinderGeometry
              args={[capSize.radius - capSize.fluteDepth, capSize.radius, capSize.rim, 48]}
            />
            <meshPhysicalMaterial {...plastic} roughness={0.3} />
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
