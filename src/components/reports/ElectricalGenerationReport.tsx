'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Zap, Gauge } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

/* ───────────────── Types ──────────────── */
type TagRecord = { tagId: number; timestamp: string; value: number }
type QueryBody = { valueIds: number[]; timeBegin: string; timeEnd: string; timeStep: string }

/* ───────────────── Config ──────────────── */
const API_URL = '/api/v1/am5/proxy-query'

/* ───────────────── Tags ──────────────── */
/* PH1 engines (AM5). Engine 7 has no tag yet — add it here once known. */
const PH1_ENGINES = [
  { key: 280, label: 'Engine 1' },
  { key: 281, label: 'Engine 2' },
  { key: 282, label: 'Engine 3' },
  { key: 284, label: 'Engine 4' },
  { key: 285, label: 'Engine 5' },
  { key: 283, label: 'Engine 6' },
] as const

/* PH2 engines (AM5) — same tags already wired for the per-engine reports. */
const PH2_ENGINES = [
  { key: 1627, label: 'Turbine' },
  { key: 286, label: 'Engine 1' },
  { key: 287, label: 'Engine 2' },
  { key: 288, label: 'Engine 3' },
  { key: 289, label: 'Engine 4' },
  { key: 290, label: 'Engine 5' },
  { key: 291, label: 'Engine 6' },
] as const

/* Solar arrays — same tags already wired on the per-site solar pages.
   AM18 solar has no tag yet — add it here once known. */
const SOLAR_ARRAYS = [
  { key: 13, label: 'AM5 Solar LT-3' },
  { key: 15, label: 'AM5 Solar LT-4' },
  { key: 11, label: 'AM5 Solar LT-5' },
  { key: 187, label: 'AM8 Solar' },
  { key: 188, label: 'AM17 Solar-1' },
  { key: 190, label: 'AM17 Solar-2' },
  { key: 4454, label: 'AM-19 Solar' },
  { key: 4457, label: 'AM-19_2 Solar' },
] as const

/* PH3 (AM17 PH1: KE/CAT/MAN/MAK1/MAK2) and PH4 (AM17 PH2: Engine 1-3) have no
   tags yet. Add a POWERHOUSES entry the same shape as PH1_ENGINES/PH2_ENGINES
   above once they're known, then list it in POWERHOUSES below — no other
   changes needed, the render is fully data-driven. */
const POWERHOUSES: { title: string; engines: readonly { key: number; label: string }[] }[] = [
  { title: 'Power House 1', engines: PH1_ENGINES },
  { title: 'Power House 2', engines: PH2_ENGINES },
]

const ALL_TAGS = [
  ...PH1_ENGINES.map((e) => e.key),
  ...PH2_ENGINES.map((e) => e.key),
  ...SOLAR_ARRAYS.map((e) => e.key),
]

/* ───────────────── Utilities ──────────────── */
const pad = (n: number) => String(n).padStart(2, '0')
const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
const toApiTime = (local: string) => (local ? local.replace('T', ' ') + ':00.000' : '')

/** Default range: yesterday 08:00 → today 08:01 (a 24h production shift). */
const defaultStart = () => { const d = new Date(); d.setDate(d.getDate() - 1); d.setHours(8, 0, 0, 0); return toLocalInput(d) }
const defaultEnd = () => { const d = new Date(); d.setHours(8, 1, 0, 0); return toLocalInput(d) }

const NUMBER_FMT = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })
const fmt = (n: number | null | undefined) =>
  n == null || Number.isNaN(n) || !Number.isFinite(n) ? '—' : NUMBER_FMT.format(Number(n))
const fmtPct = (part: number, total: number) => (total <= 0 ? '—' : ((part / total) * 100).toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' %')

