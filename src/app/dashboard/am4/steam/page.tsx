// /dashboard/am4/steam/page.tsx
'use client'

import Link from 'next/link'
import { ChevronLeft, BarChart3, Flame } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Gauge } from '@/components/metrics/Gauge'
import { MetricGridSkeleton, StateCard } from '@/components/metrics/MetricStates'
import { engineStatus } from '@/components/metrics/status'
import { useLiveData } from '@/components/metrics/useLiveData'

interface AM04Steam {
  id: number
  BIOMASS_STEAM_FLOW: number
  BIOMASS_WATER_FLOW: number
  BIOMASS_STEAM_ERROR: number
  GB_BOSCH_STEAM: number
  GB_BOSCH_ERROR: number
  GB_ROBEY_STEAM: number
  GB_ROBEY_ERROR: number
}

type BoilerCfg = {
  id: string
  label: string
  capacity?: number
  flow?: keyof AM04Steam
  err?: keyof AM04Steam
  water?: keyof AM04Steam
}

// Boilers with `flow` are data-backed; the rest render a "no data" state.
const BOILERS: BoilerCfg[] = [
  { id: 'BIOMASS', label: 'BIOMASS', capacity: 10, flow: 'BIOMASS_STEAM_FLOW', err: 'BIOMASS_STEAM_ERROR', water: 'BIOMASS_WATER_FLOW' },
  { id: 'GB_BOSCH', label: 'GB BOSCH', capacity: 10, flow: 'GB_BOSCH_STEAM', err: 'GB_BOSCH_ERROR' },
  { id: 'GB_ROBEY', label: 'GB ROBEY', capacity: 10, flow: 'GB_ROBEY_STEAM', err: 'GB_ROBEY_ERROR' },
  { id: 'WHRB_GRISHAM', label: 'WHRB GRISHAM' },
  { id: 'WHRB_DDFC', label: 'WHRB DDFC' },
]

export default function AM4SteamPage() {
  const { data, loading, error } = useLiveData<AM04Steam>('/api/v1/am4/powerhouse', 1000, 'Failed to load steam data')
  const row = data[0]

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/am4" className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink transition-colors mb-2">
          <ChevronLeft size={15} />
          AM4 overview
        </Link>
        <h1 className="text-2xl font-semibold text-ink mb-1">AM4 Steam</h1>
        <p className="text-sm text-ink-secondary">Steam distribution flow and boiler status.</p>
      </div>

      {loading ? (
        <MetricGridSkeleton count={5} />
      ) : error && !row ? (
        <StateCard variant="error" title="Couldn't load data" message={error} />
      ) : !row ? (
        <StateCard title="No steam data" message="There's no steam data to show right now." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BOILERS.map((b) =>
            b.flow ? (
              <BoilerCard
                key={b.id}
                cfg={b}
                flow={(row[b.flow] as number) ?? 0}
                error={b.err ? ((row[b.err] as number) ?? 0) : 0}
                water={b.water ? ((row[b.water] as number) ?? 0) : undefined}
              />
            ) : (
              <NoDataCard key={b.id} label={b.label} />
            ),
          )}
        </div>
      )}
    </div>
  )
}

function BoilerCard({ cfg, flow, error, water }: { cfg: BoilerCfg; flow: number; error: number; water?: number }) {
  const capacity = cfg.capacity ?? 0
  const pct = capacity > 0 ? Math.min(Math.max((flow / capacity) * 100, 0), 100) : 0
  const status = engineStatus(error, flow)

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-ink-muted" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-ink">{cfg.label}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: status.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
            {status.text}
          </span>
          <Link
            href={`/dashboard/am4/powerhouse/${cfg.id}`}
            aria-label={`View historical report for ${cfg.label}`}
            className="w-11 h-11 md:w-8 md:h-8 -mr-1 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
          >
            <BarChart3 size={16} />
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Gauge pct={pct} color={status.color} ariaLabel={`${cfg.label}: ${Math.round(pct)}% of capacity, status ${status.text}`} />
        <div className="min-w-0">
          <p className="text-2xl font-bold text-ink tabular-nums leading-none">
            {flow.toLocaleString()}
            <span className="ml-1 text-sm font-medium text-ink-secondary">T/H</span>
          </p>
          <p className="mt-1.5 text-xs text-ink-muted">of {capacity.toLocaleString()} T/H capacity</p>
          {water !== undefined && (
            <p className="mt-1.5 text-xs text-ink-secondary tabular-nums">{water.toLocaleString()} M³/H water</p>
          )}
        </div>
      </div>
    </Card>
  )
}

function NoDataCard({ label }: { label: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Flame size={16} className="text-ink-muted" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-ink">{label}</h3>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-full border-[12px] border-surface-subtle shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-secondary">No data</p>
          <p className="mt-1 text-xs text-ink-muted">Not yet instrumented.</p>
        </div>
      </div>
    </Card>
  )
}
