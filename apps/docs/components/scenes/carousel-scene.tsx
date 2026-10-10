'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import Link from 'next/link'
import { useFrame } from '@react-three/fiber'
import { Check, CodeXml, Palette, Pause, Play } from 'lucide-react'
import { Box3, Matrix4, type Group } from 'three'
import {
  MockupCanvas,
  Galaxy,
  IPhone,
  Fold,
  Flip,
  Laptop,
  IPad,
  GalaxyTab,
  AppleWatch,
  GalaxyWatch,
  StudioDisplay,
  Book,
  VinylRecord,
  MilkCarton,
  ProductBox,
  MailerBox,
  ShoppingBag,
  PosterFrame,
  AFrameSign,
  Billboard,
  Bus,
  GALAXY_COLORWAYS,
  IPHONE_COLORWAYS,
  FOLD_COLORWAYS,
  FLIP_COLORWAYS,
  LAPTOP_COLORWAYS,
  IPAD_COLORWAYS,
  GALAXY_TAB_COLORWAYS,
  APPLE_WATCH_COLORWAYS,
  GALAXY_WATCH_COLORWAYS,
  STUDIO_DISPLAY_COLORWAYS,
  mockupInfo,
  usePrefersReducedMotion,
  type Colorway,
  type MockupKind,
} from 'react-3d-mockups'
import { DEFAULT_CAMERA_FOV, ORBIT } from 'react-3d-mockups/core'
import { BillboardAdArt, ChalkHoursArt, ChalkMenuArt } from '../screens/print-art'
import { SUNPEEL_FLAVOURS, SunpeelRear, SunpeelSide } from '../screens/bus-wrap'
import { CartonBack, CartonFacts, CartonFront, CartonRoof, CartonStory } from '../screens/carton-art'
import {
  BagBack,
  BagFront,
  CerealBack,
  CerealFacts,
  CerealFront,
  CerealStory,
  CerealTop,
} from '../screens/package-art'
import { BoxEnd, BoxSide, BoxTop } from '@/app/examples/fleet/fleet-art'
import { LIVERIES } from '@/app/examples/fleet/fleet-data'
import { Newspaper, SwissSite, WatchFace } from '../screens/device-apps'
import {
  SwissBill,
  SwissChecker,
  SwissDialA,
  SwissEpicentre,
  SwissField,
  SwissRaster,
  SwissRhythm,
  SwissRotation,
} from '../screens/swiss-art'
import { JacketBack, JacketCover, JacketSpine } from '../screens/book-jacket'
import { SleeveBack, SleeveCover, SleeveLabelA, SleeveLabelB } from '../screens/record-sleeve'
import { CarouselHintText } from '../carousel-hint'
import { DEVICES as CATALOG_DEVICES, OBJECTS as CATALOG_OBJECTS } from '@/lib/mockup-catalog.mjs'

/**
 * The hero carousel: ONE WebGL canvas holding every model on show.
 *
 * Each `*Mockup` component is a canvas plus an object, which is the right
 * shape for a page that shows one device - but a carousel of them would mean
 * a context per slot, and three at once was already enough to get one dropped
 * ("THREE.WebGLRenderer: Context Lost"). So this composes the bare objects
 * (`<Galaxy>`, `<Laptop>`, `<MilkCarton>`, …) into a single `<MockupCanvas>`
 * and moves them through the scene instead: the models on the stage and the
 * picker row beneath it are all real geometry in the same context, none of
 * them screenshots, and adding a slot costs geometry rather than a context.
 *
 * What is on show is a spread, not a catalog: ONE model per device family
 * (the four iPhone variants and five iPads all look alike at this size, and
 * scrolling past them read as padding) plus the print and packaging objects,
 * which are what say the library is not only about phones.
 *
 * Every model is sized to the same box (`STAGE_HEIGHT` by `STAGE_WIDTH`) from
 * its own measured bounds, and centred on them - see `measure`.
 */

/** Shared camera distance. */
const CAMERA_Z = 9
/** Rig scale to fall back on before the stylesheet has been measured. */
const DEFAULT_FIT = 1
/**
 * The box every staged model is fitted into, in rig units: as tall as a phone
 * has always stood here, and no wider than leaves a clear gap to the models
 * flanking it (half of `SPACING`, less half a side model at `SIDE_SCALE`).
 */
const STAGE_HEIGHT = 3.6
const STAGE_WIDTH = 4.6
/** World-space gap between the staged model and each flanking one. */
const SPACING = 4.8
const STAGE_Y = 0.72
const SIDE_SCALE = 0.5
/** The picker row, well below the stage. */
const ROW_Y = -2.2
/**
 * How much lower than `ROW_Y` the row itself is drawn. The strip sat a full
 * unit above the canvas's foot, which put a band of empty stage between the
 * thumbnails and the Play / Copy code toolbar under them; this closes most of
 * it. Kept apart from `ROW_Y`, which also sets the rig's drop on a narrow
 * canvas, so lowering the strip does not move the device on stage.
 */
const ROW_LOWER = 0.55
const ROW_SCALE = 0.17
const ROW_SPACING = 1.25
/**
 * How much of the rig's vertical shrink to give back as a drop.
 *
 * Scaling the rig scales its layout too, so the strip - which is placed below
 * the stage in world units - creeps up toward the middle and leaves the bottom
 * of the frame empty. Sliding the whole rig back down by a fraction of what it
 * lost keeps the strip near the foot of the stage while leaving the staged
 * device close enough to centred. Fully compensating would nail the strip in
 * place but hang the device high in an empty frame; 0.6 is the balance.
 */
const RIG_DROP = 0.6
/**
 * Painted screen for the picker row: dark glass with a soft reflection.
 *
 * It used to be the chroma green the sidebar thumbnails use to mark a live
 * area, which on a strip of small devices read as screens that had not loaded
 * yet. Green stays where it means something - the docs' "mockup-able areas"
 * view.
 */
const ROW_SURFACE =
  'linear-gradient(155deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 34%, transparent 35%), linear-gradient(180deg, #1b2130 0%, #0b0d12 100%)'
/**
 * Virtual display width for a picker-row thumbnail, in CSS px.
 *
 * A painted screen still costs a composited DOM layer, and a screen paints at
 * the resolution it DECLARES: left at their own, the row's ten thumbnails
 * rasterized nineteen device-megapixels between them - the iPad alone
 * 2064x2752 - to draw a forty-pixel sliver of gradient each. That is about
 * eighty megabytes of texture the compositor is holding for the strip, and it
 * comes out of the same budget as the model you are actually looking at: the
 * tiles that lose it composite as blank rectangles over the glass, which is
 * what a staged screen blinking is.
 *
 * `screenRasterScale` in the library caps a screen against the CANVAS size,
 * which is the right guard for a mockup filling the frame and no help at all
 * for one drawn at a sixth of it - it cannot know the projected size. So the
 * row asks for a thumbnail-sized display outright. 96 px is wider than the
 * strip ever draws one at 2x, and there is no detail in a gradient to lose.
 */
const ROW_RESOLUTION = 96
/**
 * Hinge angle the foldables are posed at on the carousel.
 *
 * Flat, they read as one more slab in a row of slabs; a little short of it and
 * the hinge, the spine band and the crease are all visible, which is the point
 * of having them here.
 */
const CAROUSEL_OPEN_ANGLE = 150

/** Resting pose - a slight turn reads as three-dimensional at a glance. */
const BASE_RY = -0.3
/**
 * Vertical limit, matched to the stage's polar clamp: the library's controls
 * orbit the camera between `ORBIT.minPolarAngle` and its mirror, which from a
 * level start is this much tilt either way.
 */
const PITCH_LIMIT = Math.PI / 2 - ORBIT.minPolarAngle

