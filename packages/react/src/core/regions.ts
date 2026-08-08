/**
 * Region registry + framing: the cross-binding contract for mockup surfaces
 * and stage framing.
 *
 * Every device/object spec declares its live (DOM-backed) regions here as pure
 * data. Region names are the API contract shared by every binding: the React
 * binding derives its compound slot components from them (`front` →
 * `<AFrameSign.Front>`), and the planned 2D renderers address the same names.
 *
 * Framing is the per-object stage math that used to live in each React
 * wrapper: camera pose, float intensity and the ground line the contact
 * shadow hugs. Declaring it in core means every binding frames an object
 * identically without porting per-wrapper arithmetic.
 */

/** One live (printable / DOM-backed) region of a device or object. */
export interface RegionSpec {
  /**
   * Region identifier in camelCase - the slot name in every binding.
   * The FIRST region in a spec's list is the primary one: the region that
   * bare (non-slot) children render into.
   */
  name: string
  /** Short human label for docs and dev warnings. */
  label: string
}

/** The single-screen region list shared by every device (phone, laptop…). */
export const SCREEN_REGIONS = [{ name: 'screen', label: 'Screen' }] as const satisfies readonly RegionSpec[]

/**
 * Corner rounding of a region, in world units: one value, or per-corner
 * (top-left, top-right, bottom-right, bottom-left). Structurally identical to
 * `ScreenRadius` in `screen/surface`, restated here so the spec layer stays
 * independent of the screen layer.
 */
export type RegionRadius = number | readonly [number, number, number, number]

/**
 * The measured geometry of one live region: the rect content is mapped onto,
 * in world units, plus the CSS pixel width its virtual surface defaults to.
 *
 * These are exactly the numbers a binding feeds its screen bridge - the React
 * binding's `<DeviceScreen width height radius resolution>` - so declaring
 * them next to the dimensions makes the same values available to a developer
 * (via `mockupInfo`) without rendering anything.
 */
export interface RegionMetrics {
  /** Width of the live rect in world units. */
  readonly width: number
  /** Height of the live rect in world units. */
  readonly height: number
  /** Corner rounding in world units. Defaults to 0 (a square-cornered rect). */
  readonly radius?: RegionRadius
  /** CSS pixel width the region's virtual surface defaults to. */
  readonly resolution: number
}

/**
 * Per-mockup measurements, declared next to the object's dimensions - the
 * metrics sibling of `MockupFraming`.
 *
 * `P` is the (plain-data) subset of the object's props the geometry depends
 * on: variant, orientation, physical size, open/closed… A region resolves to an
 * array when its one slot is painted onto several distinct surfaces - the van's
 * nose and tail licence plates. The array carries the surface COUNT; the entries
 * may or may not differ in size.
 */
export interface MockupMetrics<P = Record<string, never>> {
  /**
   * Millimetres per world unit. A plain number for the families that pin one
   * scale for every variant (all the devices, most objects); a function for
   * the ones that normalize a caller's millimetre size onto a fixed world
   * size, where the scale is itself a function of the props (`customBox`,
   * `customPanel`, `productBox`, `mailerBox`, `shoppingBag`).
   */
  readonly mmPerUnit: number | ((props: P) => number)
  /** Live geometry per region name, resolved against the object's props. */
  readonly regions: (props: P) => Record<string, RegionMetrics | RegionMetrics[]>
}

/** Camera pose a mockup wrapper frames its object with. */
export interface CameraFraming {
  readonly position: readonly [number, number, number]
  readonly fov: number
}

/**
 * Gap between an object's lowest point and the contact-shadow plane while the
 * float idle animation hovers it.
 */
export const FLOAT_SHADOW_GAP = 0.3

/** Default contact gap between a grounded object and its shadow plane. */
export const CONTACT_SHADOW_GAP = 0.02

/**
 * Per-object stage framing, declared next to the object's dimensions.
 * `P` is the (plain-data) subset of the object's props the math depends on -
 * variant, orientation, physical size…
 */
export interface MockupFraming<P = Record<string, never>> {
  /** Camera pose when the user doesn't override it; omit for the stage default. */
  readonly camera?: CameraFraming
  /** Amplitude scale for the float idle animation (1 = phone-sized default). */
  readonly floatIntensity?: number
  /**
   * How far the object's lowest point sits below its group origin, in world
   * units - the ground line the contact shadow hugs.
   */
  readonly extent: (props: P) => number
  /** Gap between the grounded object and its shadow plane. */
  readonly contactGap?: number
}

/**
 * A foldable's hinge angle in degrees, from its `openAngle` prop.
 *
 * `openAngle` is one prop with two readings: the booleans are the two poses a
 * foldable is normally photographed in (`true` flat, `false` shut), and a
 * number is any angle between. Everything that has to agree on the pose - the
 * scene component, the region metrics, the shadow's ground line - resolves it
 * through here, so they cannot drift.
 */
export function foldOpenAngle(openAngle: boolean | number | undefined): number {
  if (typeof openAngle === 'number') return Math.max(0, Math.min(180, openAngle))
  return openAngle === false ? 0 : 180
}

/**
 * At or above this angle a foldable counts as flat.
 *
 * A binding renders the flat pose from one continuous screen and every other
 * angle from two half-panes pivoting at the crease, so this is where it swaps
 * between them. Deliberately a hair under 180 rather than a comfortable
 * margin: every degree inside the band renders as fully flat, so a wide band
 * is a dead zone at the top of any hinge slider - and the swap itself rebuilds
 * the live screen, which a drag should not keep triggering.
 */
export const FLAT_EPSILON = 179.95

/**
 * The contact-shadow plane's Y for a framed object: just under the object's
 * lowest point when grounded, a visible hover gap below it when floating.
 */
export function framedShadowY<P>(framing: MockupFraming<P>, props: P, float: boolean): number {
  const gap = float ? FLOAT_SHADOW_GAP : (framing.contactGap ?? CONTACT_SHADOW_GAP)
  return -(framing.extent(props) + gap)
}
