import * as React from 'react'
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { linearTiming, springTiming, TransitionSeries } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { iris } from '@remotion/transitions/iris'
import { slide } from '@remotion/transitions/slide'
import { wipe } from '@remotion/transitions/wipe'
import '@fontsource/instrument-serif'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource-variable/instrument-sans'
import {
  BrochureMockup,
  DOOHTotem,
  GreetingCardMockup,
  IDCardMockup,
  Magazine,
  MockupCanvas,
  RollupBanner,
  VinylRecord,
  mockupInfo,
} from 'react-3d-mockups'
import { DOOH_TOTEM_FRAMING, MAGAZINE_FRAMING, ROLLUP_BANNER_FRAMING, VINYL_RECORD_FRAMING } from 'react-3d-mockups/core'
import { useMockupCapture } from '../../use-mockup-capture'
import { easeInOut, easeOut, tween, type Vec3 } from '../../reel/motion'
import { CameraRig, Cut, Drift, Floor, FontGate, orbitAt, OverlapProbe, RIG_START, useEnvelope, useStage, Vignette } from '../kit'
import {
  ARTISTS,
  GateScreen,
  InviteBack,
  InviteFront,
  InviteInsideLeft,
  InviteInsideRight,
  LUMEN,
  Mark,
  PassBack,
  PassFront,
  ProgrammeCover,
  ProgrammeMap,
  ProgrammeNight,
  RecordLabel,
  RecordSleeve,
  SANS,
  SERIF,
  WayfindingBanner,
  WelcomeBanner,
  ZineCover,
} from './art'

/*
 * LUMEN - "Three nights in the Glasshouse."
 *
 * A festival told through the things you hold and pass on the way in: the
 * invitation opening as a moth crosses it, the programme unfolding, the
 * artist pass turning on its lanyard, the live record spinning beside the
 * zine, and the gate at night - a screen and two banners under string
 * lights.
 */

export const LUMEN_SHOTS = { invite: 150, programme: 120, pass: 110, record: 140, gate: 180, outro: 80, transition: 12 }
const CUTS = 5
export const LUMEN_DURATION =
  LUMEN_SHOTS.invite + LUMEN_SHOTS.programme + LUMEN_SHOTS.pass + LUMEN_SHOTS.record + LUMEN_SHOTS.gate + LUMEN_SHOTS.outro - LUMEN_SHOTS.transition * CUTS

const FONTS = ['40px "Instrument Serif"', 'italic 40px "Instrument Serif"', '600 40px "Instrument Sans Variable"']

/* ------------------------------------------------------------------ */
/*  Atmosphere                                                         */
/* ------------------------------------------------------------------ */

