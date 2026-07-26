'use client'

import {
  AFrameSignMockup,
  AppleWatchMockup,
  Billboard,
  BillboardMockup,
  Book,
  BookMockup,
  BrochureMockup,
  BusinessCard,
  BusinessCardMockup,
  BusMockup,
  BusShelterMockup,
  CustomBoxMockup,
  CustomPanelMockup,
  DOOHTotemMockup,
  FoldMockup,
  GalaxyWatchMockup,
  GreetingCardMockup,
  IDCardMockup,
  IPhone,
  IPhoneMockup,
  LaptopMockup,
  MagazineMockup,
  MailerBoxMockup,
  MockupCanvas,
  StudioDisplayMockup,
  Galaxy,
  GalaxyMockup,
  PosterFrame,
  PosterFrameMockup,
  ProductBoxMockup,
  RollupBanner,
  RollupBannerMockup,
  SemiTrailerMockup,
  ShoppingBagMockup,
  StorefrontMockup,
  IPadMockup,
  GalaxyTabMockup,
  TVSetMockup,
  VanMockup,
  VinylRecord,
  VinylRecordMockup,
  FlipMockup,
} from 'area-mockups'
import { PreviewStage } from './preview-controls'
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock'
import { DEMO_SOURCES } from '../lib/demo-sources.generated'
import {
  ArrivalsBoardArt,
  BadgeBackArt,
  BookBackArt,
  BookSpineArt,
  BoxBackArt,
  BoxBottomArt,
  BadgeFrontArt,
  BagArt,
  BannerArt,
  MagazineBackArt,
  MagazineSpineArt,
  MailerBottomArt,
  MailerEndArt,
  BillboardAdArt,
  BookCoverArt,
  BoxFrontArt,
  BoxLidArt,
  BoxPanelArt,
  BoxSideArt,
  BoxTopArt,
  BrochureFrontArt,
  BrochureTrailsArt,
  BrochureVisitArt,
  BusAdArt,
  CardBackArt,
  ChalkMenuArt,
  CardFrontArt,
  DestinationArt,
  GreetingCoverArt,
  GreetingInsideArt,
  MagazineCoverArt,
  PosterArt,
  StorePosterArt,
  StoreSignArt,
  TrailerRearArt,
  TrailerWrapArt,
  VinylBackArt,
  VinylLabelBArt,
  TVShowArt,
  VanLiveryArt,
  VanRearArt,
  VinylCoverArt,
  VinylLabelArt,
} from './screens/print-art'
import { GalaxyWatchFace, WatchFace } from './screens/watch-face'
import { LiveCounter } from './screens/live-counter'
import { LockScreen } from './screens/lock-screen'
import { DesktopScreen } from './screens/desktop-screen'
import { MusicPlayer } from './screens/music-player'

/**
 * Full-bleed livery for the van's `coverage="full"` demo. The art deliberately
 * runs paint, stripes and type across the whole side elevation so the carved
 * wheel arches, door glass and hardware pockets read instantly.
 */
function FullSideLivery() {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'linear-gradient(112deg, #0d2823 0%, #175a4a 52%, #2ba584 100%)',
        color: '#eafff7',
        fontFamily: 'inherit',
      }}
    >
      {/* ridgeline sweep crossing the arches and door — carving cuts through it */}
      <svg
        viewBox="0 0 1360 501"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        aria-hidden
      >
        <path d="M0 356 L210 250 L360 322 L540 198 L742 306 L920 172 L1130 288 L1360 190 L1360 501 L0 501 Z" fill="rgba(10, 26, 22, 0.5)" />
        <path d="M0 398 L210 302 L360 366 L540 252 L742 352 L920 226 L1130 334 L1360 240" fill="none" stroke="#7ee0c0" strokeWidth="7" strokeLinejoin="round" />
        <circle cx="1052" cy="96" r="54" fill="#f4c944" />
      </svg>
      <div style={{ position: 'absolute', top: 38, left: 56, fontSize: 68, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>
        RIDGELINE TOURS
      </div>
      <div style={{ position: 'absolute', top: 118, left: 58, fontSize: 25, fontWeight: 600, opacity: 0.88 }}>
        Small-group trips into the high country · ridgeline.example
      </div>
    </div>
  )
}

/**
 * Full-bleed transit-wrap livery for the bus's `coverage="full"` demo — a
 * long 4.2:1 canvas. The color field and type deliberately run across the
 * passenger-window band (real wraps use perforated film there), while the
 * carved doors and driver's window punch through it.
 */
function BusFullLivery() {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'linear-gradient(100deg, #14375c 0%, #1d5d8f 46%, #2fa3a0 100%)',
        color: '#eefbf7',
        fontFamily: 'inherit',
      }}
    >
      <svg
        viewBox="0 0 1920 455"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        aria-hidden
      >
        <path d="M0 455 L0 330 C 320 240 560 400 880 320 C 1200 240 1440 380 1920 260 L1920 455 Z" fill="rgba(9, 26, 40, 0.45)" />
        <path d="M0 300 C 320 210 560 370 880 290 C 1200 210 1440 350 1920 230" fill="none" stroke="#7fe3d2" strokeWidth="9" />
        <circle cx="1620" cy="120" r="62" fill="#f4c944" />
      </svg>
      <div style={{ position: 'absolute', top: 60, left: 90, fontSize: 96, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>
        CLEANER AIR <span style={{ color: '#8ff0da' }}>FOR ALL</span>
      </div>
      <div style={{ position: 'absolute', top: 175, left: 94, fontSize: 30, fontWeight: 600, opacity: 0.9 }}>
        Every ride is zero-emission · transit.example/electric
      </div>
    </div>
  )
}

/** Matching tail wrap for the bus's full-coverage demo. */
function BusTailLivery() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        background: 'linear-gradient(160deg, #1d5d8f 0%, #14375c 100%)',
        color: '#eefbf7',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>ZERO EMISSION</div>
      <div style={{ fontSize: 18, fontWeight: 600, opacity: 0.85 }}>transit.example/electric</div>
      <div style={{ width: '52%', height: 8, background: '#7fe3d2', borderRadius: 4 }} />
    </div>
  )
}

/**
 * Chroma-key fill for the "mockup-able areas" example on each API page:
 * broadcast green with the surface's prop name printed across it, so users
 * can see exactly where each prop's content lands (and what stays 3D).
 */
function ChromaSurface({ label }: { label: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#00b140',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        containerType: 'size',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          fontFamily: 'ui-monospace, monospace',
          fontWeight: 700,
          fontSize: 'min(11cqw, 34cqh)',
          color: '#063d1e',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  )
}

