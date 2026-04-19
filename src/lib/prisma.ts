// src/lib/prisma.ts

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Pakai DIRECT_URL jika ada (bypass PgBouncer),
  // fallback ke DATABASE_URL
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL

  if (!url) {
    throw new Error(
      'DATABASE_URL atau DIRECT_URL harus diset di .env.local'
    )
  }

  return new PrismaClient({
    datasources: {
      db: { url },
    },
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  })
}

const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma