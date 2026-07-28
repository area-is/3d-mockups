import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  // Pure data + math - no 'use client' banner: nothing here touches React,
  // and server components may import specs for layout math.
  external: ['three'],
})
