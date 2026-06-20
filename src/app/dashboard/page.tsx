import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ROLE_SITES } from '@/lib/constants'
import { Card } from '@/components/ui/Card'
import { buttonVariants } from '@/components/ui/Button'

const SITE_LABELS: Record<string, string> = {
  am4:  'AM4',
  am5:  'AM5',
  am14: 'AM14',
  am15: 'AM15',
}

export default async function OverviewPage() {
  const headersList = await headers()
  const name = headersList.get('x-user-name') || 'User'
  const role = headersList.get('x-user-role') || 'am4_user'

  const allowedSites = ROLE_SITES[role] || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink mb-1">Welcome, {name}</h1>
        <p className="text-sm text-ink-secondary">Select a site to view its dashboard.</p>
      </div>

      {/* Site cards — identical styling across every site */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {allowedSites.map((site) => {
          const label = SITE_LABELS[site] || site.toUpperCase()
          return (
            <Card key={site} className="p-6 flex flex-col gap-5">
              {/* Site identity */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-subtle flex items-center justify-center">
                  <span className="text-sm font-bold text-ink">{label}</span>
                </div>
                <div>
                  <p className="text-base font-semibold text-ink">{label}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                    <span className="text-xs text-ink-secondary">Online</span>
                  </div>
                </div>
              </div>

              {/* Open button */}
              <Link href={`/dashboard/${site}`} className={buttonVariants({ variant: 'primary', fullWidth: true })}>
                Open
                <ArrowRight size={15} />
              </Link>
            </Card>
          )
        })}
      </div>

      {/* Empty state */}
      {allowedSites.length === 0 && (
        <div className="text-center py-20">
          <p className="text-ink-secondary text-sm">No sites assigned to your account. Contact your administrator.</p>
        </div>
      )}
    </div>
  )
}
