import type { NextConfig } from 'next';
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

if (process.env.NODE_ENV === 'development') {
  // Makes Cloudflare bindings available in next dev
  await setupDevPlatform();
}

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Redirect ALL @prisma/client imports to the Edge build.
    // @prisma/adapter-neon transitively imports @prisma/client (Node build),
    // so we alias it here at the webpack layer — before esbuild ever sees it.
    // Without this, `next build` fails with:
    //   Module not found: Can't resolve '.prisma/client/default'
    config.resolve.alias = {
      ...config.resolve.alias,
      '@prisma/client': '@prisma/client/edge',
    };
    return config;
  },
};

export default nextConfig;
