/**
 * Watch device dimensions - the Apple Watch Series 11, Series 12 and Ultra 4,
 * and the Samsung Galaxy Watch 8, Watch 9 and Watch Ultra 2.
 *
 * All variants share one world scale (~17.7 mm per unit) so they keep true
 * relative sizes side by side:
 *
 * - Apple Watch Series 11, 46 mm: 46 x 39 x 9.7 mm squircle case, ~1.96"
 *   416x496 wide-angle OLED with heavily rounded corners. Right edge, top to
 *   bottom (per Apple's product photography): finely knurled Digital Crown
 *   (~7 mm gear-toothed barrel with a flat end cap, protruding ~2 mm), a
 *   single microphone hole, then the elongated flush side button sitting in a
 *   machined recess below center. Left edge: two perforated speaker slots,
 *   one above the other. The Solo Loop slides into dark band slots in the
 *   case's flat top/bottom edges, offset toward the case back.
 * - Apple Watch Series 12, 46 mm: the Series 11 case to the published
 *   millimetre (46 x 40 x 9.7 mm, the same 416x496 panel); the generation is
 *   the S11 chip, the sensors and a ceramic case option, none of it a change
 *   to the exterior this models.
 * - Apple Watch Ultra 4, 49 mm: 49 x 44 x 12 mm titanium case with tighter
 *   corners than the squircle Series, barrel flanks under a flat raised lip
 *   holding the sapphire crystal over the 422x514 panel, a raised crown
 *   guard on the right flank enclosing a larger, coarsely lobed Digital Crown
 *   and the side button, the orange Action button on the left flank between
 *   the speaker grille and the siren port, and a shallow ceramic sensor dome
 *   on the back. The same case as the Ultra 3.
 * - Galaxy Watch 8, 44 mm: 46.0 x 43.7 x 8.6 mm "cushion" case (squircle
 *   aluminum armor with a flat top) carrying a RAISED round dial - the fully
 *   round 1.47" 480x480 sAMOLED sits on a slightly protruding black puck, so
 *   the aluminum cushion stays visible around it (unlike the Apple's
 *   edge-to-edge crystal). Right edge (per GSMArena's review macros): two
 *   raised pill keys with chamfered edges straddling a tiny microphone hole
 *   at center. Left edge: two short machined speaker slots in a vertical
 *   run. The Dynamic Lug band is nearly case-wide where it attaches and
 *   tapers around the wrist.
 *
 * The wristband is worn on an invisible wrist directly behind the case (a
 * ~58 x 45 mm oval, the wrist a 46 mm watch is sold for). The Series wear the
 * Solo Loop: one seamless stretchy band with no closure, no holes and no
 * hardware, flaring into the lug slots at both ends. The Ultra wears the
 * ridged Ocean Band and the Galaxy watches a sport band, both two straps
 * closing with a buckle and keeper on the underside.
 *
 * This is pure, renderer-agnostic data: the 3D model consumes it today and a
 * future 2D (CSS/SVG) renderer can consume the same numbers.
 */

import { wristLoopArcLength, type WristLoop } from '../../geometry/strap'
import type { MockupFraming, MockupMetrics } from '../../regions'

