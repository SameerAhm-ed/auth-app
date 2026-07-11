'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Rolling session: while the dashboard is open, periodically refresh the token
// (server re-checks the user, so deactivation / role / site changes take effect).
// A 401 means the session was revoked or expired → back to login.
const REFRESH_MS = 10 * 60 * 1000 // 10 minutes

export default function SessionKeepAlive() {
  const router = useRouter()

  useEffect(() => {
    let stopped = false

    const ping = async () => {
      try {
        const res = await fetch('/api/auth/refresh', { method: 'POST', cache: 'no-store' })
        if (res.status === 401 && !stopped) {
          router.push('/login')
          router.refresh()
        }
      } catch {
        // Offline / transient — leave the current token; retry next tick.
      }
    }

    const id = setInterval(ping, REFRESH_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') ping()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      stopped = true
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [router])

  return null
}
