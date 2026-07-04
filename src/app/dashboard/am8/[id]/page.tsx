// /dashboard/am8/[id]/page.tsx
// Historical report for one AM8 solar array, keyed by its EMS tag id (e.g. /am8/187).
import { HistoryReport } from '@/components/metrics/HistoryReport'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ label?: string }>
}) {
  const { id } = await params
  const { label } = await searchParams
  return <HistoryReport id={id} label={label} unit="kWh" backHref="/dashboard/am8" backLabel="AM8 Solar" />
}
