import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, signToken } from '@/lib/auth'
import { findById } from '@/lib/users'
import { COOKIE_NAME, TOKEN_MAX_AGE, effectiveSites } from '@/lib/constants'

// Rolling-session refresh. The dashboard pings this while it's open; it re-reads
// the user from the DB (so deactivation / role / site changes take effect) and
// re-issues a fresh token, or 401s + clears the cookie if the user is gone or
// disabled.
export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'No session' }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) {
    const res = NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    res.cookies.delete(COOKIE_NAME)
    return res
  }

  const user = await findById(payload.id)
  if (!user || !user.isActive) {
    const res = NextResponse.json({ error: 'Session revoked' }, { status: 401 })
    res.cookies.delete(COOKIE_NAME)
    return res
  }

  const sites = effectiveSites(user.role, user.sites)
  const fresh = await signToken({
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    sites,
  })

  const res = NextResponse.json({
    success: true,
    user: { id: user.id, name: user.name, username: user.username, role: user.role, sites },
  })
  res.cookies.set(COOKIE_NAME, fresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // See login/route.ts for why this is Lax, not Strict.
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE,
    path: '/',
  })
  return res
}
