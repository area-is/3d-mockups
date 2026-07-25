'use client'

import {
  AppleWatchMockup,
  GalaxyWatchMockup,
  BillboardMockup,
  BookMockup,
  BrochureMockup,
  BusinessCardMockup,
  BusMockup,
  FoldMockup,
  IDCardMockup,
  IPhoneMockup,
  LaptopMockup,
  ProductBoxMockup,
  RollupBannerMockup,
  MagazineMockup,
  StudioDisplayMockup,
  GalaxyMockup,
  PosterFrameMockup,
  IPadMockup,
  GalaxyTabMockup,
  VanMockup,
  FlipMockup,
} from 'area-mockups'
import { TapCounter } from '../screens/tap-counter'
import { LockScreen } from '../screens/lock-screen'
import { DesktopScreen } from '../screens/desktop-screen'
import { GalaxyWatchFace, WatchFace } from '../screens/watch-face'
import {
  AFrameSignMockup,
  BusShelterMockup,
  DOOHTotemMockup,
  GreetingCardMockup,
  CustomBoxMockup,
  CustomPanelMockup,
  MailerBoxMockup,
  SemiTrailerMockup,
  ShoppingBagMockup,
  StorefrontMockup,
  TVSetMockup,
  VinylRecordMockup,
} from 'area-mockups'
import {
  ArrivalsBoardArt,
  BadgeBackArt,
  BadgeFrontArt,
  BagArt,
  BannerArt,
  BoxLidArt,
  BoxPanelArt,
  StorePosterArt,
  StoreSignArt,
  TrailerWrapArt,
  BillboardAdArt,
  BookCoverArt,
  BoxFrontArt,
  BoxSideArt,
  BoxTopArt,
  BusAdArt,
  ChalkMenuArt,
  DestinationArt,
  GreetingCoverArt,
  GreetingInsideArt,
  TVShowArt,
  VinylCoverArt,
  VinylLabelArt,
  BrochureFrontArt,
  BrochureTrailsArt,
  BrochureVisitArt,
  CardBackArt,
  CardFrontArt,
  MagazineCoverArt,
  PosterArt,
  TrailerRearArt,
  VanLiveryArt,
  VanRearArt,
} from '../screens/print-art'
import { MusicPlayer } from '../screens/music-player'
import { LazyScene } from '../lazy-scene'
import { withPreviewControls } from '../preview-controls'

function DemoCard({
  title,
  description,
  children,
}: {
  title: string
  description: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <article className="demo-card">
      <div className="mockup-viewport demo-viewport">
        <LazyScene>{withPreviewControls(children)}</LazyScene>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  )
}