/**
 * Drag-to-rotate with the same feel as every mockup in the docs.
 *
 * Those spin the CAMERA with `TumbleControls`; here the camera has to stay put
 * - it frames the whole carousel - so the staged object turns instead. The
 * numbers are the library's, not new ones: a drag is queued as
 * `2*PI * delta / height` radians (a full-height drag is a full turn), and
 * each frame applies `ORBIT.dampingFactor` of what is pending and decays the
 * rest. That buffer is what keeps a flick spinning after release, slowing to a
 * stop. Rotating the object is the mirror of rotating the camera around it, so
 * both signs are flipped against `TumbleOrbit` to land on the same direction.
 */
interface Tumble {
  pendingYaw: number
  pendingPitch: number
  yaw: number
  pitch: number
}

const restingTumble = (): Tumble => ({ pendingYaw: 0, pendingPitch: 0, yaw: BASE_RY, pitch: 0 })

function advanceTumble(t: Tumble): void {
  const yaw = t.pendingYaw * ORBIT.dampingFactor
  const pitch = t.pendingPitch * ORBIT.dampingFactor
  t.pendingYaw *= 1 - ORBIT.dampingFactor
  t.pendingPitch *= 1 - ORBIT.dampingFactor
  t.yaw += yaw
  t.pitch = Math.min(PITCH_LIMIT, Math.max(-PITCH_LIMIT, t.pitch + pitch))
}

interface Entry {
  /** Catalog id: the name, the docs page and the copied code all come from it. */
  id: string
  /** Live-surface readout: logical pixels for a screen, millimetres for print. */
  res: string
  /**
   * Resting tilt toward the camera, in radians, for an object whose best face
   * is on top - a mailer box shown level is a flat rectangle, and its readout
   * describes a lid nobody can see.
   */
  tilt?: number
  /** Resting turn on top of `BASE_RY`, for an object whose best side faces away. */
  yaw?: number
  colorways: Colorway[]
  /**
   * Ink for the system status bar, set against the artwork behind it the way
   * an app picks its status-bar style. Absent on everything that is not a
   * phone or a tablet - a milk carton has no status bar.
   */
  statusBarInk?: string
  /**
   * What the staged model carries on its primary surface. It is handed the
   * finish currently selected, which the printed faces use as their ground.
   */
  content: (color: string) => ReactNode
  /**
   * The finish is the material the artwork prints onto - a board, a bag, a
   * record jacket - rather than a colourway or the hardware around a sheet,
   * so the swatches are labelled "Material". The library already paints that
   * stock behind the printed faces (`surfaceBackground` defaults to `color`
   * on those objects), so a transparent sheet sits on kraft, not on white.
   */
  material?: boolean
  /** What the swatches are called when they are neither colorways, materials nor finishes. */
  swatchLabel?: string
  /**
   * The bare object. `screen` is live DOM for the staged models; the picker
   * row passes `surface` instead - a gradient costs no DOM to lay out, though
   * it still costs the layer it paints on, which is what `resolution` below is
   * for. The packaging prints its other faces too, and gates them on `screen`:
   * five DOM panels on a seventeen-per-cent thumbnail are five layers nobody
   * can see.
   */
  render: (props: {
    color: string
    screen: ReactNode
    surface?: string
    surfaceStyle?: Record<string, unknown>
    /** Thumbnail-sized on the picker row (`ROW_RESOLUTION`); the device's own on stage. */
    resolution?: number
    /**
     * The system status bar, on the staged models only. The picker row is
     * seventeen per cent scale - a clock and three meters there would be four
     * illegible specks per thumbnail, on seven extra DOM layers.
     */
    statusBar?: { color: string } | false
  }) => ReactNode
}

/**
 * "360 × 780 px" - the primary surface of a mockup kind in logical pixels.
 * The unit is spelled out because the objects beside them read in millimetres.
 */
function pxRes(kind: MockupKind, props?: object): string {
  const { width, height } = mockupInfo(kind as never, props as never).primary.px
  return `${width} × ${height} px`
}

/**
 * "156 × 234 mm" - the same surface in millimetres, which is the number a
 * print piece is actually specified in. A book cover's pixel grid is a
 * rendering detail; its trim size is the thing. Past ten metres it is metres:
 * nobody quotes a billboard at 14560 mm.
 */
function mmRes(kind: MockupKind, props?: object): string {
  const { width, height } = mockupInfo(kind as never, props as never).primary.mm
  if (width >= 10_000) return `${(width / 1000).toFixed(1)} × ${(height / 1000).toFixed(1)} m`
  return `${Math.round(width)} × ${Math.round(height)} mm`
}

/**
 * Finishes for the objects.
 *
 * The devices bring their retail catalogs with them (`GALAXY_COLORWAYS` and
 * friends) because those are marketed finishes with measured colours. An
 * object's `color` is a stock choice instead - board, cloth, moulding - so
 * each one gets a short palette here rather than in the library.
 */
const stock = (...entries: [string, string, string][]): Colorway[] =>
  entries.map(([id, name, color]) => ({ id, name, color }))

/**
 * What the catalog says about the object on stage: its name, its reference
 * page, and the component and variant that render it.
 *
 * Every entry below is keyed by a catalog id, so all of that is a lookup in the
 * shared catalog rather than a second list to keep in step with it - the same
 * table the docs sidebar, the gallery and the thumbnail generator read. The
 * carousel used to carry its own names, and a model was a "Framed poster"
 * here and a "Poster frame" one click away. An id with no catalog entry
 * renders its id as plain text: a name that quietly stops being a link beats
 * a link into a 404.
 */
interface CatalogEntry {
  id: string
  label: string
  href: string
  component: string
  variant?: string
}
const CATALOG = new Map<string, CatalogEntry>(
  [...CATALOG_DEVICES, ...CATALOG_OBJECTS].map((e: CatalogEntry) => [e.id, e])
)
const nameOf = (entry: Entry) => CATALOG.get(entry.id)?.label ?? entry.id

/** Props the carousel poses a model with that its one-liner does not default to. */
const POSE_PROPS: Record<string, string> = {
  'galaxy-z-fold7': ` openAngle={${CAROUSEL_OPEN_ANGLE}}`,
  'galaxy-z-flip7': ` openAngle={${CAROUSEL_OPEN_ANGLE}}`,
  bus: ` coverage="perforated"`,
}

/**
 * The JSX for what is on stage, in the chosen finish - the one-liner a visitor
 * would paste to get this exact mockup. Devices take the retail colorway's id;
 * the objects' finishes are stock colours, so they take the colour itself.
 */
function codeFor(entry: Entry, colorway: Colorway): string | null {
  const c = CATALOG.get(entry.id)
  if (!c) return null
  const color = DEVICES.includes(entry) ? colorway.id : colorway.color
  const variant = c.variant ? ` variant="${c.variant}"` : ''
  return `import { ${c.component} } from 'react-3d-mockups'

<${c.component}${variant} color="${color}"${POSE_PROPS[entry.id] ?? ''}>
  <YourApp />
</${c.component}>`
}

/** The mailer box's print: the Signal livery from the fleet example. */
const NORTHLINE = LIVERIES[0]!