/** Festoon lights strung across the top of the frame, each bulb twinkling on its own phase. */
function StringLights({ frame, y = 90, sag = 70, strands = 2, opacity = 1 }: { frame: number; y?: number; sag?: number; strands?: number; opacity?: number }) {
  return (
    <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity, pointerEvents: 'none' }}>
      <defs>
        <radialGradient id="bulb">
          <stop offset="0" stopColor="#fff4d6" />
          <stop offset="0.35" stopColor={LUMEN.amber} stopOpacity="0.9" />
          <stop offset="1" stopColor={LUMEN.amber} stopOpacity="0" />
        </radialGradient>
      </defs>
      {Array.from({ length: strands }, (_, s) => {
        const top = y + s * 120
        const x0 = -60 + s * 240
        const x1 = 1980 - s * 180
        const dip = sag + s * 30
        const at = (t: number) => {
          const x = x0 + (x1 - x0) * t
          return [x, top + 4 * dip * t * (1 - t)] as const
        }
        const d = Array.from({ length: 41 }, (_, i) => at(i / 40))
          .map(([x, py], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${py.toFixed(1)}`)
          .join(' ')
        return (
          <g key={s}>
            <path d={d} stroke="rgba(20,20,20,0.7)" strokeWidth={2} fill="none" />
            {Array.from({ length: 18 }, (_, i) => {
              const [x, py] = at((i + 0.5) / 18)
              const twinkle = 0.7 + 0.3 * Math.sin(frame * 0.18 + i * 1.7 + s * 2.3)
              return <circle key={i} cx={x} cy={py + 10} r={(22 + (i % 3) * 4) * twinkle} fill="url(#bulb)" opacity={twinkle} />
            })}
          </g>
        )
      })}
    </svg>
  )
}

/** Out-of-focus lights far behind the subject. */
function Bokeh({ frame, colors = [LUMEN.amber, LUMEN.petal, LUMEN.moon], count = 22, opacity = 0.5 }: { frame: number; colors?: string[]; count?: number; opacity?: number }) {
  const { width } = useVideoConfig()
  const u = width / 1920
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity }}>
      {Array.from({ length: count }, (_, i) => {
        const size = 40 + ((i * 73) % 140)
        const x = (i * 389) % 1920
        const y = (i * 241) % 1080
        const drift = Math.sin(frame * 0.02 + i) * 14
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: (x + drift) * u,
              top: (y - drift * 0.6) * u,
              width: size * u,
              height: size * u,
              borderRadius: '50%',
              background: colors[i % colors.length],
              opacity: 0.25 + ((i * 17) % 50) / 100,
              filter: `blur(${(6 + (i % 4) * 5) * u}px)`,
            }}
          />
        )
      })}
    </AbsoluteFill>
  )
}

/**
 * The luna moth, flying a path through the frame: `path` maps the frame to
 * a position, and the wings beat by squashing the cut-out across its body.
 */
function Moth({ frame, path, width = 220, blur = 0 }: { frame: number; path: (f: number) => { x: number; y: number }; width?: number; blur?: number }) {
  const { width: frameWidth } = useVideoConfig()
  const u = frameWidth / 1920
  const here = path(frame)
  const ahead = path(frame + 1)
  const heading = (Math.atan2(ahead.y - here.y, ahead.x - here.x) * 180) / Math.PI + 90
  const beat = 0.3 + 0.7 * Math.abs(Math.cos(frame * 0.55))
  return (
    <Cut
      name="lumen-moth"
      style={{
        left: here.x * u,
        top: here.y * u,
        width: width * u,
        transform: `translate(-50%, -50%) rotate(${heading}deg) scaleX(${beat})`,
        filter: `${blur ? `blur(${blur * u}px) ` : ''}drop-shadow(0 ${12 * u}px ${18 * u}px rgba(0,0,0,0.35))`,
      }}
    />
  )
}

function Line({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const { width } = useVideoConfig()
  const u = width / 1920
  return <div style={{ position: 'absolute', fontFamily: SERIF, fontSize: 110 * u, lineHeight: 0.95, color: LUMEN.ivory, ...style }}>{children}</div>
}

/* ------------------------------------------------------------------ */
/*  1. The invitation                                                  */
/* ------------------------------------------------------------------ */

function InviteShot() {
  const frame = useCurrentFrame()
  const { width, durationInFrames } = useVideoConfig()
  const u = width / 1920
  const stage = useStage()
  const openAngle = tween(frame, 34, 112, 0, 158, easeInOut)
  const open = openAngle / 158
  // Each panel leans (180 - openAngle) / 2 off the flat spread, and the spread's printed
  // side faces away from the default camera: turning the card by -π plus that lean keeps
  // the cover square to the lens while shut and lands on the inside spread when open.
  const lean = ((180 - openAngle) / 2) * (Math.PI / 180)
  const intro = useEnvelope(4, 16, 0) * (1 - Math.min(1, open * 3))
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 80% at 55% 45%, #1d3d33 0%, ${LUMEN.night} 75%)` }}>
      <Bokeh frame={frame} opacity={0.35} />
      <Drift name="lumen-monstera" x={1760} y={120} width={520} rotate={200 + frame * 0.05} blur={3} opacity={0.8} />
      <GreetingCardMockup {...stage} color={LUMEN.ivory} openAngle={openAngle} position={[1.3 * (1 - open), -0.05, 0]} rotation={[0.06, -Math.PI + lean + tween(frame, 0, durationInFrames, -0.3, 0.1), 0]} scale={1 - 0.08 * open}>
        <GreetingCardMockup.Front>
          <InviteFront />
        </GreetingCardMockup.Front>
        <GreetingCardMockup.InsideLeft>
          <InviteInsideLeft />
        </GreetingCardMockup.InsideLeft>
        <GreetingCardMockup.InsideRight>
          <InviteInsideRight />
        </GreetingCardMockup.InsideRight>
        <GreetingCardMockup.Back>
          <InviteBack />
        </GreetingCardMockup.Back>
      </GreetingCardMockup>
      <Line style={{ left: 140 * u, top: 360 * u, opacity: intro, fontSize: 130 * u }}>
        Something
        <br />
        <span style={{ fontStyle: 'italic', color: LUMEN.amber }}>is blooming</span>
        <br />
        after dark.
      </Line>
      {/* across the top of the frame and out, clear of the card and the leaf */}
      <Moth frame={frame} path={(f) => ({ x: -120 + f * 13, y: 110 - Math.max(0, -120 + f * 13 - 600) * 0.35 + Math.sin(f * 0.15) * 15 })} width={200} />
      <Drift name="lumen-fern" x={150 + frame * 0.4} y={980} width={560} rotate={-60} blur={14} />
    </AbsoluteFill>
  )
}

/* ------------------------------------------------------------------ */
/*  2. The programme                                                   */
/* ------------------------------------------------------------------ */

function ProgrammeShot() {
  const frame = useCurrentFrame()
  const { width, durationInFrames } = useVideoConfig()
  const u = width / 1920
  const stage = useStage()
  const foldAngle = tween(frame, 8, 84, 168, 24, easeInOut)
  const caption = useEnvelope(70, 16, 0)
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 85% at 50% 45%, #f6efe1 0%, #e6d8bf 100%)' }}>
      <Drift name="lumen-orchid" x={1700} y={300} width={420} rotate={-12} blur={1} />
      <BrochureMockup {...stage} color={LUMEN.ivory} foldAngle={foldAngle} position={[0.2, -0.05, 0]} rotation={[0.08, tween(frame, 0, durationInFrames, 0.55, -0.12), 0]}>
        <BrochureMockup.FrontLeft>
          <ProgrammeCover />
        </BrochureMockup.FrontLeft>
        <BrochureMockup.FrontCenter>
          <ProgrammeNight artist={ARTISTS[0]!} index={0} />
        </BrochureMockup.FrontCenter>
        <BrochureMockup.FrontRight>
          <ProgrammeNight artist={ARTISTS[1]!} index={1} />
        </BrochureMockup.FrontRight>
        <BrochureMockup.BackLeft>
          <ProgrammeNight artist={ARTISTS[2]!} index={2} />
        </BrochureMockup.BackLeft>
        <BrochureMockup.BackCenter>
          <ProgrammeMap />
        </BrochureMockup.BackCenter>
        <BrochureMockup.BackRight>
          <ProgrammeCover />
        </BrochureMockup.BackRight>
      </BrochureMockup>
      <Drift name="lumen-fern" x={140} y={160} width={520} rotate={140} blur={12} />
      <Line style={{ left: 120 * u, bottom: 90 * u, color: LUMEN.ink, opacity: caption, fontSize: 96 * u }}>
        Three nights, <span style={{ fontStyle: 'italic', color: LUMEN.ember }}>one map.</span>
      </Line>
    </AbsoluteFill>
  )
}

