// Edge-compatible Prisma client — safe for Cloudflare Workers / Next.js Edge Runtime.
// Uses @prisma/client/edge (NOT @prisma/client which is the Node.js build).
// All queries go over HTTPS fetch via PrismaNeonHttp — no TCP, no WebSocket, no Node.js.

import { PrismaNeonHttp } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client/edge';

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {
    arrayMode: false,
    fullResults: true,
});

// Export as `prisma` so callers write: import { prisma } from '@/lib/prisma-edge'
// `prismaEdge` is kept as an alias for backwards compatibility with existing imports.
const client = new PrismaClient({ adapter });

export const prisma = client;
export const prismaEdge = client;
