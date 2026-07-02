// /dashboard/am14/powerhouse/page.tsx
'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { MetricCard } from '@/components/metrics/MetricCard'
import { MetricGridSkeleton, StateCard } from '@/components/metrics/MetricStates'
import { engineStatus } from '@/components/metrics/status'
import { useLiveData } from '@/components/metrics/useLiveData'

interface AM14Powerhouse {
  id: number
  KE_OLD_KW: number
  KE_OLD_ERROR: number
  KE_NEW_KW: number
  KE_NEW_ERROR: number
  GENSET_KW: number
  GENSET_ERROR: number
  AM2_A_KW: number
  AM2_A_ERROR: number
  AM2_B_KW: number
  AM2_B_ERROR: number
}

const ENGINES: { id: string; label: string; capacity: number; kw: keyof AM14Powerhouse; err: keyof AM14Powerhouse }[] = [
  { id: 'KE_OLD', label: 'KE OLD', capacity: 450, kw: 'KE_OLD_KW', err: 'KE_OLD_ERROR' },
  { id: 'KE_NEW', label: 'KE NEW', capacity: 450, kw: 'KE_NEW_KW', err: 'KE_NEW_ERROR' },
  { id: 'GENSET', label: 'GENSET', capacity: 500, kw: 'GENSET_KW', err: 'GENSET_ERROR' },
  { id: 'AM2_A', label: 'AM2 A', capacity: 600, kw: 'AM2_A_KW', err: 'AM2_A_ERROR' },
  { id: 'AM2_B', label: 'AM2 B', capacity: 360, kw: 'AM2_B_KW', err: 'AM2_B_ERROR' },
]

export default function PowerhouseAM14Page() {
  const { data, loading, error } = useLiveData<AM14Powerhouse>('/api/v1/am14/powerhouse', 1000, 'Failed to load powerhouse data')
  const row = data[0]

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/am14" className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink transition-colors mb-2">
          <ChevronLeft size={15} />
          AM14 overview
        </Link>
        <h1 className="text-2xl font-semibold text-ink mb-1">AM14 Powerhouse</h1>
        <p className="text-sm text-ink-secondary">Per-engine load and operational status.</p>
      </div>

      {loading ? (
        <MetricGridSkeleton count={6} />
      ) : error && !row ? (
        <StateCard variant="error" title="Couldn't load data" message={error} />
      ) : !row ? (
        <StateCard title="No engine data" message="There's no powerhouse data to show right now." />
      ) : (
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
                reportHref={`/dashboard/am14/powerhouse/${e.id}`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
