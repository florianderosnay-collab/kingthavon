import type { NextConfig } from 'next';
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

if (process.env.NODE_ENV === 'development') {
  await setupDevPlatform();
}

const nextConfig: NextConfig = {
  // No turbopack:{} — Next.js 15 does not default to Turbopack.
  // @cloudflare/next-on-pages@1.13.x only supports Next.js <=15.5.2.
};

export default nextConfig;
