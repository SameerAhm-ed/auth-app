import { headers } from 'next/headers'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import MobileMenuButton from '@/components/MobileMenuButton'
import { MobileSidebarProvider } from '@/components/MobileSidebar'
import { ThemeToggle } from '@/components/ThemeToggle'
import { InstallButton } from '@/components/InstallButton'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const name  = headersList.get('x-user-name')  || 'User'
  const role  = headersList.get('x-user-role')  || 'user'

  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <MobileSidebarProvider>
    <div className="min-h-screen bg-canvas">
      {/* Top navbar */}
      <header className="bg-surface border-b border-line sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Left: mobile menu + logo */}
          <div className="flex items-center gap-1.5">
            <MobileMenuButton />
            <Link href="/dashboard" className="flex items-center gap-2.5 rounded-md" aria-label="Artistic Milliners home">
              <div className="w-7 h-7 bg-brand rounded-md flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="hidden sm:block text-[15px] font-semibold text-ink">Artistic Milliners</span>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-medium text-ink leading-tight">{name}</span>
              <span className="text-[11px] text-ink-muted leading-tight capitalize">{role.replace('_', ' ')}</span>
            </div>
            <div className="w-8 h-8 bg-brand-subtle text-ink rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
              {initials}
            </div>
            <div className="w-px h-5 bg-line mx-1 hidden sm:block" />
            <InstallButton />
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      {children}
    </div>
    </MobileSidebarProvider>
  )
}
