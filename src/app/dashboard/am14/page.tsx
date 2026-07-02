'use client'

import Link from 'next/link'
import { Zap, ArrowRight, BarChart3 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Donut } from '@/components/metrics/Donut'
import { useLiveData } from '@/components/metrics/useLiveData'

interface AM14Powerhouse {
  id: number
  KE_OLD_KW: number
  KE_NEW_KW: number
  GENSET_KW: number
  AM2_A_KW: number
  AM2_B_KW: number
}

// Power sources, with a palette tuned to stay legible in light AND dark themes.
const SERIES: { key: keyof AM14Powerhouse; label: string; color: string }[] = [
  { key: 'KE_OLD_KW', label: 'OLD KE', color: '#5b82c9' },
  { key: 'KE_NEW_KW', label: 'NEW KE', color: '#c06c9e' },
  { key: 'GENSET_KW', label: 'GENSET', color: '#cda13f' },
  { key: 'AM2_A_KW', label: 'AM2 A', color: '#4faaa3' },
  { key: 'AM2_B_KW', label: 'AM2 B', color: '#9a9ac6' },
]

const fmtMW = (kw: number) => (kw / 1000).toFixed(2)

export default function AM14DashboardPage() {
  const { data, loading, error } = useLiveData<AM14Powerhouse>('/api/v1/am14/powerhouse', 1000, 'Failed to load dashboard')

  // Aggregate each series across all rows (handles 1+ snapshot rows).
  const totals = SERIES.map((s) => ({
    ...s,
    value: data.reduce((acc, row) => acc + (row[s.key] ?? 0), 0),
  }))
  const totalKW = totals.reduce((acc, t) => acc + t.value, 0)

  return (
    <div className="space-y-6">
      {/* Page header — consistent with the other site pages */}
      <div>
        <h1 className="text-2xl font-semibold text-ink mb-1">AM14 Power Generation</h1>
        <p className="text-sm text-ink-secondary">Real-time electrical power generation by source.</p>
      </div>

      <div className="max-w-md">
        {loading ? (
          <GenerationCardSkeleton />
        ) : error && data.length === 0 ? (
          <GenerationCardError message={error} />
        ) : data.length === 0 ? (
          <GenerationCardEmpty />
        ) : (
          <Card className="overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 p-4 border-b border-line">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-ink-muted" aria-hidden="true" />
                <h2 className="text-base font-semibold text-ink">Power Generation</h2>
              </div>
              <div className="flex items-center gap-2">
                {error ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-danger">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                    Reconnecting…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-ink-secondary">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                    Live
                  </span>
                )}
                {/* TODO: wire to historical report (e.g. /dashboard/am14/powerhouse/summary) */}
                <button
                  type="button"
                  aria-label="View historical report"
                  className="w-11 h-11 md:w-8 md:h-8 -mr-1 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
                >
                  <BarChart3 size={16} />
                </button>
              </div>
            </div>

            {/* Donut */}
            <div className="p-5">
              <Donut
                segments={totals.map((t) => ({ value: t.value, color: t.color }))}
                hero={(totalKW / 1000).toFixed(1)}
                sublabel="MW total"
              />
            </div>

            {/* Legend */}
            <div className="px-4 pb-4">
              <div className="divide-y divide-line">
                {totals.map((t) => (
                  <div key={t.key} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-2.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                    <span className="text-sm text-ink-secondary">{t.label}</span>
                    <span className="text-sm font-medium text-ink tabular-nums">{fmtMW(t.value)} MW</span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="mt-3 flex items-center justify-between rounded-lg bg-brand text-brand-fg px-3 py-2.5">
                <span className="text-sm font-medium">Total Power Generation</span>
                <span className="text-sm font-semibold tabular-nums">{fmtMW(totalKW)} MW</span>
              </div>

              {/* Single, clear details affordance */}
              <Link
                href="/dashboard/am14/powerhouse"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-ink-secondary hover:text-ink transition-colors"
              >
                View details
                <ArrowRight size={14} />
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

/* ── States ──────────────────────────────────────────────────────── */

function GenerationCardSkeleton() {
  return (
    <Card className="p-4 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-5 w-48 rounded bg-surface-subtle" />
        <div className="h-4 w-12 rounded bg-surface-subtle" />
      </div>
      <div className="flex justify-center mb-6">
        <div className="h-[200px] w-[200px] rounded-full border-[40px] border-surface-subtle" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-surface-subtle" />
            <div className="h-4 w-24 rounded bg-surface-subtle" />
            <div className="h-4 w-16 rounded bg-surface-subtle" />
          </div>
        ))}
        <div className="mt-3 h-10 rounded-lg bg-surface-subtle" />
      </div>
    </Card>
  )
}

function GenerationCardEmpty() {
  return (
    <Card className="p-10 text-center">
      <Zap size={24} className="mx-auto mb-3 text-ink-muted" aria-hidden="true" />
      <h2 className="text-base font-semibold text-ink mb-1">No generation data</h2>
      <p className="text-sm text-ink-secondary">There&apos;s no power generation data to show right now.</p>
    </Card>
  )
}

function GenerationCardError({ message }: { message: string }) {
  return (
    <Card className="p-10 text-center">
      <div className="w-12 h-12 bg-danger-bg rounded-xl flex items-center justify-center mx-auto mb-4">
        <Zap size={22} className="text-danger" aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold text-ink mb-1">Couldn&apos;t load data</h2>
      <p className="text-sm text-ink-secondary mb-5">{message}</p>
      {/* The page keeps retrying every second; this button forces an immediate reload. */}
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
