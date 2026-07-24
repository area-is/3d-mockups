import * as React from 'react'
import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'
import {
  LAPTOP_COLORWAYS,
  findColorway,
  LAPTOP_VARIANTS,
  LAPTOP_DEFAULT_VARIANT,
  LAPTOP_STAGE_OFFSET_Y,
  SCREEN_REGIONS,
  type LaptopVariant,
} from '@area-mockups/core'
import { DeviceScreen } from '../../screen/device-screen'
import { createWordmarkTexture } from '../wordmark'
import { createLogoGeometry } from '../logos'
import { UsbC, EdgeSocket, cutGeometry, stadiumCutter, holeCutter } from '../details'
import { roundedRectShape } from '@area-mockups/core'
import { useScreenOccluders } from '../../screen/occluders'
import { collectSlots, createSlots, resolveSurface, type SurfaceDefaults } from '../../slots'

type GroupProps = ThreeElements['group']

export interface LaptopProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceDefaults {
  /**
   * Anything you want on the laptop screen: React components, an <iframe>, a
   * <video>… Wrap in `<Laptop.Screen>` to set per-screen surface props.
   */
  children?: React.ReactNode
  /**
   * Which laptop to render, at true relative sizes: `air13` / `air15`
   * (MacBook Air 13" / 15", uniform thin slab, clean deck) or `pro14` /
   * `pro16` (MacBook Pro 14" / 16", thicker body, HDMI/SDXC ports,
   * perforated speaker grilles, larger feet and a deeper notch).
   */
  variant?: LaptopVariant
  /**
   * A retail colorway id from `LAPTOP_COLORWAYS` (e.g. the catalog's first
   * entry) presetting the device colors. Explicit color props override it.
   */
  colorway?: string
  /** Aluminum colorway (lid, deck, bottom). MacBook Air M5 finishes work well:
   * Silver `#e3e4e6` (default), Sky Blue `#aec6d9`, Starlight `#e8e0d4`, Midnight `#2e3642`. */
  color?: string
  /**
   * CSS pixel width of the virtual display. Height follows the 13.6" panel's
   * aspect. The default 1280 gives a 1280x832 screen — exactly the MacBook
   * Air's default scaled resolution (2560x1664 at 2x) — so desktop layouts and
   * breakpoints behave like on the real machine. Style your content with % / flex.
   */
  resolution?: number
  /** Show the camera-notch overlay at the top of the display. */
  notch?: boolean
  /** Lid angle in degrees between deck and screen (90 = upright). */
  openAngle?: number
  /**
   * How screen content hides when the device faces away from the camera.
   * `true` raycasts against the lid and base (fast, interactive). `'blending'`
   * uses per-pixel depth blending. `false` disables hiding.
   */
  occlude?: boolean | 'blending'
}

/** One flat, rounded slab (base or lid), extruded with a soft edge bevel. */
function slabGeometry(width: number, depth: number, radius: number, thickness: number, bevel: number) {
  const shape = roundedRectShape(width - bevel * 2, depth - bevel * 2, radius - bevel)
  const core = thickness - bevel * 2
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: core,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 16,
  })
  g.translate(0, 0, -core / 2)
  return g
}

/** Memoized slab with disposal (the lid). */
function useSlabGeometry(width: number, depth: number, radius: number, thickness: number, bevel: number) {
  const geometry = React.useMemo(
    () => slabGeometry(width, depth, radius, thickness, bevel),
    [width, depth, radius, thickness, bevel]
  )
  React.useEffect(() => () => geometry.dispose(), [geometry])
  return geometry
}

/* -------------------------------------------------------------------------
 * Keyboard: the 78-key US Magic Keyboard, measured off a retail-unit scan of
 * the MacBook Pro 14" — 18.8 mm x-pitch, 18.5 mm row pitch, 2.5 mm gaps,
 * six FULL-height rows (the function row matches the others since 2021),
 * half-height inverted-T arrows, caps flush with the deck.
 * ---------------------------------------------------------------------- */

/** 3 mm side margin between the well edge and the first cap. */
const KEY_PAD_X = 0.0414
/** 3.3 mm margin above the function row / below the bottom row. */
const KEY_PAD_Z = 0.0456
/** 2.5 mm air between neighboring caps. */
const KEY_GAP = 0.0345

type KeyIcon =
  | 'sunlo' | 'sunhi' | 'mission' | 'spot' | 'mic' | 'moon'
  | 'rew' | 'play' | 'fwd' | 'mute' | 'voldn' | 'volup'
  | 'globe' | 'cmd' | 'opt' | 'shift' | 'caps' | 'tab' | 'back' | 'ret'

type KeyLegend =
  /** Centered glyph (letters). `nub` prints the home-row bar under F / J. */
  | { t: 'txt'; s: string; nub?: boolean }
  /** Shifted symbol stacked over the base symbol (number / punctuation keys). */
  | { t: 'dual'; a: string; b: string }
  /** Word in a bottom corner (esc, tab, return…). `dot` = caps-lock light. */
  | { t: 'word'; s: string; align: 'bl' | 'br'; dot?: boolean }
  /** Glyph icon in a bottom corner (the M5 Air's ⇥ ⇪ ⇧ ⌫ ⏎ style). */
  | { t: 'ic'; i: KeyIcon; align: 'bl' | 'br'; dot?: boolean }
  /**
   * Modifier: word along the bottom with the symbol in the TOP-OUTER corner —
   * top-left on the left-hand keys, mirrored to top-right on the right-hand
   * command/option (scan-measured, ~5.2 mm in / 4.6 mm down to symbol center).
   */
  | { t: 'mod'; i?: KeyIcon; c?: string; s: string; side: 'l' | 'r' }
  /** The fn key: globe bottom-left, "fn" bottom-right. */
  | { t: 'fn' }
  /** Function row: media icon over the F-number label. */
  | { t: 'fk'; i: KeyIcon; s: string }
  | { t: 'arrow'; d: 'l' | 'r' | 'u' | 'd' }
  | { t: 'none' }

