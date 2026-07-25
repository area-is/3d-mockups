import * as React from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import {
  STUDIO_DISPLAY,
  STUDIO_DISPLAY_COLORWAYS,
  STUDIO_DISPLAY_STAGE_OFFSET_Y,
  SCREEN_REGIONS,
  findColorway,
  roundedRectShape,
} from '@area-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { createLogoGeometry } from '../logos'
import { useScreenOccluders } from '../../screen/occluders'
import { collectSlots, createSlots, resolveSurface, type SurfaceDefaults } from '../../slots'

type GroupProps = ThreeElements['group']

export interface StudioDisplayProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Anything you want on the monitor: React components, an <iframe>, a
   * <video>… Wrap in `<StudioDisplay.Screen>` to set per-screen surface props.
   */
  children?: React.ReactNode
  /**
   * A retail colorway id from `STUDIO_DISPLAY_COLORWAYS` presetting the enclosure
   * color. An explicit `color` prop overrides it.
   */
  colorway?: string
  /** Aluminum colorway (enclosure + stand). */
  color?: string
  /**
   * CSS pixel width of the virtual display. Height follows the 16:9 panel.
   * The default 2560 gives a 2560×1440 screen — exactly the Studio Display's
   * logical "looks like" resolution (5120×2880 at 2x) — so desktop layouts
   * behave like on the real display.
   */
  resolution?: number
  /**
   * How screen content hides when the device faces away from the camera.
   * `true` raycasts against the enclosure (fast, interactive). `'blending'`
   * uses per-pixel depth blending. `false` disables hiding.
   */
  occlude?: boolean | 'blending'
}

/**
 * A procedurally built Apple Studio Display-style monitor (2026 generation):
 * 27" 5K panel behind an edge-to-edge glass front (uniform black bezel, only
 * a hairline of aluminum at the rim), the barely-there centered camera dot,
 * the generation's gloss-black Apple mark on the back, speaker perforations
 * along the bottom edge, and the signature tilt stand — a wide thin-sheet
 * arm hanging from its hinge (machined pivot caps on the sides) with the
 * circular cable-routing hole punched clean through, straddling the
 * enclosure's bottom edge exactly as in the product photography, down to
 * the knee and the thin forward foot plate on rubber pads.
 * Thunderbolt/USB-C port row and the captive power cord's circular recess on
 * the back — and, faithfully, no power button. No 3D asset files are loaded.
 *
 * The monitor renders lifted `STUDIO_DISPLAY_STAGE_OFFSET_Y` above the group origin,
 * so the panel + stand ensemble is visually centered on it (the stage pose the
 * framing's camera and shadow expect); the desk plane sits
 * `STUDIO_DISPLAY.standHeight` below the lifted panel center. Must be rendered inside
 * a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 */
