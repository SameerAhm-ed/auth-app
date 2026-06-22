// /dashboard/am14/powerhouse/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, BarChart3 } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface AM14Powerhouse {
  id: number
  KE_OLD_KW: number
  KE_OLD_ERROR: number
  KE_NEW_KW: number
  KE_NEW_ERROR: number
  GENSET_KW: number
  GENSET_ERROR: number
  AM2_A_KW: number
  AM2_A_ERROR: number
  AM2_B_KW: number
  AM2_B_ERROR: number
}

// One entry per engine — single source of truth (kills the 5× copy-paste +
// the duplicated capacity numbers).
const ENGINES: {
  id: string
  label: string
  capacity: number
  kw: keyof AM14Powerhouse
  err: keyof AM14Powerhouse
}[] = [
  { id: 'KE_OLD', label: 'KE OLD', capacity: 450, kw: 'KE_OLD_KW', err: 'KE_OLD_ERROR' },
  { id: 'KE_NEW', label: 'KE NEW', capacity: 450, kw: 'KE_NEW_KW', err: 'KE_NEW_ERROR' },
  { id: 'GENSET', label: 'GENSET', capacity: 500, kw: 'GENSET_KW', err: 'GENSET_ERROR' },
  { id: 'AM2_A', label: 'AM2 A', capacity: 600, kw: 'AM2_A_KW', err: 'AM2_A_ERROR' },
  { id: 'AM2_B', label: 'AM2 B', capacity: 360, kw: 'AM2_B_KW', err: 'AM2_B_ERROR' },
]

// Status colors are dark-mode safe: danger/muted read from tokens, "running"
// uses a green that stays legible on both themes.
function statusOf(error: number, load: number): { text: string; color: string } {
  if (error > 0) return { text: 'FAULT', color: 'var(--color-danger)' }
  if (load === 0) return { text: 'OFF', color: 'var(--color-ink-muted)' }
  return { text: 'RUNNING', color: '#22a06b' }
}

async function getData() {
  const res = await fetch('/api/v1/am14/powerhouse', {
    method: 'GET',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error('Failed to fetch data')
  return res.json()
}

export default function PowerhouseAM14Page() {
  const [data, setData] = useState<AM14Powerhouse[]>([])
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
        if (!cancelled) setError('Failed to load powerhouse data')
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
      {/* Header */}
      <div>
        <Link
          href="/dashboard/am14"
          className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink transition-colors mb-2"
        >
          <ChevronLeft size={15} />
          AM14 overview
        </Link>
        <h1 className="text-2xl font-semibold text-ink mb-1">AM14 Powerhouse</h1>
        <p className="text-sm text-ink-secondary">Per-engine load and operational status.</p>
      </div>

      {loading ? (
        <EngineGridSkeleton />
      ) : error && !row ? (
        <PowerhouseError message={error} />
      ) : !row ? (
        <PowerhouseEmpty />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ENGINES.map((e) => (
            <EngineCard
              key={e.id}
              id={e.id}
              label={e.label}
              capacity={e.capacity}
              load={row[e.kw] ?? 0}
              error={row[e.err] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Engine card (gauge + load + status) ─────────────────────────── */

const R = 54
const SW = 12 // ~80% cutout
const C = 2 * Math.PI * R

function EngineCard({
  id,
  label,
  capacity,
  load,
  error,
}: {
  id: string
  label: string
  capacity: number
  load: number
  error: number
}) {
  const pct = capacity > 0 ? Math.min(Math.max((load / capacity) * 100, 0), 100) : 0
  const status = statusOf(error, load)
  const dash = (pct / 100) * C

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-semibold text-ink">{label}</h2>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: status.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
            {status.text}
          </span>
          {/* Historical report for this engine */}
          <Link
            href={`/dashboard/am14/powerhouse/${id}`}
            aria-label={`View historical report for ${label}`}
            className="w-11 h-11 md:w-8 md:h-8 -mr-1 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
          >
            <BarChart3 size={16} />
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Gauge */}
        <div className="relative w-24 h-24 shrink-0">
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full -rotate-90"
            role="img"
            aria-label={`${label}: ${Math.round(pct)}% of capacity, status ${status.text}`}
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

        {/* Stats */}
        <div className="min-w-0">
          <p className="text-2xl font-bold text-ink tabular-nums leading-none">
            {load.toLocaleString()}
            <span className="ml-1 text-sm font-medium text-ink-secondary">kW</span>
          </p>
          <p className="mt-1.5 text-xs text-ink-muted">of {capacity.toLocaleString()} kW capacity</p>
        </div>
      </div>
    </Card>
  )
}

/* ── States ──────────────────────────────────────────────────────── */

function EngineGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-4 animate-pulse">
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
      ))}
    </div>
  )
}

function PowerhouseEmpty() {
  return (
    <Card className="p-10 text-center">
      <h2 className="text-base font-semibold text-ink mb-1">No engine data</h2>
      <p className="text-sm text-ink-secondary">There&apos;s no powerhouse data to show right now.</p>
    </Card>
  )
}

function PowerhouseError({ message }: { message: string }) {
  return (
    <Card className="p-10 text-center">
      <div className="w-12 h-12 bg-danger-bg rounded-xl flex items-center justify-center mx-auto mb-4">
        <ChevronLeft size={22} className="text-danger rotate-180" aria-hidden="true" />
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
