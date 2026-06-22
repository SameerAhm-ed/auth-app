// /dashboard/am5/powerhouse4/page.tsx
'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useLiveData } from '@/components/metrics/useLiveData'
import { MetricCard } from '@/components/metrics/MetricCard'
import { MetricGridSkeleton, StateCard } from '@/components/metrics/MetricStates'
import { loadStatus, FUEL } from '@/components/metrics/status'
import { reportHref } from '@/components/metrics/reportLink'

type Row = Record<string, number>

// `tag` = EMS tag id for the historical report (omit → no report icon yet).
type EngineCfg = { key: string; label: string; capacity: number; tag?: number }
type TakeoffCfg = { key: string; label: string; capacity?: number; tag?: number }

const ENGINES: EngineCfg[] = [
  { key: 'ENGINE1_KW', label: 'Engine 1', capacity: 1500 },
  { key: 'ENGINE2_KW', label: 'Engine 2', capacity: 1500 },
  { key: 'ENGINE3_KW', label: 'Engine 3', capacity: 1500 },
]

const TAKEOFFS: TakeoffCfg[] = [
  { key: 'AM17_B_kw', label: 'AM-17 B', capacity: 5500 },
  { key: 'TOWARDS_PH1_kw', label: 'Towards PH1' },
  { key: 'AUXILIARY_kw', label: 'Auxiliary', capacity: 1250 },
]

const BACK = { back: '/dashboard/am5/powerhouse4', backLabel: 'Power House 4' }

export default function PowerHouse4Page() {
  const { data, loading, error } = useLiveData<Row>('/api/v1/am5/powerhouse4')
  const row = data[0]

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/am5" className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink transition-colors mb-2">
          <ChevronLeft size={15} />
          AM5 overview
        </Link>
        <h1 className="text-2xl font-semibold text-ink mb-1">Power House 4</h1>
        <p className="text-sm text-ink-secondary">Per-engine load and operational status.</p>
      </div>

      {loading ? (
        <MetricGridSkeleton count={3} />
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
                return <MetricCard key={e.key} label={e.label} value={value} capacity={e.capacity} status={loadStatus(value)} fuel={FUEL.RLNG} reportHref={reportHref({ tag: e.tag, label: e.label, unit: 'kWh', ...BACK })} />
              })}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Utilization</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TAKEOFFS.map((t) => {
                const value = row[t.key] ?? 0
                return <MetricCard key={t.key} label={t.label} value={value} capacity={t.capacity} status={loadStatus(value)} reportHref={reportHref({ tag: t.tag, label: t.label, unit: 'kWh', ...BACK })} />
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