type KeyDef = { x: number; z: number; w: number; d: number; legend: KeyLegend }

const F_ICONS: KeyIcon[] = [
  'sunlo', 'sunhi', 'mission', 'spot', 'mic', 'moon',
  'rew', 'play', 'fwd', 'mute', 'voldn', 'volup',
]

/**
 * The US layout in standard key units (every row sums to 14.5u), with
 * per-variant legend styles: `text` prints words on the editing keys the way
 * the MacBook Pro does, `icons` the M5 Air's glyphs. Coordinates are
 * keyboard-local, +z toward the user.
 */
function buildKeyboardLayout(keyboard: { width: number; depth: number; legends: 'text' | 'icons' }) {
  const icons = keyboard.legends === 'icons'
  const usable = keyboard.width - KEY_PAD_X * 2
  const pitch = (usable + KEY_GAP) / 14.5
  const pitchZ = (keyboard.depth - KEY_PAD_Z * 2 + KEY_GAP) / 6
  const capD = pitchZ - KEY_GAP

  const dual = (a: string, b: string): KeyLegend => ({ t: 'dual', a, b })
  const txt = (s: string, nub?: boolean): KeyLegend => ({ t: 'txt', s, nub })
  // The editing keys: words on the Pro, bare glyphs on the Air.
  const edit = (s: string, i: KeyIcon, align: 'bl' | 'br', dot?: boolean): KeyLegend =>
    icons ? { t: 'ic', i, align, dot } : { t: 'word', s, align, dot }

  const ROWS: [number, KeyLegend][][] = [
    [
      [1.5, { t: 'word', s: 'esc', align: 'bl' }],
      ...F_ICONS.map((i, n) => [1, { t: 'fk', i, s: `F${n + 1}` }] as [number, KeyLegend]),
      [1, { t: 'none' }], // Touch ID
    ],
    [
      [1, dual('~', '`')], [1, dual('!', '1')], [1, dual('@', '2')], [1, dual('#', '3')],
      [1, dual('$', '4')], [1, dual('%', '5')], [1, dual('^', '6')], [1, dual('&', '7')],
      [1, dual('*', '8')], [1, dual('(', '9')], [1, dual(')', '0')], [1, dual('_', '-')],
      [1, dual('+', '=')], [1.5, edit('delete', 'back', 'br')],
    ],
    [
      [1.5, edit('tab', 'tab', 'bl')],
      ...'QWERTYUIOP'.split('').map((s) => [1, txt(s)] as [number, KeyLegend]),
      [1, dual('{', '[')], [1, dual('}', ']')], [1, dual('|', '\\')],
    ],
    [
      [1.75, edit('caps lock', 'caps', 'bl', true)],
      [1, txt('A')], [1, txt('S')], [1, txt('D')], [1, txt('F', true)], [1, txt('G')],
      [1, txt('H')], [1, txt('J', true)], [1, txt('K')], [1, txt('L')],
      [1, dual(':', ';')], [1, dual('"', "'")],
      [1.75, edit('return', 'ret', 'br')],
    ],
    [
      [2.25, edit('shift', 'shift', 'bl')],
      ...'ZXCVBNM'.split('').map((s) => [1, txt(s)] as [number, KeyLegend]),
      [1, dual('<', ',')], [1, dual('>', '.')], [1, dual('?', '/')],
      [2.25, edit('shift', 'shift', 'br')],
    ],
    [
      [1, { t: 'fn' }],
      [1, { t: 'mod', c: '^', s: 'control', side: 'l' }],
      [1, { t: 'mod', i: 'opt', s: 'option', side: 'l' }],
      [1.25, { t: 'mod', i: 'cmd', s: 'command', side: 'l' }],
      [5, { t: 'none' }], // space
      [1.25, { t: 'mod', i: 'cmd', s: 'command', side: 'r' }],
      [1, { t: 'mod', i: 'opt', s: 'option', side: 'r' }],
    ],
  ]

  const keys: KeyDef[] = []
  let z = -keyboard.depth / 2 + KEY_PAD_Z
  for (const [rowIndex, row] of ROWS.entries()) {
    let x = -usable / 2
    for (const [u, legend] of row) {
      keys.push({ x: x + (u * pitch - KEY_GAP) / 2, z: z + capD / 2, w: u * pitch - KEY_GAP, d: capD, legend })
      x += u * pitch
    }
    if (rowIndex === ROWS.length - 1) {
      // inverted-T arrows in the remaining 3u: half-height caps, ◀ ▼ ▶ on the
      // bottom half, ▲ stacked above ▼ with a slim gap.
      const half = (capD - 0.016) / 2
      const arrow = (slot: number, top: boolean, d: 'l' | 'r' | 'u' | 'd') =>
        keys.push({
          x: x + slot * pitch + (pitch - KEY_GAP) / 2,
          z: top ? z + half / 2 : z + capD - half / 2,
          w: pitch - KEY_GAP,
          d: half,
          legend: { t: 'arrow', d },
        })
      arrow(0, false, 'l')
      arrow(1, true, 'u')
      arrow(1, false, 'd')
      arrow(2, false, 'r')
    }
    z += pitchZ
  }
  // Touch ID = last key of the function row (no legend, gets the sensor disc).
  return { keys, touchId: keys[ROWS[0]!.length - 1]! }
}

