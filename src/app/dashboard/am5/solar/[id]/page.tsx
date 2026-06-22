// /dashboard/am5/solar/[id]/page.tsx
// Historical report for one solar array, keyed by its EMS tag id (e.g. /solar/13).
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
  return <HistoryReport id={id} label={label} unit="kWh" backHref="/dashboard/am5/solar" backLabel="AM5 Solar" />
}
