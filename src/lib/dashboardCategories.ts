// Data-driven grouping for the dashboard overview. To add / move / rename an AM,
// edit this list only — the overview UI and routing derive from it.
//   id    → route slug (/dashboard/<id>) and permission key (see SITE_PERMISSIONS)
//   label → display name
//   live  → true = instrumented (green "Online"); omit for placeholders ("Coming soon")
//   hasSteam → true = computeSummary() returns a real steam value for this AM
//              (AM8/AM17/AM14 are hardcoded to steam: 0 — not instrumented — so
//              they're excluded even though AM14 is `live` for power)
//   icon  → category icon key (resolved to a lucide icon in DashboardGrid)
export interface DashboardAM {
  id: string
  label: string
  live?: boolean
  hasSteam?: boolean
}
// A named cluster of mills within a category (e.g. a site/location).
// `id` → the cluster has its own dashboard at /dashboard/<id> (clickable header).
export interface DashboardSubgroup {
  id?: string
  name: string
  ams: DashboardAM[]
}
export interface DashboardCategory {
  name: string
  icon: string
  subgroups?: DashboardSubgroup[] // labeled clusters, rendered above direct mills
  ams: DashboardAM[]              // mills that sit directly under the category
}

// All mills in a category, subgroups first — for totals, counts, live checks.
export function categoryAms(c: DashboardCategory): DashboardAM[] {
  return [...(c.subgroups?.flatMap((g) => g.ams) ?? []), ...c.ams]
}

/** Mills of a named subgroup (e.g. the Razzakabad cluster) — for group-scoped overview pages. */
export function subgroupAmsById(id: string): DashboardAM[] {
  for (const c of DASHBOARD_CATEGORIES) {
    for (const g of c.subgroups ?? []) {
      if (g.id === id) return g.ams
    }
  }
  return []
}

/** Direct mills of a top-level category by name (e.g. Garments) — for group-scoped overview pages. */
export function categoryAmsByName(name: string): DashboardAM[] {
  return DASHBOARD_CATEGORIES.find((c) => c.name === name)?.ams ?? []
}

// Group-level permission ids that aren't tied to a rendered subgroup (unlike
// "razzakabad", which is already a subgroup id and so already flows into
// ALL_SITES below). Granting one of these ids is all-or-nothing access to
// that category's own /dashboard/overview/<id> page — not a partial view.
// `categoryName` is the DASHBOARD_CATEGORIES lookup key (kept separate from
// `label`, which is just display text and may not match the category name).
export const GROUP_PERMISSIONS: { id: string; label: string; categoryName: string }[] = [
  { id: 'garments', label: 'Garments', categoryName: 'Garments' },
]

// Individual, single-purpose grants that alias to an existing page WITHOUT
// the broader semantics a group id carries (no member-mill expansion, no
// landing on a group overview page — just that one page, nothing else).
// `grants` is the real underlying site id whose page this unlocks; distinct
// from `id`, which is the permission key an admin actually checks. Shows up
// under "Individual mill access" in the admin form (it isn't a
// GROUP_MEMBER_IDS key), separate from and independent of the matching
// group checkbox — an admin can grant either, both, or neither.
export const PAGE_ALIAS_PERMISSIONS: { id: string; label: string; grants: string }[] = [
  { id: 'razzakabad_detail', label: 'Razzakabad (Full View)', grants: 'razzakabad' },
]

export const DASHBOARD_CATEGORIES: DashboardCategory[] = [
  {
    name: 'Denim & Spinning',
    icon: 'shirt',
    subgroups: [
      {
        id: 'razzakabad',
        name: 'Razzakabad',
        ams: [
          { id: 'am5', label: 'AM5', live: true, hasSteam: true },
          { id: 'am8', label: 'AM8', live: true },
          { id: 'am17', label: 'AM17', live: true, hasSteam: true },
        ],
      },
    ],
    ams: [
      { id: 'am2', label: 'AM2' },
      { id: 'am3', label: 'AM3' },
      { id: 'am_pq', label: 'AM PQ' },
    ],
  },
  {
    name: 'Garments',
    icon: 'factory',
    ams: [
      { id: 'am4', label: 'AM4', live: true, hasSteam: true },
      { id: 'am14', label: 'AM14', live: true },
      { id: 'am15', label: 'AM15', live: true }, // steam sensors (Tower 1/2) are distribution meters, not generation — see summaryMath.ts
    ],
  },
  {
    name: 'Art Mill',
    icon: 'palette',
    ams: [
      { id: 'am16', label: 'Art Mill' },
    ],
  },
]

// Flat id → display label for every site (mills + cluster subgroups). Declared
// after DASHBOARD_CATEGORIES so it reads the fully-initialized list.
export const SITE_LABELS: Record<string, string> = Object.fromEntries([
  ...DASHBOARD_CATEGORIES.flatMap((c) => [
    ...(c.subgroups ?? []).flatMap((g) => (g.id ? [[g.id, g.name] as const] : [])),
    ...categoryAms(c).map((a) => [a.id, a.label] as const),
  ]),
  ...GROUP_PERMISSIONS.map((g) => [g.id, g.label] as const),
  ...PAGE_ALIAS_PERMISSIONS.map((s) => [s.id, s.label] as const),
])

/** Display label for a site id, falling back to the upper-cased id. */
export function siteLabel(id: string): string {
  return SITE_LABELS[id] ?? id.toUpperCase()
}

// Group id -> the mill ids it covers. A user granted the group id (e.g.
// "garments") can also open each member mill's own dashboard directly, not
// just the group overview page — used by canAccessSite in constants.ts.
export const GROUP_MEMBER_IDS: Record<string, string[]> = {
  razzakabad: subgroupAmsById('razzakabad').map((a) => a.id),
  ...Object.fromEntries(GROUP_PERMISSIONS.map((g) => [g.id, categoryAmsByName(g.categoryName).map((a) => a.id)])),
}

// Which ids are "group" ids — get the /dashboard/overview/<id> landing
// treatment, shown under "Group access" in the admin form. Derived once here
// (GROUP_MEMBER_IDS's keys) so consumers (constants.ts, the admin form)
// import this instead of each recomputing their own copy of the same set.
export const GROUP_SITE_IDS: Set<string> = new Set(Object.keys(GROUP_MEMBER_IDS))
