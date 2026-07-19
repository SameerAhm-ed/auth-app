import { DASHBOARD_CATEGORIES, categoryAms, EXTRA_GROUP_SITES, EXTRA_INDIVIDUAL_SITES, GROUP_MEMBER_IDS, GROUP_SITE_IDS } from './dashboardCategories'

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
// The JWT secret itself lives in auth.ts (server-only). This file is
// imported by client components, so it must never touch secrets.
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
  new Set([
    ...DASHBOARD_CATEGORIES.flatMap((c) => [
      ...((c.subgroups?.map((g) => g.id).filter(Boolean) as string[]) ?? []),
      ...categoryAms(c).map((a) => a.id),
    ]),
    ...EXTRA_GROUP_SITES.map((g) => g.id),
    ...EXTRA_INDIVIDUAL_SITES.map((s) => s.id),
  ]),
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

const EXTRA_INDIVIDUAL_TARGET: Record<string, string> = Object.fromEntries(
  EXTRA_INDIVIDUAL_SITES.map((s) => [s.id, s.grants]),
)

/** Access check for a given site. Admin/manager bypass the assigned list.
    A user holding a group id (e.g. "garments") also gets each mill inside
    that group ("am4", "am14", "am15") — the group grant covers its members.
    A user holding an EXTRA_INDIVIDUAL_SITES id (e.g. "razzakabad_detail")
    gets only the one page it aliases to — no member-mill expansion. */
export function canAccessSite(role: Role, sites: string[], site: string): boolean {
  if (role === 'admin' || role === 'manager') return true
  if (sites.includes(site)) return true
  if (sites.some((s) => EXTRA_INDIVIDUAL_TARGET[s] === site)) return true
  return sites.some((s) => GROUP_MEMBER_IDS[s]?.includes(site))
}

/** URL for a site id. Group ids (GROUP_SITE_IDS — e.g. "garments",
    "razzakabad") land on their /dashboard/overview/<id> summary page, not a
    /dashboard/<id> mill page (razzakabad also has a separate, more detailed
    /dashboard/razzakabad cluster page — that page still exists and is still
    reachable, just not the auto-landing target for the group grant; the
    overview page links to it directly). EXTRA_INDIVIDUAL_SITES ids (e.g.
    "razzakabad_detail") link straight to the page they alias to. Use this
    anywhere a site id gets turned into a link (site switcher, landing
    redirect). */
export function siteHref(id: string): string {
  if (EXTRA_INDIVIDUAL_TARGET[id]) return `/dashboard/${EXTRA_INDIVIDUAL_TARGET[id]}`
  return GROUP_SITE_IDS.has(id) ? `/dashboard/overview/${id}` : `/dashboard/${id}`
}

/** Where to land after login: straight into the only site, else the overview. */
export function landingPath(role: Role, sites: string[]): string {
  const eff = effectiveSites(role, sites)
  return eff.length === 1 ? siteHref(eff[0]) : '/dashboard'
}
