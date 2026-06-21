// /dashboard/am4/powerhouse/[id]/page.tsx
// Dynamic historical-report page — one route serves every engine/source.
import Link from 'next/link'
import { ChevronLeft, BarChart3 } from 'lucide-react'
import { Card } from '@/components/ui/Card'

const LABELS: Record<string, string> = {
  E1: 'E1 320',
  E2: 'E2 420',
  E3: 'E3 420',
  E4: 'E4 420',
  E6: 'E6 3412',
  E7: 'E7 C18',
  AM04_DIS: 'AM04 Distribution',
  KE_1: 'KE 1',
  KE_2: 'KE 2',
  KE_3: 'KE 3',
  SOLAR_A: 'Solar A',
  SOLAR_B: 'Solar B',
  SOLAR_C: 'Solar C',
  BIOMASS: 'Biomass',
  GB_BOSCH: 'GB Bosch',
  GB_ROBEY: 'GB Robey',
  WHRB_GRISHAM: 'WHRB Grisham',
  WHRB_DDFC: 'WHRB DDFC',
}

export default async function AM4ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const label = LABELS[id] ?? id

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/am4/powerhouse" className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink transition-colors mb-2">
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
