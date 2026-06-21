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
