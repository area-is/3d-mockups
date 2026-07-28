import { defineCloudflareConfig } from '@opennextjs/cloudflare'

/**
 * OpenNext adapter config for Cloudflare Workers.
 *
 * The defaults are deliberate: every docs route is statically rendered at build
 * time (fumadocs compiles the MDX, and the demo scenes mount client-side), so
 * there is no ISR/on-demand revalidation to back with an incremental cache.
 * Adding one later means giving `defineCloudflareConfig` an
 * `incrementalCache` and binding the matching KV namespace or R2 bucket in
 * `wrangler.jsonc`.
 */
export default {
  ...defineCloudflareConfig(),

  /**
   * `opennextjs-cloudflare build` shells out to the app's own Next.js build,
   * and under npm that defaults to `npm run build` — which is this adapter
   * again, so it would recurse forever. Pointing it at the plain Next build is
   * what lets `build` keep the name Workers Builds expects by default.
   */
  buildCommand: 'npm run build:next',
}
