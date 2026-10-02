import * as React from 'react'
import { useCurrentFrame } from 'remotion'
import { Cut, Face, type ArtName } from '../kit'

/*
 * Grove, a cold-pressed juice: everything it prints. One serif, one sans,
 * three flavours, and every picture a cut-out on the stock it is printed on.
 */

export const SERIF = '"Fraunces Variable", Fraunces, Georgia, serif'
export const SANS = '"Inter Variable", Inter, system-ui, sans-serif'

export const GROVE = {
  green: '#1d3a2a',
  deep: '#11261b',
  cream: '#f8f1e3',
  paper: '#fffaf0',
  blood: '#b8231b',
  orange: '#f0772a',
  sun: '#ffb25b',
  lemon: '#f4c430',
  leaf: '#4f8a3a',
}

export interface Flavour {
  id: 'blood' | 'lemon' | 'apple'
  name: string
  lines: [string, string]
  art: ArtName
  /** The carton's print and board colour. */
  ground: string
  ink: string
  /** The disc behind the fruit. */
  sun: string
  notes: string
  number: string
}

export const FLAVOURS: Flavour[] = [
  {
    id: 'blood',
    name: 'Blood Orange',
    lines: ['Blood', 'Orange'],
    art: 'grove-blood-orange',
    ground: '#b8231b',
    ink: '#fff4e4',
    sun: '#e8542a',
    notes: 'Blood orange, navel orange, a squeeze of lime.',
    number: '01',
  },
  {
    id: 'lemon',
    name: 'Lemon & Ginger',
    lines: ['Lemon', '& Ginger'],
    art: 'grove-lemon-ginger',
    ground: '#f2c230',
    ink: '#1d3a2a',
    sun: '#ffe07a',
    notes: 'Meyer lemon, fresh ginger root, pink lady apple.',
    number: '02',
  },
  {
    id: 'apple',
    name: 'Green Apple & Mint',
    lines: ['Green Apple', '& Mint'],
    art: 'grove-green-apple',
    ground: '#2f6b3a',
    ink: '#f3f7e6',
    sun: '#4f8f45',
    notes: 'Granny smith, garden mint, cucumber.',
    number: '03',
  },
]

/** The mark: the word, and a leaf for a full stop. */
export function Wordmark({ size, color, leaf = GROVE.leaf, style }: { size: string; color: string; leaf?: string; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'flex-end',
        fontFamily: SERIF,
        fontWeight: 760,
        fontSize: size,
        letterSpacing: '-0.05em',
        lineHeight: 0.8,
        color,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      grove
      <span
        style={{
          display: 'inline-block',
          width: '0.24em',
          height: '0.24em',
          marginLeft: '0.03em',
          marginBottom: '0.02em',
          background: leaf,
          borderRadius: '0 80% 0 80%',
          transform: 'rotate(-10deg)',
        }}
      />
    </div>
  )
}

const small = (size: string, extra?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: SANS,
  fontSize: size,
  fontWeight: 500,
  letterSpacing: '-0.005em',
  lineHeight: 1.35,
  ...extra,
})

const caps = (size: string, extra?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: SANS,
  fontSize: size,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  ...extra,
})

/* ------------------------------------------------------------------ */
/*  The carton                                                         */
/* ------------------------------------------------------------------ */

