'use client'

import type { CSSProperties, ReactNode } from 'react'
import { FONT, INK, Micro, PAPER, Sheet, materialTone } from './swiss-art'
import { JetPrint, NutritionFacts, Photo, Pill, Plate, RecycleMark, RoundSeal, SERIF, UpcA } from './label-art'
import { asset } from '@/lib/base-path.mjs'

/**
 * The packaging on the carousel, each modelled on the real thing it stands
 * in for rather than on a poster:
 *
 * - the product box is a cereal box - the 190 × 265 × 55 mm blank IS the
 *   cereal-box proportion - with the brand tab, the bowl, the seals, the net
 *   weight across the foot and the Nutrition Facts down the side;
 * - the mailer box is a coffee roaster's shipper, one colour of ink on
 *   corrugate: the name set black and tight across the lid, the roast date
 *   jetted on, the handling pictograms along the foot and down the ends, the
 *   tape crossing the middle the way tape does;
 * - the shopping bag is a florist's carrier done the way an expensive shop
 *   does one: a botanical plate, the name set heavy and tight, one quiet
 *   line, the address at the foot, one ink, and nothing else.
 *
 * All of them print straight onto the material (`materialTone`), so the
 * carousel's finish swatches change the board under the print: white board,
 * kraft, a black box with white ink. The brand colours are solid inks and
 * stay put; the type flips to white ink on a dark board. The bag's engraving
 * (`/art/marigold.webp`) is an alpha-only plate printed through `Plate`, so
 * it flips with the type.
 *
 * Measurements are in `cqw` against each face's own width, so a side panel
 * a third as wide as the front sets its type a third the size - which is
 * exactly what a real side panel does.
 */

/* ------------------------------------------------------------------ */
/*  The cereal box                                                     */
/* ------------------------------------------------------------------ */

/** The mill's inks, with a dark-board variant so a black box stays legible. */
interface Mill {
  dark: boolean
  ink: string
  onInk: string
  green: string
  honey: string
  amber: string
  title: string
  red: string
  cream: string
}

function mill(material: string): Mill {
  const dark = materialTone(material).text !== INK
  return dark
    ? { dark, ink: PAPER, onInk: INK, green: '#2f8a5b', honey: '#f2b544', amber: '#e08a2e', title: '#f8efe0', red: '#e5574a', cream: '#fff4dc' }
    : { dark, ink: '#3a2412', onInk: '#fff4dc', green: '#1f5c3d', honey: '#f0b233', amber: '#c9741a', title: '#3a2412', red: '#c8322b', cream: '#fff4dc' }
}

/** A panel of the box: the board as the container, the print laid out inside it. */
function BoxFace({ material, style, children }: { material: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <Sheet
      tone={materialTone(material)}
      style={{ flexDirection: 'column', padding: '4.5cqw', gap: '2cqw', color: mill(material).ink, ...style }}
    >
      {children}
    </Sheet>
  )
}

const copy = (size: string, extra?: CSSProperties): CSSProperties => ({
  margin: 0,
  fontSize: size,
  lineHeight: 1.36,
  ...extra,
})

/** An ear of wheat - the mill's mark. */
function Wheat({ color, style }: { color: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 44" style={{ display: 'block', ...style }} aria-hidden>
      <path d="M12 44V14" stroke={color} strokeWidth={2} strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} fill={color}>
          <ellipse cx={8} cy={12 + i * 6} rx={3.2} ry={4.6} transform={`rotate(24 8 ${12 + i * 6})`} />
          <ellipse cx={16} cy={9 + i * 6} rx={3.2} ry={4.6} transform={`rotate(-24 16 ${9 + i * 6})`} />
        </g>
      ))}
      <ellipse cx={12} cy={6} rx={3} ry={5} fill={color} />
    </svg>
  )
}

