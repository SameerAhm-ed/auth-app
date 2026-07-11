// Data-driven grouping for the dashboard overview. To add / move / rename an AM,
// edit this list only — the overview UI and routing derive from it.
//   id    → route slug (/dashboard/<id>) and permission key (see SITE_PERMISSIONS)
//   label → display name
//   live  → true = instrumented (green "Online"); omit for placeholders ("Coming soon")
//   icon  → category icon key (resolved to a lucide icon in DashboardGrid)
export interface DashboardAM {
  id: string
  label: string
  live?: boolean
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

export const DASHBOARD_CATEGORIES: DashboardCategory[] = [
  {
    name: 'Denim & Spinning',
    icon: 'shirt',
    subgroups: [
      {
        id: 'razzakabad',
        name: 'Razzakabad',
        ams: [
          { id: 'am5', label: 'AM5', live: true },
          { id: 'am8', label: 'AM8', live: true },
          { id: 'am17', label: 'AM17', live: true },
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
      { id: 'am4', label: 'AM4', live: true },
      { id: 'am14', label: 'AM14', live: true },
      { id: 'am15', label: 'AM15', live: true },
    ],
  },
  {
    name: 'Art Mill',
    icon: 'palette',
    ams: [
      { id: 'am16', label: 'AM16' },
    ],
  },
]

// Flat id → display label for every site (mills + cluster subgroups). Declared
// after DASHBOARD_CATEGORIES so it reads the fully-initialized list.
export const SITE_LABELS: Record<string, string> = Object.fromEntries(
  DASHBOARD_CATEGORIES.flatMap((c) => [
    ...(c.subgroups ?? []).flatMap((g) => (g.id ? [[g.id, g.name] as const] : [])),
    ...categoryAms(c).map((a) => [a.id, a.label] as const),
  ]),
)

/** Display label for a site id, falling back to the upper-cased id. */
export function siteLabel(id: string): string {
  return SITE_LABELS[id] ?? id.toUpperCase()
}
