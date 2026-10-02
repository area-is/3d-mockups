import * as React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { linearTiming, springTiming, TransitionSeries } from '@remotion/transitions'
import { clockWipe } from '@remotion/transitions/clock-wipe'
import { iris } from '@remotion/transitions/iris'
import { slide } from '@remotion/transitions/slide'
import { wipe } from '@remotion/transitions/wipe'
import '@fontsource-variable/inter'
import '@fontsource/anton'
import {
  AppleWatch,
  AppleWatchMockup,
  CustomBox,
  FoldMockup,
  IPhone,
  IPhoneMockup,
  Laptop,
  MailerBox,
  MockupCanvas,
  mockupInfo,
} from 'react-3d-mockups'
import { APPLE_WATCH_FRAMING, CUSTOM_BOX_FRAMING, LAPTOP_FRAMING, MAILER_BOX_FRAMING } from 'react-3d-mockups/core'
import { useMockupCapture } from '../../use-mockup-capture'
import { easeInOut, easeOut, tween, type Vec3 } from '../../reel/motion'
import { CameraRig, Cut, Drift, Floor, FontGate, orbitAt, RIG_START, useEnvelope, useStage } from '../kit'
import {
  COLOURWAYS,
  CountdownScreen,
  DISPLAY,
  KITE,
  KiteGlyph,
  KiteLogo,
  LookbookScreen,
  MailerEnd,
  MailerLid,
  MailerSide,
  ProductScreen,
  SANS,
  ShoeboxLabel,
  ShoeboxLid,
  ShoeboxSide,
  StoreScreen,
  WorkoutScreen,
  type Colourway,
} from './art'

/*
 * KITE AERO 2 - "Run lighter."
 *
 * A running shoe's drop, told on the devices it happens on: the shoe tears
 * across the title, sits on the app's product page through its three
 * colourways and then lifts off the glass; a foldable counts down and opens
 * on the lookbook; a watch on a tempo run gets the shipping note; the boxes
 * land; and the whole drop lies on a desk, shot from overhead.
 */

export const KITE_SHOTS = { title: 90, phone: 150, fold: 130, watch: 110, boxes: 130, desk: 150, outro: 72, transition: 12 }
const CUTS = 6
export const KITE_DURATION =
  KITE_SHOTS.title + KITE_SHOTS.phone + KITE_SHOTS.fold + KITE_SHOTS.watch + KITE_SHOTS.boxes + KITE_SHOTS.desk + KITE_SHOTS.outro - KITE_SHOTS.transition * CUTS

const FONTS = ['40px Anton', '700 40px "Inter Variable"']

/** Speed lines: thin streaks tearing right to left, a pure function of the frame. */
function Streaks({ frame, color = '255,255,255', count = 26, speed = 1, opacity = 0.5 }: { frame: number; color?: string; count?: number; speed?: number; opacity?: number }) {
  const { width } = useVideoConfig()
  const u = width / 1920
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {Array.from({ length: count }, (_, i) => {
        const length = 140 + ((i * 97) % 420)
        const v = (34 + ((i * 53) % 60)) * speed
        const x = 2200 - ((i * 331 + frame * v) % 2800)
        const y = 40 + ((i * 211) % 1000)
        const a = (0.25 + ((i * 37) % 70) / 100) * opacity
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x * u,
              top: y * u,
              width: length * u,
              height: (1.5 + (i % 3)) * u,
              borderRadius: 4 * u,
              background: `linear-gradient(90deg, rgba(${color},${a}), rgba(${color},0))`,
            }}
          />
        )
      })}
    </AbsoluteFill>
  )
}