/* ------------------------------------------------------------------ */
/*  3. The artist pass                                                 */
/* ------------------------------------------------------------------ */

function PassShot() {
  const frame = useCurrentFrame()
  const { width, fps } = useVideoConfig()
  const u = width / 1920
  const stage = useStage(false)
  // Turned from its back to its face, then left swinging on the lanyard.
  const turn = spring({ frame: frame - 10, fps, config: { damping: 9, stiffness: 60, mass: 1.2 } })
  const sway = Math.sin((frame / fps) * 2.6) * 0.07 * Math.exp(-frame / 90)
  const caption = useEnvelope(48, 16, 0)
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 80% at 50% 40%, #222c52 0%, ${LUMEN.night} 75%)` }}>
      <Bokeh frame={frame} opacity={0.6} count={26} />
      <IDCardMockup {...stage} color="#f7f2e8" lanyardColor={LUMEN.amber} position={[-0.9, 0, 0]} rotation={[0, Math.PI * (1 - turn) + 0.22, sway]}>
        <IDCardMockup.Front>
          <PassFront />
        </IDCardMockup.Front>
        <IDCardMockup.Back>
          <PassBack />
        </IDCardMockup.Back>
      </IDCardMockup>
      <Line style={{ left: 1160 * u, top: 380 * u, opacity: caption, transform: `translateY(${(1 - caption) * 20 * u}px)`, fontSize: 132 * u }}>
        All areas.
        <br />
        <span style={{ fontStyle: 'italic', color: LUMEN.amber }}>All night.</span>
      </Line>
      <div style={{ position: 'absolute', left: 1166 * u, top: 660 * u, fontFamily: SANS, fontSize: 28 * u, fontWeight: 500, color: LUMEN.moon, opacity: caption, maxWidth: 560 * u, lineHeight: 1.4 }}>
        Artist passes open every glasshouse, the green room and the roof garden.
      </div>
    </AbsoluteFill>
  )
}

