// /dashboard/am17/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap, Flame, ChevronRight, BarChart3 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Donut } from '@/components/metrics/Donut'

interface DashboardRow {
  powerhouse3gen: number
  AM17_PH2: number
  totalsolargen: number
  ke_kw: number
  steamph3: number
  steamph4: number
}

interface ApiResponse {
  dashboard: DashboardRow[]
}

const PALETTE = ['#5b82c9', '#c06c9e', '#cda13f', '#4faaa3', '#9a9ac6', '#e0852b']
const fmtMW = (kw: number) => (kw / 1000).toFixed(2)

export default function AM17DashboardPage() {
  const [resp, setResp] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const refresh = async () => {
      try {
        const r = await fetch('/api/v1/am5/dashboard', {
          method: 'GET',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
        })
        if (!r.ok) throw new Error('Failed to fetch data')
        const j = await r.json()
        if (!cancelled && j?.data) {
          setResp(j.data)
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

  const row = resp?.dashboard?.[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink mb-1">AM17 Overview</h1>
        <p className="text-sm text-ink-secondary">Plant-wide generation and steam at a glance.</p>
      </div>

      {loading && !row ? (
        <p className="text-sm text-ink-muted animate-pulse">Loading dashboard…</p>
      ) : error && !row ? (
        <Card className="p-10 text-center max-w-md">
          <h2 className="text-base font-semibold text-ink mb-1">Couldn&apos;t load data</h2>
          <p className="text-sm text-ink-secondary mb-5">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center h-9 px-4 rounded-lg border border-line-strong text-sm font-medium text-ink hover:bg-canvas transition-colors"
          >
            Try again
          </button>
        </Card>
      ) : !row ? (
        <Card className="p-10 text-center max-w-md">
          <h2 className="text-base font-semibold text-ink mb-1">No data</h2>
          <p className="text-sm text-ink-secondary">There&apos;s no dashboard data to show right now.</p>
        </Card>
      ) : (
        <Content row={row} reconnecting={!!error} />
      )}
    </div>
  )
}

function Content({ row, reconnecting }: { row: DashboardRow; reconnecting: boolean }) {
  const elec = [
    { label: 'Power House 1', value: row.powerhouse3gen, href: '/dashboard/am17/powerhouse3' },
    { label: 'Power House 2', value: row.AM17_PH2, href: '/dashboard/am17/powerhouse4' },
    { label: 'Solar', value: row.totalsolargen, href: '/dashboard/am17/solar' },
    { label: 'KE', value: row.ke_kw, href: '/dashboard/am17/powerhouse3' },
  ].map((s, i) => ({ ...s, color: PALETTE[i] }))
  const elecTotal = elec.reduce((a, s) => a + s.value, 0)

  const steam = [
    { label: 'Steam Power House 3', value: row.steamph3, href: '/dashboard/am5/steamph3' },
    { label: 'Steam Power House 4', value: row.steamph4, href: '/dashboard/am5/steamph4' },
  ].map((s, i) => ({ ...s, color: PALETTE[i] }))
  const steamTotal = steam.reduce((a, s) => a + s.value, 0)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {reconnecting && (
        <div className="lg:col-span-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-danger">
            <span className="w-1.5 h-1.5 rounded-full bg-danger" />
            Reconnecting…
          </span>
        </div>
      )}

      {/* Electrical generation */}
      <Card className="overflow-hidden">
        <CardHead icon={<Zap size={16} className="text-ink-muted" aria-hidden="true" />} title="Electrical Power Generation" />
        <div className="p-5">
          <Donut segments={elec} hero={(elecTotal / 1000).toFixed(1)} sublabel="MW total" />
        </div>
        <div className="px-4 pb-4">
          <div className="divide-y divide-line">
            {elec.map((s) => (
              <LegendRow key={s.label} {...s} value={`${fmtMW(s.value)} MW`} />
            ))}
          </div>
          <TotalBar label="Total Power Generation" value={`${(elecTotal / 1000).toFixed(1)} MW`} />
        </div>
      </Card>

      {/* Steam generation */}
      <Card className="overflow-hidden">
        <CardHead
          icon={<Flame size={16} className="text-ink-muted" aria-hidden="true" />}
          title="Steam Generation"
          action={
            <Link
              href="/dashboard/am5/reports/steam"
              aria-label="Open steam generation report"
              className="w-11 h-11 md:w-9 md:h-9 -mr-1 shrink-0 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
            >
              <BarChart3 size={16} />
            </Link>
          }
        />
        <div className="px-4 pb-4">
          <div className="divide-y divide-line">
            {steam.map((s) => (
              <LegendRow key={s.label} {...s} value={`${s.value.toFixed(1)} T/H`} />
            ))}
          </div>
          <TotalBar label="Total Steam Generation" value={`${steamTotal.toFixed(1)} T/H`} />
        </div>
      </Card>
    </div>
  )
}

/* ── small building blocks ───────────────────────────────────────── */

function CardHead({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 p-4 border-b border-line">
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <h2 className="text-base font-semibold text-ink truncate">{title}</h2>
      </div>
      {action}
    </div>
  )
}

function LegendRow({ color, label, value, href }: { color: string; label: string; value: string; href: string }) {
  return (
    <Link href={href} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 py-2 group">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-sm text-ink-secondary group-hover:text-ink transition-colors">{label}</span>
      <span className="text-sm font-medium text-ink tabular-nums">{value}</span>
      <ChevronRight size={14} className="text-ink-muted" />
    </Link>
  )
}

function TotalBar({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3 flex items-center justify-between rounded-lg bg-brand text-brand-fg px-3 py-2.5">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  )
}