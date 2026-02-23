// ⚠️  NODE.JS ONLY — DO NOT import this file from any Edge route, Server Component,
// or any file in /app/api/* or /app/dashboard/*.
// This uses pg (TCP pools) which is incompatible with Cloudflare Workers / Edge Runtime.
// For Edge-compatible queries, use: import { prisma } from '@/lib/prisma-edge'

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;

const prismaClientSingleton = () => {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prismaNode: PrismaClientSingleton | undefined;
};

export const prismaNode = globalForPrisma.prismaNode ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaNode = prismaNode;
