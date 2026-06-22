import { headers } from 'next/headers'
import SiteSidebar from '@/components/SiteSidebar'
import { ROLE_SITES } from '@/lib/constants'

export default async function AM14Layout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const role = headersList.get('x-user-role') || 'am4_user'
  const allowedSites = ROLE_SITES[role] || []

  return (
    <div className="flex min-h-[calc(100dvh-56px)]">
      <SiteSidebar
        site="am14"
        label="AM14"
        accentColor="#9333ea"
        allowedSites={allowedSites}
      />
      <main id="main-content" tabIndex={-1} className="flex-1 p-6 bg-canvas overflow-auto">
        {children}
      </main>
    </div>
  )
}
