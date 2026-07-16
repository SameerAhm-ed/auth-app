import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/users'
import { signToken } from '@/lib/auth'
import { COOKIE_NAME, TOKEN_MAX_AGE, effectiveSites, landingPath } from '@/lib/constants'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    const result = await authenticate(String(username), String(password))
    if ('error' in result) {
      const message =
        result.error === 'inactive' ? 'This account is disabled' : 'Invalid username or password'
      return NextResponse.json({ error: message }, { status: 401 })
    }

    const { user } = result
    const sites = effectiveSites(user.role, user.sites)
    const token = await signToken({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      sites,
    })

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, username: user.username, role: user.role, sites },
      redirect: landingPath(user.role, user.sites),
    })

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // Lax, not Strict: an installed PWA's first launch from the home-screen
      // icon is a top-level navigation the browser treats as external —
      // Strict cookies get dropped on that request, bouncing a valid session
      // to /login until the next same-origin navigation. Lax still blocks the
      // cookie on cross-site POST/PUT/DELETE, which is all this app needs.
      sameSite: 'lax',
      maxAge: TOKEN_MAX_AGE,
      path: '/',
    })

    return res
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
