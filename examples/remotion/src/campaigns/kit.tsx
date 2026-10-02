import * as React from 'react'
import * as THREE from 'three'
import type { PerspectiveCamera } from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useDelayRender, useVideoConfig, type SpringConfig } from 'remotion'
import { useMockupCapture } from '../use-mockup-capture'
import { easeInOut, easeOut, tween, type Vec3 } from '../reel/motion'

/*
 * The parts the three campaign films share. None of them uses a pattern
 * backdrop: every background is CSS or a photograph, and every photograph -
 * on a printed face, on a screen, or drifting past the lens - is one of the
 * GPT Image 2.5 cut-outs in `public/art` (see `scripts/generate-art.py`).
 */

/* ------------------------------------------------------------------ */
/*  Cut-outs                                                           */
/* ------------------------------------------------------------------ */

export type ArtName =
  | 'grove-blood-orange'
  | 'grove-lemon-ginger'
  | 'grove-green-apple'
  | 'grove-slice'
  | 'grove-leaves'
  | 'grove-glass'
  | 'grove-farmer'
  | 'grove-crate'
  | 'kite-volt'
  | 'kite-sky'
  | 'kite-ember'
  | 'kite-hero'
  | 'kite-runner'
  | 'kite-portrait'
  | 'lumen-sax'
  | 'lumen-singer'
  | 'lumen-producer'
  | 'lumen-monstera'
  | 'lumen-orchid'
  | 'lumen-fern'
  | 'lumen-moth'

export const art = (name: ArtName) => staticFile(`art/${name}.webp`)

/**
 * A cut-out, absolutely placed. Give it a `width` (or a `height`) and the
 * other side follows the file. Remotion's `<Img>` holds the frame until the
 * picture has decoded - on a mockup's surface too, since the page's contexts
 * reach the glass.
 */
