import type { NextConfig } from 'next'
import { createMDX } from 'fumadocs-mdx/next'
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'

const nextConfig: NextConfig = {
  // Compile the workspace package (and keep HMR working against its dist output).
  transpilePackages: ['area-3d-mockups'],
}

const withMDX = createMDX()

// Makes `next dev` see the same Cloudflare env the deployed Worker gets, so a
// binding added to wrangler.jsonc works in dev without a separate code path.
// No-op in `next build` and in the Worker itself.
void initOpenNextCloudflareForDev()

export default withMDX(nextConfig)