/**
 * Monochrome legend icons drawn as canvas paths — font glyphs for ⌘ ⇧ ⌫ etc.
 * aren't dependable across environments, and Apple's media icons have no
 * Unicode form at all. `s` is the icon's box size in canvas px.
 */
function drawKeyIcon(ctx: CanvasRenderingContext2D, icon: KeyIcon, x: number, y: number, s: number) {
  const lw = Math.max(1.2, s * 0.09)
  ctx.save()
  ctx.translate(x, y)
  ctx.lineWidth = lw
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const circle = (cx: number, cy: number, r: number, fill = false) => {
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    fill ? ctx.fill() : ctx.stroke()
  }
  const line = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
  const poly = (pts: [number, number][], fill = false, close = true) => {
    ctx.beginPath()
    ctx.moveTo(pts[0]![0], pts[0]![1])
    for (const [px, py] of pts.slice(1)) ctx.lineTo(px, py)
    if (close) ctx.closePath()
    fill ? ctx.fill() : ctx.stroke()
  }
  // Apple's F10-F12 speaker glyph is a stroked outline, not a filled solid.
  const speaker = (cx: number) => {
    poly([[cx - 0.3 * s, -0.11 * s], [cx - 0.15 * s, -0.11 * s], [cx + 0.02 * s, -0.28 * s], [cx + 0.02 * s, 0.28 * s], [cx - 0.15 * s, 0.11 * s], [cx - 0.3 * s, 0.11 * s]])
  }
  const rays = (r0: number, r1: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      line(Math.cos(a) * r0, Math.sin(a) * r0, Math.cos(a) * r1, Math.sin(a) * r1)
    }
  }
  switch (icon) {
    case 'sunlo':
      circle(0, 0, 0.14 * s)
      rays(0.24 * s, 0.32 * s, 8)
      break
    case 'sunhi':
      circle(0, 0, 0.18 * s)
      rays(0.3 * s, 0.42 * s, 8)
      break
    case 'mission': {
      const r = 0.06 * s
      ctx.beginPath()
      ctx.roundRect(-0.42 * s, -0.26 * s, 0.46 * s, 0.52 * s, r)
      ctx.stroke()
      ctx.beginPath()
      ctx.roundRect(0.14 * s, -0.26 * s, 0.3 * s, 0.2 * s, r)
      ctx.stroke()
      ctx.beginPath()
      ctx.roundRect(0.14 * s, 0.06 * s, 0.3 * s, 0.2 * s, r)
      ctx.stroke()
      break
    }
    case 'spot':
      circle(-0.08 * s, -0.08 * s, 0.26 * s)
      line(0.12 * s, 0.12 * s, 0.36 * s, 0.36 * s)
      break
    case 'mic': {
      ctx.beginPath()
      ctx.roundRect(-0.1 * s, -0.42 * s, 0.2 * s, 0.44 * s, 0.1 * s)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(0, -0.02 * s, 0.24 * s, 0.15 * Math.PI, 0.85 * Math.PI)
      ctx.stroke()
      line(0, 0.22 * s, 0, 0.4 * s)
      break
    }
    case 'moon': {
      // crescent ☾: full outer arc, inner arc carved back with an offset center
      ctx.beginPath()
      ctx.arc(-0.02 * s, 0, 0.32 * s, -0.3 * Math.PI, 0.7 * Math.PI)
      ctx.arc(0.12 * s, -0.12 * s, 0.22 * s, 0.62 * Math.PI, -0.22 * Math.PI, true)
      ctx.closePath()
      ctx.stroke()
      break
    }
    // F7-F9 transport glyphs are hollow outlined triangles on the real caps
    case 'rew':
      poly([[0.02 * s, -0.22 * s], [-0.32 * s, 0], [0.02 * s, 0.22 * s]])
      poly([[0.38 * s, -0.22 * s], [0.04 * s, 0], [0.38 * s, 0.22 * s]])
      break
    case 'play':
      poly([[-0.36 * s, -0.22 * s], [-0.05 * s, 0], [-0.36 * s, 0.22 * s]])
      line(0.12 * s, -0.22 * s, 0.12 * s, 0.22 * s)
      line(0.28 * s, -0.22 * s, 0.28 * s, 0.22 * s)
      break
    case 'fwd':
      poly([[-0.38 * s, -0.22 * s], [-0.04 * s, 0], [-0.38 * s, 0.22 * s]])
      poly([[-0.02 * s, -0.22 * s], [0.32 * s, 0], [-0.02 * s, 0.22 * s]])
      break
    case 'mute':
      // F10 is the bare speaker — no waves, no cross
      speaker(0.12 * s)
      break
    case 'voldn': {
      speaker(-0.04 * s)
      ctx.beginPath()
      ctx.arc(0.04 * s, 0, 0.2 * s, -0.3 * Math.PI, 0.3 * Math.PI)
      ctx.stroke()
      break
    }
    case 'volup': {
      speaker(-0.14 * s)
      for (const r of [0.16, 0.28, 0.4]) {
        ctx.beginPath()
        ctx.arc(-0.06 * s, 0, r * s, -0.3 * Math.PI, 0.3 * Math.PI)
        ctx.stroke()
      }
      break
    }
    case 'globe': {
      circle(0, 0, 0.36 * s)
      line(-0.36 * s, 0, 0.36 * s, 0)
      ctx.beginPath()
      ctx.ellipse(0, 0, 0.17 * s, 0.36 * s, 0, 0, Math.PI * 2)
      ctx.stroke()
      break
    }
    case 'cmd': {
      const a = 0.16 * s
      const r = 0.13 * s
      const c = a + r
      ctx.strokeRect(-a, -a, a * 2, a * 2)
      circle(-c, -c, r)
      circle(c, -c, r)
      circle(-c, c, r)
      circle(c, c, r)
      break
    }
    case 'opt':
      line(0.1 * s, -0.26 * s, 0.42 * s, -0.26 * s)
      poly([[-0.42 * s, -0.26 * s], [-0.14 * s, -0.26 * s], [0.14 * s, 0.26 * s], [0.42 * s, 0.26 * s]], false, false)
      break
    case 'shift':
      poly([[0, -0.38 * s], [0.32 * s, 0.02 * s], [0.14 * s, 0.02 * s], [0.14 * s, 0.34 * s], [-0.14 * s, 0.34 * s], [-0.14 * s, 0.02 * s], [-0.32 * s, 0.02 * s]])
      break
    case 'caps':
      poly([[0, -0.42 * s], [0.3 * s, -0.04 * s], [0.13 * s, -0.04 * s], [0.13 * s, 0.2 * s], [-0.13 * s, 0.2 * s], [-0.13 * s, -0.04 * s], [-0.3 * s, -0.04 * s]])
      line(-0.13 * s, 0.36 * s, 0.13 * s, 0.36 * s)
      break
    case 'tab':
      line(-0.4 * s, 0, 0.22 * s, 0)
      poly([[0.06 * s, -0.14 * s], [0.22 * s, 0], [0.06 * s, 0.14 * s]], false, false)
      line(0.36 * s, -0.2 * s, 0.36 * s, 0.2 * s)
      break
    case 'back':
      poly([[-0.44 * s, 0], [-0.18 * s, -0.26 * s], [0.44 * s, -0.26 * s], [0.44 * s, 0.26 * s], [-0.18 * s, 0.26 * s]])
      line(-0.02 * s, -0.1 * s, 0.18 * s, 0.1 * s)
      line(0.18 * s, -0.1 * s, -0.02 * s, 0.1 * s)
      break
    case 'ret':
      ctx.beginPath()
      ctx.moveTo(0.3 * s, -0.28 * s)
      ctx.lineTo(0.3 * s, 0.08 * s)
      ctx.lineTo(-0.22 * s, 0.08 * s)
      ctx.stroke()
      poly([[-0.08 * s, -0.08 * s], [-0.26 * s, 0.08 * s], [-0.08 * s, 0.24 * s]], false, false)
      break
  }
  ctx.restore()
}