export interface WatchSpec {
  /** Per-family construction: Apple squircle+crown, or Galaxy cushion+round display. */
  style: 'apple' | 'galaxy'
  /** Case. `radius` is the corner radius, `bevel` the edge rounding. */
  body: { width: number; height: number; depth: number; radius: number; bevel: number }
  /**
   * A flat raised rim the crystal sits in, standing on top of the case (the
   * Ultra's titanium lip): `height` of the case's `depth` is the lip, the rest
   * the barrel-sided body under it, and `inset` how far the lip's outline
   * stands in from the body's widest line.
   */
  lip?: { height: number; inset: number }
  /** Cover crystal. For the round Galaxy display width==height and radius==width/2. */
  glass: { width: number; height: number; radius: number }
  /** Raised round dial puck under the crystal (Galaxy cushion design only). */
  dial?: { radius: number; height: number }
  /** Active display area. Content you pass as children maps onto this rect. */
  display: { width: number; height: number; radius: number }
  /** Default CSS px width of the virtual display (the logical pt/dp grid). */
  resolution: number
  /**
   * Digital Crown on the right edge (Apple): a knurled gear-toothed barrel.
   * `thickness` is the barrel length along its axis, `proud` how far the
   * outer face protrudes past the case wall, `teeth`/`toothDepth` the
   * machined knurling crevices.
   */
  /**
   * `ring` paints a ring of that colour on the crown's face (the Ultra's
   * International Orange). `lobed` cuts a score of rounded lobes instead of
   * fine knurling - the Ultra crown's coarse grip.
   */
  crown?: {
    y: number
    radius: number
    thickness: number
    proud: number
    teeth: number
    toothDepth: number
    ring?: string
    lobed?: boolean
  }
  /**
   * Keys on the right edge: Apple's flush side button (tiny `proud`, reads as
   * a pill outline in a recess), Galaxy's two raised chamfered keys, the
   * Watch Ultra 2's three-key run. `length` runs along the edge (y), `width`
   * across the case depth (z), `proud` is the protrusion past the case wall.
   * `color` is for a key with its own finish whatever the case colorway -
   * the Ultra 2's orange Quick Button is hardware, not a colorway - and such a
   * key is rendered as a coloured finish rather than bare metal. `edge`
   * puts a key on the left flank instead (the Apple Watch Ultra's Action
   * button); it defaults to the right.
   */
  buttons: {
    y: number
    length: number
    width: number
    proud: number
    color?: string
    edge?: 'left' | 'right'
  }[]
  /**
   * The raised titanium plate on the right flank that shields the crown and
   * side button (Apple Watch Ultra): a stadium - round-ended - `length` along
   * the edge and `thickness` across the case depth, standing `proud` of the
   * case wall with its edges rounded by `radius`. The side button sits in a
   * pocket cut into it. The crown and side button must stand prouder than it
   * to show.
   */
  crownGuard?: { y: number; length: number; proud: number; thickness: number; radius: number }
  /** Microphone hole drilled into the right edge. */
  mic?: { y: number; radius: number; z?: number }
  /**
   * Openings in the left edge: machined speaker slots (the Series' and the
   * Galaxy's two), or - with `length` equal to `height` - round ports: the
   * Ultra's hex-packed speaker grille, its siren, and its microphone.
   */
  speaker: { y: number; length: number; height: number; z?: number }[]
  /**
   * Dark band-slot channel machined into the flat top/bottom case edges that
   * the strap slides into (Apple). `width`/`height` are the channel's lateral
   * size, `z` its center across the case depth (toward the back on the real
   * case).
   */
  bandSlot?: { width: number; height: number; z: number }
  /**
   * The case back's sensor cluster. Both families put an optical heart sensor
   * behind a round crystal in the middle of the back, ringed by the metal
   * electrode the ECG reads from - but they mount it differently: Apple sinks
   * the crystal flush into a back plate that matches the case colour (so the
   * watch reads as one piece of metal), while Samsung raises the whole
   * BioActive puck proud of the aluminium cushion.
   */
  back: {
    /** Crystal / puck radius. */
    radius: number
    /** How far it stands proud of the case back - negative sinks it in. */
    raise: number
    /**
     * A raised puck that widens toward the case - the Ultra's broad, shallow
     * sensor dome - is `flare` times `radius` where it meets the back. Without
     * it the puck is a straight-sided drum.
     */
    flare?: number
    /** The raised puck's own finish, when it is not the case's (the Ultra's black ceramic). */
    housing?: string
    /** Central photodiode window. */
    hubRadius: number
    /** The small LED windows ringed around the hub. */
    leds: { count: number; ring: number; radius: number }
    /** Polished metal electrode ring around the crystal. */
    electrode: { inner: number; outer: number }
    /** Engraved charging-coil ring outside the electrode (Apple). */
    coilRing?: number
  }
  /**
   * Wristband. Two families, discriminated on `closure`.
   *
   * `seamless` is Apple's Solo Loop: ONE continuous stretchy band with no
   * closure, no holes and no hardware of any kind - it simply flares into the
   * lugs at both ends and is sized to the wrist rather than adjusted.
   *
   * `tuck` and `buckle` are the two-strap bands. The twelve-o'clock strap
   * carries the closure hardware and lies against the wrist; the six-o'clock
   * strap is the long one, carrying the row of punched adjustment holes,
   * lapping OVER the other past the closure - the pin or buckle tongue comes
   * up through one of its holes - and running on as a free tail.
   *
   * The loop is an ovoid (see `WristLoop`): the vertical radius eases from
   * `ryFront` at the case to `ryBack` at the far side of the wrist, `rz` is
   * the depth radius around `centerZ`, and the band emerges `startAngle`
   * degrees off the front axis so its cut ends stay buried in the case.
   * Every other angle below is measured the same way - 90° is the
   * twelve-o'clock side, 180° the underside of the wrist, 270° six o'clock.
   */
  band: WatchBand
}

