import { DASHBOARD_CATEGORIES, categoryAms } from './dashboardCategories'

// ── Roles ────────────────────────────────────────────────────────
// admin   → all sites + user management
// manager → all sites, no user management
// user    → only the sites explicitly assigned to them
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]
export const ROLE_VALUES: Role[] = ['admin', 'manager', 'user']
export const isRole = (v: unknown): v is Role => ROLE_VALUES.includes(v as Role)

// ── Session / JWT ────────────────────────────────────────────────
// Mandatory in production; dev-only fallback so local runs work without setup.
const DEV_SECRET = 'dev-only-insecure-secret-change-me'
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET is required in production')
}
export const JWT_SECRET = process.env.JWT_SECRET || DEV_SECRET
export const COOKIE_NAME = 'auth-token'

// Rolling session: a short-lived token the client refreshes while the
// dashboard is open (see /api/auth/refresh). This is the idle window.
export const TOKEN_TTL = '24h'
export const TOKEN_MAX_AGE = 60 * 60 * 24 // seconds — cookie maxAge

// ── Sites ────────────────────────────────────────────────────────
// Single source of truth for known site slugs (mills + cluster ids like
// "razzakabad"), derived from dashboardCategories. Used to validate site
// assignments and to expand admin/manager to "all sites".
export const ALL_SITES: string[] = Array.from(
  new Set(
    DASHBOARD_CATEGORIES.flatMap((c) => [
      ...((c.subgroups?.map((g) => g.id).filter(Boolean) as string[]) ?? []),
      ...categoryAms(c).map((a) => a.id),
    ]),
  ),
)

export const isKnownSite = (site: string): boolean => ALL_SITES.includes(site)

/** Parse the comma-joined `x-user-sites` header the proxy injects. */
export function sitesFromHeader(h: string | null | undefined): string[] {
  return h ? h.split(',').map((s) => s.trim()).filter(Boolean) : []
}

/** Effective *display* sites for a user (admin/manager see everything). */
export function effectiveSites(role: Role, sites: string[]): string[] {
  return role === 'admin' || role === 'manager' ? ALL_SITES : sites
}

/** Access check for a given site. Admin/manager bypass the assigned list. */
export function canAccessSite(role: Role, sites: string[], site: string): boolean {
  return role === 'admin' || role === 'manager' || sites.includes(site)
}

/** Where to land after login: straight into the only site, else the overview. */
export function landingPath(role: Role, sites: string[]): string {
  const eff = effectiveSites(role, sites)
  return eff.length === 1 ? `/dashboard/${eff[0]}` : '/dashboard'
}
