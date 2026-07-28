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
export default defineCloudflareConfig()
