// Data-driven grouping for the dashboard overview. To add / move / rename an AM,
// edit this list only — the overview UI and routing derive from it.
//   id    → route slug (/dashboard/<id>) and permission key (see SITE_PERMISSIONS)
//   label → display name
export interface DashboardAM {
  id: string
  label: string
}
export interface DashboardCategory {
  name: string
  ams: DashboardAM[]
}

export const DASHBOARD_CATEGORIES: DashboardCategory[] = [
  {
    name: 'Razzakabad',
    ams: [{ id: 'am5', label: 'AM5' }],
  },
  {
    name: 'Denim',
    ams: [
      { id: 'am2', label: 'AM2' },
      { id: 'am_pq', label: 'AM PQ' },
      { id: 'am16', label: 'AM16' },
    ],
  },
  {
    name: 'Garments',
    ams: [
      { id: 'am4', label: 'AM4' },
      { id: 'am14', label: 'AM14' },
      { id: 'am15', label: 'AM15' },
    ],
  },
  {
    name: 'Spinning',
    ams: [
      { id: 'am3', label: 'AM3' },
      { id: 'am8', label: 'AM8' },
      { id: 'am17', label: 'AM17' },
    ],
  },
]
