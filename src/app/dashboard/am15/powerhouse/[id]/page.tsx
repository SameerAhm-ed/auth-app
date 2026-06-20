// /dashboard/am15/powerhouse/[id]/page.tsx
// Dynamic historical-report page — one route serves every engine/source.
import Link from 'next/link'
import { ChevronLeft, BarChart3 } from 'lucide-react'
import { Card } from '@/components/ui/Card'

const LABELS: Record<string, string> = {
  KE: 'KE',
  JGS_420: 'JGS 420',
  JGS_312: 'JGS 312',
  GAS_1_5: 'GAS 1.5',
  CAT_DIESEL: 'CAT Diesel',
  KT_50: 'KT 50',
  LT_1: 'Load Takeoff 1',
  LT_2: 'Load Takeoff 2',
  LT_3: 'Load Takeoff 3',
  SOLAR_TW: 'Solar TW',
}

export default async function AM15ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const label = LABELS[id] ?? id

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/am15/powerhouse"
          className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink transition-colors mb-2"
        >
          <ChevronLeft size={15} />
          Powerhouse
        </Link>
        <h1 className="text-2xl font-semibold text-ink mb-1">{label} — Historical Report</h1>
        <p className="text-sm text-ink-secondary">Time-series and historical data for this source.</p>
      </div>

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
