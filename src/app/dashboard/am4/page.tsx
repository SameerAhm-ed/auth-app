'use client'

import Link from 'next/link'
import { Zap, Flame, BarChart3, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Donut } from '@/components/metrics/Donut'
import { useLiveData } from '@/components/metrics/useLiveData'

interface AM04Powerhouse {
  id: number
  ENGINE_1_KW: number
  ENGINE_2_KW: number
  ENGINE_3_KW: number
  ENGINE_4_KW: number
  ENGINE_6_KW: number
  ENGINE_7_KW: number
  KE_1_KW: number
  KE_2_KW: number
  KE_3_KW: number
  SOLAR_A_KW: number
  SOLAR_B_KW: number
  SOLAR_C_KW: number
  BIOMASS_STEAM_FLOW: number
  GB_BOSCH_STEAM: number
  GB_ROBEY_STEAM: number
}

const ENGINE_FIELDS: (keyof AM04Powerhouse)[] = [
  'ENGINE_1_KW', 'ENGINE_2_KW', 'ENGINE_3_KW', 'ENGINE_4_KW', 'ENGINE_6_KW', 'ENGINE_7_KW',
]
const KE_FIELDS: (keyof AM04Powerhouse)[] = ['KE_1_KW', 'KE_2_KW', 'KE_3_KW']
const SOLAR_FIELDS: (keyof AM04Powerhouse)[] = ['SOLAR_A_KW', 'SOLAR_B_KW', 'SOLAR_C_KW']

const STEAM_COLORS = ['#5b82c9', '#c06c9e', '#e0a83e']

const fmtMW = (kw: number) => (kw / 1000).toFixed(2)
const sum = (row: AM04Powerhouse, fields: (keyof AM04Powerhouse)[]) =>
  fields.reduce((acc, f) => acc + ((row[f] as number) ?? 0), 0)

export default function AM4DashboardPage() {
  const { data, loading, error } = useLiveData<AM04Powerhouse>('/api/v1/am4/powerhouse', 1000, 'Failed to load dashboard')
  const row = data[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink mb-1">AM4 Power Generation</h1>
        <p className="text-sm text-ink-secondary">Real-time generation mix and steam output.</p>
      </div>

      {loading ? (
        <OverviewSkeleton />
      ) : error && !row ? (
        <OverviewError message={error} />
      ) : !row ? (
        <OverviewEmpty />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
          <GenerationCard row={row} error={error} />
          <SteamCard row={row} error={error} />
        </div>
      )}
    </div>
  )
}

/* ── Generation card (Powerhouse / KE / Solar donut) ─────────────── */

