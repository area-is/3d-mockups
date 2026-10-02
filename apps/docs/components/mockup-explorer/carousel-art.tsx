'use client'

import type { ReactNode } from 'react'
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
import { Newspaper, SwissSite, WatchFace } from '../screens/device-apps'
import { CartonBack, CartonFacts, CartonFront, CartonRoof, CartonRoofBack, CartonStory } from '../screens/carton-art'
import {
  BagBack,
  BagFront,
  CerealBack,
  CerealBottom,
  CerealFacts,
  CerealFront,
  CerealStory,
  CerealTop,
  MailerBack,
  MailerBottom,
  MailerEnd,
  MailerFront,
  MailerLid,
} from '../screens/package-art'
import { BillboardAdArt, ChalkHoursArt, ChalkMenuArt } from '../screens/print-art'
import { SunpeelRear, SunpeelRoute, SunpeelSide } from '../screens/bus-wrap'
import { KilnBack, KilnCover, KilnSpine } from '../screens/magazine-art'
import {
  GardenAfterDark,
  GardenBadge,
  GardenBadgeBack,
  GardenLeafletCover,
  GardenLeafletEvents,
  GardenLeafletMap,
  GardenLeafletVisit,
  GardenLeafletWalks,
  GardenLeafletWelcome,
  GardenPlate,
  GardenVanRear,
  GardenVanSide,
} from '../screens/garden-art'
import { MoreauCard, MoreauCardBack, MoreauSign, MoreauSignBack } from '../screens/studio-art'
import { LarkmoorCard, LarkmoorCardBack } from '../screens/bank-card-art'
import { TulipBack, TulipFront, TulipInsideLeft, TulipInsideRight } from '../screens/card-art'
import { ColdwellScreen, MarblePoster, ShelterArrivals, ShelterNotice, SignalBanner, StridePoster } from '../screens/street-art'
import {
  CrumbCakeWindow,
  CrumbCoffeeWindow,
  CrumbCroissantBay,
  CrumbDoor,
  CrumbFascia,
  CrumbLoafBay,
  CrumbRearWindow,
} from '../screens/bakery-art'
import {
  EmberBack,
  EmberBase,
  EmberEnd,
  EmberFront,
  EmberLid,
  EmberNotes,
  FieldlineRear,
  FieldlineSide,
} from '../screens/freight-art'

/**
 * What the home page's carousel puts on each object - so that an object's own
 * reference page can stage exactly the same thing.
 *
 * The carousel is the best argument this library has: eighteen objects, every
 * surface real DOM, the screens redrawing themselves. The reference pages used
 * to answer it with `LiveCounter` and `SurfaceArt` - a seconds counter and a
 * labelled swatch. Both are honest demos of the mechanism and neither shows
 * what the mechanism is *for*, so somebody who arrived from the carousel and
 * clicked through to the component found a plainer thing than the one that
 * brought them. Now the page stages the carousel's own artwork, and the
 * surface tabs print its source, which is the answer to "how is that done".
 *
 * ### Names, not nodes
 *
 * The map holds component *names* rather than elements, because a name is
 * worth two things here: `ART` below turns it into the live surface, and
 * `SCREEN_SOURCES` turns it into the source the tab shows. Keying on the
 * element would have meant a second table for the label, free to disagree
 * with the first.
 *
 * That second half is generated: `scripts/extract-demo-sources.mjs` reads the
 * imports at the top of THIS file to learn which components can be staged,
 * then walks each one's own imports and collects everything it is built from.
 * So a piece added to the carousel is a piece whose whole source the tab
 * already knows how to print - there is no list of art files to keep up.
 *
 * ### And the objects it does not carry
 *
 * The carousel is a selection; the catalogue is more. Every other print
 * object gets a job of its own below (`SAMPLE_ART`) - a magazine, a
 * botanical garden's leaflet and van, an architect's card and door sign, a
 * bank's debit card, a bakery front, a haulier's trailer - built the same way and drawn from the
 * same kind of generated cut-outs, so no reference page falls back to a
 * labelled placeholder. The carousel objects' faces it never turns to (a
 * box's bottom, a carton's back roof) are filled in the same way.
 *
 * ### It is a second list, and that is the cost
 *
 * `carousel-scene.tsx` has its own table of what goes on what. This one is
 * keyed by the explorer's `kind` and by region, because the carousel stages
 * one variant per family and only its primary face, while a reference page
 * has every variant and every region - so neither table is derivable from the
 * other. They share the artwork components themselves, which is the part that
 * matters; what can drift is only which piece goes where, and a piece landing
 * on the wrong page is visible the moment anybody looks at it.
 */

