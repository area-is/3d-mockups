import path from 'node:path'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/core.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  // Components use hooks and WebGL, so the bundle is a client module for RSC frameworks.
  banner: { js: "'use client';" },
  external: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei'],
  /*
   * Regenerate `dist/catalog.json` after every build, watch rebuilds included.
   *
   * It is a published export (`area-3d-mockups/catalog.json`), but only the
   * `build` and `prepare` scripts ran the generator — while `clean: true`
   * deletes it on every rebuild. So `npm run dev` wiped the catalog on startup
   * and never put it back, leaving the export dangling for the whole dev
   * session. `onSuccess` runs on the initial build and each watch rebuild.
   */
  onSuccess: 'node scripts/build-catalog.mjs',
  // Compile @area-3d-mockups/core straight from its source into this bundle: the
  // published `area-3d-mockups` package stays a single self-contained install, and
  // the build never depends on the core workspace having been built first.
  esbuildOptions(options) {
    options.alias = {
      ...options.alias,
      '@area-3d-mockups/core': path.resolve(__dirname, '../core/src/index.ts'),
    }
  },
})
