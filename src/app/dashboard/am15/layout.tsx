import { headers } from 'next/headers'
import SiteSidebar from '@/components/SiteSidebar'
import { ROLE_SITES } from '@/lib/constants'

export default async function AM15Layout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const role = headersList.get('x-user-role') || 'am4_user'
  const allowedSites = ROLE_SITES[role] || []

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      <SiteSidebar
        site="am15"
        label="AM15"
        accentColor="#ea580c"
        allowedSites={allowedSites}
      />
      <main className="flex-1 p-6 bg-canvas overflow-auto">
        {children}
      </main>
    </div>
  )
}