/** The brand tab: the mill's name on a green lozenge, the ear beside it. `size` is the type size in cqw. */
function BrandTab({ p, size }: { p: Mill; size: number }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${size * 0.6}cqw`,
        background: p.green,
        color: '#fff4dc',
        borderRadius: `${size * 0.6}cqw`,
        padding: `${size * 0.5}cqw ${size * 0.95}cqw ${size * 0.5}cqw ${size * 0.75}cqw`,
        flex: 'none',
        alignSelf: 'flex-start',
      }}
    >
      <Wheat color={p.honey} style={{ height: `${size * 1.55}cqw`, width: 'auto' }} />
      <span style={{ fontFamily: FONT, fontWeight: 800, letterSpacing: '-0.01em', fontSize: `${size}cqw`, lineHeight: 1, whiteSpace: 'nowrap' }}>
        Ridgeway Mills
      </span>
    </div>
  )
}

/** The printed sunburst the bowl sits on - the one flat colour a cereal front is never without. */
function Burst({ p }: { p: Mill }) {
  const rays = Array.from({ length: 18 }, (_, i) => {
    const a0 = (i * 20 * Math.PI) / 180
    const a1 = ((i * 20 + 9) * Math.PI) / 180
    const r = 150
    return `M100 100 L${100 + r * Math.cos(a0)} ${100 + r * Math.sin(a0)} L${100 + r * Math.cos(a1)} ${100 + r * Math.sin(a1)} Z`
  }).join(' ')
  return (
    <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden>
      <defs>
        <radialGradient id="cereal-burst" cx="50%" cy="55%" r="55%">
          <stop offset="0" stopColor={p.honey} />
          <stop offset="1" stopColor={p.amber} />
        </radialGradient>
        <clipPath id="cereal-round">
          <circle cx={100} cy={100} r={98} />
        </clipPath>
      </defs>
      <circle cx={100} cy={100} r={98} fill="url(#cereal-burst)" />
      <path d={rays} fill="#ffffff" opacity={0.2} clipPath="url(#cereal-round)" />
    </svg>
  )
}

/**
 * The "Facts Up Front" strip: calories, saturated fat, sodium and sugars per
 * serving in four small tiles at the foot of the front. The US industry
 * scheme every major cereal has carried since 2011 - and the single detail
 * that most says "real box" rather than "designed box".
 */
function FactsUpFront({ p }: { p: Mill }) {
  const items: [string, string, string][] = [
    ['210', 'Calories', ''],
    ['0g', 'Sat fat', '0% DV'],
    ['190mg', 'Sodium', '8% DV'],
    ['12g', 'Sugars', ''],
  ]
  return (
    <div>
      <Micro style={{ fontSize: '1.9cqw', display: 'block', marginBottom: '0.9cqw', opacity: 0.8 }}>Per 1 cup serving</Micro>
      <div style={{ display: 'flex', gap: '1.1cqw' }}>
        {items.map(([value, label, dv]) => (
          <div
            key={label}
            style={{
              border: `0.28cqw solid ${p.ink}`,
              borderRadius: '1.6cqw',
              padding: '1cqw 1.3cqw 0.9cqw',
              textAlign: 'center',
              minWidth: '9.6cqw',
              lineHeight: 1,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '3cqw', letterSpacing: '-0.02em' }}>{value}</div>
            <div style={{ fontSize: '1.65cqw', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase', marginTop: '0.7cqw' }}>{label}</div>
            <div style={{ fontSize: '1.55cqw', opacity: dv ? 0.75 : 0, marginTop: '0.4cqw' }}>{dv || '\u00a0'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** The front: the tab, "Honey Oat Clusters", the bowl, the facts and seals, the weight. */
export function CerealFront({ material }: { material: string }) {
  const p = mill(material)
  return (
    <BoxFace material={material} style={{ gap: '1.4cqw' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2cqw' }}>
        <BrandTab p={p} size={2.7} />
        <Pill color={p.red} ink="#fff4dc" size="2.6cqw" style={{ transform: 'rotate(4deg)', marginTop: '0.4cqw' }}>
          Family size
        </Pill>
      </div>
      <div style={{ textAlign: 'center', marginTop: '0.4cqw' }}>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '12cqw', lineHeight: 0.95, color: p.amber, letterSpacing: '-0.015em' }}>
          Honey Oat
        </div>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: '16cqw', lineHeight: 0.92, letterSpacing: '-0.045em', color: p.title, marginTop: '-0.6cqw' }}>
          Clusters
        </div>
        <div style={{ fontSize: '3cqw', fontWeight: 600, marginTop: '1.4cqw', letterSpacing: '-0.005em' }}>
          Toasted whole grain oat clusters with a touch of real honey
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, position: 'relative', margin: '0.4cqw 0' }}>
        <Burst p={p} />
        {/* The hero: a photograph, as on every cereal box in the aisle. It is a
            cut-out, so the burst prints behind it and the board shows round it. */}
        <Photo src={asset('/art/cereal-bowl.webp')} fit="contain" style={{ position: 'absolute', inset: '1% 3%', width: '94%', height: '98%' }} />
        <div
          style={{
            position: 'absolute',
            top: '4%',
            right: '1%',
            background: p.red,
            color: '#fff4dc',
            fontWeight: 800,
            fontSize: '2.4cqw',
            letterSpacing: '-0.01em',
            padding: '1.2cqw 2cqw',
            borderRadius: '0.6cqw',
            transform: 'rotate(-6deg)',
            lineHeight: 1.15,
            textAlign: 'center',
          }}
        >
          New!
          <br />
          <span style={{ fontWeight: 600, letterSpacing: 0, fontSize: '2.2cqw' }}>Bigger clusters</span>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '2cqw' }}>
        <FactsUpFront p={p} />
        <div style={{ display: 'flex', gap: '1.6cqw' }}>
          <RoundSeal
            size="13.5cqw"
            legend="WHOLE GRAIN · 32g PER SERVING · "
            color={p.ink}
            center={
              <span style={{ fontSize: '3.6cqw', fontWeight: 900, letterSpacing: '-0.03em' }}>
                32<span style={{ fontSize: '2.1cqw', fontWeight: 800 }}>g</span>
              </span>
            }
          />
          <RoundSeal
            size="13.5cqw"
            legend="GOOD SOURCE OF FIBER · "
            color={p.ink}
            center={
              <span style={{ fontSize: '2.3cqw', fontWeight: 800, letterSpacing: '0.02em' }}>
                4g
                <br />
                FIBER
              </span>
            }
          />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.4cqw' }}>
        <div style={{ fontSize: '3cqw', fontWeight: 800, letterSpacing: 0, whiteSpace: 'nowrap' }}>NET WT 18 OZ (1 LB 2 OZ) 510g</div>
        <Micro style={{ fontSize: '2.1cqw', opacity: 0.72, whiteSpace: 'nowrap' }}>No artificial flavors</Micro>
      </div>
    </BoxFace>
  )
}

/** The right side: the Nutrition Facts panel, the ingredients, the UPC. */
export function CerealFacts({ material }: { material: string }) {
  const p = mill(material)
  return (
    <BoxFace material={material} style={{ padding: '5cqw', gap: '3.4cqw' }}>
      <NutritionFacts
        compact
        fontSize="6.4cqw"
        servings="About 12"
        servingSize="1 cup (55g)"
        calories="210"
        rows={[
          { label: 'Total Fat', amount: '2.5g', dv: '3%', bold: true },
          { label: 'Saturated Fat', amount: '0g', dv: '0%', indent: 1 },
          { label: 'Trans Fat', amount: '0g', indent: 1 },
          { label: 'Cholesterol', amount: '0mg', dv: '0%', bold: true },
          { label: 'Sodium', amount: '190mg', dv: '8%', bold: true },
          { label: 'Total Carbohydrate', amount: '44g', dv: '16%', bold: true },
          { label: 'Dietary Fiber', amount: '4g', dv: '14%', indent: 1 },
          { label: 'Total Sugars', amount: '12g', indent: 1 },
          { label: 'Incl. 11g Added Sugars', amount: '', dv: '22%', indent: 2 },
          { label: 'Protein', amount: '5g', bold: true },
        ]}
        micros={[
          { label: 'Vitamin D', amount: '2mcg', dv: '10%' },
          { label: 'Calcium', amount: '20mg', dv: '2%' },
          { label: 'Iron', amount: '8.1mg', dv: '45%' },
          { label: 'Potassium', amount: '180mg', dv: '4%' },
        ]}
      />
      <p style={copy('5.5cqw', { lineHeight: 1.3 })}>
        <strong>INGREDIENTS:</strong> WHOLE GRAIN OATS, SUGAR, RICE FLOUR, HONEY, CANOLA OIL, MOLASSES, SALT,
        NATURAL FLAVOR, BAKING SODA, MIXED TOCOPHEROLS (FOR FRESHNESS). VITAMINS AND MINERALS: REDUCED IRON,
        VITAMIN D3.
      </p>
      <p style={copy('5.5cqw', { lineHeight: 1.3 })}>
        <strong>CONTAINS:</strong> OATS. MAY CONTAIN WHEAT AND ALMONDS.
      </p>
      <div style={{ flex: 1 }} />
      <div style={{ background: '#ffffff', padding: '3cqw 2.5cqw 1cqw', alignSelf: 'center', width: '88%', boxSizing: 'border-box' }}>
        <UpcA digits="03881205512" color="#111111" />
      </div>
      <Micro style={{ fontSize: '4.2cqw', opacity: 0.75, textAlign: 'center', color: p.ink }}>Best if used by: see top</Micro>
    </BoxFace>
  )
}

/** The left side: the mill's story, how it is made, who to call. */
export function CerealStory({ material }: { material: string }) {
  const p = mill(material)
  const steps = [
    ['Roll', 'Whole oats, rolled thick and kept whole grain.'],
    ['Toast', 'Baked slowly with honey until the clusters hold.'],
    ['Pour', 'Into the box within a day. Nothing sits.'],
  ]
  return (
    <BoxFace material={material} style={{ padding: '5.5cqw', gap: '4cqw' }}>
      <BrandTab p={p} size={4.4} />
      <div style={{ fontFamily: SERIF, fontSize: '10.5cqw', lineHeight: 1.06, letterSpacing: '-0.01em' }}>
        Real oats, toasted in small batches since 1962.
      </div>
      <p style={copy('5.9cqw', { lineHeight: 1.38 })}>
        We started as a grain mill on the Ridgeway river, and we still buy our oats from the farms up the valley.
        Every batch is toasted in ovens you could stand in, then poured straight into the box.
      </p>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <Photo src={asset('/art/cereal-clusters.webp')} fit="contain" />
      </div>
      <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '2.6cqw' }}>
        {steps.map(([name, how], i) => (
          <li key={name} style={{ display: 'flex', gap: '3cqw', ...copy('5.6cqw', { lineHeight: 1.3 }) }}>
            <span style={{ color: p.red, fontWeight: 900, fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{i + 1}</span>
            <span>
              <strong>{name}.</strong> {how}
            </span>
          </li>
        ))}
      </ol>
      <p style={copy('5cqw', { lineHeight: 1.32, opacity: 0.85 })}>
        Questions or comments? Call 1-800-555-0142 weekdays, or write to hello@ridgewaymills.com. Please have the box
        handy.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '3cqw' }}>
        <RecycleMark color={p.ink} size="12cqw" />
        <Micro style={{ fontSize: '4cqw', lineHeight: 1.3, opacity: 0.8 }}>
          Carton: recycle
          <br />
          Liner: discard
        </Micro>
      </div>
      <Micro style={{ fontSize: '3.8cqw', opacity: 0.7, lineHeight: 1.3 }}>Made in the USA with domestic and imported ingredients · Ridgeway Mills, Lewiston, ID 83501</Micro>
    </BoxFace>
  )
}

/**
 * The top: what a carton's tuck flap carries - the tab and the name at the
 * left, the best-by jetted on at the right, the opening instruction and the
 * net weight along the front edge. The panel is 190 × 55 mm, so it is laid
 * out as two columns that can each shrink, and nothing on it is a line
 * that cannot wrap: the first draft set the name and the jet as fixed-width
 * lines that added up to more than the panel, and printed one over the
 * other.
 */
export function CerealTop({ material }: { material: string }) {
  const p = mill(material)
  return (
    <BoxFace material={material} style={{ padding: '3cqw 4.5cqw 2.6cqw', gap: '1.6cqw', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4cqw', minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6cqw', minWidth: 0 }}>
          <BrandTab p={p} size={2.2} />
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '4.6cqw', lineHeight: 1, color: p.amber }}>
            Honey Oat{' '}
            <span style={{ fontFamily: FONT, fontStyle: 'normal', fontWeight: 900, color: p.title, letterSpacing: '-0.04em' }}>Clusters</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right', gap: '1cqw', flex: 'none' }}>
          <Micro style={{ fontSize: '1.9cqw', opacity: 0.75 }}>Best if used by</Micro>
          <JetPrint color={p.ink} size="3.2cqw">
            {'14 MAR 2027\nLOT 3A7 K2 06:31'}
          </JetPrint>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '4cqw' }}>
        <Micro style={{ fontSize: '1.9cqw', opacity: 0.75 }}>▲ Lift tab to open · press to reclose</Micro>
        <Micro style={{ fontSize: '1.9cqw', opacity: 0.75, whiteSpace: 'nowrap' }}>Net wt 18 oz (510g)</Micro>
      </div>
    </BoxFace>
  )
}

/**
 * The bottom: what a carton's base carries and nobody designs - who made it
 * and where, the plant code and the line time jetted on, the recycling
 * line, and an arrow to the end that opens. Nothing big; the board is most
 * of it.
 */
export function CerealBottom({ material }: { material: string }) {
  const p = mill(material)
  return (
    <BoxFace material={material} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '3cqw 4.5cqw', gap: '4cqw' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4cqw', minWidth: 0 }}>
        <BrandTab p={p} size={2.2} />
        <Micro style={{ fontSize: '1.9cqw', lineHeight: 1.5, opacity: 0.8 }}>
          Made by Ridgeway Mills Co., Salina, Kansas 67401
          <br />
          ▲ Open other end
        </Micro>
      </div>
      <JetPrint color={p.ink} size="2.8cqw" style={{ flex: 'none', whiteSpace: 'pre' }}>
        {'PLANT 07 LINE 3\n06:31 14SEP26'}
      </JetPrint>
      <div style={{ flex: 'none' }}>
        <RecycleMark
          color={p.ink}
          size="6cqw"
          label={<Micro style={{ fontSize: '1.9cqw', lineHeight: 1.3, whiteSpace: 'nowrap' }}>Carton made from<br />100% recycled board</Micro>}
        />
      </div>
    </BoxFace>
  )
}

/**
 * One of the range: a small front, built from the same parts as the big
 * one - the tab, the flavour in the two faces, the bowl - so the three read
 * as this box's siblings rather than as three icons. It brings its own cream
 * board, because on the ink colourway the range is still a row of cream
 * boxes; that is what a photograph of them would show. `width` is the box's
 * width in cqw and everything inside scales with it; at the small width the
 * caption is dropped, because the box names itself.
 */
function MiniBox({ p, name, sub, band, width = 19, caption = true }: { p: Mill; name: [string, string]; sub: string; band: string; width?: number; caption?: boolean }) {
  const u = (n: number) => `${((n * width) / 19).toFixed(2)}cqw`
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: u(1.4), minWidth: 0 }}>
      <div
        style={{
          width: `${width}cqw`,
          aspectRatio: '190 / 265',
          background: '#fff8ea',
          border: `${u(0.25)} solid ${p.dark ? '#fff8ea' : '#3a2412'}`,
          borderRadius: u(0.7),
          boxSizing: 'border-box',
          padding: `${u(1.3)} ${u(1.2)} ${u(0.9)}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: u(0.6),
          color: '#3a2412',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            alignSelf: 'flex-start',
            background: p.green,
            color: '#fff4dc',
            fontFamily: FONT,
            fontSize: u(1),
            fontWeight: 800,
            letterSpacing: '-0.01em',
            padding: `${u(0.45)} ${u(0.7)}`,
            borderRadius: u(1),
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          Ridgeway Mills
        </span>
        <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: u(2.2), lineHeight: 1, color: band, marginTop: u(0.4), whiteSpace: 'nowrap' }}>
          {name[0]}
        </span>
        <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: u(2.6), lineHeight: 0.95, letterSpacing: '-0.04em', whiteSpace: 'nowrap' }}>
          {name[1]}
        </span>
        <div style={{ flex: 1, minHeight: 0, width: '100%', position: 'relative', marginTop: u(0.3) }}>
          <div style={{ position: 'absolute', inset: '6% 10% 2%', borderRadius: '50%', background: band, opacity: 0.18 }} />
          <Photo src={asset('/art/cereal-bowl.webp')} fit="contain" style={{ position: 'absolute', inset: 0 }} />
        </div>
      </div>
      {caption && (
        <Micro style={{ fontSize: u(1.9), textAlign: 'center', lineHeight: 1.4, whiteSpace: 'nowrap' }}>
          {name.join(' ')}
          <br />
          <span style={{ opacity: 0.7, fontWeight: 500, fontSize: '0.85em' }}>{sub}</span>
        </Micro>
      )}
    </div>
  )
}

