// lib/prisma.ts

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // SELALU pakai DATABASE_URL (via PgBouncer).
  // JANGAN pakai DIRECT_URL di sini — direct connection limitnya sangat
  // kecil di Supabase (15 slot) dan habis cepat saat banyak request.
  // DIRECT_URL hanya dipakai oleh `prisma migrate` via prisma.schema.
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new Error('DATABASE_URL harus diset di .env.local / environment variables')
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
