import { headers } from 'next/headers'
import SiteSidebar from '@/components/SiteSidebar'
import { ROLE_SITES } from '@/lib/constants'

export default async function RazzakabadLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const role = headersList.get('x-user-role') || 'am4_user'
  const allowedSites = ROLE_SITES[role] || []

  return (
    <div className="flex min-h-[calc(100dvh-56px)]">
      <SiteSidebar
        site="razzakabad"
        label="Razzakabad"
        accentColor="#2563eb"
        allowedSites={allowedSites}
      />
      <main id="main-content" tabIndex={-1} className="flex-1 p-6 bg-canvas overflow-auto">
        {children}
      </main>
    </div>
  )
}
