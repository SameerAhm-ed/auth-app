'use client'

import { useEffect, useState } from 'react'

/**
 * Polls an API endpoint that returns `{ data: T[] }` on an interval.
 *
 * Crash-safe: keeps the last good data if a tick fails, and exposes an `error`
 * string for a reconnect indicator. Default cadence: 1s.
 *
 * Hardened cadence (no behaviour change for callers — same signature/return):
 *  - self-scheduling chain (setTimeout after each completes) so a slow response
 *    never lets requests overlap/stack,
 *  - aborts the in-flight request on unmount / endpoint change,
 *  - pauses while the tab is hidden (no point polling a backgrounded dashboard)
 *    and refreshes immediately when it becomes visible again.
 */
export function useLiveData<T>(endpoint: string, intervalMs = 1000, errorMessage = 'Failed to load data') {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let controller: AbortController | undefined

    const schedule = () => {
      if (!cancelled) timer = setTimeout(tick, intervalMs)
    }

    async function tick() {
      // Pause while hidden; visibilitychange will kick a fresh tick on return.
      if (typeof document !== 'undefined' && document.hidden) return

      controller = new AbortController()
      try {
        const res = await fetch(endpoint, {
          method: 'GET',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('Failed to fetch data')
        const json = await res.json()
        if (!cancelled && json?.data) {
          setData(json.data)
          setError('')
        }
      } catch (e) {
        if (!cancelled && (e as Error).name !== 'AbortError') setError(errorMessage)
      } finally {
        if (!cancelled) {
          setLoading(false)
          schedule()
        }
      }
    }

    const onVisible = () => {
      if (cancelled || document.hidden) return
      if (timer) clearTimeout(timer)
      tick()
    }

    tick()
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      controller?.abort()
      if (timer) clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [endpoint, intervalMs, errorMessage])

  return { data, loading, error }
}