export function Cut({ name, style }: { name: ArtName; style?: React.CSSProperties }) {
  return (
    <Img
      src={art(name)}
      alt=""
      draggable={false}
      style={{ position: 'absolute', display: 'block', height: 'auto', pointerEvents: 'none', userSelect: 'none', ...style }}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  Printed faces                                                      */
/* ------------------------------------------------------------------ */

/**
 * One printed face or screen. The outer element is the size container, so
 * everything inside lays out in `cqw`/`cqh` against the face itself and one
 * design holds at any `resolution`. No `ground` lets the stock show through.
 */
export function Face({
  ground = 'transparent',
  ink,
  font,
  style,
  children,
}: {
  ground?: string
  ink: string
  font: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  return (
    <div style={{ width: '100%', height: '100%', containerType: 'size', background: ground, overflow: 'hidden', position: 'relative' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          color: ink,
          fontFamily: font,
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Stage                                                              */
/* ------------------------------------------------------------------ */

/** The stage props every one-liner mockup in the films shares: no controls, gated captures, the video's clock. */
export function useStage(float = true) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const delayCapture = useMockupCapture()
  return { controls: false, delayCapture, time: frame / fps, float } as const
}

/** A camera on an orbit around `target`: azimuth 0 looks down -z, elevation is above the horizon. */
export interface Orbit {
  target: Vec3
  distance: number
  azimuth: number
  elevation: number
  fov: number
}

export function orbitPosition({ target, distance, azimuth, elevation }: Orbit): Vec3 {
  return [
    target[0] + distance * Math.cos(elevation) * Math.sin(azimuth),
    target[1] + distance * Math.sin(elevation),
    target[2] + distance * Math.cos(elevation) * Math.cos(azimuth),
  ]
}

/** An orbit keyed by frame: each channel eased between neighbouring keys, held at the ends. */
export function orbitAt(frame: number, keys: (Orbit & { frame: number })[], ease = easeInOut): Orbit {
  const next = keys.findIndex((key) => key.frame > frame)
  if (next === -1) return keys[keys.length - 1]!
  if (next === 0) return keys[0]!
  const a = keys[next - 1]!
  const b = keys[next]!
  const t = ease((frame - a.frame) / (b.frame - a.frame))
  const mix = (x: number, y: number) => x + (y - x) * t
  return {
    target: [mix(a.target[0], b.target[0]), mix(a.target[1], b.target[1]), mix(a.target[2], b.target[2])],
    distance: mix(a.distance, b.distance),
    azimuth: mix(a.azimuth, b.azimuth),
    elevation: mix(a.elevation, b.elevation),
    fov: mix(a.fov, b.fov),
  }
}

/**
 * Drives a `<MockupCanvas>` camera from props, from inside the canvas: its
 * commit is the scene's commit, so `delayCapture` holds the frame until the
 * move is drawn. (The canvas's `camera` prop is read once, at creation.)
 */
export function CameraRig({ orbit }: { orbit: Orbit }) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const invalidate = useThree((state) => state.invalidate)
  const position = orbitPosition(orbit)
  React.useLayoutEffect(() => {
    camera.position.set(...position)
    camera.fov = orbit.fov
    camera.updateProjectionMatrix()
    camera.lookAt(...orbit.target)
    invalidate()
  })
  return null
}

/**
 * How high above its resting place something dropped onto a surface is, at
 * `frame`: it falls from `height`, lands at `start`-ish, and bounces off the
 * surface, each bounce lower. Never below zero - a spring's overshoot would
 * carry the object into whatever it lands on.
 */
export function landing(frame: number, fps: number, start: number, height: number, config?: Partial<SpringConfig>): number {
  const fall = spring({ frame: frame - start, fps, config: { damping: 11, stiffness: 140, mass: 0.9, ...config } })
  return height * Math.abs(1 - fall)
}

/**
 * Logs any two named objects in a scene whose geometry interpenetrates: every
 * vertex of one is tested against the other's bounding box in that object's
 * own (rotated) frame, shrunk a hair so faces that merely touch - a box set
 * on a box - do not count. Off unless the render is given
 * `REMOTION_OVERLAP_PROBE=1`; it checks the frame it is drawn on.
 */
export function OverlapProbe({ names, frame }: { names: string[]; frame: number }) {
  const scene = useThree((state) => state.scene)
  const enabled = typeof process !== 'undefined' && process.env.REMOTION_OVERLAP_PROBE === '1'
  const key = names.join(', ')
  React.useEffect(() => {
    if (enabled) console.warn(`[overlap] probing ${key}`)
  }, [enabled, key])
  useFrame(() => {
    if (!enabled) return
    scene.updateMatrixWorld(true)
    const objects = names.map((name) => scene.getObjectByName(name)).filter((o): o is THREE.Object3D => !!o)
    if (objects.length !== names.length) console.warn(`[overlap] frame ${frame}: missing ${names.filter((n) => !scene.getObjectByName(n)).join(', ')}`)
    for (let i = 0; i < objects.length; i++) {
      for (let j = 0; j < objects.length; j++) {
        if (i === j) continue
        const hits = verticesInside(objects[i]!, objects[j]!)
        if (hits > 0) console.warn(`[overlap] frame ${frame}: ${objects[i]!.name} enters ${objects[j]!.name} (${hits} vertices)`)
      }
    }
  })
  return null
}

const MARGIN = 0.004

function verticesInside(a: THREE.Object3D, b: THREE.Object3D): number {
  const toB = b.matrixWorld.clone().invert()
  const box = new THREE.Box3()
  const relative = new THREE.Matrix4()
  b.traverseVisible((node) => {
    const mesh = node as THREE.Mesh
    if (!mesh.isMesh) return
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
    relative.multiplyMatrices(toB, mesh.matrixWorld)
    box.union(mesh.geometry.boundingBox!.clone().applyMatrix4(relative))
  })
  if (box.isEmpty()) return 0
  box.expandByScalar(-MARGIN)
  const point = new THREE.Vector3()
  let hits = 0
  a.traverseVisible((node) => {
    const mesh = node as THREE.Mesh
    const position = mesh.isMesh ? mesh.geometry.getAttribute('position') : undefined
    if (!position) return
    relative.multiplyMatrices(toB, mesh.matrixWorld)
    for (let k = 0; k < position.count; k++) {
      point.fromBufferAttribute(position, k).applyMatrix4(relative)
      if (box.containsPoint(point)) hits++
    }
  })
  return hits
}

/** Where react-three-fiber first puts a rigged camera; `CameraRig` moves it on the first commit. */
export const RIG_START = { position: [0, 2, 12] as Vec3, fov: 40 }

/**
 * A ground for a scene that stands somewhere: an unlit disc in exactly the
 * CSS colour it is given, fading out toward its rim, so the stage meets the
 * backdrop without an edge and the contact shadow has something to fall on.
 */
export function Floor({ y, color, radius = 24, opacity = 1, hold = 0.35 }: { y: number; color: string; radius?: number; opacity?: number; hold?: number }) {
  const texture = React.useMemo(() => {
    // An alpha map is read from its green channel, not its alpha: grey on black.
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, size, size)
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    gradient.addColorStop(0, '#fff')
    gradient.addColorStop(hold, '#fff')
    gradient.addColorStop(0.75, '#555')
    gradient.addColorStop(1, '#000')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
    return new THREE.CanvasTexture(canvas)
  }, [hold])
  React.useEffect(() => () => texture.dispose(), [texture])
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={y - 0.004} renderOrder={-1}>
      <circleGeometry args={[radius, 96]} />
      <meshBasicMaterial color={color} alphaMap={texture} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/*  Layers in front of and behind the canvas                           */
/* ------------------------------------------------------------------ */

/**
 * A cut-out placed in the frame itself, for depth around a mockup: behind
 * the (transparent) canvas it is the far set, in front of it the near one.
 * `blur` is the depth of field - the near layer out of focus is what makes
 * the object between them read as the subject. Coordinates are 1920×1080
 * pixels, scaled to the composition.
 */
export function Drift({
  name,
  x,
  y,
  width,
  rotate = 0,
  blur = 0,
  opacity = 1,
  flip = false,
  shadow,
}: {
  name: ArtName
  x: number
  y: number
  width: number
  rotate?: number
  blur?: number
  opacity?: number
  flip?: boolean
  shadow?: string
}) {
  const { width: frameWidth } = useVideoConfig()
  const u = frameWidth / 1920
  const filters = [blur > 0 ? `blur(${blur * u}px)` : '', shadow ? `drop-shadow(${shadow})` : ''].filter(Boolean).join(' ')
  return (
    <Cut
      name={name}
      style={{
        left: x * u,
        top: y * u,
        width: width * u,
        transform: `translate(-50%, -50%) rotate(${rotate}deg)${flip ? ' scaleX(-1)' : ''}`,
        filter: filters || undefined,
        opacity,
      }}
    />
  )
}

/** Words that rise into place one after another. */
export function Words({
  text,
  start,
  stagger = 4,
  duration = 16,
  style,
}: {
  text: string
  start: number
  stagger?: number
  duration?: number
  style?: React.CSSProperties
}) {
  const frame = useCurrentFrame()
  return (
    <>
      {text.split(' ').map((word, i) => {
        const t = tween(frame, start + i * stagger, start + i * stagger + duration, 0, 1, easeOut)
        return (
          // The mask reaches 0.3em under the line, cancelled in layout by the margin: a
          // descender (an italic g, a q) hangs that far below the baseline and was clipped.
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', padding: '0 0.04em 0.3em', margin: '0 -0.04em -0.3em', ...style }}>
            <span style={{ display: 'inline-block', transform: `translateY(${(1 - t) * 140}%)`, opacity: t > 0 ? 1 : 0 }}>
              {word}
              {' '}
            </span>
          </span>
        )
      })}
    </>
  )
}

/** A 0→1→0 envelope over a shot: in over `fadeIn` frames from `start`, out over the last `fadeOut`. */
export function useEnvelope(start: number, fadeIn: number, fadeOut = 12, end?: number) {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const last = end ?? durationInFrames
  const out = fadeOut > 0 ? tween(frame, last - fadeOut, last, 0, 1) : 0
  return tween(frame, start, start + fadeIn, 0, 1, easeOut) * (1 - out)
}

/* ------------------------------------------------------------------ */
/*  Fonts                                                              */
/* ------------------------------------------------------------------ */

/**
 * Holds the render until the film's faces have loaded. `@fontsource` CSS
 * only declares them; a face that is still loading when a frame is taken
 * falls back to the system font for that frame alone, on the page and on
 * every printed surface.
 */
export function FontGate({ fonts, style, children }: { fonts: string[]; style?: React.CSSProperties; children: React.ReactNode }) {
  const { delayRender, continueRender } = useDelayRender()
  const [handle] = React.useState(() => delayRender('Loading fonts'))
  React.useEffect(() => {
    Promise.all(fonts.map((font) => document.fonts.load(font)))
      .then(() => document.fonts.ready)
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle))
  }, [continueRender, fonts, handle])
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>
}

/**
 * The face a device's status bar is set in. The bar asks for SF or One UI
 * Sans and, off a Mac or a Galaxy, falls back to whatever the machine has;
 * a render machine has neither, so a film names the closest faces it loads.
 */
export const statusBarFont = (family: string) => ({ '--mockup-status-bar-font': family }) as React.CSSProperties

/** Soft clouds drifting across a CSS sky; `drift` is how far they have moved, in 1920-wide pixels. */
export function Clouds({ drift, tint = '255,255,255', opacity = 0.7 }: { drift: number; tint?: string; opacity?: number }) {
  const { width } = useVideoConfig()
  const u = width / 1920
  const clouds = [
    { x: 160, y: 120, w: 520, h: 120 },
    { x: 760, y: 60, w: 380, h: 90 },
    { x: 1260, y: 190, w: 600, h: 130 },
    { x: 1820, y: 90, w: 420, h: 100 },
  ]
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity }}>
      {clouds.map((c, i) => {
        const x = ((c.x + drift * (0.6 + i * 0.15)) % 2400) - 240
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x * u,
              top: c.y * u,
              width: c.w * u,
              height: c.h * u,
              borderRadius: '50%',
              background: `radial-gradient(ellipse at 50% 60%, rgba(${tint},0.95) 0%, rgba(${tint},0.5) 45%, rgba(${tint},0) 70%)`,
              filter: `blur(${8 * u}px)`,
            }}
          />
        )
      })}
    </AbsoluteFill>
  )
}

/** A soft vignette over the whole frame. */
export function Vignette({ strength = 0.35, color = '0,0,0' }: { strength?: number; color?: string }) {
  return (
    <AbsoluteFill
      style={{ pointerEvents: 'none', background: `radial-gradient(ellipse 75% 70% at 50% 48%, rgba(${color},0) 55%, rgba(${color},${strength}) 100%)` }}
    />
  )
}
