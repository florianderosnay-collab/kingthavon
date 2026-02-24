// Standard Node.js Prisma client for Railway deployment.
// Uses lazy initialization via Proxy to prevent instantiation during `next build`.
// PrismaClient is only created on first property access inside a request handler.

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { __prisma: PrismaClient };

function makeLazyClient(): PrismaClient {
    const getClient = (): PrismaClient => {
        if (globalForPrisma.__prisma) return globalForPrisma.__prisma;

        globalForPrisma.__prisma = new PrismaClient();
        return globalForPrisma.__prisma;
    };

    return new Proxy({} as PrismaClient, {
        get(_target, prop: string | symbol) {
            return (getClient() as unknown as Record<string | symbol, unknown>)[prop];
        },
    });
}

export const prisma = makeLazyClient();
