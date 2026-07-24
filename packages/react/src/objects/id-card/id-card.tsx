import * as React from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { ID_CARD, ID_CARD_REGIONS, clipRoundedRect, clipRoundedRectOutline } from '@area-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { roundedRectShape } from '@area-mockups/core'
import { useScreenOccluders } from '../../screen/occluders'
import { collectSlots, createSlots, resolveSurface, type SurfaceDefaults } from '../../slots'

type GroupProps = ThreeElements['group']

export interface IDCardProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Face designs — full bleed over the WHOLE card (punch strip included);
   * the slot punch is carved out of the live area. Bare children fill the
   * front face; name faces explicitly with `<IDCard.Front>` and
   * `<IDCard.Back>` (plain stock when the back is omitted).
   */
  children?: React.ReactNode
  /** Card stock color — the edges and the inside of the punched slot. */
  color?: string
  /** Woven lanyard strap color. */
  lanyardColor?: string
  /**
   * How face content composites against the 3D hardware. `'blending'`
   * (default) uses per-pixel depth blending, so the J-hook pierced through
   * the slot correctly crosses IN FRONT of the printed face where it
   * physically does. `true` falls back to raycast hiding (faster, but the
   * live face then paints over the hook at oblique angles). `false`
   * disables hiding entirely.
   */
  occlude?: boolean | 'blending'
}

/**
 * A procedurally built ID badge on a lanyard: a portrait CR80 card with a
 * real punched slot, a swivel J-hook pierced through it (plane perpendicular
 * to the card, like a hanging badge), a crimp in brushed metal, and two
 * woven strap halves rising in a hanging V that exits the top of the frame.
 * The printable face is live DOM covering the ENTIRE card — front and,
 * optionally, back — with the slot punch carved out of the live area.
 * No 3D asset files are loaded.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 *
 * ```tsx
 * <IDCard>
 *   <IDCard.Front><BadgeFront /></IDCard.Front>
 *   <IDCard.Back><BadgeBack /></IDCard.Back>
 * </IDCard>
 * ```
 */
