import { Sun } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export default function AM14SolarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink mb-1">AM14 Solar</h1>
        <p className="text-sm text-ink-secondary">Per-array solar generation for site AM14.</p>
      </div>

      <Card className="p-10 text-center">
        <div className="w-12 h-12 bg-surface-subtle rounded-xl flex items-center justify-center mx-auto mb-4">
          <Sun size={22} className="text-ink-muted" aria-hidden="true" />
        </div>
        <h2 className="text-base font-semibold text-ink mb-1">Solar monitoring coming soon</h2>
        <p className="text-sm text-ink-secondary">
          Live solar data for AM14 isn&apos;t instrumented yet. This page will show per-array generation once it&apos;s connected.
        </p>
      </Card>
    </div>
  )
}
