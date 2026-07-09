'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useLiveData } from './useLiveData'
import { MetricCard } from './MetricCard'
import { MetricGridSkeleton, StateCard } from './MetricStates'
import { loadStatus } from './status'
import { reportHref } from './reportLink'

type Row = Record<string, number>

export interface BoilerCfg {
  label: string
  /** Field holding the primary flow value (T/H by default). */
  flow: string
  capacity: number
  unit?: string
  /** Extra readouts (pressure, water, gas, …) pulled from the row. */
  metrics?: { label: string; key: string; unit: string }[]
  /** EMS tag id for the historical report. Omit → no report icon yet. */
  tag?: number
}

/**
 * Shared page for steam / boiler grids: a header + live MetricCard grid driven
 * by a boiler config. Each boiler shows a flow gauge + status + extra readouts.
 */
export function BoilerPage({
  title,
  subtitle = 'Steam flow and operational status.',
  endpoint,
  boilers,
  report,
  backHref = '/dashboard/am5',
  backLabel = 'AM5 overview',
}: {
  title: string
  subtitle?: string
  endpoint: string
  boilers: BoilerCfg[]
  /** Report-link context. Each boiler with a `tag` links to its historical report. */
  report?: { back: string; backLabel: string; unit?: string }
  /** Overview back-link target + label (defaults to the AM5 overview). */
  backHref?: string
  backLabel?: string
}) {
  const { data, loading, error } = useLiveData<Row>(endpoint)
  const row = data[0]

  return (
    <div className="space-y-6">
      <div>
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink transition-colors mb-2">
          <ChevronLeft size={15} />
          {backLabel}
        </Link>
        <h1 className="text-2xl font-semibold text-ink mb-1">{title}</h1>
        <p className="text-sm text-ink-secondary">{subtitle}</p>
      </div>

      {loading ? (
        <MetricGridSkeleton count={boilers.length} />
      ) : error && !row ? (
        <StateCard variant="error" title="Couldn't load data" message={error} />
      ) : !row ? (
        <StateCard title="No data" message="There's no steam data to show right now." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boilers.map((b) => {
            const value = row[b.flow] ?? 0
            return (
              <MetricCard
                key={b.label}
                label={b.label}
                value={value}
                unit={b.unit ?? 'T/H'}
                capacity={b.capacity}
                status={loadStatus(value)}
                metrics={(b.metrics ?? []).map((m) => ({
                  label: m.label,
                  value: `${(row[m.key] ?? 0).toLocaleString()} ${m.unit}`,
                }))}
                reportHref={reportHref({
                  tag: b.tag,
                  label: b.label,
                  unit: report?.unit ?? 'T',
                  back: report?.back,
                  backLabel: report?.backLabel,
                })}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
