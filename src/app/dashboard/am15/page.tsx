'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap, Gauge, BarChart3, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface AM15Powerhouse {
  id: number
  KE_KW: number
  JGS_420_KW: number
  JGS_312_KW: number
  GAS_1_5_KW: number
  CAT_DIESEL_KW: number
  KT_50_KW: number
  LT_1_KW: number
  LT_2_KW: number
  LT_3_KW: number
  SOLAR_TW_KW: number
  PRESSURE_IND_PSI: number
  PRESSURE_CAP_PSI: number
}

// Generation engines only — load take-offs (LT_*) are consumption, not generation.
const POWERHOUSE_FIELDS: (keyof AM15Powerhouse)[] = [
  'KE_KW', 'JGS_420_KW', 'JGS_312_KW', 'GAS_1_5_KW', 'CAT_DIESEL_KW', 'KT_50_KW',
]

const POWER_COLOR = '#5b82c9'
const SOLAR_COLOR = '#e0a83e'

const fmtMW = (kw: number) => (kw / 1000).toFixed(2)

// ── SVG donut geometry ──
const RADIUS = 80
const STROKE = 40
const CIRC = 2 * Math.PI * RADIUS
const GAP = 10

async function getData() {
  const res = await fetch('/api/v1/am15/powerhouse', {
    method: 'GET',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error('Failed to fetch data')
  return res.json()
}

export default function AM15DashboardPage() {
  const [data, setData] = useState<AM15Powerhouse[]>([])
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
        if (!cancelled) setError('Failed to load dashboard')
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
        <h1 className="text-2xl font-semibold text-ink mb-1">AM15 Power Generation</h1>
        <p className="text-sm text-ink-secondary">Real-time generation mix and gas pressures.</p>
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
          <GasPressuresCard row={row} />
        </div>
      )}
    </div>
  )
}

/* ── Generation card (Powerhouse vs Solar donut) ─────────────────── */

function GenerationCard({ row, error }: { row: AM15Powerhouse; error: string }) {
  const powerhouseKW = POWERHOUSE_FIELDS.reduce((acc, f) => acc + (row[f] ?? 0), 0)
  const solarKW = row.SOLAR_TW_KW ?? 0
  const totalKW = powerhouseKW + solarKW

  const series = [
    { label: 'Powerhouse AM15', value: powerhouseKW, color: POWER_COLOR, href: '/dashboard/am15/powerhouse' },
    { label: 'Solar TW', value: solarKW, color: SOLAR_COLOR, href: '/dashboard/am15/solar' },
  ]

  const arcFor = (value: number) => (totalKW > 0 ? (value / totalKW) * CIRC : 0)
  const segments = series.map((s, i) => {
    const priorArc = series.slice(0, i).reduce((acc, p) => acc + arcFor(p.value), 0)
    const dash = Math.max(arcFor(s.value) - GAP, 0)
    return { color: s.color, dash, rest: CIRC - dash, offset: -priorArc }
  })

  return (
    <Card className="overflow-hidden">
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
          {/* TODO: wire to historical report later */}
          <button
            type="button"
            aria-label="View historical report"
            className="w-8 h-8 -mr-1 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
          >
            <BarChart3 size={16} />
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="relative mx-auto w-full max-w-[240px] aspect-square">
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full -rotate-90"
            role="img"
            aria-label={`Powerhouse ${(powerhouseKW / 1000).toFixed(1)} MW, Solar ${(solarKW / 1000).toFixed(1)} MW`}
          >
            <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="var(--color-surface-subtle)" strokeWidth={STROKE} />
            {segments.map((seg, i) => (
              <circle
                key={i}
                cx="100"
                cy="100"
                r={RADIUS}
                fill="none"
                stroke={seg.color}
                strokeWidth={STROKE}
                strokeDasharray={`${seg.dash} ${seg.rest}`}
                strokeDashoffset={seg.offset}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-ink tabular-nums leading-none">
              {(powerhouseKW / 1000).toFixed(1)}
            </span>
            <span className="mt-1 text-xs font-medium text-ink-secondary">MW · powerhouse</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="divide-y divide-line">
          {series.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 py-2.5 group"
            >
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

/* ── Gas pressures card ──────────────────────────────────────────── */

function GasPressuresCard({ row }: { row: AM15Powerhouse }) {
  const rows = [
    { label: 'Capacitive', value: row.PRESSURE_CAP_PSI ?? 0 },
    { label: 'Industrial', value: row.PRESSURE_IND_PSI ?? 0 },
  ]
  return (
    <Card className="overflow-hidden h-fit">
      <div className="flex items-center gap-2 p-4 border-b border-line">
        <Gauge size={16} className="text-ink-muted" aria-hidden="true" />
        <h2 className="text-base font-semibold text-ink">Gas Pressures</h2>
      </div>
      <div className="px-4 py-2 divide-y divide-line">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between py-3">
            <span className="text-sm text-ink-secondary">{r.label}</span>
            <span className="text-sm font-medium text-ink tabular-nums">
              {r.value.toLocaleString()} <span className="text-ink-muted font-normal">PSI</span>
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

/* ── States ──────────────────────────────────────────────────────── */

function OverviewSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
      <Card className="p-4 animate-pulse">
        <div className="h-5 w-40 rounded bg-surface-subtle mb-6" />
        <div className="flex justify-center mb-6">
          <div className="h-[200px] w-[200px] rounded-full border-[40px] border-surface-subtle" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-surface-subtle" />
          <div className="h-4 w-full rounded bg-surface-subtle" />
          <div className="h-10 rounded-lg bg-surface-subtle" />
        </div>
      </Card>
      <Card className="p-4 animate-pulse h-fit">
        <div className="h-5 w-32 rounded bg-surface-subtle mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-surface-subtle" />
          <div className="h-4 w-full rounded bg-surface-subtle" />
        </div>
      </Card>
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