/** One per device family - the variants are on their own docs pages. */
const DEVICES: Entry[] = [
  {
    id: 'galaxy-s26',
    statusBarInk: '#141414',
    res: pxRes('galaxy', { variant: 's26' }),
    colorways: GALAXY_COLORWAYS.s26,
    content: () => <SwissRotation />,
    render: ({ color, screen, surface, surfaceStyle, statusBar, resolution }) => (
      <Galaxy variant="s26" color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle} resolution={resolution} statusBar={statusBar}>
        {screen}
      </Galaxy>
    ),
  },
  {
    id: 'iphone-17-pro',
    statusBarInk: '#efede6',
    res: pxRes('iphone', { variant: 'pro' }),
    colorways: IPHONE_COLORWAYS.pro,
    content: () => <SwissRaster />,
    render: ({ color, screen, surface, surfaceStyle, statusBar, resolution }) => (
      <IPhone variant="pro" color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle} resolution={resolution} statusBar={statusBar}>
        {screen}
      </IPhone>
    ),
  },
  {
    id: 'galaxy-z-fold7',
    statusBarInk: '#141414',
    res: pxRes('fold', { openAngle: CAROUSEL_OPEN_ANGLE }),
    colorways: FOLD_COLORWAYS.fold7,
    content: () => <Newspaper />,
    render: ({ color, screen, surface, surfaceStyle, statusBar, resolution }) => (
      <Fold openAngle={CAROUSEL_OPEN_ANGLE} color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle} resolution={resolution} statusBar={statusBar}>
        {screen}
      </Fold>
    ),
  },
  {
    id: 'galaxy-z-flip7',
    statusBarInk: '#efede6',
    res: pxRes('flip', { openAngle: CAROUSEL_OPEN_ANGLE }),
    colorways: FLIP_COLORWAYS.flip7,
    content: () => <SwissField />,
    render: ({ color, screen, surface, surfaceStyle, statusBar, resolution }) => (
      <Flip openAngle={CAROUSEL_OPEN_ANGLE} color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle} resolution={resolution} statusBar={statusBar}>
        {screen}
      </Flip>
    ),
  },
  {
    id: 'macbook-air-13',
    res: pxRes('laptop', { variant: 'air13' }),
    colorways: LAPTOP_COLORWAYS.air13,
    content: () => <SwissSite />,
    render: ({ color, screen, surface, surfaceStyle, resolution }) => (
      <Laptop variant="air13" color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle} resolution={resolution}>
        {screen}
      </Laptop>
    ),
  },
  {
    id: 'ipad-pro-13',
    statusBarInk: '#efede6',
    res: pxRes('ipad', { variant: 'ipadpro13' }),
    colorways: IPAD_COLORWAYS.ipadpro13,
    content: () => <SwissEpicentre />,
    render: ({ color, screen, surface, surfaceStyle, statusBar, resolution }) => (
      <IPad variant="ipadpro13" color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle} resolution={resolution} statusBar={statusBar}>
        {screen}
      </IPad>
    ),
  },
  {
    id: 'galaxy-tab-s11',
    statusBarInk: '#141414',
    res: pxRes('galaxyTab', { variant: 'tabs11' }),
    colorways: GALAXY_TAB_COLORWAYS.tabs11,
    content: () => <SwissChecker />,
    render: ({ color, screen, surface, surfaceStyle, statusBar, resolution }) => (
      <GalaxyTab variant="tabs11" color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle} resolution={resolution} statusBar={statusBar}>
        {screen}
      </GalaxyTab>
    ),
  },
  {
    // The Ultra, for its ridged Ocean Band: the one strap in the range with
    // relief, and it catches the studio light as the watch turns.
    id: 'apple-watch-ultra-4',
    res: pxRes('appleWatch', { variant: 'ultra4' }),
    colorways: APPLE_WATCH_COLORWAYS.ultra4,
    content: () => <SwissDialA />,
    render: ({ color, screen, surface, surfaceStyle, resolution }) => (
      <AppleWatch variant="ultra4" color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle} resolution={resolution}>
        {screen}
      </AppleWatch>
    ),
  },
  {
    id: 'galaxy-watch-8',
    res: pxRes('galaxyWatch'),
    colorways: GALAXY_WATCH_COLORWAYS.watch8,
    content: () => <WatchFace />,
    render: ({ color, screen, surface, surfaceStyle, resolution }) => <GalaxyWatch color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle} resolution={resolution}>{screen}</GalaxyWatch>,
  },
  {
    id: 'studio-display',
    res: pxRes('studioDisplay'),
    colorways: STUDIO_DISPLAY_COLORWAYS,
    content: () => <SwissRhythm />,
    render: ({ color, screen, surface, surfaceStyle, resolution }) => <StudioDisplay color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle} resolution={resolution}>{screen}</StudioDisplay>,
  },
]

/**
 * The other half of the library: print, packaging and signage, where the live
 * surface is a printed panel rather than a screen. Bare children land on each
 * object's primary surface, which is the face it is designed on.
 */