/** The front wall: the name, the fruit on a low sun, the promise in a band. */
export function CartonFront({ flavour: f }: { flavour: Flavour }) {
  return (
    <Face ground={f.ground} ink={f.ink} font={SERIF} style={{ padding: '9cqw 8cqw 0' }}>
      <div aria-hidden style={{ position: 'absolute', left: '-14cqw', top: '47cqh', width: '128cqw', aspectRatio: 1, borderRadius: '50%', background: f.sun }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <Wordmark size="21cqw" color={f.ink} leaf={f.id === 'apple' ? '#a9d66e' : GROVE.leaf} />
        <div style={caps('3.2cqw', { textAlign: 'right', lineHeight: 1.3, marginTop: '1.4cqw' })}>
          No. {f.number}
          <br />
          Cold-pressed
        </div>
      </div>
      <div style={{ position: 'relative', marginTop: '7cqh', fontWeight: 640, fontSize: f.lines[0].length > 6 ? '13.6cqw' : '17cqw', lineHeight: 0.9, letterSpacing: '-0.035em' }}>
        {f.lines[0]}
        <br />
        <span style={{ fontStyle: 'italic', fontWeight: 420 }}>{f.lines[1]}</span>
      </div>
      <div style={small('3.9cqw', { position: 'relative', marginTop: '2.6cqh', maxWidth: '70cqw', opacity: 0.9 })}>{f.notes}</div>
      <Cut name={f.art} style={{ left: '-6cqw', top: '50cqh', width: '112cqw', filter: 'drop-shadow(0 2cqw 2.4cqw rgba(0,0,0,0.25))' }} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '11cqh',
          background: GROVE.cream,
          color: GROVE.green,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8cqw',
        }}
      >
        <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '6.4cqw', fontWeight: 500, letterSpacing: '-0.02em' }}>Squeezed this morning</span>
        <span style={caps('3.4cqw', { letterSpacing: '0.08em' })}>1.75 L</span>
      </div>
    </Face>
  )
}

/** The wall a three-quarter turn shows: who pressed it, and when. */
export function CartonStory({ flavour: f }: { flavour: Flavour }) {
  return (
    <Face ground={GROVE.cream} ink={GROVE.green} font={SERIF} style={{ padding: '10cqw 9cqw 0' }}>
      <div style={caps('3.4cqw', { color: f.ground === '#f2c230' ? GROVE.green : f.ground })}>Pressed at dawn</div>
      <div style={{ fontSize: '10.2cqw', fontWeight: 600, lineHeight: 0.98, letterSpacing: '-0.03em', marginTop: '4cqw' }}>
        Picked Monday.
        <br />
        Pressed Tuesday.
        <br />
        <span style={{ fontStyle: 'italic', fontWeight: 420 }}>Gone by Wednesday.</span>
      </div>
      <div style={small('3.6cqw', { marginTop: '2.4cqh', maxWidth: '82cqw' })}>
        Every bottle comes from one grove, forty minutes up the road. No concentrate, no heat, nothing added.
      </div>
      <div aria-hidden style={{ position: 'absolute', left: '-20cqw', right: '-20cqw', bottom: '-44cqw', height: '96cqw', borderRadius: '50%', background: f.ground === '#f2c230' ? '#f6d25c' : '#f3c8a2' }} />
      <Cut name="grove-farmer" style={{ left: '22cqw', bottom: 0, width: '66cqw' }} />
    </Face>
  )
}

/** The other side wall: the facts panel, set the way the regulation sets it. */
export function CartonFacts() {
  const rows: [string, string, boolean?][] = [
    ['Total Fat 0g', '0%', true],
    ['Sodium 10mg', '0%', true],
    ['Total Carbohydrate 26g', '9%', true],
    ['Total Sugars 21g', '', false],
    ['Incl. 0g Added Sugars', '0%', false],
    ['Protein 1g', '', true],
    ['Vitamin C 96mg', '106%', false],
    ['Potassium 450mg', '10%', false],
  ]
  return (
    <Face ground={GROVE.cream} ink="#111" font={SANS} style={{ padding: '10cqw 9cqw' }}>
      <div style={{ border: '0.8cqw solid #111', padding: '2.4cqw 3cqw', fontFamily: SANS }}>
        <div style={{ fontSize: '10.4cqw', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>Nutrition Facts</div>
        <div style={{ fontSize: '3.6cqw', borderBottom: '0.5cqw solid #111', padding: '1cqw 0' }}>About 7 servings per container</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '4.4cqw', fontWeight: 800, borderBottom: '2.4cqw solid #111', padding: '1cqw 0' }}>
          <span>Serving size</span>
          <span>8 fl oz (240mL)</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1.4cqw solid #111', padding: '1cqw 0' }}>
          <span style={{ fontSize: '7.4cqw', fontWeight: 900 }}>Calories</span>
          <span style={{ fontSize: '11cqw', fontWeight: 900, lineHeight: 1 }}>110</span>
        </div>
        {rows.map(([label, value, bold]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '3.8cqw', fontWeight: bold ? 800 : 400, borderBottom: '0.3cqw solid #111', padding: '0.9cqw 0' }}>
            <span>{label}</span>
            <span style={{ fontWeight: 800 }}>{value}</span>
          </div>
        ))}
      </div>
      <div style={small('3.4cqw', { marginTop: '5cqw', color: GROVE.green })}>
        Unpasteurized. Keep refrigerated below 41°F and enjoy within five days of pressing. It settles because it is real: shake well.
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', gap: '0.7cqw', alignItems: 'flex-end', height: '12cqh' }}>
        {Array.from({ length: 34 }, (_, i) => (
          <div key={i} style={{ width: `${[0.6, 1.2, 0.4, 0.9, 1.6][i % 5]}cqw`, height: '100%', background: '#111' }} />
        ))}
      </div>
    </Face>
  )
}

