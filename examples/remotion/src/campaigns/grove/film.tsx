import * as React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { linearTiming, springTiming, TransitionSeries } from '@remotion/transitions'
import { iris } from '@remotion/transitions/iris'
import { pushCut } from '@remotion/transitions/push-cut'
import { slide } from '@remotion/transitions/slide'
import { wipe } from '@remotion/transitions/wipe'
import '@fontsource-variable/inter'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/fraunces/wght-italic.css'
import {
  AFrameSign,
  Billboard,
  BusShelter,
  LEDText,
  MilkCarton,
  MilkCartonMockup,
  MockupCanvas,
  ShoppingBagMockup,
  Van,
  mockupInfo,
} from 'react-3d-mockups'
import { A_FRAME_SIGN_FRAMING, BILLBOARD_FRAMING, BUS_SHELTER_FRAMING, MILK_CARTON_FRAMING, VAN_FRAMING } from 'react-3d-mockups/core'
import { useMockupCapture } from '../../use-mockup-capture'
import { easeOut, tween, type Vec3 } from '../../reel/motion'
import { CameraRig, Drift, Floor, FontGate, orbitAt, OverlapProbe, RIG_START, settle, useEnvelope, useStage, Words } from '../kit'
import {
  BagBack,
  BagFront,
  Billboard as BillboardArt,
  CartonBack,
  CartonFacts,
  CartonFront,
  CartonGable,
  CartonStory,
  FLAVOURS,
  GROVE,
  KRAFT,
  MenuBoard,
  MenuBoardBack,
  SANS,
  SERIF,
  ShelterInner,
  ShelterPoster,
  VanRear,
  VanSide,
  Wordmark,
  type Flavour,
} from './art'

/*
 * GROVE - "Squeezed this morning."
 *
 * One juice brand from the carton out to the street: the hero carton in a
 * pool of morning light, the range dropping onto a table, the bag swinging
 * home, the corner it is sold on (a bus shelter and a sidewalk board on one
 * stage), the van that brought it, and the billboard over the road.
 */

export const GROVE_SHOTS = { hero: 140, lineup: 140, bag: 110, street: 170, van: 110, billboard: 110, outro: 72, transition: 12 }
const CUTS = 6
export const GROVE_DURATION =
  GROVE_SHOTS.hero + GROVE_SHOTS.lineup + GROVE_SHOTS.bag + GROVE_SHOTS.street + GROVE_SHOTS.van + GROVE_SHOTS.billboard + GROVE_SHOTS.outro - GROVE_SHOTS.transition * CUTS

const FONTS = ['760 40px "Fraunces Variable"', 'italic 420 40px "Fraunces Variable"', '600 40px "Inter Variable"']

/** Every wall of the carton, printed for one flavour. */
function cartonFaces(f: Flavour) {
  return (
    <>
      <MilkCarton.Front>
        <CartonFront flavour={f} />
      </MilkCarton.Front>
      <MilkCarton.Right>
        <CartonStory flavour={f} />
      </MilkCarton.Right>
      <MilkCarton.Left>
        <CartonFacts />
      </MilkCarton.Left>
      <MilkCarton.Back>
        <CartonBack flavour={f} />
      </MilkCarton.Back>
      <MilkCarton.GableFront>
        <CartonGable flavour={f} />
      </MilkCarton.GableFront>
      <MilkCarton.GableBack>
        <CartonGable flavour={f} />
      </MilkCarton.GableBack>
    </>
  )
}

/**
 * A solid colour behind a stage, lit a little brighter where the object
 * stands: `[centre, body, edge]`.
 */
const backdrop = ([centre, body, edge]: [string, string, string]) =>
  `radial-gradient(ellipse 90% 80% at 50% 42%, ${centre} 0%, ${body} 55%, ${edge} 100%)`

/**
 * Words set huge in the brand serif, outlined, running across the backdrop
 * behind the stage - `speed` px a frame, leftward when positive.
 */
function Marquee({ text, top, stroke, speed }: { text: string; top: number; stroke: string; speed: number }) {
  const frame = useCurrentFrame()
  const { width } = useVideoConfig()
  const u = width / 1920
  return (
    <div
      style={{
        position: 'absolute',
        top: top * u,
        left: (speed > 0 ? -200 - frame * speed : -2400 - frame * speed) * u,
        whiteSpace: 'nowrap',
        fontFamily: SERIF,
        fontWeight: 760,
        fontSize: 470 * u,
        letterSpacing: '-0.05em',
        color: 'transparent',
        WebkitTextStroke: `${2.2 * u}px ${stroke}`,
      }}
    >
      {Array.from({ length: 4 }, () => text).join(' · ')}
    </div>
  )
}

