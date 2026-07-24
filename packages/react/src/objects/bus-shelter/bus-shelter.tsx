import * as React from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { BUS_SHELTER, BUS_SHELTER_REGIONS } from '@area-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { useScreenOccluders } from '../../screen/occluders'
import { LEDText, isLedText } from '../../led-text'
import { collectSlots, createSlots, resolveSurface, type SurfaceDefaults } from '../../slots'

type GroupProps = ThreeElements['group']

export interface BusShelterProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Region content. Bare children fill the outward 6-sheet lightbox face;
   * name regions explicitly with `<BusShelter.Poster>`, `<BusShelter.Inner>`
   * (the waiting-area lightbox face), `<BusShelter.Arrivals>` and
   * `<BusShelter.ArrivalsBack>`. The arrivals slots take an array of strings
   * for the built-in dot-matrix LED board (one row per arrival, rows scroll
   * when they overflow), a single string for a one-line message — or any
   * React node for full custom control; the waiting-area face mirrors
   * `<BusShelter.Arrivals>` unless `<BusShelter.ArrivalsBack>` is given.
   */
  children?: React.ReactNode
  /** Street-furniture steel color (roof, posts, frames, bench). */
  color?: string
  /**
   * How poster content hides when its face turns away from the camera.
   * `true` raycasts against the lightbox (fast, interactive). `'blending'`
   * uses per-pixel depth blending. `false` disables hiding.
   */
  occlude?: boolean | 'blending'
}

/**
 * A procedurally built glass transit shelter with a backlit 6-sheet
 * advertising lightbox as its end panel: flat roof slab on slim posts, glass
 * back wall, bench — and the 1185 x 1750 mm poster live on both faces of
 * the lightbox. No 3D asset files are loaded.
 *
 * The origin is the envelope center; the pavement sits
 * `BUS_SHELTER.standHeight` below it. The lightbox faces ±X (along the
 * sidewalk) — pose the shelter in three-quarter view to feature it. Must be
 * rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 *
 * ```tsx
 * <BusShelter>
 *   <BusShelter.Poster><YourPoster /></BusShelter.Poster>
 *   <BusShelter.Arrivals>{['12  City Centre  3 min', '7  Station  9 min']}</BusShelter.Arrivals>
 * </BusShelter>
 * ```
 */
