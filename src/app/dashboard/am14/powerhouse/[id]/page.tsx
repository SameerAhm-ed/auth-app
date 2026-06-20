// /dashboard/am14/powerhouse/[id]/page.tsx
// Dynamic historical-report page — one route serves every engine/source.
import Link from 'next/link'
import { ChevronLeft, BarChart3 } from 'lucide-react'
import { Card } from '@/components/ui/Card'

// Friendly labels for known ids; unknown ids fall back to the raw id.
const ENGINE_LABELS: Record<string, string> = {
  KE_OLD: 'KE OLD',
  KE_NEW: 'KE NEW',
  GENSET: 'GENSET',
  AM2_A: 'AM2 A',
  AM2_B: 'AM2 B',
}

export default async function PowerhouseReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const label = ENGINE_LABELS[id] ?? id

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/am14/powerhouse"
          className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink transition-colors mb-2"
        >
          <ChevronLeft size={15} />
          Powerhouse
        </Link>
        <h1 className="text-2xl font-semibold text-ink mb-1">{label} — Historical Report</h1>
        <p className="text-sm text-ink-secondary">Time-series and historical data for this source.</p>
      </div>

      {/* Placeholder — drop the historical/reporting UI in here */}
      <Card className="p-10 text-center">
        <div className="w-12 h-12 bg-surface-subtle rounded-xl flex items-center justify-center mx-auto mb-4">
          <BarChart3 size={22} className="text-ink-muted" aria-hidden="true" />
        </div>
        <h2 className="text-base font-semibold text-ink mb-1">Historical reporting coming soon</h2>
        <p className="text-sm text-ink-secondary">
          This page will show historical data for <span className="font-medium text-ink">{label}</span>.
        </p>
        <p className="mt-2 text-xs text-ink-muted">Report id: {id}</p>
      </Card>
    </div>
  )
}
