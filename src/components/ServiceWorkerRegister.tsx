'use client'

import { useEffect } from 'react'
// Side-effect import: registers the beforeinstallprompt listener as soon as
// this (root-mounted, route-independent) bundle loads — see src/lib/installPrompt.ts.
import '@/lib/installPrompt'

/** Registers the service worker once on the client (production-capable browsers). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('SW registration failed:', err)
      })
    }
    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, [])

  return null
}