/** Shared by every band, whatever its closure. */
interface WatchBandBase {
  /** Width where the band meets the case (the lug shoulder). */
  lugWidth: number
  /** Width along the band's free run. */
  width: number
  thickness: number
  /** How far the outer face domes above the nominal thickness. */
  crown: number
  /**
   * Moulded ridges across the band's outer face (the Ocean Band): one every
   * `pitch` along the strap, standing `depth` proud at their crests. They fade
   * out into the connector at the lug end, and the holes sit in the troughs.
   */
  ridges?: { pitch: number; depth: number }
  loop: WristLoop
}

/** Apple's Solo Loop: one continuous band, no closure, no holes, no hardware. */
export interface SeamlessWatchBand extends WatchBandBase {
  closure: 'seamless'
}

/** A two-strap band closing with a pin-and-tuck lap or a pin buckle. */
export interface FastenedWatchBand extends WatchBandBase {
  /**
   * `tuck` is the Sport Band: a pin stud on the twelve-o'clock strap comes up
   * through a hole and the tail tucks into the slot behind it. `buckle` is the
   * classic pin buckle with a keeper.
   */
  closure: 'tuck' | 'buckle'
  /** Width at the free tip - tapered straps (Galaxy's Dynamic Lug band). */
  tipWidth: number
  /** Where the twelve-o'clock strap ends, under the lapping tail (worn). */
  pinStrapEnd: number
  /** Where the six-o'clock strap's free tip ends (worn). */
  tailEnd: number
  /**
   * Adjustment holes punched clean through the six-o'clock strap, as
   * normalized positions along it (0 at the lug, 1 at the tip). Positions
   * rather than sweep angles, so the row stays ON the strap whichever pose
   * the band is in - the unbuckled pose sweeps a different arc.
   */
  holes: number[]
  /** Half-width of a hole across the strap. */
  holeRadius: number
  /**
   * Length of a hole along the strap. The Galaxy band's are elongated slots,
   * not drillings; set it equal to `holeRadius * 2` for a round hole.
   */
  holeLength: number
  /** Which hole the pin / buckle tongue engages when the band is worn. */
  closureHole: number
  /** Where the keeper sits along the six-o'clock strap, worn. */
  keeperT?: number
  /**
   * The buckle frame, which follows the band's curve: `width` across (wider
   * than the strap threading it), `length` along the strap, `bar` the stock it
   * is bent from and `radius` its corners. `tongue` is how much of the frame's
   * inside the tongue spans from the hinge bar (1, the default, reaches the
   * free bar; the Ocean Band's is a short tab). Its finish is the case's.
   */
  buckle?: { width: number; length: number; bar: number; radius: number; tongue?: number }
  /**
   * `band` is a loop moulded in the strap's own material (the Galaxy Watch
   * band); `metal` a second frame like the buckle's in the case finish (the
   * Ocean Band's titanium loop, the Galaxy Watch Ultra's).
   */
  keeper?: 'band' | 'metal'
}

export type WatchBand = SeamlessWatchBand | FastenedWatchBand

