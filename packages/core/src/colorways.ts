import type { GalaxyVariant } from './devices/phone/dimensions'
import type { IPhoneVariant } from './devices/iphone/dimensions'
import type { FoldVariant } from './devices/fold/dimensions'
import type { FlipVariant } from './devices/flip/dimensions'
import type { LaptopVariant } from './devices/laptop/dimensions'
import type { TabletVariant } from './devices/tablet/dimensions'
import type { AppleWatchVariant, GalaxyWatchVariant } from './devices/watch/dimensions'

/**
 * The well-known retail colorways of every device, as pure data. Each device
 * component accepts a `colorway` prop taking one of these ids and presets its
 * `color` / `frameColor` (explicit color props still win). Limited editions
 * and store exclusives beyond the headline palette are left out on purpose —
 * pass custom `color` values for those.
 */
export interface Colorway {
  /** Stable id for the `colorway` prop (lowercase, no spaces). */
  id: string
  /** Retail marketing name. */
  name: string
  /** Body / back-panel color. */
  color: string
  /** Frame, buttons and camera-ring color (devices with a metal frame). */
  frameColor?: string
}

export const GALAXY_COLORWAYS: Record<GalaxyVariant, Colorway[]> = {
  s26: [
    { id: 'navy', name: 'Navy', color: '#2a3245', frameColor: '#3d4557' },
    { id: 'cobaltviolet', name: 'Cobalt Violet', color: '#6f6791', frameColor: '#5a5478' },
    { id: 'icyblue', name: 'Icy Blue', color: '#b8cfe0', frameColor: '#a3b9cc' },
    { id: 'mint', name: 'Mint', color: '#bcd8c6', frameColor: '#a5c2af' },
    { id: 'silvershadow', name: 'Silver Shadow', color: '#d3d6dd', frameColor: '#b6bac4' },
  ],
  s26ultra: [
    { id: 'titaniumsilverblue', name: 'Titanium Silverblue', color: '#a9bdce', frameColor: '#c2ccd7' },
    { id: 'titaniumblack', name: 'Titanium Black', color: '#15171d', frameColor: '#3a3f47' },
    { id: 'titaniumgray', name: 'Titanium Gray', color: '#7c8188', frameColor: '#8f949b' },
    { id: 'titaniumwhitesilver', name: 'Titanium Whitesilver', color: '#dcdee1', frameColor: '#c8ccd2' },
  ],
}

export const IPHONE_COLORWAYS: Record<IPhoneVariant, Colorway[]> = {
  '17': [
    { id: 'black', name: 'Black', color: '#1a1c20', frameColor: '#3f434b' },
    { id: 'white', name: 'White', color: '#f2f2f4', frameColor: '#d8d8dc' },
    { id: 'lavender', name: 'Lavender', color: '#cfc4e6', frameColor: '#b9aed3' },
    { id: 'mistblue', name: 'Mist Blue', color: '#b7c9dd', frameColor: '#a2b4c8' },
    { id: 'sage', name: 'Sage', color: '#aebfae', frameColor: '#99ab99' },
  ],
  air: [
    { id: 'spaceblack', name: 'Space Black', color: '#232527', frameColor: '#404347' },
    { id: 'cloudwhite', name: 'Cloud White', color: '#f0f0f2', frameColor: '#d9d9dd' },
    { id: 'lightgold', name: 'Light Gold', color: '#e6d9c0', frameColor: '#d1c3a8' },
    { id: 'skyblue', name: 'Sky Blue', color: '#bfd4e6', frameColor: '#a9c0d4' },
  ],
  pro: [
    { id: 'silver', name: 'Silver', color: '#dfe0e2', frameColor: '#c6c8cc' },
    { id: 'cosmicorange', name: 'Cosmic Orange', color: '#c96b34', frameColor: '#b25c2a' },
    { id: 'deepblue', name: 'Deep Blue', color: '#2b3a55', frameColor: '#3d4d6b' },
  ],
  promax: [
    { id: 'silver', name: 'Silver', color: '#dfe0e2', frameColor: '#c6c8cc' },
    { id: 'cosmicorange', name: 'Cosmic Orange', color: '#c96b34', frameColor: '#b25c2a' },
    { id: 'deepblue', name: 'Deep Blue', color: '#2b3a55', frameColor: '#3d4d6b' },
  ],
}

