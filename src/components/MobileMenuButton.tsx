'use client'

import { Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useMobileSidebar } from './MobileSidebar'

/**
 * Hamburger shown only on mobile, and only on routes that actually have a
 * sidebar (a specific site, e.g. /dashboard/am4). The overview at /dashboard
 * has no sidebar, so the button hides itself there.
 */
export default function MobileMenuButton() {
  const pathname = usePathname()
  const { setOpen } = useMobileSidebar()

  const hasSidebar = /^\/dashboard\/[^/]+/.test(pathname)
  if (!hasSidebar) return null

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Open navigation menu"
      className="md:hidden w-11 h-11 -ml-2 flex items-center justify-center rounded-lg text-ink-secondary hover:text-ink hover:bg-canvas transition-colors"
    >
      <Menu size={20} />
    </button>
  )
}
