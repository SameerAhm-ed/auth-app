import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/requireAdmin'
import { updateUser, setActive, setPassword } from '@/lib/users'
import { isRole, isKnownSite, type Role } from '@/lib/constants'

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await ctx.params
  const body = await req.json()

  // Prevent an admin from locking themselves out.
  if (id === admin.id) {
    if (body.isActive === false) {
      return NextResponse.json({ error: "You can't disable your own account" }, { status: 400 })
    }
    if (isRole(body.role) && body.role !== 'admin') {
      return NextResponse.json({ error: "You can't change your own role" }, { status: 400 })
    }
  }

  const patch: { name?: string; role?: Role; sites?: string[] } = {}
  if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim()
  if (isRole(body.role)) patch.role = body.role
  if (Array.isArray(body.sites)) {
    patch.sites = body.sites.filter((s: unknown): s is string => typeof s === 'string' && isKnownSite(s))
  }
  // Admin/manager see everything → no per-site list to store.
  if (patch.role === 'admin' || patch.role === 'manager') patch.sites = []

  if (Object.keys(patch).length > 0) await updateUser(id, patch)

  if (typeof body.isActive === 'boolean') await setActive(id, body.isActive)

  if (typeof body.password === 'string' && body.password) {
    if (body.password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }
    await setPassword(id, body.password)
  }

  return NextResponse.json({ success: true })
}