/**
 * The back, laid out the way a cereal back is: a band of the mill's green
 * across the head with its name and its line; the parfait as the hero,
 * standing on the board at full height and off the left edge, on a plate of
 * honey; the serving suggestion beside it with the range under that; and the
 * small print in a second band of green across the foot.
 *
 * The bands are the discipline. Head and foot are fixed, and everything
 * between them lives in a block that gives way (`flex: 1`, `overflow:
 * hidden`), so the address prints on the board whatever the viewer's font
 * rasteriser does to the copy - the first draft of this back had its small
 * print pushed off the bottom by a line of wrapping.
 */
export function CerealBack({ material }: { material: string }) {
  const p = mill(material)
  const steps = [
    'Spoon ½ cup of yogurt into a tall glass.',
    'Add a handful of clusters and a few berries.',
    'Repeat, then finish with a drizzle of honey.',
    'Eat it before the clusters go soft. They won’t take long.',
  ]
  const band: CSSProperties = { background: p.green, color: '#fff4dc', padding: '0 4.5cqw', flex: 'none' }
  return (
    <Sheet tone={materialTone(material)} style={{ flexDirection: 'column', color: p.ink }}>
      {/* the head band */}
      <div style={{ ...band, height: '23cqw', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2.4cqw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2cqw' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.6cqw' }}>
            <Wheat color={p.honey} style={{ height: '5cqw', width: 'auto' }} />
            <span style={{ fontFamily: FONT, fontWeight: 800, letterSpacing: '-0.01em', fontSize: '3.2cqw', lineHeight: 1, whiteSpace: 'nowrap' }}>
              Ridgeway Mills
            </span>
          </div>
          <Micro style={{ fontSize: '1.9cqw', opacity: 0.85, whiteSpace: 'nowrap' }}>Est. 1962 · Lewiston, Idaho</Micro>
        </div>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '5cqw', lineHeight: 1.05, letterSpacing: '-0.01em' }}>
          Real oats. Real honey. Since 1962.
        </div>
      </div>

      {/* the middle, which gives way */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        {/* the plate of honey the glass stands on, bleeding off the foot */}
        <div style={{ position: 'absolute', left: '0', bottom: '-8cqw', width: '46cqw', aspectRatio: '1', borderRadius: '50%', background: p.honey, opacity: 0.26 }} />
        <div style={{ position: 'absolute', left: '-3cqw', top: '4cqw', width: '48cqw', bottom: '2.5cqw' }}>
          <Photo src={asset('/art/parfait.webp')} fit="contain" position="50% 100%" style={{ position: 'absolute', inset: 0 }} />
        </div>

        <div
          style={{
            position: 'absolute',
            left: '47cqw',
            right: '4.5cqw',
            top: '4cqw',
            bottom: '2.5cqw',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5cqw',
            overflow: 'hidden',
          }}
        >
          <Micro style={{ fontSize: '2.1cqw', color: p.red }}>Serving suggestion</Micro>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: '7.2cqw', lineHeight: 0.94, letterSpacing: '-0.045em', color: p.title }}>
            Try it
            <br />
            layered.
          </div>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '3.6cqw', lineHeight: 1.1, color: p.amber }}>
            Honey Oat Parfait{' '}
            <span style={{ fontFamily: FONT, fontStyle: 'normal', fontWeight: 600, fontSize: '1.9cqw', color: p.ink, opacity: 0.7, letterSpacing: 0, whiteSpace: 'nowrap' }}>
              5 min · serves 1
            </span>
          </div>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '1cqw' }}>
            {steps.map((step, i) => (
              <li key={step} style={{ display: 'flex', gap: '1.6cqw', ...copy('2.35cqw', { lineHeight: 1.3 }) }}>
                <span style={{ color: p.red, fontWeight: 900, fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <div style={{ height: '0.25cqw', background: p.ink, opacity: 0.25, flex: 'none', marginTop: '2.8cqw' }} />

          <Micro style={{ fontSize: '2.1cqw', color: p.red }}>Also from Ridgeway Mills</Micro>
          {/* Spaced out rather than centred in columns, so the first box sits
              on the heading's left edge and the last on the column's right. */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.4cqw' }}>
            <MiniBox p={p} width={13} caption={false} name={['Cinnamon', 'Crunch']} sub="Oats · cinnamon" band="#c8322b" />
            <MiniBox p={p} width={13} caption={false} name={['Berry', 'Clusters']} sub="Blueberry · cranberry" band="#6b3fa0" />
            <MiniBox p={p} width={13} caption={false} name={['Maple', 'Pecan']} sub="Maple · pecans" band="#7a4a1e" />
          </div>
        </div>
      </div>

      {/* the foot band */}
      <div style={{ ...band, padding: '2.6cqw 4.5cqw', minHeight: '15cqw', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3cqw' }}>
        <Micro style={{ fontSize: '1.7cqw', lineHeight: 1.55, opacity: 0.92, minWidth: 0 }}>
          Questions? Call 1-800-555-0142 weekdays
          <br />
          hello@ridgewaymills.com · ridgewaymills.com
          <br />
          Ridgeway Mills · Lewiston, ID 83501
          <br />
          Made in the USA with domestic and imported ingredients
        </Micro>
        <RecycleMark
          color="#fff4dc"
          size="5.5cqw"
          label={
            <Micro style={{ fontSize: '1.7cqw', lineHeight: 1.35, whiteSpace: 'nowrap' }}>
              Recycle carton
              <br />
              discard liner
            </Micro>
          }
        />
      </div>
    </Sheet>
  )
}

/* ------------------------------------------------------------------ */
/*  The mailer box                                                     */
/* ------------------------------------------------------------------ */

/** A panel of the shipper: one ink on corrugate. */
function ShipperFace({ material, style, children }: { material: string; style?: CSSProperties; children: ReactNode }) {
  const t = materialTone(material)
  return (
    <Sheet tone={t} style={{ flexDirection: 'column', padding: '4.5cqw', color: t.text, ...style }}>
      {children}
    </Sheet>
  )
}

/**
 * The roaster's box: Halyard Coffee Roasters, Portland, Maine. One ink on
 * corrugate and one family - Inter, set black and tight for the name and
 * small and plain for everything else - because a roaster's shipper is
 * a production object printed in one pass, and what it has to say from
 * across a room is the name and the roast date. The date is jetted on by
 * the line rather than typeset (`JetPrint`), which is the detail that makes
 * a subscription box look shipped rather than designed.
 *
 * Nothing on these faces is a long line that cannot wrap. The candle box
 * this replaces set its small print in single lines two-thirds of the lid
 * wide, and a font rasteriser that ran a few per cent wide pushed them off
 * the board; here the lines are short, the blocks can shrink, and the one
 * wide thing - the wordmark - is sized to two-thirds of the face.
 */

/** The jetted roast stamp, as the line prints it. */
const ROAST = 'ROASTED 12 SEP 2026\nLOT 0912-3 · 2 × 340 G'

/** The roaster's mark: a halyard cleat, in one stroke of the ink. */
function Cleat({ color, size }: { color: string; size: string }) {
  return (
    <svg viewBox="0 0 64 36" style={{ width: size, height: 'auto', display: 'block', flex: 'none' }} aria-hidden>
      <g fill="none" stroke={color} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 18C6 9 19 7 32 11c13-4 26-2 26 7" />
        <path d="M32 11v21" />
        <path d="M21 32h22" />
      </g>
    </svg>
  )
}

/** The name: Inter black, tightened, in regular casing. `size` is its cqw. */
function Halyard({ size, style }: { size: string; style?: CSSProperties }) {
  return (
    <span
      style={{
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        letterSpacing: '-0.055em',
        lineHeight: 0.86,
        whiteSpace: 'nowrap',
        display: 'block',
        ...style,
      }}
    >
      Halyard
    </span>
  )
}

/** The roast-date box: the one typeset frame on the box, with the jet inside it. */
function RoastStamp({ ink, size }: { ink: string; size: number }) {
  return (
    <div style={{ border: `${size * 0.11}cqw solid ${ink}`, padding: `${size * 0.6}cqw ${size * 0.8}cqw ${size * 0.55}cqw`, display: 'flex', flexDirection: 'column', gap: `${size * 0.45}cqw`, flex: 'none' }}>
      <Micro style={{ fontSize: `${size * 0.62}cqw`, opacity: 0.7, whiteSpace: 'nowrap' }}>Roast date</Micro>
      <JetPrint color={ink} size={`${size}cqw`}>
        {ROAST}
      </JetPrint>
    </div>
  )
}

/** ISO handling pictograms, drawn in the ink: the glass, the arrows, the umbrella. */
function Pictogram({ kind, color, size }: { kind: 'fragile' | 'up' | 'dry'; color: string; size: string }) {
  const stroke = { fill: 'none', stroke: color, strokeWidth: 3.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 48 48" style={{ width: size, height: size, display: 'block', flex: 'none' }} aria-hidden>
      {kind === 'fragile' && (
        <g {...stroke}>
          <path d="M14 6h20l-2 12a8 8 0 0 1-16 0z" fill={color} />
          <path d="M24 26v12M16 40h16" />
          <path d="M22 6l4 6-3 4 4 3" stroke={materialToneInverse(color)} strokeWidth={1.6} />
        </g>
      )}
      {kind === 'up' && (
        <g {...stroke}>
          <path d="M15 40V12M9 19l6-7 6 7" />
          <path d="M33 40V12M27 19l6-7 6 7" />
          <path d="M6 44h36" />
        </g>
      )}
      {kind === 'dry' && (
        <g {...stroke}>
          <path d="M6 24a18 18 0 0 1 36 0z" fill={color} />
          <path d="M24 24v14a3 3 0 0 0 6 0" />
          <path d="M10 34l-2 4M38 34l2 4M24 4v2" />
        </g>
      )}
    </svg>
  )
}

/** The mark inside a filled pictogram, which is the board showing through. */
function materialToneInverse(ink: string): string {
  return ink === PAPER ? INK : PAPER
}

/** A pictogram with its word under it. */
function Mark({ kind, ink, size, label }: { kind: 'fragile' | 'up' | 'dry' | 'recycle'; ink: string; size: number; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${size * 0.2}cqw` }}>
      {kind === 'recycle' ? <RecycleMark color={ink} size={`${size * 0.96}cqw`} /> : <Pictogram kind={kind} color={ink} size={`${size}cqw`} />}
      <Micro style={{ fontSize: `${size * 0.24}cqw`, whiteSpace: 'nowrap' }}>{label}</Micro>
    </div>
  )
}

/**
 * The lid: the name across the top zone at two-thirds of the width, the
 * tape's lane left clear through the middle, and the bottom zone split
 * between the line every roaster prints and the roast stamp with the
 * handling marks under it. Three zones, air between them, no rules.
 */
export function MailerLid({ material }: { material: string }) {
  const ink = materialTone(material).text
  return (
    <ShipperFace material={material} style={{ display: 'grid', gridTemplateRows: '1fr 30% 1fr', padding: '4.4cqw 6cqw 4.2cqw' }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 0, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '3cqw' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.6cqw', minWidth: 0 }}>
            <Cleat color={ink} size="4.2cqw" />
            <Micro style={{ fontSize: '1.8cqw' }}>Halyard Coffee Roasters</Micro>
          </div>
          <Micro style={{ fontSize: '1.8cqw', opacity: 0.7 }}>Portland, Maine</Micro>
        </div>
        <div>
          <Halyard size="15cqw" />
          <Micro style={{ fontSize: '2cqw', display: 'block', marginTop: '1.6cqw' }}>
            Whole bean coffee · Roasted to order
          </Micro>
        </div>
      </div>
      {/* the tape's lane, left clear: the band is 48 mm of the 250, and the
          lane is wider than that so the type on either side clears the tape's
          shadowed edges by a few millimetres */}
      <div />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', gap: '4cqw', minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, minWidth: 0, gap: '1.5cqw' }}>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: '4.8cqw', lineHeight: 0.98, letterSpacing: '-0.04em' }}>
            Roasted this week.
            <br />
            Open within 14 days.
          </div>
          <Micro style={{ fontSize: '1.6cqw', lineHeight: 1.65, opacity: 0.78 }}>
            Store cool and dry, in the bag, valve out.
            <br />
            Grind just before you brew · halyard.coffee
          </Micro>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', flex: 'none', gap: '1.5cqw' }}>
          <RoastStamp ink={ink} size={2} />
          <div style={{ display: 'flex', gap: '3.4cqw' }}>
            <Mark kind="up" ink={ink} size={5} label="This way up" />
            <Mark kind="dry" ink={ink} size={5} label="Keep dry" />
            <Mark kind="recycle" ink={ink} size={5} label="Recycle" />
          </div>
        </div>
      </div>
    </ShipperFace>
  )
}

/** The long front: the mark and the name at shelf height, the contents beside them. */
export function MailerFront({ material }: { material: string }) {
  const ink = materialTone(material).text
  return (
    <ShipperFace material={material} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '3cqw 5cqw', gap: '4cqw' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2.2cqw', flex: 'none' }}>
        <Cleat color={ink} size="8cqw" />
        <Halyard size="9cqw" />
      </div>
      <div style={{ textAlign: 'right', display: 'grid', gap: '1.2cqw', minWidth: 0, flex: 1, justifyItems: 'end' }}>
        <Micro style={{ fontSize: '1.7cqw' }}>Whole bean · 2 × 340 g</Micro>
        <Micro style={{ fontSize: '1.7cqw', opacity: 0.72 }}>Portland, Maine</Micro>
        <Micro style={{ fontSize: '1.6cqw', opacity: 0.72 }}>halyard.coffee</Micro>
      </div>
    </ShipperFace>
  )
}

/** An end panel: the marks either side of where the tape wraps down, the name between them. */
export function MailerEnd({ material }: { material: string }) {
  const ink = materialTone(material).text
  return (
    <ShipperFace material={material} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '4cqw 6cqw' }}>
      <Mark kind="up" ink={ink} size={13} label="This way up" />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.6cqw' }}>
        <Cleat color={ink} size="10cqw" />
        <Halyard size="6.5cqw" />
      </div>
      <Mark kind="dry" ink={ink} size={13} label="Keep dry" />
    </ShipperFace>
  )
}

/** The back: the return address and the line a shipper prints for the courier. */
export function MailerBack({ material }: { material: string }) {
  const ink = materialTone(material).text
  return (
    <ShipperFace material={material} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '3cqw 5cqw', gap: '4cqw' }}>
      <div style={{ display: 'grid', gap: '1.2cqw', minWidth: 0 }}>
        <Micro style={{ fontSize: '1.7cqw', opacity: 0.72 }}>If undeliverable, please return to</Micro>
        <Micro style={{ fontSize: '1.9cqw', lineHeight: 1.45 }}>
          Halyard Coffee Roasters
          <br />
          44 Commercial Street, Portland, ME 04101
        </Micro>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '3cqw', flex: 'none' }}>
        <Mark kind="fragile" ink={ink} size={7} label="Handle with care" />
        <Mark kind="up" ink={ink} size={7} label="This way up" />
      </div>
    </ShipperFace>
  )
}

/**
 * The bottom: the box maker's certificate - the round stamp every corrugated
 * shipper carries on its base, with the board grade and the maker in it -
 * and the recycling line. The one face that is pure compliance, printed in
 * the same one ink as the lid.
 */
export function MailerBottom({ material }: { material: string }) {
  const ink = materialTone(material).text
  return (
    <ShipperFace material={material} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '6cqw 8cqw' }}>
      <RoundSeal
        size="30cqw"
        legend="BOX MAKER'S CERTIFICATE · KESTREL BOX CO · "
        color={ink}
        center={
          <div style={{ fontFamily: FONT, display: 'grid', gap: '0.8cqw' }}>
            <span style={{ fontSize: '3.4cqw', fontWeight: 800 }}>32 ECT</span>
            <span style={{ fontSize: '1.6cqw', fontWeight: 600 }}>E-flute · single wall</span>
            <span style={{ fontSize: '1.6cqw', fontWeight: 600 }}>Size limit 75 in</span>
          </div>
        }
      />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3cqw', textAlign: 'right' }}>
        <Cleat color={ink} size="9cqw" />
        <Micro style={{ fontSize: '2cqw', lineHeight: 1.5 }}>
          Made from 90% recycled fibre.
          <br />
          Flatten and recycle with cardboard.
        </Micro>
        <Mark kind="recycle" ink={ink} size={8} label="Recycle" />
      </div>
    </ShipperFace>
  )
}

/* ------------------------------------------------------------------ */
/*  The shopping bag                                                   */
/* ------------------------------------------------------------------ */

/**
 * The florist prints in one ink. On a dark board that ink is white - not the
 * library's cream "paper" ink - because the bag the shop actually hands over
 * is black with white print; on a light board it is the near-black.
 */
function shop(material: string): { ink: string } {
  const t = materialTone(material)
  return { ink: t.text === INK ? INK : '#ffffff' }
}

/**
 * Uneven ink: fibre takes ink unevenly, so a solid on kraft is mottled rather
 * than flat. A tile of fractal noise, mapped to between about 70 and 100 %
 * coverage, masks the ink layer.
 */
const MOTTLE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='m'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2' seed='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.6 0 0 0 1.15'/></filter><rect width='240' height='240' filter='url(%23m)'/></svg>")`

/**
 * Ink on the bag's board, the way it prints. Drawn straight over the board,
 * the face read as a sticker: a block of flat ink at full strength, sharp on
 * a perfectly even brown. A one-ink carrier is a print on fibre, so:
 *
 * - the ink multiplies into the board instead of covering it - the near-black
 *   comes out a deep warm brown-black on kraft, and the plate's fine lines
 *   soften into the stock - except white ink on a dark board, which sits on
 *   top as white ink does, a little translucent;
 * - it is mottled (`MOTTLE`) and its edges a hair soft, because fibre takes
 *   ink unevenly and lets it spread;
 * - the paper is laid over everything, ink included: fibre grain, the
 *   turned-over hem along the mouth, and the soft fall-off of a bag that is
 *   not perfectly flat.
 *
 * The board is painted here too, under the ink, so the blend has the stock
 * to multiply into whatever the surface's own background is.
 */
function OnBoard({ material, children }: { material: string; children: ReactNode }) {
  const dark = materialTone(material).text !== INK
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: material, overflow: 'hidden', isolation: 'isolate' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          mixBlendMode: dark ? 'normal' : 'multiply',
          opacity: dark ? 0.88 : 0.86,
          WebkitMaskImage: MOTTLE,
          maskImage: MOTTLE,
          WebkitMaskSize: '240px 240px',
          maskSize: '240px 240px',
          filter: 'blur(0.25px)',
        }}
      >
        {children}
      </div>
      <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'multiply', opacity: dark ? 0.45 : 0.3, pointerEvents: 'none' }}>
        <filter id="bag-board-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} seed={11} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="linear" slope={0.5} intercept={0.55} />
            <feFuncG type="linear" slope={0.5} intercept={0.55} />
            <feFuncB type="linear" slope={0.5} intercept={0.55} />
          </feComponentTransfer>
        </filter>
        <rect width="100%" height="100%" filter="url(#bag-board-grain)" />
      </svg>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: '7cqh',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.07), rgba(0,0,0,0.05))',
          borderBottom: '0.3cqw solid rgba(60,40,20,0.25)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          mixBlendMode: 'multiply',
          background:
            'linear-gradient(90deg, rgba(80,55,30,0.1) 0%, rgba(80,55,30,0) 18%, rgba(80,55,30,0) 80%, rgba(80,55,30,0.12) 100%), linear-gradient(180deg, rgba(80,55,30,0) 70%, rgba(80,55,30,0.1) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

/** The florist's mark: a marigold, an engraving printed in the one ink (see `Plate`). */
const MARIGOLD = asset('/art/marigold.webp')

/**
 * The name: Inter, heavy and tightened, in regular casing, in the one ink.
 * An expensive carrier's restraint is in what is left off the bag, not in
 * letterspaced capitals or a second colour.
 */
function Wordmark({ size }: { size: string }) {
  return (
    <div style={{ fontFamily: FONT, fontSize: size, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1, whiteSpace: 'nowrap' }}>
      Marigold &amp; Moss
    </div>
  )
}

/** A line of the bag's small type: regular casing, tightened, quiet. */
function Line({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span style={{ fontFamily: FONT, fontSize: '2.2cqw', fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.45, whiteSpace: 'nowrap', ...style }}>
      {children}
    </span>
  )
}

/**
 * The front, and the discipline of a luxury carrier: the plate, the name
 * under it, one quiet line, and the address at the foot - and between them
 * the board, which is most of the bag. The block sits a little below the
 * sheet's centre: the handles and the mouth pull the eye to the top, so a
 * carrier's optical centre is lower than its geometric one, and a block on
 * the geometric centre reads as riding high.
 */
export function BagFront({ material }: { material: string }) {
  const { ink } = shop(material)
  const t = materialTone(material)
  return (
    <OnBoard material={material}>
      <Sheet tone={t} style={{ flexDirection: 'column', alignItems: 'center', padding: '8cqw 10cqw 7cqw', color: ink, textAlign: 'center' }}>
        <div style={{ flex: 1.3 }} />
        {/* 800 x 1302 in the file */}
        <Plate src={MARIGOLD} ink={ink} style={{ width: '36cqw', height: '58.6cqw' }} />
        <div style={{ marginTop: '6cqw' }}>
          <Wordmark size="7cqw" />
        </div>
        <div style={{ width: '6cqw', height: '0.28cqw', background: ink, opacity: 0.7, marginTop: '3.6cqw', flex: 'none' }} />
        <Line style={{ marginTop: '3cqw', opacity: 0.8 }}>Fleuriste · Est. 2016</Line>
        <div style={{ flex: 1, minHeight: '6cqw' }} />
        <Line style={{ fontSize: '2cqw', opacity: 0.7 }}>34 Elm Street · Northampton, Massachusetts</Line>
      </Sheet>
    </OnBoard>
  )
}

/**
 * The back: the shop's seal - the plate inside a ring of small type - with
 * the name under it and the one line the shop allows itself. A seal is what
 * the expensive bags carry on the reverse when they carry anything at all.
 * The legend is the one line of capitals on the bag, because a seal's rim
 * is where the real ones print them; it is short enough to leave a gap at
 * the join whatever the viewer's rasteriser does to Inter's widths.
 */
export function BagBack({ material }: { material: string }) {
  const { ink } = shop(material)
  const t = materialTone(material)
  return (
    <OnBoard material={material}>
      <Sheet tone={t} style={{ flexDirection: 'column', alignItems: 'center', padding: '8cqw 10cqw 7cqw', color: ink, textAlign: 'center' }}>
        <div style={{ flex: 1.3 }} />
        <RoundSeal
          size="34cqw"
          legend="MARIGOLD & MOSS · FLEURISTE · "
          color={ink}
          ring={false}
          center={<Plate src={MARIGOLD} ink={ink} style={{ width: '100%', height: '100%' }} />}
        />
        <div style={{ marginTop: '6cqw' }}>
          <Wordmark size="5cqw" />
        </div>
        <Line style={{ marginTop: '4cqw', fontSize: '2.8cqw', opacity: 0.85 }}>
          Grown slow. Cut this morning.
          <br />
          Wrapped by hand.
        </Line>
        <div style={{ flex: 1, minHeight: '6cqw' }} />
        <Line style={{ fontSize: '2cqw', opacity: 0.7 }}>Flowers · Plants · Workshops · marigoldandmoss.com</Line>
      </Sheet>
    </OnBoard>
  )
}