const OBJECTS: Entry[] = [
  {
    id: 'book',
    res: mmRes('book'),
    colorways: stock(
      ['navy', 'Navy cloth', '#1f3a5f'],
      ['forest', 'Forest', '#22402f'],
      ['oxblood', 'Oxblood', '#5b2230'],
      ['bone', 'Bone', '#e3dbcc']
    ),
    content: (color) => <JacketCover cloth={color} />,
    // A jacket wraps the book, so all three faces are printed: a front board
    // alone left the object a blank slab the moment the carousel turned it,
    // and the spine is the only face a shelf ever shows. No `material` here -
    // a dust jacket is its own printed sheet, not ink on the cloth.
    render: ({ color, screen, surface, surfaceStyle, resolution }) => (
      <Book color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle} resolution={resolution}>
        {screen}
        {screen != null && (
          <>
            <Book.Spine>
              <JacketSpine cloth={color} />
            </Book.Spine>
            <Book.Back>
              <JacketBack cloth={color} />
            </Book.Back>
          </>
        )}
      </Book>
    ),
  },
  {
    id: 'vinyl-record',
    res: mmRes('vinylRecord'),
    // The jacket stock is the cover's field: both faces print straight onto
    // it (record-sleeve.tsx), so this is the colour the sleeve was designed
    // on, and `material` paints it behind them.
    colorways: stock(['orange', 'Orange', '#d8552a']),
    material: true,
    content: (color) => <SleeveCover material={color} />,
    // The jacket's reverse and both centre labels, because a record is a
    // four-sided print job and the disc peeks out past the sleeve edge - that
    // label is on stage whether or not anything is printed on it.
    render: ({ color, screen, surface, surfaceStyle, resolution }) => (
      <VinylRecord color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle} resolution={resolution}>
        {screen}
        {screen != null && (
          <>
            <VinylRecord.Back>
              <SleeveBack material={color} />
            </VinylRecord.Back>
            <VinylRecord.Label>
              <SleeveLabelA />
            </VinylRecord.Label>
            <VinylRecord.BackLabel>
              <SleeveLabelB />
            </VinylRecord.BackLabel>
          </>
        )}
      </VinylRecord>
    ),
  },
  {
    id: 'milk-carton',
    res: mmRes('milkCarton'),
    colorways: stock(['white', 'Coated white', '#f4f3ef']),
    material: true,
    content: (color) => <CartonFront material={color} />,
    // Every face is printed, because that is what a carton is: the front is
    // the `screen`, and the sides, the back and the roof carry what a dairy
    // puts there, all on the same board.
    render: ({ color, screen, surface, surfaceStyle, resolution }) => (
      <MilkCarton color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle} resolution={resolution}>
        {screen}
        {screen != null && (
          <>
            <MilkCarton.Right>
              <CartonFacts material={color} />
            </MilkCarton.Right>
            <MilkCarton.Left>
              <CartonStory material={color} />
            </MilkCarton.Left>
            <MilkCarton.Back>
              <CartonBack material={color} />
            </MilkCarton.Back>
            <MilkCarton.GableFront>
              <CartonRoof material={color} />
            </MilkCarton.GableFront>
          </>
        )}
      </MilkCarton>
    ),
  },
  {
    id: 'product-box',
    res: mmRes('productBox'),
    colorways: stock(
      ['white', 'Coated white', '#f4f1ea'],
      ['kraft', 'Kraft', '#c9a97b'],
      ['ink', 'Ink', '#20242c'],
      ['sage', 'Sage', '#b9c9b4']
    ),
    material: true,
    content: (color) => <CerealFront material={color} />,
    // A cereal box, which is what a 190 × 265 × 55 mm carton is: the bowl on
    // the front, the Nutrition Facts down one side, the mill's story down the
    // other, the best-by jetted on the top and a recipe on the back.
    render: ({ color, screen, surface, surfaceStyle, resolution }) => (
      <ProductBox color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle} resolution={resolution}>
        {screen}
        {screen != null && (
          <>
            <ProductBox.Right>
              <CerealFacts material={color} />
            </ProductBox.Right>
            <ProductBox.Left>
              <CerealStory material={color} />
            </ProductBox.Left>
            <ProductBox.Top>
              <CerealTop material={color} />
            </ProductBox.Top>
            <ProductBox.Back>
              <CerealBack material={color} />
            </ProductBox.Back>
          </>
        )}
      </ProductBox>
    ),
  },
  {
    id: 'mailer-box',
    res: mmRes('mailerBox'),
    tilt: 0.42,
    colorways: stock(
      ['white', 'Bleached white', '#e9e5dc'],
      ['kraft', 'Kraft', '#b5915f'],
      ['slate', 'Slate', '#5c6672']
    ),
    material: true,
    content: () => <BoxTop livery={NORTHLINE} />,
    // Northline's shipper, the one on /examples/fleet: the name and the field
    // on the lid under the tape, the name along both long sides, "this way
    // up" on the ends. The print is opaque, so the finish shows on the stock
    // the print leaves clear.
    render: ({ color, screen, surface, surfaceStyle, resolution }) => (
      <MailerBox
        color={color}
        tapeColor="rgba(20, 33, 61, 0.55)"
        surfaceBackground={surface}
        surfaceStyle={surfaceStyle}
        resolution={resolution}
      >
        {screen}
        {screen != null && (
          <>
            <MailerBox.Front>
              <BoxSide livery={NORTHLINE} />
            </MailerBox.Front>
            <MailerBox.Back>
              <BoxSide livery={NORTHLINE} />
            </MailerBox.Back>
            <MailerBox.Right>
              <BoxEnd livery={NORTHLINE} />
            </MailerBox.Right>
            <MailerBox.Left>
              <BoxEnd livery={NORTHLINE} />
            </MailerBox.Left>
          </>
        )}
      </MailerBox>
    ),
  },
  {
    id: 'shopping-bag',
    res: mmRes('shoppingBag'),
    colorways: stock(
      ['olive', 'Olive', '#7d8a5c'],
      ['kraft', 'Kraft', '#c19a6b'],
      ['white', 'Gloss white', '#f2efe9'],
      ['charcoal', 'Charcoal', '#33373d']
    ),
    material: true,
    content: (color) => <BagFront material={color} />,
    render: ({ color, screen, surface, surfaceStyle, resolution }) => (
      <ShoppingBag color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle} resolution={resolution}>
        {screen}
        {screen != null && (
          <ShoppingBag.Back>
            <BagBack material={color} />
          </ShoppingBag.Back>
        )}
      </ShoppingBag>
    ),
  },
  {
    id: 'poster-frame',
    res: mmRes('posterFrame'),
    colorways: stock(
      ['black', 'Black', '#22262e'],
      ['oak', 'Oak', '#b08a53'],
      ['walnut', 'Walnut', '#5a3a25'],
      ['white', 'White', '#e9e7e2']
    ),
    content: () => <SwissBill />,
    render: ({ color, screen, surface, surfaceStyle, resolution }) => (
      <PosterFrame color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle} resolution={resolution}>
        {screen}
      </PosterFrame>
    ),
  },
  {
    id: 'a-frame-sign',
    res: mmRes('aFrameSign'),
    colorways: stock(
      ['walnut', 'Walnut', '#4a3826'],
      ['black', 'Black', '#2a2c30'],
      ['birch', 'Birch', '#c8a97a']
    ),
    // A sandwich board is read from both directions, so both panels are set.
    // Bare children would fill the front and leave the back blank.
    content: () => (
      <>
        <AFrameSign.Front>
          <ChalkMenuArt />
        </AFrameSign.Front>
        <AFrameSign.Back>
          <ChalkHoursArt />
        </AFrameSign.Back>
      </>
    ),
    render: ({ color, screen, surface, surfaceStyle, resolution }) => (
      <AFrameSign color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle} resolution={resolution}>
        {screen}
      </AFrameSign>
    ),
  },
]

/**
 * A model's size and centre at unit scale, in the rig's units - measured, once
 * per id, from the geometry it actually renders.
 *
 * Sizing used to come from the library's framing data: each family's camera
 * distance, scaled to this one. That matches a model to its own docs page,
 * which is the wrong comparison on a stage where they stand in a row. A
 * MacBook framed to fill its own canvas covered two thirds of the area of the
 * iPad after it, the shopping bag's handles reached up into the swatches, and
 * a laptop, whose origin is its hinge, needed a hand-set nudge to sit level
 * with the rest. Measured bounds fit every model into the same box and centre
 * it on what is drawn, and a bus or a billboard needs no hand-tuned scale to
 * join them.
 *
 * `Box3.setFromObject` reads each mesh's bounding box, which three caches on
 * the geometry, so this is a walk over a few hundred boxes the first frame a
 * model exists and a map lookup after. It runs inside the slot's frame
 * callback, before that frame renders, so the model is never drawn at the
 * wrong size.
 */
interface Extent {
  scale: number
  /** Its box's centre relative to its origin, at unit scale. */
  cx: number
  cy: number
}
const EXTENTS = new Map<string, Extent>()
const bounds = new Box3()
const toRig = new Matrix4()

function extentOf(entry: Entry, g: Group): Extent {
  const known = EXTENTS.get(entry.id)
  if (known) return known
  // Measured as it will rest, tilt included: a mailer box tipped back to show
  // its lid is taller on screen than the same box lying flat.
  g.position.set(0, 0, 0)
  g.rotation.set(entry.tilt ?? 0, entry.yaw ?? 0, 0)
  g.scale.setScalar(1)
  g.updateWorldMatrix(true, true)
  bounds.setFromObject(g)
  // World to rig: the rig is scaled and dropped (see `RIG_DROP`), and the box
  // is wanted in the units the stage constants are written in.
  if (g.parent) bounds.applyMatrix4(toRig.copy(g.parent.matrixWorld).invert())
  const width = bounds.max.x - bounds.min.x
  const height = bounds.max.y - bounds.min.y
  const extent = {
    scale: width > 0 && height > 0 ? Math.min(STAGE_WIDTH / width, STAGE_HEIGHT / height) : 1,
    cx: (bounds.max.x + bounds.min.x) / 2,
    cy: (bounds.max.y + bounds.min.y) / 2,
  }
  EXTENTS.set(entry.id, extent)
  return extent
}

/**
 * The ones nobody expects from a mockup library: a billboard and a city bus.
 * They are what a screenshot-in-a-frame tool cannot do, so they are spread
 * through the run (see `ORDER`) rather than queued up after eighteen phones
 * and boxes.
 */
