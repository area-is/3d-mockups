import * as React from 'react'
import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'
import {
  LAPTOP_COLORWAYS,
  findColorway,
  LAPTOP_VARIANTS,
  LAPTOP_DEFAULT_VARIANT,
  LAPTOP_RESOLUTIONS,
  LAPTOP_STAGE_OFFSET_Y,
  SCREEN_REGIONS,
  type LaptopVariant,
  roundedRectShape,
} from '../../core'
import { DeviceScreen } from '../../screen/device-screen'
import { createWordmarkTexture } from '../wordmark'
import { createLogoGeometry } from '../logos'
import { UsbC, EdgeSocket, cutGeometry, stadiumCutter, holeCutter } from '../details'
import { collectSlots, createSlots, resolveSurface, type SurfaceProps } from '../../slots'

type GroupProps = ThreeElements['group']

export interface LaptopProps extends Omit<GroupProps, 'children' | 'color'>, SurfaceProps {
  /**
   * Anything you want on the laptop screen: React components, an <iframe>, a
   * <video>… Wrap in `<Laptop.Screen>` to set per-screen surface props.
   */
  children?: React.ReactNode
  /**
   * Which laptop to render, at true relative sizes: `air13` / `air15`
   * (MacBook Air 13" / 15", uniform thin slab, clean deck), `pro14` /
   * `pro16` (MacBook Pro 14" / 16", thicker body, HDMI/SDXC ports,
   * perforated speaker grilles, larger feet and a deeper notch) or `neo13`
   * (MacBook Neo 13", the entry model: a notchless square-cornered panel
   * with the camera in a deeper bezel, two USB-C ports and no MagSafe).
   */
  variant?: LaptopVariant
  /**
   * Aluminum color (lid, deck, bottom). Takes a retail colorway id from
   * `LAPTOP_COLORWAYS[variant]` (`'skyblue'`, `'starlight'`, `'midnight'`, the
   * Neo's `'citrus'` and `'indigo'`…) or any CSS color for a custom finish. A
   * colorway id wins over a CSS color of the same name - pass hex if you
   * meant the CSS one.
   */
  color?: string
  /**
   * CSS pixel width of the virtual display. Height follows the panel's
   * aspect. The default is the variant's own scaled resolution - 1280x832
   * on the Air 13 (2560x1664 at 2x), 1204x753 on the Neo - so desktop
   * layouts and breakpoints behave like on the real machine. Style your
   * content with % / flex.
   */
  resolution?: number
  /** Lid angle in degrees between deck and screen (90 = upright). */
  openAngle?: number
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
 * Keyboard: the 78-key US Magic Keyboard, measured on Apple's top-down
 * renders of all five models (scaled by each chassis's official width, and
 * agreeing on pitch to 0.3%): 19.0 mm across, 18.5 mm row to row, 1.5 mm
 * between caps (2.1 mm between their top faces), six FULL-height rows,
 * half-height inverted-T arrows. The keys sit in a well machined 1.2 mm into
 * the deck, their tops just under its surface - so in a side view they never
 * break the deck line, and at an angle about a millimetre of cap side shows
 * above the well's floor.
 * ---------------------------------------------------------------------- */

/** 2.75 mm between the well's wall and the caps, on every side. */
const KEY_PAD = 0.038
/** 1.5 mm between neighbouring caps. */
const KEY_GAP = 0.0207
/** 2 mm keycap corner radius - the same on every cap, from 1u to the space bar. */
const CAP_RADIUS = 0.028
/** The cap's rolled edge, 0.3 mm: what takes the top face in to 2.1 mm apart. */
const CAP_BEVEL = 0.004
/** How deep the well is machined into the deck (1.2 mm), and its corner radius (4.9 mm). */
const WELL_DEPTH = 0.0166
const WELL_RADIUS = 0.068
/** A cap stands from just off the well's floor to 0.1 mm under the deck. */
const CAP_BOTTOM_Y = 0.002
const CAP_TOP_Y = WELL_DEPTH - 0.0015

type KeyIcon =
  | 'sunlo' | 'sunhi' | 'mission' | 'spot' | 'mic' | 'moon'
  | 'rew' | 'play' | 'fwd' | 'mute' | 'voldn' | 'volup'
  | 'globe' | 'cmd' | 'opt'
  | 'tab' | 'caps' | 'shift' | 'delete' | 'return'

type KeyLegend =
  /** Centered glyph (letters). `nub` prints the home-row bar under F / J. */
  | { t: 'txt'; s: string; nub?: boolean }
  /** Shifted symbol stacked over the base symbol (number / punctuation keys). */
  | { t: 'dual'; a: string; b: string }
  /** Word in a bottom corner (esc, tab, return…). `dot` = caps-lock light. */
  | { t: 'word'; s: string; align: 'bl' | 'br'; dot?: boolean; g?: KeyIcon }
  /**
   * Modifier: word along the bottom with the symbol in the TOP-OUTER corner -
   * top-left on the left-hand keys, mirrored to top-right on the right-hand
   * command/option (measured, ~5.2 mm in / 4.6 mm down to symbol center).
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
 * The US layout in standard key units (every row sums to 14.5u). The editing
 * keys (tab, caps lock, shift, delete, return) carry words on the Pro and
 * symbols - ⇥ ⇪ ⇧ ⌫ ↵ - on the M5 Air and the Neo (`symbols`); esc and the
 * modifiers keep their words on all of them. Coordinates are keyboard-local,
 * +z toward the user.
 */
function buildKeyboardLayout(keyboard: { width: number; depth: number }, symbols = false) {
  const usable = keyboard.width - KEY_PAD * 2
  const pitch = (usable + KEY_GAP) / 14.5
  const pitchZ = (keyboard.depth - KEY_PAD * 2 + KEY_GAP) / 6
  const capD = pitchZ - KEY_GAP

  const dual = (a: string, b: string): KeyLegend => ({ t: 'dual', a, b })
  const txt = (s: string, nub?: boolean): KeyLegend => ({ t: 'txt', s, nub })
  const glyphs: Record<string, KeyIcon> = { tab: 'tab', 'caps lock': 'caps', shift: 'shift', delete: 'delete', return: 'return' }
  const edit = (s: string, align: 'bl' | 'br', dot?: boolean): KeyLegend => ({
    t: 'word',
    s,
    align,
    dot,
    g: symbols ? glyphs[s] : undefined,
  })

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
      [1, dual('+', '=')], [1.5, edit('delete', 'br')],
    ],
    [
      [1.5, edit('tab', 'bl')],
      ...'QWERTYUIOP'.split('').map((s) => [1, txt(s)] as [number, KeyLegend]),
      [1, dual('{', '[')], [1, dual('}', ']')], [1, dual('|', '\\')],
    ],
    [
      [1.75, edit('caps lock', 'bl', true)],
      [1, txt('A')], [1, txt('S')], [1, txt('D')], [1, txt('F', true)], [1, txt('G')],
      [1, txt('H')], [1, txt('J', true)], [1, txt('K')], [1, txt('L')],
      [1, dual(':', ';')], [1, dual('"', "'")],
      [1.75, edit('return', 'br')],
    ],
    [
      [2.25, edit('shift', 'bl')],
      ...'ZXCVBNM'.split('').map((s) => [1, txt(s)] as [number, KeyLegend]),
      [1, dual('<', ',')], [1, dual('>', '.')], [1, dual('?', '/')],
      [2.25, edit('shift', 'br')],
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
  let z = -keyboard.depth / 2 + KEY_PAD
  for (const [rowIndex, row] of ROWS.entries()) {
    let x = -usable / 2
    for (const [u, legend] of row) {
      keys.push({ x: x + (u * pitch - KEY_GAP) / 2, z: z + capD / 2, w: u * pitch - KEY_GAP, d: capD, legend })
      x += u * pitch
    }
    if (rowIndex === ROWS.length - 1) {
      // inverted-T arrows in the remaining 3u: half-height caps, ◀ ▼ ▶ on the
      // bottom half, ▲ stacked above ▼ with only a hairline (0.4 mm) between.
      const half = (capD - 0.0055) / 2
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
 * Monochrome legend icons drawn as canvas paths - font glyphs for ⌘ ⇧ ⌫ etc.
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
  const roundRect = (cx: number, cy: number, w: number, h: number, r: number) => {
    ctx.beginPath()
    ctx.roundRect(cx - w / 2, cy - h / 2, w, h, r)
    ctx.stroke()
  }
  /**
   * F10-F12 share one stroked speaker outline: a shallow box on the left
   * opening into a cone that flares right. Measured off Apple's own art at
   * 36 x 53 px - so 1.47x as tall as wide, with the box only 0.30 of the
   * cone's height. `SPK` is the speaker's width; everything follows from it.
   */
  const SPK = 0.523 * s
  const speaker = (cx: number) => {
    const box = 0.222 * SPK
    const mouth = 0.736 * SPK
    poly([
      [cx - 0.46 * SPK, -box],
      [cx + 0.03 * SPK, -box],
      [cx + 0.46 * SPK, -mouth],
      [cx + 0.46 * SPK, mouth],
      [cx + 0.03 * SPK, box],
      [cx - 0.46 * SPK, box],
    ])
  }
  /**
   * The waves to its right: arcs struck from a point 0.34 speaker-widths
   * right of the speaker's center, at 0.635 / 0.985 / 1.337 of that width.
   * F11 shows the first alone, F12 all three.
   */
  const waves = (cx: number, n: number) => {
    const at = cx + 0.34 * SPK
    for (const r of [0.635, 0.985, 1.337].slice(0, n)) {
      ctx.beginPath()
      ctx.arc(at, 0, r * SPK, -0.197 * Math.PI, 0.197 * Math.PI)
      ctx.stroke()
    }
  }
  const rays = (r0: number, r1: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      line(Math.cos(a) * r0, Math.sin(a) * r0, Math.cos(a) * r1, Math.sin(a) * r1)
    }
  }
  switch (icon) {
    // F1 / F2 are the SAME sun at the same size with the same 28 px disc, and
    // differ ONLY in how far the eight rays reach. (They used to differ in
    // overall size by a third, which is not what the keys do.)
    case 'sunlo':
      circle(0, 0, 0.201 * s)
      rays(0.294 * s, 0.394 * s, 8)
      break
    case 'sunhi':
      circle(0, 0, 0.2 * s)
      rays(0.265 * s, 0.423 * s, 8)
      break
    case 'mission': {
      // Mission Control is TWO stacked panes on the LEFT beside one tall pane
      // on the RIGHT - this had it mirrored, with the tall pane left and two
      // equal panes right. Apple's three are all different sizes: the
      // upper-left is widest, the lower-left is smaller and steps right, and
      // the right-hand one is the tall one. It is also the widest glyph in the
      // row (1.5x as wide as tall), which is why it gets more width than `s`.
      const r = 0.05 * s
      roundRect(-0.337 * s, -0.222 * s, 0.546 * s, 0.33 * s, r)
      roundRect(-0.251 * s, 0.251 * s, 0.488 * s, 0.273 * s, r)
      roundRect(0.388 * s, 0.007 * s, 0.445 * s, 0.645 * s, r)
      break
    }
    case 'spot':
      // A big lens with a stub of a handle, not the small lens on a long
      // handle this drew: Apple's lens is 0.72 of the glyph across.
      circle(-0.073 * s, -0.08 * s, 0.302 * s)
      line(0.141 * s, 0.134 * s, 0.395 * s, 0.395 * s)
      break
    case 'mic': {
      // Dictation: capsule, U-shaped cradle, stem, and the FOOT that was
      // missing entirely. The glyph is 1.45x as tall as wide; `W` is its
      // width and each step down the stack is a fraction of it.
      const W = 0.574 * s
      const y = (u: number) => -0.416 * s + u * W
      ctx.beginPath()
      ctx.roundRect(-0.0935 * s, y(0.075), 0.187 * s, 0.402 * s, 0.0935 * s)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(0, y(0.6), 0.244 * s, 0, Math.PI)
      ctx.stroke()
      line(0, y(1.1), 0, y(1.32))
      line(-0.158 * s, y(1.36), 0.158 * s, y(1.36))
      break
    }
    case 'moon': {
      // Do Not Disturb is an OUTLINED crescent, not the solid one this drew:
      // the boundary between a disc and a second, larger disc overlapping it
      // from the upper right. Both circles were fitted to Apple's art to
      // within 3% of the crescent's area.
      const R = 0.39 * s
      ctx.beginPath()
      // The arcs meet at the horns. These sweep directions are the pair that
      // keeps the outer arc clear of the bite and the inner arc inside it.
      ctx.arc(0, 0, R, 0.1868, 4.5942, false)
      ctx.arc(0.47 * R, -0.439 * R, 0.808 * R, 3.8972, 0.8834, true)
      ctx.closePath()
      ctx.stroke()
      break
    }
    // F7-F9 are hollow outlined triangles, a shared 0.56s tall
    case 'rew':
      poly([[0, -0.28 * s], [-0.53 * s, 0], [0, 0.28 * s]])
      poly([[0.53 * s, -0.28 * s], [0, 0], [0.53 * s, 0.28 * s]])
      break
    case 'play':
      poly([[-0.466 * s, -0.28 * s], [0.021 * s, 0], [-0.466 * s, 0.28 * s]])
      line(0.193 * s, -0.301 * s, 0.193 * s, 0.301 * s)
      line(0.466 * s, -0.301 * s, 0.466 * s, 0.301 * s)
      break
    case 'fwd':
      poly([[-0.53 * s, -0.28 * s], [0, 0], [-0.53 * s, 0.28 * s]])
      poly([[0, -0.28 * s], [0.53 * s, 0], [0, 0.28 * s]])
      break
    case 'mute':
      // The bare speaker struck through corner to corner. Apple's slash falls
      // from the TOP-LEFT to the bottom right; this used to rise the other way.
      speaker(-0.074 * s)
      line(-0.42 * s, -0.42 * s, 0.42 * s, 0.42 * s)
      break
    case 'voldn':
      speaker(-0.121 * s)
      waves(-0.121 * s, 1)
      break
    case 'volup':
      speaker(-0.309 * s)
      waves(-0.309 * s, 3)
      break
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
    // The editing keys' symbols (M5 Air, Neo), outlined like the rest.
    case 'shift':
      poly([[0, -0.42 * s], [0.4 * s, 0], [0.17 * s, 0], [0.17 * s, 0.38 * s], [-0.17 * s, 0.38 * s], [-0.17 * s, 0], [-0.4 * s, 0]])
      break
    case 'caps':
      poly([[0, -0.44 * s], [0.4 * s, -0.06 * s], [0.17 * s, -0.06 * s], [0.17 * s, 0.2 * s], [-0.17 * s, 0.2 * s], [-0.17 * s, -0.06 * s], [-0.4 * s, -0.06 * s]])
      ctx.strokeRect(-0.17 * s, 0.3 * s, 0.34 * s, 0.12 * s)
      break
    case 'tab':
      line(-0.42 * s, 0, 0.3 * s, 0)
      poly([[0.1 * s, -0.2 * s], [0.3 * s, 0], [0.1 * s, 0.2 * s]], false, false)
      line(0.42 * s, -0.24 * s, 0.42 * s, 0.24 * s)
      break
    case 'delete':
      poly([[-0.46 * s, 0], [-0.2 * s, -0.3 * s], [0.46 * s, -0.3 * s], [0.46 * s, 0.3 * s], [-0.2 * s, 0.3 * s]])
      line(0.02 * s, -0.12 * s, 0.26 * s, 0.12 * s)
      line(0.02 * s, 0.12 * s, 0.26 * s, -0.12 * s)
      break
    case 'return':
      poly([[0.38 * s, -0.36 * s], [0.38 * s, 0.12 * s], [-0.36 * s, 0.12 * s]], false, false)
      poly([[-0.16 * s, -0.08 * s], [-0.36 * s, 0.12 * s], [-0.16 * s, 0.32 * s]], false, false)
      break
  }
  ctx.restore()
}

/**
 * One keycap, extruded at its true size: a unit cap scaled to width would
 * stretch its corner radius and edge bevel with it, so the 5u space bar would
 * end up with 10 mm elliptical corners against the letters' 2 mm ones. Caps of
 * the same size share one geometry and draw as a single instanced mesh.
 */
function keycapGeometry(width: number, depth: number) {
  const bevel = CAP_BEVEL
  const g = new THREE.ExtrudeGeometry(roundedRectShape(width - bevel * 2, depth - bevel * 2, CAP_RADIUS - bevel), {
    depth: CAP_TOP_Y - CAP_BOTTOM_Y - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 6,
  })
  g.rotateX(-Math.PI / 2)
  g.translate(0, CAP_BOTTOM_Y + bevel, 0)
  return g
}

/**
 * The raised home-row markers on F and J: a stadium bar standing proud of the
 * cap, the same molding as the cap itself rather than print. Photo-measured
 * off a straight-on Magic Keyboard - 0.237 cap widths long, 0.053 cap depths
 * across, its center 0.816 of the way down the cap (3.9 x 0.9 mm, 5.1 mm below
 * the cap's center on a 16 mm cap), standing ~0.2 mm off the face.
 */
function HomeRowNubs({ keys, color }: { keys: KeyDef[]; color: string }) {
  const geometry = React.useMemo(() => {
    if (!keys.length) return null
    const width = keys[0]!.w * 0.237
    const depth = keys[0]!.d * 0.053
    const bevel = 0.001
    const g = new THREE.ExtrudeGeometry(
      roundedRectShape(width - bevel * 2, depth - bevel * 2, depth / 2 - bevel),
      { depth: 0.003, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 8 }
    )
    g.rotateX(-Math.PI / 2)
    return g
  }, [keys])
  React.useEffect(() => () => geometry?.dispose(), [geometry])
  if (!geometry) return null
  return (
    <>
      {keys.map((key, i) => (
        <mesh key={i} geometry={geometry} position={[key.x, CAP_TOP_Y, key.z + key.d * 0.316]}>
          <KeycapMaterial color={color} />
        </mesh>
      ))}
    </>
  )
}

/**
 * The caps' finish: satin, not matte. A dark albedo under a soft sheen is
 * what keeps the Air's and Pro's caps near-black (#242426-#2f3034 in Apple's
 * renders) under a bright studio - a rough, flat black catches so much
 * diffuse light off the environment that it reads mid-grey.
 */
function KeycapMaterial({ color }: { color: string }) {
  return <meshPhysicalMaterial color={color} metalness={0} roughness={0.55} specularIntensity={0.3} envMapIntensity={0.45} />
}

/** Every cap of one footprint, in one draw call. */
function CapCluster({
  width,
  depth,
  keys,
  color,
}: {
  width: number
  depth: number
  keys: KeyDef[]
  color: string
}) {
  const meshRef = React.useRef<THREE.InstancedMesh>(null!)
  const geometry = React.useMemo(() => keycapGeometry(width, depth), [width, depth])
  React.useEffect(() => () => geometry.dispose(), [geometry])
  React.useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    keys.forEach((k, i) => meshRef.current.setMatrixAt(i, m.makeTranslation(k.x, 0, k.z)))
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [keys])
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, keys.length]} geometry={geometry}>
      <KeycapMaterial color={color} />
    </instancedMesh>
  )
}