export function ElectricalGenerationReport({ backHref, backLabel }: { backHref: string; backLabel: string }) {
  const [start, setStart] = useState(defaultStart)
  const [end, setEnd] = useState(defaultEnd)
  const [data, setData] = useState<TagRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  // Cumulative diff per tag: sum positive increases, treat drops as meter
  // resets, ignore non-positive readings (communication loss). Same logic
  // as the steam report's diffFor.
  const diffFor = useMemo(() => {
    return (tagId: number) => {
      const rows = data.filter((r) => r.tagId === tagId).sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      if (rows.length < 2) return 0
      let total = 0
      let prev = Number(rows[0].value) || 0
      for (let i = 1; i < rows.length; i++) {
        const curr = Number(rows[i].value) || 0
        if (curr <= 0) continue
        if (curr >= prev) total += curr - prev
        else total += curr
        prev = curr
      }
      return total
    }
  }, [data])

  const powerhouseTotals = POWERHOUSES.map((ph) => {
    const rows = ph.engines.map((e) => ({ label: e.label, value: diffFor(e.key) }))
    const total = rows.reduce((s, r) => s + r.value, 0)
    return { title: ph.title, rows, total }
  })
  const gasGen = powerhouseTotals.reduce((s, ph) => s + ph.total, 0)

  const solarRows = SOLAR_ARRAYS.map((s) => ({ label: s.label, value: diffFor(s.key) }))
  const solarGen = solarRows.reduce((s, r) => s + r.value, 0)

  const totalGen = gasGen + solarGen

  const rangeInvalid = !start || !end || start >= end

  async function fetchReport(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setLoading(true)
    setData([])

    const body: QueryBody = { valueIds: ALL_TAGS, timeBegin: toApiTime(start), timeEnd: toApiTime(end), timeStep: '3600,1' }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30_000)
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: TagRecord[] = await res.json()
      setData(json ?? [])
    } catch (e: unknown) {
      setErr(controller.signal.aborted ? 'Request timed out — the EMS server took too long to respond.' : (e as Error)?.message || 'Failed to fetch')
    } finally {
      clearTimeout(timeout)
      setLoading(false)
    }
  }

  const hasData = data.length > 0

  return (
    <div className="space-y-6">
      <div>
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink transition-colors mb-2">
          <ChevronLeft size={15} />
          {backLabel}
        </Link>
        <h1 className="text-2xl font-semibold text-ink mb-1">Electrical Generation Report</h1>
        <p className="text-sm text-ink-secondary">Cumulative electrical generation across power houses and solar arrays.</p>
      </div>

      <Card className="overflow-hidden">
        <SectionHead icon={<Gauge size={16} className="text-ink-muted" aria-hidden="true" />} title="Report Parameters" />
        <form onSubmit={fetchReport} className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label htmlFor="start-time" className="text-sm text-ink-secondary">
              Start date &amp; time
              <input
                id="start-time"
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
                className="mt-1 block w-full border border-line-strong bg-surface text-ink rounded-lg px-3 py-2.5 text-sm"
              />
            </label>
            <label htmlFor="end-time" className="text-sm text-ink-secondary">
              End date &amp; time
              <input
                id="end-time"
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
                className="mt-1 block w-full border border-line-strong bg-surface text-ink rounded-lg px-3 py-2.5 text-sm"
              />
            </label>
          </div>

          {err && <Alert>{err}</Alert>}
          {rangeInvalid && !err && <p className="text-sm text-danger">End time must be after start time.</p>}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={loading} disabled={rangeInvalid}>
              {loading ? 'Fetching…' : 'Fetch data'}
            </Button>
          </div>
        </form>
      </Card>

      {hasData ? (
        <>
          {powerhouseTotals.map((ph) => (
            <PowerHouseSection key={ph.title} title={ph.title} rows={ph.rows} total={ph.total} />
          ))}

          <Card className="overflow-hidden">
            <SectionHead icon={<Zap size={16} className="text-ink-muted" aria-hidden="true" />} title="Solar Generation" />
            <div className="p-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-ink-muted uppercase tracking-wider border-b border-line">
                    <th className="px-3 py-2">Array</th>
                    <th className="px-3 py-2 text-right">Generation (kWh)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {solarRows.map((r) => (
                    <tr key={r.label}>
                      <td className="px-3 py-2.5 text-ink-secondary">{r.label}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-ink font-medium">{fmt(r.value)}</td>
                    </tr>
                  ))}
                  <tr className="bg-surface-subtle font-semibold text-ink">
                    <td className="px-3 py-2.5">Solar total</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmt(solarGen)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <SectionHead icon={<Gauge size={16} className="text-ink-muted" aria-hidden="true" />} title="Source Mix Summary" />
            <div className="p-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-ink-muted uppercase tracking-wider border-b border-line">
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2 text-right">Generation (kWh)</th>
                    <th className="px-3 py-2 text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  <SourceRow label="Gas engines (PH1 + PH2)" value={gasGen} total={totalGen} />
                  <SourceRow label="Solar" value={solarGen} total={totalGen} />
                  <tr className="bg-brand text-brand-fg font-semibold">
                    <td className="px-3 py-2.5">TOTAL</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmt(totalGen)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">100.0 %</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        !loading && (
          <Card className="p-10 text-center">
            <div className="w-12 h-12 bg-surface-subtle rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap size={22} className="text-ink-muted" aria-hidden="true" />
            </div>
            <h2 className="text-base font-semibold text-ink mb-1">No report yet</h2>
            <p className="text-sm text-ink-secondary">Pick a date range and fetch to generate the electrical report.</p>
          </Card>
        )
      )}
    </div>
  )
}

/* ───────────────── Presentational building blocks ──────────────── */

function SectionHead({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 p-4 border-b border-line">
      {icon}
      <h2 className="text-base font-semibold text-ink">{title}</h2>
    </div>
  )
}

function PowerHouseSection({ title, rows, total }: { title: string; rows: { label: string; value: number }[]; total: number }) {
  return (
    <Card className="overflow-hidden">
      <SectionHead icon={<Zap size={16} className="text-ink-muted" aria-hidden="true" />} title={title} />
      <div className="p-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-ink-muted uppercase tracking-wider border-b border-line">
              <th className="px-3 py-2">Engine</th>
              <th className="px-3 py-2 text-right">Generation (kWh)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="px-3 py-2.5 text-ink-secondary">{r.label}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-ink font-medium">{fmt(r.value)}</td>
              </tr>
            ))}
            <tr className="bg-brand text-brand-fg font-bold">
              <td className="px-3 py-2.5">Grand total</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{fmt(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function SourceRow({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <tr>
      <td className="px-3 py-2.5 text-ink-secondary">{label}</td>
      <td className="px-3 py-2.5 text-right tabular-nums text-ink font-medium">{fmt(value)}</td>
      <td className="px-3 py-2.5 text-right tabular-nums text-ink-secondary">{fmtPct(value, total)}</td>
    </tr>
  )
}
