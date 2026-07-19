import { headers } from 'next/headers'
import { canAccessSite, sitesFromHeader, isRole, type Role } from '@/lib/constants'
import { subgroupAmsById } from '@/lib/dashboardCategories'
import { DashboardGrid } from '../../DashboardGrid'

// Group-scoped overview: same hero card + mill-row style as the main
// /dashboard overview, but totaled only across the Razzakabad cluster
// (AM5/AM8/AM17). Independent of /dashboard/razzakabad (the detailed
// cluster page) — this is a separate, additive view, nothing there changed.
// Gated on the 'razzakabad' group permission specifically — all-or-nothing,
// not filtered by individual-mill access (same model as Garments).
export default async function RazzakabadOverviewPage() {
  const headersList = await headers()
  const name = headersList.get('x-user-name') || 'User'
  const roleHeader = headersList.get('x-user-role')
  const role: Role = isRole(roleHeader) ? roleHeader : 'user'
  const sites = sitesFromHeader(headersList.get('x-user-sites'))

  const canAccess = (id: string) => canAccessSite(role, sites, id)
  const hasGroupAccess = canAccess('razzakabad')
  const ams = hasGroupAccess ? subgroupAmsById('razzakabad') : []

  return (
    <main id="main-content" tabIndex={-1} className="max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-5 pb-[max(3rem,env(safe-area-inset-bottom))]">
      {!hasGroupAccess ? (
        <div className="text-center py-20">
          <p className="text-ink-secondary text-sm">No sites assigned to your account. Contact your administrator.</p>
        </div>
      ) : (
        <DashboardGrid
          categories={[{
            name: 'Razzakabad',
            icon: 'mappin',
            // Nested as a subgroup (not flat `ams`) so it renders via the same
            // clickable ClusterBand row as the main dashboard — id makes the
            // row a link to /dashboard/razzakabad.
            subgroups: [{ id: 'razzakabad', name: 'Razzakabad', ams }],
            ams: [],
          }]}
          name={name}
        />
      )}
    </main>
  )
}