/**
 * The Magic Keyboard: rounded keycaps grouped by footprint into a handful of
 * instanced meshes, a canvas-painted legends layer just above the caps
 * (letters, stacked shift symbols, corner words, modifier glyphs, hand-drawn
 * media icons), the raised F / J home-row markers, and the Touch ID sensor on
 * the top-right key.
 */
function Keys({
  keyboard,
  capColor = '#0c0d10',
  ink = 'rgba(228, 231, 240, 0.85)',
  symbols = false,
  sensorRing = '#6f7278',
}: {
  keyboard: { width: number; depth: number; offsetZ: number }
  /** Keycap colour - the Air and Pro's black, or the Neo's colour-matched caps. */
  capColor?: string
  /** Legend colour: light on black caps, dark on colour-matched ones. */
  ink?: string
  /** Symbols rather than words on the editing keys (see `buildKeyboardLayout`). */
  symbols?: boolean
  /** Touch ID's metal ring. */
  sensorRing?: string
}) {
  const layout = React.useMemo(() => buildKeyboardLayout(keyboard, symbols), [keyboard, symbols])

  // Caps bucketed by footprint - six widths plus the half-height arrows.
  const clusters = React.useMemo(() => {
    const byFootprint = new Map<string, { width: number; depth: number; keys: KeyDef[] }>()
    for (const key of layout.keys) {
      const id = `${key.w.toFixed(5)}x${key.d.toFixed(5)}`
      let cluster = byFootprint.get(id)
      if (!cluster) byFootprint.set(id, (cluster = { width: key.w, depth: key.d, keys: [] }))
      cluster.keys.push(key)
    }
    return [...byFootprint.entries()]
  }, [layout])

  // All legends painted once into a texture spanning the keyboard well.
  const legendsTexture = React.useMemo(() => {
    if (typeof document === 'undefined') return null
    const scale = 2048 / keyboard.width // canvas px per world unit
    const u = (units: number) => units * scale
    const canvas = document.createElement('canvas')
    canvas.width = 2048
    canvas.height = Math.round(keyboard.depth * scale)
    const ctx = canvas.getContext('2d')!
    const INK = ink
    ctx.fillStyle = INK
    ctx.strokeStyle = INK
    // Apple laser-etches these legends in a light-to-regular weight; 400 keeps
    // the hairline look on real keycaps rather than the chunkier UI-label 500.
    const font = (size: number, weight = 400) =>
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
      // Corner anchors measured from the printed legends: words start 3.1 mm in
      // from a left edge and end 3.1 mm from a right one, baseline 3.1 mm up.
      const blX = px - hw + u(0.043)
      const brX = px + hw - u(0.043)
      const cornerY = py + hd - u(0.043)
      const dot = () => {
        // caps-lock light: Ø1.25 mm, top-left (3.2 mm / 2.9 mm insets)
        ctx.beginPath()
        ctx.arc(px - hw + u(0.052), py - hd + u(0.048), u(0.0086), 0, Math.PI * 2)
        ctx.fill()
      }
      const legend = key.legend
      switch (legend.t) {
        case 'txt':
          // letters: 4.3 mm cap height, centered
          font(u(0.082))
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(legend.s, px, py)
          // the F / J home-row markers are RAISED bars, not print - real
          // geometry standing on those two caps (see HomeRowNubs).
          break
        case 'dual':
          // shifted symbol 3.1 mm tall, 3.4 mm down from the cap's top edge;
          // the base symbol 4.3 mm tall, ending 3.2 mm above its bottom
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          font(u(0.059))
          ctx.fillText(legend.a, px, py - u(0.049))
          font(u(0.082))
          ctx.fillText(legend.b, px, py + u(0.0435))
          break
        case 'word':
          if (legend.g) {
            // a ~3.6 mm symbol in the same corner the word would take
            const g = u(0.05)
            drawKeyIcon(ctx, legend.g, legend.align === 'bl' ? blX + g / 2 : brX - g / 2, cornerY - g / 2 + u(0.004), g)
          } else {
            // 2.2 mm x-height
            font(u(0.057))
            ctx.textAlign = legend.align === 'bl' ? 'left' : 'right'
            ctx.textBaseline = 'alphabetic'
            ctx.fillText(legend.s, legend.align === 'bl' ? blX : brX, cornerY)
          }
          if (legend.dot) dot()
          break
        case 'mod': {
          // symbol in the top-outer corner: center 5.2 mm in from the outer
          // edge, 4.6 mm down from the cap top (mirrored on right-hand keys)
          const sx = legend.side === 'l' ? px - hw + u(0.072) : px + hw - u(0.072)
          const sy = py - hd + u(0.063)
          if (legend.c) {
            font(u(0.062), 500)
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(legend.c, sx, sy)
          } else if (legend.i) {
            drawKeyIcon(ctx, legend.i, sx, sy, legend.i === 'cmd' ? u(0.056) : u(0.06))
          }
          // the word under it, in the same outer corner (the M5 generation's
          // alignment - the M4 Pro set them toward the space bar)
          font(u(0.052))
          ctx.textAlign = legend.side === 'l' ? 'left' : 'right'
          ctx.textBaseline = 'alphabetic'
          ctx.fillText(legend.s, legend.side === 'l' ? blX : brX, cornerY)
          break
        }
        case 'fn':
          // globe Ø3.9 mm bottom-left, "fn" bottom-right (measured)
          drawKeyIcon(ctx, 'globe', px - hw + u(0.07), py + hd - u(0.0666), u(0.0754))
          font(u(0.052))
          ctx.textAlign = 'right'
          ctx.textBaseline = 'alphabetic'
          ctx.fillText('fn', brX, cornerY)
          break
        case 'fk':
          // media icon ~4 mm (the glyphs run 15-29% of the cap width on a
          // retail unit) centered 2.4 mm above the cap's middle, F-label
          // 2.3 mm font centered 4.3 mm below it
          drawKeyIcon(ctx, legend.i, px, py - u(0.0325), u(0.055))
          // "F1": 2.1 mm cap height
          font(u(0.04))
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
  }, [layout, keyboard, ink])
  React.useEffect(() => () => legendsTexture?.dispose(), [legendsTexture])

  // Touch ID's ring is Ø9.5 mm, concentric with its cap.
  const sensorR = 0.0656

  return (
    <>
      {clusters.map(([id, cluster]) => (
        <CapCluster key={id} width={cluster.width} depth={cluster.depth} keys={cluster.keys} color={capColor} />
      ))}
      {/* the raised F / J home-row markers */}
      <HomeRowNubs keys={layout.keys.filter((k) => k.legend.t === 'txt' && k.legend.nub)} color={capColor} />
      {/* printed legends, floating just above the caps */}
      {legendsTexture && (
        <mesh position={[0, CAP_TOP_Y + 0.0005, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[keyboard.width, keyboard.depth]} />
          <meshBasicMaterial map={legendsTexture} transparent toneMapped={false} depthWrite={false} />
        </mesh>
      )}
      {/* Touch ID: a flush sapphire disc, a shade glossier than the cap, in a
          thin bright metal ring */}
      <mesh position={[layout.touchId.x, CAP_TOP_Y + 0.0003, layout.touchId.z]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[sensorR, 40]} />
        <meshPhysicalMaterial color={capColor} metalness={0} roughness={0.35} specularIntensity={0.35} envMapIntensity={0.45} />
      </mesh>
      <mesh position={[layout.touchId.x, CAP_TOP_Y + 0.0005, layout.touchId.z]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[sensorR - 0.003, sensorR, 48]} />
        <meshPhysicalMaterial color={sensorRing} metalness={0.8} roughness={0.3} envMapIntensity={0.8} />
      </mesh>
    </>
  )
}

/**
 * A procedurally built Apple MacBook: rounded unibody base with a
 * Magic-Keyboard deck and Force Touch trackpad, and a thin hinged lid whose
 * display carries your live content - notched on the Airs and Pros, set in a
 * deeper camera bezel on the Neo. No 3D asset files - everything is generated
 * from geometry at runtime.
 *
 * The opened pose (deck + raised lid) is centered on the group origin, the
 * pose the stage camera and shadow framing are tuned for.
 *
 * Must be rendered inside a react-three-fiber `<Canvas>` (or `<MockupCanvas>`).
 */
function LaptopImpl({
  children,
  variant = LAPTOP_DEFAULT_VARIANT,
  color: colorProp,
  surfaceBackground = '#000000',
  resolution,
  openAngle,
  surfaceStyle,
  ...groupProps
}: LaptopProps) {
  const screen = collectSlots(children, SCREEN_REGIONS).screen
  const spec = LAPTOP_VARIANTS[variant]
  // `color` doubles as the colorway selector: a catalog id resolves to
  // that retail finish, anything else is passed through as a raw CSS
  // color. Ids win over same-named CSS colors - pass hex for those.
  const retail = findColorway(LAPTOP_COLORWAYS[variant], colorProp)
  const color = retail?.color ?? colorProp ?? '#e3e4e6'
  // The Neo's caps are the aluminium's own colour, a shade lighter (Apple's
  // launch photography), with legends etched dark; the Air's and Pro's are
  // black with light legends.
  const matchedCaps = spec.keycaps === 'matched'
  const capColor = React.useMemo(
    () => (matchedCaps ? `#${new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.14).getHexString()}` : '#0c0d10'),
    [matchedCaps, color]
  )
  const legendInk = matchedCaps ? 'rgba(46, 48, 56, 0.82)' : 'rgba(228, 231, 240, 0.85)'
  const { footprint, base, lid, display, notch: notchDims, bezelCamera, keyboard, trackpad } = spec
  // Default scaled desktops (native/2): 1280x832 / 1440x932 on the Airs,
  // 1512x982 / 1728x1117 on the Pros, 1204x753 on the Neo - from core, so the
  // rendered grid and the measured one cannot disagree.
  const res = resolution ?? LAPTOP_RESOLUTIONS[variant]
  const lidAngle = openAngle ?? spec.openAngle

  // Base chassis: the slab is baked into its resting orientation (footprint in
  // XZ) so every side-wall port opening can be machined out of it in place -
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
    // the crescent recess out of the front edge - deepest at the top surface,
    // fading to nothing down the front face, rounded ends. The cut interior
    // stays aluminum, exactly like the milled original.
    const scoop = spec.scoop
    const capsule = new THREE.CapsuleGeometry(scoop.radius, scoop.width - scoop.radius * 2, 4, 20)
    capsule.rotateZ(Math.PI / 2)
    capsule.translate(0, base.thickness / 2, footprint.depth / 2 + scoop.radius - scoop.bite)
    cutters.push(capsule)
    // The keyboard well, milled into the deck: its wall is the band that
    // frames the keys in every product shot, bright along the back.
    const well = new THREE.ExtrudeGeometry(roundedRectShape(keyboard.width, keyboard.depth, WELL_RADIUS), {
      depth: WELL_DEPTH + 0.05,
      bevelEnabled: false,
      curveSegments: 8,
    })
    well.rotateX(-Math.PI / 2)
    well.translate(0, base.thickness / 2 - WELL_DEPTH, keyboard.offsetZ)
    cutters.push(well)
    return cutGeometry(g, cutters)
  }, [footprint, base, spec.ports, spec.scoop, keyboard])
  React.useEffect(() => () => baseGeometry.dispose(), [baseGeometry])
  const lidGeometry = useSlabGeometry(footprint.width, footprint.depth, footprint.radius, lid.thickness, lid.bevel)

  // The well's floor: black on the Pro (its anodized tray), the deck's own
  // aluminium on the Air and Neo - in the shade of the keys, which the stage
  // lighting will not cast at this scale, so it is darkened a little.
  const wellFloorGeometry = React.useMemo(
    () => new THREE.ShapeGeometry(roundedRectShape(keyboard.width, keyboard.depth, WELL_RADIUS), 12),
    [keyboard]
  )
  const wellFloorColor = React.useMemo(
    () => (keyboard.tray ? '#131416' : `#${new THREE.Color(color).lerp(new THREE.Color('#000000'), 0.2).getHexString()}`),
    [keyboard.tray, color]
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
      wellFloorGeometry.dispose()
      trackpadGeometry.dispose()
      trackpadRimGeometry.dispose()
      bottomPlateGeometry.dispose()
      glassGeometry.dispose()
    }
  }, [wellFloorGeometry, trackpadGeometry, trackpadRimGeometry, bottomPlateGeometry, glassGeometry])

  // Speaker grille: each strip is a ~1.0 x 0.93 mm grid of
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

  // Anodized aluminum needs a strong diffuse term - at high metalness any face
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
          <mesh geometry={baseGeometry}>
            {aluminum}
          </mesh>

          {/* the well's floor: the Pro's black tray, bare aluminium on the Air */}
          <mesh
            geometry={wellFloorGeometry}
            rotation-x={-Math.PI / 2}
            position={[0, deckY - WELL_DEPTH + 0.0003, keyboard.offsetZ]}
          >
            <meshPhysicalMaterial
              color={wellFloorColor}
              metalness={0.2}
              roughness={0.6}
              envMapIntensity={0.55}
            />
          </mesh>
          {/* the keys, standing on the well's floor with their tops just
              under the deck */}
          <group position={[0, deckY - WELL_DEPTH, keyboard.offsetZ]}>
            <Keys
              keyboard={keyboard}
              capColor={capColor}
              ink={legendInk}
              symbols={spec.legends === 'symbols'}
              sensorRing={matchedCaps ? color : undefined}
            />
          </group>

          {/* trackpad: flush glass with a hairline seam around it. Same finish as
              the deck - a glossier material here reads as a bright sticker */}
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
              grid painted over the bare deck - aluminum shows between holes */}
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

          {/* port interiors - the openings are real cavities machined from the
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

          {/* lid slab - local +y is "up the screen", inner face toward +z */}
          <mesh geometry={lidGeometry} position={[0, footprint.depth / 2, 0]}>
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

          {/* the notchless Neo's camera, set in the bezel above the panel: a
              dark ring around the lens, sitting on the cover glass */}
          {bezelCamera && (
            <group
              position={[
                0,
                footprint.depth / 2 + display.offsetY + display.height / 2 + bezelCamera.offsetY,
                lid.thickness / 2 + 0.0035,
              ]}
            >
              <mesh>
                <ringGeometry args={[bezelCamera.radius * 0.78, bezelCamera.radius, 32]} />
                <meshPhysicalMaterial color="#23262d" metalness={0.5} roughness={0.35} />
              </mesh>
              <mesh position-z={0.0004}>
                <circleGeometry args={[bezelCamera.radius * 0.78, 32]} />
                <meshPhysicalMaterial
                  color="#0a1220"
                  metalness={0.2}
                  roughness={0.08}
                  clearcoat={1}
                  clearcoatRoughness={0.05}
                />
              </mesh>
            </group>
          )}

          {/* the live screen */}
          <DeviceScreen
            width={display.width}
            height={display.height}
            radius={[display.radius[0], display.radius[1], display.radius[2], display.radius[3]]}
            position={[0, footprint.depth / 2 + display.offsetY, lid.thickness / 2 + 0.006]}
            {...resolveSurface(screen, {
              surfaceBackground,
              resolution: res,
              surfaceStyle,
            })}
            // The camera notch is part of the hardware, so it is always drawn:
            // it eats the same strip of your layout here that it eats on the
            // real panel, which is most of the point of looking at a mockup.
            // (The Neo has none - its camera is in the bezel above.)
            overlay={
              notchDims && (
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
              )
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