/** Big display type laid over a shot. */
function Headline({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const { width } = useVideoConfig()
  const u = width / 1920
  return (
    <div style={{ position: 'absolute', fontFamily: SERIF, fontWeight: 640, letterSpacing: '-0.04em', lineHeight: 0.92, fontSize: 132 * u, ...style }}>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  1. The hero carton                                                 */
/* ------------------------------------------------------------------ */

function HeroShot() {
  const frame = useCurrentFrame()
  const { width, durationInFrames } = useVideoConfig()
  const u = width / 1920
  const stage = useStage()
  const blood = FLAVOURS[0]!
  // The front, then a turn onto the side wall that tells you who pressed it.
  const turn = tween(frame, 18, durationInFrames - 6, 0.42, -0.95)
  const scale = tween(frame, 0, durationInFrames, 0.9, 1.04)
  const kicker = useEnvelope(4, 14, 10)
  const standfirst = useEnvelope(40, 16, 10)
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 95% at 70% 38%, #fff7e8 0%, #fde3c2 42%, #f2b07e 100%)' }}>
      {/* the low sun the brand always prints behind its fruit */}
      <div
        style={{
          position: 'absolute',
          left: 1340 * u - 330 * u,
          top: (250 - frame * 0.5) * u,
          width: 660 * u,
          height: 660 * u,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 42% 40%, #ffc779, #f58a3c 70%, #ee7a33)',
          opacity: 0.9,
        }}
      />
      {/* far set: small, sharp, slow */}
      <Drift name="grove-slice" x={880 - frame * 0.4} y={180 + frame * 0.25} width={150} rotate={frame * 0.6} blur={1.5} />
      <Drift name="grove-leaves" x={1800 + frame * 0.3} y={830 - frame * 0.2} width={260} rotate={-30 + frame * 0.1} blur={1.5} />
      <MilkCartonMockup {...stage} color={blood.ground} resolution={720} position={[1.75, -0.12, 0]} rotation={[0.04, turn, 0]} scale={scale}>
        {cartonFaces(blood)}
      </MilkCartonMockup>
      {/* near set: big, soft, fast - and kept to the corners, never across the carton */}
      <Drift name="grove-blood-orange" x={170 - frame * 0.6} y={1070} width={460} rotate={-12 + frame * 0.05} blur={14} />
      <Drift name="grove-slice" x={420 - frame * 0.8} y={40 + frame * 0.4} width={300} rotate={40 - frame * 0.4} blur={10} />
      <div style={{ position: 'absolute', left: 130 * u, top: 300 * u, color: GROVE.green }}>
        <div style={{ opacity: kicker, transform: `translateY(${(1 - kicker) * 16 * u}px)`, marginBottom: 26 * u }}>
          <Wordmark size={`${64 * u}px`} color={GROVE.green} />
        </div>
        <Headline style={{ position: 'relative', fontSize: 150 * u }}>
          <Words text="Squeezed" start={10} />
          <br />
          <span style={{ fontStyle: 'italic', fontWeight: 420 }}>
            <Words text="this morning." start={18} />
          </span>
        </Headline>
        <div style={{ fontFamily: SANS, fontSize: 30 * u, fontWeight: 500, marginTop: 34 * u, maxWidth: 560 * u, lineHeight: 1.4, opacity: standfirst }}>
          Cold-pressed blood orange, from one grove forty minutes up the road.
        </div>
      </div>
    </AbsoluteFill>
  )
}

/* ------------------------------------------------------------------ */
/*  2. The range                                                       */
/* ------------------------------------------------------------------ */

const CARTON_GROUND = -MILK_CARTON_FRAMING.extent({})
/** How far above the table the cartons are let go. */
/** Each carton is set down from two centimetres above the table. */
const SET_DOWN = 20 / mockupInfo('milkCarton').mmPerUnit

function LineupShot() {
  const frame = useCurrentFrame()
  const { width } = useVideoConfig()
  const u = width / 1920
  const delayCapture = useMockupCapture()
  const xs = [-2.6, 0, 2.6]
  const orbit = orbitAt(frame, [
    { frame: 0, target: [0, 0.4, 0], distance: 11.6, azimuth: -0.18, elevation: 0.16, fov: 38 },
    { frame: 140, target: [0, 0.2, 0], distance: 9.9, azimuth: 0.14, elevation: 0.1, fov: 38 },
  ])
  const caption = useEnvelope(64, 16, 12)
  return (
    <AbsoluteFill style={{ background: backdrop(['#2a5139', GROVE.green, GROVE.deep]) }}>
      {/* the name, outlined and running behind the range */}
      <Marquee text="grove" top={180} stroke="rgba(248,241,227,0.22)" speed={3} />
      <MockupCanvas controls={false} delayCapture={delayCapture} camera={RIG_START} shadowY={CARTON_GROUND} label="Three Grove cartons">
        <CameraRig orbit={orbit} />
        <Floor y={CARTON_GROUND} color="#28503a" radius={12} />
        <OverlapProbe names={FLAVOURS.map((f) => f.id)} frame={frame} />
        {FLAVOURS.map((f, i) => {
          // Each carton is set down on the table a beat after the last: lowered the
          // last two centimetres and coming to rest as it touches, straight down,
          // never tipped or spun, so it lands where it was held, clear of its
          // neighbours.
          const lift = settle(frame, 4 + i * 6, SET_DOWN)
          const turn = tween(frame, 78 + i * 6, 128 + i * 6, 0, -0.62)
          return (
            <MilkCarton key={f.id} name={f.id} color={f.ground} position={[xs[i]!, lift, 0]} rotation={[0, turn - 0.08 * (i - 1), 0]}>
              {cartonFaces(f)}
            </MilkCarton>
          )
        })}
      </MockupCanvas>
      {/* slices falling past the lens, down the margins either side of the range */}
      <Drift name="grove-slice" x={150 + frame * 0.3} y={-120 + frame * 6.2} width={200} rotate={frame * 2} blur={9} />
      <Drift name="grove-slice" x={1780 - frame * 0.2} y={-300 + frame * 7.4} width={240} rotate={-frame * 1.6} blur={12} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 70 * u,
          textAlign: 'center',
          color: GROVE.cream,
          fontFamily: SERIF,
          fontSize: 64 * u,
          fontWeight: 600,
          letterSpacing: '-0.03em',
          opacity: caption,
          transform: `translateY(${(1 - caption) * 20 * u}px)`,
        }}
      >
        Three flavours. <span style={{ fontStyle: 'italic', fontWeight: 400 }}>Nothing else.</span>
      </div>
    </AbsoluteFill>
  )
}

