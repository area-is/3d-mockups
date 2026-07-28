// Measures the tree-shaken cost of importing each device mockup:
// esbuild-bundles a one-line entry per component (peers external), minified,
// and reports raw + gzip sizes. Run from packages/react:
//   node scripts/measure-size.mjs
import { build } from 'esbuild'
import { gzipSync } from 'node:zlib'

const ENTRIES = {
  'GalaxyMockup (Galaxy phone family)': "export { GalaxyMockup } from './src/index'",
  'IPhoneMockup (iPhone family)': "export { IPhoneMockup } from './src/index'",
  'LaptopMockup (MacBook Air + Pro)': "export { LaptopMockup } from './src/index'",
  'IPadMockup (iPad family)': "export { IPadMockup } from './src/index'",
  'GalaxyTabMockup (Galaxy Tab family)': "export { GalaxyTabMockup } from './src/index'",
  'AppleWatchMockup (Apple Watch)': "export { AppleWatchMockup } from './src/index'",
  'GalaxyWatchMockup (Galaxy Watch)': "export { GalaxyWatchMockup } from './src/index'",
  'StudioDisplayMockup (Studio Display)': "export { StudioDisplayMockup } from './src/index'",
  'FoldMockup (Galaxy Z Fold 7)': "export { FoldMockup } from './src/index'",
  'FlipMockup (Galaxy Z Flip 7)': "export { FlipMockup } from './src/index'",
  'BookMockup (hardcover)': "export { BookMockup } from './src/index'",
  'MagazineMockup (glossy monthly)': "export { MagazineMockup } from './src/index'",
  'BrochureMockup (tri-fold)': "export { BrochureMockup } from './src/index'",
  'BusinessCardMockup (32pt card)': "export { BusinessCardMockup } from './src/index'",
  'PosterFrameMockup (18x24 frame)': "export { PosterFrameMockup } from './src/index'",
  'BillboardMockup (14x48 bulletin)': "export { BillboardMockup } from './src/index'",
  'VanMockup (cargo van)': "export { VanMockup } from './src/index'",
  'IDCardMockup (badge + lanyard)': "export { IDCardMockup } from './src/index'",
  'BusMockup (transit bus)': "export { BusMockup } from './src/index'",
  'ProductBoxMockup (retail carton)': "export { ProductBoxMockup } from './src/index'",
  'RollupBannerMockup (850x2000 stand)': "export { RollupBannerMockup } from './src/index'",
  'BusShelterMockup (6-sheet shelter)': "export { BusShelterMockup } from './src/index'",
  'GreetingCardMockup (A7 card)': "export { GreetingCardMockup } from './src/index'",
  'VinylRecordMockup (12in LP)': "export { VinylRecordMockup } from './src/index'",
  'TVSetMockup (65in TV)': "export { TVSetMockup } from './src/index'",
  'AFrameSignMockup (sandwich board)': "export { AFrameSignMockup } from './src/index'",
  'DOOHTotemMockup (digital totem)': "export { DOOHTotemMockup } from './src/index'",
  'StorefrontMockup (shop facade)': "export { StorefrontMockup } from './src/index'",
  'SemiTrailerMockup (53ft dry van)': "export { SemiTrailerMockup } from './src/index'",
  'MailerBoxMockup (shipper box)': "export { MailerBoxMockup } from './src/index'",
  'ShoppingBagMockup (kraft carrier)': "export { ShoppingBagMockup } from './src/index'",
  'CustomPanelMockup (any-size sheet)': "export { CustomPanelMockup } from './src/index'",
  'CustomBoxMockup (any-size box)': "export { CustomBoxMockup } from './src/index'",
  'everything (full library)': "export * from './src/index'",
}

for (const [name, contents] of Object.entries(ENTRIES)) {
  const result = await build({
    stdin: { contents, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true,
    minify: true,
    write: false,
    format: 'esm',
    target: 'es2022',
    external: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei'],
    // Measure the core from its source (same as the published bundle, which
    // inlines it) so sizes don't depend on the core workspace being built.
    alias: { '@area-3d-mockups/core': new URL('../../core/src/index.ts', import.meta.url).pathname },
    jsx: 'automatic',
    loader: { '.tsx': 'tsx', '.ts': 'ts' },
  })
  const bytes = result.outputFiles[0].contents
  const gz = gzipSync(bytes).length
  console.log(`${name}: ${(bytes.length / 1024).toFixed(1)} KB min / ${(gz / 1024).toFixed(1)} KB gzip`)
}
