import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/requireAdmin'
import { listUsers, createUser } from '@/lib/users'
import { isRole, isKnownSite } from '@/lib/constants'

export async function GET(req: NextRequest) {
  const admin = await getAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const users = await listUsers()
  return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
  const admin = await getAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const username = String(body.username ?? '').trim()
    const name = String(body.name ?? '').trim()
    const password = String(body.password ?? '')
    const role = isRole(body.role) ? body.role : 'user'
    const sites =
      role === 'user' && Array.isArray(body.sites)
        ? body.sites.filter((s: unknown): s is string => typeof s === 'string' && isKnownSite(s))
        : []

    if (!username || !name || !password) {
      return NextResponse.json({ error: 'Username, name and password are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const user = await createUser({ username, name, password, role, sites })
    return NextResponse.json({ user }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    const status = message.includes('already in use') ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
