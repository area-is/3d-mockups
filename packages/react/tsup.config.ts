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
  // Compile @area-mockups/core straight from its source into this bundle: the
  // published `area-mockups` package stays a single self-contained install, and
  // the build never depends on the core workspace having been built first.
  esbuildOptions(options) {
    options.alias = {
      ...options.alias,
      '@area-mockups/core': path.resolve(__dirname, '../core/src/index.ts'),
    }
  },
})