/** Region name → the artwork component the carousel stages there. */
export type CarouselFaces = Readonly<Record<string, string>>

export const CAROUSEL_ART: Readonly<Record<string, CarouselFaces>> = {
  // Devices carry one region, `screen`.
  galaxy: { screen: 'SwissRotation' },
  iphone: { screen: 'SwissRaster' },
  fold: { screen: 'Newspaper' },
  flip: { screen: 'SwissField' },
  laptop: { screen: 'SwissSite' },
  ipad: { screen: 'SwissEpicentre' },
  galaxyTab: { screen: 'SwissChecker' },
  appleWatch: { screen: 'SwissDialA' },
  galaxyWatch: { screen: 'WatchFace' },
  studioDisplay: { screen: 'SwissRhythm' },

  // Print objects carry as many faces as the thing has.
  book: { cover: 'JacketCover', spine: 'JacketSpine', back: 'JacketBack' },
  vinylRecord: {
    cover: 'SleeveCover',
    back: 'SleeveBack',
    label: 'SleeveLabelA',
    backLabel: 'SleeveLabelB',
  },
  milkCarton: {
    front: 'CartonFront',
    right: 'CartonFacts',
    left: 'CartonStory',
    back: 'CartonBack',
    gableFront: 'CartonRoof',
    gableBack: 'CartonRoofBack',
  },
  productBox: {
    front: 'CerealFront',
    right: 'CerealFacts',
    left: 'CerealStory',
    top: 'CerealTop',
    back: 'CerealBack',
    bottom: 'CerealBottom',
  },
  mailerBox: {
    top: 'MailerLid',
    front: 'MailerFront',
    right: 'MailerEnd',
    left: 'MailerEnd',
    back: 'MailerBack',
    bottom: 'MailerBottom',
  },
  shoppingBag: { front: 'BagFront', back: 'BagBack' },
  posterFrame: { poster: 'SwissBill' },
  billboard: { face: 'BillboardAdArt' },
  aFrameSign: { front: 'ChalkMenuArt', back: 'ChalkHoursArt' },
  bus: { curbSide: 'SunpeelSide', streetSide: 'SunpeelSide', rear: 'SunpeelRear', destinationSign: 'SunpeelRoute' },
}

/** The objects the carousel does not carry, each dressed as a job for a client of its own. */
export const SAMPLE_ART: Readonly<Record<string, CarouselFaces>> = {
  magazine: { cover: 'KilnCover', back: 'KilnBack', spine: 'KilnSpine' },
  brochure: {
    frontLeft: 'GardenLeafletCover',
    frontCenter: 'GardenLeafletWelcome',
    frontRight: 'GardenLeafletWalks',
    backLeft: 'GardenLeafletEvents',
    backCenter: 'GardenLeafletMap',
    backRight: 'GardenLeafletVisit',
  },
  businessCard: { front: 'MoreauCard', back: 'MoreauCardBack' },
  idCard: { front: 'GardenBadge', back: 'GardenBadgeBack' },
  creditCard: { front: 'LarkmoorCard', back: 'LarkmoorCardBack' },
  greetingCard: { front: 'TulipFront', insideLeft: 'TulipInsideLeft', insideRight: 'TulipInsideRight', back: 'TulipBack' },
  rollupBanner: { banner: 'SignalBanner' },
  busShelter: { poster: 'StridePoster', inner: 'MarblePoster', arrivals: 'ShelterArrivals', arrivalsBack: 'ShelterNotice' },
  doohTotem: { front: 'ColdwellScreen', back: 'GardenAfterDark' },
  storefront: {
    fascia: 'CrumbFascia',
    leftSign: 'CrumbFascia',
    rightSign: 'CrumbFascia',
    rearSign: 'CrumbFascia',
    frontLeft: 'CrumbLoafBay',
    frontRight: 'CrumbCroissantBay',
    door: 'CrumbDoor',
    left: 'CrumbCoffeeWindow',
    right: 'CrumbCakeWindow',
    rear: 'CrumbRearWindow',
  },
  van: { curbSide: 'GardenVanSide', streetSide: 'GardenVanSide', rear: 'GardenVanRear', licensePlate: 'GardenPlate' },
  semiTrailer: { curbSide: 'FieldlineSide', streetSide: 'FieldlineSide', rear: 'FieldlineRear' },
  customPanel: { front: 'MoreauSign', back: 'MoreauSignBack' },
  customBox: { front: 'EmberFront', back: 'EmberBack', left: 'EmberEnd', right: 'EmberNotes', top: 'EmberLid', bottom: 'EmberBase' },
}

