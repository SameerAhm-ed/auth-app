// /dashboard/am5/powerhouse2/page.tsx
'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useLiveData } from '@/components/metrics/useLiveData'
import { MetricCard } from '@/components/metrics/MetricCard'
import { MetricGridSkeleton, StateCard } from '@/components/metrics/MetricStates'
import { loadStatus, fuelFromBit } from '@/components/metrics/status'
import { reportHref } from '@/components/metrics/reportLink'

type Row = Record<string, number>

// `tag` = EMS tag id for the historical report (omit → no report icon yet).
type EngineCfg = { key: string; bit: string; label: string; capacity: number; tag?: number }
type TakeoffCfg = { key: string; label: string; capacity?: number; tag?: number }

// Generation: dynamic fuel from the `*bit` field (1=N-GAS, 2=R-LNG, 3=IND).
const ENGINES: EngineCfg[] = [
  { key: 'turbinekw', bit: 'turbinebit', label: 'Turbine', capacity: 5700, tag: 1627 },
  { key: 'engine1kw', bit: 'engine1bit', label: 'Engine 1', capacity: 1400, tag: 286 },
  { key: 'engine2kw', bit: 'engine2bit', label: 'Engine 2', capacity: 1500, tag: 287 },
  { key: 'engine3kw', bit: 'engine3bit', label: 'Engine 3', capacity: 1500, tag: 288 },
  { key: 'engine4kw', bit: 'engine4bit', label: 'Engine 4', capacity: 1500, tag: 289 },
  { key: 'engine5kw', bit: 'engine5bit', label: 'Engine 5', capacity: 1500, tag: 290 },
  { key: 'engine6kw', bit: 'engine6bit', label: 'Engine 6', capacity: 1500, tag: 291 },
]

const TAKEOFFS: TakeoffCfg[] = [
  { key: 'Takeoff4kw', label: 'Weaving Shade 4', capacity: 2500 },
  { key: 'Takeoff5kw', label: 'Weaving Shade 5 & 6', capacity: 2500 },
  { key: 'Takeoff6kw', label: 'Processing Unit', capacity: 2500 },
  { key: 'Takeoff7kw', label: 'Spinning AM-8', capacity: 6000 },
  { key: 'Takeoff8kw', label: 'Spinning AM-17', capacity: 6000 },
  { key: 'AUX_LV_Takeoff', label: 'Auxiliary Load PH-2', capacity: 1565 },
]

const BACK = { back: '/dashboard/am5/powerhouse2', backLabel: 'Power House 2' }

export default function PowerHouse2Page() {
  const { data, loading, error } = useLiveData<Row>('/api/v1/am5/powerhouse2')
  const row = data[0]

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/am5" className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink transition-colors mb-2">
          <ChevronLeft size={15} />
          AM5 overview
        </Link>
        <h1 className="text-2xl font-semibold text-ink mb-1">Power House 2</h1>
        <p className="text-sm text-ink-secondary">Per-engine load, fuel type and status.</p>
      </div>

      {loading ? (
        <MetricGridSkeleton count={6} />
      ) : error && !row ? (
        <StateCard variant="error" title="Couldn't load data" message={error} />
      ) : !row ? (
        <StateCard title="No data" message="There's no power house data to show right now." />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Generation</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ENGINES.map((e) => {
                const value = Math.trunc(row[e.key] ?? 0)
                return (
                  <MetricCard
                    key={e.key}
                    label={e.label}
                    value={value}
                    capacity={e.capacity}
                    status={loadStatus(value, 10)}
                    fuel={fuelFromBit(row[e.bit])}
                    reportHref={reportHref({ tag: e.tag, label: e.label, unit: 'kWh', ...BACK })}
                  />
                )
              })}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Utilization</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TAKEOFFS.map((t) => {
                const value = Math.trunc(row[t.key] ?? 0)
                return <MetricCard key={t.key} label={t.label} value={value} capacity={t.capacity} status={loadStatus(value, 10)} reportHref={reportHref({ tag: t.tag, label: t.label, unit: 'kWh', ...BACK })} />
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
