// Neon (Postgres) client for the app/auth database. Uses the HTTP serverless
// driver so it works from Vercel serverless/edge without a TCP connection pool.
//
// Returns null when no DATABASE_URL is configured — callers (see lib/users.ts)
// then fall back to an in-memory dev store, so the app runs locally before the
// Neon database is provisioned.
import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

let cached: NeonQueryFunction<false, false> | null | undefined

export function getSql(): NeonQueryFunction<false, false> | null {
  if (cached !== undefined) return cached
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL
  cached = url ? neon(url) : null
  return cached
}

export const hasNeon = (): boolean => getSql() !== null
