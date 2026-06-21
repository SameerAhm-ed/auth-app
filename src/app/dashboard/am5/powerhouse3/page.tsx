// /dashboard/am5/powerhouse3/page.tsx
'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useLiveData } from '@/components/metrics/useLiveData'
import { MetricCard } from '@/components/metrics/MetricCard'
import { MetricGridSkeleton, StateCard } from '@/components/metrics/MetricStates'
import { loadStatus, FUEL, type Fuel } from '@/components/metrics/status'

type Row = Record<string, number>

interface GenCfg {
  key: string
  label: string
  capacity: number
  fuel?: Fuel
  metrics?: (row: Row) => { label: string; value: React.ReactNode }[]
}

const ENGINES: GenCfg[] = [
  { key: 'KE_KW', label: 'KE', capacity: 3700, metrics: (r) => [{ label: 'Voltage', value: `${Math.round(r.KE_VOLT ?? 0)} V` }] },
  { key: 'AM5_KW', label: 'AM5', capacity: 10000 },
  { key: 'CAT_KW', label: 'CAT', capacity: 1475, fuel: FUEL.RLNG },
  { key: 'MAN_KW', label: 'MAN', capacity: 1890, fuel: FUEL.HFO },
  { key: 'MAK1_KW', label: 'MAK-1', capacity: 2450, fuel: FUEL.HFO },
  { key: 'MAK2_KW', label: 'MAK-2', capacity: 2450, fuel: FUEL.HFO },
]

// "Towards PH2" has no capacity → renders without a gauge.
const TAKEOFFS: { key: string; label: string; capacity?: number }[] = [
  { key: 'Takeoff1kw', label: 'AM-18', capacity: 2250 },
  { key: 'Takeoff2kw', label: 'Towards PH2' },
  { key: 'Takeoff3kw', label: 'Auxiliary', capacity: 1250 },
  { key: 'Takeoff4kw', label: 'AM-17A', capacity: 5500 },
]

export default function PowerHouse3Page() {
  const { data, loading, error } = useLiveData<Row>('/api/v1/am5/powerhouse3')
  const row = data[0]

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/am5" className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink transition-colors mb-2">
          <ChevronLeft size={15} />
          AM5 overview
        </Link>
        <h1 className="text-2xl font-semibold text-ink mb-1">Power House 3</h1>
        <p className="text-sm text-ink-secondary">Per-source load and operational status.</p>
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
                const value = row[e.key] ?? 0
                return (
                  <MetricCard
                    key={e.key}
                    label={e.label}
                    value={value}
                    capacity={e.capacity}
                    status={loadStatus(value)}
                    fuel={e.fuel}
                    metrics={e.metrics?.(row)}
                  />
                )
              })}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Utilization</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TAKEOFFS.map((t) => {
                const value = row[t.key] ?? 0
                return <MetricCard key={t.key} label={t.label} value={value} capacity={t.capacity} status={loadStatus(value)} />
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
