import type { NextConfig } from 'next';
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

if (process.env.NODE_ENV === 'development') {
  await setupDevPlatform();
}

const nextConfig: NextConfig = {
  // Transpile radix-ui packages so webpack correctly handles their
  // ESM exports in the Edge SSR bundle. Without this, React.createContext
  // is not found when @radix-ui components are bundled for Edge.
  transpilePackages: ['radix-ui', '@radix-ui'],
};

export default nextConfig;