/** The back wall: three lines and the ingredients. */
export function CartonBack({ flavour: f }: { flavour: Flavour }) {
  return (
    <Face ground={f.ground} ink={f.ink} font={SERIF} style={{ padding: '12cqw 9cqw' }}>
      <div style={{ fontSize: '15cqw', fontWeight: 640, lineHeight: 0.94, letterSpacing: '-0.035em' }}>
        No concentrate.
        <br />
        No heat.
        <br />
        <span style={{ fontStyle: 'italic', fontWeight: 420 }}>No hurry.</span>
      </div>
      <div style={caps('3.2cqw', { marginTop: '8cqh', opacity: 0.85 })}>Ingredients</div>
      <div style={small('4.2cqw', { marginTop: '1.6cqw' })}>{f.notes}</div>
      <Cut name="grove-leaves" style={{ right: '-16cqw', bottom: '-6cqh', width: '86cqw', transform: 'rotate(-24deg)' }} />
    </Face>
  )
}

/** A roof slope. The cap rides over the front one's right half, so the mark keeps to the left. */
export function CartonGable({ flavour: f }: { flavour: Flavour }) {
  return (
    <Face ground={f.ground} ink={f.ink} font={SERIF} style={{ alignItems: 'flex-start', justifyContent: 'center', padding: '6cqh 6cqw 0' }}>
      <Wordmark size="10.5cqw" color={f.ink} leaf={f.id === 'apple' ? '#a9d66e' : GROVE.leaf} />
      <div style={caps('2.6cqw', { marginTop: '5cqh' })}>Shake well</div>
    </Face>
  )
}

/* ------------------------------------------------------------------ */
/*  The bag                                                            */
/* ------------------------------------------------------------------ */

/** Kraft shows through: one green ink, the crate, one line. */
export function BagFront() {
  return (
    <Face ink={GROVE.green} font={SERIF} style={{ alignItems: 'center', padding: '11cqw 8cqw 0', textAlign: 'center' }}>
      <Wordmark size="30cqw" color={GROVE.green} />
      <div style={caps('3.2cqw', { marginTop: '5cqw' })}>Cold-pressed juice · since 2019</div>
      <Cut name="grove-crate" style={{ left: '11cqw', bottom: '16cqh', width: '78cqw' }} />
      <div style={{ position: 'absolute', bottom: '6cqh', left: 0, right: 0, fontStyle: 'italic', fontSize: '7.6cqw', fontWeight: 420, letterSpacing: '-0.02em' }}>
        Good mornings, carried home.
      </div>
    </Face>
  )
}

export function BagBack() {
  return (
    <Face ink={GROVE.green} font={SERIF} style={{ padding: '12cqw 9cqw' }}>
      <div style={{ fontSize: '12cqw', fontWeight: 640, lineHeight: 0.95, letterSpacing: '-0.035em' }}>
        Grown by people
        <br />
        <span style={{ fontStyle: 'italic', fontWeight: 420 }}>who know your name.</span>
      </div>
      <Cut name="grove-farmer" style={{ left: '18cqw', bottom: 0, width: '70cqw' }} />
    </Face>
  )
}

/* ------------------------------------------------------------------ */
/*  The street                                                         */
/* ------------------------------------------------------------------ */