export const FOLD_COLORWAYS: Record<FoldVariant, Colorway[]> = {
  fold7: [
    { id: 'blueshadow', name: 'Blue Shadow', color: '#47536b', frameColor: '#5a6579' },
    { id: 'jetblack', name: 'Jet Black', color: '#17181c', frameColor: '#33363c' },
    { id: 'silvershadow', name: 'Silver Shadow', color: '#c9ccce', frameColor: '#b9bcbe' },
    { id: 'mint', name: 'Mint', color: '#cfe0d2', frameColor: '#b4c9b8' },
  ],
}

export const FLIP_COLORWAYS: Record<FlipVariant, Colorway[]> = {
  flip7: [
    { id: 'blueshadow', name: 'Blue Shadow', color: '#47536b', frameColor: '#5a6579' },
    { id: 'jetblack', name: 'Jet Black', color: '#17181c', frameColor: '#33363c' },
    { id: 'coralred', name: 'Coral Red', color: '#e5502e', frameColor: '#f06a45' },
    { id: 'mint', name: 'Mint', color: '#cfe0d2', frameColor: '#b4c9b8' },
  ],
}

const MACBOOK_AIR_COLORS: Colorway[] = [
  { id: 'silver', name: 'Silver', color: '#e3e4e6' },
  { id: 'starlight', name: 'Starlight', color: '#e8e0d4' },
  { id: 'midnight', name: 'Midnight', color: '#2e3642' },
  { id: 'skyblue', name: 'Sky Blue', color: '#aec6d9' },
]

const MACBOOK_PRO_COLORS: Colorway[] = [
  { id: 'spaceblack', name: 'Space Black', color: '#4a484b' },
  { id: 'silver', name: 'Silver', color: '#e3e4e6' },
]

export const LAPTOP_COLORWAYS: Record<LaptopVariant, Colorway[]> = {
  air13: MACBOOK_AIR_COLORS,
  air15: MACBOOK_AIR_COLORS,
  pro14: MACBOOK_PRO_COLORS,
  pro16: MACBOOK_PRO_COLORS,
}

const IPAD_PRO_COLORS: Colorway[] = [
  { id: 'spaceblack', name: 'Space Black', color: '#3a383c' },
  { id: 'silver', name: 'Silver', color: '#d6d8da' },
]

const IPAD_AIR_COLORS: Colorway[] = [
  { id: 'spacegray', name: 'Space Gray', color: '#7d7b80' },
  { id: 'starlight', name: 'Starlight', color: '#e7e2de' },
  { id: 'purple', name: 'Purple', color: '#e4deea' },
  { id: 'blue', name: 'Blue', color: '#d9e7e8' },
]

export const TABLET_COLORWAYS: Record<TabletVariant, Colorway[]> = {
  ipadpro13: IPAD_PRO_COLORS,
  ipadpro11: IPAD_PRO_COLORS,
  ipadair13: IPAD_AIR_COLORS,
  ipadair11: IPAD_AIR_COLORS,
  ipad11: [
    { id: 'silver', name: 'Silver', color: '#e9eaec' },
    { id: 'blue', name: 'Blue', color: '#92b3d6' },
    { id: 'pink', name: 'Pink', color: '#f9899c' },
    { id: 'yellow', name: 'Yellow', color: '#fbe778' },
  ],
  tabs11: [
    { id: 'gray', name: 'Gray', color: '#63656a' },
    { id: 'silver', name: 'Silver', color: '#d3d4d8' },
  ],
  tabs11ultra: [
    { id: 'gray', name: 'Gray', color: '#63656a' },
    { id: 'silver', name: 'Silver', color: '#d3d4d8' },
  ],
}

export const APPLE_WATCH_COLORWAYS: Record<AppleWatchVariant, Colorway[]> = {
  series11: [
    { id: 'jetblack', name: 'Jet Black', color: '#1c1d21' },
    { id: 'spacegray', name: 'Space Gray', color: '#7a7d82' },
    { id: 'rosegold', name: 'Rose Gold', color: '#e7c4bb' },
    { id: 'silver', name: 'Silver', color: '#e2e3e5' },
  ],
}

export const GALAXY_WATCH_COLORWAYS: Record<GalaxyWatchVariant, Colorway[]> = {
  watch8: [
    { id: 'graphite', name: 'Graphite', color: '#33363c' },
    { id: 'silver', name: 'Silver', color: '#d9dbde' },
  ],
}

export const MONITOR_COLORWAYS: Colorway[] = [
  { id: 'silver', name: 'Silver', color: '#c8cbd0' },
]

/** Resolve a colorway id against a catalog (undefined when not found). */
export function findColorway(catalog: Colorway[] | undefined, id: string | undefined): Colorway | undefined {
  if (!catalog || !id) return undefined
  return catalog.find((entry) => entry.id === id)
}
