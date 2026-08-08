/**
 * Shared look for the overlay control buttons (zoom, fullscreen) - self-
 * contained, no page CSS. Style objects are camelCased (React `style`
 * compatible); other bindings convert as needed.
 */
export const OVERLAY_BUTTON_STYLE = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  border: '1px solid rgba(255,255,255,0.3)',
  background: 'rgba(22,24,29,0.55)',
  color: '#f2f4f8',
  font: '600 18px/1 system-ui, sans-serif',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  userSelect: 'none',
  WebkitBackdropFilter: 'blur(4px)',
  backdropFilter: 'blur(4px)',
  padding: 0,
} as const

/** Feather-style corner icons for the fullscreen toggle (16px grid, stroked in currentColor). */
export const OVERLAY_ICON_VIEWBOX = '0 0 24 24'
export const ENTER_FULLSCREEN_ICON_PATH =
  'M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3'
export const EXIT_FULLSCREEN_ICON_PATH =
  'M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3'
