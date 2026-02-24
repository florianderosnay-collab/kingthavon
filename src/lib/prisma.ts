// Standard Node.js Prisma client for Railway deployment.
// No Edge adapters, no Neon HTTP — uses standard PostgreSQL TCP connection.

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
