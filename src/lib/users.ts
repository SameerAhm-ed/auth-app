import bcrypt from 'bcryptjs'
import { Role, ALL_SITES } from './constants'
import { getSql } from '@/db/neon'

export interface User {
  id: string
  username: string
  name: string
  email: string | null
  role: Role
  sites: string[]
  isActive: boolean
}
type WithHash = User & { passwordHash: string }

// ── Row mapping (Postgres snake_case → User) ─────────────────────
type Row = {
  id: string
  username: string
  name: string
  email: string | null
  password_hash: string
  role: Role
  sites: string[]
  is_active: boolean
}
function mapRow(r: Row): WithHash {
  return {
    id: r.id,
    username: r.username,
    name: r.name,
    email: r.email,
    role: r.role,
    sites: r.sites ?? [],
    isActive: r.is_active,
    passwordHash: r.password_hash,
  }
}
function strip(u: WithHash): User {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    email: u.email,
    role: u.role,
    sites: u.sites,
    isActive: u.isActive,
  }
}

// ── Dev fallback (no DATABASE_URL): in-memory store, new role+sites model ──
let devStore: WithHash[] | null = null
async function dev(): Promise<WithHash[]> {
  if (devStore) return devStore
  const adminUser = (process.env.ADMIN_USERNAME || 'admin').toLowerCase()
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123'
  const [adminHash, sampleHash] = await Promise.all([
    bcrypt.hash(adminPass, 10),
    bcrypt.hash('am5pass123', 10),
  ])
  devStore = [
    { id: '1', username: adminUser, name: 'Admin', email: null, role: 'admin', sites: ALL_SITES, isActive: true, passwordHash: adminHash },
    { id: '2', username: 'am5user', name: 'AM5 User', email: null, role: 'user', sites: ['am5', 'razzakabad'], isActive: true, passwordHash: sampleHash },
    { id: '3', username: 'manager', name: 'Manager', email: null, role: 'manager', sites: [], isActive: true, passwordHash: adminHash },
  ]
  return devStore
}

// ── First-admin seed (Neon only) ─────────────────────────────────
let seeded = false
async function seedAdminIfEmpty(sql: NonNullable<ReturnType<typeof getSql>>): Promise<void> {
  if (seeded) return
  seeded = true
  const adminUser = process.env.ADMIN_USERNAME
  const adminPass = process.env.ADMIN_PASSWORD
  if (!adminUser || !adminPass) return
  const rows = (await sql`SELECT 1 FROM app_users LIMIT 1`) as unknown[]
  if (rows.length > 0) return
  const hash = await bcrypt.hash(adminPass, 10)
  await sql`
    INSERT INTO app_users (username, name, role, sites, password_hash)
    VALUES (${adminUser.toLowerCase()}, 'Admin', 'admin', ${ALL_SITES}, ${hash})
  `
}

// ── Reads ────────────────────────────────────────────────────────
async function findRawByUsername(username: string): Promise<WithHash | null> {
  const sql = getSql()
  if (sql) {
    await seedAdminIfEmpty(sql)
    const rows = (await sql`SELECT * FROM app_users WHERE username = ${username} LIMIT 1`) as Row[]
    return rows[0] ? mapRow(rows[0]) : null
  }
  const store = await dev()
  return store.find((u) => u.username === username) ?? null
}

export async function findByUsername(username: string): Promise<User | null> {
  const u = await findRawByUsername(username.toLowerCase())
  return u ? strip(u) : null
}

export async function findById(id: string): Promise<User | null> {
  const sql = getSql()
  if (sql) {
    const rows = (await sql`SELECT * FROM app_users WHERE id = ${id} LIMIT 1`) as Row[]
    return rows[0] ? strip(mapRow(rows[0])) : null
  }
  const store = await dev()
  const u = store.find((x) => x.id === id)
  return u ? strip(u) : null
}

export async function listUsers(): Promise<User[]> {
  const sql = getSql()
  if (sql) {
    const rows = (await sql`SELECT * FROM app_users ORDER BY created_at`) as Row[]
    return rows.map((r) => strip(mapRow(r)))
  }
  const store = await dev()
  return store.map(strip)
}

// ── Auth ─────────────────────────────────────────────────────────
export type AuthResult = { user: User } | { error: 'invalid' | 'inactive' }

export async function authenticate(username: string, password: string): Promise<AuthResult> {
  const raw = await findRawByUsername(username.toLowerCase())
  if (!raw) return { error: 'invalid' }
  const ok = await bcrypt.compare(password, raw.passwordHash)
  if (!ok) return { error: 'invalid' }
  if (!raw.isActive) return { error: 'inactive' }
  await touchLastLogin(raw.id)
  return { user: strip(raw) }
}

async function touchLastLogin(id: string): Promise<void> {
  const sql = getSql()
  if (sql) await sql`UPDATE app_users SET last_login = now() WHERE id = ${id}`
}

// ── Writes (admin-managed) ───────────────────────────────────────
export async function createUser(input: {
  username: string
  name: string
  password: string
  role?: Role
  sites?: string[]
  email?: string | null
}): Promise<User> {
  const username = input.username.trim().toLowerCase()
  const role = input.role ?? 'user'
  const sites = input.sites ?? []
  const hash = await bcrypt.hash(input.password, 10)

  const existing = await findRawByUsername(username)
  if (existing) throw new Error('Username already in use')

  const sql = getSql()
  if (sql) {
    const rows = (await sql`
      INSERT INTO app_users (username, name, email, role, sites, password_hash)
      VALUES (${username}, ${input.name}, ${input.email ?? null}, ${role}, ${sites}, ${hash})
      RETURNING *
    `) as Row[]
    return strip(mapRow(rows[0]))
  }
  const store = await dev()
  const user: WithHash = {
    id: String(Date.now()),
    username,
    name: input.name,
    email: input.email ?? null,
    role,
    sites,
    isActive: true,
    passwordHash: hash,
  }
  store.push(user)
  return strip(user)
}

export async function updateUser(
  id: string,
  patch: { name?: string; role?: Role; sites?: string[]; email?: string | null },
): Promise<void> {
  const sql = getSql()
  if (sql) {
    await sql`
      UPDATE app_users SET
        name  = COALESCE(${patch.name ?? null}, name),
        role  = COALESCE(${patch.role ?? null}, role),
        sites = COALESCE(${patch.sites ?? null}, sites),
        email = COALESCE(${patch.email ?? null}, email),
        updated_at = now()
      WHERE id = ${id}
    `
    return
  }
  const store = await dev()
  const u = store.find((x) => x.id === id)
  if (!u) return
  if (patch.name !== undefined) u.name = patch.name
  if (patch.role !== undefined) u.role = patch.role
  if (patch.sites !== undefined) u.sites = patch.sites
  if (patch.email !== undefined) u.email = patch.email
}

export async function setActive(id: string, isActive: boolean): Promise<void> {
  const sql = getSql()
  if (sql) {
    await sql`UPDATE app_users SET is_active = ${isActive}, updated_at = now() WHERE id = ${id}`
    return
  }
  const store = await dev()
  const u = store.find((x) => x.id === id)
  if (u) u.isActive = isActive
}

export async function setPassword(id: string, password: string): Promise<void> {
  const hash = await bcrypt.hash(password, 10)
  const sql = getSql()
  if (sql) {
    await sql`UPDATE app_users SET password_hash = ${hash}, updated_at = now() WHERE id = ${id}`
    return
  }
  const store = await dev()
  const u = store.find((x) => x.id === id)
  if (u) u.passwordHash = hash
}
