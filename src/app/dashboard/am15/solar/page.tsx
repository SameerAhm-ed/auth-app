// /dashboard/am15/solar/page.tsx
'use client'

import Link from 'next/link'
import { ChevronLeft, Sun } from 'lucide-react'
import { MetricCard } from '@/components/metrics/MetricCard'
import { MetricGridSkeleton, StateCard } from '@/components/metrics/MetricStates'
import { engineStatus } from '@/components/metrics/status'
import { useLiveData } from '@/components/metrics/useLiveData'

interface AM15Solar {
  id: number
  SOLAR_TW_KW: number
  SOLAR_TW_ERROR: number
}

const CAPACITY = 1500 // kW

export default function AM15SolarPage() {
  const { data, loading, error } = useLiveData<AM15Solar>('/api/v1/am15/powerhouse', 1000, 'Failed to load solar data')
  const row = data[0]

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/am15" className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink transition-colors mb-2">
          <ChevronLeft size={15} />
          AM15 overview
        </Link>
        <h1 className="text-2xl font-semibold text-ink mb-1">AM15 Solar</h1>
        <p className="text-sm text-ink-secondary">Solar generation load and status.</p>
      </div>

      <div className="max-w-sm">
        {loading ? (
          <MetricGridSkeleton count={1} />
        ) : error && !row ? (
          <StateCard variant="error" title="Couldn't load data" message={error} />
        ) : !row ? (
          <StateCard title="No solar data" message="There's no solar data to show right now." />
        ) : (
          <MetricCard
            label="Solar TW"
            value={row.SOLAR_TW_KW ?? 0}
            capacity={CAPACITY}
            status={engineStatus(row.SOLAR_TW_ERROR ?? 0, row.SOLAR_TW_KW ?? 0)}
            icon={<Sun size={16} className="text-ink-muted" aria-hidden="true" />}
            reportHref="/dashboard/am15/powerhouse/SOLAR_TW"
          />
        )}
      </div>
    </div>
  )
}