const SHOWPIECES: Entry[] = [
  {
    id: 'billboard',
    res: mmRes('billboard'),
    colorways: stock(
      ['steel', 'Steel', '#2c313a'],
      ['white', 'White', '#dcdcd8'],
      ['green', 'Green', '#2f4a3a']
    ),
    content: () => <BillboardAdArt />,
    render: ({ color, screen, surface, surfaceStyle, resolution }) => (
      <Billboard color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle} resolution={resolution}>
        {screen}
      </Billboard>
    ),
  },
  {
    id: 'bus',
    res: mmRes('bus', { coverage: 'perforated' }),
    // A full wrap is bought as a colour, so the swatches are the campaign's
    // flavours: each repaints the bus and swaps the fruit on every face (see
    // bus-wrap.tsx).
    swatchLabel: 'Flavour',
    colorways: SUNPEEL_FLAVOURS.map((f) => ({ id: f.id, name: f.name, color: f.ground })),
    // The curb side, three-quarters on from the nose, so the windscreen and
    // the lit destination sign are in the picture. The wrap is laid out
    // around the doors (see bus-wrap.tsx), so they no longer cut the art the
    // way they cut the old king-size panel, which is why this used to show
    // the street side flat on.
    yaw: -0.35,
    content: (color) => <SunpeelSide ground={color} />,
    // Wrapped all round as perforated film, the way a transit wrap runs over
    // the passenger glass - the doors and the driver's window stay clear -
    // and the destination sign lit above the windscreen, where a string gets
    // the library's own dot-matrix marquee.
    render: ({ color, screen, surface, surfaceStyle, resolution }) => (
      <Bus coverage="perforated" color={color} surfaceBackground={surface} surfaceStyle={surfaceStyle} resolution={resolution}>
        {screen != null && (
          <>
            <Bus.StreetSide>{screen}</Bus.StreetSide>
            <Bus.CurbSide>
              <SunpeelSide ground={color} doors />
            </Bus.CurbSide>
            <Bus.Rear>
              <SunpeelRear ground={color} />
            </Bus.Rear>
            <Bus.DestinationSign>42 DOWNTOWN VIA 5TH AVE</Bus.DestinationSign>
          </>
        )}
      </Bus>
    ),
  },
]

/**
 * The running order: the phones first, since they are what most visitors
 * came for, then a showpiece every few slides, so the breadth shows up inside
 * the first minute of autoplay.
 */
const ORDER = [
  'galaxy-s26',
  'iphone-17-pro',
  'galaxy-z-fold7',
  'galaxy-z-flip7',
  'billboard',
  'macbook-air-13',
  'ipad-pro-13',
  'galaxy-tab-s11',
  'apple-watch-ultra-4',
  'galaxy-watch-8',
  'studio-display',
  'bus',
  'book',
  'vinyl-record',
  'milk-carton',
  'product-box',
  'mailer-box',
  'shopping-bag',
  'poster-frame',
  'a-frame-sign',
]

const ENTRIES = new Map([...DEVICES, ...OBJECTS, ...SHOWPIECES].map((e) => [e.id, e]))

/** Everything on show, in running order. */
const SHOWCASE: Entry[] = ORDER.map((id) => ENTRIES.get(id)!)

const N = SHOWCASE.length

/**
 * Shortest signed distance from `x` to 0 on a ring of N - the float version,
 * so a slide that crosses the seam (last → 0) travels one step rather than
 * winding all the way back. This is what makes the loop endless in both
 * directions.
 */
function wrapDelta(x: number): number {
  const m = ((x % N) + N) % N
  return m > N / 2 ? m - N : m
}

/**
 * The rig scale the stylesheet is asking for, tracked across resizes.
 *
 * `--carousel-fit` is declared on `.carousel` with breakpoints (see
 * globals.css) rather than being computed here, so the carousel's proportions
 * stay next to the rest of the page's responsive design. Reading a custom
 * property is the only way to get it: media queries do not exist in the scene
 * graph, and the canvas element's own size does not tell us which breakpoint
 * the page thinks it is at.
 */
function useCarouselFit(ref: RefObject<HTMLElement | null>): number {
  const [fit, setFit] = useState(DEFAULT_FIT)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => {
      const raw = getComputedStyle(el).getPropertyValue('--carousel-fit')
      const value = Number.parseFloat(raw)
      if (Number.isFinite(value) && value > 0) setFit(value)
    }
    read()
    // Breakpoints are width-driven, and the element is full-bleed, so its own
    // box changing is exactly when the value can have changed.
    const observer = new ResizeObserver(read)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  return fit
}

/**
 * How far down the stage the staged model's centre lands, as a fraction of
 * the stage's height: what the hover washes and the chevrons centre on.
 *
 * Not the middle. The camera looks straight at world y = 0, but the model
 * stands `STAGE_Y` up a rig that is scaled by `fit` and then dropped by
 * `RIG_DROP` of what the scale took away - so it sits a little high, by an
 * amount that changes with each breakpoint's fit.
 */
function stageCentre(fit: number): number {
  const visible = 2 * CAMERA_Z * Math.tan((DEFAULT_CAMERA_FOV * Math.PI) / 360)
  const y = fit * STAGE_Y + ROW_Y * RIG_DROP * (1 - fit)
  return 0.5 - y / visible
}

/**
 * Eases the ring position toward its target once per frame.
 *
 * Every slot in both rows reads this one number, so the stage and the strip
 * beneath it are the same motion sampled at two scales - the strip cannot
 * drift out of step with the device on stage, and neither of them "swaps":
 * they travel.
 */
function Ticker({
  anim,
  target,
  tumble,
}: {
  anim: RefObject<number>
  target: RefObject<number>
  tumble: RefObject<Tumble>
}) {
  // Priority -2: the ring position and the tumble are inputs to every slot's
  // own -1 pass, which in turn has to land before drei's default-priority
  // <Html> sync (see StageSlot).
  useFrame((_, delta) => {
    anim.current += (target.current - anim.current) * (1 - Math.exp(-6 * delta))
    advanceTumble(tumble.current)
  }, -2)
  return null
}

/** One staged model, placed from the shared ring position every frame. */
function StageSlot({
  entry,
  index,
  anim,
  tumble,
  color,
}: {
  entry: Entry
  index: number
  anim: RefObject<number>
  tumble: RefObject<Tumble>
  color: string
}) {
  const group = useRef<Group>(null)
  const hovered = useRef(false)

  /*
   * Priority -1, then an explicit matrix flush.
   *
   * drei's <Html transform> places each live screen from its own
   * default-priority frame callback, reading the matrix three last computed -
   * during the PREVIOUS frame's render. Moving the object at -1 is only half
   * the fix; without recomputing the matrix here the screen still positions
   * itself from where the device used to be, and the DOM visibly trails the
   * body while a slide is in flight.
   */
  useFrame((state) => {
    const g = group.current
    if (!g) return
    const extent = extentOf(entry, g)
    const d = wrapDelta(index - anim.current)
    // 0 while centred, 1 once a full step out - drives everything that
    // distinguishes the device on stage from the ones flanking it.
    const t = Math.min(Math.abs(d), 1)
    const near = 1 - t
    const scale = extent.scale * (1 - (1 - SIDE_SCALE) * t) * (hovered.current && t > 0.5 ? 1.05 : 1)
    g.position.x = d * SPACING - extent.cx * scale
    g.position.y = STAGE_Y - extent.cy * scale + Math.sin(state.clock.elapsedTime * 1.1) * 0.05 * near
    g.position.z = -1.4 * t
    g.scale.setScalar(scale)
    g.rotation.y = (entry.yaw ?? 0) + BASE_RY + (tumble.current.yaw - BASE_RY) * near
    g.rotation.x = ((entry.tilt ?? 0) + tumble.current.pitch) * near
    g.updateMatrixWorld(true)
  }, -1)

  return (
    <group
      ref={group}
      onPointerOver={() => {
        hovered.current = true
      }}
      onPointerOut={() => {
        hovered.current = false
      }}
    >
      {entry.render({
        color,
        statusBar: entry.statusBarInk ? { color: entry.statusBarInk } : false,
        /*
         * Every staged slot carries its surface for as long as it exists -
         * including the two waiting off-stage. Mounting them as a model
         * reached the middle meant a fast run through the carousel was a
         * stream of screens arriving and leaving; now the DOM is created out
         * past the fade and simply travels with its model.
         */
        screen: entry.content(color),
        /*
         * No fill mode. The animation ends on opacity 1, which is where the
         * screen sits anyway, so filling buys nothing - and a filled animation
         * stays "in effect" forever, which keeps Chromium compositing every
         * screen on its own full-resolution layer for the life of the page.
         * On a high-DPI phone that is what tips the tile budget over and
         * leaves blank rectangles across the glass.
         */
        surfaceStyle: { animation: 'screen-fade-in 320ms ease' },
      })}
    </group>
  )
}

