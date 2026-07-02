import { headers } from 'next/headers'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { SITE_PERMISSIONS, type Role } from '@/lib/constants'
import { DASHBOARD_CATEGORIES } from '@/lib/dashboardCategories'

export default async function OverviewPage() {
  const headersList = await headers()
  const name = headersList.get('x-user-name') || 'User'
  const role = (headersList.get('x-user-role') || 'am4_user') as Role

  const canAccess = (id: string) => SITE_PERMISSIONS[id]?.includes(role) ?? false

  // Keep only the AMs this role can access; drop categories left empty.
  const categories = DASHBOARD_CATEGORIES.map((c) => ({
    ...c,
    ams: c.ams.filter((am) => canAccess(am.id)),
  })).filter((c) => c.ams.length > 0)

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
        <div className="space-y-8">
          {categories.map((category) => (
            <section key={category.name}>
              <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">{category.name}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {category.ams.map((am) => (
                  <Link
                    key={am.id}
                    href={`/dashboard/${am.id}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 hover:border-line-strong hover:bg-canvas transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{am.label}</p>
                      <span className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-ink-secondary">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand" aria-hidden="true" />
                        Online
                      </span>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-ink-muted group-hover:text-ink transition-colors" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}
