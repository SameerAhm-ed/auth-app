// /dashboard/am8/page.tsx
// AM8 = solar generation + its plant utilization. Solar comes from the shared
// AM5 Solar table (/api/v1/am5/solar → AM8_solar_kW); the AM8 load is the
// "Spinning AM-8" takeoff from AM5 Power House 2 (/api/v1/am5/powerhouse2).
'use client'

import { useEffect, useState } from 'react'
import { useLiveData } from '@/components/metrics/useLiveData'
import { MetricCard } from '@/components/metrics/MetricCard'
import { MetricGridSkeleton, StateCard } from '@/components/metrics/MetricStates'
import { loadStatus } from '@/components/metrics/status'

type Row = Record<string, number>
type ProxyRow = { tagId: number; timestamp: string; value: number }

interface ArrayCfg {
  label: string
  kw: string
  capacity: number
  tag: number // EMS tag id for the "yesterday kWh" lookup
}

const ARRAYS: ArrayCfg[] = [
  { label: 'AM-8 Solar', kw: 'AM8_solar_kW', capacity: 925, tag: 187 },
]

// AM8 utilization — the "Spinning AM-8" takeoff on AM5 Power House 2.
const UTILIZATION = { key: 'Takeoff7kw', label: 'Spinning AM-8', capacity: 6000 }

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

export default function AM8Page() {
  const { data, loading, error } = useLiveData<Row>('/api/v1/am5/solar')
  const row = data[0]

  // AM8 load is a takeoff on Power House 2 — polled alongside the solar feed.
  const { data: ph2Data } = useLiveData<Row>('/api/v1/am5/powerhouse2')
  const ph2 = ph2Data[0]

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
        <h1 className="text-2xl font-semibold text-ink mb-1">AM8 Overview</h1>
        <p className="text-sm text-ink-secondary">Solar generation and plant utilization at a glance.</p>
      </div>

      {loading ? (
        <MetricGridSkeleton count={2} />
      ) : error && !row ? (
        <StateCard variant="error" title="Couldn't load data" message={error} />
      ) : !row ? (
        <StateCard title="No data" message="There's no data to show right now." />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Solar</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ARRAYS.map((a) => {
                const value = row[a.kw] ?? 0
                return (
                  <MetricCard
                    key={a.label}
                    label={a.label}
                    value={value}
                    capacity={a.capacity}
                    status={loadStatus(value)}
                    metrics={[{ label: 'Yesterday', value: energyText(a.tag) }]}
                    reportHref={`/dashboard/am8/${a.tag}?label=${encodeURIComponent(a.label)}`}
                  />
                )
              })}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Utilization</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                label={UTILIZATION.label}
                value={Math.trunc(ph2?.[UTILIZATION.key] ?? 0)}
                capacity={UTILIZATION.capacity}
                status={loadStatus(Math.trunc(ph2?.[UTILIZATION.key] ?? 0), 10)}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
