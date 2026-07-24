import * as React from 'react'
import type * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { MAILER_BOX, MAILER_BOX_REGIONS, mailerBoxLayout, type MailerBoxSizeMm } from '@area-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { useScreenOccluders } from '../../screen/occluders'
import { collectSlots, createSlots, resolveSurface, type SurfaceDefaults } from '../../slots'

type GroupProps = ThreeElements['group']

export interface MailerBoxProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Panel content. Bare children fill the top panel — the hero face of a
   * shipper, with the tape overlaying it like real tape over print. Name
   * panels explicitly with `<MailerBox.Top>`, `<MailerBox.Front>`,
   * `<MailerBox.Back>`, `<MailerBox.Right>` / `<MailerBox.Left>` (the short
   * end faces — the wrapped tape rides over them) and `<MailerBox.Bottom>`
   * (oriented to read from the front when flipped).
   */
  children?: React.ReactNode
  /**
   * Shipper size in real millimeters: `{ width, height, depth }`. The longest
   * edge normalizes to the stage, so any size fills the default camera while
   * the mm dimensions set the true proportions. Defaults to the 350×120×250 mm
   * e-commerce shipper.
   */
  size?: MailerBoxSizeMm
  /** Corrugated stock color. Kraft by default; try white or a brand dip. */
  color?: string
  /** Packing tape color. */
  tapeColor?: string
  /**
   * How panel content hides when that panel turns away from the camera.
   * `true` raycasts against the box (fast, interactive). `'blending'` uses
   * per-pixel depth blending. `false` disables hiding.
   */
  occlude?: boolean | 'blending'
}

/**
 * A procedurally built closed corrugated shipper: kraft stock with softened
 * corrugated edges, the flap seam under a packing-tape band that wraps down
 * both ends — and live DOM on every panel: top, front, back, both ends and
 * the bottom. The tape stays over your print via a DOM overlay, exactly
 * like real tape over a printed box. No 3D asset files are loaded.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 *
 * ```tsx
 * <MailerBox>
 *   <MailerBox.Top><YourTopPanel /></MailerBox.Top>
 *   <MailerBox.Front><YourSidePanel /></MailerBox.Front>
 * </MailerBox>
 * ```
 */
