import { headers } from 'next/headers'
import SiteSidebar from '@/components/SiteSidebar'
import { sitesFromHeader } from '@/lib/constants'

export default async function AM4Layout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const allowedSites = sitesFromHeader(headersList.get('x-user-sites'))

  return (
    <div className="flex min-h-[calc(100dvh-56px)]">
      <SiteSidebar
        site="am4"
        label="AM4"
        accentColor="#008060"
        allowedSites={allowedSites}
      />
      <main id="main-content" tabIndex={-1} className="flex-1 p-6 bg-canvas overflow-auto">
        {children}
      </main>
    </div>
  )
}
