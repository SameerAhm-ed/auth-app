import { NextRequest } from 'next/server'
import { verifyToken, type JWTPayload } from './auth'
import { COOKIE_NAME } from './constants'

/**
 * Verify the request carries a valid admin session. `/api/admin/*` is not
 * covered by the proxy matcher, so these routes must check the token directly.
 * Returns the admin payload, or null (caller should respond 403).
 */
export async function getAdmin(req: NextRequest): Promise<JWTPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'admin') return null
  return payload
}