/** Condensed display type laid over a shot. */
function Shout({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const { width } = useVideoConfig()
  const u = width / 1920
  return <div style={{ position: 'absolute', fontFamily: DISPLAY, lineHeight: 0.9, fontSize: 120 * u, letterSpacing: '0.005em', ...style }}>{children}</div>
}

/* ------------------------------------------------------------------ */
/*  1. Title                                                           */
/* ------------------------------------------------------------------ */

function TitleShot() {
  const frame = useCurrentFrame()
  const { width, fps } = useVideoConfig()
  const u = width / 1920
  // The shoe tears in from the left and lands in the middle of the name.
  const at = (f: number) => tween(f, 6, 34, 0, 1, easeOut)
  const pose = (f: number) => {
    const t = at(f)
    return { x: -500 + 1460 * t, y: 620 - 120 * t + Math.sin((f / fps) * 3) * 8 * t, rotate: -34 + 26 * t, scale: 0.6 + 0.45 * t }
  }
  const fill = tween(frame, 10, 36, 0, 100, easeOut)
  const kicker = useEnvelope(34, 14, 0)
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 80% at 50% 50%, #202329 0%, ${KITE.graphite} 70%)` }}>
      <Streaks frame={frame} opacity={0.55} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', fontFamily: DISPLAY, fontSize: 560 * u, lineHeight: 1, letterSpacing: '0.01em' }}>
          <span style={{ color: 'transparent', WebkitTextStroke: `${2.5 * u}px rgba(243,243,239,0.6)` }}>AERO 2</span>
          <span style={{ position: 'absolute', inset: 0, color: KITE.volt, clipPath: `inset(0 ${100 - fill}% 0 0)` }}>AERO 2</span>
        </div>
      </AbsoluteFill>
      {/* the trail: the same shoe a few frames ago, fading */}
      {[6, 4, 2, 0].map((lag) => {
        const p = pose(frame - lag)
        return (
          <Cut
            key={lag}
            name="kite-hero"
            style={{
              left: p.x * u,
              top: p.y * u,
              width: 760 * u,
              transform: `translate(-50%, -50%) rotate(${p.rotate}deg) scale(${p.scale})`,
              opacity: lag === 0 ? 1 : (1 - at(frame)) * (0.5 - lag * 0.06),
              filter: lag === 0 ? `drop-shadow(0 ${40 * u}px ${40 * u}px rgba(0,0,0,0.55))` : `blur(${lag * 2 * u}px)`,
            }}
          />
        )
      })}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 90 * u, display: 'flex', justifyContent: 'center', gap: 28 * u, alignItems: 'center', opacity: kicker, color: KITE.chalk, fontFamily: SANS, fontWeight: 800, fontSize: 26 * u, letterSpacing: '0.3em' }}>
        <KiteLogo size={44 * u} color={KITE.chalk} glyph={KITE.volt} />
        <span>DROP 10.09</span>
      </div>
    </AbsoluteFill>
  )
}

/* ------------------------------------------------------------------ */
/*  2. The app                                                         */
/* ------------------------------------------------------------------ */

/** Where the shoe sits on the glass at `LIFT`, measured from a still of the shot. */
const LIFT = 112
const ON_GLASS = { x: 1269, y: 417, width: 356, rotate: -9 }