function GenerationCard({ row, error }: { row: AM04Powerhouse; error: string }) {
  const series = [
    { label: 'Powerhouse', value: sum(row, ENGINE_FIELDS), color: '#5b82c9', href: '/dashboard/am4/powerhouse' },
    { label: 'K.E', value: sum(row, KE_FIELDS), color: '#c06c9e', href: '/dashboard/am4/ke' },
    { label: 'Solar', value: sum(row, SOLAR_FIELDS), color: '#e0a83e', href: '/dashboard/am4/solar' },
  ]
  const totalKW = series.reduce((acc, s) => acc + s.value, 0)

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-4 border-b border-line">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-ink-muted" aria-hidden="true" />
          <h2 className="text-base font-semibold text-ink">Power Generation</h2>
        </div>
        <div className="flex items-center gap-2">
          <LiveBadge error={error} />
          {/* TODO: wire to historical report later */}
          <button
            type="button"
            aria-label="View historical report"
            className="w-11 h-11 md:w-8 md:h-8 -mr-1 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
          >
            <BarChart3 size={16} />
          </button>
        </div>
      </div>

      <div className="p-5">
        <Donut
          segments={series.map((s) => ({ value: s.value, color: s.color }))}
          hero={(totalKW / 1000).toFixed(1)}
          sublabel="MW total"
        />
      </div>

      <div className="px-4 pb-4">
        <div className="divide-y divide-line">
          {series.map((s) => (
            <Link key={s.label} href={s.href} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 py-2.5 group">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-sm text-ink-secondary group-hover:text-ink transition-colors">{s.label}</span>
              <span className="text-sm font-medium text-ink tabular-nums">{fmtMW(s.value)} MW</span>
              <ChevronRight size={14} className="text-ink-muted" />
            </Link>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-lg bg-brand text-brand-fg px-3 py-2.5">
          <span className="text-sm font-medium">Total Power Generation</span>
          <span className="text-sm font-semibold tabular-nums">{fmtMW(totalKW)} MW</span>
        </div>
      </div>
    </Card>
  )
}

/* ── Steam card (biomass flow gauge) ─────────────────────────────── */

function SteamCard({ row, error }: { row: AM04Powerhouse; error: string }) {
  const series = [
    { label: 'Biomass', value: row.BIOMASS_STEAM_FLOW ?? 0 },
    { label: 'GB Bosch', value: row.GB_BOSCH_STEAM ?? 0 },
    { label: 'GB Robey', value: row.GB_ROBEY_STEAM ?? 0 },
  ].map((s, i) => ({ ...s, color: STEAM_COLORS[i] }))
  const total = series.reduce((acc, s) => acc + s.value, 0)

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-4 border-b border-line">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-ink-muted" aria-hidden="true" />
          <h2 className="text-base font-semibold text-ink">Steam Generation</h2>
        </div>
        <div className="flex items-center gap-2">
          <LiveBadge error={error} />
          <button
            type="button"
            aria-label="View historical report"
            className="w-11 h-11 md:w-8 md:h-8 -mr-1 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
          >
            <BarChart3 size={16} />
          </button>
        </div>
      </div>

      <div className="p-5">
        <Donut
          segments={series.map((s) => ({ value: s.value, color: s.color }))}
          hero={total.toFixed(1)}
          sublabel="T/H total"
        />
      </div>

      <div className="px-4 pb-4">
        <div className="divide-y divide-line">
          {series.map((s) => (
            <Link key={s.label} href="/dashboard/am4/steam" className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 py-2.5 group">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-sm text-ink-secondary group-hover:text-ink transition-colors">{s.label}</span>
              <span className="text-sm font-medium text-ink tabular-nums">{s.value.toFixed(1)} T/H</span>
              <ChevronRight size={14} className="text-ink-muted" />
            </Link>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-lg bg-brand text-brand-fg px-3 py-2.5">
          <span className="text-sm font-medium">Total Steam Generation</span>
          <span className="text-sm font-semibold tabular-nums">{total.toFixed(1)} T/H</span>
        </div>
      </div>
    </Card>
  )
}

function LiveBadge({ error }: { error: string }) {
  if (error) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-danger">
        <span className="w-1.5 h-1.5 rounded-full bg-danger" />
        Reconnecting…
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-secondary">
      <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
      Live
    </span>
  )
}

/* ── States ──────────────────────────────────────────────────────── */

function OverviewSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i} className="p-4 animate-pulse">
          <div className="h-5 w-40 rounded bg-surface-subtle mb-6" />
          <div className="flex justify-center mb-6">
            <div className="h-[200px] w-[200px] rounded-full border-[40px] border-surface-subtle" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-surface-subtle" />
            <div className="h-10 rounded-lg bg-surface-subtle" />
          </div>
        </Card>
      ))}
    </div>
  )
}

function OverviewEmpty() {
  return (
    <Card className="p-10 text-center max-w-md">
      <h2 className="text-base font-semibold text-ink mb-1">No generation data</h2>
      <p className="text-sm text-ink-secondary">There&apos;s no data to show right now.</p>
    </Card>
  )
}

function OverviewError({ message }: { message: string }) {
  return (
    <Card className="p-10 text-center max-w-md">
      <div className="w-12 h-12 bg-danger-bg rounded-xl flex items-center justify-center mx-auto mb-4">
        <Zap size={22} className="text-danger" aria-hidden="true" />
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
