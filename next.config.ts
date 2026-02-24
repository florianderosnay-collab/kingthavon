import type { NextConfig } from 'next';
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

if (process.env.NODE_ENV === 'development') {
  await setupDevPlatform();
}

const nextConfig: NextConfig = {
  // Empty turbopack config required for Next.js 16 + Cloudflare Pages.
  // Next 16 defaults to Turbopack; providing turbopack: {} suppresses the
  // "webpack config defined but no turbopack config" warning and lets the
  // build proceed cleanly. The @prisma/client alias is handled at the
  // wrangler/esbuild layer via postinstall + @prisma/client/edge imports.
  turbopack: {},
};

export default nextConfig;