function MailerBoxImpl({
  children,
  size,
  color = '#b5915f',
  tapeColor = 'rgba(168, 127, 79, 0.82)',
  surfaceBackground = '#ffffff',
  resolution = MAILER_BOX.resolution,
  interactive = true,
  dragToRotate = true,
  occlude = true,
  surfaceStyle,
  ...groupProps
}: MailerBoxProps) {
  const regions = collectSlots(children, MAILER_BOX_REGIONS)
  const { body, tape } = React.useMemo(
    () => mailerBoxLayout(size),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size?.width, size?.height, size?.depth]
  )
  const bodyRef = React.useRef<THREE.Mesh>(null!)
  const occludeRefs = useScreenOccluders(bodyRef)
  const pxPerUnit = resolution / body.width

  // fixed dressing scaled down for small shippers
  const endWrap = Math.min(0.77, body.height * 0.5)
  const jointWidth = Math.min(0.46, body.depth * 0.3)
  const labelScale = Math.min(1, (body.width / MAILER_BOX.body.width) * 0.9 + 0.1, (body.depth / MAILER_BOX.body.depth) * 0.9 + 0.1)

  // DOM tape overlay: a translucent band with edge shadows, so it reads as
  // tape laid OVER the printed face.
  const tapeOverlay = (vertical: boolean): React.ReactNode => (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        zIndex: 2147483647,
        background: tapeColor,
        boxShadow: 'inset 0 0 6px rgba(0,0,0,0.18)',
        ...(vertical
          ? { top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: tape.width * pxPerUnit }
          : { left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', height: tape.width * pxPerUnit }),
      }}
    />
  )

  // flap seam: the flaps hinge on the LONG walls and meet along the width,
  // so the gap runs left-right — visible through the translucent tape
  const seamOverlay = (
    <>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          height: 3,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.42) 50%, rgba(0,0,0,0.12))',
          pointerEvents: 'none',
          zIndex: 2147483646,
        }}
      />
      {tapeOverlay(false)}
    </>
  )

  const shared = {
    radius: body.radius,
    occlude: occlude === true ? occludeRefs : occlude === 'blending' ? ('blending' as const) : undefined,
  }
  const panelDefaults = {
    background: surfaceBackground,
    resolution,
    interactive,
    dragToRotate,
    style: surfaceStyle,
  }
  // the end panels' virtual width follows the box depth at the top dpi
  const endDefaults = { ...panelDefaults, resolution: Math.round(body.depth * pxPerUnit) }

  return (
    <group {...groupProps}>
      {/* the shipper */}
      <RoundedBox ref={bodyRef} args={[body.width, body.height, body.depth]} radius={body.radius}>
        <meshPhysicalMaterial color={color} metalness={0} roughness={0.85} />
      </RoundedBox>

      {/* geometry seam gap + tape for the unprinted faces (hidden under live
          DOM). The tape runs along the width — over the flap seam — and wraps
          down both short end faces. It is slightly translucent so the dark
          gap between the flaps reads through it, like real packing tape. */}
      <mesh position={[0, body.height / 2 + 0.0015, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[body.width, 0.022]} />
        <meshBasicMaterial color="#4a3a26" />
      </mesh>
      <mesh position={[0, body.height / 2 + 0.003, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[body.width, tape.width]} />
        <meshPhysicalMaterial color="#a87f4f" metalness={0} roughness={0.45} clearcoat={0.6} transparent opacity={0.88} />
      </mesh>
      {([1, -1] as const).map((s) => (
        <mesh key={s} position={[s * (body.width / 2 + 0.002), body.height / 2 - endWrap / 2, 0]} rotation-y={s * (Math.PI / 2)}>
          <planeGeometry args={[tape.width, endWrap]} />
          <meshPhysicalMaterial color="#a87f4f" metalness={0} roughness={0.45} clearcoat={0.6} transparent opacity={0.94} />
        </mesh>
      ))}

      {/* manufacturer's joint: the vertical glued lap seam on one corner */}
      <mesh position={[-body.width / 2 - 0.002, 0, body.depth / 2 - jointWidth / 2 - 0.03]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[jointWidth, body.height - 0.04]} />
        <meshPhysicalMaterial color="#a8845a" metalness={0} roughness={0.85} />
      </mesh>

      {/* unprinted-state details: flap seam slabs and a skewed 4x6 label
          (hidden under the live top panel when one is mounted) */}
      {regions.top == null && (
        <group position={[0, body.height / 2, 0]}>
          {/* the two flaps, hinged on the long walls, meeting along the width
              — below the seam/tape planes so both stay visible */}
          {([1, -1] as const).map((s) => (
            <mesh key={s} position={[0, 0.001, s * (body.depth / 4 + 0.006)]} rotation-x={-Math.PI / 2}>
              <planeGeometry args={[body.width - 0.012, body.depth / 2 - 0.012]} />
              <meshPhysicalMaterial color={color} metalness={0} roughness={0.82} />
            </mesh>
          ))}
          <mesh position={[0.9 * labelScale, 0.008, 0.7 * labelScale]} rotation={[-Math.PI / 2, 0, 0.06]}>
            <planeGeometry args={[1.3 * labelScale, 1.95 * labelScale]} />
            <meshPhysicalMaterial color="#f4f5f2" metalness={0} roughness={0.6} />
          </mesh>
        </group>
      )}

      {/* live top panel — the seam and tape ride over the print */}
      {regions.top != null && (
        <DeviceScreen
          {...shared}
          {...resolveSurface(regions.top, panelDefaults)}
          width={body.width}
          height={body.depth}
          position={[0, body.height / 2 + 0.004, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          overlay={seamOverlay}
        >
          {regions.top.children}
        </DeviceScreen>
      )}

      {/* live front (long) panel */}
      {regions.front != null && (
        <DeviceScreen
          {...shared}
          {...resolveSurface(regions.front, panelDefaults)}
          width={body.width}
          height={body.height}
          position={[0, 0, body.depth / 2 + 0.004]}
        >
          {regions.front.children}
        </DeviceScreen>
      )}

      {/* live back (long) panel */}
      {regions.back != null && (
        <DeviceScreen
          {...shared}
          {...resolveSurface(regions.back, panelDefaults)}
          width={body.width}
          height={body.height}
          position={[0, 0, -body.depth / 2 - 0.004]}
          rotation={[0, Math.PI, 0]}
        >
          {regions.back.children}
        </DeviceScreen>
      )}

      {/* live bottom panel */}
      {regions.bottom != null && (
        <DeviceScreen
          {...shared}
          {...resolveSurface(regions.bottom, panelDefaults)}
          width={body.width}
          height={body.depth}
          position={[0, -body.height / 2 - 0.004, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          {regions.bottom.children}
        </DeviceScreen>
      )}

      {/* live end panels — the wrapped tape rides over them */}
      {regions.right != null && (
        <DeviceScreen
          {...shared}
          {...resolveSurface(regions.right, endDefaults)}
          width={body.depth}
          height={body.height}
          position={[body.width / 2 + 0.004, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          overlay={tapeOverlay(true)}
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
          position={[-body.width / 2 - 0.004, 0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          overlay={tapeOverlay(true)}
        >
          {regions.left.children}
        </DeviceScreen>
      )}
    </group>
  )
}
MailerBoxImpl.displayName = 'MailerBox'

/** The shipper's compound slots, shared by `<MailerBox>` and `<MailerBoxMockup>`. */
export const mailerBoxSlots = createSlots(MAILER_BOX_REGIONS)

export const MailerBox = Object.assign(MailerBoxImpl, mailerBoxSlots)
