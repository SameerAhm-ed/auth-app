// /dashboard/am5/report/[id]/page.tsx
// Generic historical report keyed by EMS tag id. Power houses, steam and coal
// boiler cards link here with ?label=&unit=&back=&backLabel= for context.
import { HistoryReport } from '@/components/metrics/HistoryReport'

export default async function AM5ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ label?: string; unit?: string; back?: string; backLabel?: string }>
}) {
  const { id } = await params
  const { label, unit, back, backLabel } = await searchParams
  return <HistoryReport id={id} label={label} unit={unit} backHref={back} backLabel={backLabel} />
}