/** Apple Watch Series 11, 46 mm. Logical resolution 208x248 pt. */
const SERIES_11: WatchSpec = {
  style: 'apple',
  body: { width: 2.203, height: 2.6, depth: 0.548, radius: 0.88, bevel: 0.12 },
  glass: { width: 2.02, height: 2.38, radius: 0.72 },
  // 416x496 at Apple's 326 ppi: 32.4 x 38.6 mm, the published 1196 mm², with
  // 8.0 mm corners on Apple's bezel drawing.
  display: { width: 1.831, height: 2.181, radius: 0.452 },
  resolution: 208,
  // Crown center ~31% down the right edge: a Ø7 mm finely knurled barrel,
  // ~2 mm proud, per Apple's Series 12 hardware drawing (the same crown).
  crown: { y: 0.48, radius: 0.198, thickness: 0.19, proud: 0.115, teeth: 46, toothDepth: 0.0085 },
  // Flush side button in its recess, center ~62% down the edge (~12.5 x 3.5 mm).
  buttons: [{ y: -0.31, length: 0.706, width: 0.198, proud: 0.012 }],
  // Mic hole between crown and side button.
  mic: { y: 0.1, radius: 0.022 },
  // Two perforated speaker slots one above the other on the left edge, a
  // short gap between them, each ~8 mm long (Apple's hardware drawing).
  speaker: [
    { y: 0.26, length: 0.44, height: 0.06 },
    { y: -0.26, length: 0.44, height: 0.06 },
  ],
  // Sport Band slot channel in the flat top/bottom edges, offset case-back.
  bandSlot: { width: 1.37, height: 0.24, z: -0.16 },
  // Back: aluminium matching the case, with the sensor crystal sunk flush in
  // the middle and the electrode ring around it.
  back: {
    radius: 0.6,
    raise: -0.012,
    hubRadius: 0.17,
    leds: { count: 4, ring: 0.33, radius: 0.078 },
    electrode: { inner: 0.6, outer: 0.68 },
    coilRing: 0.86,
  },
  // Solo Loop: ONE continuous stretchy band, no closure, no holes, no
  // hardware - it flares into the lug slots at both ends and is sized to the
  // wrist rather than adjusted. The loop below is a 58 x 45 mm wrist (~162 mm
  // round), which is what a Solo Loop is cut to.
  band: {
    closure: 'seamless',
    lugWidth: 1.33,
    width: 1.235,
    thickness: 0.152,
    crown: 0.05,
    // Centred so the band leaves the case end through its slot, a fifth of
    // the way up from the back.
    loop: { ryFront: 1.78, ryBack: 1.5, rz: 1.27, centerZ: -1.0, startAngle: 30 },
  },
}

/** Galaxy Watch 8, 44 mm: cushion case, round 480x480 display (240 dp grid). */
const GALAXY_WATCH_8: WatchSpec = {
  style: 'galaxy',
  body: { width: 2.469, height: 2.599, depth: 0.486, radius: 0.92, bevel: 0.13 },
  glass: { width: 2.18, height: 2.18, radius: 1.09 },
  dial: { radius: 1.09, height: 0.07 },
  display: { width: 2.0, height: 2.0, radius: 1.0 },
  resolution: 240,
  // Two raised chamfered pill keys (~10 x 3.3 mm) straddling the mic hole.
  buttons: [
    { y: 0.4, length: 0.56, width: 0.185, proud: 0.04 },
    { y: -0.4, length: 0.56, width: 0.185, proud: 0.04 },
  ],
  mic: { y: 0.0, radius: 0.02 },
  // Back: the BioActive puck stands proud of the aluminium cushion, its
  // electrode ring split into two arcs around the optical windows.
  back: {
    radius: 0.62,
    raise: 0.055,
    hubRadius: 0.14,
    leds: { count: 4, ring: 0.3, radius: 0.068 },
    electrode: { inner: 0.44, outer: 0.56 },
  },
  // Two short machined speaker slots in a vertical run on the left edge.
  speaker: [
    { y: 0.26, length: 0.37, height: 0.05 },
    { y: -0.26, length: 0.37, height: 0.05 },
  ],
  // The Sport Band, measured off Samsung's laid-flat render: a 21.8 mm strap
  // of constant width, its rubber end cap flaring only a little into the
  // Dynamic Lug, ten punched holes at 5.2 mm, a graphite-metal tang buckle
  // wider than the strap and a keeper moulded into the strap behind it.
  band: {
    lugWidth: 1.32,
    width: 1.23,
    tipWidth: 1.2,
    thickness: 0.135,
    crown: 0.03,
    closure: 'buckle',
    // A 56 x 43 mm wrist (~157 mm round) with ~165 mm of strap, so the tail
    // stands well past the buckle with holes to spare either side of the one
    // in use. The short strap runs on to the buckle's hinge bar.
    pinStrapEnd: 205,
    tailEnd: 98,
    // Holes elongated ACROSS the strap (2.9 x 1.9 mm), 5.2 mm apart.
    holes: [0.35, 0.405, 0.46, 0.514, 0.569, 0.624, 0.679, 0.734, 0.788, 0.843],
    holeRadius: 0.082,
    holeLength: 0.107,
    closureHole: 4,
    // The moulded keeper sits right behind the buckle, on the short strap.
    keeperT: 0.67,
    // 28 x 13.7 mm, bent from ~2.3 mm stock with ~4 mm corners.
    buckle: { width: 1.61, length: 0.77, bar: 0.13, radius: 0.22 },
    keeper: 'band',
    // The strap leaves the Dynamic Lug about halfway up the case's end,
    // falling away at ~45° (Samsung's side render) - not off the case back.
    loop: { ryFront: 1.72, ryBack: 1.46, rz: 1.22, centerZ: -0.8, startAngle: 44 },
  },
}

