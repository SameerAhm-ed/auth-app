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
export interface DashboardCategory {
  name: string
  icon: string
  ams: DashboardAM[]
}

export const DASHBOARD_CATEGORIES: DashboardCategory[] = [
  {
    name: 'Razzakabad',
    icon: 'map-pin',
    ams: [
      { id: 'am5', label: 'AM5', live: true },
      { id: 'am17', label: 'AM17' },
      { id: 'am8', label: 'AM8', live: true },
    ],
  },
  {
    name: 'Denim',
    icon: 'shirt',
    ams: [
      { id: 'am2', label: 'AM2' },
      { id: 'am_pq', label: 'AM PQ' },
      { id: 'am16', label: 'AM16' },
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
    name: 'Spinning',
    icon: 'layers',
    ams: [{ id: 'am3', label: 'AM3' }],
  },
]
