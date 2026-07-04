import { headers } from 'next/headers'
import { SITE_PERMISSIONS, type Role } from '@/lib/constants'
import { DASHBOARD_CATEGORIES } from '@/lib/dashboardCategories'
import { DashboardGrid } from './DashboardGrid'

export default async function OverviewPage() {
  const headersList = await headers()
  const name = headersList.get('x-user-name') || 'User'
  const role = (headersList.get('x-user-role') || 'am4_user') as Role

  const canAccess = (id: string) => SITE_PERMISSIONS[id]?.includes(role) ?? false

  // Keep only the AMs this role can access; drop empty subgroups and categories.
  const categories = DASHBOARD_CATEGORIES.map((c) => ({
    ...c,
    subgroups: (c.subgroups ?? [])
      .map((g) => ({ ...g, ams: g.ams.filter((am) => canAccess(am.id)) }))
      .filter((g) => g.ams.length > 0),
    ams: c.ams.filter((am) => canAccess(am.id)),
  })).filter((c) => c.ams.length > 0 || c.subgroups.length > 0)

  return (
    <main id="main-content" tabIndex={-1} className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink mb-1">Welcome, {name}</h1>
        <p className="text-sm text-ink-secondary">Select a mill to view its dashboard.</p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-ink-secondary text-sm">No sites assigned to your account. Contact your administrator.</p>
        </div>
      ) : (
        <DashboardGrid categories={categories} />
      )}
    </main>
  )
}