function PhoneShot() {
  const frame = useCurrentFrame()
  const { width } = useVideoConfig()
  const u = width / 1920
  const { fps } = useVideoConfig()
  // No idle float here: the phone has to be still, and exactly square, when the shoe lifts.
  const stage = useStage(false)
  const settle = 1 - tween(frame, 60, LIFT - 6, 0, 1)
  const bob = Math.sin((frame / fps) * 2.2) * 0.06 * settle
  const pick = interpolate(frame, [36, 50, 78, 92], [0, 1, 1, 2], { easing: easeInOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const current = COLOURWAYS[Math.round(pick)]!
  // The phone settles square to camera for the lift, so the shoe leaves the glass where it sat.
  const turn = tween(frame, 0, LIFT - 6, 0.5, 0)
  const tilt = tween(frame, 0, LIFT - 6, 0.12, 0)
  const lift = tween(frame, LIFT, LIFT + 26, 0, 1, easeInOut)
  return (
    <AbsoluteFill>
      {COLOURWAYS.map((c, i) => (
        <AbsoluteFill key={c.id} style={{ background: `radial-gradient(ellipse 90% 90% at 65% 45%, ${c.ground} 0%, ${c.deep} 100%)`, opacity: Math.max(0, 1 - Math.abs(pick - i)) }} />
      ))}
      <div style={{ position: 'absolute', left: -200 * u, top: -100 * u, transform: `rotate(-12deg) translateX(${-frame * 2 * u}px)`, fontFamily: DISPLAY, fontSize: 330 * u, lineHeight: 0.95, color: 'rgba(0,0,0,0.07)', whiteSpace: 'nowrap' }}>
        AERO 2 AERO 2 AERO 2
        <br />
        AERO 2 AERO 2 AERO 2
        <br />
        AERO 2 AERO 2 AERO 2
      </div>
      <IPhoneMockup {...stage} variant="18promax" color="black" statusBar position={[1.45, -0.05 + bob, 0]} rotation={[tilt, turn, 0]}>
        <ProductScreen pick={pick} shoeOpacity={frame < LIFT ? 1 : 0} />
      </IPhoneMockup>
      <Shout style={{ left: 120 * u, top: 250 * u, color: current.ink, fontSize: 132 * u }}>
        THREE
        <br />
        COLOURS.
        <br />
        <span style={{ color: 'transparent', WebkitTextStroke: `${3 * u}px ${current.ink}` }}>ONE LIGHT</span>
        <br />
        <span style={{ color: 'transparent', WebkitTextStroke: `${3 * u}px ${current.ink}` }}>SHOE.</span>
      </Shout>
      <div style={{ position: 'absolute', left: 124 * u, top: 860 * u, fontFamily: SANS, fontWeight: 800, fontSize: 28 * u, letterSpacing: '0.24em', color: current.ink }}>
        {current.name.toUpperCase()} · $160
      </div>
      {/* the lift: the shoe comes off the glass and fills the frame on its way to the next shot */}
      {frame >= LIFT && (
        <Cut
          name={current.art}
          style={{
            left: (ON_GLASS.x - 520 * lift) * u,
            top: (ON_GLASS.y + 90 * lift) * u,
            width: ON_GLASS.width * (1 + 2.6 * lift) * u,
            transform: `translate(-50%, -50%) rotate(${ON_GLASS.rotate + 6 * lift}deg)`,
            filter: `drop-shadow(0 ${(10 + 50 * lift) * u}px ${(14 + 40 * lift) * u}px rgba(0,0,0,${0.3 + 0.2 * lift}))`,
          }}
        />
      )}
    </AbsoluteFill>
  )
}

/* ------------------------------------------------------------------ */
/*  3. The foldable                                                    */
/* ------------------------------------------------------------------ */

const OPEN_FROM = 38

function FoldShot() {
  const frame = useCurrentFrame()
  const { width } = useVideoConfig()
  const u = width / 1920
  const stage = useStage()
  const seconds = 3 - frame / 11
  const openAngle = tween(frame, OPEN_FROM, OPEN_FROM + 56, 0, 180, easeInOut)
  const rotation: Vec3 = [0.1, tween(frame, 0, 130, -0.85, 0.08), 0]
  // The cover display is lit until 30 degrees; the content follows the lit display.
  const cover = openAngle < 30
  const live = useEnvelope(OPEN_FROM + 50, 14, 0)
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 70% at 55% 50%, #24272e 0%, ${KITE.graphite} 75%)` }}>
      <Streaks frame={frame} opacity={0.3} />
      <div style={{ position: 'absolute', left: 960 * u - 450 * u, top: 540 * u - 450 * u, width: 900 * u, height: 900 * u, borderRadius: '50%', background: 'radial-gradient(circle, rgba(214,255,58,0.22) 0%, rgba(214,255,58,0) 65%)' }} />
      <FoldMockup {...stage} variant="fold8" color="graphite" statusBar openAngle={Math.round(openAngle)} position={[0.3, -0.05, 0]} rotation={rotation}>
        {cover ? <CountdownScreen seconds={seconds} /> : <LookbookScreen start={OPEN_FROM + 14} />}
      </FoldMockup>
      <Shout style={{ left: 110 * u, top: 90 * u, color: KITE.chalk, fontSize: 96 * u, opacity: live }}>
        THE DROP <span style={{ color: KITE.volt }}>IS LIVE.</span>
      </Shout>
    </AbsoluteFill>
  )
}

/* ------------------------------------------------------------------ */
/*  4. The watch                                                       */
/* ------------------------------------------------------------------ */

function WatchShot() {
  const frame = useCurrentFrame()
  const { width, durationInFrames } = useVideoConfig()
  const u = width / 1920
  const stage = useStage()
  const camera = { position: [0, 0.3, tween(frame, 0, durationInFrames, 8.6, 6.6)] as Vec3, fov: 40 }
  const kicker = useEnvelope(60, 14, 0)
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 90% at 60% 45%, ${KITE.volt} 0%, #b9e01f 100%)` }}>
      <Streaks frame={frame} color="13,14,17" opacity={0.22} speed={1.4} />
      <div style={{ position: 'absolute', left: 60 * u, top: 120 * u, fontFamily: DISPLAY, fontSize: 380 * u, lineHeight: 0.85, color: 'rgba(13,14,17,0.08)' }}>
        TEMPO
      </div>
      <Cut name="kite-runner" style={{ left: (300 - frame * 0.8) * u, top: 70 * u, height: 1010 * u, filter: `drop-shadow(${30 * u}px ${30 * u}px ${30 * u}px rgba(0,0,0,0.2))` }} />
      <AppleWatchMockup {...stage} variant="ultra4" color="black" camera={camera} position={[1.75, -0.05, 0]} rotation={[0.08, tween(frame, 0, durationInFrames, 0.75, -0.25), 0]}>
        <WorkoutScreen notifyAt={52} />
      </AppleWatchMockup>
      <div style={{ position: 'absolute', right: 110 * u, bottom: 90 * u, textAlign: 'right', fontFamily: DISPLAY, fontSize: 64 * u, lineHeight: 1, color: KITE.graphite, opacity: kicker }}>
        4:38 /KM.
        <br />
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 28 * u }}>Feels like an easy day.</span>
      </div>
    </AbsoluteFill>
  )
}