/** The shelter's street-facing six-sheet. */
export function ShelterPoster() {
  return (
    <Face ground={GROVE.cream} ink={GROVE.green} font={SERIF} style={{ padding: '9cqw 8cqw' }}>
      <div aria-hidden style={{ position: 'absolute', left: '18cqw', top: '30cqh', width: '110cqw', aspectRatio: 1, borderRadius: '50%', background: `radial-gradient(circle at 40% 40%, ${GROVE.sun}, ${GROVE.orange})` }} />
      <Wordmark size="13cqw" color={GROVE.green} />
      <div style={{ position: 'relative', marginTop: '7cqw', fontSize: '15.4cqw', fontWeight: 640, lineHeight: 0.9, letterSpacing: '-0.04em' }}>
        From our
        <br />
        grove to
        <br />
        <span style={{ fontStyle: 'italic', fontWeight: 420 }}>your morning.</span>
      </div>
      <Cut name="grove-farmer" style={{ right: '-10cqw', bottom: 0, width: '84cqw' }} />
      <Cut name="grove-glass" style={{ left: '6cqw', bottom: '6cqh', width: '24cqw', filter: 'drop-shadow(0 1cqw 1.6cqw rgba(0,0,0,0.3))' }} />
      <div style={caps('2.8cqw', { position: 'absolute', left: '8cqw', top: '93cqh' })}>On shelves by noon</div>
    </Face>
  )
}

/** The waiting side: today's batch, counted. */
export function ShelterInner() {
  return (
    <Face ground={GROVE.blood} ink={GROVE.cream} font={SERIF} style={{ padding: '9cqw 8cqw' }}>
      <div style={caps('3.2cqw')}>Today's batch</div>
      <div style={{ fontSize: '30cqw', fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 0.9, marginTop: '4cqw' }}>412</div>
      <div style={{ fontSize: '9cqw', fontStyle: 'italic', fontWeight: 420, lineHeight: 1 }}>bottles, pressed at 5:40 am.</div>
      <Cut name="grove-slice" style={{ left: '30cqw', top: '50cqh', width: '80cqw', transform: 'rotate(12deg)' }} />
      <Wordmark size="12cqw" color={GROVE.cream} style={{ marginTop: 'auto', position: 'relative' }} />
    </Face>
  )
}

/** The sidewalk board outside the shop. */
export function MenuBoard() {
  const items: [string, string][] = [
    ['Blood Orange', '$7'],
    ['Lemon & Ginger', '$7'],
    ['Green Apple & Mint', '$8'],
    ['The Morning Flight', '$18'],
  ]
  return (
    <Face ground={GROVE.green} ink={GROVE.cream} font={SERIF} style={{ padding: '10cqw 9cqw' }}>
      <div style={caps('3.4cqw', { color: GROVE.sun })}>Fresh-pressed today</div>
      <div style={{ fontSize: '17cqw', fontWeight: 640, lineHeight: 0.92, letterSpacing: '-0.04em', marginTop: '3cqw' }}>
        Juice,
        <br />
        <span style={{ fontStyle: 'italic', fontWeight: 400 }}>still cold.</span>
      </div>
      <div style={{ marginTop: '6cqw', display: 'flex', flexDirection: 'column', gap: '2.2cqw', width: '58cqw' }}>
        {items.map(([name, price]) => (
          <div key={name} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `0.4cqw dotted ${GROVE.cream}66`, paddingBottom: '1.4cqw', ...small('4.4cqw', { fontWeight: 600 }) }}>
            <span>{name}</span>
            <span>{price}</span>
          </div>
        ))}
      </div>
      <Cut name="grove-glass" style={{ right: '-2cqw', bottom: '4cqh', width: '30cqw', filter: 'drop-shadow(0 2cqw 2cqw rgba(0,0,0,0.35))' }} />
      <Wordmark size="12cqw" color={GROVE.cream} style={{ marginTop: 'auto' }} />
    </Face>
  )
}

export function MenuBoardBack() {
  return (
    <Face ground={GROVE.cream} ink={GROVE.green} font={SERIF} style={{ padding: '12cqw 9cqw', alignItems: 'center', textAlign: 'center' }}>
      <Wordmark size="24cqw" color={GROVE.green} />
      <div style={{ fontSize: '12cqw', fontStyle: 'italic', marginTop: '10cqw', lineHeight: 1 }}>Open 7am</div>
      <div style={caps('3.6cqw', { marginTop: '4cqw' })}>till the juice runs out</div>
      <Cut name="grove-crate" style={{ left: '6cqw', bottom: '4cqh', width: '88cqw' }} />
    </Face>
  )
}

