// /dashboard/am4/powerhouse/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, BarChart3 } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface AM04Powerhouse {
  id: number
  ENGINE_1_KW: number
  ENGINE_1_ERROR: number
  ENGINE_2_KW: number
  ENGINE_2_ERROR: number
  ENGINE_3_KW: number
  ENGINE_3_ERROR: number
  ENGINE_4_KW: number
  ENGINE_4_ERROR: number
  ENGINE_6_KW: number
  ENGINE_6_ERROR: number
  ENGINE_7_KW: number
  ENGINE_7_ERROR: number
  AM04_DISTRIBUTION: number
}

type EngineCfg = {
  id: string
  label: string
  capacity: number
  kw: keyof AM04Powerhouse
  err?: keyof AM04Powerhouse
}

const ENGINES: EngineCfg[] = [
  { id: 'E1', label: 'E1 320', capacity: 1064, kw: 'ENGINE_1_KW', err: 'ENGINE_1_ERROR' },
  { id: 'E2', label: 'E2 420', capacity: 1495, kw: 'ENGINE_2_KW', err: 'ENGINE_2_ERROR' },
  { id: 'E3', label: 'E3 420', capacity: 1415, kw: 'ENGINE_3_KW', err: 'ENGINE_3_ERROR' },
  { id: 'E4', label: 'E4 420', capacity: 1490, kw: 'ENGINE_4_KW', err: 'ENGINE_4_ERROR' },
  { id: 'E6', label: 'E6 3412', capacity: 520, kw: 'ENGINE_6_KW', err: 'ENGINE_6_ERROR' },
  { id: 'E7', label: 'E7 C18', capacity: 648, kw: 'ENGINE_7_KW', err: 'ENGINE_7_ERROR' },
]

const UTILIZATION: EngineCfg[] = [
  { id: 'AM04_DIS', label: 'AM04 Distribution', capacity: 1600, kw: 'AM04_DISTRIBUTION' },
]

function statusOf(error: number, load: number): { text: string; color: string } {
  if (error > 0) return { text: 'FAULT', color: 'var(--color-danger)' }
  if (load === 0) return { text: 'OFF', color: 'var(--color-ink-muted)' }
  return { text: 'RUNNING', color: '#22a06b' }
}

async function getData() {
  const res = await fetch('/api/v1/am4/powerhouse', {
    method: 'GET',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error('Failed to fetch data')
  return res.json()
}

export default function PowerhouseAM4Page() {
  const [data, setData] = useState<AM04Powerhouse[]>([])
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
      <div>
        <Link href="/dashboard/am4" className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink transition-colors mb-2">
          <ChevronLeft size={15} />
          AM4 overview
        </Link>
        <h1 className="text-2xl font-semibold text-ink mb-1">AM4 Powerhouse</h1>
        <p className="text-sm text-ink-secondary">Per-engine load and operational status.</p>
      </div>

      {loading ? (
        <EngineGridSkeleton count={6} />
      ) : error && !row ? (
        <PowerhouseError message={error} />
      ) : !row ? (
        <PowerhouseEmpty />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Generation</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ENGINES.map((e) => (
                <EngineCard key={e.id} cfg={e} load={row[e.kw] ?? 0} error={e.err ? (row[e.err] ?? 0) : 0} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Utilization</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {UTILIZATION.map((e) => (
                <EngineCard key={e.id} cfg={e} load={row[e.kw] ?? 0} error={e.err ? (row[e.err] ?? 0) : 0} />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

/* ── Engine card ─────────────────────────────────────────────────── */

const R = 54
const SW = 12
const C = 2 * Math.PI * R

function EngineCard({ cfg, load, error }: { cfg: EngineCfg; load: number; error: number }) {
  const pct = cfg.capacity > 0 ? Math.min(Math.max((load / cfg.capacity) * 100, 0), 100) : 0
  const status = statusOf(error, load)
  const dash = (pct / 100) * C

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-ink">{cfg.label}</h3>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: status.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
            {status.text}
          </span>
          <Link
            href={`/dashboard/am4/powerhouse/${cfg.id}`}
            aria-label={`View historical report for ${cfg.label}`}
            className="w-8 h-8 -mr-1 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
          >
            <BarChart3 size={16} />
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" role="img" aria-label={`${cfg.label}: ${Math.round(pct)}% of capacity, status ${status.text}`}>
            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-surface-subtle)" strokeWidth={SW} />
            <circle cx="60" cy="60" r={R} fill="none" stroke={status.color} strokeWidth={SW} strokeLinecap="round" strokeDasharray={`${dash} ${C - dash}`} />
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
          <p className="mt-1.5 text-xs text-ink-muted">of {cfg.capacity.toLocaleString()} kW capacity</p>
        </div>
      </div>
    </Card>
  )
}

/* ── States ──────────────────────────────────────────────────────── */

function EngineGridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
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