/* ------------------------------------------------------------------ */
/*  5. The boxes                                                       */
/* ------------------------------------------------------------------ */

/*
 * The shipper is modelled at 78 mm per unit; the shoe box is a CustomBox
 * at the real 330 × 120 × 210 mm, scaled onto the shipper's units so it
 * sits on the lid at its true size.
 */
const SHOEBOX = { width: 330, height: 120, depth: 210 }
const MAILER_MM = mockupInfo('mailerBox').mmPerUnit
const SHOEBOX_ON_MAILER = mockupInfo('customBox', { size: SHOEBOX }).mmPerUnit / MAILER_MM
const MAILER_EXTENT = MAILER_BOX_FRAMING.extent({})
const BOX_GROUND = -MAILER_EXTENT

/** Every printed face of a shoe box, as slots (they must be the box's direct children, so this returns a fragment). */
function shoeboxFaces(colourway: Colourway) {
  return (
    <>
      <CustomBox.Top>
        <ShoeboxLid colourway={colourway} />
      </CustomBox.Top>
      <CustomBox.Front>
        <ShoeboxSide colourway={colourway} />
      </CustomBox.Front>
      <CustomBox.Back>
        <ShoeboxSide colourway={colourway} />
      </CustomBox.Back>
      <CustomBox.Right>
        <ShoeboxLabel colourway={colourway} />
      </CustomBox.Right>
      <CustomBox.Left>
        <ShoeboxLabel colourway={colourway} />
      </CustomBox.Left>
    </>
  )
}

