import path from 'node:path'
import { defineConfig, type Options } from 'tsup'

/*
 * Two builds, because `banner` is a whole-build esbuild option and only one of
 * the two entries may carry the RSC client directive.
 *
 * `src/index.ts` is the components, which use hooks and WebGL, so it is a
 * client module. `src/core.ts` re-exports @area-3d-mockups/core - pure specs
 * and math that deliberately carry no directive, so a server component can
 * import a spec for layout math without crossing the client boundary. One
 * shared config stamped 'use client' onto that entry too, which turned every
 * constant it exports into a client reference the server cannot read: the core
 * is built without the banner (packages/core/tsup.config.ts) precisely to avoid
 * that, but the core is bundled rather than published, so this subpath is the
 * only way a consumer reaches those specs and it undid the intent.
 */
const shared = {
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  target: 'es2022',
  /*
   * Neither build may own `clean`. They run concurrently, and tsup re-cleans on
   * every watch rebuild, so whichever cleaned last would delete output the other
   * had already written - the components rebuilding under `npm run dev` would
   * take `core.js` and `catalog.json` with it. The `build` and `prepare` scripts
   * empty `dist/` once, up front, instead.
   */
  clean: false,
  external: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei'],
  // Compile @area-3d-mockups/core straight from its source into this bundle: the
  // published `area-3d-mockups` package stays a single self-contained install, and
  // the build never depends on the core workspace having been built first.
  esbuildOptions(options) {
    options.alias = {
      ...options.alias,
      '@area-3d-mockups/core': path.resolve(__dirname, '../core/src/index.ts'),
    }
  },
} satisfies Options

export default defineConfig([
  {
    ...shared,
    entry: ['src/index.ts'],
    // Components use hooks and WebGL, so the bundle is a client module for RSC frameworks.
    banner: { js: "'use client';" },
  },
  {
    ...shared,
    entry: ['src/core.ts'],
    /*
     * Regenerate `dist/catalog.json` after every build, watch rebuilds included.
     *
     * It is a published export (`area-3d-mockups/catalog.json`), but only the
     * `build` and `prepare` scripts ran the generator - while `clean` deleted it
     * on every rebuild. So `npm run dev` wiped the catalog on startup and never
     * put it back, leaving the export dangling for the whole dev session.
     * `onSuccess` runs on the initial build and each watch rebuild.
     *
     * It hangs off this build rather than the components one because the
     * generator imports `dist/core.js`, which is what this build writes. On the
     * other build it could run before this one had emitted the file.
     */
    onSuccess: 'node scripts/build-catalog.mjs',
  },
])
