import type { NextConfig } from "next";
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

if (process.env.NODE_ENV === 'development') {
  // Makes Cloudflare bindings (KV, R2, etc.) available in next dev mode
  await setupDevPlatform();
}

const nextConfig: NextConfig = {
  // No output:standalone — @cloudflare/next-on-pages uses the standard build output
};

export default nextConfig;