/* ------------------------------------------------------------------ */
/*  3. The bag                                                         */
/* ------------------------------------------------------------------ */

function BagShot() {
  const frame = useCurrentFrame()
  const { width, fps } = useVideoConfig()
  const u = width / 1920
  const stage = useStage(false)
  // Carried: a slow turn, and the swing a bag has on its handles.
  const sway = Math.sin((frame / fps) * 2.4) * 0.06 * tween(frame, 0, 90, 1, 0.5)
  const rotation: Vec3 = [0.03, tween(frame, 0, 110, -0.55, 0.32), sway]
  const bob = Math.sin((frame / fps) * 2.4 + 1.2) * 0.05
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 90% at 62% 45%, #d8452c 0%, ${GROVE.blood} 55%, #7c140f 100%)` }}>
      {/* a slice for a sun, turning behind the bag */}
      <Drift name="grove-slice" x={1180} y={520} width={980} rotate={frame * 0.35} opacity={0.95} />
      <ShoppingBagMockup {...stage} color={KRAFT} handleColor="#2a2016" resolution={640} position={[1.3, -0.5 + bob, 0]} rotation={rotation} scale={0.88}>
        <ShoppingBagMockup.Front>
          <BagFront />
        </ShoppingBagMockup.Front>
        <ShoppingBagMockup.Back>
          <BagBack />
        </ShoppingBagMockup.Back>
      </ShoppingBagMockup>
      <Drift name="grove-leaves" x={1860 - frame * 0.3} y={120 + frame * 0.3} width={340} rotate={160 + frame * 0.2} blur={12} />
      <Drift name="grove-leaves" x={120 + frame * 0.9} y={980 - frame * 0.6} width={360} rotate={-20} blur={10} />
      <Headline style={{ left: 130 * u, top: 360 * u, color: GROVE.cream, fontSize: 150 * u }}>
        <Words text="Good" start={6} />
        <br />
        <span style={{ fontStyle: 'italic', fontWeight: 420 }}>
          <Words text="to go." start={12} />
        </span>
      </Headline>
    </AbsoluteFill>
  )
}

/* ------------------------------------------------------------------ */
/*  4. The corner it is sold on                                        */
/* ------------------------------------------------------------------ */

