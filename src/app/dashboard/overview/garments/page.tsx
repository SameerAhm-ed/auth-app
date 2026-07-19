import { headers } from 'next/headers'
import { canAccessSite, sitesFromHeader, isRole, type Role } from '@/lib/constants'
import { categoryAmsByName } from '@/lib/dashboardCategories'
import { DashboardGrid } from '../../DashboardGrid'

// Group-scoped overview: same hero card + mill-row style as the main
// /dashboard overview, but totaled only across the Garments category
// (AM4/AM14/AM15). Gated on the 'garments' group permission specifically —
// all-or-nothing, not filtered by individual-mill access. A user with only
// an individual mill (e.g. am4) can open that mill's own dashboard, but not
// this page — same model as the main dashboard's category filtering intends
// but stricter, per product decision.
export default async function GarmentsOverviewPage() {
  const headersList = await headers()
  const name = headersList.get('x-user-name') || 'User'
  const roleHeader = headersList.get('x-user-role')
  const role: Role = isRole(roleHeader) ? roleHeader : 'user'
  const sites = sitesFromHeader(headersList.get('x-user-sites'))

  const canAccess = (id: string) => canAccessSite(role, sites, id)
  const hasGroupAccess = canAccess('garments')
  const ams = hasGroupAccess ? categoryAmsByName('Garments') : []

  return (
    <main id="main-content" tabIndex={-1} className="max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-5 pb-[max(3rem,env(safe-area-inset-bottom))]">
      {!hasGroupAccess ? (
        <div className="text-center py-20">
          <p className="text-ink-secondary text-sm">No sites assigned to your account. Contact your administrator.</p>
        </div>
      ) : (
        <DashboardGrid categories={[{ name: 'Garments', icon: 'factory', ams }]} name={name} />
      )}
    </main>
  )
}
