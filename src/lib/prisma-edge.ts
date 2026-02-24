// Edge-compatible Prisma client — safe for Cloudflare Workers / Next.js Edge Runtime.
// Uses @prisma/client/edge (NOT @prisma/client which is the Node.js build).
// All queries go over HTTPS fetch via PrismaNeonHttp — no TCP, no WebSocket, no Node.js.

import { PrismaNeonHttp } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client/edge';

if (!process.env.DATABASE_URL) {
    // Fail with a clear message rather than a cryptic crash deep in Prisma internals.
    // This surfaces immediately in Cloudflare Pages logs.
    throw new Error(
        '[prisma-edge] DATABASE_URL is not set. ' +
        'Add it to your Cloudflare Pages environment variables.'
    );
}

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL, {
    arrayMode: false,
    fullResults: true,
});

const client = new PrismaClient({ adapter });

export const prisma = client;
export const prismaEdge = client;
