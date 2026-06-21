'use client'

import { useEffect, useState } from 'react'

/**
 * Polls an API endpoint that returns `{ data: T[] }` on an interval.
 * Crash-safe: keeps the last good data if a tick fails, and exposes an
 * `error` string for a reconnect indicator. Default cadence: 1s.
 */
export function useLiveData<T>(endpoint: string, intervalMs = 1000) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const refresh = async () => {
      try {
        const res = await fetch(endpoint, {
          method: 'GET',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
        })
        if (!res.ok) throw new Error('Failed to fetch data')
        const json = await res.json()
        if (!cancelled && json?.data) {
          setData(json.data)
          setError('')
        }
      } catch {
        if (!cancelled) setError('Failed to load data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    refresh()
    const id = setInterval(refresh, intervalMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [endpoint, intervalMs])

  return { data, loading, error }
}