/* ------------------------------------------------------------------ */
/*  The van                                                            */
/* ------------------------------------------------------------------ */

/**
 * One flank of the delivery van, full wrap. On the curb side the wrap runs
 * tail to nose and on the street side nose to tail, so `street` mirrors the
 * placement: the fruit always rides toward the tail and the name toward the
 * nose, where the cab's glass is carved out above it.
 */
export function VanSide({ street = false }: { street?: boolean }) {
  const fromTail = (cqw: number): React.CSSProperties => (street ? { right: `${cqw}cqw` } : { left: `${cqw}cqw` })
  return (
    <Face ground={GROVE.green} ink={GROVE.cream} font={SERIF}>
      <div aria-hidden style={{ position: 'absolute', ...fromTail(-8), bottom: '-40cqh', width: '52cqw', aspectRatio: 1, borderRadius: '50%', background: GROVE.orange }} />
      <Cut name="grove-blood-orange" style={{ ...fromTail(1), top: '30cqh', width: '22cqw' }} />
      <Cut name="grove-lemon-ginger" style={{ ...fromTail(17), top: '44cqh', width: '19cqw' }} />
      <Cut name="grove-green-apple" style={{ ...fromTail(-2), top: '62cqh', width: '18cqw' }} />
      <div style={{ position: 'absolute', ...fromTail(38), top: '30cqh' }}>
        <Wordmark size="12cqw" color={GROVE.cream} />
        <div style={{ fontSize: '3.3cqw', fontStyle: 'italic', fontWeight: 420, marginTop: '5cqh', letterSpacing: '-0.01em', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
          Squeezed this morning.
          <br />
          At your door by eight.
        </div>
      </div>
    </Face>
  )
}

export function VanRear() {
  return (
    <Face ground={GROVE.green} ink={GROVE.cream} font={SERIF} style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <Cut name="grove-slice" style={{ left: '25cqw', top: '8cqh', width: '50cqw' }} />
      <div style={{ position: 'absolute', top: '62cqh', left: 0, right: 0 }}>
        <Wordmark size="15cqw" color={GROVE.cream} />
        <div style={{ fontSize: '5cqw', fontStyle: 'italic', fontWeight: 420, marginTop: '3cqh' }}>Follow us to breakfast.</div>
      </div>
    </Face>
  )
}

/* ------------------------------------------------------------------ */
/*  The billboard                                                      */
/* ------------------------------------------------------------------ */

/** The 48-sheet: the line on the left, the whole range on a rising sun. */
export function Billboard() {
  const frame = useCurrentFrame()
  return (
    <Face ground={GROVE.cream} ink={GROVE.green} font={SERIF} style={{ padding: '9cqh 4cqw' }}>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: '52cqw',
          top: `${30 - frame * 0.04}cqh`,
          width: '46cqw',
          aspectRatio: 1,
          borderRadius: '50%',
          background: `radial-gradient(circle at 45% 40%, ${GROVE.sun}, ${GROVE.orange})`,
        }}
      />
      <div style={{ fontSize: '25cqh', fontWeight: 640, lineHeight: 0.9, letterSpacing: '-0.04em', position: 'relative' }}>
        Squeezed
        <br />
        <span style={{ fontStyle: 'italic', fontWeight: 420 }}>this morning.</span>
      </div>
      <Wordmark size="17cqh" color={GROVE.green} style={{ position: 'absolute', left: '4cqw', bottom: '10cqh' }} />
      <div style={caps('4.4cqh', { position: 'absolute', left: '19cqw', bottom: '12cqh' })}>Cold-pressed in small batches</div>
      <Cut name="grove-lemon-ginger" style={{ left: '48cqw', top: '34cqh', height: '60cqh' }} />
      <Cut name="grove-green-apple" style={{ left: '80cqw', top: '36cqh', height: '58cqh' }} />
      <Cut name="grove-glass" style={{ left: '68cqw', top: '6cqh', height: '90cqh', filter: 'drop-shadow(0 2cqh 3cqh rgba(0,0,0,0.25))' }} />
      <Cut name="grove-blood-orange" style={{ left: '58cqw', top: '44cqh', height: '56cqh' }} />
    </Face>
  )
}
