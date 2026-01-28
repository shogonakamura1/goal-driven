import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

type GlobalForDb = typeof globalThis & {
  __pgPool?: Pool;
  __prisma?: PrismaClient;
};

const g = globalThis as GlobalForDb;

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const pool = g.__pgPool ?? new Pool({
  connectionString,
  max: 10
});

if (process.env.NODE_ENV !== "production") g.__pgPool = pool;

const adapter = new PrismaPg(pool);

export const prisma = g.__prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") g.__prisma = prisma;