/**
 * Apple Watch Series 12, 46 mm. Apple publishes the Series 11's case a
 * millimetre wider - 46 x 40 x 9.7 mm in aluminium and titanium against the
 * 11's 46 x 39 - over the same 416x496 panel and the same 1196 mm² display
 * area, so the geometry is carried over at that width, and the generation
 * shows in the colorways. The new ceramic
 * case is a millimetre taller and wider and 0.15 mm deeper; that is not
 * modelled as separate geometry.
 */
const SERIES_12: WatchSpec = {
  ...SERIES_11,
  // Apple's Series 12 tech specs give the aluminium and titanium 46 mm case
  // a millimetre more width than the Series 11's 39: 46 x 40 x 9.7 mm.
  body: { ...SERIES_11.body, width: 2.26 },
}

/**
 * Apple Watch Ultra 4, 49 mm - the Ultra 3's case unchanged: 49 x 44 x 12 mm
 * of grade 5 titanium with much tighter corners than the Series squircle,
 * barrel flanks under a flat raised lip, a flat sapphire crystal over the
 * 1.98" 422x514 panel (211x257 pt), the crown guard on the right flank
 * enclosing a bigger, coarsely lobed Digital Crown and the side button, the
 * International Orange Action button on the left between the speaker grille
 * and the siren, and a shallow black ceramic sensor dome on a body-colour
 * back plate. Body, panel and display figures are Apple's tech specs; the
 * guard, key, port and crown proportions are read off Apple's product renders
 * and hardware drawings scaled to the published size. It wears the Ocean
 * Band - a ridged rubber strap closing with a titanium buckle and loop over
 * stadium adjustment holes - on the shared wrist loop at the Ultra's wider
 * strap.
 */
