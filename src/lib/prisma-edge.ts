// Lazy Prisma Edge client — defers ALL initialization to request-time.
//
// IMPORTANT: Do NOT call new PrismaClient() at module scope.
// Next.js executes modules during `next build` (page data collection),
// so module-level Prisma init crashes if DATABASE_URL is absent at build time.
//
// The Proxy below intercepts every property access (prisma.lead, prisma.callLog …)
// and creates the real PrismaClient on the FIRST access — which only happens
// inside a request handler, never during the build phase.

import { PrismaNeonHttp } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client/edge';

function makeLazyClient(): PrismaClient {
    let client: PrismaClient | null = null;

    const getClient = (): PrismaClient => {
        if (client) return client;

        const url = process.env.DATABASE_URL;
        if (!url) {
            throw new Error(
                '[prisma-edge] DATABASE_URL is not set. ' +
                'Add it to your Cloudflare Pages environment variables.'
            );
        }

        const adapter = new PrismaNeonHttp(url, {
            arrayMode: false,
            fullResults: true,
        });

        client = new PrismaClient({ adapter });
        return client;
    };

    // Proxy every property access through the lazy initializer.
    // This is fully supported in V8 (Cloudflare Workers / Edge Runtime).
    return new Proxy({} as PrismaClient, {
        get(_target, prop: string | symbol) {
            return (getClient() as unknown as Record<string | symbol, unknown>)[prop];
        },
    });
}

const lazyClient = makeLazyClient();

export const prisma = lazyClient;
export const prismaEdge = lazyClient;