/** One thumbnail in the strip, scrolling on the same ring position. */
function RowSlot({
  entry,
  index,
  anim,
  color,
  onSelect,
}: {
  entry: Entry
  index: number
  anim: RefObject<number>
  color: string
  onSelect: () => void
}) {
  const group = useRef<Group>(null)
  const hovered = useRef(false)

  useFrame(() => {
    const g = group.current
    if (!g) return
    const extent = extentOf(entry, g)
    const d = wrapDelta(index - anim.current)
    const near = Math.max(0, 1 - Math.abs(d))
    const scale = extent.scale * ROW_SCALE * (1 + 0.3 * near) * (hovered.current ? 1.1 : 1)
    g.position.x = d * ROW_SPACING - extent.cx * scale
    g.position.y = ROW_Y - ROW_LOWER - extent.cy * scale
    g.scale.setScalar(scale)
    g.rotation.y = (entry.yaw ?? 0) + BASE_RY
    g.updateMatrixWorld(true)
  }, -1)

  return (
    <group
      ref={group}
      onClick={onSelect}
      onPointerOver={() => {
        hovered.current = true
      }}
      onPointerOut={() => {
        hovered.current = false
      }}
    >
      {entry.render({ color, screen: null, surface: ROW_SURFACE, resolution: ROW_RESOLUTION })}
    </group>
  )
}

/** Calls `onFrame` once, from the first frame the canvas actually draws. */
function OnFirstFrame({ onFrame }: { onFrame: () => void }) {
  const done = useRef(false)
  useFrame(() => {
    if (done.current) return
    done.current = true
    onFrame()
  })
  return null
}

/**
 * Whether `ref` is on screen in a visible tab - the condition for autoplay.
 *
 * The carousel used to advance on a bare interval from the moment it mounted:
 * behind another tab, or scrolled down to the footer, it kept stepping,
 * mounting models and compiling their shaders for nobody, and a visitor came
 * back to find it three slides on from where they left it.
 */