function BoxesShot() {
  const frame = useCurrentFrame()
  const { fps, width } = useVideoConfig()
  const u = width / 1920
  const delayCapture = useMockupCapture()
  const volt = COLOURWAYS[0]!
  const drop = spring({ frame: frame - 14, fps, config: { damping: 13, stiffness: 150, mass: 1 } })
  const shoeboxY = MAILER_EXTENT + CUSTOM_BOX_FRAMING.extent({ size: SHOEBOX }) * SHOEBOX_ON_MAILER + (1 - drop) * 4.5
  const orbit = orbitAt(frame, [
    { frame: 0, target: [0, 0.5, 0], distance: 11.5, azimuth: -0.7, elevation: 0.3, fov: 38 },
    { frame: 130, target: [0, 0.6, 0], distance: 9.6, azimuth: 0.45, elevation: 0.55, fov: 38 },
  ])
  const caption = useEnvelope(40, 14, 0)
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #eeede8 0%, #dcdad3 55%, #cfccc4 100%)' }}>
      <MockupCanvas controls={false} delayCapture={delayCapture} camera={RIG_START} shadowY={BOX_GROUND} label="The KITE shipper and shoe box">
        <CameraRig orbit={orbit} />
        <Floor y={BOX_GROUND} color="#d3d0c8" radius={14} />
        <MailerBox color="#1a1b1e" tapeColor={KITE.volt} rotation={[0, 0.2, 0]}>
          <MailerBox.Top>
            <MailerLid />
          </MailerBox.Top>
          <MailerBox.Front>
            <MailerSide />
          </MailerBox.Front>
          <MailerBox.Back>
            <MailerSide />
          </MailerBox.Back>
          {/* Printed ends, so the wrapped tape is the volt overlay: an unprinted end keeps kraft tape whatever `tapeColor` says. */}
          <MailerBox.Left>
            <MailerEnd />
          </MailerBox.Left>
          <MailerBox.Right>
            <MailerEnd />
          </MailerBox.Right>
        </MailerBox>
        <CustomBox size={SHOEBOX} color={volt.ground} position={[0.15, shoeboxY, 0.1]} rotation={[0, -0.18 + (1 - drop) * 0.5, 0]} scale={SHOEBOX_ON_MAILER}>
          {shoeboxFaces(volt)}
        </CustomBox>
      </MockupCanvas>
      <Shout style={{ left: 110 * u, top: 90 * u, color: KITE.graphite, fontSize: 110 * u, opacity: caption, transform: `translateY(${(1 - caption) * 20 * u}px)` }}>
        AT YOUR DOOR
        <br />
        BY FRIDAY.
      </Shout>
    </AbsoluteFill>
  )
}

/* ------------------------------------------------------------------ */
/*  6. The desk, from overhead                                         */
/* ------------------------------------------------------------------ */

/*
 * The drop at true relative size, laid on a desk: everything is scaled onto
 * the laptop's 72.4 mm per unit and set on one floor - the phone lying flat
 * (half its thickness up), the watch standing on its strap, the shoe box on
 * its base. The camera starts straight down and cranes to a three-quarter.
 */
const LAPTOP_MM = mockupInfo('laptop').mmPerUnit
const on = (mm: number) => mm / LAPTOP_MM
const PHONE_SCALE = on(mockupInfo('iphone').mmPerUnit)
const WATCH_SCALE = on(mockupInfo('appleWatch').mmPerUnit)
const BOX_SCALE = on(mockupInfo('customBox', { size: SHOEBOX }).mmPerUnit)
const DESK = -1.2
const LAPTOP_OPEN = 100

