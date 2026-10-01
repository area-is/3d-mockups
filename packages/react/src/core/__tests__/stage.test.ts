import { describe, expect, it } from 'vitest'
import { Group, Mesh, PerspectiveCamera } from 'three'
import { TumbleOrbit, autoRotateSpeed, tumbleAutoRotateStep, turntablePosition } from '../stage/tumble'
import { floatPose } from '../stage/float'
import { createBackfaceCuller } from '../screen/backface'
import { CANVAS_GL_DEFAULTS } from '../stage/stage'

/**
 * The stage behaviours on-demand rendering leans on. A canvas that only draws
 * when asked keeps asking for as long as the orbit reports motion, so an orbit
 * that never settles is a canvas that never stops - these pin that it does.
 */
describe('TumbleOrbit settling', () => {
  const camera = () => {
    const c = new PerspectiveCamera(40, 1, 0.1, 100)
    c.position.set(0, 0.5, 7.4)
    return c
  }

  it('is not settling before anything is queued', () => {
    const orbit = new TumbleOrbit()
    expect(orbit.settling).toBe(false)
    expect(orbit.update(camera())).toBe(false)
  })

  it('settles after a flick, in a bounded number of frames', () => {
    const orbit = new TumbleOrbit()
    const cam = camera()
    orbit.rotate(1.2, 0.4)
    let frames = 0
    while (orbit.settling && frames < 10_000) {
      orbit.update(cam)
      frames++
    }
    expect(orbit.settling).toBe(false)
    // About two seconds at 60 fps for a flick of more than a radian: the
    // damping tail below a fraction of a pixel is cut, not left to decay.
    expect(frames).toBeLessThan(160)
    expect(orbit.update(cam)).toBe(false)
  })

  it('still travels (almost) the whole queued turn before settling', () => {
    const orbit = new TumbleOrbit()
    orbit.setPolarLimits(null)
    const cam = camera()
    const start = Math.atan2(cam.position.x, cam.position.z)
    orbit.rotate(0.5, 0)
    while (orbit.settling) orbit.update(cam)
    const end = Math.atan2(cam.position.x, cam.position.z)
    // Turntable yaw moves the camera the opposite way round (see `update`).
    expect(Math.abs(Math.abs(end - start) - 0.5)).toBeLessThan(1e-3)
  })

  it('stops dead on halt', () => {
    const orbit = new TumbleOrbit()
    orbit.rotate(2, 1)
    orbit.halt()
    expect(orbit.settling).toBe(false)
  })
})

describe('backface culler', () => {
  const setup = () => {
    const root = new Group()
    const device = new Group()
    const anchor = new Mesh()
    root.add(device)
    device.add(anchor)
    const camera = new PerspectiveCamera()
    camera.position.set(0, 0, 5)
    const content = { style: { visibility: '' } } as unknown as HTMLElement
    return { root, device, anchor, camera, content, cull: createBackfaceCuller() }
  }

  it('shows a screen facing the camera', () => {
    const { anchor, camera, content, cull } = setup()
    cull(anchor, content, camera)
    expect(content.style.visibility).toBe('')
  })

  it('hides a screen facing away', () => {
    const { device, anchor, camera, content, cull } = setup()
    device.rotation.y = Math.PI
    device.updateMatrixWorld(true)
    cull(anchor, content, camera)
    expect(content.style.visibility).toBe('hidden')
  })

  /**
   * three skips a hidden subtree, depth mask included, but the DOM is not in
   * the scene graph: without this the screen of a hidden device floated in
   * mid-air with no hardware round it.
   */
  it('hides a screen whose device, or any ancestor, is not visible', () => {
    const { root, anchor, camera, content, cull } = setup()
    root.visible = false
    cull(anchor, content, camera)
    expect(content.style.visibility).toBe('hidden')
    root.visible = true
    cull(anchor, content, camera)
    expect(content.style.visibility).toBe('')
  })
})

describe('canvas defaults', () => {
  // Screens are seen through transparent canvas pixels; an opaque default
  // would hide every one of them.
  it('keeps the canvas transparent', () => {
    expect(CANVAS_GL_DEFAULTS.alpha).toBe(true)
  })

  // A decorative element must not ask a dual-GPU laptop for its discrete GPU.
  it('does not request the high-performance GPU', () => {
    expect(CANVAS_GL_DEFAULTS.powerPreference).toBe('default')
  })
})

/**
 * A clock the caller owns (a video's frame counter): the stage's motion has
 * to be a function of the time asked for, because a render draws frames out
 * of order, in several tabs at once, and each must land on the same picture.
 */
describe('motion as a function of time', () => {
  const start: [number, number, number] = [0, 0.5, 7.4]

  it('turns the camera the way frame-by-frame auto-rotation does', () => {
    const camera = new PerspectiveCamera(40, 1, 0.1, 100)
    camera.position.set(...start)
    const orbit = new TumbleOrbit()
    orbit.setPolarLimits({ min: 0.5, max: Math.PI - 0.5 })
    // One second at 60 fps, speed 3.
    for (let i = 0; i < 60; i++) orbit.update(camera, tumbleAutoRotateStep(1 / 60, 3))
    const [x, y, z] = turntablePosition(start, 1, 3)
    expect(camera.position.x).toBeCloseTo(x, 9)
    expect(camera.position.y).toBeCloseTo(y, 9)
    expect(camera.position.z).toBeCloseTo(z, 9)
  })

  it('depends on the time alone, not on the frames before it', () => {
    expect(turntablePosition(start, 0, 2)).toEqual(start)
    // A full revolution at speed 1 takes a minute, and comes back round.
    const [x, y, z] = turntablePosition(start, 60, 1)
    expect(x).toBeCloseTo(start[0], 9)
    expect(y).toBe(start[1])
    expect(z).toBeCloseTo(start[2], 9)
    expect(turntablePosition(start, 7.25, 1.5)).toEqual(turntablePosition(start, 7.25, 1.5))
  })

  it('reads the autoRotate prop as a speed', () => {
    expect(autoRotateSpeed(true)).toBe(1)
    expect(autoRotateSpeed(false)).toBe(0)
    expect(autoRotateSpeed(undefined)).toBe(0)
    expect(autoRotateSpeed(2.5)).toBe(2.5)
  })

  it('floats to the same pose at the same time', () => {
    expect(floatPose(3.2, 0.7, 0)).toEqual(floatPose(3.2, 0.7, 0))
  })
})