const ULTRA_4: WatchSpec = {
  style: 'apple',
  // Apple's published 44 mm width takes in the crown guard and crown: the
  // case itself is 41.4 mm across on Apple's bezel drawing, the guard 1.6 mm
  // proud of it and the crown 2.4. The front outline's corners fit a ~12.7 mm
  // circle, and the flanks are a barrel - rounded into the back - under the
  // flat titanium lip (1 mm of the 12) that holds the crystal.
  body: { width: 2.339, height: 2.768, depth: 0.678, radius: 0.72, bevel: 0.14 },
  lip: { height: 0.056, inset: 0.05 },
  // The flat crystal, with the 1.6 mm black border it paints around the panel.
  glass: { width: 2.04, height: 2.446, radius: 0.58 },
  // 422x514 at Apple's 326 ppi: 32.9 x 40.1 mm with 9.0 mm corners, the
  // published 1245 mm², 4.3 mm in from the case edge on every side.
  display: { width: 1.858, height: 2.263, radius: 0.511 },
  resolution: 211,
  // The Ø9.6 mm Ultra crown, centred 6.5 mm above the case's middle and
  // standing 0.8 mm clear of the guard: a score of coarse rounded lobes, not
  // the Series' fine knurling, with the orange ring on its face.
  crown: {
    y: 0.37,
    radius: 0.272,
    thickness: 0.2,
    proud: 0.136,
    teeth: 20,
    toothDepth: 0.024,
    ring: '#e8622a',
    lobed: true,
  },
  // The guard: a 28 mm round-ended plate, 7.2 mm tall and 1.6 mm proud,
  // running from under the crown past the side button.
  crownGuard: { y: -0.03, length: 1.58, proud: 0.09, thickness: 0.41, radius: 0.03 },
  // The microphone between the crown and the side button, drilled through the guard.
  mic: { y: -0.03, radius: 0.022 },
  buttons: [
    // side button, 10.6 x 4.7 mm, centred 7.6 mm below the middle, 0.4 mm proud of the guard's face
    { y: -0.43, length: 0.6, width: 0.265, proud: 0.113 },
    // the Action button: 13.5 x 4.4 mm, centred 4.1 mm below the middle, all
    // but flush in the case's silhouette - orange whatever the case finish
    { edge: 'left', y: -0.232, length: 0.763, width: 0.249, proud: 0.025, color: '#e8622a' },
  ],
  // The left flank, twelve o'clock to six (Apple's hardware drawing): a
  // microphone slot, the speaker grille - ten Ø1.5 mm holes packed 3-4-3 -
  // then past the Action button the round siren port.
  speaker: [
    { y: 1.02, length: 0.1, height: 0.05 },
    ...[
      { z: 0.09, ys: [-0.102, 0, 0.102] },
      { z: 0, ys: [-0.153, -0.051, 0.051, 0.153] },
      { z: -0.09, ys: [-0.102, 0, 0.102] },
    ].flatMap(({ z, ys }) => ys.map((dy) => ({ y: 0.51 + dy, z, length: 0.085, height: 0.085 }))),
    { y: -0.79, length: 0.13, height: 0.13 },
  ],
  bandSlot: { width: 1.5, height: 0.26, z: -0.2 },
  // Back: a broad, shallow black-ceramic sensor dome standing ~1.8 mm off the
  // titanium back plate, eight windows ringed round the centre lens.
  back: {
    radius: 0.68,
    raise: 0.1,
    flare: 1.13,
    housing: '#141518',
    hubRadius: 0.15,
    leds: { count: 8, ring: 0.3, radius: 0.045 },
    electrode: { inner: 0.5, outer: 0.58 },
    coilRing: 0.95,
  },
  // Ocean Band, off Apple's 2026 flat renders: a 24 mm strap of constant
  // width with a moulded ridge every 6.7 mm, seven stadium holes cut across
  // it in the troughs, and a titanium buckle and loop in the case finish.
  band: {
    closure: 'buckle',
    lugWidth: 1.5,
    width: 1.36,
    tipWidth: 1.3,
    thickness: 0.16,
    crown: 0.03,
    ridges: { pitch: 0.378, depth: 0.042 },
    pinStrapEnd: 201,
    tailEnd: 98,
    holes: [0.396, 0.46, 0.524, 0.588, 0.652, 0.716, 0.781],
    holeRadius: 0.12,
    holeLength: 0.085,
    closureHole: 3,
    keeperT: 0.72,
    // 31 x 10 mm stadium frames of ~1.7 mm titanium.
    buckle: { width: 1.74, length: 0.58, bar: 0.095, radius: 0.28, tongue: 0.45 },
    keeper: 'metal',
    // The band leaves the lower half of the case end, through its slot.
    loop: { ryFront: 1.8, ryBack: 1.52, rz: 1.29, centerZ: -0.98, startAngle: 30 },
  },
}

/** The Apple Watch family: the Series on a seamless Solo Loop, the Ultra on its buckled Ocean Band. */
export const APPLE_WATCH_VARIANTS: Record<'series11' | 'series12' | 'ultra4', WatchSpec> = {
  series11: SERIES_11,
  series12: SERIES_12,
  ultra4: ULTRA_4,
}

/**
 * Galaxy Watch 9, 44 mm. The generation is internal (chip, battery, Wear OS
 * 7): the published case - 46.0 x 43.7 x 8.6 mm - and the 1.47" 480x480 dial
 * are the Watch 8's to the tenth of a millimetre, so the cushion geometry is
 * the Watch 8's, carried over deliberately rather than remeasured.
 */
const GALAXY_WATCH_9: WatchSpec = {
  ...GALAXY_WATCH_8,
}

/**
 * Galaxy Watch Ultra 2, 47 mm: a grade-4 titanium cushion squircle -
 * 47.4 x 47.1 x 10.7 mm, two millimetres deeper than the Watch 9 - carrying
 * the same raised-round-dial architecture with a 1.52" 498x498 sAMOLED
 * (249 dp grid, the panel at half scale). Right edge, top to bottom: two
 * pill keys, then the wider orange Quick Button standing proudest of the
 * three. Case and dial proportions are read off Samsung's official product
 * renders scaled to the published width; the band reuses the Galaxy buckle
 * rig at the Ultra's wider strap width.
 */