function StudioDisplayImpl({
  children,
  colorway,
  color: colorProp,
  surfaceBackground = '#000000',
  resolution = STUDIO_DISPLAY.resolution,
  interactive = true,
  dragToRotate = true,
  occlude = true,
  surfaceStyle,
  ...groupProps
}: StudioDisplayProps) {
  const screen = collectSlots(children, SCREEN_REGIONS).screen
  const retail = findColorway(STUDIO_DISPLAY_COLORWAYS, colorway)
  const color = colorProp ?? retail?.color ?? '#c8cbd0'
  const { body, glass, display, stand, standHeight } = STUDIO_DISPLAY
  const bodyRef = React.useRef<THREE.Mesh>(null!)
  // The stand pieces occlude too — from low rear angles they stand between
  // the camera and the screen plane, and an unregistered mesh lets the DOM
  // screen paint right through them.
  const footRef = React.useRef<THREE.Mesh>(null!)
  const armRef = React.useRef<THREE.Mesh>(null!)
  const occludeRefs = useScreenOccluders(bodyRef, footRef, armRef)

  const bodyGeometry = React.useMemo(() => {
    const shape = roundedRectShape(
      body.width - body.bevel * 2,
      body.height - body.bevel * 2,
      body.radius - body.bevel
    )
    const depth = body.depth - body.bevel * 2
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: body.bevel,
      bevelSize: body.bevel,
      bevelSegments: 3,
      curveSegments: 12,
    })
    geometry.translate(0, 0, -depth / 2)
    return geometry
  }, [body])

  const glassGeometry = React.useMemo(
    () => new THREE.ShapeGeometry(roundedRectShape(glass.width, glass.height, glass.radius), 12),
    [glass]
  )

  // The tilt stand, matching the real construction: a wide thin arm hangs
  // from the hinge barrel three quarters of the way down the back, leans
  // gently back down to the knee and runs forward as the thin foot plate.
  // Foot + knee are one bent side profile (z/y plane) extruded across the
  // stand width and capped just above the knee, where the separate arm
  // slab — carrying the real circular cable-routing hole — takes over
  // along the lean axis.
  const standParts = React.useMemo(() => {
    const {
      width,
      thickness,
      leanDeg,
      attachY,
      footFrontZ,
      footBackZ,
      footThickness,
      backFillet: Rb,
      frontFillet: Rf,
      hingeRadius,
      cutout,
    } = stand
    const deskY = -standHeight
    const lean = (leanDeg * Math.PI) / 180
    const d = { z: Math.sin(lean), y: Math.cos(lean) } // arm axis, up-forward
    const n = { z: Math.cos(lean), y: -Math.sin(lean) } // front-face normal
    // The arm's centerline passes through the hinge barrel, pressed against
    // the enclosure back. Faces as lines n·X = c.
    const hinge = { y: attachY, z: -body.depth / 2 - hingeRadius + 0.03 }
    const cCenter = n.z * hinge.z + n.y * hinge.y
    const cFront = cCenter + thickness / 2
    const cBack = cCenter - thickness / 2
    const footTopY = deskY + footThickness
    const tangentAngle = Math.atan2(n.y, n.z) + Math.PI

    // Both fillets are CONCAVE — the corners where the arm rises out of the
    // plate — so each circle sits outside the metal: above the plate's top
    // face, and off the arm face it touches.
    const bC = { y: footTopY + Rb, z: 0 }
    bC.z = (cBack - Rb - n.y * bC.y) / n.z
    const bTan = { z: bC.z + n.z * Rb, y: bC.y + n.y * Rb }
    const fC = { y: footTopY + Rf, z: 0 }
    fC.z = (cFront + Rf - n.y * fC.y) / n.z
    const fTan = { z: fC.z - n.z * Rf, y: fC.y - n.y * Rf }
    // Cap the plate piece just above the tangencies — the cut hides inside
    // the (slightly thicker) arm slab that overlaps it.
    const yCut = Math.max(bTan.y, fTan.y) + 0.17
    const zCutBack = bTan.z + (d.z / d.y) * (yCut - bTan.y)
    const zCutFront = fTan.z + (d.z / d.y) * (yCut - fTan.y)
    // Rounded lips at both ends of the foot plate.
    const r = footThickness / 2
    const front = { z: footFrontZ - r, y: deskY + r }
    const back = { z: footBackZ + r, y: deskY + r }

    const shape = new THREE.Shape()
    shape.moveTo(front.z, deskY)
    shape.lineTo(back.z, deskY)
    shape.absarc(back.z, back.y, r, -Math.PI / 2, Math.PI / 2, true)
    shape.lineTo(bC.z, footTopY)
    shape.absarc(bC.z, bC.y, Rb, -Math.PI / 2, Math.atan2(n.y, n.z), false)
    shape.lineTo(zCutBack, yCut)
    shape.lineTo(zCutFront, yCut)
    shape.lineTo(fTan.z, fTan.y)
    shape.absarc(fC.z, fC.y, Rf, tangentAngle, -Math.PI / 2, false)
    shape.lineTo(front.z, footTopY)
    shape.absarc(front.z, front.y, r, Math.PI / 2, -Math.PI / 2, true)

    const bevel = 0.012
    const extrudeW = width - bevel * 2
    const footKnee = new THREE.ExtrudeGeometry(shape, {
      depth: extrudeW,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 2,
      curveSegments: 24,
    })
    footKnee.translate(0, 0, -extrudeW / 2)
    footKnee.rotateY(-Math.PI / 2)

    // Arm slab: rounded-rect face (x across, y down the lean axis, hinge
    // center at +armLen/2) with the stadium cutout as a real punched
    // opening — the extrude bevel rounds its bore, giving the rim highlight
    // the product photos show around the opening.
    // The arm's rounded top stands a little proud of the hinge, exactly as the
    // rear photography shows it above the pivot.
    const topProud = 0.1
    const armLen = (hinge.y - yCut) / d.y + 0.24 + topProud
    const armShape = roundedRectShape(width - 0.016, armLen, 0.05)
    // The cutout's center sits `edgeOffset` above the enclosure's bottom
    // edge: the power inlet shows through its upper half, open air through
    // the lower; from the front it hides behind the panel.
    const holeWorldY = -body.height / 2 + cutout.edgeOffset
    const holeCenterS = armLen / 2 - topProud - (hinge.y - holeWorldY) / d.y
    const capR = cutout.width / 2
    const straight = Math.max(0, cutout.length / 2 - capR)
    const holePath = new THREE.Path()
    holePath.absarc(0, holeCenterS + straight, capR, Math.PI, 0, true)
    holePath.absarc(0, holeCenterS - straight, capR, 0, -Math.PI, true)
    holePath.closePath()
    armShape.holes.push(holePath)
    const slabT = thickness + 0.006
    const armSlab = new THREE.ExtrudeGeometry(armShape, {
      depth: slabT - 0.016,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 2,
      curveSegments: 16,
    })
    armSlab.translate(0, 0, -(slabT - 0.016) / 2)
    armSlab.rotateX(lean)
    const armPos: [number, number, number] = [
      0,
      hinge.y + d.y * (topProud - armLen / 2),
      hinge.z + d.z * (topProud - armLen / 2),
    ]

    // Rubber pad positions on the plate's underside — a pair inside each lip.
    const feetZ = { front: footFrontZ - 0.16, rear: footBackZ + 0.16 }

    return { footKnee, armSlab, armPos, hinge, feetZ }
  }, [body, stand, standHeight])

  // The generation's gloss-black Apple mark on the back — real vector
  // geometry from the SVG, reading as a dark glass inlay on the aluminum.
  const logoGeometry = React.useMemo(
    () => createLogoGeometry('apple', STUDIO_DISPLAY.logo.width, STUDIO_DISPLAY.logo.height),
    []
  )
  // The Thunderbolt bolt printed above each Thunderbolt slot.
  const boltGeometry = React.useMemo(
    () =>
      createLogoGeometry(
        'thunderbolt',
        STUDIO_DISPLAY.ports.thunderbolt.icon.width,
        STUDIO_DISPLAY.ports.thunderbolt.icon.height
      ),
    []
  )

  // Speaker perforations along the bottom edge (the underside, where the
  // product drills them): a dot grid painted once into a texture strip.
  const grilleTexture = React.useMemo(() => {
    if (typeof document === 'undefined') return null
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 20
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'rgba(52, 55, 60, 0.9)'
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 146; col++) {
        ctx.beginPath()
        ctx.arc(5 + col * 7 + (row % 2) * 3.5, 4 + row * 6, 1.7, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.anisotropy = 4
    return texture
  }, [])

  React.useEffect(() => {
    return () => {
      bodyGeometry.dispose()
      glassGeometry.dispose()
      standParts.footKnee.dispose()
      standParts.armSlab.dispose()
      logoGeometry.dispose()
      boltGeometry.dispose()
      grilleTexture?.dispose()
    }
  }, [bodyGeometry, glassGeometry, standParts, logoGeometry, boltGeometry, grilleTexture])

  return (
    /* the stage lift centering the panel + stand ensemble on the group origin */
    <group position-y={STUDIO_DISPLAY_STAGE_OFFSET_Y}>
    <group {...groupProps}>
      {/* enclosure */}
      <mesh ref={bodyRef} geometry={bodyGeometry}>
        <meshPhysicalMaterial color={color} metalness={0.5} roughness={0.42} />
      </mesh>

      {/* cover glass (uniform black bezel) */}
      <mesh geometry={glassGeometry} position-z={body.depth / 2 + 0.002}>
        <meshPhysicalMaterial color="#020205" metalness={0.1} roughness={0.07} clearcoat={1} />
      </mesh>

      {/* centered camera dot in the top bezel — tiny and nearly flush, the
          lens only reads as a faint blue-black circle in the product shots */}
      <mesh rotation-x={Math.PI / 2} position={[0, glass.height / 2 - (glass.height - display.height) / 4, body.depth / 2 + 0.003]}>
        <cylinderGeometry args={[0.012, 0.012, 0.002, 16]} />
        <meshPhysicalMaterial color="#0c1524" metalness={0.4} roughness={0.15} clearcoat={1} />
      </mesh>

      {/* the gloss-black Apple mark centered on the upper back */}
      <mesh
        geometry={logoGeometry}
        rotation-y={Math.PI}
        position={[0, STUDIO_DISPLAY.logo.y, -body.depth / 2 - 0.003]}
      >
        <meshPhysicalMaterial
          color="#08090b"
          metalness={0.3}
          roughness={0.12}
          clearcoat={1}
          clearcoatRoughness={0.08}
          envMapIntensity={0.5}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>

      {/* back: the tight 2x Thunderbolt 5 + 2x USB-C cluster, low and left of
          center seen from behind (front-view right), pill slots ~14.5 mm apart.
          The two innermost slots are the Thunderbolt pair: each is printed with
          the bolt above it, and the upstream (innermost) one adds the host dot
          below — the marking Apple's rear-port callout shows. */}
      {[0, 1, 2, 3].map((i) => {
        const { ports } = STUDIO_DISPLAY
        const x = ports.x - i * ports.spacing
        const y = -body.height / 2 + ports.y
        const isThunderbolt = i >= 4 - ports.thunderbolt.count
        return (
          <React.Fragment key={i}>
            <RoundedBox
              args={[ports.slot.width, ports.slot.height, 0.02]}
              // radius must stay under half the SMALLEST face dimension or the
              // corner spheres self-intersect into a bowtie
              radius={Math.min(ports.slot.width, ports.slot.height) / 2 - 0.004}
              position={[x, y, -body.depth / 2 - 0.004]}
            >
              <meshPhysicalMaterial color="#07080c" metalness={0.4} roughness={0.4} />
            </RoundedBox>
            {isThunderbolt && boltGeometry && (
              <mesh
                geometry={boltGeometry}
                rotation-y={Math.PI}
                position={[x, y + ports.slot.height / 2 + ports.thunderbolt.icon.offset, -body.depth / 2 - 0.002]}
              >
                <meshStandardMaterial
                  color="#25272b"
                  roughness={0.5}
                  polygonOffset
                  polygonOffsetFactor={-1}
                />
              </mesh>
            )}
            {i === 3 && (
              <mesh
                rotation-x={Math.PI / 2}
                position={[x, y - ports.slot.height / 2 - ports.thunderbolt.dot.offset, -body.depth / 2 - 0.002]}
              >
                <cylinderGeometry args={[ports.thunderbolt.dot.r, ports.thunderbolt.dot.r, 0.004, 16]} />
                <meshStandardMaterial color="#25272b" roughness={0.5} />
              </mesh>
            )}
          </React.Fragment>
        )
      })}

      {/* the captive power cord's circular recess, centered low on the back —
          the cable is not user-detachable, so a molded collar sits proud of
          the machined ring instead of a socket */}
      <group position={[0, -body.height / 2 + STUDIO_DISPLAY.power.y, -body.depth / 2]}>
        <mesh rotation-x={Math.PI / 2} position-z={-0.003}>
          <cylinderGeometry args={[STUDIO_DISPLAY.power.r, STUDIO_DISPLAY.power.r, 0.006, 32]} />
          <meshPhysicalMaterial color="#585b60" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh rotation-x={Math.PI / 2} position-z={-0.012}>
          <cylinderGeometry args={[STUDIO_DISPLAY.power.r * 0.44, STUDIO_DISPLAY.power.r * 0.52, 0.018, 24]} />
          <meshStandardMaterial color="#2c2e32" roughness={0.7} />
        </mesh>
      </group>

      {/* speaker perforations along the bottom edge (underside) */}
      {grilleTexture && (
        <mesh rotation-x={Math.PI / 2} position={[0, -body.height / 2 - 0.001, 0]}>
          <planeGeometry args={[4.6, 0.058]} />
          <meshBasicMaterial map={grilleTexture} transparent depthWrite={false} />
        </mesh>
      )}

      {/* tilt stand: knee-and-foot profile + the arm slab with its
          cable-routing hole, all in the enclosure finish */}
      <mesh ref={footRef} geometry={standParts.footKnee}>
        <meshPhysicalMaterial color={color} metalness={0.5} roughness={0.42} />
      </mesh>
      <mesh ref={armRef} geometry={standParts.armSlab} position={standParts.armPos}>
        <meshPhysicalMaterial color={color} metalness={0.5} roughness={0.42} />
      </mesh>

      {/* hinge barrel across the arm's top, pressed against the back, with
          machined end caps flush on the arm's sides */}
      <mesh rotation-z={Math.PI / 2} position={[0, standParts.hinge.y, standParts.hinge.z]}>
        <cylinderGeometry args={[stand.hingeRadius, stand.hingeRadius, stand.width - 0.03, 32]} />
        <meshPhysicalMaterial color={color} metalness={0.5} roughness={0.42} />
      </mesh>
      {/* machined pivot caps flush on the arm's sides — the visible circular
          detail in the product's side view */}
      {([1, -1] as const).map((s) => (
        <mesh
          key={s}
          rotation-z={Math.PI / 2}
          position={[s * (stand.width / 2 - 0.005), standParts.hinge.y, standParts.hinge.z]}
        >
          {/* the polished caps read a touch larger than the barrel itself */}
          <cylinderGeometry args={[stand.hingeRadius * 1.05, stand.hingeRadius * 1.05, 0.014, 24]} />
          <meshPhysicalMaterial color="#dfe2e6" metalness={0.55} roughness={0.3} envMapIntensity={0.9} />
        </mesh>
      ))}

      {/* rubber pads under the foot's corners */}
      {([1, -1] as const).map((s) =>
        (['front', 'rear'] as const).map((end) => (
          <mesh
            key={`${s}${end}`}
            rotation-x={Math.PI / 2}
            position={[s * (stand.width / 2 - 0.12), -standHeight + 0.002, standParts.feetZ[end]]}
          >
            <cylinderGeometry args={[0.035, 0.035, 0.012, 20]} />
            <meshStandardMaterial color="#26272a" roughness={0.85} />
          </mesh>
        ))
      )}

      {/* the live screen: real DOM, CSS3D-transformed onto the panel */}
      <DeviceScreen
        width={display.width}
        height={display.height}
        radius={display.radius}
        position={[0, 0, body.depth / 2 + 0.006]}
        occlude={occlude === true ? occludeRefs : occlude === 'blending' ? 'blending' : undefined}
        {...resolveSurface(screen, {
          background: surfaceBackground,
          resolution,
          interactive,
          dragToRotate,
          style: surfaceStyle,
        })}
      >
        {screen?.children}
      </DeviceScreen>
    </group>
    </group>
  )
}
StudioDisplayImpl.displayName = 'StudioDisplay'

/** The device's compound slots, shared by `<StudioDisplay>` and `<StudioDisplayMockup>`. */
export const studioDisplaySlots = createSlots(SCREEN_REGIONS)

export const StudioDisplay = Object.assign(StudioDisplayImpl, studioDisplaySlots)
