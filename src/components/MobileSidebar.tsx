'use client'

import { createContext, useContext, useState } from 'react'

interface MobileSidebarState {
  open: boolean
  setOpen: (value: boolean) => void
}

const MobileSidebarContext = createContext<MobileSidebarState>({
  open: false,
  setOpen: () => {},
})

/**
 * Shares the mobile drawer open/close state between the navbar hamburger
 * (rendered in the dashboard layout) and the off-canvas drawer (rendered by
 * SiteSidebar deeper in the tree). Wrap the whole dashboard shell with this.
 */
export function MobileSidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <MobileSidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </MobileSidebarContext.Provider>
  )
}

export function useMobileSidebar() {
  return useContext(MobileSidebarContext)
}
