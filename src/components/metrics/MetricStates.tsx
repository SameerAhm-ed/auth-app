'use client'

import { Card } from '@/components/ui/Card'

/** Skeleton grid shown on first load. */
export function MetricGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-4 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-20 rounded bg-surface-subtle" />
            <div className="h-4 w-16 rounded bg-surface-subtle" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full border-[12px] border-surface-subtle shrink-0" />
            <div className="space-y-2">
              <div className="h-6 w-20 rounded bg-surface-subtle" />
              <div className="h-3 w-24 rounded bg-surface-subtle" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

/**
 * Skeleton for the site overview page — mirrors its card grid (two generation
 * cards with a donut + legend rows, plus two shorter stat/list cards) so a
 * refresh shows shaped placeholders instead of a bare "Loading…" line.
 */
export function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Generation cards: header + donut + legend rows + total bar */}
      {[0, 1].map((i) => (
        <Card key={`gen-${i}`} className="overflow-hidden animate-pulse">
          <div className="flex items-center gap-2 p-4 border-b border-line">
            <div className="h-4 w-4 rounded bg-surface-subtle" />
            <div className="h-4 w-40 rounded bg-surface-subtle" />
          </div>
          <div className="p-5 flex justify-center">
            <div className="w-40 h-40 rounded-full border-[16px] border-surface-subtle" />
          </div>
          <div className="px-4 pb-4 space-y-3">
            {Array.from({ length: 4 }).map((_, r) => (
              <div key={r} className="flex items-center justify-between">
                <div className="h-3 w-28 rounded bg-surface-subtle" />
                <div className="h-3 w-16 rounded bg-surface-subtle" />
              </div>
            ))}
            <div className="h-9 w-full rounded-lg bg-surface-subtle" />
          </div>
        </Card>
      ))}
      {/* Shorter cards: header + a few rows (stat grid / gas pressures) */}
      {[0, 1].map((i) => (
        <Card key={`aux-${i}`} className="overflow-hidden h-fit animate-pulse">
          <div className="flex items-center gap-2 p-4 border-b border-line">
            <div className="h-4 w-4 rounded bg-surface-subtle" />
            <div className="h-4 w-32 rounded bg-surface-subtle" />
          </div>
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, r) => (
              <div key={r} className="flex items-center justify-between">
                <div className="h-3 w-24 rounded bg-surface-subtle" />
                <div className="h-3 w-14 rounded bg-surface-subtle" />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}

/** Empty / error state card. */
export function StateCard({
  variant = 'empty',
  title,
  message,
}: {
  variant?: 'empty' | 'error'
  title: string
  message: string
}) {
  return (
    <Card className="p-10 text-center max-w-md">
      {variant === 'error' && (
        <div className="w-12 h-12 bg-danger-bg rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-danger text-xl font-bold">!</span>
        </div>
      )}
      <h2 className="text-base font-semibold text-ink mb-1">{title}</h2>
      <p className="text-sm text-ink-secondary mb-5">{message}</p>
      {variant === 'error' && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center h-9 px-4 rounded-lg border border-line-strong text-sm font-medium text-ink hover:bg-canvas transition-colors"
        >
          Try again
        </button>
      )}
    </Card>
  )
}