const GALAXY_WATCH_ULTRA_2: WatchSpec = {
  style: 'galaxy',
  body: { width: 2.661, height: 2.678, depth: 0.605, radius: 1.0, bevel: 0.13 },
  glass: { width: 2.28, height: 2.28, radius: 1.14 },
  dial: { radius: 1.14, height: 0.06 },
  display: { width: 2.1, height: 2.1, radius: 1.05 },
  resolution: 249,
  // The three-key run: the two standard keys with the Quick Button seated
  // between them - wider, prouder, and orange whatever the case finish.
  buttons: [
    { y: 0.42, length: 0.34, width: 0.185, proud: 0.05 },
    { y: 0, length: 0.44, width: 0.26, proud: 0.075, color: '#e05d2b' },
    { y: -0.42, length: 0.34, width: 0.185, proud: 0.05 },
  ],
  // Back: the BioActive puck raised from the titanium, as on the cushion case.
  back: {
    radius: 0.65,
    raise: 0.05,
    hubRadius: 0.14,
    leds: { count: 4, ring: 0.3, radius: 0.068 },
    electrode: { inner: 0.44, outer: 0.56 },
  },
  speaker: [
    { y: 0.26, length: 0.37, height: 0.05 },
    { y: -0.26, length: 0.37, height: 0.05 },
  ],
  // The Ultra strap: the Galaxy buckle rig at the Marine Band's ~23.6 mm,
  // flaring to ~25 mm at the lug, with a titanium keeper in the case finish
  // like the buckle - on the same wrist loop.
  band: {
    closure: 'buckle',
    lugWidth: 1.42,
    width: 1.33,
    tipWidth: 1.28,
    thickness: 0.15,
    crown: 0.035,
    pinStrapEnd: 205,
    tailEnd: 98,
    holes: [0.35, 0.405, 0.46, 0.514, 0.569, 0.624, 0.679, 0.734, 0.788, 0.843],
    holeRadius: 0.082,
    holeLength: 0.107,
    closureHole: 4,
    keeperT: 0.706,
    buckle: { width: 1.72, length: 0.8, bar: 0.13, radius: 0.22 },
    keeper: 'metal',
    // The strap leaves the Dynamic Lug about halfway up the case's end,
    // falling away at ~45° (Samsung's side render) - not off the case back.
    loop: { ryFront: 1.72, ryBack: 1.46, rz: 1.22, centerZ: -0.8, startAngle: 44 },
  },
}

/** The Galaxy Watch family, worn on a buckled two-strap band. */
export const GALAXY_WATCH_VARIANTS: Record<'watch8' | 'watch9' | 'watchultra2', WatchSpec> = {
  watch8: GALAXY_WATCH_8,
  watch9: GALAXY_WATCH_9,
  watchultra2: GALAXY_WATCH_ULTRA_2,
}

export type AppleWatchVariant = keyof typeof APPLE_WATCH_VARIANTS
export type GalaxyWatchVariant = keyof typeof GALAXY_WATCH_VARIANTS

/** Every watch spec in one table - the shared framing and camera math key off it. */
export const WATCH_VARIANTS: Record<AppleWatchVariant | GalaxyWatchVariant, WatchSpec> = {
  ...APPLE_WATCH_VARIANTS,
  ...GALAXY_WATCH_VARIANTS,
}

export type WatchVariant = AppleWatchVariant | GalaxyWatchVariant

/** The variant each family's binding defaults to. */
export const APPLE_WATCH_DEFAULT_VARIANT: AppleWatchVariant = 'series11'
export const GALAXY_WATCH_DEFAULT_VARIANT: GalaxyWatchVariant = 'watch8'

/** Framing distance for the worn pose, which every variant shares. */
const WORN_DISTANCE = 7.7
const FOV = 40

/**
 * Camera distance that frames the watch in the given band pose. Laid flat the
 * band is several times the worn loop's height, so the worn distance crops it
 * badly; back off far enough that the full extent fits the vertical field with
 * a little air around it.
 */
