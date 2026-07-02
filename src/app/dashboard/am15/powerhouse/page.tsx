// /dashboard/am15/powerhouse/page.tsx
'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { MetricCard } from '@/components/metrics/MetricCard'
import { MetricGridSkeleton, StateCard } from '@/components/metrics/MetricStates'
import { engineStatus } from '@/components/metrics/status'
import { useLiveData } from '@/components/metrics/useLiveData'

interface AM15Powerhouse {
  id: number
  KE_KW: number
  KE_ERROR: number
  JGS_420_KW: number
  JGS_420_ERROR: number
  JGS_312_KW: number
  JGS_312_ERROR: number
  GAS_1_5_KW: number
  GAS_1_5_ERROR: number
  CAT_DIESEL_KW: number
  CAT_DIESEL_ERROR: number
  KT_50_KW: number
  KT_50_ERROR: number
  LT_1_KW: number
  LT_1_ERROR: number
  LT_2_KW: number
  LT_2_ERROR: number
  LT_3_KW: number
  LT_3_ERROR: number
}

type EngineCfg = { id: string; label: string; capacity: number; kw: keyof AM15Powerhouse; err: keyof AM15Powerhouse }

const ENGINES: EngineCfg[] = [
  { id: 'KE', label: 'KE', capacity: 4000, kw: 'KE_KW', err: 'KE_ERROR' },
  { id: 'JGS_420', label: 'JGS 420', capacity: 1500, kw: 'JGS_420_KW', err: 'JGS_420_ERROR' },
  { id: 'JGS_312', label: 'JGS 312', capacity: 635, kw: 'JGS_312_KW', err: 'JGS_312_ERROR' },
  { id: 'GAS_1_5', label: 'GAS 1.5', capacity: 1500, kw: 'GAS_1_5_KW', err: 'GAS_1_5_ERROR' },
  { id: 'CAT_DIESEL', label: 'CAT Diesel', capacity: 1250, kw: 'CAT_DIESEL_KW', err: 'CAT_DIESEL_ERROR' },
  { id: 'KT_50', label: 'KT 50', capacity: 1800, kw: 'KT_50_KW', err: 'KT_50_ERROR' },
]

const TAKEOFFS: EngineCfg[] = [
  { id: 'LT_1', label: 'Load Takeoff 1', capacity: 1600, kw: 'LT_1_KW', err: 'LT_1_ERROR' },
  { id: 'LT_2', label: 'Load Takeoff 2', capacity: 1280, kw: 'LT_2_KW', err: 'LT_2_ERROR' },
  { id: 'LT_3', label: 'Load Takeoff 3', capacity: 1600, kw: 'LT_3_KW', err: 'LT_3_ERROR' },
]

export default function PowerhouseAM15Page() {
  const { data, loading, error } = useLiveData<AM15Powerhouse>('/api/v1/am15/powerhouse', 1000, 'Failed to load powerhouse data')
  const row = data[0]

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/am15" className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink transition-colors mb-2">
          <ChevronLeft size={15} />
          AM15 overview
        </Link>
        <h1 className="text-2xl font-semibold text-ink mb-1">AM15 Powerhouse</h1>
        <p className="text-sm text-ink-secondary">Per-engine load and operational status.</p>
      </div>

      {loading ? (
        <MetricGridSkeleton count={6} />
      ) : error && !row ? (
        <StateCard variant="error" title="Couldn't load data" message={error} />
      ) : !row ? (
        <StateCard title="No engine data" message="There's no powerhouse data to show right now." />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Generation</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ENGINES.map((e) => {
                const load = row[e.kw] ?? 0
                return (
                  <MetricCard
                    key={e.id}
                    label={e.label}
                    value={load}
                    capacity={e.capacity}
                    status={engineStatus(row[e.err] ?? 0, load)}
                    reportHref={`/dashboard/am15/powerhouse/${e.id}`}
                  />
                )
              })}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Utilization</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TAKEOFFS.map((e) => {
                const load = row[e.kw] ?? 0
                return (
                  <MetricCard
                    key={e.id}
                    label={e.label}
                    value={load}
                    capacity={e.capacity}
                    status={engineStatus(row[e.err] ?? 0, load)}
                    reportHref={`/dashboard/am15/powerhouse/${e.id}`}
                  />
                )
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
