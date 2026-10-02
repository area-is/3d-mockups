import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type Options } from 'tsup'
import type { Plugin } from 'esbuild'

/*
 * The ESM build is one output file per source module, not one bundle.
 *
 * It used to be a single `dist/index.js`. `"sideEffects": false` only lets an
 * app's bundler drop whole FILES, and inside one file every top-level
 * statement that might have a side effect - `GalaxyImpl.displayName = …`, an
 * unannotated `createMockup(…)` - is kept, along with everything it reaches.
 * So importing `BookMockup` shipped all 57 models (~135 KB gzip) while the
 * docs promised ~12 KB. With a file per module the bundler drops every module
 * the import does not reach, which is what `scripts/measure-size.mjs` checks
 * against the published `dist/`.
 *
 * Splitting by module also puts the RSC client directive where it belongs:
 * on the component modules only. The specs and math (`src/core/**`) and the
 * entry that re-exports everything (`src/index.ts`) carry none, so a server
 * component can call `mockupInfo` or read a spec through either entry point,
 * and still render the components, which stay client references through
 * their own modules. When the whole entry was 'use client', every constant it
 * exported was a client reference the server could not read.
 *
 * CommonJS stays one bundle per entry: `require` cannot tree-shake anyway.
 */

/** The package's own source files that are not part of the published code. */
const NOT_SHIPPED = ['!src/**/__tests__/**', '!src/**/*.test.ts', '!src/**/*.type-test.tsx']

/**
 * Leave every relative import as an import of the sibling module's output,
 * spelled with its `.js` extension (or `/index.js` for a directory) - the form
 * Node's ESM loader and bundlers in strict ESM mode require. Bundling with
 * these externalized is what turns esbuild's bundler into a per-file
 * transpiler that still resolves the specifiers TypeScript allows us to write
 * without extensions.
 */
const perModule: Plugin = {
  name: 'per-module',
  setup(build) {
    build.onResolve({ filter: /^\.\.?(\/|$)/ }, ({ path, resolveDir, kind }) => {
      if (kind === 'entry-point') return undefined
      const target = join(resolveDir, path)
      for (const ext of ['.ts', '.tsx']) {
        if (existsSync(target + ext)) return { path: `${path}.js`, external: true }
      }
      if (existsSync(target) && statSync(target).isDirectory()) {
        return { path: `${path.replace(/\/$/, '')}/index.js`, external: true }
      }
      throw new Error(`per-module: cannot resolve "${path}" from ${resolveDir}`)
    })
  },
}

const shared = {
  sourcemap: true,
  target: 'es2022',
  /*
   * The maps point at sources in the repository instead of embedding them:
   * embedded, the sources were 4.5 MB of the package's 7.7 MB on disk.
   */
  esbuildOptions(options) {
    options.sourcesContent = false
  },
  /*
   * No build may own `clean`. They run concurrently, and tsup re-cleans on
   * every watch rebuild, so whichever cleaned last would delete output another
   * had already written - the components rebuilding under `npm run dev` would
   * take `core/` and `catalog.json` with them. The `build` and `prepare`
   * scripts empty `dist/` once, up front, instead.
   */
  clean: false,
  /*
   * Peers, plus the runtime dependencies. tsup would externalize the
   * dependencies on its own; they are listed so that moving one back to
   * devDependencies cannot silently start bundling it again. The CSG pair used
   * to be bundled: every app then carried a private copy of three-mesh-bvh
   * alongside the one drei installs, and could neither dedupe nor update it.
   */
  external: [
    'react',
    'react-dom',
    'three',
    '@react-three/fiber',
    '@react-three/drei',
    'its-fine',
    'three-bvh-csg',
    'three-mesh-bvh',
  ],
} satisfies Options

const perModuleEsm = {
  ...shared,
  format: ['esm'],
  bundle: true,
  splitting: false,
  esbuildPlugins: [perModule],
} satisfies Options

export default defineConfig([
  // The components: hooks and WebGL, so every one of these modules is a client module.
  {
    ...perModuleEsm,
    entry: ['src/**/*.{ts,tsx}', '!src/index.ts', '!src/core/**', ...NOT_SHIPPED],
    banner: { js: "'use client';" },
  },
  // The specs and math, and the entry that re-exports them with the components: no directive.
  {
    ...perModuleEsm,
    entry: ['src/index.ts', 'src/core/**/*.ts', ...NOT_SHIPPED],
    // The declarations stay two bundles, one per subpath export.
    dts: { entry: { index: 'src/index.ts', core: 'src/core/index.ts' } },
    /*
     * Regenerate `dist/catalog.json` after every build, watch rebuilds included.
     *
     * It is a published export (`react-3d-mockups/catalog.json`), but only the
     * `build` and `prepare` scripts ran the generator - while `clean` deleted it
     * on every rebuild. So `npm run dev` wiped the catalog on startup and never
     * put it back, leaving the export dangling for the whole dev session.
     * `onSuccess` runs on the initial build and each watch rebuild.
     *
     * It hangs off this build because the generator imports `dist/core/`,
     * which is what this build writes.
     */
    onSuccess: 'node scripts/build-catalog.mjs',
  },
  // CommonJS: the components bundle, a client module as a whole.
  {
    ...shared,
    format: ['cjs'],
    entry: { index: 'src/index.ts' },
    dts: true,
    banner: { js: "'use client';" },
  },
  {
    ...shared,
    format: ['cjs'],
    entry: { core: 'src/core/index.ts' },
    dts: true,
  },
])
