// /dashboard/am15/solar/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, BarChart3, Sun } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface AM15Solar {
  id: number
  SOLAR_TW_KW: number
  SOLAR_TW_ERROR: number
}

const CAPACITY = 1500 // kW

function statusOf(error: number, load: number): { text: string; color: string } {
  if (error > 0) return { text: 'FAULT', color: 'var(--color-danger)' }
  if (load === 0) return { text: 'OFF', color: 'var(--color-ink-muted)' }
  return { text: 'RUNNING', color: '#22a06b' }
}

async function getData() {
  const res = await fetch('/api/v1/am15/powerhouse', {
    method: 'GET',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error('Failed to fetch data')
  return res.json()
}

const R = 54
const SW = 12
const C = 2 * Math.PI * R

export default function AM15SolarPage() {
  const [data, setData] = useState<AM15Solar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const refresh = async () => {
      try {
        const result = await getData()
        if (!cancelled && result?.data) {
          setData(result.data)
          setError('')
        }
      } catch {
        if (!cancelled) setError('Failed to load solar data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    refresh()
    const id = setInterval(refresh, 1000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  const row = data[0]

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/am15"
          className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink transition-colors mb-2"
        >
          <ChevronLeft size={15} />
          AM15 overview
        </Link>
        <h1 className="text-2xl font-semibold text-ink mb-1">AM15 Solar</h1>
        <p className="text-sm text-ink-secondary">Solar generation load and status.</p>
      </div>

      <div className="max-w-sm">
        {loading ? (
          <SolarSkeleton />
        ) : error && !row ? (
          <SolarError message={error} />
        ) : !row ? (
          <SolarEmpty />
        ) : (
          <SolarCard load={row.SOLAR_TW_KW ?? 0} error={row.SOLAR_TW_ERROR ?? 0} />
        )}
      </div>
    </div>
  )
}

function SolarCard({ load, error }: { load: number; error: number }) {
  const pct = CAPACITY > 0 ? Math.min(Math.max((load / CAPACITY) * 100, 0), 100) : 0
  const status = statusOf(error, load)
  const dash = (pct / 100) * C

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Sun size={16} className="text-ink-muted" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-ink">Solar TW</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: status.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
            {status.text}
          </span>
          <Link
            href="/dashboard/am15/powerhouse/SOLAR_TW"
            aria-label="View historical report for Solar TW"
            className="w-8 h-8 -mr-1 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
          >
            <BarChart3 size={16} />
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 shrink-0">
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full -rotate-90"
            role="img"
            aria-label={`Solar TW: ${Math.round(pct)}% of capacity, status ${status.text}`}
          >
            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-surface-subtle)" strokeWidth={SW} />
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke={status.color}
              strokeWidth={SW}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${C - dash}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-ink tabular-nums">
            {Math.round(pct)}%
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-2xl font-bold text-ink tabular-nums leading-none">
            {load.toLocaleString()}
            <span className="ml-1 text-sm font-medium text-ink-secondary">kW</span>
          </p>
          <p className="mt-1.5 text-xs text-ink-muted">of {CAPACITY.toLocaleString()} kW capacity</p>
        </div>
      </div>
    </Card>
  )
}

/* ── States ──────────────────────────────────────────────────────── */

function SolarSkeleton() {
  return (
    <Card className="p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-20 rounded bg-surface-subtle" />
        <div className="h-4 w-16 rounded bg-surface-subtle" />
      </div>
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-full border-[12px] border-surface-subtle shrink-0" />
        <div className="space-y-2">
          <div className="h-6 w-20 rounded bg-surface-subtle" />
          <div className="h-3 w-24 rounded bg-surface-subtle" />
        </div>
      </div>
    </Card>
  )
}

function SolarEmpty() {
  return (
    <Card className="p-10 text-center">
      <Sun size={24} className="mx-auto mb-3 text-ink-muted" aria-hidden="true" />
      <h2 className="text-base font-semibold text-ink mb-1">No solar data</h2>
      <p className="text-sm text-ink-secondary">There&apos;s no solar data to show right now.</p>
    </Card>
  )
}

function SolarError({ message }: { message: string }) {
  return (
    <Card className="p-10 text-center">
      <div className="w-12 h-12 bg-danger-bg rounded-xl flex items-center justify-center mx-auto mb-4">
        <Sun size={22} className="text-danger" aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold text-ink mb-1">Couldn&apos;t load data</h2>
      <p className="text-sm text-ink-secondary mb-5">{message}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex items-center justify-center h-9 px-4 rounded-lg border border-line-strong text-sm font-medium text-ink hover:bg-canvas transition-colors"
      >
        Try again
      </button>
    </Card>
  )
}
