// /dashboard/am4/powerhouse/page.tsx
'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { MetricCard } from '@/components/metrics/MetricCard'
import { MetricGridSkeleton, StateCard } from '@/components/metrics/MetricStates'
import { engineStatus } from '@/components/metrics/status'
import { useLiveData } from '@/components/metrics/useLiveData'

interface AM04Powerhouse {
  id: number
  ENGINE_1_KW: number
  ENGINE_1_ERROR: number
  ENGINE_2_KW: number
  ENGINE_2_ERROR: number
  ENGINE_3_KW: number
  ENGINE_3_ERROR: number
  ENGINE_4_KW: number
  ENGINE_4_ERROR: number
  ENGINE_6_KW: number
  ENGINE_6_ERROR: number
  ENGINE_7_KW: number
  ENGINE_7_ERROR: number
  AM04_DISTRIBUTION: number
}

type EngineCfg = {
  id: string
  label: string
  capacity: number
  kw: keyof AM04Powerhouse
  err?: keyof AM04Powerhouse
}

const ENGINES: EngineCfg[] = [
  { id: 'E1', label: 'E1 320', capacity: 1064, kw: 'ENGINE_1_KW', err: 'ENGINE_1_ERROR' },
  { id: 'E2', label: 'E2 420', capacity: 1495, kw: 'ENGINE_2_KW', err: 'ENGINE_2_ERROR' },
  { id: 'E3', label: 'E3 420', capacity: 1415, kw: 'ENGINE_3_KW', err: 'ENGINE_3_ERROR' },
  { id: 'E4', label: 'E4 420', capacity: 1490, kw: 'ENGINE_4_KW', err: 'ENGINE_4_ERROR' },
  { id: 'E6', label: 'E6 3412', capacity: 520, kw: 'ENGINE_6_KW', err: 'ENGINE_6_ERROR' },
  { id: 'E7', label: 'E7 C18', capacity: 648, kw: 'ENGINE_7_KW', err: 'ENGINE_7_ERROR' },
]

const UTILIZATION: EngineCfg[] = [
  { id: 'AM04_DIS', label: 'AM04 Distribution', capacity: 1600, kw: 'AM04_DISTRIBUTION' },
]

export default function PowerhouseAM4Page() {
  const { data, loading, error } = useLiveData<AM04Powerhouse>('/api/v1/am4/powerhouse', 1000, 'Failed to load powerhouse data')
  const row = data[0]

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/am4" className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink transition-colors mb-2">
          <ChevronLeft size={15} />
          AM4 overview
        </Link>
        <h1 className="text-2xl font-semibold text-ink mb-1">AM4 Powerhouse</h1>
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
                    status={engineStatus(e.err ? (row[e.err] ?? 0) : 0, load)}
                    reportHref={`/dashboard/am4/powerhouse/${e.id}`}
                  />
                )
              })}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Utilization</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {UTILIZATION.map((e) => {
                const load = row[e.kw] ?? 0
                return (
                  <MetricCard
                    key={e.id}
                    label={e.label}
                    value={load}
                    capacity={e.capacity}
                    status={engineStatus(e.err ? (row[e.err] ?? 0) : 0, load)}
                    reportHref={`/dashboard/am4/powerhouse/${e.id}`}
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
