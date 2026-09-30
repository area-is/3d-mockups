import path from 'node:path'
import { Config } from '@remotion/cli/config'

/*
 * One copy of each renderer package. `react-3d-mockups` is installed from the
 * monorepo (`file:../../packages/react`), and webpack follows that symlink to
 * the package's real path, where `react`, `three` and friends resolve to the
 * monorepo's own node_modules - a second React (hooks throw "Invalid hook
 * call") and a second three.js (materials silently fail `instanceof`). An app
 * that installs the package from npm has a single copy and needs none of this.
 */
const single = (name: string) => path.resolve(process.cwd(), 'node_modules', name)

Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: {
      ...(config.resolve?.alias as Record<string, string> | undefined),
      react: single('react'),
      'react-dom': single('react-dom'),
      three: single('three'),
      '@react-three/fiber': single('@react-three/fiber'),
      '@react-three/drei': single('@react-three/drei'),
    },
  },
}))

// WebGL in headless Chrome with no GPU: ANGLE over SwiftShader. On a machine
// with a GPU, `--gl=angle` is much faster.
Config.setChromiumOpenGlRenderer('swangle')
Config.setVideoImageFormat('jpeg')
Config.setJpegQuality(92)
// Cold mounts compile shaders and build CSG geometry on the CPU.
Config.setDelayRenderTimeoutInMilliseconds(120_000)

// Use a local Chrome Headless Shell when one is provided (CI images, sandboxes
// without access to Remotion's download host).
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE)
}