function DeskShot() {
  const frame = useCurrentFrame()
  const { width } = useVideoConfig()
  const u = width / 1920
  const delayCapture = useMockupCapture()
  const ember = COLOURWAYS[2]!
  const orbit = orbitAt(frame, [
    { frame: 0, target: [-0.3, DESK, 0.3], distance: 12.5, azimuth: 0.0, elevation: 1.38, fov: 40 },
    { frame: 30, target: [-0.3, DESK, 0.3], distance: 12.0, azimuth: 0.08, elevation: 1.3, fov: 40 },
    { frame: 130, target: [-0.9, DESK + 1.0, -0.5], distance: 12.6, azimuth: -0.45, elevation: 0.34, fov: 38 },
  ])
  const line = useEnvelope(96, 14, 0)
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 80% at 50% 45%, #25282e 0%, ${KITE.graphite} 80%)` }}>
      <MockupCanvas controls={false} delayCapture={delayCapture} camera={RIG_START} shadowY={DESK} label="The KITE drop on a desk">
        <CameraRig orbit={orbit} />
        <Floor y={DESK} color="#1e2025" radius={16} hold={0.5} />
        <Laptop variant="pro14" color="spaceblack" openAngle={LAPTOP_OPEN} position={[0, DESK + LAPTOP_FRAMING.extent({ variant: 'pro14' }), 0]}>
          <StoreScreen />
        </Laptop>
        <IPhone
          variant="18pro"
          color="black"
          statusBar
          scale={PHONE_SCALE}
          position={[3.25, DESK + on(8.75) / 2 + 0.005, 1.15]}
          rotation={[-Math.PI / 2, 0, -0.32]}
        >
          <ProductScreen pick={0} />
        </IPhone>
        <AppleWatch variant="ultra4" color="black" scale={WATCH_SCALE} position={[2.55, DESK + APPLE_WATCH_FRAMING.extent({ variant: 'ultra4' }) * WATCH_SCALE, -1.05]} rotation={[0, -0.5, 0]}>
          <WorkoutScreen notifyAt={-20} />
        </AppleWatch>
        <CustomBox size={SHOEBOX} color={ember.ground} scale={BOX_SCALE} position={[-4.3, DESK + CUSTOM_BOX_FRAMING.extent({ size: SHOEBOX }) * BOX_SCALE, -2.2]} rotation={[0, 0.3, 0]}>
          {shoeboxFaces(ember)}
        </CustomBox>
      </MockupCanvas>
      <Shout style={{ left: 110 * u, top: 90 * u, color: KITE.chalk, fontSize: 110 * u, opacity: line }}>
        RUN <span style={{ color: KITE.volt }}>LIGHTER.</span>
      </Shout>
    </AbsoluteFill>
  )
}

/* ------------------------------------------------------------------ */
/*  End card                                                           */
/* ------------------------------------------------------------------ */

function Outro() {
  const frame = useCurrentFrame()
  const { width, fps } = useVideoConfig()
  const u = width / 1920
  const swing = spring({ frame: frame - 2, fps, config: { damping: 9, stiffness: 90 } })
  const line = useEnvelope(16, 14, 0)
  return (
    <AbsoluteFill style={{ background: KITE.graphite, alignItems: 'center', justifyContent: 'center', color: KITE.chalk }}>
      <Streaks frame={frame} opacity={0.25} count={18} />
      <div style={{ transform: `rotate(${(1 - swing) * -40}deg) translateY(${(1 - swing) * -120 * u}px)`, transformOrigin: '50% 0%' }}>
        <KiteGlyph size={150 * u} color={KITE.volt} />
      </div>
      <div style={{ fontFamily: DISPLAY, fontSize: 210 * u, lineHeight: 1, marginTop: 10 * u, opacity: swing }}>KITE</div>
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 30 * u, letterSpacing: '0.32em', marginTop: 24 * u, opacity: line }}>
        AERO 2 · <span style={{ color: KITE.volt }}>10.09</span> · IN THE KITE APP
      </div>
      <Drift name="kite-sky" x={1680} y={250} width={420} rotate={-14 + frame * 0.05} blur={6} opacity={0.9} />
      <Drift name="kite-ember" x={250} y={860} width={460} rotate={10 - frame * 0.05} blur={6} opacity={0.9} flip />
    </AbsoluteFill>
  )
}

export function KiteFilm() {
  const { width, height } = useVideoConfig()
  const timing = linearTiming({ durationInFrames: KITE_SHOTS.transition })
  const springy = springTiming({ durationInFrames: KITE_SHOTS.transition, config: { damping: 200 } })
  return (
    <FontGate fonts={FONTS}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={KITE_SHOTS.title}>
          <TitleShot />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: 'from-right' })} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={KITE_SHOTS.phone}>
          <PhoneShot />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={iris({ width, height })} timing={springy} />
        <TransitionSeries.Sequence durationInFrames={KITE_SHOTS.fold}>
          <FoldShot />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={springy} />
        <TransitionSeries.Sequence durationInFrames={KITE_SHOTS.watch}>
          <WatchShot />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={clockWipe({ width, height })} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={KITE_SHOTS.boxes}>
          <BoxesShot />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: 'from-bottom' })} timing={springy} />
        <TransitionSeries.Sequence durationInFrames={KITE_SHOTS.desk}>
          <DeskShot />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: 'from-left' })} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={KITE_SHOTS.outro}>
          <Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </FontGate>
  )
}
