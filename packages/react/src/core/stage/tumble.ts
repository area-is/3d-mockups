import * as THREE from 'three'

const WORLD_UP = new THREE.Vector3(0, 1, 0)

/**
 * Orbital tumble around a fixed center - the camera motion behind every
 * mockup's drag-to-rotate.
 *
 * Horizontal drags spin the stage like a turntable (about the world's
 * vertical axis); vertical drags tumble the camera about its right axis. With
 * polar limits set (the default stage feel), vertical rotation clamps like
 * the classic orbit controls and up stays world-up. With limits cleared, the
 * camera's up vector is carried along, so rotation is a full, unclamped 360°
 * in every direction - straight over the poles. The rotation center stays
 * fixed at the target and motion is damped either way.
 */
export class TumbleOrbit {
  /** The fixed rotation center. */
  readonly target = new THREE.Vector3()

  private pendingYaw = 0
  private pendingPitch = 0
  private polarLimits: { min: number; max: number } | null = null
  private reconcile = false
  private readonly offset = new THREE.Vector3()
  private readonly quat = new THREE.Quaternion()
  private readonly right = new THREE.Vector3()

  constructor(
    public dampingFactor = 0.08,
    public minDistance = 0.5,
    public maxDistance = 60
  ) {}

  /**
   * Clamp vertical rotation to a polar range (radians from the top pole),
   * like classic orbit controls - or pass `null` to allow the full 360°
   * tumble. Setting limits also snaps an out-of-range camera (e.g. one left
   * upside-down by free rotation) back into range on the next update.
   */
  setPolarLimits(limits: { min: number; max: number } | null): void {
    this.polarLimits = limits
    this.reconcile = limits !== null
  }

  /**
   * Queue a rotation in radians: `dx` spins the turntable, `dy` tumbles
   * vertically. Damping spreads the motion over the following frames.
   */
  rotate(dx: number, dy: number): void {
    this.pendingYaw += dx
    this.pendingPitch += dy
  }

  /**
   * Pan the camera and target together in the view plane - the standard
   * middle/right-drag behavior: the scene follows the cursor. Deltas are in
   * CSS px; world units per px derive from the target distance and fov.
   */
  pan(camera: THREE.Camera, deltaX: number, deltaY: number, viewportHeight: number): void {
    this.offset.copy(camera.position).sub(this.target)
    const fov = (camera as THREE.PerspectiveCamera).fov ?? 40
    const worldPerPx = (2 * this.offset.length() * Math.tan((fov * Math.PI) / 360)) / viewportHeight
    this.right.crossVectors(camera.up, this.offset).normalize()
    this.target.addScaledVector(this.right, -deltaX * worldPerPx)
    this.target.addScaledVector(camera.up, deltaY * worldPerPx)
    camera.position.copy(this.target).add(this.offset)
    camera.lookAt(this.target)
  }

  /** Multiply the camera's distance to the target by `factor` (clamped). */
  zoomBy(camera: THREE.Camera, factor: number): void {
    this.offset.copy(camera.position).sub(this.target)
    const length = Math.min(
      this.maxDistance,
      Math.max(this.minDistance, this.offset.length() * factor)
    )
    this.offset.setLength(length)
    camera.position.copy(this.target).add(this.offset)
  }

  /**
   * Advance one frame. `autoRotateStep` is an extra turntable angle (radians)
   * for auto-rotation. Returns whether the camera moved.
   */
  update(camera: THREE.Camera, autoRotateStep = 0): boolean {
    const yaw = this.pendingYaw * this.dampingFactor + autoRotateStep
    let pitch = this.pendingPitch * this.dampingFactor
    this.pendingYaw *= 1 - this.dampingFactor
    this.pendingPitch *= 1 - this.dampingFactor
    if (!this.reconcile && Math.abs(yaw) < 1e-7 && Math.abs(pitch) < 1e-7) return false

    this.offset.copy(camera.position).sub(this.target)

    if (this.polarLimits) {
      // Classic clamped orbit: up stays world-up and the vertical step never
      // takes the polar angle past the limits (also snapping back a camera
      // that free rotation left out of range).
      camera.up.copy(WORLD_UP)
      const polar = this.offset.angleTo(WORLD_UP)
      pitch =
        Math.min(this.polarLimits.max, Math.max(this.polarLimits.min, polar + pitch)) - polar
      this.reconcile = false

      this.quat.setFromAxisAngle(WORLD_UP, -yaw)
      this.offset.applyQuaternion(this.quat)

      this.right.crossVectors(camera.up, this.offset).normalize()
      this.quat.setFromAxisAngle(this.right, pitch)
      this.offset.applyQuaternion(this.quat)
    } else {
      // Turntable spin about the world's vertical. The up vector rides along so
      // the spin stays coherent even while the camera is upside down mid-tumble.
      this.quat.setFromAxisAngle(WORLD_UP, -yaw)
      this.offset.applyQuaternion(this.quat)
      camera.up.applyQuaternion(this.quat)

      // Vertical tumble about the camera's right axis - up is carried along, so
      // the motion continues smoothly across the poles instead of clamping.
      this.right.crossVectors(camera.up, this.offset).normalize()
      this.quat.setFromAxisAngle(this.right, pitch)
      this.offset.applyQuaternion(this.quat)
      camera.up.applyQuaternion(this.quat)

      // Keep up orthogonal to the view direction so tiny numeric drift never
      // accumulates into roll.
      const viewDir = this.offset.clone().normalize()
      camera.up.addScaledVector(viewDir, -camera.up.dot(viewDir)).normalize()
    }

    camera.position.copy(this.target).add(this.offset)
    camera.lookAt(this.target)
    return true
  }
}

/** The per-frame turntable step for auto-rotation (one revolution per minute at speed 1). */
export function tumbleAutoRotateStep(deltaSeconds: number, speed: number): number {
  return ((2 * Math.PI) / 60) * speed * deltaSeconds
}
