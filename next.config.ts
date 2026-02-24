import type { NextConfig } from 'next';
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

if (process.env.NODE_ENV === 'development') {
  await setupDevPlatform();
}

const nextConfig: NextConfig = {
  transpilePackages: ['radix-ui', '@radix-ui'],
  eslint: {
    // Linting runs separately in CI — do not block the build on lint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
