import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['radix-ui', '@radix-ui'],
};

export default nextConfig;
