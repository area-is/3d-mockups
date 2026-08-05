import { describe, expect, it } from 'vitest'
import {
  IPAD_FRAMING,
  GALAXY_TAB_FRAMING,
  IPAD_DEFAULT_VARIANT,
  GALAXY_TAB_DEFAULT_VARIANT,
} from '../devices/tablet/dimensions'
import {
  APPLE_WATCH_FRAMING,
  GALAXY_WATCH_FRAMING,
  APPLE_WATCH_DEFAULT_VARIANT,
  GALAXY_WATCH_DEFAULT_VARIANT,
} from '../devices/watch/dimensions'
import { cameraDistance, DEFAULT_CAMERA_DISTANCE } from '../stage/stage'
import { floatPose, FLOAT_REST_POSE, REDUCED_MOTION_QUERY } from '../stage/float'

/**
 * A framing shared between two device families has to fall back to the family
 * it is used by. `TABLET_FRAMING` and `WATCH_FRAMING` were single objects wired
 * into both families, so a default `<GalaxyTabMockup/>` grounded its contact
 * shadow at the iPad Pro 13's extent and floated above it.
 */
describe('per-family framing fallbacks', () => {
  it('grounds a default tablet on its own family', () => {
    const ipad = IPAD_FRAMING.extent({})
    const tab = GALAXY_TAB_FRAMING.extent({})
    expect(ipad).toBeCloseTo(IPAD_FRAMING.extent({ variant: IPAD_DEFAULT_VARIANT }), 6)
    expect(tab).toBeCloseTo(GALAXY_TAB_FRAMING.extent({ variant: GALAXY_TAB_DEFAULT_VARIANT }), 6)
    expect(ipad).not.toBeCloseTo(tab, 3)
  })

  it('grounds a default watch on its own family', () => {
    const apple = APPLE_WATCH_FRAMING.extent({})
    const galaxy = GALAXY_WATCH_FRAMING.extent({})
    expect(apple).toBeCloseTo(APPLE_WATCH_FRAMING.extent({ variant: APPLE_WATCH_DEFAULT_VARIANT }), 6)
    expect(galaxy).toBeCloseTo(
      GALAXY_WATCH_FRAMING.extent({ variant: GALAXY_WATCH_DEFAULT_VARIANT }),
      6
    )
    expect(apple).not.toBeCloseTo(galaxy, 3)
  })

  it('still honours an explicit variant on either framing', () => {
    // The shared config (camera, float) is identical; only the fallback differs.
    expect(IPAD_FRAMING.extent({ variant: GALAXY_TAB_DEFAULT_VARIANT })).toBeCloseTo(
      GALAXY_TAB_FRAMING.extent({ variant: GALAXY_TAB_DEFAULT_VARIANT }),
      6
    )
  })
})

/**
 * `cameraDistance` feeds the orbit clamp. r3f's `camera` prop also accepts a
 * camera instance, a Vector3 or a scalar - all of which used to index as
 * `undefined` and produce NaN min/max distances, silently breaking zoom.
 */
describe('cameraDistance', () => {
  it('measures a plain xyz triple', () => {
    expect(cameraDistance([0, 0, 9])).toBeCloseTo(9, 6)
    expect(cameraDistance([3, 4, 0])).toBeCloseTo(5, 6)
  })

  it('measures anything exposing x/y/z, like a Vector3', () => {
    expect(cameraDistance({ x: 0, y: 0, z: 9 })).toBeCloseTo(9, 6)
  })

  it.each([
    ['nothing', undefined],
    ['a scalar', 5 as unknown],
    ['a string', 'nope' as unknown],
    ['a short tuple', [1, 2] as unknown],
    ['a tuple with holes', [1, undefined, 3] as unknown],
    ['NaN', [Number.NaN, 0, 0] as unknown],
  ])('falls back to the stage default for %s', (_label, input) => {
    const distance = cameraDistance(input)
    expect(distance).toBe(DEFAULT_CAMERA_DISTANCE)
    expect(Number.isFinite(distance)).toBe(true)
  })
})

describe('float', () => {
  it('stays within its amplitude envelope', () => {
    for (let t = 0; t < 20; t += 0.37) {
      const pose = floatPose(t, 1, 0)
      expect(Math.abs(pose.rotationX)).toBeLessThanOrEqual(0.025 + 1e-9)
      expect(Math.abs(pose.positionY)).toBeLessThanOrEqual(0.05 + 1e-9)
    }
  })

  it('scales with intensity', () => {
    expect(floatPose(1, 2).positionY).toBeCloseTo(floatPose(1, 1).positionY * 2, 9)
  })

  it('offers a rest pose for suppressed motion', () => {
    expect(FLOAT_REST_POSE).toEqual({ rotationX: 0, rotationY: 0, rotationZ: 0, positionY: 0 })
    expect(REDUCED_MOTION_QUERY).toBe('(prefers-reduced-motion: reduce)')
  })
})