export default function DemoScenes() {
  return (
    <div className="demo-grid">
      <DemoCard
        title="Bring your own UI"
        description={
          <>
            Plain React state on the 3D screen, and the button below really clicks. Drag anywhere,
            even on the screen, to spin the device; taps still reach the UI.
          </>
        }
      >
        <GalaxyMockup color="#15171d" frameColor="#4d5260" rotation={[0, -0.25, 0]}>
          <TapCounter />
        </GalaxyMockup>
      </DemoCard>

      <DemoCard
        title="Colorways & auto-orbit"
        description={
          <>
            <code>autoRotate</code> + <code>float</code>, in a Marble Gray colorway. Content
            hides automatically when the device faces away.
          </>
        }
      >
        <GalaxyMockup
          autoRotate
          float
          color="#d3d6dd"
          frameColor="#b6bac4"
          surfaceBackground="#000"
        >
          <LockScreen />
        </GalaxyMockup>
      </DemoCard>

      <DemoCard
        title="Embed a whole page"
        description={
          <>
            An <code>&lt;iframe&gt;</code> pointed at <code>/embedded</code>, a real route of
            this site, scrolling and clicking inside the glass.
          </>
        }
      >
        <GalaxyMockup color="#221d31" frameColor="#453a5c" rotation={[0, 0.25, 0]}>
          <iframe
            src="/embedded"
            title="Embedded page"
            style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
          />
        </GalaxyMockup>
      </DemoCard>

      <DemoCard
        title="MacBook Air (M5)"
        description={
          <>
            <code>&lt;LaptopMockup&gt;</code>: a procedural MacBook Air-style laptop in Sky
            Blue. The desktop is live DOM too: click the window, drag to orbit.
          </>
        }
      >
        <LaptopMockup color="#aec6d9" rotation={[0, -0.35, 0]}>
          <DesktopScreen />
        </LaptopMockup>
      </DemoCard>

      <DemoCard
        title="MacBook Pro 14&quot; (M5)"
        description={
          <>
            <code>variant=&quot;pro14&quot;</code> in Space Black — deeper body, HDMI/SDXC
            port array, speaker grilles, and the 1512×982 point grid.
          </>
        }
      >
        <LaptopMockup variant="pro14" color="#4a484b" rotation={[0, 0.35, 0]}>
          <DesktopScreen />
        </LaptopMockup>
      </DemoCard>

      <DemoCard
        title="Galaxy S26"
        description={
          <>
            <code>variant=&quot;s26&quot;</code> in Cobalt Violet — the 6.3″ baseline model:
            vertical pill camera island and a device-accurate 360×780 virtual screen.
          </>
        }
      >
        <GalaxyMockup variant="s26" color="#6f6791" frameColor="#5a5478" rotation={[0, -0.3, 0]}>
          <MusicPlayer />
        </GalaxyMockup>
      </DemoCard>

      <DemoCard
        title="Galaxy S26 Ultra"
        description={
          <>
            <code>variant=&quot;s26ultra&quot;</code> in Titanium Silverblue: boxier corners,
            three proud rings on the pill island with the tele column beside it, the
            S Pen silo, and a 384×832 virtual screen.
          </>
        }
      >
        <GalaxyMockup variant="s26ultra" color="#a9bdce" frameColor="#c2ccd7" rotation={[0, -0.3, 0]}>
          <MusicPlayer />
        </GalaxyMockup>
      </DemoCard>

      <DemoCard
        title="Galaxy Z Fold 7"
        description={
          <>
            <code>&lt;FoldMockup&gt;</code>: unfolded to the big, nearly square inner
            display (a faint crease runs down its center). Content fills the whole
            tablet-sized screen.
          </>
        }
      >
        <FoldMockup color="#c9ccce" frameColor="#b9bcbe" rotation={[0, -0.3, 0]}>
          <DesktopScreen />
        </FoldMockup>
      </DemoCard>

      <DemoCard
        title="Galaxy Z Flip 7"
        description={
          <>
            <code>&lt;FlipMockup&gt;</code> in Coral Red, folded: the square cover screen
            wraps around the dual camera island, exactly like the FlexWindow.
          </>
        }
      >
        <FlipMockup open={false} color="#e5502e" frameColor="#f06a45" rotation={[0, -0.3, 0]}>
          <LockScreen />
        </FlipMockup>
      </DemoCard>

      <DemoCard
        title="Galaxy Z Fold 7 (folded)"
        description={
          <>
            <code>open={'{'}false{'}'}</code> — the same device folded to the tall cover
            display, with the rear triple camera on the back.
          </>
        }
      >
        <FoldMockup open={false} color="#c9ccce" frameColor="#b9bcbe" rotation={[0, -0.3, 0]}>
          <MusicPlayer />
        </FoldMockup>
      </DemoCard>

      <DemoCard
        title="iPhone 17"
        description={
          <>
            <code>&lt;IPhoneMockup&gt;</code> in Lavender: Dynamic Island, the dual-camera
            plateau, and a true 402×874 virtual screen.
          </>
        }
      >
        <IPhoneMockup variant="17" color="#cfc4e6" frameColor="#b9aed3" rotation={[0, -0.3, 0]}>
          <MusicPlayer />
        </IPhoneMockup>
      </DemoCard>

      <DemoCard
        title="iPhone 17 Air"
        description={
          <>
            <code>variant=&quot;air&quot;</code> in Sky Blue — the 5.6 mm-thin model with a
            single camera on the full-width plateau.
          </>
        }
      >
        <IPhoneMockup variant="air" color="#bfd4e6" frameColor="#a9c0d4" rotation={[0, -0.3, 0]}>
          <MusicPlayer />
        </IPhoneMockup>
      </DemoCard>

      <DemoCard
        title="iPhone 17 Pro"
        description={
          <>
            <code>variant=&quot;pro&quot;</code> in Cosmic Orange: the triple-camera
            plateau across the full back.
          </>
        }
      >
        <IPhoneMockup variant="pro" color="#c96b34" frameColor="#b25c2a" rotation={[0, -0.3, 0]}>
          <MusicPlayer />
        </IPhoneMockup>
      </DemoCard>

      <DemoCard
        title="iPhone 17 Pro Max"
        description={
          <>
            <code>variant=&quot;promax&quot;</code> in Deep Blue — the biggest body in the
            family, with a 440×956 virtual screen.
          </>
        }
      >
        <IPhoneMockup variant="promax" color="#2b3a55" frameColor="#3d4d6b" rotation={[0, -0.3, 0]}>
          <MusicPlayer />
        </IPhoneMockup>
      </DemoCard>

      <DemoCard
        title="iPad Pro 13″ (M5)"
        description={
          <>
            <code>&lt;IPadMockup&gt;</code> in Space Black, landscape — the pencil mount
            and camera pod follow the orientation, and the virtual screen is a true
            1376×1032.
          </>
        }
      >
        <IPadMockup variant="ipadpro13" orientation="landscape" colorway="spaceblack" rotation={[0, -0.3, 0]}>
          <DesktopScreen />
        </IPadMockup>
      </DemoCard>

      <DemoCard
        title="iPad Pro 11″ (M5)"
        description={
          <>
            <code>variant=&quot;ipadpro11&quot;</code> in Silver, portrait — same design
            language at the smaller true relative size.
          </>
        }
      >
        <IPadMockup variant="ipadpro11" colorway="silver" rotation={[0, -0.3, 0]}>
          <DesktopScreen />
        </IPadMockup>
      </DemoCard>

      <DemoCard
        title="iPad Air 13″ (M4)"
        description={
          <>
            <code>variant=&quot;ipadair13&quot;</code> in Starlight — the bare single lens,
            Touch ID top button and back Smart Connector of the Air.
          </>
        }
      >
        <IPadMockup variant="ipadair13" colorway="starlight" rotation={[0, -0.3, 0]}>
          <DesktopScreen />
        </IPadMockup>
      </DemoCard>

      <DemoCard
        title="iPad (A16)"
        description={
          <>
            <code>variant=&quot;ipad11&quot;</code> in Blue — the standard iPad&apos;s punchier
            anodizing, crisper rails and edge Smart Connector.
          </>
        }
      >
        <IPadMockup variant="ipad11" colorway="blue" rotation={[0, -0.3, 0]}>
          <DesktopScreen />
        </IPadMockup>
      </DemoCard>

      <DemoCard
        title="Galaxy Tab S11"
        description={
          <>
            <code>variant=&quot;tabs11&quot;</code> in Gray, portrait — the single protruding
            camera ring, speaker slots and pogo contacts of the Samsung slate.
          </>
        }
      >
        <GalaxyTabMockup variant="tabs11" colorway="gray" rotation={[0, -0.3, 0]}>
          <DesktopScreen />
        </GalaxyTabMockup>
      </DemoCard>

      <DemoCard
        title="Galaxy Tab S11 Ultra"
        description={
          <>
            <code>variant=&quot;tabs11ultra&quot;</code> in Gray, landscape — the 14.6″
            panel with its U-shaped notch, dual rings and SAMSUNG wordmark.
          </>
        }
      >
        <GalaxyTabMockup variant="tabs11ultra" orientation="landscape" colorway="gray" rotation={[0, -0.3, 0]}>
          <DesktopScreen />
        </GalaxyTabMockup>
      </DemoCard>

      <DemoCard
        title="Studio Display"
        description={
          <>
            <code>&lt;StudioDisplayMockup&gt;</code>: the 27″ 5K panel on its tilt stand with a
            2560×1440 virtual screen (and, faithfully, no power button).
          </>
        }
      >
        <StudioDisplayMockup rotation={[0, -0.25, 0]}>
          <DesktopScreen />
        </StudioDisplayMockup>
      </DemoCard>

      <DemoCard
        title="Apple Watch Series 11"
        description={
          <>
            <code>&lt;AppleWatchMockup&gt;</code>: squircle case, Digital Crown, a full
            Solo Loop worn on an invisible wrist, and a live 208×248 face. The
            complication really taps.
          </>
        }
      >
        <AppleWatchMockup float color="#1c1d21" bandColor="#33415c" rotation={[0, -0.35, 0]}>
          <WatchFace />
        </AppleWatchMockup>
      </DemoCard>

      <DemoCard
        title="Galaxy Watch 8"
        description={
          <>
            <code>&lt;GalaxyWatchMockup&gt;</code>: the cushion case with a fully round
            1.47″ display — a live circular 240×240 face — two flat keys, and the
            Dynamic Lug band.
          </>
        }
      >
        <GalaxyWatchMockup float color="#33363c" bandColor="#23252a" rotation={[0, 0.3, 0]}>
          <GalaxyWatchFace />
        </GalaxyWatchMockup>
      </DemoCard>

      <DemoCard
        title="Hardcover book"
        description={
          <>
            <code>&lt;BookMockup&gt;</code>: a 156×234 mm trade hardcover — cloth boards,
            rounded spine, cream page block — with the whole jacket as live DOM.
          </>
        }
      >
        <BookMockup float color="#16324a" rotation={[0, 0.35, 0]}>
          <BookCoverArt />
        </BookMockup>
      </DemoCard>

      <DemoCard
        title="Magazine cover"
        description={
          <>
            <code>&lt;MagazineMockup&gt;</code>: a perfect-bound letter-trim monthly. The
            cover is a 480×620 virtual page, so real editorial CSS just works.
          </>
        }
      >
        <MagazineMockup float rotation={[0, -0.3, 0]}>
          <MagazineCoverArt />
        </MagazineMockup>
      </DemoCard>

      <DemoCard
        title="Tri-fold brochure"
        description={
          <>
            <code>&lt;BrochureMockup&gt;</code>: three letter-fold panels standing in a
            zig-zag, each its own live surface via a repeated{' '}
            <code>&lt;BrochureMockup.Panel&gt;</code> slot.
          </>
        }
      >
        <BrochureMockup rotation={[0, -0.12, 0]}>
          <BrochureMockup.Panel><BrochureFrontArt /></BrochureMockup.Panel>
          <BrochureMockup.Panel><BrochureTrailsArt /></BrochureMockup.Panel>
          <BrochureMockup.Panel><BrochureVisitArt /></BrochureMockup.Panel>
          <BrochureMockup.Panel side="back"><BrochureVisitArt /></BrochureMockup.Panel>
          <BrochureMockup.Panel side="back"><BrochureFrontArt /></BrochureMockup.Panel>
          <BrochureMockup.Panel side="back"><BrochureTrailsArt /></BrochureMockup.Panel>
        </BrochureMockup>
      </DemoCard>

      <DemoCard
        title="Business card, both sides"
        description={
          <>
            <code>&lt;BusinessCardMockup&gt;</code>: 32 pt stock with rounded die-cut
            corners. Drag it around — the <code>Back</code> slot prints the reverse.
          </>
        }
      >
        <BusinessCardMockup float rotation={[-0.1, -0.35, 0]}>
          <CardFrontArt />
          <BusinessCardMockup.Back><CardBackArt /></BusinessCardMockup.Back>
        </BusinessCardMockup>
      </DemoCard>

      <DemoCard
        title="ID badge on a lanyard"
        description={
          <>
            <code>&lt;IDCardMockup&gt;</code>: a CR80 badge with a real punched slot, snap
            hook, and hanging lanyard. The <code>Back</code> face is live too.
          </>
        }
      >
        <IDCardMockup float rotation={[0, -0.25, 0.04]}>
          <BadgeFrontArt />
          <IDCardMockup.Back><BadgeBackArt /></IDCardMockup.Back>
        </IDCardMockup>
      </DemoCard>

      <DemoCard
        title="Poster frame"
        description={
          <>
            <code>&lt;PosterFrameMockup&gt;</code>: an 18″×24″ sheet recessed in a gallery
            molding with a true through-hole and kraft dust cover on the back.
          </>
        }
      >
        <PosterFrameMockup rotation={[0, 0.25, 0]}>
          <PosterArt />
        </PosterFrameMockup>
      </DemoCard>

      <DemoCard
        title="Highway billboard"
        description={
          <>
            <code>&lt;BillboardMockup&gt;</code>: the classic 14′×48′ bulletin on a
            monopole — catwalk, railing, gooseneck floodlights — grounded like a monitor.
          </>
        }
      >
        <BillboardMockup rotation={[0, -0.18, 0]}>
          <BillboardAdArt />
        </BillboardMockup>
      </DemoCard>

      <DemoCard
        title="City transit bus"
        description={
          <>
            <code>&lt;BusMockup&gt;</code>: a 40′ low-floor transit bus with a live king-size
            (30″×144″) ad panel — and the LED destination sign is live DOM too.
          </>
        }
      >
        <BusMockup rotation={[0, -0.4, 0]}>
          <BusAdArt />
          <BusMockup.DestinationSign><DestinationArt /></BusMockup.DestinationSign>
          <BusMockup.StreetSide><BusAdArt /></BusMockup.StreetSide>
          <BusMockup.Rear><BusAdArt /></BusMockup.Rear>
        </BusMockup>
      </DemoCard>

      <DemoCard
        title="Product box"
        description={
          <>
            <code>&lt;ProductBoxMockup&gt;</code>: a retail carton with live front, side and
            top panels sharing one dpi — three printed faces in a single 3/4 pose.
          </>
        }
      >
        <ProductBoxMockup rotation={[0, -0.5, 0]}>
          <BoxFrontArt />
          <ProductBoxMockup.Right><BoxSideArt /></ProductBoxMockup.Right>
          <ProductBoxMockup.Top><BoxTopArt /></ProductBoxMockup.Top>
          <ProductBoxMockup.Back><BoxFrontArt /></ProductBoxMockup.Back>
        </ProductBoxMockup>
      </DemoCard>

      <DemoCard
        title="Roll-up banner"
        description={
          <>
            <code>&lt;RollupBannerMockup&gt;</code>: the 850×2000 trade-show stand — cassette
            base, swivel feet, top rail — with a live 420×988 graphic.
          </>
        }
      >
        <RollupBannerMockup rotation={[0, 0.18, 0]}>
          <BannerArt />
        </RollupBannerMockup>
      </DemoCard>

      <DemoCard
        title="Vehicle wrap"
        description={
          <>
            <code>&lt;VanMockup&gt;</code>: a procedural cargo van with a live vinyl-wrap
            panel on the cargo side — design a fleet livery in plain CSS.
          </>
        }
      >
        <VanMockup rotation={[0, -0.5, 0]}>
          <VanLiveryArt />
          <VanMockup.StreetSide><VanLiveryArt /></VanMockup.StreetSide>
          <VanMockup.Rear><VanRearArt /></VanMockup.Rear>
        </VanMockup>
      </DemoCard>

      <DemoCard
        title="Bus shelter 6-sheet"
        description={
          <>
            <code>&lt;BusShelterMockup&gt;</code>: a glass transit shelter whose backlit
            6-sheet lightbox holds a live 480×709 poster on both faces.
          </>
        }
      >
        <BusShelterMockup rotation={[0, -0.55, 0]}>
          <PosterArt />
          <BusShelterMockup.Inner><PosterArt /></BusShelterMockup.Inner>
          <BusShelterMockup.Arrivals><ArrivalsBoardArt /></BusShelterMockup.Arrivals>
        </BusShelterMockup>
      </DemoCard>

      <DemoCard
        title="Greeting card"
        description={
          <>
            <code>&lt;GreetingCardMockup&gt;</code>: a folded A7 card standing like a tent
            — cover, back and the inside spread are all live faces.
          </>
        }
      >
        <GreetingCardMockup float rotation={[0, -0.82, 0]}>
          <GreetingCoverArt />
          <GreetingCardMockup.InsideLeft><GreetingInsideArt /></GreetingCardMockup.InsideLeft>
          <GreetingCardMockup.InsideRight><GreetingInsideArt /></GreetingCardMockup.InsideRight>
          <GreetingCardMockup.Back><GreetingInsideArt /></GreetingCardMockup.Back>
        </GreetingCardMockup>
      </DemoCard>

      <DemoCard
        title="Vinyl record"
        description={
          <>
            <code>&lt;VinylRecordMockup&gt;</code>: a 12″ LP half-out of its jacket. The
            cover is live DOM — and so is the circular center label.
          </>
        }
      >
        <VinylRecordMockup rotation={[0, -0.2, 0]}>
          <VinylCoverArt />
          <VinylRecordMockup.Label><VinylLabelArt /></VinylRecordMockup.Label>
          <VinylRecordMockup.Back><VinylCoverArt /></VinylRecordMockup.Back>
        </VinylRecordMockup>
      </DemoCard>

      <DemoCard
        title="65″ TV"
        description={
          <>
            <code>&lt;TVSetMockup&gt;</code>: a near-bezel-less 65″ panel on splayed
            feet with a live 1920×1080 screen — desktop layouts and video apply directly.
          </>
        }
      >
        <TVSetMockup rotation={[0, -0.22, 0]}>
          <TVShowArt />
        </TVSetMockup>
      </DemoCard>

      <DemoCard
        title="A-frame sign"
        description={
          <>
            <code>&lt;AFrameSignMockup&gt;</code>: the sidewalk sandwich board, legs
            splayed like the real thing — both chalkboard panels are live.
          </>
        }
      >
        <AFrameSignMockup rotation={[0, -0.3, 0]}>
          <ChalkMenuArt />
          <AFrameSignMockup.Back><ChalkMenuArt /></AFrameSignMockup.Back>
        </AFrameSignMockup>
      </DemoCard>

      <DemoCard
        title="DOOH totem"
        description={
          <>
            <code>&lt;DOOHTotemMockup&gt;</code>: a digital street totem with a live
            portrait 540×960 display — the digital sibling of the billboard.
          </>
        }
      >
        <DOOHTotemMockup rotation={[0, -0.18, 0]}>
          <BannerArt />
          <DOOHTotemMockup.Back><BannerArt /></DOOHTotemMockup.Back>
        </DOOHTotemMockup>
      </DemoCard>

      <DemoCard
        title="Storefront"
        description={
          <>
            <code>&lt;StorefrontMockup&gt;</code>: a high-street shop façade — the fascia
            sign and the poster in the display window are both live DOM.
          </>
        }
      >
        <StorefrontMockup rotation={[0, -0.25, 0]}>
          <StoreSignArt />
          <StorefrontMockup.FrontLeft><StorePosterArt /></StorefrontMockup.FrontLeft>
          <StorefrontMockup.FrontRight><StorePosterArt /></StorefrontMockup.FrontRight>
        </StorefrontMockup>
      </DemoCard>

      <DemoCard
        title="53 ft semi trailer"
        description={
          <>
            <code>&lt;SemiTrailerMockup&gt;</code>: a dry van parked on its landing gear.
            Both 53-foot sides and the rear doors take live wraps.
          </>
        }
      >
        <SemiTrailerMockup rotation={[0, -0.35, 0]}>
          <TrailerWrapArt />
          <SemiTrailerMockup.StreetSide><TrailerWrapArt /></SemiTrailerMockup.StreetSide>
          <SemiTrailerMockup.Rear><TrailerRearArt /></SemiTrailerMockup.Rear>
        </SemiTrailerMockup>
      </DemoCard>

      <DemoCard
        title="Mailer box"
        description={
          <>
            <code>&lt;MailerBoxMockup&gt;</code>: a corrugated shipper with printed top and
            front panels — the packing tape rides over your print.
          </>
        }
      >
        <MailerBoxMockup rotation={[0, 0.5, 0]}>
          <BoxLidArt />
          <MailerBoxMockup.Front><BoxPanelArt /></MailerBoxMockup.Front>
          <MailerBoxMockup.Right><BoxPanelArt /></MailerBoxMockup.Right>
        </MailerBoxMockup>
      </DemoCard>

      <DemoCard
        title="Shopping bag"
        description={
          <>
            <code>&lt;ShoppingBagMockup&gt;</code>: a kraft carrier with rope handles and a
            fold-over cuff — front and back faces are live print areas.
          </>
        }
      >
        <ShoppingBagMockup rotation={[0, 0.35, 0]}>
          <BagArt />
          <ShoppingBagMockup.Back><BagArt /></ShoppingBagMockup.Back>
        </ShoppingBagMockup>
      </DemoCard>

      <DemoCard
        title="Custom panel — any size"
        description={
          <>
            <code>&lt;CustomPanelMockup&gt;</code>: pass real millimeters via{' '}
            <code>size</code> and get a live rectangular sheet at true proportions —
            here a 600×900 mm board.
          </>
        }
      >
        <CustomPanelMockup size={{ width: 600, height: 900, thickness: 5 }} rotation={[0, 0.25, 0]}>
          <PosterArt />
          <CustomPanelMockup.Back><PosterArt /></CustomPanelMockup.Back>
        </CustomPanelMockup>
      </DemoCard>

      <DemoCard
        title="Custom box — any size"
        description={
          <>
            <code>&lt;CustomBoxMockup&gt;</code>: a 240×320×80 mm box with all six faces
            printable at one shared dpi.
          </>
        }
      >
        <CustomBoxMockup size={{ width: 240, height: 320, depth: 80 }} rotation={[0, -0.45, 0]}>
          <BoxFrontArt />
          <CustomBoxMockup.Back><BoxFrontArt /></CustomBoxMockup.Back>
          <CustomBoxMockup.Left><BoxSideArt /></CustomBoxMockup.Left>
          <CustomBoxMockup.Right><BoxSideArt /></CustomBoxMockup.Right>
          <CustomBoxMockup.Top><BoxTopArt /></CustomBoxMockup.Top>
        </CustomBoxMockup>
      </DemoCard>

      <DemoCard
        title="Pinch & scroll zoom"
        description={
          <>
            <code>zoom</code>: pinch on touch, scroll wheel on desktop, and the overlay
            +/− buttons — clamped to the same range as the orbit controls.
          </>
        }
      >
        <BookMockup zoom float color="#4a2c3f" rotation={[0, 0.35, 0]}>
          <BookCoverArt />
        </BookMockup>
      </DemoCard>

      <DemoCard
        title="Transparent background"
        description={
          <>
            The WebGL canvas is transparent by default (alpha context, no scene background), so
            the checkerboard behind this phone is plain page CSS showing through.
          </>
        }
      >
        <div className="alpha-checker">
          <GalaxyMockup float color="#15171d" frameColor="#4d5260" rotation={[0, 0.3, 0]}>
            <div className="aurora-screen">
              <p>alpha</p>
            </div>
          </GalaxyMockup>
        </div>
      </DemoCard>
    </div>
  )
}
