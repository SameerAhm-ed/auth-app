'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Sun, Flame, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useMobileSidebar } from './MobileSidebar'

interface Props {
  site: string        // current site e.g. "am4"
  label: string       // display label e.g. "AM4"
  accentColor: string // reserved for future per-site theming (grayscale for now)
  allowedSites: string[] // all sites this user can access
}

const SITE_META: Record<string, { label: string }> = {
  am4:  { label: 'AM4'  },
  am5:  { label: 'AM5'  },
  am14: { label: 'AM14' },
  am15: { label: 'AM15' },
}

const NAV_ITEMS = [
  { label: 'Dashboard', path: '',       icon: LayoutDashboard },
  { label: 'Solar',     path: '/solar', icon: Sun             },
  { label: 'Steam',     path: '/steam', icon: Flame           },
]

/**
 * Inner content shared by the desktop rail and the mobile drawer.
 * Rows are 44px tall on mobile (touch target) and condense to 36px on desktop.
 */
function SidebarBody({ site, label, allowedSites }: Omit<Props, 'accentColor'>) {
  const pathname = usePathname()
  const base = `/dashboard/${site}`
  const hasMultipleSites = allowedSites.length > 1

  return (
    <>
      {/* Current site header */}
      <div className="px-4 py-4 border-b border-line">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-surface-subtle text-ink flex items-center justify-center text-xs font-bold shrink-0">
            {label}
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">{label}</p>
            <p className="text-[11px] text-ink-muted">Site Dashboard</p>
          </div>
        </div>
      </div>

      {/* Site switcher (only for multi-site users) */}
      {hasMultipleSites && (
        <div className="px-3 pt-3 pb-2 border-b border-line">
          <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider px-2 mb-1.5">
            Sites
          </p>
          <div className="space-y-0.5">
            {allowedSites.map((s) => {
              const meta     = SITE_META[s]
              const isActive = s === site
              return (
                <Link
                  key={s}
                  href={`/dashboard/${s}`}
                  className={`flex items-center justify-between h-11 md:h-8 px-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-brand-subtle text-ink' : 'text-ink-secondary hover:text-ink hover:bg-canvas'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-brand' : 'bg-line-strong'}`}
                    />
                    {meta.label}
                  </div>
                  {isActive && <ChevronRight size={13} />}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Current site page nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider px-2 mb-1.5">
          {label} Pages
        </p>
        {NAV_ITEMS.map(({ label: navLabel, path, icon: Icon }) => {
          const href     = base + path
          const isActive = path === '' ? pathname === base : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 h-11 md:h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-subtle text-ink' : 'text-ink-secondary hover:text-ink hover:bg-canvas'
              }`}
            >
              <Icon size={15} />
              {navLabel}
            </Link>
          )
        })}
      </nav>

      {/* Back to overview */}
      <div className="px-3 pb-4 pt-3 border-t border-line">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 h-11 md:h-9 px-3 rounded-lg text-sm text-ink-secondary hover:text-ink hover:bg-canvas transition-colors"
        >
          <ChevronLeft size={15} />
          All Sites
        </Link>
      </div>
    </>
  )
}

export default function SiteSidebar({ site, label, allowedSites }: Props) {
  const pathname = usePathname()
  const { open, setOpen } = useMobileSidebar()

  // Close the drawer whenever the route changes (e.g. after tapping a link).
  useEffect(() => {
    setOpen(false)
  }, [pathname, setOpen])

  // Lock body scroll + close on Escape while the drawer is open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, setOpen])

  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col bg-surface border-r border-line min-h-[calc(100vh-56px)]">
        <SidebarBody site={site} label={label} allowedSites={allowedSites} />
      </aside>

      {/* Mobile backdrop */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/40 md:hidden transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Mobile drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        inert={!open}
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[82%] flex flex-col bg-surface border-r border-line md:hidden overflow-y-auto transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-line shrink-0">
          <span className="text-sm font-semibold text-ink">Navigation</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
            className="w-10 h-10 -mr-2 flex items-center justify-center rounded-lg text-ink-secondary hover:text-ink hover:bg-canvas transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <SidebarBody site={site} label={label} allowedSites={allowedSites} />
      </aside>
    </>
  )
}
