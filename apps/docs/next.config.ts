import type { NextConfig } from 'next'
import { createMDX } from 'fumadocs-mdx/next'

const nextConfig: NextConfig = {
  // Compile the workspace package (and keep HMR working against its dist output).
  transpilePackages: ['area-3d-mockups'],
}

const withMDX = createMDX()

export default withMDX(nextConfig)