/* ------------------------------------------------------------------ */
/*  4. The live record and the zine                                    */
/* ------------------------------------------------------------------ */

/*
 * The record is modelled at 92 mm per unit and the magazine at 66, so the
 * magazine is scaled onto the record's units: a letter-size zine beside a
 * 12-inch sleeve, as they would stand in a shop.
 */
const RECORD_GROUND = -VINYL_RECORD_FRAMING.extent()
const ZINE_SCALE = mockupInfo('magazine').mmPerUnit / mockupInfo('vinylRecord').mmPerUnit
const ZINE_AT: Vec3 = [3.0, RECORD_GROUND + MAGAZINE_FRAMING.extent({}) * ZINE_SCALE, 0.5]

function RecordShot() {
  const frame = useCurrentFrame()
  const delayCapture = useMockupCapture()
  const orbit = orbitAt(frame, [
    { frame: 0, target: [0.8, 0.0, 0.2], distance: 6.6, azimuth: 0.35, elevation: 0.06, fov: 34 },
    { frame: 140, target: [0.6, -0.1, 0.3], distance: 9.6, azimuth: -0.28, elevation: 0.12, fov: 38 },
  ])
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 85% at 50% 45%, #21473a 0%, #0e231c 80%)` }}>
      <Bokeh frame={frame} opacity={0.3} colors={[LUMEN.amber, LUMEN.moon]} />
      <MockupCanvas controls={false} delayCapture={delayCapture} camera={RIG_START} shadowY={RECORD_GROUND} label="The live record and the festival zine">
        <CameraRig orbit={orbit} />
        <Floor y={RECORD_GROUND} color="#163128" radius={12} />
        <OverlapProbe names={['record', 'zine']} frame={frame} />
        <VinylRecord name="record" color="#e9e2d4" vinylColor="#1b1b1b" position={[-0.6, 0, 0]} rotation={[0, 0.3, 0]}>
          <VinylRecord.Cover>
            <RecordSleeve />
          </VinylRecord.Cover>
          <VinylRecord.Label>
            <RecordLabel turn={frame * 6.6} />
          </VinylRecord.Label>
        </VinylRecord>
        <Magazine name="zine" glossy position={ZINE_AT} rotation={[0, -0.38, 0]} scale={ZINE_SCALE}>
          <Magazine.Cover>
            <ZineCover />
          </Magazine.Cover>
        </Magazine>
      </MockupCanvas>
    </AbsoluteFill>
  )
}

/* ------------------------------------------------------------------ */
/*  5. The gate, at night                                              */
/* ------------------------------------------------------------------ */

/*
 * The totem is modelled at 700 mm per unit and the roll-ups at 540, so the
 * banners are scaled onto the totem's units and stood on its ground.
 */
const GATE_GROUND = -DOOH_TOTEM_FRAMING.extent({})
const BANNER_SCALE = mockupInfo('rollupBanner').mmPerUnit / mockupInfo('doohTotem').mmPerUnit
const BANNER_Y = GATE_GROUND + ROLLUP_BANNER_FRAMING.extent({}) * BANNER_SCALE

