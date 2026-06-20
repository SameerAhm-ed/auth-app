import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { COOKIE_NAME, SITE_PERMISSIONS, SINGLE_SITE_ROLES } from '@/lib/constants'

const PUBLIC_PATHS = ['/login', '/register', '/unauthorized']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Public paths ──────────────────────────────────────────────
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const token = req.cookies.get(COOKIE_NAME)?.value
    if (token) {
      const payload = await verifyToken(token)
      if (payload) {
        // Single-site roles skip overview and go straight to their site
        const directSite = SINGLE_SITE_ROLES[payload.role]
        const dest = directSite ? `/dashboard/${directSite}` : '/dashboard'
        return NextResponse.redirect(new URL(dest, req.url))
      }
    }
    return NextResponse.next()
  }

  // ── Require auth ───────────────────────────────────────────────
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const payload = await verifyToken(token)
  if (!payload) {
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete(COOKIE_NAME)
    return res
  }

  // ── Single-site role visiting /dashboard overview → redirect to their site
  if (pathname === '/dashboard') {
    const directSite = SINGLE_SITE_ROLES[payload.role]
    if (directSite) {
      return NextResponse.redirect(new URL(`/dashboard/${directSite}`, req.url))
    }
  }

  // ── Site-level access check ────────────────────────────────────
  // Matches /dashboard/am4, /dashboard/am4/solar etc.
  const siteMatch = pathname.match(/^\/dashboard\/([^/]+)/)
  if (siteMatch) {
    const site = siteMatch[1]
    const allowedRoles = SITE_PERMISSIONS[site]
    // If this segment is a known site and the role isn't allowed → block
    if (allowedRoles && !allowedRoles.includes(payload.role as never)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }

  // ── Inject user info into headers for server components ────────
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-user-id',    payload.id)
  requestHeaders.set('x-user-name',  payload.name)
  requestHeaders.set('x-user-email', payload.email)
  requestHeaders.set('x-user-role',  payload.role)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
}
