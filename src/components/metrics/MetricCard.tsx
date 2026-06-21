import Link from 'next/link'
import { BarChart3 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { Status, Fuel } from './status'

const R = 54
const SW = 12
const C = 2 * Math.PI * R

export interface MetricCardProps {
  label: string
  value: number
  unit?: string
  /** When set, renders a capacity gauge (value / capacity %). */
  capacity?: number
  status?: Status
  fuel?: Fuel
  /** Extra readouts shown beneath the primary value (e.g. pressure, water flow). */
  metrics?: { label: string; value: React.ReactNode }[]
  /** Overrides the gauge color (defaults to status color, then brand blue). */
  gaugeColor?: string
  /** Optional historical-report link. */
  reportHref?: string
}

/**
 * Flexible live metric card: capacity gauge + primary value + optional fuel
 * badge, status pill, extra readouts, and a report link. Themed / dark-safe.
 */
export function MetricCard({
  label,
  value,
  unit = 'kW',
  capacity,
  status,
  fuel,
  metrics,
  gaugeColor,
  reportHref,
}: MetricCardProps) {
  const hasGauge = capacity != null
  const pct = hasGauge && capacity! > 0 ? Math.min(Math.max((value / capacity!) * 100, 0), 100) : 0
  const ringColor = gaugeColor ?? status?.color ?? '#5b82c9'
  const dash = (pct / 100) * C

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm font-semibold text-ink truncate">{label}</h3>
          {fuel && (
            <span
              className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: fuel.color + '22', color: fuel.color }}
            >
              {fuel.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {status && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: status.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
              {status.text}
            </span>
          )}
          {reportHref && (
            <Link
              href={reportHref}
              aria-label={`View historical report for ${label}`}
              className="w-8 h-8 -mr-1 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
            >
              <BarChart3 size={16} />
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {hasGauge && (
          <div className="relative w-24 h-24 shrink-0">
            <svg
              viewBox="0 0 120 120"
              className="w-full h-full -rotate-90"
              role="img"
              aria-label={`${label}: ${Math.round(pct)}% of capacity`}
            >
              <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-surface-subtle)" strokeWidth={SW} />
              <circle
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke={ringColor}
                strokeWidth={SW}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${C - dash}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-ink tabular-nums">
              {Math.round(pct)}%
            </div>
          </div>
        )}

        <div className="min-w-0">
          <p className="text-2xl font-bold text-ink tabular-nums leading-none">
            {value.toLocaleString()}
            <span className="ml-1 text-sm font-medium text-ink-secondary">{unit}</span>
          </p>
          {hasGauge && (
            <p className="mt-1.5 text-xs text-ink-muted">of {capacity!.toLocaleString()} {unit} capacity</p>
          )}
          {metrics && metrics.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {metrics.map((m, i) => (
                <p key={i} className="text-xs text-ink-secondary tabular-nums">
                  {m.label}: <span className="text-ink font-medium">{m.value}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
