'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker once on the client. A controlling SW with a
 * fetch handler is a hard precondition for the install prompt, so register
 * as soon as possible: immediately if the page already finished loading
 * (the 'load' event may have fired before this effect runs, in which case a
 * bare load listener would never fire), otherwise on load.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('SW registration failed:', err)
      })
    }
    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register, { once: true })
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}
