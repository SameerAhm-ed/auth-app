// /dashboard/am5/powerhouse1/page.tsx
'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useLiveData } from '@/components/metrics/useLiveData'
import { MetricCard } from '@/components/metrics/MetricCard'
import { MetricGridSkeleton, StateCard } from '@/components/metrics/MetricStates'
import { loadStatus, FUEL } from '@/components/metrics/status'

type Row = Record<string, number>

const ENGINES = [
  { key: 'engine1kw', label: 'Engine 1', capacity: 1500, fuel: 'NGAS' },
  { key: 'engine2kw', label: 'Engine 2', capacity: 1500, fuel: 'NGAS' },
  { key: 'engine3kw', label: 'Engine 3', capacity: 1500, fuel: 'NGAS' },
  { key: 'engine4kw', label: 'Engine 4', capacity: 1200, fuel: 'NGAS' },
  { key: 'engine5kw', label: 'Engine 5', capacity: 1200, fuel: 'NGAS' },
  { key: 'engine6kw', label: 'Engine 6', capacity: 1200, fuel: 'DIESEL' },
  { key: 'engine7kw', label: 'Engine 7', capacity: 1000, fuel: 'DIESEL' },
] as const

const TAKEOFFS = [
  { key: 'takeoff1kw', label: 'Load Takeoff 1', capacity: 1850 },
  { key: 'takeoff2kw', label: 'Load Takeoff 2', capacity: 1500 },
  { key: 'takeoff3kw', label: 'Load Takeoff 3', capacity: 1150 },
  { key: 'lv_auxiliarykw', label: 'Auxiliary', capacity: 300 },
] as const

export default function PowerHouse1Page() {
  const { data, loading, error } = useLiveData<Row>('/api/v1/am5/powerhouse1')
  const row = data[0]

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/am5" className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink transition-colors mb-2">
          <ChevronLeft size={15} />
          AM5 overview
        </Link>
        <h1 className="text-2xl font-semibold text-ink mb-1">Power House 1</h1>
        <p className="text-sm text-ink-secondary">Per-engine load and operational status.</p>
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
                    fuel={FUEL[e.fuel]}
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
                return (
                  <MetricCard key={t.key} label={t.label} value={value} capacity={t.capacity} status={loadStatus(value)} />
                )
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
