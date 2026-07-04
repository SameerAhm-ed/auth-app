// /dashboard/am17/solar/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useLiveData } from '@/components/metrics/useLiveData'
import { MetricCard } from '@/components/metrics/MetricCard'
import { MetricGridSkeleton, StateCard } from '@/components/metrics/MetricStates'
import { loadStatus } from '@/components/metrics/status'

type Row = Record<string, number>
type ProxyRow = { tagId: number; timestamp: string; value: number }

interface ArrayCfg {
  section: string
  label: string
  kw: string
  capacity: number
  tag: number // EMS tag id for the "yesterday kWh" lookup
}

const ARRAYS: ArrayCfg[] = [
  { section: 'AM17 Solar', label: 'Solar-1 AM17', kw: 'AM17_solar1_kW', capacity: 908, tag: 188 },
  { section: 'AM17 Solar', label: 'Solar-2 AM17', kw: 'AM17_solar2_kW', capacity: 750, tag: 190 },
  { section: 'AM19 Solar', label: 'AM-19 Solar', kw: 'AM19_solar_kW', capacity: 4000, tag: 4454 },
  { section: 'AM19 Solar', label: 'AM-19_2 Solar', kw: 'AM19_2_solar_kW', capacity: 4000, tag: 4457 },
]

const SECTIONS = ['AM17 Solar', 'AM19 Solar']
const TAGS = ARRAYS.map((a) => a.tag)

const fmtKwh = (n?: number) =>
  n == null ? '—' : `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n)} kWh`

// Yesterday 00:00:00 → today 00:00:01 (matches the EMS bucketing).
function yesterdayWindow() {
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setHours(0, 0, 0, 0)
  end.setSeconds(1, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.000`
  return { timeBegin: fmt(start), timeEnd: fmt(end) }
}

function deltaForTag(rows: ProxyRow[]): number | undefined {
  if (!rows || rows.length < 2) return undefined
  const sorted = [...rows].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  const d = Number(sorted[sorted.length - 1].value) - Number(sorted[0].value)
  return Number.isFinite(d) ? d : undefined
}

export default function AM17SolarPage() {
  const { data, loading, error } = useLiveData<Row>('/api/v1/am5/solar')
  const row = data[0]

  const [energy, setEnergy] = useState<Record<number, number>>({})
  const [energyLoading, setEnergyLoading] = useState(true)
  const [energyErr, setEnergyErr] = useState(false)

  // Yesterday's produced energy — fetched once from the external EMS proxy.
  useEffect(() => {
    const abort = new AbortController()
    const run = async () => {
      try {
        const { timeBegin, timeEnd } = yesterdayWindow()
        const res = await fetch('/api/v1/am5/proxy-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          signal: abort.signal,
          body: JSON.stringify({
            valueIds: TAGS,
            valueNames: Array(TAGS.length).fill(''),
            timeBegin,
            timeEnd,
            timeStep: '86400,1',
            sqlClause: '',
          }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const raw: ProxyRow[] = await res.json()

        const by = new Map<number, ProxyRow[]>()
        for (const r of raw ?? []) {
          const arr = by.get(r.tagId) ?? []
          arr.push({ ...r, value: Number(r.value) })
          by.set(r.tagId, arr)
        }
        const out: Record<number, number> = {}
        for (const t of TAGS) {
          const d = deltaForTag(by.get(t) ?? [])
          if (d != null) out[t] = d
        }
        setEnergy(out)
      } catch (e: unknown) {
        if ((e as Error)?.name !== 'AbortError') setEnergyErr(true)
      } finally {
        setEnergyLoading(false)
      }
    }
    run()
    return () => abort.abort()
  }, [])

  const energyText = (tag: number) => (energyLoading ? 'Loading…' : energyErr ? '—' : fmtKwh(energy[tag]))

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/am17" className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink transition-colors mb-2">
          <ChevronLeft size={15} />
          AM17 overview
        </Link>
        <h1 className="text-2xl font-semibold text-ink mb-1">AM17 Solar</h1>
        <p className="text-sm text-ink-secondary">Per-array generation and yesterday&apos;s energy.</p>
      </div>

      {loading ? (
        <MetricGridSkeleton count={4} />
      ) : error && !row ? (
        <StateCard variant="error" title="Couldn't load data" message={error} />
      ) : !row ? (
        <StateCard title="No data" message="There's no solar data to show right now." />
      ) : (
        <div className="space-y-8">
          {SECTIONS.map((sec) => (
            <section key={sec}>
              <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">{sec}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ARRAYS.filter((a) => a.section === sec).map((a) => {
                  const value = row[a.kw] ?? 0
                  return (
                    <MetricCard
                      key={a.label}
                      label={a.label}
                      value={value}
                      capacity={a.capacity}
                      status={loadStatus(value)}
                      metrics={[{ label: 'Yesterday', value: energyText(a.tag) }]}
                      reportHref={`/dashboard/am17/solar/${a.tag}?label=${encodeURIComponent(a.label)}`}
                    />
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