/*
 * The shelter and the sidewalk board on one stage, at their true sizes:
 * the board is modelled at 280 mm per unit and the shelter at 700, so the
 * board is scaled onto the shelter's units.
 */
const SHELTER_MM = mockupInfo('busShelter').mmPerUnit
const STREET_GROUND = -BUS_SHELTER_FRAMING.extent()
const SIGN_SCALE = mockupInfo('aFrameSign').mmPerUnit / SHELTER_MM
const SIGN_AT: Vec3 = [5.1, STREET_GROUND + A_FRAME_SIGN_FRAMING.extent() * SIGN_SCALE, 1.9]

function StreetShot() {
  const frame = useCurrentFrame()
  const { width } = useVideoConfig()
  const u = width / 1920
  const delayCapture = useMockupCapture()
  // One slow push-in on the whole corner, still while the shot comes in.
  const corner = { target: [0.6, 0.45, 0.6] as Vec3, elevation: 0.14, fov: 38 }
  const orbit = orbitAt(frame, [
    { frame: 0, ...corner, distance: 13.8, azimuth: 0.56 },
    { frame: 14, ...corner, distance: 13.8, azimuth: 0.56 },
    { frame: 170, ...corner, distance: 12.4, azimuth: 0.64 },
  ])
  const caption = useEnvelope(96, 16, 12)
  return (
    <AbsoluteFill style={{ background: backdrop(['#ffd968', GROVE.lemon, '#d9a514']) }}>
      <Marquee text="around the corner" top={150} stroke="rgba(29,58,42,0.16)" speed={-2.6} />
      <MockupCanvas controls={false} delayCapture={delayCapture} camera={RIG_START} shadowY={STREET_GROUND} label="A bus shelter and a sidewalk sign">
        <CameraRig orbit={orbit} />
        <Floor y={STREET_GROUND} color="#e8b923" radius={26} />
        <OverlapProbe names={['shelter', 'sign']} frame={frame} />
        <BusShelter name="shelter" color="#2b3a33">
          <BusShelter.Poster>
            <ShelterPoster />
          </BusShelter.Poster>
          <BusShelter.Inner>
            <ShelterInner />
          </BusShelter.Inner>
          <BusShelter.Arrivals>
            <LEDText mode="rows" text={['12  Orchard Rd   2 min', '40  Market St    6 min', 'N3  Harbour     11 min']} />
          </BusShelter.Arrivals>
        </BusShelter>
        <AFrameSign name="sign" color="#3b2a1d" position={SIGN_AT} rotation={[0, -0.35, 0]} scale={SIGN_SCALE}>
          <AFrameSign.Front>
            <MenuBoard />
          </AFrameSign.Front>
          <AFrameSign.Back>
            <MenuBoardBack />
          </AFrameSign.Back>
        </AFrameSign>
      </MockupCanvas>
      <Headline style={{ left: 110 * u, bottom: 90 * u, color: GROVE.green, fontSize: 104 * u, opacity: caption, transform: `translateY(${(1 - caption) * 20 * u}px)` }}>
        On your corner
        <br />
        <span style={{ fontStyle: 'italic', fontWeight: 420 }}>before you are.</span>
      </Headline>
    </AbsoluteFill>
  )
}

/* ------------------------------------------------------------------ */
/*  5. The van                                                         */
/* ------------------------------------------------------------------ */

const VAN_GROUND = -VAN_FRAMING.extent()

function VanShot() {
  const frame = useCurrentFrame()
  const delayCapture = useMockupCapture()
  // From the tail, round to the curb side, coming to rest on the name.
  const orbit = orbitAt(frame, [
    { frame: 0, target: [-1.2, 0.0, 0], distance: 8.6, azimuth: -0.95, elevation: 0.12, fov: 36 },
    { frame: 110, target: [0.3, -0.1, 0], distance: 9.4, azimuth: 0.28, elevation: 0.08, fov: 36 },
  ])
  return (
    <AbsoluteFill style={{ background: backdrop(['#e2573b', '#c8321f', '#8f1d12']) }}>
      <Marquee text="delivered daily" top={200} stroke="rgba(255,240,222,0.2)" speed={3} />
      <MockupCanvas controls={false} delayCapture={delayCapture} camera={RIG_START} shadowY={VAN_GROUND} label="The Grove delivery van">
        <CameraRig orbit={orbit} />
        <Floor y={VAN_GROUND} color="#b42c1b" radius={22} />
        <Van color={GROVE.green} coverage="full">
          <Van.CurbSide>
            <VanSide />
          </Van.CurbSide>
          <Van.StreetSide>
            <VanSide street />
          </Van.StreetSide>
          <Van.Rear>
            <VanRear />
          </Van.Rear>
          <Van.LicensePlate>GROVE 8</Van.LicensePlate>
        </Van>
      </MockupCanvas>
    </AbsoluteFill>
  )
}

