// @area-mockups/core — the framework-agnostic heart of area-mockups.
//
// Everything here depends on `three` at most (never on React, Svelte or Vue):
// device/object specs, geometry math, the live-screen behaviors and the shared
// stage configuration. Framework bindings (`area-mockups` for React today;
// `@area-mockups/svelte`, `@area-mockups/vue` later) are thin layers that feed
// this data into their renderer. See ARCHITECTURE.md at the repo root.

export type { Orientation } from './orientation'

// Region registry + per-object stage framing (pure data + pure math).
export {
  type RegionSpec,
  SCREEN_REGIONS,
  type CameraFraming,
  type MockupFraming,
  FLOAT_SHADOW_GAP,
  CONTACT_SHADOW_GAP,
  framedShadowY,
} from './regions'

// Geometry math.
export { roundedRectShape } from './geometry/rounded-rect'
export { gearShape } from './geometry/gear'
export {
  type ClipPoint,
  type ClipLength,
  type ClipRect,
  clipRoundedRect,
  clipRoundedRectOutline,
  clipCircle,
} from './geometry/clip-path'

// Live-screen behaviors (CSS px math, wrapper styles, gesture handoff, culling).
export {
  type ScreenRadius,
  SCREEN_LAYER_CLASS,
  SCREEN_LAYER_CSS,
  screenLayerClass,
  screenPxPerUnit,
  screenCssHeight,
  screenCornerRadiusCss,
  screenDistanceFactor,
  type ScreenSurfaceStyleOptions,
  type ScreenSurfaceStyle,
  screenSurfaceStyle,
} from './screen/surface'
export {
  SCREEN_DRAG_THRESHOLD_PX,
  type ScreenDragHandoff,
  createScreenDragHandoff,
} from './screen/drag-handoff'
export { type BackfaceCuller, createBackfaceCuller } from './screen/backface'
export {
  LED_TEXT_COLOR,
  LED_TEXT_BACKGROUND,
  LED_MARQUEE_SPEED,
  LED_CYCLE_INTERVAL,
  LED_DOT_SIZE,
  type LedPanelStyleOptions,
  ledPanelStyle,
  ledMaskStyle,
  ledMarqueeKeyframes,
  ledCycleKeyframes,
} from './screen/led-text'

// The shared stage: camera, orbit, shadows, touch, zoom, fullscreen, lights, float.
export {
  DEFAULT_CAMERA_POSITION,
  DEFAULT_CAMERA_FOV,
  DEFAULT_CAMERA_DISTANCE,
  DEFAULT_SHADOW_Y,
  CONTACT_SHADOW,
  ORBIT,
  cameraDistance,
  orbitDistanceRange,
  canvasTouchAction,
  type OrbitZoomControls,
  orbitZoomBy,
  activeFullscreenElement,
  toggleFullscreen,
} from './stage/stage'
export {
  STAGE_AMBIENT_LIGHT,
  STAGE_KEY_LIGHT,
  STUDIO_ENV_RESOLUTION,
  type StudioLightformer,
  STUDIO_LIGHTFORMERS,
} from './stage/lights'
export { TumbleOrbit, tumbleAutoRotateStep } from './stage/tumble'
export { type FloatPose, floatPose, randomFloatPhase } from './stage/float'
export {
  OVERLAY_BUTTON_STYLE,
  OVERLAY_ICON_VIEWBOX,
  ENTER_FULLSCREEN_ICON_PATH,
  EXIT_FULLSCREEN_ICON_PATH,
} from './stage/overlay'

// Retail colorway catalogs (pure data) + the `colorway` prop resolver.
export {
  type Colorway,
  GALAXY_COLORWAYS,
  IPHONE_COLORWAYS,
  FOLD_COLORWAYS,
  FLIP_COLORWAYS,
  LAPTOP_COLORWAYS,
  TABLET_COLORWAYS,
  WATCH_COLORWAYS,
  MONITOR_COLORWAYS,
  findColorway,
} from './colorways'

// Device specs (physical dimensions, cameras, displays — pure data).
export * from './devices/phone/dimensions'
export * from './devices/iphone/dimensions'
export * from './devices/laptop/dimensions'
export * from './devices/tablet/dimensions'
export * from './devices/watch/dimensions'
export * from './devices/monitor/dimensions'
export * from './devices/fold/dimensions'
export * from './devices/flip/dimensions'

// Object specs (print, packaging, out-of-home, vehicles — pure data).
export * from './objects/book/dimensions'
export * from './objects/magazine/dimensions'
export * from './objects/brochure/dimensions'
export * from './objects/business-card/dimensions'
export * from './objects/poster-frame/dimensions'
export * from './objects/billboard/dimensions'
export * from './objects/van/dimensions'
export * from './objects/id-card/dimensions'
export * from './objects/bus/dimensions'
export * from './objects/product-box/dimensions'
export * from './objects/rollup-banner/dimensions'
export * from './objects/bus-shelter/dimensions'
export * from './objects/greeting-card/dimensions'
export * from './objects/vinyl-record/dimensions'
export * from './objects/tv/dimensions'
export * from './objects/a-frame-sign/dimensions'
export * from './objects/dooh-totem/dimensions'
export * from './objects/storefront/dimensions'
export * from './objects/semi-trailer/dimensions'
export * from './objects/mailer-box/dimensions'
export * from './objects/shopping-bag/dimensions'
export * from './objects/custom-panel/dimensions'
export * from './objects/custom-box/dimensions'