/** Minimal typographic cover for composition demos — one prop, one accent. */
function MiniCover({ title, from, to }: { title: string; from: string; to: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: 20,
        background: `linear-gradient(165deg, ${from}, ${to})`,
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        fontWeight: 700,
        fontSize: 24,
        lineHeight: 1.1,
      }}
    >
      {title}
    </div>
  )
}

/**
 * Registry of live examples embedded in the docs via `<ObjectDemo demo="…" />`.
 * Every scene is lazy-mounted (see LazyScene) so an example-heavy page never
 * exceeds the browser's WebGL context budget.
 */
const DEMOS: Record<string, React.ReactNode> = {
  // ---- Galaxy (Galaxy) -----------------------------------------------------
  'galaxy-basic': (
    <GalaxyMockup color="#15171d" frameColor="#4d5260" rotation={[0, -0.25, 0]}>
      <LiveCounter />
    </GalaxyMockup>
  ),
  'galaxy-lock': (
    <GalaxyMockup autoRotate float color="#d3d6dd" frameColor="#b6bac4" surfaceBackground="#000">
      <LockScreen />
    </GalaxyMockup>
  ),
  'galaxy-landscape': (
    <GalaxyMockup variant="s26ultra" orientation="landscape" color="#2e3238" frameColor="#565b64">
      <MusicPlayer />
    </GalaxyMockup>
  ),
  'galaxy-s26': (
    <GalaxyMockup variant="s26" color="#6f6791" frameColor="#5a5478" rotation={[0, -0.3, 0]}>
      <MusicPlayer />
    </GalaxyMockup>
  ),
  'galaxy-s26ultra': (
    <GalaxyMockup variant="s26ultra" color="#a9bdce" frameColor="#c2ccd7" rotation={[0, -0.3, 0]}>
      <MusicPlayer />
    </GalaxyMockup>
  ),

  // ---- Fold (Galaxy Z Fold 7) ---------------------------------------------
  'fold-open': (
    <FoldMockup color="#c9ccce" frameColor="#b9bcbe" rotation={[0, -0.3, 0]}>
      <DesktopScreen />
    </FoldMockup>
  ),
  'fold-closed': (
    <FoldMockup open={false} autoRotate float color="#3a3d42" frameColor="#54585f" surfaceBackground="#000">
      <LockScreen />
    </FoldMockup>
  ),
  'fold-flex': (
    <FoldMockup openAngle={110} colorway="blueshadow" rotation={[0, -0.35, 0]}>
      <DesktopScreen />
    </FoldMockup>
  ),

  // ---- Flip (Galaxy Z Flip 7) -----------------------------------------------
  'flip-open': (
    <FlipMockup color="#e5502e" frameColor="#f06a45" rotation={[0, -0.3, 0]}>
      <MusicPlayer />
    </FlipMockup>
  ),
  'flip-closed': (
    <FlipMockup open={false} autoRotate float color="#e5502e" frameColor="#f06a45" surfaceBackground="#000">
      <LockScreen />
    </FlipMockup>
  ),
  'flip-flex': (
    <FlipMockup openAngle={100} colorway="blueshadow" camera={{ position: [0, 1.6, 7.2], fov: 40 }} rotation={[0, -0.25, 0]}>
      <MusicPlayer />
    </FlipMockup>
  ),

  // ---- IPhone ---------------------------------------------------------------
  'iphone-17': (
    <IPhoneMockup variant="17" color="#cfc4e6" frameColor="#b9aed3" rotation={[0, -0.3, 0]}>
      <MusicPlayer />
    </IPhoneMockup>
  ),
  'iphone-pro': (
    <IPhoneMockup variant="pro" color="#c96b34" frameColor="#b25c2a" rotation={[0, 0.25, 0]}>
      <MusicPlayer />
    </IPhoneMockup>
  ),
  'iphone-promax': (
    <IPhoneMockup variant="promax" color="#2b3a55" frameColor="#3d4d6b" rotation={[0, -0.3, 0]}>
      <MusicPlayer />
    </IPhoneMockup>
  ),
  'iphone-air': (
    <IPhoneMockup variant="air" autoRotate float color="#bfd4e6" frameColor="#a9c0d4" surfaceBackground="#000">
      <LockScreen />
    </IPhoneMockup>
  ),
  'phone-duo': (
    <MockupCanvas camera={{ position: [0, 0.5, 8.6], fov: 40 }} shadowY={-2.35}>
      <Galaxy variant="s26ultra" color="#2e3238" frameColor="#565b64" position={[-1.6, 0, -0.2]} rotation={[0, 0.3, 0]}>
        <LiveCounter />
      </Galaxy>
      <IPhone variant="promax" color="#2b3a55" frameColor="#3d4d6b" position={[1.6, 0, 0]} rotation={[0, -0.3, 0]}>
        <MusicPlayer />
      </IPhone>
    </MockupCanvas>
  ),

  // ---- Laptop -----------------------------------------------------------------
  'laptop-basic': (
    <LaptopMockup color="#aec6d9" rotation={[0, -0.35, 0]}>
      <DesktopScreen />
    </LaptopMockup>
  ),
  'laptop-midnight': (
    <LaptopMockup color="#2e3642" openAngle={100} float rotation={[0, 0.3, 0]}>
      <DesktopScreen />
    </LaptopMockup>
  ),
  'laptop-pro14': (
    <LaptopMockup variant="pro14" color="#4a484b" rotation={[0, -0.35, 0]}>
      <DesktopScreen />
    </LaptopMockup>
  ),
  'laptop-air15': (
    <LaptopMockup variant="air15" colorway="skyblue" rotation={[0, 0.3, 0]}>
      <DesktopScreen />
    </LaptopMockup>
  ),
  'laptop-pro16': (
    <LaptopMockup variant="pro16" colorway="spaceblack" rotation={[0, -0.35, 0]}>
      <DesktopScreen />
    </LaptopMockup>
  ),

  // ---- iPad / Galaxy Tab --------------------------------------------------------
  'ipad-landscape': (
    <IPadMockup orientation="landscape" rotation={[0, -0.3, 0]}>
      <DesktopScreen />
    </IPadMockup>
  ),
  'ipad-pro11': (
    <IPadMockup variant="ipadpro11" colorway="silver" rotation={[0, -0.3, 0]}>
      <DesktopScreen />
    </IPadMockup>
  ),
  'ipad-air13': (
    <IPadMockup variant="ipadair13" colorway="starlight" rotation={[0, -0.3, 0]}>
      <DesktopScreen />
    </IPadMockup>
  ),
  'ipad-a16': (
    <IPadMockup variant="ipad11" colorway="blue" rotation={[0, -0.3, 0]}>
      <DesktopScreen />
    </IPadMockup>
  ),
  'galaxy-tab-s11': (
    <GalaxyTabMockup variant="tabs11" colorway="gray" rotation={[0, -0.3, 0]}>
      <DesktopScreen />
    </GalaxyTabMockup>
  ),
  'galaxy-tab-ultra': (
    <GalaxyTabMockup variant="tabs11ultra" colorway="gray" float rotation={[0, 0.3, 0]}>
      <MusicPlayer />
    </GalaxyTabMockup>
  ),

  // ---- Studio Display -------------------------------------------------------------
  'studio-display-basic': (
    <StudioDisplayMockup rotation={[0, -0.25, 0]}>
      <DesktopScreen />
    </StudioDisplayMockup>
  ),
  'studio-display-silver': (
    <StudioDisplayMockup color="#e2e4e8" autoRotate autoRotateSpeed={0.8}>
      <DesktopScreen />
    </StudioDisplayMockup>
  ),

  // ---- Book -------------------------------------------------------------
  'book-basic': (
    <BookMockup color="#16324a" rotation={[0, 0.35, 0]}>
      <BookCoverArt />
    </BookMockup>
  ),
  'book-float': (
    <BookMockup color="#3d2352" pageColor="#efe8db" autoRotate float>
      <MiniCover title="Night Signals" from="#5b3a80" to="#241536" />
    </BookMockup>
  ),
  'book-full': (
    <BookMockup autoRotate autoRotateSpeed={1.1} color="#16324a">
      <BookCoverArt />
      <BookMockup.Back><BookBackArt /></BookMockup.Back>
      <BookMockup.Spine><BookSpineArt /></BookMockup.Spine>
    </BookMockup>
  ),
  'book-row': (
    <MockupCanvas camera={{ position: [0, 0.4, 9.4], fov: 40 }} shadowY={-2.2}>
      <Book color="#16324a" position={[-3, 0, -0.4]} rotation={[0, 0.5, 0]}>
        <MiniCover title="Atlas I" from="#2c4a68" to="#12222f" />
      </Book>
      <Book color="#5e2431" position={[0, 0, 0]} rotation={[0, 0.15, 0]}>
        <MiniCover title="Atlas II" from="#8a3547" to="#3c1219" />
      </Book>
      <Book color="#274233" position={[3, 0, -0.4]} rotation={[0, -0.35, 0]}>
        <MiniCover title="Atlas III" from="#3f6b52" to="#152820" />
      </Book>
    </MockupCanvas>
  ),

  // ---- Magazine ----------------------------------------------------------
  'magazine-basic': (
    <MagazineMockup rotation={[0, -0.3, 0]}>
      <MagazineCoverArt />
    </MagazineMockup>
  ),
  'magazine-back': (
    <MagazineMockup autoRotate autoRotateSpeed={1.2} rotation={[0, 2.6, 0]}>
      <MagazineCoverArt />
      <MagazineMockup.Back><MagazineBackArt /></MagazineMockup.Back>
    </MagazineMockup>
  ),
  'magazine-spine': (
    <MagazineMockup rotation={[0, 0.95, 0]}>
      <MagazineCoverArt />
      <MagazineMockup.Spine><MagazineSpineArt /></MagazineMockup.Spine>
      <MagazineMockup.Back><MagazineBackArt /></MagazineMockup.Back>
    </MagazineMockup>
  ),
  'magazine-stock': (
    <MagazineMockup pageColor="#efeadd" backColor="#101319" float rotation={[0, 0.3, 0]}>
      <MiniCover title="Monochrome, issue 12" from="#20242c" to="#0b0d12" />
    </MagazineMockup>
  ),

  // ---- Brochure ----------------------------------------------------------
  'brochure-panels': (
    <BrochureMockup rotation={[0, -0.12, 0]}>
      <BrochureMockup.Panel><BrochureFrontArt /></BrochureMockup.Panel>
      <BrochureMockup.Panel><BrochureTrailsArt /></BrochureMockup.Panel>
      <BrochureMockup.Panel><BrochureVisitArt /></BrochureMockup.Panel>
    </BrochureMockup>
  ),
  'brochure-flat': (
    <BrochureMockup foldAngle={0}>
      <BrochureMockup.Panel><BrochureFrontArt /></BrochureMockup.Panel>
      <BrochureMockup.Panel><BrochureTrailsArt /></BrochureMockup.Panel>
      <BrochureMockup.Panel><BrochureVisitArt /></BrochureMockup.Panel>
    </BrochureMockup>
  ),
  'brochure-single': (
    <BrochureMockup color="#e9e4d8" float rotation={[0, 0.25, 0]}>
      <BrochureFrontArt />
    </BrochureMockup>
  ),
  'brochure-both-sides': (
    <BrochureMockup autoRotate autoRotateSpeed={0.8}>
      <BrochureMockup.Panel><BrochureFrontArt /></BrochureMockup.Panel>
      <BrochureMockup.Panel><BrochureTrailsArt /></BrochureMockup.Panel>
      <BrochureMockup.Panel><BrochureVisitArt /></BrochureMockup.Panel>
      <BrochureMockup.Panel side="back"><BrochureTrailsArt /></BrochureMockup.Panel>
      <BrochureMockup.Panel side="back"><BrochureVisitArt /></BrochureMockup.Panel>
      <BrochureMockup.Panel side="back"><BrochureFrontArt /></BrochureMockup.Panel>
    </BrochureMockup>
  ),

  // ---- Business card -----------------------------------------------------
  'card-basic': (
    <BusinessCardMockup float rotation={[-0.1, -0.35, 0]}>
      <CardFrontArt />
    </BusinessCardMockup>
  ),
  'card-back': (
    <BusinessCardMockup autoRotate autoRotateSpeed={2}>
      <CardFrontArt />
      <BusinessCardMockup.Back><CardBackArt /></BusinessCardMockup.Back>
    </BusinessCardMockup>
  ),
  'card-pair': (
    <MockupCanvas camera={{ position: [0, 0.2, 6.4], fov: 40 }} shadowY={-2.1}>
      <BusinessCard position={[-1.85, 0.9, 0]} rotation={[-0.06, 0.25, 0.03]}>
        <CardFrontArt />
      </BusinessCard>
      <BusinessCard color="#191d24" position={[1.85, -0.9, 0.2]} rotation={[-0.06, -0.3, -0.03]}>
        <CardBackArt />
      </BusinessCard>
    </MockupCanvas>
  ),

  // ---- Poster frame --------------------------------------------------------
  'poster-basic': (
    <PosterFrameMockup rotation={[0, 0.25, 0]}>
      <PosterArt />
    </PosterFrameMockup>
  ),
  'poster-oak': (
    <PosterFrameMockup color="#b98d5f" surfaceBackground="#f7f2e8" float rotation={[0, -0.25, 0]}>
      <MiniCover title="Form & Counterform" from="#e6dccb" to="#cdbb92" />
    </PosterFrameMockup>
  ),
  'poster-pair': (
    <MockupCanvas camera={{ position: [0, 0.3, 10.4], fov: 40 }} shadowY={-2.5}>
      <PosterFrame position={[-2.15, 0, -0.3]} rotation={[0, 0.35, 0]}>
        <PosterArt />
      </PosterFrame>
      <PosterFrame color="#e8e5dd" position={[2.15, 0, 0]} rotation={[0, -0.25, 0]}>
        <MiniCover title="White Cube" from="#30364a" to="#141824" />
      </PosterFrame>
    </MockupCanvas>
  ),

  // ---- Billboard -----------------------------------------------------------
  'billboard-basic': (
    <BillboardMockup rotation={[0, -0.18, 0]}>
      <BillboardAdArt />
    </BillboardMockup>
  ),
  'billboard-pair': (
    <MockupCanvas camera={{ position: [0, 0.4, 13.4], fov: 40 }} shadowY={-1.5}>
      <group position={[0, 0.6, 0]}>
        <Billboard position={[-3.4, 0, -2.4]} rotation={[0, 0.5, 0]} color="#3a3f49">
          <MiniCover title="Coming soon." from="#233149" to="#101623" />
        </Billboard>
        <Billboard position={[1.6, 0, 0]} rotation={[0, -0.12, 0]}>
          <BillboardAdArt />
        </Billboard>
      </group>
    </MockupCanvas>
  ),

  // ---- Van -------------------------------------------------------------------
  'van-basic': (
    <VanMockup rotation={[0, -0.5, 0]}>
      <VanLiveryArt />
      <VanMockup.StreetSide><VanLiveryArt /></VanMockup.StreetSide>
      <VanMockup.Rear><VanRearArt /></VanMockup.Rear>
    </VanMockup>
  ),
  'van-rear': (
    <VanMockup rotation={[0, 2.25, 0]}>
      <VanLiveryArt />
      <VanMockup.StreetSide><VanLiveryArt /></VanMockup.StreetSide>
      <VanMockup.Rear><VanRearArt /></VanMockup.Rear>
    </VanMockup>
  ),
  'van-full': (
    <VanMockup coverage="full" rotation={[0, -0.42, 0]}>
      <FullSideLivery />
      <VanMockup.StreetSide><FullSideLivery /></VanMockup.StreetSide>
      <VanMockup.Rear><VanRearArt /></VanMockup.Rear>
      <VanMockup.LicensePlate>RGL 4×4</VanMockup.LicensePlate>
    </VanMockup>
  ),
  'van-paint': (
    <VanMockup color="#1d4433" surfaceBackground="#1d4433" autoRotate rotation={[0, 0.6, 0]}>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1d4433',
          color: '#f0ead6',
          fontSize: 54,
          fontWeight: 800,
          letterSpacing: -1,
        }}
      >
        RIDGELINE TOURS
      </div>
    </VanMockup>
  ),

  // ---- ID card ------------------------------------------------------------------
  'idcard-basic': (
    <IDCardMockup float rotation={[0, -0.25, 0.04]}>
      <BadgeFrontArt />
    </IDCardMockup>
  ),
  'idcard-back': (
    <IDCardMockup autoRotate autoRotateSpeed={2} lanyardColor="#1d4ed8">
      <BadgeFrontArt />
      <IDCardMockup.Back><BadgeBackArt /></IDCardMockup.Back>
    </IDCardMockup>
  ),

  // ---- Bus --------------------------------------------------------------------
  'bus-basic': (
    <BusMockup rotation={[0, 0.35, 0]}>
      <BusAdArt />
      <BusMockup.DestinationSign>{['42 DOWNTOWN', 'VIA 5TH AVE']}</BusMockup.DestinationSign>
    </BusMockup>
  ),
  'bus-full': (
    <BusMockup coverage="full" rotation={[0, 0.42, 0]}>
      <BusFullLivery />
      <BusMockup.StreetSide><BusFullLivery /></BusMockup.StreetSide>
      <BusMockup.Rear><BusTailLivery /></BusMockup.Rear>
      <BusMockup.DestinationSign>{['12 EASTBROOK', 'VIA HARBOR FRONT']}</BusMockup.DestinationSign>
    </BusMockup>
  ),
  'bus-full-clear': (
    <BusMockup coverage="full" wrapOverWindows={false} rotation={[0, 0.42, 0]}>
      <BusMockup.CurbSide><BusFullLivery /></BusMockup.CurbSide>
      <BusMockup.StreetSide><BusFullLivery /></BusMockup.StreetSide>
      <BusMockup.Rear><BusTailLivery /></BusMockup.Rear>
      <BusMockup.DestinationSign>7 CROSSTOWN</BusMockup.DestinationSign>
    </BusMockup>
  ),
  'bus-rear': (
    <BusMockup rotation={[0, 2.35, 0]}>
      <BusAdArt />
      <BusMockup.StreetSide><BusAdArt /></BusMockup.StreetSide>
      <BusMockup.Rear><BusAdArt /></BusMockup.Rear>
      <BusMockup.DestinationSign><DestinationArt /></BusMockup.DestinationSign>
    </BusMockup>
  ),
  'bus-livery': (
    <BusMockup color="#1d4433" surfaceBackground="#f4c534" autoRotate autoRotateSpeed={0.6}>
      <BusAdArt />
      <BusMockup.DestinationSign>42 GREENWAY · NEXT STOP CANAL ST · EXACT FARE PLEASE</BusMockup.DestinationSign>
    </BusMockup>
  ),

  // ---- Product box ---------------------------------------------------------------
  'box-basic': (
    <ProductBoxMockup rotation={[0, -0.5, 0]}>
      <BoxFrontArt />
      <ProductBoxMockup.Right><BoxSideArt /></ProductBoxMockup.Right>
      <ProductBoxMockup.Top><BoxTopArt /></ProductBoxMockup.Top>
    </ProductBoxMockup>
  ),
  'box-full': (
    <ProductBoxMockup autoRotate autoRotateSpeed={1.1}>
      <BoxFrontArt />
      <ProductBoxMockup.Right><BoxSideArt /></ProductBoxMockup.Right>
      <ProductBoxMockup.Left><BoxSideArt /></ProductBoxMockup.Left>
      <ProductBoxMockup.Top><BoxTopArt /></ProductBoxMockup.Top>
      <ProductBoxMockup.Bottom><BoxBottomArt /></ProductBoxMockup.Bottom>
      <ProductBoxMockup.Back><BoxBackArt /></ProductBoxMockup.Back>
    </ProductBoxMockup>
  ),
  'box-kraft': (
    <ProductBoxMockup color="#c9a877" float autoRotate autoRotateSpeed={1.2}>
      <BoxFrontArt />
    </ProductBoxMockup>
  ),

  // ---- Roll-up banner ---------------------------------------------------------------
  'banner-basic': (
    <RollupBannerMockup rotation={[0, 0.18, 0]}>
      <BannerArt />
    </RollupBannerMockup>
  ),
  'banner-pair': (
    <MockupCanvas camera={{ position: [0, 0.4, 9.8], fov: 40 }} shadowY={-2.05}>
      <group position={[0, 0.14, 0]}>
        <RollupBanner position={[-1.75, 0, -0.4]} rotation={[0, 0.3, 0]}>
          <BannerArt />
        </RollupBanner>
        {/* the wide 1000×2000 stand via `size` — the cassette resizes with it */}
        <RollupBanner size={{ width: 1000 }} color="#31343a" position={[1.55, 0, 0]} rotation={[0, -0.15, 0]}>
          <BannerArt />
        </RollupBanner>
      </group>
    </MockupCanvas>
  ),

  // ---- Bus shelter ---------------------------------------------------------------
  'shelter-basic': (
    <BusShelterMockup rotation={[0, -0.55, 0]}>
      <PosterArt />
      <BusShelterMockup.Arrivals>
        {['12  Harbor Loop      2 min', '4X  Union Sq Express  7 min', '31  Larchmont        12 min']}
      </BusShelterMockup.Arrivals>
    </BusShelterMockup>
  ),
  'shelter-night': (
    <BusShelterMockup color="#22262c" background="#0b0d12" rotation={[0, -0.75, 0]}>
      <PosterArt />
      <BusShelterMockup.Inner><PosterArt /></BusShelterMockup.Inner>
      <BusShelterMockup.Arrivals><ArrivalsBoardArt /></BusShelterMockup.Arrivals>
    </BusShelterMockup>
  ),

  // ---- Greeting card ---------------------------------------------------------------
  'greeting-basic': (
    <GreetingCardMockup float rotation={[0, -0.82, 0]}>
      <GreetingCoverArt />
    </GreetingCardMockup>
  ),
  'greeting-inside': (
    <GreetingCardMockup autoRotate autoRotateSpeed={1.4}>
      <GreetingCoverArt />
      <GreetingCardMockup.InsideLeft><GreetingInsideArt /></GreetingCardMockup.InsideLeft>
      <GreetingCardMockup.InsideRight><GreetingInsideArt /></GreetingCardMockup.InsideRight>
      <GreetingCardMockup.Back><GreetingInsideArt /></GreetingCardMockup.Back>
    </GreetingCardMockup>
  ),

  // ---- Vinyl record ---------------------------------------------------------------
  'vinyl-basic': (
    <VinylRecordMockup rotation={[0, -0.2, 0]}>
      <VinylCoverArt />
      <VinylRecordMockup.Label><VinylLabelArt /></VinylRecordMockup.Label>
    </VinylRecordMockup>
  ),
  'vinyl-full': (
    <VinylRecordMockup autoRotate autoRotateSpeed={1.1}>
      <VinylCoverArt />
      <VinylRecordMockup.Back><VinylBackArt /></VinylRecordMockup.Back>
      <VinylRecordMockup.Label><VinylLabelArt /></VinylRecordMockup.Label>
      <VinylRecordMockup.BackLabel><VinylLabelBArt /></VinylRecordMockup.BackLabel>
    </VinylRecordMockup>
  ),
  'vinyl-colored': (
    <VinylRecordMockup vinylColor="#7a2337" color="#101725" float>
      <VinylCoverArt />
      <VinylRecordMockup.Label><VinylLabelArt /></VinylRecordMockup.Label>
    </VinylRecordMockup>
  ),

  // ---- TV ---------------------------------------------------------------------------
  'tv-basic': (
    <TVSetMockup rotation={[0, -0.22, 0]}>
      <TVShowArt />
    </TVSetMockup>
  ),
  'tv-pedestal': (
    <TVSetMockup variant="pedestal" rotation={[0, -0.25, 0]}>
      <TVShowArt />
    </TVSetMockup>
  ),
  'tv-frame': (
    <TVSetMockup variant="frame" color="#a9825a" rotation={[0, -0.22, 0]}>
      <TVShowArt />
    </TVSetMockup>
  ),

  // ---- A-frame sign -----------------------------------------------------------------
  'aframe-basic': (
    <AFrameSignMockup rotation={[0, -0.3, 0]}>
      <ChalkMenuArt />
    </AFrameSignMockup>
  ),
  'aframe-back': (
    <AFrameSignMockup autoRotate autoRotateSpeed={1.2} color="#31404f" surfaceBackground="#1c2733">
      <ChalkMenuArt />
      <AFrameSignMockup.Back><ChalkMenuArt /></AFrameSignMockup.Back>
    </AFrameSignMockup>
  ),

  // ---- DOOH totem ---------------------------------------------------------------------
  'totem-basic': (
    <DOOHTotemMockup rotation={[0, -0.18, 0]}>
      <BannerArt />
      <DOOHTotemMockup.Back><BannerArt /></DOOHTotemMockup.Back>
    </DOOHTotemMockup>
  ),

  // ---- Storefront ---------------------------------------------------------------------
  'storefront-basic': (
    <StorefrontMockup rotation={[0, -0.25, 0]}>
      <StoreSignArt />
      <StorefrontMockup.FrontLeft><StorePosterArt /></StorefrontMockup.FrontLeft>
      <StorefrontMockup.FrontRight><StorePosterArt /></StorefrontMockup.FrontRight>
    </StorefrontMockup>
  ),
  'storefront-paint': (
    <StorefrontMockup color="#5c2330" rotation={[0, 0.3, 0]}>
      <StoreSignArt />
      <StorefrontMockup.FrontLeft><StorePosterArt /></StorefrontMockup.FrontLeft>
      <StorefrontMockup.Door><StorePosterArt /></StorefrontMockup.Door>
    </StorefrontMockup>
  ),
  'storefront-around': (
    <StorefrontMockup autoRotate autoRotateSpeed={1.2}>
      <StoreSignArt />
      <StorefrontMockup.FrontLeft><StorePosterArt /></StorefrontMockup.FrontLeft>
      <StorefrontMockup.FrontRight><StorePosterArt /></StorefrontMockup.FrontRight>
      <StorefrontMockup.Door><StorePosterArt /></StorefrontMockup.Door>
      <StorefrontMockup.Left><StorePosterArt /></StorefrontMockup.Left>
      <StorefrontMockup.Right><StorePosterArt /></StorefrontMockup.Right>
      <StorefrontMockup.Rear><StorePosterArt /></StorefrontMockup.Rear>
      <StorefrontMockup.LeftSign><StoreSignArt /></StorefrontMockup.LeftSign>
      <StorefrontMockup.RightSign><StoreSignArt /></StorefrontMockup.RightSign>
      <StorefrontMockup.RearSign><StoreSignArt /></StorefrontMockup.RearSign>
    </StorefrontMockup>
  ),

  // ---- Semi trailer ---------------------------------------------------------------------
  'trailer-basic': (
    <SemiTrailerMockup rotation={[0, -0.35, 0]}>
      <TrailerWrapArt />
    </SemiTrailerMockup>
  ),
  'trailer-rear': (
    <SemiTrailerMockup autoRotate autoRotateSpeed={1.2}>
      <TrailerWrapArt />
      <SemiTrailerMockup.StreetSide><TrailerWrapArt /></SemiTrailerMockup.StreetSide>
      <SemiTrailerMockup.Rear><TrailerRearArt /></SemiTrailerMockup.Rear>
    </SemiTrailerMockup>
  ),

  // ---- Mailer box ---------------------------------------------------------------------
  'mailer-basic': (
    <MailerBoxMockup rotation={[0, 0.5, 0]}>
      <BoxLidArt />
      <MailerBoxMockup.Front><BoxPanelArt /></MailerBoxMockup.Front>
    </MailerBoxMockup>
  ),
  'mailer-full': (
    <MailerBoxMockup autoRotate autoRotateSpeed={1.1} rotation={[0, 0.5, 0]}>
      <BoxLidArt />
      <MailerBoxMockup.Front><BoxPanelArt /></MailerBoxMockup.Front>
      <MailerBoxMockup.Back><BoxPanelArt /></MailerBoxMockup.Back>
      <MailerBoxMockup.Right><MailerEndArt /></MailerBoxMockup.Right>
      <MailerBoxMockup.Left><MailerEndArt /></MailerBoxMockup.Left>
      <MailerBoxMockup.Bottom><MailerBottomArt /></MailerBoxMockup.Bottom>
    </MailerBoxMockup>
  ),
  'mailer-blank': (
    <MailerBoxMockup
      float
      color="#e8e4dd"
      tapeColor="rgba(210, 205, 196, 0.9)"
      camera={{ position: [0, 3.2, 6.6], fov: 40 }}
      rotation={[0, -0.4, 0]}
    />
  ),

  // ---- Shopping bag ---------------------------------------------------------------------
  'bag-basic': (
    <ShoppingBagMockup rotation={[0, 0.35, 0]}>
      <BagArt />
    </ShoppingBagMockup>
  ),
  'bag-dark': (
    <ShoppingBagMockup autoRotate autoRotateSpeed={1.4} color="#1e2126" handleColor="#d8d4cc">
      <BagArt />
      <ShoppingBagMockup.Back><BagArt /></ShoppingBagMockup.Back>
    </ShoppingBagMockup>
  ),

  // ---- MockupCanvas features ------------------------------------------------------------
  'canvas-zoom': (
    <BookMockup zoom float color="#4a2c3f">
      <BookCoverArt />
    </BookMockup>
  ),

  // ---- Custom sizes ---------------------------------------------------------------------
  'custom-panel-basic': (
    <CustomPanelMockup size={{ width: 600, height: 900, thickness: 5 }} rotation={[0, 0.25, 0]}>
      <PosterArt />
    </CustomPanelMockup>
  ),
  'custom-panel-wide': (
    <CustomPanelMockup size={{ width: 2400, height: 800, thickness: 12 }} color="#20242b" float rotation={[0, -0.2, 0]}>
      <TrailerWrapArt />
    </CustomPanelMockup>
  ),
  'custom-box-basic': (
    <CustomBoxMockup size={{ width: 240, height: 320, depth: 80 }} rotation={[0, -0.45, 0]}>
      <BoxFrontArt />
      <CustomBoxMockup.Left><BoxSideArt /></CustomBoxMockup.Left>
      <CustomBoxMockup.Right><BoxSideArt /></CustomBoxMockup.Right>
      <CustomBoxMockup.Top><BoxTopArt /></CustomBoxMockup.Top>
      <CustomBoxMockup.Back><BoxFrontArt /></CustomBoxMockup.Back>
    </CustomBoxMockup>
  ),
  'custom-box-flat': (
    <CustomBoxMockup
      size={{ width: 300, height: 60, depth: 300 }}
      camera={{ position: [0, 2.6, 7.0], fov: 40 }}
      rotation={[0, 0.4, 0]}
    >
      <BoxPanelArt />
      <CustomBoxMockup.Top><BoxLidArt /></CustomBoxMockup.Top>
    </CustomBoxMockup>
  ),

  // ---- Watches ----------------------------------------------------------------
  'apple-watch': (
    <AppleWatchMockup float color="#1c1d21" bandColor="#33415c" rotation={[0, -0.35, 0]}>
      <WatchFace />
    </AppleWatchMockup>
  ),
  'galaxy-watch': (
    <GalaxyWatchMockup color="#33363c" bandColor="#23252a" float rotation={[0, 0.3, 0]}>
      <GalaxyWatchFace />
    </GalaxyWatchMockup>
  ),
  'galaxy-watch-open': (
    <GalaxyWatchMockup bandOpen color="#33363c" bandColor="#23252a" rotation={[0, 3.14, 0]}>
      <GalaxyWatchFace />
    </GalaxyWatchMockup>
  ),

  // ---- Chroma surface maps: every mockup-able area in chroma green -----------
  'chroma-galaxy': (
    <GalaxyMockup rotation={[0, -0.3, 0]}>
      <ChromaSurface label="children" />
    </GalaxyMockup>
  ),
  'chroma-iphone': (
    <IPhoneMockup rotation={[0, 0.3, 0]}>
      <ChromaSurface label="children" />
    </IPhoneMockup>
  ),
  'chroma-laptop': (
    <LaptopMockup rotation={[0.05, -0.35, 0]}>
      <ChromaSurface label="children" />
    </LaptopMockup>
  ),
  'chroma-ipad': (
    <IPadMockup rotation={[0, -0.3, 0]}>
      <ChromaSurface label="children" />
    </IPadMockup>
  ),
  'chroma-galaxy-tab': (
    <GalaxyTabMockup rotation={[0, -0.3, 0]}>
      <ChromaSurface label="children" />
    </GalaxyTabMockup>
  ),
  'chroma-apple-watch': (
    <AppleWatchMockup rotation={[0, -0.3, 0]}>
      <ChromaSurface label="children" />
    </AppleWatchMockup>
  ),
  'chroma-galaxy-watch': (
    <GalaxyWatchMockup rotation={[0, -0.3, 0]}>
      <ChromaSurface label="children" />
    </GalaxyWatchMockup>
  ),
  'chroma-studio-display': (
    <StudioDisplayMockup rotation={[0, -0.25, 0]}>
      <ChromaSurface label="children" />
    </StudioDisplayMockup>
  ),
  'chroma-fold': (
    <FoldMockup rotation={[0, -0.25, 0]}>
      <ChromaSurface label="children" />
    </FoldMockup>
  ),
  'chroma-flip': (
    <FlipMockup rotation={[0, -0.25, 0]}>
      <ChromaSurface label="children" />
    </FlipMockup>
  ),
  'chroma-tv': (
    <TVSetMockup rotation={[0, -0.2, 0]}>
      <ChromaSurface label="children" />
    </TVSetMockup>
  ),
  'chroma-book': (
    <BookMockup autoRotate autoRotateSpeed={0.8}>
      <ChromaSurface label="children" />
      <BookMockup.Back><ChromaSurface label=".Back" /></BookMockup.Back>
      <BookMockup.Spine><ChromaSurface label=".Spine" /></BookMockup.Spine>
    </BookMockup>
  ),
  'chroma-magazine': (
    <MagazineMockup autoRotate autoRotateSpeed={0.8}>
      <ChromaSurface label="children" />
      <MagazineMockup.Back><ChromaSurface label=".Back" /></MagazineMockup.Back>
      <MagazineMockup.Spine><ChromaSurface label=".Spine" /></MagazineMockup.Spine>
    </MagazineMockup>
  ),
  'chroma-brochure': (
    <BrochureMockup autoRotate autoRotateSpeed={0.8}>
      <BrochureMockup.Panel><ChromaSurface label=".Panel 1" /></BrochureMockup.Panel>
      <BrochureMockup.Panel><ChromaSurface label=".Panel 2" /></BrochureMockup.Panel>
      <BrochureMockup.Panel><ChromaSurface label=".Panel 3" /></BrochureMockup.Panel>
      <BrochureMockup.Panel side="back"><ChromaSurface label='.Panel side="back" 1' /></BrochureMockup.Panel>
      <BrochureMockup.Panel side="back"><ChromaSurface label='.Panel side="back" 2' /></BrochureMockup.Panel>
      <BrochureMockup.Panel side="back"><ChromaSurface label='.Panel side="back" 3' /></BrochureMockup.Panel>
    </BrochureMockup>
  ),
  'chroma-card': (
    <BusinessCardMockup autoRotate autoRotateSpeed={0.8}>
      <ChromaSurface label="children" />
      <BusinessCardMockup.Back><ChromaSurface label=".Back" /></BusinessCardMockup.Back>
    </BusinessCardMockup>
  ),
  'chroma-poster': (
    <PosterFrameMockup rotation={[0, -0.2, 0]}>
      <ChromaSurface label="children" />
    </PosterFrameMockup>
  ),
  'chroma-billboard': (
    <BillboardMockup rotation={[0, -0.15, 0]}>
      <ChromaSurface label="children" />
    </BillboardMockup>
  ),
  'chroma-van': (
    <VanMockup coverage="full" autoRotate autoRotateSpeed={0.6}>
      <ChromaSurface label="children (curbSide)" />
      <VanMockup.StreetSide><ChromaSurface label=".StreetSide" /></VanMockup.StreetSide>
      <VanMockup.Rear><ChromaSurface label=".Rear" /></VanMockup.Rear>
      <VanMockup.LicensePlate><ChromaSurface label=".LicensePlate" /></VanMockup.LicensePlate>
    </VanMockup>
  ),
  'chroma-id-card': (
    <IDCardMockup autoRotate autoRotateSpeed={0.8}>
      <ChromaSurface label="children" />
      <IDCardMockup.Back><ChromaSurface label=".Back" /></IDCardMockup.Back>
    </IDCardMockup>
  ),
  'chroma-bus': (
    <BusMockup coverage="full" autoRotate autoRotateSpeed={0.6}>
      <ChromaSurface label="children (curbSide)" />
      <BusMockup.StreetSide><ChromaSurface label=".StreetSide" /></BusMockup.StreetSide>
      <BusMockup.Rear><ChromaSurface label=".Rear" /></BusMockup.Rear>
      <BusMockup.DestinationSign><ChromaSurface label=".DestinationSign" /></BusMockup.DestinationSign>
    </BusMockup>
  ),
  'chroma-box': (
    <ProductBoxMockup autoRotate autoRotateSpeed={0.8}>
      <ChromaSurface label="children" />
      <ProductBoxMockup.Right><ChromaSurface label=".Right" /></ProductBoxMockup.Right>
      <ProductBoxMockup.Left><ChromaSurface label=".Left" /></ProductBoxMockup.Left>
      <ProductBoxMockup.Top><ChromaSurface label=".Top" /></ProductBoxMockup.Top>
      <ProductBoxMockup.Bottom><ChromaSurface label=".Bottom" /></ProductBoxMockup.Bottom>
      <ProductBoxMockup.Back><ChromaSurface label=".Back" /></ProductBoxMockup.Back>
    </ProductBoxMockup>
  ),
  'chroma-banner': (
    <RollupBannerMockup rotation={[0, 0.2, 0]}>
      <ChromaSurface label="children" />
    </RollupBannerMockup>
  ),
  'chroma-shelter': (
    <BusShelterMockup rotation={[0, -0.55, 0]}>
      <ChromaSurface label="children (poster)" />
      <BusShelterMockup.Inner><ChromaSurface label=".Inner" /></BusShelterMockup.Inner>
      <BusShelterMockup.Arrivals><ChromaSurface label=".Arrivals" /></BusShelterMockup.Arrivals>
      <BusShelterMockup.ArrivalsBack><ChromaSurface label=".ArrivalsBack" /></BusShelterMockup.ArrivalsBack>
    </BusShelterMockup>
  ),
  'chroma-greeting': (
    <GreetingCardMockup autoRotate autoRotateSpeed={0.8}>
      <ChromaSurface label="children" />
      <GreetingCardMockup.Back><ChromaSurface label=".Back" /></GreetingCardMockup.Back>
      <GreetingCardMockup.InsideLeft><ChromaSurface label=".InsideLeft" /></GreetingCardMockup.InsideLeft>
      <GreetingCardMockup.InsideRight><ChromaSurface label=".InsideRight" /></GreetingCardMockup.InsideRight>
    </GreetingCardMockup>
  ),
  'chroma-vinyl': (
    <VinylRecordMockup autoRotate autoRotateSpeed={0.8}>
      <ChromaSurface label="children" />
      <VinylRecordMockup.Back><ChromaSurface label=".Back" /></VinylRecordMockup.Back>
      <VinylRecordMockup.Label><ChromaSurface label=".Label" /></VinylRecordMockup.Label>
      <VinylRecordMockup.BackLabel><ChromaSurface label=".BackLabel" /></VinylRecordMockup.BackLabel>
    </VinylRecordMockup>
  ),
  'chroma-a-frame': (
    <AFrameSignMockup autoRotate autoRotateSpeed={0.8}>
      <ChromaSurface label="children" />
      <AFrameSignMockup.Back><ChromaSurface label=".Back" /></AFrameSignMockup.Back>
    </AFrameSignMockup>
  ),
  'chroma-dooh': (
    <DOOHTotemMockup autoRotate autoRotateSpeed={0.7}>
      <ChromaSurface label="children" />
      <DOOHTotemMockup.Back><ChromaSurface label=".Back" /></DOOHTotemMockup.Back>
    </DOOHTotemMockup>
  ),
  'chroma-storefront': (
    <StorefrontMockup autoRotate autoRotateSpeed={0.7}>
      <ChromaSurface label="children (fascia)" />
      <StorefrontMockup.FrontLeft><ChromaSurface label=".FrontLeft" /></StorefrontMockup.FrontLeft>
      <StorefrontMockup.FrontRight><ChromaSurface label=".FrontRight" /></StorefrontMockup.FrontRight>
      <StorefrontMockup.Door><ChromaSurface label=".Door" /></StorefrontMockup.Door>
      <StorefrontMockup.Left><ChromaSurface label=".Left" /></StorefrontMockup.Left>
      <StorefrontMockup.Right><ChromaSurface label=".Right" /></StorefrontMockup.Right>
      <StorefrontMockup.Rear><ChromaSurface label=".Rear" /></StorefrontMockup.Rear>
      <StorefrontMockup.LeftSign><ChromaSurface label=".LeftSign" /></StorefrontMockup.LeftSign>
      <StorefrontMockup.RightSign><ChromaSurface label=".RightSign" /></StorefrontMockup.RightSign>
      <StorefrontMockup.RearSign><ChromaSurface label=".RearSign" /></StorefrontMockup.RearSign>
    </StorefrontMockup>
  ),
  'chroma-semi': (
    <SemiTrailerMockup autoRotate autoRotateSpeed={0.6}>
      <ChromaSurface label="children (curbSide)" />
      <SemiTrailerMockup.StreetSide><ChromaSurface label=".StreetSide" /></SemiTrailerMockup.StreetSide>
      <SemiTrailerMockup.Rear><ChromaSurface label=".Rear" /></SemiTrailerMockup.Rear>
    </SemiTrailerMockup>
  ),
  'chroma-mailer': (
    <MailerBoxMockup autoRotate autoRotateSpeed={0.8}>
      <ChromaSurface label="children (top)" />
      <MailerBoxMockup.Front><ChromaSurface label=".Front" /></MailerBoxMockup.Front>
      <MailerBoxMockup.Back><ChromaSurface label=".Back" /></MailerBoxMockup.Back>
      <MailerBoxMockup.Right><ChromaSurface label=".Right" /></MailerBoxMockup.Right>
      <MailerBoxMockup.Left><ChromaSurface label=".Left" /></MailerBoxMockup.Left>
      <MailerBoxMockup.Bottom><ChromaSurface label=".Bottom" /></MailerBoxMockup.Bottom>
    </MailerBoxMockup>
  ),
  'chroma-bag': (
    <ShoppingBagMockup autoRotate autoRotateSpeed={0.8}>
      <ChromaSurface label="children" />
      <ShoppingBagMockup.Back><ChromaSurface label=".Back" /></ShoppingBagMockup.Back>
    </ShoppingBagMockup>
  ),
  'chroma-custom-panel': (
    <CustomPanelMockup size={{ width: 600, height: 400 }} autoRotate autoRotateSpeed={0.8}>
      <ChromaSurface label="children" />
      <CustomPanelMockup.Back><ChromaSurface label=".Back" /></CustomPanelMockup.Back>
    </CustomPanelMockup>
  ),
  'chroma-custom-box': (
    <CustomBoxMockup size={{ width: 300, height: 220, depth: 160 }} autoRotate autoRotateSpeed={0.8}>
      <ChromaSurface label="children" />
      <CustomBoxMockup.Back><ChromaSurface label=".Back" /></CustomBoxMockup.Back>
      <CustomBoxMockup.Left><ChromaSurface label=".Left" /></CustomBoxMockup.Left>
      <CustomBoxMockup.Right><ChromaSurface label=".Right" /></CustomBoxMockup.Right>
      <CustomBoxMockup.Top><ChromaSurface label=".Top" /></CustomBoxMockup.Top>
      <CustomBoxMockup.Bottom><ChromaSurface label=".Bottom" /></CustomBoxMockup.Bottom>
    </CustomBoxMockup>
  ),
}

/**
 * A live, draggable mockup embedded in a docs page. `demo` picks a scene from
 * the registry above; the code block next to it in the MDX shows the source.
 * `checker` puts the classic transparency checkerboard behind the scene —
 * used on each page's hero example to show that the canvas is transparent
 * and the mockup composites onto whatever the page puts behind it.
 */
export function ObjectDemo({
  demo,
  height = 440,
  checker = false,
}: {
  demo: string
  height?: number
  checker?: boolean
}) {
  const scene = DEMOS[demo]
  if (!scene) return <p>Unknown demo: {demo}</p>
  const sources = DEMO_SOURCES[demo]
  return (
    <>
      <PreviewStage height={height} checker={checker}>
        {scene}
      </PreviewStage>
      {sources && (
        <details className="object-demo-source">
          <summary>View the full TSX behind this demo</summary>
          {sources.map((part) => (
            <div key={part.name} className="object-demo-source-part">
              {part.name !== 'Demo' && <p className="object-demo-source-name">{part.name}</p>}
              <DynamicCodeBlock lang="tsx" code={part.code} />
            </div>
          ))}
        </details>
      )}
    </>
  )
}
