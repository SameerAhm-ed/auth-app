// /dashboard/am4/ke/page.tsx
// Per-engine KE cards (each with its own donut vs rated capacity), grouped into
// KE 4A / KE 4C, with sanction load + total running load shown per group.
'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { MetricCard } from '@/components/metrics/MetricCard'
import { MetricGridSkeleton, StateCard } from '@/components/metrics/MetricStates'
import { engineStatus } from '@/components/metrics/status'
import { useLiveData } from '@/components/metrics/useLiveData'

interface AM04KE {
  id: number
  KE_1_KW: number
  KE_1_ERROR: number
  KE_2_KW: number
  KE_2_ERROR: number
  KE_3_KW: number
  KE_3_ERROR: number
}

type Member = {
  id: string
  label: string
  capacity: number
  /** Omit `kw` for units that aren't instrumented yet (render as a "no data" card). */
  kw?: keyof AM04KE
  err?: keyof AM04KE
}
type Group = { label: string; sanction: number; members: Member[] }

const GROUPS: Group[] = [
  {
    label: 'KE 4A',
    sanction: 4800,
    members: [
      { id: 'KE_4A_1', label: 'KE 4A 1', capacity: 3000, kw: 'KE_1_KW', err: 'KE_1_ERROR' },
      { id: 'KE_4A_2', label: 'KE 4A 2', capacity: 2500, kw: 'KE_2_KW', err: 'KE_2_ERROR' },
      { id: 'KE_4A_3', label: 'KE 4A 3', capacity: 750 }, // not yet instrumented
    ],
  },
  {
    label: 'KE 4C',
    sanction: 4975,
    members: [
      { id: 'KE_4C_1', label: 'KE 4C 1', capacity: 2500, kw: 'KE_3_KW', err: 'KE_3_ERROR' },
      { id: 'KE_4C_2', label: 'KE 4C 2', capacity: 2500 }, // not yet instrumented
    ],
  },
]

export default function AM4KEPage() {
  const { data, loading, error } = useLiveData<AM04KE>('/api/v1/am4/ke', 1000, 'Failed to load KE data')
  const row = data[0]

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/am4" className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink transition-colors mb-2">
          <ChevronLeft size={15} />
          AM4 overview
        </Link>
        <h1 className="text-2xl font-semibold text-ink mb-1">AM4 K.E Generation</h1>
        <p className="text-sm text-ink-secondary">Per-engine load grouped by sanction.</p>
      </div>

      {loading ? (
        <KESkeleton />
      ) : error && !row ? (
        <StateCard variant="error" title="Couldn't load data" message={error} />
      ) : !row ? (
        <StateCard title="No KE data" message="There's no KE data to show right now." />
      ) : (
        <div className="space-y-8">
          {GROUPS.map((group) => {
            const members = group.members.map((m) => ({
              ...m,
              load: m.kw ? (row[m.kw] ?? 0) : 0,
              error: m.err ? (row[m.err] ?? 0) : 0,
            }))
            const running = members.reduce((acc, m) => acc + m.load, 0)
            return (
              <section key={group.label}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wider">{group.label}</h2>
                  <div className="flex items-center gap-4 text-xs text-ink-muted">
                    <span>
                      Sanction <span className="font-semibold text-ink tabular-nums">{group.sanction.toLocaleString()} kW</span>
                    </span>
                    <span>
                      Running <span className="font-semibold text-ink tabular-nums">{running.toLocaleString()} kW</span>
                    </span>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {members.map((m) =>
                    m.kw ? (
                      <MetricCard
                        key={m.id}
                        label={m.label}
                        value={m.load}
                        capacity={m.capacity}
                        status={engineStatus(m.error, m.load)}
                        reportHref={`/dashboard/am4/powerhouse/${m.id}`}
                      />
                    ) : (
                      <NoDataCard key={m.id} label={m.label} />
                    ),
                  )}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function NoDataCard({ label }: { label: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-ink">{label}</h3>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-full border-[12px] border-surface-subtle shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-secondary">No data</p>
          <p className="mt-1 text-xs text-ink-muted">Not yet instrumented.</p>
        </div>
      </div>
    </Card>
  )
}

function KESkeleton() {
  return (
    <div className="space-y-8">
      {GROUPS.map((group) => (
        <section key={group.label}>
          <div className="h-4 w-40 rounded bg-surface-subtle mb-3 animate-pulse" />
          <MetricGridSkeleton count={group.members.length} />
        </section>
      ))}
    </div>
  )
}
