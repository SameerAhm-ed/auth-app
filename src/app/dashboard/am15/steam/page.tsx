// /dashboard/am15/steam/page.tsx
'use client'

import Link from 'next/link'
import { ChevronLeft, Flame } from 'lucide-react'
import { MetricCard } from '@/components/metrics/MetricCard'
import { MetricGridSkeleton, StateCard } from '@/components/metrics/MetricStates'
import { engineStatus } from '@/components/metrics/status'
import { useLiveData } from '@/components/metrics/useLiveData'

interface AM15Steam {
  id: number
  STEAM_FLOW_T_1: number
  STEAM_FLOW_T_2: number
  STEAM_TOWERS_ERROR: number
}

type TowerCfg = { id: string; label: string; capacity: number; flow: keyof AM15Steam }

// Both towers share one error flag (STEAM_TOWERS_ERROR).
const TOWERS: TowerCfg[] = [
  { id: 'ST1', label: 'Tower 1', capacity: 10, flow: 'STEAM_FLOW_T_1' },
  { id: 'ST2', label: 'Tower 2', capacity: 2, flow: 'STEAM_FLOW_T_2' },
]

export default function AM15SteamPage() {
  const { data, loading, error } = useLiveData<AM15Steam>('/api/v1/am15/powerhouse', 1000, 'Failed to load steam data')
  const row = data[0]

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/am15" className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink transition-colors mb-2">
          <ChevronLeft size={15} />
          AM15 overview
        </Link>
        <h1 className="text-2xl font-semibold text-ink mb-1">AM15 Steam</h1>
        <p className="text-sm text-ink-secondary">Steam distribution flow and tower status.</p>
      </div>

      <div className="max-w-2xl">
        {loading ? (
          <MetricGridSkeleton count={2} />
        ) : error && !row ? (
          <StateCard variant="error" title="Couldn't load data" message={error} />
        ) : !row ? (
          <StateCard title="No steam data" message="There's no steam data to show right now." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {TOWERS.map((t) => {
              const flow = row[t.flow] ?? 0
              return (
                <MetricCard
                  key={t.id}
                  label={t.label}
                  value={flow}
                  unit="T/H"
                  capacity={t.capacity}
                  status={engineStatus(row.STEAM_TOWERS_ERROR ?? 0, flow)}
                  icon={<Flame size={16} className="text-ink-muted" aria-hidden="true" />}
                  reportHref={`/dashboard/am15/powerhouse/${t.id}`}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
