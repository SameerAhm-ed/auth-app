import { headers } from 'next/headers'
import SiteSidebar from '@/components/SiteSidebar'
import { sitesFromHeader } from '@/lib/constants'

export default async function RazzakabadLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const allowedSites = sitesFromHeader(headersList.get('x-user-sites'))

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
