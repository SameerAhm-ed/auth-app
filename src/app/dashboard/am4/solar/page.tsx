// /dashboard/am4/solar/page.tsx
'use client'

import Link from 'next/link'
import { ChevronLeft, Sun } from 'lucide-react'
import { MetricCard } from '@/components/metrics/MetricCard'
import { MetricGridSkeleton, StateCard } from '@/components/metrics/MetricStates'
import { engineStatus } from '@/components/metrics/status'
import { useLiveData } from '@/components/metrics/useLiveData'

interface AM04Solar {
  id: number
  SOLAR_A_KW: number
  SOLAR_A_ERROR: number
  SOLAR_B_KW: number
  SOLAR_B_ERROR: number
  SOLAR_C_KW: number
  SOLAR_C_ERROR: number
}

type SolarCfg = {
  id: string
  label: string
  capacity: number
  kw: keyof AM04Solar
  err: keyof AM04Solar
}

const UNITS: SolarCfg[] = [
  { id: 'SOLAR_A', label: 'SOLAR AM4', capacity: 379, kw: 'SOLAR_A_KW', err: 'SOLAR_A_ERROR' },
  { id: 'SOLAR_B', label: 'SOLAR AM4 B', capacity: 388, kw: 'SOLAR_B_KW', err: 'SOLAR_B_ERROR' },
  { id: 'SOLAR_C', label: 'SOLAR AM4C T2', capacity: 550, kw: 'SOLAR_C_KW', err: 'SOLAR_C_ERROR' },
]

export default function AM4SolarPage() {
  const { data, loading, error } = useLiveData<AM04Solar>('/api/v1/am4/solar', 1000, 'Failed to load solar data')
  const row = data[0]

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/am4" className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink transition-colors mb-2">
          <ChevronLeft size={15} />
          AM4 overview
        </Link>
        <h1 className="text-2xl font-semibold text-ink mb-1">AM4 Solar</h1>
        <p className="text-sm text-ink-secondary">Per-array solar generation and status.</p>
      </div>

      {loading ? (
        <MetricGridSkeleton count={3} />
      ) : error && !row ? (
        <StateCard variant="error" title="Couldn't load data" message={error} />
      ) : !row ? (
        <StateCard title="No solar data" message="There's no solar data to show right now." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {UNITS.map((u) => {
            const load = row[u.kw] ?? 0
            return (
              <MetricCard
                key={u.id}
                label={u.label}
                value={load}
                capacity={u.capacity}
                status={engineStatus(row[u.err] ?? 0, load)}
                icon={<Sun size={16} className="text-ink-muted" aria-hidden="true" />}
                reportHref={`/dashboard/am4/powerhouse/${u.id}`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