function BusShelterImpl({
  children,
  color = '#2f333a',
  surfaceBackground = '#ffffff',
  resolution = BUS_SHELTER.resolution,
  interactive = true,
  dragToRotate = true,
  occlude = true,
  surfaceStyle,
  ...groupProps
}: BusShelterProps) {
  const regions = collectSlots(children, BUS_SHELTER_REGIONS)
  const { body, roof, backGlass, post, bench, lightbox, poster, flag, display, standHeight } = BUS_SHELTER
  const boxRef = React.useRef<THREE.Mesh>(null!)
  // The roof and the arrivals board's housing must occlude too — without
  // them the live poster and LED board composite straight through the roof
  // when the shelter is seen from above.
  const roofRef = React.useRef<THREE.Mesh>(null!)
  const boardRef = React.useRef<THREE.Mesh>(null!)
  const occludeRefs = useScreenOccluders(boxRef, roofRef, boardRef)

  // Plain strings become the built-in LED arrivals board — an array is one
  // row per arrival; custom nodes pass straight through.
  const toBoard = (content: React.ReactNode) =>
    isLedText(content) ? (
      <LEDText
        text={content}
        mode={typeof content === 'string' ? 'auto' : 'rows'}
        align="left"
        background="#0b0c0e"
        dotSize={3}
      />
    ) : (
      content
    )
  const board = toBoard(regions.arrivals?.children)
  // The waiting-area face mirrors the street face unless overridden.
  const backBoard = regions.arrivalsBack === undefined ? board : toBoard(regions.arrivalsBack.children)

  const glassMaterial = (
    <meshPhysicalMaterial
      color="#b8c8d4"
      metalness={0.1}
      roughness={0.05}
      transmission={0.85}
      transparent
      opacity={0.4}
      clearcoat={1}
    />
  )
  const steel = { color, metalness: 0.65, roughness: 0.4 }

  const roofY = body.height / 2 - roof.thickness / 2
  const floorY = -standHeight

  const surfaceDefaults = {
    background: surfaceBackground,
    resolution,
    interactive,
    dragToRotate,
    style: surfaceStyle,
  }
  // The arrivals board is a dark LED surface at the display's own resolution.
  const boardDefaults = {
    background: '#0b0c0e',
    resolution: display.resolution,
    interactive,
    dragToRotate,
    style: surfaceStyle,
  }
  const posterProps = {
    width: poster.width,
    height: poster.height,
    radius: poster.radius,
    occlude: occlude === true ? occludeRefs : occlude === 'blending' ? ('blending' as const) : undefined,
  }

  return (
    <group {...groupProps}>
      {/* flat roof slab */}
      <RoundedBox ref={roofRef} args={[roof.width, roof.thickness, roof.depth]} radius={0.03} position={[0, roofY, 0]}>
        <meshPhysicalMaterial {...steel} />
      </RoundedBox>

      {/* glass back wall: floats ~120 mm above the pavement in a slim clamp
          rail, and stops ~80 mm short of the roof */}
      <mesh position={[-0.35, floorY + 0.171 + backGlass.height / 2, -body.depth / 2 + 0.05]}>
        <boxGeometry args={[backGlass.width - lightbox.width, backGlass.height, backGlass.thickness]} />
        {glassMaterial}
      </mesh>
      <RoundedBox args={[backGlass.width - lightbox.width, 0.1, 0.08]} radius={0.02} position={[-0.35, floorY + 0.171, -body.depth / 2 + 0.05]}>
        <meshPhysicalMaterial {...steel} />
      </RoundedBox>
      {/* manifestation frit bands (~60 mm) at ~900 and ~1500 mm above ground */}
      {[1.286, 2.143].map((h) => (
        <mesh key={h} position={[-0.35, floorY + h, -body.depth / 2 + 0.05 + backGlass.thickness / 2 + 0.002]}>
          <planeGeometry args={[backGlass.width - lightbox.width - 0.1, 0.086]} />
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.4} roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* two slim posts on the back-wall line — the roof cantilevers forward,
          and the lightbox cabinet is structural at its end */}
      {([
        [-body.width / 2 + 0.9, -body.depth / 2 + 0.1],
        [1.3, -body.depth / 2 + 0.1],
      ] as const).map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, -0.05, z]}>
          <cylinderGeometry args={[post.radius, post.radius, body.height - roof.thickness, 14]} />
          <meshPhysicalMaterial {...steel} />
        </mesh>
      ))}

      {/* bench on two supports along the back wall */}
      <group position={[bench.x, 0, -body.depth / 2 + bench.depth / 2 + 0.16]}>
        <RoundedBox args={[bench.width, bench.thickness, bench.depth]} radius={0.02} position={[0, floorY + bench.height, 0]}>
          <meshPhysicalMaterial color="#6e614d" metalness={0.1} roughness={0.7} />
        </RoundedBox>
        {([1, -1] as const).map((s) => (
          <mesh key={s} position={[s * (bench.width / 2 - 0.3), floorY + bench.height / 2, 0]}>
            <boxGeometry args={[0.08, bench.height, bench.depth - 0.1]} />
            <meshPhysicalMaterial {...steel} />
          </mesh>
        ))}
      </group>

      {/* bus-stop flag on a short post rising above the roof, by the lightbox end */}
      <group position={[flag.x, 0, 0]}>
        <mesh position={[0, roofY + 0.36, 0]}>
          <cylinderGeometry args={[flag.postRadius, flag.postRadius, 0.8, 14]} />
          <meshPhysicalMaterial {...steel} />
        </mesh>
        {/* double-sided sign panel facing along the sidewalk, like the lightbox */}
        <RoundedBox args={[0.045, flag.height, flag.width]} radius={0.02} position={[0, roofY + 0.51, 0]}>
          <meshPhysicalMaterial color="#e9edf2" metalness={0.1} roughness={0.5} />
        </RoundedBox>
      </group>

      {/* RTPI arrivals display hanging under the roof near the front edge */}
      {regions.arrivals != null && (
        <group position={[display.x, roofY - roof.thickness / 2 - display.drop - display.height / 2 - 0.05, body.depth / 2 - 0.3]}>
          {([1, -1] as const).map((s) => (
            <mesh key={s} position={[s * (display.width / 2 - 0.12), display.height / 2 + 0.05 + display.drop / 2, 0]}>
              <boxGeometry args={[0.035, display.drop + 0.1, 0.035]} />
              <meshPhysicalMaterial {...steel} />
            </mesh>
          ))}
          <RoundedBox ref={boardRef} args={[display.width + 0.09, display.height + 0.09, 0.09]} radius={0.02}>
            <meshPhysicalMaterial color="#1c1e22" metalness={0.4} roughness={0.5} />
          </RoundedBox>
          <DeviceScreen
            width={display.width}
            height={display.height}
            radius={0.01}
            {...resolveSurface(regions.arrivals, boardDefaults)}
            position={[0, 0, 0.049]}
            // Per-pixel blending: the hanging board sits INSIDE the shelter,
            // so pillars, glass frames and the roof edge cross in front of it
            // at many angles — raycast's all-or-nothing hide either blanks
            // the whole board or lets the LED text pierce a thin pillar.
            occlude={occlude === false ? undefined : 'blending'}
          >
            {board}
          </DeviceScreen>
          {/* the waiting-area face — mirrors the street face by default */}
          {backBoard != null && (
            <DeviceScreen
              width={display.width}
              height={display.height}
              radius={0.01}
              {...resolveSurface(regions.arrivalsBack, boardDefaults)}
              position={[0, 0, -0.049]}
              rotation={[0, Math.PI, 0]}
              occlude={occlude === false ? undefined : 'blending'}
            >
              {backBoard}
            </DeviceScreen>
          )}
        </group>
      )}

      {/* the 6-sheet lightbox as the end panel: pedestal to the pavement and
          header to the roof keep it structural, the cabinet a near-uniform
          ~70 mm frame around the poster */}
      <group position={[lightbox.x, -0.05, 0]}>
        <RoundedBox args={[0.3, 0.4, 0.9]} radius={0.02} position={[0, floorY + 0.05 + 0.2, 0]}>
          <meshPhysicalMaterial {...steel} />
        </RoundedBox>
        <RoundedBox args={[0.3, 0.36, 0.9]} radius={0.02} position={[0, roofY - roof.thickness / 2 + 0.05 - 0.18, 0]}>
          <meshPhysicalMaterial {...steel} />
        </RoundedBox>
        <RoundedBox ref={boxRef} args={[lightbox.depth, lightbox.height, lightbox.width]} radius={0.04}>
          <meshPhysicalMaterial {...steel} />
        </RoundedBox>
        {/* backlit white diffusers behind each poster */}
        {([1, -1] as const).map((s) => (
          <mesh key={s} rotation-y={s === 1 ? Math.PI / 2 : -Math.PI / 2} position-x={s * (lightbox.depth / 2 + 0.002)}>
            <planeGeometry args={[poster.width + 0.08, poster.height + 0.08]} />
            <meshPhysicalMaterial color="#f4f6f8" emissive="#eef2f6" emissiveIntensity={0.55} roughness={0.6} />
          </mesh>
        ))}

        {/* live 6-sheet posters, outward (+X) and inward (−X) */}
        <DeviceScreen
          {...posterProps}
          {...resolveSurface(regions.poster, surfaceDefaults)}
          position={[lightbox.depth / 2 + 0.006, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
        >
          {regions.poster?.children}
        </DeviceScreen>
        {regions.inner != null && (
          <DeviceScreen
            {...posterProps}
            {...resolveSurface(regions.inner, surfaceDefaults)}
            position={[-lightbox.depth / 2 - 0.006, 0, 0]}
            rotation={[0, -Math.PI / 2, 0]}
          >
            {regions.inner.children}
          </DeviceScreen>
        )}
      </group>
    </group>
  )
}
BusShelterImpl.displayName = 'BusShelter'

/** The shelter's compound slots, shared by `<BusShelter>` and `<BusShelterMockup>`. */
export const busShelterSlots = createSlots(BUS_SHELTER_REGIONS)

export const BusShelter = Object.assign(BusShelterImpl, busShelterSlots)
