import { headers } from 'next/headers'
import { canAccessSite, sitesFromHeader, isRole, type Role } from '@/lib/constants'
import { DASHBOARD_CATEGORIES } from '@/lib/dashboardCategories'
import { DashboardGrid } from './DashboardGrid'

export default async function OverviewPage() {
  const headersList = await headers()
  const name = headersList.get('x-user-name') || 'User'
  const roleHeader = headersList.get('x-user-role')
  const role: Role = isRole(roleHeader) ? roleHeader : 'user'
  const sites = sitesFromHeader(headersList.get('x-user-sites'))

  const canAccess = (id: string) => canAccessSite(role, sites, id)

  // Keep only the AMs this role can access; drop empty subgroups and categories.
  const categories = DASHBOARD_CATEGORIES.map((c) => ({
    ...c,
    subgroups: (c.subgroups ?? [])
      .map((g) => ({ ...g, ams: g.ams.filter((am) => canAccess(am.id)) }))
      .filter((g) => g.ams.length > 0),
    ams: c.ams.filter((am) => canAccess(am.id)),
  })).filter((c) => c.ams.length > 0 || c.subgroups.length > 0)

  return (
    <main id="main-content" tabIndex={-1} className="max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-5 pb-[max(3rem,env(safe-area-inset-bottom))]">
      {categories.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-ink-secondary text-sm">No sites assigned to your account. Contact your administrator.</p>
        </div>
      ) : (
        <DashboardGrid categories={categories} name={name} />
      )}
    </main>
  )
}
