import * as THREE from 'three'

const WORLD_UP = new THREE.Vector3(0, 1, 0)

/**
 * Queued rotation (radians) below which the damping tail is dropped: about
 * 0.006° of travel still to go, a small fraction of a pixel at any size a
 * mockup is drawn.
 */
const SETTLE_EPSILON = 1e-4

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

  /** Drop any rotation still queued, so the camera stops where it is. */
  halt(): void {
    this.pendingYaw = 0
    this.pendingPitch = 0
  }

  /**
   * Whether queued rotation is still playing out. A caller that renders on
   * demand keeps requesting frames while this is true and stops once it is
   * not - which is why the damping tail is cut off below instead of being
   * left to decay forever.
   */
  get settling(): boolean {
    return this.pendingYaw !== 0 || this.pendingPitch !== 0 || this.reconcile
  }

  /**
   * Advance one frame. `autoRotateStep` is an extra turntable angle (radians)
   * for auto-rotation. Returns whether the camera moved.
   */
  update(camera: THREE.Camera, autoRotateStep = 0): boolean {
    // Exponential damping never reaches zero on its own: after a flick the
    // queue decays for seconds through motion far below a pixel. Rendering on
    // demand, that tail is a stream of frames nobody can see, so once what is
    // left would move the camera by less than SETTLE_EPSILON it is dropped.
    if (Math.abs(this.pendingYaw) < SETTLE_EPSILON) this.pendingYaw = 0
    if (Math.abs(this.pendingPitch) < SETTLE_EPSILON) this.pendingPitch = 0
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

/** The `autoRotate` prop as a speed multiplier: `true` is 1, off is 0, a number is itself. */
export function autoRotateSpeed(autoRotate: boolean | number | undefined): number {
  return typeof autoRotate === 'number' ? autoRotate : autoRotate ? 1 : 0
}

/**
 * Where auto-rotation has carried a camera `seconds` after it started at
 * `position`: the turntable spin `TumbleOrbit.update` applies frame by frame,
 * as one turn about the world's vertical through `target`.
 *
 * For a caller that owns the clock - a video's frame counter - so the camera
 * is a function of the time asked for. Integrated frame by frame, it was a
 * function of every frame drawn before, and a render that draws frames out
 * of order, in several browser tabs at once, put the camera somewhere
 * different in each.
 */
export function turntablePosition(
  position: readonly [number, number, number],
  seconds: number,
  speed: number,
  target: readonly [number, number, number] = [0, 0, 0]
): [number, number, number] {
  // TumbleOrbit.update turns the offset by -yaw about +Y; so does this.
  const angle = -tumbleAutoRotateStep(seconds, speed)
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const x = position[0] - target[0]
  const z = position[2] - target[2]
  return [target[0] + x * cos + z * sin, position[1], target[2] - x * sin + z * cos]
}