function useOnScreen(ref: RefObject<HTMLElement | null>): boolean {
  const [onScreen, setOnScreen] = useState(true)
  useEffect(() => {
    const el = ref.current
    let intersecting = true
    let visible = document.visibilityState !== 'hidden'
    const update = () => setOnScreen(intersecting && visible)
    const observer = el
      ? new IntersectionObserver(([entry]) => {
          intersecting = entry?.isIntersecting ?? true
          update()
        })
      : null
    if (el) observer?.observe(el)
    const onVisibility = () => {
      visible = document.visibilityState !== 'hidden'
      update()
    }
    document.addEventListener('visibilitychange', onVisibility)
    update()
    return () => {
      observer?.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [ref])
  return onScreen
}

/** Set once a visitor has dragged the carousel, so the hint is not repeated. */
const HINT_KEY = 'react-3d-mockups:carousel-hint'

/**
 * The longest a flick can carry past where the finger stopped, in slots.
 *
 * A browse drag is one-for-one, then the release speed carries it on. That
 * carry used to be free to round up to a second slot, so a short, fast swipe
 * - the ordinary way to say "next" on a phone - skipped one. Now a flick moves
 * one slot beyond the slot the drag started from; only a drag that itself
 * crossed further lands further.
 */
const MAX_FLICK_SLOTS = 1

export default function CarouselScene() {
  const [active, setActive] = useState(0)
  // Finish selection per model, defaulting to each palette's first swatch.
  const [finish, setFinish] = useState<Record<string, string>>({})
  /*
   * Autoplay: `null` until the visitor decides, which means "on, unless they
   * asked their system for less motion". The pause button and any interaction
   * set it explicitly.
   */
  const [auto, setAuto] = useState<boolean | null>(null)
  // What the live region says. Only changes the visitor makes are announced:
  // announcing every autoplay step read a new product name aloud every six
  // seconds to anyone with a screen reader on the page.
  const [announcement, setAnnouncement] = useState('')
  // Set once the first frame is on screen, so autoplay's first dwell is spent
  // on slide 01 rather than on an empty stage while the scene loads.
  const [ready, setReady] = useState(false)
  // After the first drag the gesture hint has done its job - on this visit
  // and, remembered, on the next (see `HINT_KEY`).
  const [interacted, setInteracted] = useState(false)
  const [hintSeen, setHintSeen] = useState(false)
  useEffect(() => {
    try {
      if (localStorage.getItem(HINT_KEY)) setHintSeen(true)
    } catch {
      // Storage blocked: the hint shows every visit, which is where it started.
    }
  }, [])
  useEffect(() => {
    if (!interacted) return
    try {
      localStorage.setItem(HINT_KEY, '1')
    } catch {}
  }, [interacted])
  const [copied, setCopied] = useState(false)

  // The ring position: `target` is unbounded so successive steps keep moving
  // in one direction across the seam; `anim` chases it.
  const target = useRef(0)
  const anim = useRef(0)
  const activeRef = useRef(0)
  const tumble = useRef<Tumble>(restingTumble())

  /** Move the readout and the render window without disturbing the ring. */
  const syncActive = useCallback((to: number) => {
    if (to === activeRef.current) return
    activeRef.current = to
    setActive(to)
  }, [])

  const goTo = useCallback(
    (next: number) => {
      const to = ((next % N) + N) % N
      target.current += wrapDelta(to - activeRef.current)
      tumble.current = restingTumble()
      syncActive(to)
    },
    [syncActive]
  )

  const step = useCallback((dir: number) => goTo(activeRef.current + dir), [goTo])

  /*
   * Auto-advance stops for good at the first sign of a visitor: `stop()` runs
   * on every arrow, swatch and pointer-down on the stage. A reduced-motion
   * preference keeps it off from the start, and the pause button beside the
   * hint stops or restarts it outright (WCAG 2.2.2 asks for exactly that on
   * anything that moves on its own for more than five seconds). It also waits
   * for the first frame, and holds while the stage is off screen or the tab is
   * hidden - see `useOnScreen`.
   */
  const reducedMotion = usePrefersReducedMotion()
  const autoOn = auto ?? !reducedMotion
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const onScreen = useOnScreen(stageRef)
  const playing = autoOn && ready && onScreen

  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => step(1), 6000)
    return () => clearInterval(t)
  }, [playing, step])

  const announce = useCallback((i: number) => {
    const to = ((i % N) + N) % N
    setAnnouncement(`${nameOf(SHOWCASE[to]!)}, ${to + 1} of ${N}`)
  }, [])
  const stop = () => setAuto(false)
  const go = (i: number) => {
    stop()
    goTo(i)
    announce(i)
  }
  /**
   * Play moves on at once rather than six seconds later: a button that
   * appears to do nothing for the length of a slide reads as broken, and the
   * step says what the button is for. The interval restarts from the press,
   * so the next slide is a full slide away.
   */
  const toggleAuto = () => {
    if (autoOn) {
      stop()
      return
    }
    setAuto(true)
    const to = activeRef.current + 1
    goTo(to)
    announce(to)
  }

  const fit = useCarouselFit(sectionRef)

  const drag = useRef<{
    /** Where the gesture started; `x`/`y` track the latest move. */
    x0: number
    y0: number
    x: number
    y: number
    zone: Zone
    orbiting: boolean
    moved: boolean
    /** Ring position when the gesture started, for direct-manipulation scroll. */
    from: number
    /** Slots per pixel at the stage's scale. */
    perPx: number
    /** Most recent horizontal speed, in px/ms, for the flick. */
    vx: number
    /**
     * When the last move happened: the event's own `timeStamp`, not the time
     * it was handled. A frame that stalls queues the moves behind it, and
     * timing them on arrival read a quick swipe as a slow one - no flick.
     */
    at: number
  } | null>(null)
  const moved = useRef(false)

  /**
   * Where a pointer is, in the terms the gestures care about.
   *
   * `device` spins the staged object, `left`/`right` browse, and `row` is the
   * strip - whose taps belong to r3f's raycaster, since which thumbnail you
   * hit is the whole point there.
   */
  type Zone = 'device' | 'left' | 'right' | 'row'

  const zoneAt = (clientX: number, clientY: number): Zone => {
    const r = stageRef.current?.getBoundingClientRect()
    if (!r) return 'row'
    if (clientY > r.top + r.height * 0.7) return 'row'
    if (Math.abs(clientX - (r.left + r.width / 2)) < r.width * 0.17) return 'device'
    return clientX < r.left + r.width / 2 ? 'left' : 'right'
  }

  /**
   * How far one slot is on screen. The stage's height covers a known slice of
   * the world at the camera's distance and fov, which converts world units to
   * pixels - so a browse drag can move the ring by exactly as much as the
   * cursor moved, and the device under the pointer stays under it.
   */
  const slotsPerPixel = () => {
    const height = stageRef.current?.clientHeight || 1
    const worldPerPx = (2 * CAMERA_Z * Math.tan((DEFAULT_CAMERA_FOV * Math.PI) / 360)) / height
    // A slot is `SPACING` world units at the rig's scale, so a scaled-down rig
    // means a shorter drag per slot - which is what keeps the device under the
    // finger on a phone, where the rig is smallest.
    return worldPerPx / (SPACING * fit)
  }

  /**
   * Which gesture the pointer is over, written straight to the element rather
   * than through state - this fires on every move. `left`/`right` also light
   * the matching edge, so the navigable region is visible before you commit.
   */
  const setZone = (clientX: number, clientY: number) => {
    const el = sectionRef.current
    if (el) el.dataset.zone = zoneAt(clientX, clientY)
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const zone = zoneAt(e.clientX, e.clientY)
    // r3f fires its click AFTER pointerup, by which time `drag` is cleared -
    // so whether the gesture moved has to outlive it, or a nudge on the staged
    // device reads as a tap and resets the very rotation it just started.
    moved.current = false
    drag.current = {
      x0: e.clientX,
      y0: e.clientY,
      x: e.clientX,
      y: e.clientY,
      zone,
      orbiting: zone === 'device',
      moved: false,
      from: anim.current,
      perPx: slotsPerPixel(),
      vx: 0,
      at: e.timeStamp,
    }
    if (sectionRef.current) sectionRef.current.dataset.dragging = 'true'
    // Touch has no hover, so this is the first chance to say which gesture the
    // finger is on: without it the edge under a tap never lights up.
    setZone(e.clientX, e.clientY)
    stop()
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) {
      setZone(e.clientX, e.clientY)
      return
    }
    if (Math.abs(e.clientX - d.x0) > 4 || Math.abs(e.clientY - d.y0) > 4) {
      d.moved = true
      moved.current = true
    }

    if (d.orbiting) {
      const height = stageRef.current?.clientHeight || 1
      tumble.current.pendingYaw += (2 * Math.PI * (e.clientX - d.x)) / height
      tumble.current.pendingPitch += (2 * Math.PI * (e.clientY - d.y)) / height
      d.x = e.clientX
      d.y = e.clientY
      return
    }

    /*
     * Not a browse drag until the gesture has actually travelled. A touch tap
     * is not one pointerdown and one pointerup: the browser fits a stationary
     * pointermove between them, and taking that as a drag pinned `anim` to
     * `target` mid-slide - freezing whatever was in flight, then re-reading the
     * active slot from wherever it froze. A tap on the left half would step
     * back from THAT slot rather than the one on stage, so on a phone the
     * carousel looked like it ignored every tap.
     */
    if (!d.moved) return

    // Browse drag: the ring follows the cursor one-for-one. `anim` is set with
    // `target` so the easing has nothing to catch up on mid-gesture - it takes
    // over only once the drag ends and the ring snaps to a slot.
    d.vx = (e.clientX - d.x) / Math.max(1, e.timeStamp - d.at)
    d.at = e.timeStamp
    d.x = e.clientX
    target.current = d.from - (e.clientX - d.x0) * d.perPx
    anim.current = target.current
    syncActive(((Math.round(anim.current) % N) + N) % N)
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    drag.current = null
    if (sectionRef.current) sectionRef.current.dataset.dragging = 'false'
    if (!d) return
    if (!d.moved) {
      // A click, not a drag. Either half of the stage steps one slot towards
      // the side you clicked - the side device, the chevron and the empty
      // space around them all do the same thing, every time. The strip is left
      // alone so its taps can pick out a specific thumbnail, and a click on
      // the staged device does nothing rather than resetting its pose.
      if (d.zone === 'left') go(activeRef.current - 1)
      else if (d.zone === 'right') go(activeRef.current + 1)
      return
    }
    setInteracted(true)
    if (d.orbiting) return
    // Carry the flick a little past where the finger stopped, then settle on
    // whichever slot that lands nearest - no further from the starting slot
    // than the drag itself got, or one slot, whichever is more.
    const flick = Math.max(-1.2, Math.min(1.2, -d.vx * d.perPx * 220))
    const start = Math.round(d.from)
    const reach = Math.max(MAX_FLICK_SLOTS, Math.abs(Math.round(anim.current) - start))
    target.current = start + Math.max(-reach, Math.min(reach, Math.round(anim.current + flick) - start))
    tumble.current = restingTumble()
    syncActive(((Math.round(target.current) % N) + N) % N)
    announce(target.current)
  }

  /** A tap on a thumbnail only counts when the gesture did not become a drag. */
  const select = (i: number) => () => {
    if (moved.current) return
    go(i)
  }

  const entry = SHOWCASE[active]!
  const selected = finish[entry.id] ?? entry.colorways[0]!.id
  // A phone comes in colorways; a carton or a bag is printed on a material;
  // a frame, a sign or a bus has a finish.
  const swatchesLabel = entry.swatchLabel ?? (DEVICES.includes(entry) ? 'Colorway' : entry.material ? 'Material' : 'Finish')
  const colorOf = (dev: Entry) => {
    const id = finish[dev.id] ?? dev.colorways[0]!.id
    return dev.colorways.find((c) => c.id === id)?.color ?? dev.colorways[0]!.color
  }
  const counter = `${String(active + 1).padStart(2, '0')} / ${N}`
  const docsHref = CATALOG.get(entry.id)?.href
  const colorway = entry.colorways.find((c) => c.id === selected) ?? entry.colorways[0]!
  const code = codeFor(entry, colorway)
  const copyCode = () => {
    if (!code) return
    navigator.clipboard?.writeText(code).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1600)
      },
      () => {}
    )
  }

  /**
   * Which slots exist. Both windows are wider than what is on screen so a slot
   * mounts out at the faded edge and slides in, rather than appearing in view.
   */
  const inWindow = (i: number, w: number) => Math.abs(wrapDelta(i - active)) <= w

  return (
    <section className="carousel" aria-label="Mockup carousel" ref={sectionRef}>
      {/*
       * The readout sits ABOVE the stage, directly under the page's headline -
       * it is the hero's subtitle now, so what the visitor reads first is the
       * object actually in front of them rather than a fixed line of copy.
       */}
      <div className="carousel-bar">
        <div className="carousel-nav">
          <button type="button" className="carousel-arrow" aria-label="Previous mockup" onClick={() => go(active - 1)}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <p className="carousel-readout">
            <span className="dim">{counter}</span> ·{' '}
            {/* The name is the way off the home page and into the object's own
                reference page - the model on stage is the one thing a visitor
                is already looking at, and until now nothing here was clickable. */}
            {docsHref ? (
              <Link className="carousel-readout-link" href={docsHref}>
                {nameOf(entry)}
              </Link>
            ) : (
              nameOf(entry)
            )}{' '}
            · {entry.res}
          </p>
          <button type="button" className="carousel-arrow" aria-label="Next mockup" onClick={() => go(active + 1)}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
        <div className="carousel-finishes">
          {/* The word "Colors" next to a row of coloured dots was labelling
              what the dots already say; the glyph holds the row's left edge
              without spelling it out, and the name stays for screen readers. */}
          <span className="carousel-finish-label" title={swatchesLabel}>
            <Palette size={15} strokeWidth={1.75} aria-hidden />
            <span className="sr-only">{swatchesLabel}</span>
          </span>
          <span className="carousel-swatches" role="group" aria-label={swatchesLabel}>
            {entry.colorways.map((c) => (
              <button
                key={c.id}
                type="button"
                className="carousel-swatch"
                aria-label={c.name}
                aria-pressed={c.id === selected}
                title={c.name}
                data-selected={c.id === selected}
                style={{ background: c.color }}
                onClick={() => {
                  stop()
                  setFinish((f) => ({ ...f, [entry.id]: c.id }))
                  // One full turn, queued into the same buffer a flick uses -
                  // so the finish is seen from every side, and it decelerates
                  // into place instead of stopping dead.
                  tumble.current.pendingYaw += 2 * Math.PI
                }}
              />
            ))}
          </span>
          <span className="carousel-finish-name">{colorway.name}</span>
        </div>
      </div>

      {/*
       * Stage and its overlays share one positioned box. The washes, the marks
       * and the glow are all placed off the top of the stage, so they need a
       * containing block that starts where the stage does - not one that starts
       * above the bar.
       */}
      <div
        className="carousel-viewport"
        style={{ '--stage-centre': `${(stageCentre(fit) * 100).toFixed(2)}%` } as CSSProperties}
      >
        <div className="carousel-glow" aria-hidden />

        {/*
         * Hover lighting, BEHIND the canvas. The canvas is alpha-transparent, so
         * a wash under it reads as light in the scene rather than a film over
         * the hardware - which is what it looked like when this sat on top.
         */}
        <div className="carousel-layer carousel-washes" aria-hidden>
          <span className="carousel-centre" />
          <span className="carousel-edge" data-side="left" />
          <span className="carousel-edge" data-side="right" />
        </div>

        <div
          className="carousel-stage"
          ref={stageRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            drag.current = null
            if (sectionRef.current) sectionRef.current.dataset.dragging = 'false'
          }}
          onPointerLeave={() => {
            if (sectionRef.current) sectionRef.current.dataset.zone = ''
          }}
        >
          {/*
           * `always`: every slot moves itself from its own frame callback, so
           * there is no prop change for an on-demand canvas to wake up for. The
           * library still stops the loop whenever the stage is off screen or
           * the tab is hidden.
           */}
          <MockupCanvas
            controls={false}
            shadows={false}
            frameloop="always"
            label="3D mockups of devices and printed products, one on stage at a time"
            camera={{ position: [0, 0, CAMERA_Z], fov: DEFAULT_CAMERA_FOV }}
          >
            <OnFirstFrame onFrame={() => setReady(true)} />
            <Ticker anim={anim} target={target} tumble={tumble} />

            {/* One group for the whole rig: the staged models, the gap between
                them and the strip below all shrink together, so a narrow canvas
                gets the same composition rather than a cropped one. */}
            <group scale={fit} position-y={ROW_Y * RIG_DROP * (1 - fit)}>
              {SHOWCASE.map((dev, i) =>
                inWindow(i, 2) ? (
                  <StageSlot
                    key={dev.id}
                    entry={dev}
                    index={i}
                    anim={anim}
                    tumble={tumble}
                    color={colorOf(dev)}
                  />
                ) : null
              )}

              {SHOWCASE.map((dev, i) =>
                inWindow(i, 3) ? (
                  <RowSlot
                    key={`row-${dev.id}`}
                    entry={dev}
                    index={i}
                    anim={anim}
                    color={colorOf(dev)}
                    onSelect={select(i)}
                  />
                ) : null
              )}
            </group>
          </MockupCanvas>
        </div>

        {/* In FRONT of the stage, so the device can never cover them. On
            touch these are the prev/next; on a desktop the arrows by the
            readout are, and these only light over the half a click steps to
            (see `.carousel-chevron`). */}
        <div className="carousel-layer carousel-marks">
          <button type="button" className="carousel-chevron" data-side="left" aria-label="Previous mockup" onClick={() => go(active - 1)}>
            <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button type="button" className="carousel-chevron" data-side="right" aria-label="Next mockup" onClick={() => go(active + 1)}>
            <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="carousel-foot">
        {/* The stage's two tools, together under it: autoplay's toggle and
            the model's code. They used to sit apart - the code pill at the
            end of the swatch row, which it is not one of, and the toggle
            beside a hint that fades, which left it stranded off-centre - and
            both in bordered mono capitals, a second voice on a page set in
            Inter. One capsule, centred on the stage they act on. */}
        <div className="carousel-tools" role="group" aria-label="Carousel controls">
          <button
            type="button"
            className="carousel-tool"
            onClick={toggleAuto}
            aria-label={autoOn ? 'Pause autoplay' : 'Play autoplay'}
          >
            {autoOn ? <Pause size={15} strokeWidth={2} aria-hidden /> : <Play size={15} strokeWidth={2} aria-hidden />}
            <span>{autoOn ? 'Pause' : 'Play'}</span>
          </button>
          {code ? (
            <>
              <span className="carousel-tools-rule" aria-hidden />
              <button
                type="button"
                className="carousel-tool"
                data-done={copied}
                onClick={copyCode}
                title="Copy the JSX for this mockup"
                aria-label={copied ? 'Code copied' : `Copy the code for this ${nameOf(entry)}`}
              >
                {copied ? <Check size={15} strokeWidth={2.2} aria-hidden /> : <CodeXml size={15} strokeWidth={2} aria-hidden />}
                <span>{copied ? 'Copied' : 'Copy code'}</span>
              </button>
            </>
          ) : null}
        </div>
        {/* The one hint - there used to be a "Drag to rotate" badge on the
            stage saying half of it again. In with the first frame, out at
            the first drag, and not back for a visitor who has dragged. */}
        <p className="carousel-hint" data-shown={ready && !interacted && !hintSeen}>
          <CarouselHintText />
        </p>
        {/* Announced politely, and only for changes the visitor made: the
            strip is WebGL geometry, so without this a screen-reader user
            pressing the arrows hears nothing change. */}
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
        {/* The strip is geometry in the canvas, so keyboard and screen-reader
            users get the same jumps from real buttons here. */}
        <div className="sr-only">
          {SHOWCASE.map((dev, i) => (
            <button key={dev.id} type="button" onClick={() => go(i)}>
              Show {nameOf(dev)}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