/* ------------------------------------------------------------------ */
/*  6. The billboard                                                   */
/* ------------------------------------------------------------------ */

const BILLBOARD_GROUND = -BILLBOARD_FRAMING.extent()

function BillboardShot() {
  const frame = useCurrentFrame()
  const delayCapture = useMockupCapture()
  // Start on the line itself, then pull back and down until it is a sign over the road.
  const orbit = orbitAt(
    frame,
    [
      { frame: 0, target: [-1.2, 0.05, 0], distance: 3.0, azimuth: 0.06, elevation: 0.0, fov: 34 },
      { frame: 110, target: [-0.75, -0.15, 0], distance: 7.4, azimuth: -0.42, elevation: -0.12, fov: 40 },
    ],
    easeOut
  )
  return (
    <AbsoluteFill style={{ background: backdrop(['#a8daf2', '#7ec3e6', '#4f9cc6']) }}>
      <Marquee text="fresh every morning" top={140} stroke="rgba(255,255,255,0.42)" speed={-2.6} />
      <MockupCanvas controls={false} delayCapture={delayCapture} camera={RIG_START} shadowY={BILLBOARD_GROUND} label="A Grove billboard">
        <CameraRig orbit={orbit} />
        <Floor y={BILLBOARD_GROUND} color="#6fb3d9" radius={20} />
        <Billboard color="#3a3f3c">
          <BillboardArt />
        </Billboard>
      </MockupCanvas>
    </AbsoluteFill>
  )
}

/* ------------------------------------------------------------------ */
/*  The end card                                                       */
/* ------------------------------------------------------------------ */

function Outro() {
  const frame = useCurrentFrame()
  const { width } = useVideoConfig()
  const u = width / 1920
  const mark = tween(frame, 4, 26, 0, 1, easeOut)
  const line = useEnvelope(18, 16, 0)
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 70% at 50% 50%, #2a5139 0%, ${GROVE.green} 60%, ${GROVE.deep} 100%)`, alignItems: 'center', justifyContent: 'center' }}>
      <Drift name="grove-blood-orange" x={300} y={880} width={520} rotate={-8 + frame * 0.1} blur={6} opacity={0.95} />
      <Drift name="grove-lemon-ginger" x={1640} y={190} width={460} rotate={12 - frame * 0.1} blur={6} opacity={0.95} />
      <Drift name="grove-green-apple" x={1690} y={920} width={380} rotate={-6} blur={8} opacity={0.9} />
      <div style={{ transform: `scale(${0.86 + mark * 0.14})`, opacity: mark }}>
        <Wordmark size={`${250 * u}px`} color={GROVE.cream} leaf="#8cc66b" />
      </div>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 52 * u, color: GROVE.cream, marginTop: 40 * u, opacity: line }}>
        Cold-pressed in small batches.
      </div>
    </AbsoluteFill>
  )
}

export function GroveFilm() {
  const { width, height } = useVideoConfig()
  const timing = linearTiming({ durationInFrames: GROVE_SHOTS.transition })
  const springy = springTiming({ durationInFrames: GROVE_SHOTS.transition, config: { damping: 200 } })
  return (
    <FontGate fonts={FONTS}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={GROVE_SHOTS.hero}>
          <HeroShot />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={pushCut({ flashColor: GROVE.cream })} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={GROVE_SHOTS.lineup}>
          <LineupShot />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={iris({ width, height })} timing={springy} />
        <TransitionSeries.Sequence durationInFrames={GROVE_SHOTS.bag}>
          <BagShot />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={springy} />
        <TransitionSeries.Sequence durationInFrames={GROVE_SHOTS.street}>
          <StreetShot />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: 'from-left' })} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={GROVE_SHOTS.van}>
          <VanShot />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: 'from-bottom' })} timing={springy} />
        <TransitionSeries.Sequence durationInFrames={GROVE_SHOTS.billboard}>
          <BillboardShot />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={iris({ width, height })} timing={springy} />
        <TransitionSeries.Sequence durationInFrames={GROVE_SHOTS.outro}>
          <Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </FontGate>
  )
}