function GateShot() {
  const frame = useCurrentFrame()
  const { width } = useVideoConfig()
  const u = width / 1920
  const delayCapture = useMockupCapture()
  const orbit = orbitAt(frame, [
    { frame: 0, target: [0, 0.3, 0], distance: 6.8, azimuth: 0.05, elevation: 0.02, fov: 36 },
    { frame: 70, target: [0, 0.4, 0.3], distance: 7.5, azimuth: -0.2, elevation: 0.08, fov: 38 },
    { frame: 180, target: [0, 0.2, 0.5], distance: 12.5, azimuth: 0.3, elevation: 0.16, fov: 40 },
  ])
  const caption = useEnvelope(110, 16, 0)
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, #070b16 0%, #0d1830 50%, #142a2a 100%)` }}>
      <StringLights frame={frame} y={70} sag={90} strands={2} opacity={0.95} />
      <MockupCanvas controls={false} delayCapture={delayCapture} camera={RIG_START} shadowY={GATE_GROUND} label="The festival gate at night">
        <CameraRig orbit={orbit} />
        <Floor y={GATE_GROUND} color="#1b2b26" radius={20} />
        <OverlapProbe names={['totem', 'welcome', 'wayfinding']} frame={frame} />
        <DOOHTotem name="totem">
          <DOOHTotem.Front>
            <GateScreen hold={50} />
          </DOOHTotem.Front>
        </DOOHTotem>
        <RollupBanner name="welcome" position={[-2.7, BANNER_Y, 0.9]} rotation={[0, 0.35, 0]} scale={BANNER_SCALE}>
          <WelcomeBanner />
        </RollupBanner>
        <RollupBanner name="wayfinding" position={[2.7, BANNER_Y, 0.9]} rotation={[0, -0.35, 0]} scale={BANNER_SCALE}>
          <WayfindingBanner />
        </RollupBanner>
      </MockupCanvas>
      <Line style={{ left: 0, right: 0, bottom: 70 * u, textAlign: 'center', fontSize: 84 * u, opacity: caption }}>
        Doors at dusk. <span style={{ fontStyle: 'italic', color: LUMEN.amber }}>Bring someone.</span>
      </Line>
      <Vignette strength={0.45} />
    </AbsoluteFill>
  )
}

/* ------------------------------------------------------------------ */
/*  End card                                                           */
/* ------------------------------------------------------------------ */

function Outro() {
  const frame = useCurrentFrame()
  const { width } = useVideoConfig()
  const u = width / 1920
  const mark = tween(frame, 4, 30, 0, 1, easeOut)
  const line = useEnvelope(20, 16, 0)
  const land = (f: number) => {
    const t = Math.min(1, Math.max(0, f / 46))
    const e = 1 - (1 - t) ** 3
    return { x: 1700 - 470 * e, y: 860 - 470 * e + Math.sin(f * 0.2) * 30 * (1 - e) }
  }
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 70% at 50% 50%, #1b3a30 0%, ${LUMEN.night} 75%)`, alignItems: 'center', justifyContent: 'center' }}>
      <StringLights frame={frame} y={40} sag={60} strands={1} opacity={0.8} />
      <Drift name="lumen-monstera" x={220} y={900} width={520} rotate={20} blur={8} />
      <Drift name="lumen-fern" x={1760} y={980} width={480} rotate={-140} blur={10} />
      <div style={{ opacity: mark, transform: `translateY(${(1 - mark) * 30 * u}px)` }}>
        <Mark size={`${260 * u}px`} color={LUMEN.ivory} />
      </div>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 64 * u, color: LUMEN.ivory, marginTop: 30 * u, opacity: line }}>Three nights in the Glasshouse</div>
      <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 32 * u, letterSpacing: '-0.005em', color: LUMEN.amber, marginTop: 26 * u, opacity: line }}>14–16 November · Victoria Gardens</div>
      <Moth frame={Math.min(frame, 46)} path={land} width={130} />
    </AbsoluteFill>
  )
}

export function LumenFilm() {
  const { width, height } = useVideoConfig()
  const timing = linearTiming({ durationInFrames: LUMEN_SHOTS.transition })
  const springy = springTiming({ durationInFrames: LUMEN_SHOTS.transition, config: { damping: 200 } })
  return (
    <FontGate fonts={FONTS}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={LUMEN_SHOTS.invite}>
          <InviteShot />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: 'from-bottom' })} timing={springy} />
        <TransitionSeries.Sequence durationInFrames={LUMEN_SHOTS.programme}>
          <ProgrammeShot />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: 'from-right' })} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={LUMEN_SHOTS.pass}>
          <PassShot />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={iris({ width, height })} timing={springy} />
        <TransitionSeries.Sequence durationInFrames={LUMEN_SHOTS.record}>
          <RecordShot />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={LUMEN_SHOTS.gate}>
          <GateShot />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={LUMEN_SHOTS.outro}>
          <Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </FontGate>
  )
}