/**
 * Where on the object a piece is going, for the pieces whose layout depends
 * on it: a vehicle's two flanks run in opposite directions, and a wrap that
 * covers the whole side is laid out around the cab and the arches where a
 * panel is not.
 */
export interface ArtPlacement {
  region: string
  /** A vehicle's `coverage`: `'panel'`, `'full'` or `'perforated'`. */
  coverage?: string
}

/**
 * Name → element, given the finish currently selected.
 *
 * The pieces that print onto the material take it (`material` - the record's
 * two jacket faces among them - or `cloth` for the book's jacket, which is a
 * sheet wrapped around one); the pieces that are their own sheet ignore it -
 * a poster, a screen, a record's paper labels. That split is the same one
 * the carousel makes.
 */
const ART: Readonly<Record<string, (finish: string, at: ArtPlacement) => ReactNode>> = {
  SwissRotation: () => <SwissRotation />,
  SwissRaster: () => <SwissRaster />,
  SwissField: () => <SwissField />,
  SwissEpicentre: () => <SwissEpicentre />,
  SwissChecker: () => <SwissChecker />,
  SwissDialA: () => <SwissDialA />,
  SwissRhythm: () => <SwissRhythm />,
  SwissBill: () => <SwissBill />,
  BillboardAdArt: () => <BillboardAdArt />,
  Newspaper: () => <Newspaper />,
  SwissSite: () => <SwissSite />,
  WatchFace: () => <WatchFace />,

  JacketCover: (finish) => <JacketCover cloth={finish} />,
  JacketSpine: (finish) => <JacketSpine cloth={finish} />,
  JacketBack: (finish) => <JacketBack cloth={finish} />,

  SleeveCover: (finish) => <SleeveCover material={finish} />,
  SleeveBack: (finish) => <SleeveBack material={finish} />,
  SleeveLabelA: () => <SleeveLabelA />,
  SleeveLabelB: () => <SleeveLabelB />,

  CartonFront: (finish) => <CartonFront material={finish} />,
  CartonFacts: (finish) => <CartonFacts material={finish} />,
  CartonStory: (finish) => <CartonStory material={finish} />,
  CartonBack: (finish) => <CartonBack material={finish} />,
  CartonRoof: (finish) => <CartonRoof material={finish} />,

  CerealFront: (finish) => <CerealFront material={finish} />,
  CerealFacts: (finish) => <CerealFacts material={finish} />,
  CerealStory: (finish) => <CerealStory material={finish} />,
  CerealTop: (finish) => <CerealTop material={finish} />,
  CerealBack: (finish) => <CerealBack material={finish} />,

  MailerLid: (finish) => <MailerLid material={finish} />,
  MailerFront: (finish) => <MailerFront material={finish} />,
  MailerEnd: (finish) => <MailerEnd material={finish} />,

  BagFront: (finish) => <BagFront material={finish} />,
  BagBack: (finish) => <BagBack material={finish} />,

  ChalkMenuArt: () => <ChalkMenuArt />,
  ChalkHoursArt: () => <ChalkHoursArt />,

  CartonRoofBack: (finish) => <CartonRoofBack material={finish} />,
  CerealBottom: (finish) => <CerealBottom material={finish} />,
  MailerBack: (finish) => <MailerBack material={finish} />,
  MailerBottom: (finish) => <MailerBottom material={finish} />,

  // The bus is bought as a colour: the wrap's ground is the paint.
  SunpeelSide: (finish, at) => (
    <SunpeelSide ground={finish} doors={at.region === 'curbSide'} panel={at.coverage === 'panel'} clearGlass={at.coverage === 'full'} />
  ),
  SunpeelRear: (finish, at) => <SunpeelRear ground={finish} panel={at.coverage === 'panel'} clearGlass={at.coverage === 'full'} />,
  SunpeelRoute: () => <SunpeelRoute />,

  KilnCover: () => <KilnCover />,
  KilnBack: () => <KilnBack />,
  KilnSpine: () => <KilnSpine />,

  GardenLeafletCover: (finish) => <GardenLeafletCover material={finish} />,
  GardenLeafletWelcome: (finish) => <GardenLeafletWelcome material={finish} />,
  GardenLeafletWalks: (finish) => <GardenLeafletWalks material={finish} />,
  GardenLeafletEvents: (finish) => <GardenLeafletEvents material={finish} />,
  GardenLeafletMap: (finish) => <GardenLeafletMap material={finish} />,
  GardenLeafletVisit: (finish) => <GardenLeafletVisit material={finish} />,
  GardenBadge: (finish) => <GardenBadge material={finish} />,
  GardenBadgeBack: (finish) => <GardenBadgeBack material={finish} />,
  GardenVanSide: (finish, at) => (
    <GardenVanSide material={finish} full={at.coverage !== 'panel'} street={at.region === 'streetSide'} />
  ),
  GardenVanRear: (finish) => <GardenVanRear material={finish} />,
  GardenPlate: () => <GardenPlate />,
  GardenAfterDark: () => <GardenAfterDark />,

  MoreauCard: (finish) => <MoreauCard material={finish} />,
  MoreauCardBack: (finish) => <MoreauCardBack material={finish} />,
  MoreauSign: (finish) => <MoreauSign material={finish} />,
  MoreauSignBack: (finish) => <MoreauSignBack material={finish} />,

  LarkmoorCard: (finish) => <LarkmoorCard material={finish} />,
  LarkmoorCardBack: (finish) => <LarkmoorCardBack material={finish} />,

  TulipFront: (finish) => <TulipFront material={finish} />,
  TulipInsideLeft: (finish) => <TulipInsideLeft material={finish} />,
  TulipInsideRight: (finish) => <TulipInsideRight material={finish} />,
  TulipBack: (finish) => <TulipBack material={finish} />,

  SignalBanner: () => <SignalBanner />,
  StridePoster: () => <StridePoster />,
  MarblePoster: () => <MarblePoster />,
  ShelterArrivals: () => <ShelterArrivals />,
  ShelterNotice: () => <ShelterNotice />,
  ColdwellScreen: () => <ColdwellScreen />,

  CrumbFascia: () => <CrumbFascia />,
  CrumbLoafBay: () => <CrumbLoafBay />,
  CrumbCroissantBay: () => <CrumbCroissantBay />,
  CrumbDoor: () => <CrumbDoor />,
  CrumbCoffeeWindow: () => <CrumbCoffeeWindow />,
  CrumbCakeWindow: () => <CrumbCakeWindow />,
  CrumbRearWindow: () => <CrumbRearWindow />,

  FieldlineSide: (finish, at) => <FieldlineSide material={finish} street={at.region === 'streetSide'} />,
  FieldlineRear: (finish) => <FieldlineRear material={finish} />,

  EmberFront: (finish) => <EmberFront material={finish} />,
  EmberBack: (finish) => <EmberBack material={finish} />,
  EmberEnd: (finish) => <EmberEnd material={finish} />,
  EmberNotes: (finish) => <EmberNotes material={finish} />,
  EmberLid: (finish) => <EmberLid material={finish} />,
  EmberBase: (finish) => <EmberBase material={finish} />,
}

/**
 * Which component is staged on one region of one kind - the carousel's own
 * piece, or the sample job for an object it does not carry - or `null` where
 * there is none. The caller falls back to its own demo content there, which
 * is what keeps this an enhancement rather than a dependency.
 *
 * Separate from `carouselArtNode` so the source panel can ask for the name
 * without building an element it will not render.
 */
export function carouselArtName(kind: string, region: string): string | null {
  const name = CAROUSEL_ART[kind]?.[region] ?? SAMPLE_ART[kind]?.[region]
  return name && ART[name] ? name : null
}

/** The live surface for a name from `carouselArtName`, on the given finish, for the region it is going on. */
export function carouselArtNode(name: string, finish: string, at: ArtPlacement = { region: '' }): ReactNode {
  return ART[name]?.(finish, at) ?? null
}
