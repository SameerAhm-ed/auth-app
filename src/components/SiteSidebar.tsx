'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Sun, Flame, Factory, Zap, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useMobileSidebar } from './MobileSidebar'
import { siteLabel } from '@/lib/dashboardCategories'

interface Props {
  site: string        // current site e.g. "am4"
  label: string       // display label e.g. "AM4"
  accentColor: string // reserved for future per-site theming (grayscale for now)
  allowedSites: string[] // all sites this user can access
}

const NAV_ITEMS = [
  { label: 'Dashboard', path: '',       icon: LayoutDashboard },
  { label: 'Solar',     path: '/solar', icon: Sun             },
  { label: 'Steam',     path: '/steam', icon: Flame           },
]

// Extra nav items that only exist for specific sites (avoids dead links on
// sites that don't have these pages yet).
const SITE_EXTRA_NAV: Record<string, { label: string; path: string; icon: typeof LayoutDashboard }[]> = {
  am4: [
    { label: 'Powerhouse', path: '/powerhouse', icon: Factory },
    { label: 'K.E', path: '/ke', icon: Zap },
  ],
  am14: [{ label: 'Powerhouse', path: '/powerhouse', icon: Factory }],
  am15: [{ label: 'Powerhouse', path: '/powerhouse', icon: Factory }],
}

type NavItem = { label: string; path: string; icon: typeof LayoutDashboard }
type NavGroup = { heading?: string; items: NavItem[] }

// Shared full nav for the Razzakabad cluster (also used by the AM5 route).
const RAZZAKABAD_NAV: NavGroup[] = [
  { items: [{ label: 'Dashboard', path: '', icon: LayoutDashboard }] },
  {
    heading: 'Power Houses',
    items: [
      { label: 'Power House 1', path: '/powerhouse1', icon: Factory },
      { label: 'Power House 2', path: '/powerhouse2', icon: Factory },
      { label: 'Power House 3', path: '/powerhouse3', icon: Factory },
      { label: 'Power House 4', path: '/powerhouse4', icon: Factory },
    ],
  },
  {
    heading: 'Steam',
    items: [
      { label: 'Steam PH 1', path: '/steamph1', icon: Flame },
      { label: 'Steam PH 2', path: '/steamph2', icon: Flame },
      { label: 'Steam PH 3', path: '/steamph3', icon: Flame },
      { label: 'Steam PH 4', path: '/steamph4', icon: Flame },
      { label: 'Out Source Boiler 1', path: '/coalboiler1', icon: Flame },
      { label: 'Out Source Boiler 2', path: '/coalboiler2', icon: Flame },
    ],
  },
  { items: [{ label: 'Solar', path: '/solar', icon: Sun }] },
]

// Sites with many pages get fully custom, grouped nav (overrides the default).
const SITE_NAV: Record<string, NavGroup[]> = {
  razzakabad: RAZZAKABAD_NAV,
  // AM5 is a reduced view: Power Houses 1–2 and Steam PH 1–2 + coal boilers only.
  am5: [
    { items: [{ label: 'Dashboard', path: '', icon: LayoutDashboard }] },
    {
      heading: 'Power Houses',
      items: [
        { label: 'Power House 1', path: '/powerhouse1', icon: Factory },
        { label: 'Power House 2', path: '/powerhouse2', icon: Factory },
      ],
    },
    {
      heading: 'Steam',
      items: [
        { label: 'Steam PH 1', path: '/steamph1', icon: Flame },
        { label: 'Steam PH 2', path: '/steamph2', icon: Flame },
        { label: 'Out Source Boiler 1', path: '/coalboiler1', icon: Flame },
        { label: 'Out Source Boiler 2', path: '/coalboiler2', icon: Flame },
      ],
    },
    { items: [{ label: 'Solar', path: '/solar', icon: Sun }] },
  ],
  am17: [
    { items: [{ label: 'Dashboard', path: '', icon: LayoutDashboard }] },
    {
      heading: 'Power Houses',
      items: [
        { label: 'Power House 1', path: '/powerhouse3', icon: Factory },
        { label: 'Power House 2', path: '/powerhouse4', icon: Factory },
      ],
    },
    { items: [{ label: 'Solar', path: '/solar', icon: Sun }] },
  ],
  // AM8 is a single solar + utilization view — only the overview link.
  am8: [{ items: [{ label: 'Dashboard', path: '', icon: LayoutDashboard }] }],
}

// Grouped nav for a site: custom if defined, else the default flat list.
function navGroupsFor(site: string, label: string): NavGroup[] {
  if (SITE_NAV[site]) return SITE_NAV[site]
  return [{ heading: `${label} Pages`, items: [...NAV_ITEMS, ...(SITE_EXTRA_NAV[site] ?? [])] }]
}

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
                    {siteLabel(s)}
                  </div>
                  {isActive && <ChevronRight size={13} />}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Current site page nav (grouped) */}
      <nav className="flex-1 px-3 py-3 space-y-3 overflow-y-auto">
        {navGroupsFor(site, label).map((group, gi) => (
          <div key={group.heading ?? gi} className="space-y-0.5">
            {group.heading && (
              <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider px-2 mb-1.5">
                {group.heading}
              </p>
            )}
            {group.items.map(({ label: navLabel, path, icon: Icon }) => {
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
          </div>
        ))}
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
  const drawerRef = useRef<HTMLElement>(null)

  // Close the drawer whenever the route changes (e.g. after tapping a link).
  useEffect(() => {
    setOpen(false)
  }, [pathname, setOpen])

  // While the drawer is open: lock body scroll, close on Escape, trap focus
  // inside the drawer, and restore focus to the opener on close.
  useEffect(() => {
    if (!open) return
    const drawer = drawerRef.current
    const prevOverflow = document.body.style.overflow
    const prevFocused = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'

    const focusables = () =>
      Array.from(
        drawer?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null)

    focusables()[0]?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
      prevFocused?.focus?.()
    }
  }, [open, setOpen])

  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col bg-surface border-r border-line min-h-[calc(100dvh-56px)]">
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
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        inert={!open}
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[82%] flex flex-col bg-surface border-r border-line md:hidden overflow-y-auto pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-line shrink-0">
          <span className="text-sm font-semibold text-ink">Navigation</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
            className="w-11 h-11 -mr-2 flex items-center justify-center rounded-lg text-ink-secondary hover:text-ink hover:bg-canvas transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <SidebarBody site={site} label={label} allowedSites={allowedSites} />
      </aside>
    </>
  )
}
