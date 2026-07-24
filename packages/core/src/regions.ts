/**
 * Region registry + framing — the cross-binding contract for mockup surfaces
 * and stage framing.
 *
 * Every device/object spec declares its live (DOM-backed) regions here as pure
 * data. Region names are the API contract shared by every binding: the React
 * binding derives its compound slot components from them (`front` →
 * `<AFrameSign.Front>`), and future bindings map the same names onto their
 * framework's native slots (Svelte `slot="front"`, Vue `#front`) and onto the
 * planned 2D renderers.
 *
 * Framing is the per-object stage math that used to live in each React
 * wrapper: camera pose, float intensity and the ground line the contact
 * shadow hugs. Declaring it in core means every binding frames an object
 * identically without porting per-wrapper arithmetic.
 */

/** One live (printable / DOM-backed) region of a device or object. */
export interface RegionSpec {
  /**
   * Region identifier in camelCase — the slot name in every binding.
   * The FIRST region in a spec's list is the primary one: the region that
   * bare (non-slot) children render into.
   */
  name: string
  /** Short human label for docs and dev warnings. */
  label: string
  /**
   * The region accepts any number of slot elements, collected in document
   * order (e.g. brochure panels), instead of a single element.
   */
  repeats?: boolean
}

/** The single-screen region list shared by every device (phone, laptop…). */
export const SCREEN_REGIONS = [{ name: 'screen', label: 'Screen' }] as const satisfies readonly RegionSpec[]

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
 * `P` is the (plain-data) subset of the object's props the math depends on —
 * variant, orientation, physical size…
 */
export interface MockupFraming<P = Record<string, never>> {
  /** Camera pose when the user doesn't override it; omit for the stage default. */
  readonly camera?: CameraFraming
  /** Amplitude scale for the float idle animation (1 = phone-sized default). */
  readonly floatIntensity?: number
  /**
   * How far the object's lowest point sits below its group origin, in world
   * units — the ground line the contact shadow hugs.
   */
  readonly extent: (props: P) => number
  /** Gap between the grounded object and its shadow plane. */
  readonly contactGap?: number
}

/**
 * The contact-shadow plane's Y for a framed object: just under the object's
 * lowest point when grounded, a visible hover gap below it when floating.
 */
export function framedShadowY<P>(framing: MockupFraming<P>, props: P, float: boolean): number {
  const gap = float ? FLOAT_SHADOW_GAP : (framing.contactGap ?? CONTACT_SHADOW_GAP)
  return -(framing.extent(props) + gap)
}