export function watchCameraDistance(variant: WatchVariant, bandOpen: boolean): number {
  const { band } = WATCH_VARIANTS[variant]
  if (!bandOpen || band.closure === 'seamless') return WORN_DISTANCE
  const fit = watchOpenExtent(band) / Math.tan((FOV / 2) * (Math.PI / 180))
  return Math.max(WORN_DISTANCE, fit * 1.12)
}

/**
 * Grounded under the bottom of the band: the worn loop's lower edge, or the
 * tip of the longer strap when the band lies flat. The worn extent is rebased
 * −0.05 so the shared float gap reproduces the stage's original 0.25 hover
 * clearance, with the grounded line (0.05 under the strap) restored by the
 * 0.1 contact gap.
 */
/** Millimetres per world unit - the shared watch scale. */
export const WATCH_MM_PER_UNIT = 17.7

/** Live geometry of a watch display. Watches have a single pose. */
function watchRegions(variant: WatchVariant) {
  const { display, resolution } = WATCH_VARIANTS[variant]
  return {
    screen: { width: display.width, height: display.height, radius: display.radius, resolution },
  }
}

/** Live geometry of the Apple Watch display. */
export const APPLE_WATCH_METRICS = {
  mmPerUnit: WATCH_MM_PER_UNIT,
  regions: ({ variant }) => watchRegions(variant ?? APPLE_WATCH_DEFAULT_VARIANT),
} as const satisfies MockupMetrics<{ variant?: AppleWatchVariant }>

/** Live geometry of the Galaxy Watch display (round: width === height). */
export const GALAXY_WATCH_METRICS = {
  mmPerUnit: WATCH_MM_PER_UNIT,
  regions: ({ variant }) => watchRegions(variant ?? GALAXY_WATCH_DEFAULT_VARIANT),
} as const satisfies MockupMetrics<{ variant?: GalaxyWatchVariant }>

/**
 * Built per family so an omitted `variant` falls back to the family the
 * mockup belongs to - see the tablet framings for the same reasoning.
 */
const watchFraming = (defaultVariant: WatchVariant) =>
  ({
    camera: { position: [0, 0.4, WORN_DISTANCE], fov: FOV },
    floatIntensity: 0.6,
    contactGap: 0.1,
    extent: ({ variant, bandOpen }) => {
      const { band } = WATCH_VARIANTS[variant ?? defaultVariant]
      // A seamless band has no closure to undo, so `bandOpen` cannot change it.
      if (bandOpen && band.closure !== 'seamless') return watchOpenExtent(band)
      return (band.loop.ryFront + band.loop.ryBack) / 2 + band.thickness / 2 - 0.05
    },
  }) as const satisfies MockupFraming<{ variant?: WatchVariant; bandOpen?: boolean }>

export const APPLE_WATCH_FRAMING = watchFraming(APPLE_WATCH_DEFAULT_VARIANT)
export const GALAXY_WATCH_FRAMING = watchFraming(GALAXY_WATCH_DEFAULT_VARIANT)

/**
 * The shared watch stage config (camera, float, contact gap).
 *
 * Prefer `APPLE_WATCH_FRAMING` / `GALAXY_WATCH_FRAMING` when grounding an
 * object - this one falls back to the Apple Watch's default variant.
 */
export const WATCH_FRAMING = APPLE_WATCH_FRAMING

/**
 * True length of each strap, measured along the wrist loop it wraps. The worn
 * pose is what fixes a band's length - it is cut to go round a wrist - so the
 * flat pose reads its lengths from here rather than carrying its own numbers
 * that could drift out of agreement.
 */
export function watchStrapLengths(band: FastenedWatchBand): { pin: number; tail: number } {
  const { startAngle } = band.loop
  return {
    pin: wristLoopArcLength(band.loop, startAngle, band.pinStrapEnd),
    tail: wristLoopArcLength(band.loop, 360 - startAngle, band.tailEnd),
  }
}

/**
 * How far up the case's centre line a flat band's straps begin, so their cut
 * ends stay buried inside it.
 */
export const WATCH_OPEN_START_Y = 0.55

/** Half-height of the band laid flat, for framing and the contact shadow. */
export function watchOpenExtent(band: FastenedWatchBand): number {
  const { pin, tail } = watchStrapLengths(band)
  return WATCH_OPEN_START_Y + Math.max(pin, tail) + band.thickness
}