function IDCardImpl({
  children,
  color = '#f4f5f7',
  lanyardColor = '#b3223a',
  surfaceBackground = '#ffffff',
  resolution = ID_CARD.resolution,
  interactive = true,
  dragToRotate = true,
  occlude = 'blending',
  surfaceStyle,
  ...groupProps
}: IDCardProps) {
  const regions = collectSlots(children, ID_CARD_REGIONS)
  const { body, slot, face, hook, strap } = ID_CARD
  const cardRef = React.useRef<THREE.Mesh>(null!)
  const occludeRefs = useScreenOccluders(cardRef)

  const cardGeometry = React.useMemo(() => {
    const shape = roundedRectShape(
      body.width - body.bevel * 2,
      body.height - body.bevel * 2,
      body.radius - body.bevel
    )
    // the slot punch is a real hole through the card
    const punch = roundedRectShape(slot.width, slot.height, slot.height / 2)
    const punchPath = new THREE.Path()
    punch.getPoints(16).forEach((p, i) => {
      const y = p.y + slot.centerY
      if (i === 0) punchPath.moveTo(p.x, y)
      else punchPath.lineTo(p.x, y)
    })
    shape.holes.push(punchPath)
    const depth = body.thickness - body.bevel * 2
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: body.bevel,
      bevelSize: body.bevel,
      bevelSegments: 2,
      curveSegments: 12,
    })
    geometry.translate(0, 0, -depth / 2)
    return geometry
  }, [body, slot])

  React.useEffect(() => () => cardGeometry.dispose(), [cardGeometry])

  const metal = <meshPhysicalMaterial color="#c3c7cd" metalness={0.9} roughness={0.3} />
  const fabric = (
    <meshPhysicalMaterial color={lanyardColor} metalness={0} roughness={0.85} sheen={1} sheenColor="#ffffff" sheenRoughness={0.6} />
  )

  // Hardware chain, referenced from the standard retail swivel J-hook: the
  // FLAT stamped-steel hook hangs pierced THROUGH the slot — its plane
  // perpendicular to the card, the ring's lower band crossing inside the
  // punched opening (just clear of resting on its bottom edge) while the
  // ring window swallows the punch strip — then the stem rises to the
  // swivel barrel, and the crimp above it swallows the strap fold.
  const ringY = slot.centerY + (hook.outerR + hook.innerR) / 2 - 0.01
  const stemBottom = ringY + hook.innerR - 0.03
  const stemTop = ringY + hook.outerR + hook.stem.height - 0.03
  const barrelY = stemTop + hook.barrel.height / 2 - 0.03
  const crimpY = barrelY + hook.barrel.height / 2 + hook.crimp.height / 2 - 0.025

  // Full-bleed live faces with the real slot punched out of the DOM too:
  // the face outline traced one way, the stadium hole the other, so the
  // nonzero fill rule carves it (same numbers as the 3D card's punch). Built
  // per face because a slot's `resolution` override changes the px grid.
  const slotClip = React.useCallback(
    (res: number) => {
      const ppu = res / face.width
      const P = (x: number, y: number) =>
        `${((x + face.width / 2) * ppu).toFixed(2)} ${((face.height / 2 - y) * ppu).toFixed(2)}`
      const R = (u: number) => `${(u * ppu).toFixed(2)}`
      const outline = clipRoundedRectOutline(P, R, 1, {
        minX: -face.width / 2,
        minY: -face.height / 2,
        maxX: face.width / 2,
        maxY: face.height / 2,
        r: face.radius,
      })
      const hole = clipRoundedRect(P, R, 1, {
        minX: -slot.width / 2,
        minY: slot.centerY - slot.height / 2,
        maxX: slot.width / 2,
        maxY: slot.centerY + slot.height / 2,
        r: slot.height / 2,
      })
      return `path("${(outline + hole).trim()}")`
    },
    [face, slot]
  )

  // The flat J profile: an annular arc open at the upper right (the mouth),
  // extruded at stamped-steel thickness.
  const hookGeometry = React.useMemo(() => {
    const a0 = (hook.mouthEnd * Math.PI) / 180
    const a1 = ((hook.mouthStart + 360) * Math.PI) / 180
    const s = new THREE.Shape()
    s.absarc(0, 0, hook.outerR, a0, a1, false)
    s.absarc(0, 0, hook.innerR, a1, a0, true)
    s.closePath()
    const g = new THREE.ExtrudeGeometry(s, {
      depth: hook.depth - 0.008,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.004,
      bevelSegments: 2,
      curveSegments: 32,
    })
    g.translate(0, 0, -(hook.depth - 0.008) / 2)
    return g
  }, [hook])
  React.useEffect(() => () => hookGeometry.dispose(), [hookGeometry])

  // Spring gate: a thin flat strip closing the mouth, from beside the stem
  // down to the hook's nose tip.
  const gate = React.useMemo(() => {
    const rMid = (hook.outerR + hook.innerR) / 2
    const aNose = (hook.mouthStart * Math.PI) / 180
    const nose = { x: rMid * Math.cos(aNose), y: rMid * Math.sin(aNose) }
    const root = { x: hook.stem.width / 2 + 0.008, y: hook.outerR + 0.02 }
    return {
      length: Math.hypot(nose.x - root.x, nose.y - root.y) + 0.02,
      angle: Math.atan2(nose.y - root.y, nose.x - root.x) + Math.PI / 2,
      mid: { x: (nose.x + root.x) / 2, y: (nose.y + root.y) / 2 },
    }
  }, [hook])
  // Depth occluder matching the clipped face: the card outline with the
  // slot punched out, so blending mode never depth-hides the hook where it
  // should show through the real opening.
  const faceOccluderGeometry = React.useMemo(() => {
    const shape = roundedRectShape(face.width, face.height, face.radius)
    const punch = roundedRectShape(slot.width, slot.height, slot.height / 2)
    const punchPath = new THREE.Path()
    punch.getPoints(16).forEach((p, i) => {
      if (i === 0) punchPath.moveTo(p.x, p.y + slot.centerY)
      else punchPath.lineTo(p.x, p.y + slot.centerY)
    })
    shape.holes.push(punchPath)
    return new THREE.ShapeGeometry(shape, 12)
  }, [face, slot])
  React.useEffect(() => () => faceOccluderGeometry.dispose(), [faceOccluderGeometry])

  const surfaceDefaults = {
    background: surfaceBackground,
    resolution,
    interactive,
    dragToRotate,
    style: surfaceStyle,
  }
  const front = resolveSurface(regions.front, surfaceDefaults)
  const back = resolveSurface(regions.back, surfaceDefaults)
  const faceProps = {
    width: face.width,
    height: face.height,
    radius: face.radius,
    occlude: occlude === true ? occludeRefs : occlude === 'blending' ? ('blending' as const) : undefined,
    occluderGeometry: faceOccluderGeometry,
  }

  return (
    <group {...groupProps}>
      {/* PVC card with the punched slot */}
      <mesh ref={cardRef} geometry={cardGeometry}>
        <meshPhysicalMaterial color={color} metalness={0} roughness={0.55} clearcoat={0.4} clearcoatRoughness={0.4} />
      </mesh>

      {/* the flat stamped-steel J-hook, rotated 90° so its plane pierces
          the card through the slot: half the ring in front of the punch
          strip, half behind, its lower band inside the punched opening */}
      <group position={[0, ringY, 0]} rotation-y={Math.PI / 2}>
        <mesh geometry={hookGeometry}>{metal}</mesh>
        {/* thin spring gate closing the mouth */}
        <RoundedBox
          args={[0.016, gate.length, 0.012]}
          radius={0.005}
          position={[gate.mid.x, gate.mid.y, 0]}
          rotation-z={gate.angle}
        >
          {metal}
        </RoundedBox>
      </group>
      {/* stem rising edge-on from the ring to the swivel (same stamped
          piece, so it shares the hook's perpendicular plane) */}
      <RoundedBox
        args={[hook.depth - 0.004, stemTop - stemBottom, hook.stem.width]}
        radius={0.008}
        position={[0, (stemTop + stemBottom) / 2, 0]}
      >
        {metal}
      </RoundedBox>
      {/* swivel barrel with its collar — the joint that lets the badge spin */}
      <mesh position={[0, barrelY, 0]}>
        <cylinderGeometry args={[hook.barrel.radius, hook.barrel.radius, hook.barrel.height, 16]} />
        {metal}
      </mesh>
      <mesh position={[0, barrelY + hook.barrel.height / 2 - 0.03, 0]}>
        <cylinderGeometry args={[hook.barrel.collar, hook.barrel.collar, 0.05, 16]} />
        {metal}
      </mesh>
      {/* crimp sleeve above the swivel, swallowing the folded strap ends */}
      <RoundedBox
        args={[hook.crimp.width, hook.crimp.height, hook.crimp.depth]}
        radius={0.02}
        position={[0, crimpY, 0]}
      >
        {metal}
      </RoundedBox>

      {/* woven strap halves, rising in a hanging V and tilting slightly back */}
      {([1, -1] as const).map((side) => (
        <group
          key={side}
          position={[0, crimpY + hook.crimp.height / 2 - 0.02, -0.01]}
          rotation={[strap.backTilt, 0, side * strap.spreadAngle]}
        >
          <RoundedBox
            args={[strap.width, strap.length, strap.thickness]}
            radius={0.01}
            position={[0, strap.length / 2, 0]}
          >
            {fabric}
          </RoundedBox>
        </group>
      ))}

      {/* live front face — full bleed over the whole card, slot carved out */}
      <DeviceScreen
        {...faceProps}
        {...front}
        screenStyle={{ ...front.screenStyle, clipPath: slotClip(front.resolution) }}
        position={[0, face.offsetY, body.thickness / 2 + 0.003]}
      >
        {regions.front?.children}
      </DeviceScreen>

      {/* live back face — only mounted when there's a design for it */}
      {regions.back != null && (
        <DeviceScreen
          {...faceProps}
          {...back}
          screenStyle={{ ...back.screenStyle, clipPath: slotClip(back.resolution) }}
          position={[0, face.offsetY, -body.thickness / 2 - 0.003]}
          rotation={[0, Math.PI, 0]}
        >
          {regions.back.children}
        </DeviceScreen>
      )}
    </group>
  )
}
IDCardImpl.displayName = 'IDCard'

/** The badge's compound slots, shared by `<IDCard>` and `<IDCardMockup>`. */
export const idCardSlots = createSlots(ID_CARD_REGIONS)

export const IDCard = Object.assign(IDCardImpl, idCardSlots)
