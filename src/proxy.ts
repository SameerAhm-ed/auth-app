import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { COOKIE_NAME, canAccessSite, effectiveSites, isKnownSite, landingPath } from '@/lib/constants'

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get(COOKIE_NAME)?.value

  // ── Login page: if already signed in, bounce to their landing page ─────
  if (pathname === '/login' || pathname.startsWith('/login/')) {
    if (token) {
      const payload = await verifyToken(token)
      if (payload) {
        return NextResponse.redirect(new URL(landingPath(payload.role, payload.sites), req.url))
      }
    }
    return NextResponse.next()
  }

  // ── Everything else here is /dashboard/* → require a valid session ─────
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  const payload = await verifyToken(token)
  if (!payload) {
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete(COOKIE_NAME)
    return res
  }

  // Overview: users with a single site skip it and go straight in.
  if (pathname === '/dashboard') {
    const eff = effectiveSites(payload.role, payload.sites)
    if (eff.length === 1) {
      return NextResponse.redirect(new URL(`/dashboard/${eff[0]}`, req.url))
    }
  }

  // Admin area is admin-only.
  if (pathname.startsWith('/dashboard/admin')) {
    if (payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  } else {
    // Per-site access check for /dashboard/<site>/...
    const siteMatch = pathname.match(/^\/dashboard\/([^/]+)/)
    if (siteMatch) {
      const site = siteMatch[1]
      if (isKnownSite(site) && !canAccessSite(payload.role, payload.sites, site)) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }
  }

  // ── Inject user info into headers for server components ────────────────
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-user-id', payload.id)
  requestHeaders.set('x-user-name', payload.name)
  requestHeaders.set('x-user-username', payload.username)
  requestHeaders.set('x-user-role', payload.role)
  requestHeaders.set('x-user-sites', payload.sites.join(','))

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