/**
 * The Magic Keyboard: rounded keycaps as a single instanced mesh (one draw
 * call), a canvas-painted legends layer just above the caps (letters, stacked
 * shift symbols, corner words or glyph icons per variant, hand-drawn media
 * icons, home-row nubs), and the Touch ID disc on the top-right key.
 */
function Keys({ keyboard }: { keyboard: { width: number; depth: number; offsetZ: number; legends: 'text' | 'icons' } }) {
  const meshRef = React.useRef<THREE.InstancedMesh>(null!)

  const layout = React.useMemo(() => buildKeyboardLayout(keyboard), [keyboard])

  // All legends painted once into a texture spanning the keyboard well.
  const legendsTexture = React.useMemo(() => {
    if (typeof document === 'undefined') return null
    const scale = 2048 / keyboard.width // canvas px per world unit
    const u = (units: number) => units * scale
    const canvas = document.createElement('canvas')
    canvas.width = 2048
    canvas.height = Math.round(keyboard.depth * scale)
    const ctx = canvas.getContext('2d')!
    const INK = 'rgba(228, 231, 240, 0.85)'
    ctx.fillStyle = INK
    ctx.strokeStyle = INK
    const font = (size: number, weight = 500) =>
      (ctx.font = `${weight} ${Math.round(size)}px -apple-system, 'Helvetica Neue', 'Segoe UI', Arial, sans-serif`)
    const arrowTri = (px: number, py: number, s: number, d: 'l' | 'r' | 'u' | 'd') => {
      const rot = { u: 0, r: Math.PI / 2, d: Math.PI, l: -Math.PI / 2 }[d]
      ctx.save()
      ctx.translate(px, py)
      ctx.rotate(rot)
      ctx.beginPath()
      ctx.moveTo(0, -0.6 * s)
      ctx.lineTo(0.62 * s, 0.5 * s)
      ctx.lineTo(-0.62 * s, 0.5 * s)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }
    for (const key of layout.keys) {
      const px = (key.x + keyboard.width / 2) * scale
      const py = (key.z + keyboard.depth / 2) * scale
      const hw = (key.w * scale) / 2
      const hd = (key.d * scale) / 2
      // Corner anchors from the scan's legend geometry: words start 3.1 mm in
      // from a left edge, end 2.7 mm from a right edge, baseline 2.85 mm up.
      const blX = px - hw + u(0.043)
      const brX = px + hw - u(0.037)
      const cornerY = py + hd - u(0.039)
      const dot = () => {
        // caps-lock light: Ø1.25 mm, top-left (3.2 mm / 2.9 mm insets)
        ctx.beginPath()
        ctx.arc(px - hw + u(0.052), py - hd + u(0.048), u(0.0086), 0, Math.PI * 2)
        ctx.fill()
      }
      const legend = key.legend
      switch (legend.t) {
        case 'txt':
          // letters: 4 mm cap height, centered
          font(u(0.076))
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(legend.s, px, py)
          if (legend.nub) {
            // home-row locator bar under F and J
            ctx.save()
            ctx.globalAlpha = 0.55
            ctx.beginPath()
            ctx.roundRect(px - u(0.034), py + hd - u(0.02), u(0.068), u(0.008), u(0.004))
            ctx.fill()
            ctx.restore()
          }
          break
        case 'dual':
          // shifted symbol centered 4.5 mm from the cap top, base symbol
          // larger (5.2 mm font) centered 11.1 mm down — scan-measured
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          font(u(0.052))
          ctx.fillText(legend.a, px, py - u(0.048))
          font(u(0.072))
          ctx.fillText(legend.b, px, py + u(0.044))
          break
        case 'word':
          font(u(0.048))
          ctx.textAlign = legend.align === 'bl' ? 'left' : 'right'
          ctx.textBaseline = 'alphabetic'
          ctx.fillText(legend.s, legend.align === 'bl' ? blX : brX, cornerY)
          if (legend.dot) dot()
          break
        case 'ic':
          drawKeyIcon(
            ctx,
            legend.i,
            legend.align === 'bl' ? blX + u(0.036) : brX - u(0.036),
            cornerY - u(0.026),
            u(0.075)
          )
          if (legend.dot) dot()
          break
        case 'mod': {
          // symbol in the top-outer corner: center 5.2 mm in from the outer
          // edge, 4.6 mm down from the cap top (mirrored on right-hand keys)
          const sx = legend.side === 'l' ? px - hw + u(0.072) : px + hw - u(0.072)
          const sy = py - hd + u(0.063)
          if (legend.c) {
            font(u(0.062), 600)
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(legend.c, sx, sy)
          } else if (legend.i) {
            drawKeyIcon(ctx, legend.i, sx, sy, legend.i === 'cmd' ? u(0.056) : u(0.06))
          }
          font(u(0.047))
          ctx.textAlign = 'center'
          ctx.textBaseline = 'alphabetic'
          ctx.fillText(legend.s, px, cornerY)
          break
        }
        case 'fn':
          // globe Ø3.9 mm bottom-left, "fn" bottom-right (scan-measured)
          drawKeyIcon(ctx, 'globe', px - hw + u(0.07), py + hd - u(0.0666), u(0.0754))
          font(u(0.047))
          ctx.textAlign = 'right'
          ctx.textBaseline = 'alphabetic'
          ctx.fillText('fn', brX, cornerY)
          break
        case 'fk':
          // media icon ~3.3 mm centered 5.6 mm from the cap top, F-label
          // 2.3 mm font centered 12.2 mm down
          drawKeyIcon(ctx, legend.i, px, py - u(0.0325), u(0.045))
          font(u(0.032))
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(legend.s, px, py + u(0.0587))
          break
        case 'arrow':
          arrowTri(px, py, u(0.021), legend.d)
          break
      }
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.anisotropy = 8
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [layout, keyboard])
  React.useEffect(() => () => legendsTexture?.dispose(), [legendsTexture])

  // Rounded keycap: an extruded rounded-rect, laid flat (footprint in XZ).
  // Small corner radius and a tight edge bevel per the reference scan.
  const capGeometry = React.useMemo(() => {
    const g = new THREE.ExtrudeGeometry(roundedRectShape(1, 1, 0.1), {
      depth: 0.012,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.02,
      bevelSegments: 2,
      curveSegments: 6,
    })
    g.rotateX(-Math.PI / 2)
    return g
  }, [])
  React.useEffect(() => () => capGeometry.dispose(), [capGeometry])

  React.useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    layout.keys.forEach((k, i) => {
      m.makeScale(k.w, 1, k.d)
      m.setPosition(k.x, 0, k.z)
      meshRef.current.setMatrixAt(i, m)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [layout])

  return (
    <>
      <instancedMesh ref={meshRef} args={[undefined, undefined, layout.keys.length]} geometry={capGeometry}>
        {/* matte keycaps: tame the studio env so the black doesn't wash out */}
        <meshPhysicalMaterial color="#17181d" metalness={0.08} roughness={0.72} envMapIntensity={0.45} />
      </instancedMesh>
      {/* printed legends, floating just above the caps */}
      {legendsTexture && (
        <mesh position={[0, 0.0195, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[keyboard.width, keyboard.depth]} />
          <meshBasicMaterial map={legendsTexture} transparent toneMapped={false} depthWrite={false} />
        </mesh>
      )}
      {/* Touch ID: recessed sensor disc + hairline ring on the top-right key */}
      <mesh position={[layout.touchId.x, 0.0185, layout.touchId.z]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.055, 28]} />
        <meshPhysicalMaterial color="#0c0d11" metalness={0.35} roughness={0.32} envMapIntensity={0.7} />
      </mesh>
      <mesh position={[layout.touchId.x, 0.019, layout.touchId.z]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.049, 0.055, 28]} />
        <meshPhysicalMaterial color="#26282e" metalness={0.5} roughness={0.35} envMapIntensity={0.8} />
      </mesh>
    </>
  )
}

/**
 * A procedurally built Apple MacBook Air 13" (M5)-style laptop: rounded
 * unibody base with a Magic-Keyboard deck and Force Touch trackpad, and a thin
 * hinged lid whose notched display carries your live content. No 3D asset
 * files — everything is generated from geometry at runtime.
 *
 * The opened pose (deck + raised lid) is centered on the group origin, the
 * pose the stage camera and shadow framing are tuned for.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 */
function LaptopImpl({
  children,
  variant = LAPTOP_DEFAULT_VARIANT,
  colorway,
  color: colorProp,
  surfaceBackground = '#000000',
  resolution,
  notch = true,
  openAngle,
  interactive = true,
  dragToRotate = true,
  occlude = true,
  surfaceStyle,
  ...groupProps
}: LaptopProps) {
  const screen = collectSlots(children, SCREEN_REGIONS).screen
  const spec = LAPTOP_VARIANTS[variant]
  const retail = findColorway(LAPTOP_COLORWAYS[variant], colorway)
  const color = colorProp ?? retail?.color ?? '#e3e4e6'
  const { footprint, base, lid, display, notch: notchDims, keyboard, trackpad } = spec
  // Default scaled desktops (native/2): 1280x832 / 1440x932 on the Airs,
  // 1512x982 / 1728x1117 on the Pros.
  const res = resolution ?? { air13: 1280, air15: 1440, pro14: 1512, pro16: 1728 }[variant]
  const lidAngle = openAngle ?? spec.openAngle
  const baseRef = React.useRef<THREE.Mesh>(null!)
  const lidRef = React.useRef<THREE.Mesh>(null!)
  const occludeRefs = useScreenOccluders(lidRef, baseRef)

  // Base chassis: the slab is baked into its resting orientation (footprint in
  // XZ) so every side-wall port opening can be machined out of it in place —
  // each port is a real cavity in the aluminum, not a dark inlay.
  const baseGeometry = React.useMemo(() => {
    const g = slabGeometry(footprint.width, footprint.depth, footprint.radius, base.thickness, base.bevel)
    g.rotateX(-Math.PI / 2)
    const cutters: THREE.BufferGeometry[] = []
    for (const [side, dir] of [['left', -1], ['right', 1]] as const) {
      for (const port of spec.ports[side]) {
        const cutter =
          port.shape === 'round'
            ? holeCutter(port.height / 2, 0.1, 'x')
            : stadiumCutter(port.width, port.height, 0.1, 'x')
        cutters.push(cutter.translate(dir * (footprint.width / 2), -0.004, port.z))
      }
    }
    // Lift-lid scoop: a horizontal capsule half-buried at deck level machines
    // the crescent recess out of the front edge — deepest at the top surface,
    // fading to nothing down the front face, rounded ends. The cut interior
    // stays aluminum, exactly like the milled original.
    const scoop = spec.scoop
    const capsule = new THREE.CapsuleGeometry(scoop.radius, scoop.width - scoop.radius * 2, 4, 20)
    capsule.rotateZ(Math.PI / 2)
    capsule.translate(0, base.thickness / 2, footprint.depth / 2 + scoop.radius - scoop.bite)
    cutters.push(capsule)
    return cutGeometry(g, cutters)
  }, [footprint, base, spec.ports, spec.scoop])
  React.useEffect(() => () => baseGeometry.dispose(), [baseGeometry])
  const lidGeometry = useSlabGeometry(footprint.width, footprint.depth, footprint.radius, lid.thickness, lid.bevel)

  const wellGeometry = React.useMemo(
    () => new THREE.ShapeGeometry(roundedRectShape(keyboard.width, keyboard.depth, 0.06), 12),
    [keyboard]
  )
  const trackpadGeometry = React.useMemo(
    () => new THREE.ShapeGeometry(roundedRectShape(trackpad.width, trackpad.depth, 0.05), 12),
    [trackpad]
  )
  const trackpadRimGeometry = React.useMemo(
    () =>
      new THREE.ShapeGeometry(roundedRectShape(trackpad.width + 0.018, trackpad.depth + 0.018, 0.056), 12),
    [trackpad]
  )
  const bottomPlateGeometry = React.useMemo(
    () =>
      new THREE.ShapeGeometry(
        roundedRectShape(footprint.width - 0.34, footprint.depth - 0.34, footprint.radius - 0.1),
        16
      ),
    [footprint]
  )
  const glassGeometry = React.useMemo(
    () =>
      new THREE.ShapeGeometry(
        roundedRectShape(footprint.width - 0.14, footprint.depth - 0.14, footprint.radius - 0.05),
        16
      ),
    [footprint]
  )
  React.useEffect(() => {
    return () => {
      wellGeometry.dispose()
      trackpadGeometry.dispose()
      trackpadRimGeometry.dispose()
      bottomPlateGeometry.dispose()
      glassGeometry.dispose()
    }
  }, [wellGeometry, trackpadGeometry, trackpadRimGeometry, bottomPlateGeometry, glassGeometry])

  // Speaker grille: the scan resolves each strip as a ~1.0 x 0.93 mm grid of
  // ~0.63 mm drilled holes. Painted once into a transparent canvas (dark hole
  // + faint lower-edge glint for the countersink) so the aluminum deck shows
  // between the holes exactly like the machined part.
  const grilleTexture = React.useMemo(() => {
    if (!spec.speakers || typeof document === 'undefined') return null
    const s = spec.speakers
    const pxPerU = 1400
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(s.width * pxPerU)
    canvas.height = Math.round(s.depth * pxPerU)
    const ctx = canvas.getContext('2d')!
    const r = s.holeR * pxPerU
    const nx = Math.floor((s.width - s.holePitchX) / s.holePitchX) + 1
    const nz = Math.floor((s.depth - s.holePitchZ) / s.holePitchZ) + 1
    for (let ix = 0; ix < nx; ix++) {
      for (let iz = 0; iz < nz; iz++) {
        const cx = (ix - (nx - 1) / 2) * s.holePitchX * pxPerU + canvas.width / 2
        const cy = (iz - (nz - 1) / 2) * s.holePitchZ * pxPerU + canvas.height / 2
        ctx.fillStyle = 'rgba(255, 255, 255, 0.16)'
        ctx.beginPath()
        ctx.arc(cx, cy + r * 0.45, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(6, 7, 10, 0.94)'
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.anisotropy = 8
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [spec.speakers])
  React.useEffect(() => () => grilleTexture?.dispose(), [grilleTexture])

  // Lid badge (vector geometry from the SVG) + underside wordmark (canvas text).
  // The badge is glossy tone-on-tone: darker on light finishes, lighter on dark
  // ones, so it reads in every colorway.
  const logoColor = React.useMemo(() => {
    const c = new THREE.Color(color)
    const luminance = c.r * 0.299 + c.g * 0.587 + c.b * 0.114
    return `#${c.lerp(new THREE.Color(luminance > 0.4 ? '#000000' : '#ffffff'), 0.32).getHexString()}`
  }, [color])
  const logoGeometry = React.useMemo(
    () => createLogoGeometry('apple', spec.logo.width, spec.logo.height),
    [spec.logo]
  )
  const bottomTextTexture = React.useMemo(
    () => (spec.bottomText ? createWordmarkTexture(spec.bottomText.text, { letterSpacing: 0.06, weight: 600 }) : null),
    [spec.bottomText]
  )
  React.useEffect(
    () => () => {
      logoGeometry.dispose()
      bottomTextTexture?.dispose()
    },
    [logoGeometry, bottomTextTexture]
  )

  // CSS px per world unit for the display overlay (notch).
  const pxPerUnit = res / display.width
  const px = (units: number) => units * pxPerUnit

  const deckY = base.thickness / 2
  const hingeZ = -footprint.depth / 2 + 0.055
  // 90° = upright; larger angles lean the screen back, away from the viewer.
  const lidTilt = -((lidAngle - 90) * Math.PI) / 180

  // Anodized aluminum needs a strong diffuse term — at high metalness any face
  // angled away from the key light crushes to black (the lid's outer face in
  // every rear view), where the real finish still reads as body-color metal.
  const aluminum = (
    <meshPhysicalMaterial
      color={color}
      metalness={0.5}
      roughness={0.42}
      clearcoat={0.4}
      clearcoatRoughness={0.3}
      envMapIntensity={0.9}
    />
  )

  return (
    <group {...groupProps}>
      {/* the whole machine rides LAPTOP_STAGE_OFFSET_Y down so the opened pose
          (deck + raised lid) sits visually centered on the group origin the
          stage framing in core is tuned for */}
      <group position={[0, LAPTOP_STAGE_OFFSET_Y, 0]}>
        {/* ---------------- base: unibody chassis with the keyboard deck ---------------- */}
        <group>
          <mesh ref={baseRef} geometry={baseGeometry}>
            {aluminum}
          </mesh>

          {/* keyboard well (recess) + keys */}
          <mesh geometry={wellGeometry} rotation-x={-Math.PI / 2} position={[0, deckY + 0.002, keyboard.offsetZ]}>
            <meshPhysicalMaterial color="#101216" metalness={0.3} roughness={0.5} />
          </mesh>
          {/* caps sit nearly flush with the deck (scan: tops +0.3 mm), rising
              out of the black well tub */}
          <group position={[0, deckY - 0.013, keyboard.offsetZ]}>
            <Keys keyboard={keyboard} />
          </group>

          {/* trackpad: flush glass with a hairline seam around it. Same finish as
              the deck — a glossier material here reads as a bright sticker */}
          <mesh geometry={trackpadRimGeometry} rotation-x={-Math.PI / 2} position={[0, deckY + 0.0015, trackpad.offsetZ]}>
            <meshPhysicalMaterial color="#5c5f66" metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh geometry={trackpadGeometry} rotation-x={-Math.PI / 2} position={[0, deckY + 0.003, trackpad.offsetZ]}>
            <meshPhysicalMaterial color={color} metalness={0.85} roughness={0.36} clearcoat={0.4} clearcoatRoughness={0.3} />
          </mesh>

          {/* inset bottom plate (the seam line visible along the lower edge) */}
          <mesh geometry={bottomPlateGeometry} rotation-x={Math.PI / 2} position={[0, -base.thickness / 2 - 0.004, 0]}>
            <meshPhysicalMaterial color={color} metalness={0.8} roughness={0.5} envMapIntensity={0.6} />
          </mesh>

          {/* perforated speaker strips flanking the keyboard (Pro): drilled-hole
              grid painted over the bare deck — aluminum shows between holes */}
          {spec.speakers &&
            grilleTexture &&
            [-1, 1].map((side) => (
              <mesh
                key={side}
                rotation-x={-Math.PI / 2}
                position={[side * spec.speakers!.x, deckY + 0.0015, spec.speakers!.offsetZ]}
              >
                <planeGeometry args={[spec.speakers!.width, spec.speakers!.depth]} />
                <meshBasicMaterial
                  map={grilleTexture}
                  transparent
                  toneMapped={false}
                  depthWrite={false}
                  polygonOffset
                  polygonOffsetFactor={-1}
                />
              </mesh>
            ))}

          {/* port interiors — the openings are real cavities machined from the
              base above. Thunderbolt gets the full USB-C receptacle (shell +
              gold tongue); MagSafe, HDMI, SDXC and the jack get dark sockets. */}
          {([['left', -1], ['right', 1]] as const).map(([side, dir]) =>
            spec.ports[side].map((port, i) => {
              const inward: 1 | -1 = dir === -1 ? 1 : -1
              const x = dir * (footprint.width / 2)
              return port.shape === 'round' ? (
                <EdgeSocket
                  key={`${side}${i}`}
                  position={[x, -0.004, port.z]}
                  r={port.height / 2}
                  depth={0.1}
                  lip={0.012}
                  axis="x"
                  inward={inward}
                />
              ) : port.width <= 0.13 ? (
                <UsbC
                  key={`${side}${i}`}
                  x={x}
                  y={-0.004}
                  z={port.z}
                  width={port.width}
                  height={port.height}
                  depth={0.1}
                  axis="x"
                  inward={inward}
                />
              ) : (
                <EdgeSocket
                  key={`${side}${i}`}
                  position={[x, -0.004, port.z]}
                  width={port.width}
                  height={port.height}
                  depth={0.1}
                  lip={0.012}
                  axis="x"
                  inward={inward}
                />
              )
            })
          )}

          {/* rubber feet */}
          {([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([sx, sz], i) => (
            <mesh key={i} position={[sx * spec.feet.x, -base.thickness / 2 - 0.01, sz * spec.feet.z]}>
              <cylinderGeometry args={[spec.feet.radius, spec.feet.radius, 0.016, 20]} />
              <meshPhysicalMaterial color="#17181c" metalness={0.1} roughness={0.8} />
            </mesh>
          ))}

          {/* embossed wordmark near the front of the underside (Pro) */}
          {spec.bottomText && bottomTextTexture && (
            <mesh
              rotation-x={Math.PI / 2}
              position={[0, -base.thickness / 2 - 0.0055, spec.bottomText.offsetZ]}
            >
              <planeGeometry args={[spec.bottomText.width, spec.bottomText.height]} />
              <meshPhysicalMaterial
                map={bottomTextTexture}
                transparent
                opacity={0.5}
                color="#9a9da4"
                metalness={0.7}
                roughness={0.4}
                polygonOffset
                polygonOffsetFactor={-1}
              />
            </mesh>
          )}
        </group>

        {/* ---------------- lid: hinged at the back edge of the deck ---------------- */}
        <group position={[0, deckY, hingeZ]} rotation-x={lidTilt}>
          {/* hinge: the black band spanning the center of the back (aluminum shows at the ends) */}
          <mesh rotation-z={Math.PI / 2} position={[0, 0, 0]}>
            <cylinderGeometry args={[variant.startsWith('pro') ? 0.069 : 0.052, variant.startsWith('pro') ? 0.069 : 0.052, footprint.width * 0.76, 24]} />
            <meshPhysicalMaterial color="#0d0e12" metalness={0.5} roughness={0.55} envMapIntensity={0.5} />
          </mesh>

          {/* lid slab — local +y is "up the screen", inner face toward +z */}
          <mesh ref={lidRef} geometry={lidGeometry} position={[0, footprint.depth / 2, 0]}>
            {aluminum}
          </mesh>

          {/* the badge on the lid's outer face */}
          <mesh
            geometry={logoGeometry}
            rotation-y={Math.PI}
            position={[0, footprint.depth / 2 + spec.logo.offsetY, -lid.thickness / 2 - 0.003]}
          >
            <meshPhysicalMaterial
              color={logoColor}
              metalness={0.55}
              roughness={0.06}
              clearcoat={1}
              envMapIntensity={1.2}
              polygonOffset
              polygonOffsetFactor={-1}
            />
          </mesh>

          {/* edge-to-edge cover glass on the inner face */}
          <mesh geometry={glassGeometry} position={[0, footprint.depth / 2, lid.thickness / 2 + 0.002]}>
            <meshPhysicalMaterial color="#050608" metalness={0.1} roughness={0.09} clearcoat={1} />
          </mesh>

          {/* the live screen */}
          <DeviceScreen
            width={display.width}
            height={display.height}
            radius={[display.radius[0], display.radius[1], display.radius[2], display.radius[3]]}
            position={[0, footprint.depth / 2 + display.offsetY, lid.thickness / 2 + 0.006]}
            occlude={occlude === true ? occludeRefs : occlude === 'blending' ? 'blending' : undefined}
            {...resolveSurface(screen, {
              background: surfaceBackground,
              resolution: res,
              interactive,
              dragToRotate,
              style: surfaceStyle,
            })}
            overlay={
              notch ? (
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: px(notchDims.width),
                    height: px(notchDims.height),
                    borderRadius: `0 0 ${px(notchDims.radius)}px ${px(notchDims.radius)}px`,
                    background: '#04050a',
                    pointerEvents: 'none',
                    zIndex: 2147483647,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: px(0.045),
                      height: px(0.045),
                      borderRadius: '50%',
                      background:
                        'radial-gradient(circle at 38% 38%, #1c2536 0%, #05060a 60%, #000 100%)',
                    }}
                  />
                </div>
              ) : undefined
            }
          >
            {screen?.children}
          </DeviceScreen>
        </group>
      </group>
    </group>
  )
}
LaptopImpl.displayName = 'Laptop'

/** The device's compound slots, shared by `<Laptop>` and `<LaptopMockup>`. */
export const laptopSlots = createSlots(SCREEN_REGIONS)

export const Laptop = Object.assign(LaptopImpl, laptopSlots)
