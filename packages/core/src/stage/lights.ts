/**
 * The procedural light studio shared by every binding: two direct lights plus
 * a tiny rig of area lights rendered once into an environment map. No HDR
 * downloads - works offline.
 */

export const STAGE_AMBIENT_LIGHT = { intensity: 0.4 } as const

export const STAGE_KEY_LIGHT = {
  position: [6, 8, 6] as [number, number, number],
  intensity: 0.6,
} as const

/** Resolution of the environment map the studio rig is rendered into. */
export const STUDIO_ENV_RESOLUTION = 512

export interface StudioLightformer {
  form: 'rect' | 'circle'
  intensity: number
  position: [number, number, number]
  scale: [number, number, number]
  /** Rotation around the X axis (drei `rotation-x`). */
  rotationX?: number
  /** Rotation around the Y axis. */
  rotationY?: number
}

/** A tiny procedural light studio, rendered once into an env map. */
export const STUDIO_LIGHTFORMERS: readonly StudioLightformer[] = [
  { form: 'rect', intensity: 5, position: [0, 6, -9], scale: [12, 12, 1] },
  { form: 'rect', intensity: 2.4, rotationY: Math.PI / 2, position: [-6, 1, 0], scale: [16, 1.4, 1] },
  { form: 'rect', intensity: 2.4, rotationY: -Math.PI / 2, position: [6, 1, 0], scale: [16, 1.4, 1] },
  { form: 'rect', intensity: 1.4, position: [0, 3, 9], scale: [12, 2, 1] },
  { form: 'circle', intensity: 1.8, rotationX: Math.PI / 2, position: [0, 9, 0], scale: [6, 6, 1] },
]
