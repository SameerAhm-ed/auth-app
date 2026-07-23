// /dashboard/am5/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap, Flame, Gauge, ChevronRight, BarChart3 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Donut } from '@/components/metrics/Donut'
import { DashboardSkeleton } from '@/components/metrics/MetricStates'

interface DashboardRow {
  powerhouse1gen: number
  powerhouse2gen: number
  powerhouse3gen: number
  AM17_PH2: number
  totalsolargen: number
  ke_kw: number
  steamph1: number
  steamph2: number
  steamph3: number
  steamph4: number
  cb: number
  new_cb: number
  ngas_psi: number
  rlng_psi: number
  fgc: number
  industrialgas_psi: number
  steam_pressure_mainheader_1: number
  steam_pressure_mainheader_2_and_3: number
  steam_pressure_mainheader_4: number
}
interface PH1T { takeoff1kw: number; takeoff2kw: number; takeoff3kw: number }
interface PH2T { Takeoff4kw: number; Takeoff5kw: number; Takeoff6kw: number; Takeoff7kw: number; Takeoff8kw: number; AUX_LV_Takeoff: number }
interface PH3T { Takeoff1kw: number; Takeoff2kw: number; Takeoff3kw: number; Takeoff4kw: number }
interface AM17T { AUXILIARY_kw: number; TOWARDS_PH1_kw: number; AM17_B_kw: number }
interface SolarRow { solar3_kW: number; solar4_kW: number; solar5_kW: number; AM18_solar_kW: number; AM19_solar_kW: number }
interface ApiResponse {
  dashboard: DashboardRow[]
  ph1_takeoffs: PH1T[]
  ph2_takeoffs: PH2T[]
  ph3_takeoffs: PH3T[]
  am17_takeoffs: AM17T[]
  am5_solar: SolarRow[]
}

const PALETTE = ['#5b82c9', '#c06c9e', '#cda13f', '#4faaa3', '#9a9ac6', '#e0852b']
const fmtMW = (kw: number) => (kw / 1000).toFixed(2)

export default function AM5DashboardPage() {
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
  // AM5-only solar, summed here rather than trusting the DB's
  // `solar_total_kW` column (still missing AM19_solar_kW — see the API
  // route). dashboard.totalsolargen is the whole cluster, not used here.
  const sol = resp?.am5_solar?.[0]
  const solarKw = sol
    ? (sol.solar3_kW ?? 0) + (sol.solar4_kW ?? 0) + (sol.solar5_kW ?? 0) + (sol.AM18_solar_kW ?? 0) + (sol.AM19_solar_kW ?? 0)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink mb-1">AM5 Overview</h1>
        <p className="text-sm text-ink-secondary">Plant-wide generation, steam and gas at a glance.</p>
      </div>

      {loading && !row ? (
        <DashboardSkeleton />
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
        <Content row={row} solarKw={solarKw} reconnecting={!!error} />
      )}
    </div>
  )
}

function Content({ row, solarKw, reconnecting }: { row: DashboardRow; solarKw: number; reconnecting: boolean }) {
  const elec = [
    { label: 'Power House 1', value: row.powerhouse1gen, href: '/dashboard/am5/powerhouse1' },
    { label: 'Power House 2', value: row.powerhouse2gen, href: '/dashboard/am5/powerhouse2' },
    { label: 'Solar', value: solarKw, href: '/dashboard/am5/solar' },
  ].map((s, i) => ({ ...s, color: PALETTE[i] }))
  const elecTotal = elec.reduce((a, s) => a + s.value, 0)

  const steam = [
    { label: 'Steam Power House 1', value: row.steamph1, href: '/dashboard/am5/steamph1' },
    { label: 'Steam Power House 2', value: row.steamph2, href: '/dashboard/am5/steamph2' },
    { label: 'Out Source Boiler 1', value: row.cb, href: '/dashboard/am5/coalboiler1' },
    { label: 'Out Source Boiler 2', value: row.new_cb, href: '/dashboard/am5/coalboiler2' },
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
        <CardHead
          icon={<Zap size={16} className="text-ink-muted" aria-hidden="true" />}
          title="Electrical Power Generation"
          action={
            <Link
              href="/dashboard/am5/reports/electrical"
              aria-label="Open electrical generation report"
              className="w-11 h-11 md:w-9 md:h-9 -mr-1 shrink-0 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
            >
              <BarChart3 size={16} />
            </Link>
          }
        />
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
        <div className="p-5">
          <Donut segments={steam} hero={steamTotal.toFixed(1)} sublabel={`T/H · ${row.steam_pressure_mainheader_2_and_3.toFixed(0)} PSI`} />
        </div>
        <div className="px-4 pb-4">
          <div className="divide-y divide-line">
            {steam.map((s) => (
              <LegendRow key={s.label} {...s} value={`${s.value.toFixed(1)} T/H`} />
            ))}
          </div>
          <TotalBar label="Total Steam Generation" value={`${steamTotal.toFixed(1)} T/H`} />
        </div>
      </Card>

      {/* Steam pressures */}
      <StatGridCard
        title="Steam Pressures"
        icon={<Gauge size={16} className="text-ink-muted" aria-hidden="true" />}
        columns={[
          { label: 'Header 1', value: `${row.steam_pressure_mainheader_1.toFixed(0)} PSI` },
          { label: 'Header 2 & 3', value: `${row.steam_pressure_mainheader_2_and_3.toFixed(0)} PSI` },
          { label: 'Header 4', value: `${row.steam_pressure_mainheader_4.toFixed(0)} PSI` },
        ]}
      />

      {/* Gas pressures */}
      <Card className="overflow-hidden">
        <CardHead icon={<Gauge size={16} className="text-ink-muted" aria-hidden="true" />} title="Gas Pressures" />
        <div className="px-4 py-2 divide-y divide-line">
          {[
            { label: 'Captive', psi: row.ngas_psi },
            { label: 'Industrial', psi: row.industrialgas_psi },
          ].map((g) => (
            <div key={g.label} className="flex items-center justify-between py-3 text-sm">
              <span className="text-ink-secondary">{g.label}</span>
              <span className="tabular-nums text-ink font-medium">
                {g.psi} <span className="text-ink-muted font-normal">PSI</span>
              </span>
            </div>
          ))}
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

function StatGridCard({ title, icon, columns }: { title: string; icon: React.ReactNode; columns: { label: string; value: string }[] }) {
  return (
    <Card className="overflow-hidden h-fit">
      <CardHead icon={icon} title={title} />
      <div className="p-4">
        <div
          className="grid gap-1 text-center"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
        >
          {columns.map((c) => (
            <div key={c.label} className="text-[10px] sm:text-xs text-ink-muted uppercase tracking-tight pb-1 border-b border-line">
              {c.label}
            </div>
          ))}
          {columns.map((c) => (
            <div key={c.label} className="text-[11px] sm:text-sm font-semibold text-ink tabular-nums pt-1.5">
              {c.value}
            </div>
          ))}
        </div>
      </div>
    </Card>
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
