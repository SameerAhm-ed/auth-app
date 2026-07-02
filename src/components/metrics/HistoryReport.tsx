'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, BarChart3 } from 'lucide-react'
import { Card } from '@/components/ui/Card'

type ApiRow = { tagId: number; timestamp: string; value: number }
type RangeKey = 'today' | 'yesterday' | 'last7' | 'thisWeek' | 'custom'
type StepOpt = 'auto' | '60,1' | '900,1' | '3600,1' | '86400,1'

const SERIES = '#5b82c9' // gauge/series accent (data-viz exception to the grayscale chrome)

/* ── date helpers (native Date — local time, matches the EMS payload) ── */
const pad = (n: number, len = 2) => String(n).padStart(len, '0')

const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`

const fmtApi = (localInput: string) => {
  const d = new Date(localInput)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
}
const fmtYMDHM = (ts: string | Date) => {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const fmtMDHM = (ts: string | Date) => {
  const d = new Date(ts)
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x }
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const startOfWeek = (d: Date) => { const x = startOfDay(d); return addDays(x, -x.getDay()) } // week starts Sunday
const endOfWeek = (d: Date) => endOfDay(addDays(startOfWeek(d), 6))
const diffSeconds = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 1000)

const fmtNice = (n: number | null | undefined, digits = 3) =>
  n == null || Number.isNaN(n) ? '—' : Number(n).toLocaleString(undefined, { maximumFractionDigits: digits })

const fmtRangeSummary = (start: string, end: string) => `${fmtYMDHM(start)} → ${fmtYMDHM(end)}`

function pickAutoTimeStep(startLocal: string, endLocal: string): Exclude<StepOpt, 'auto'> {
  const sec = diffSeconds(startLocal, endLocal)
  if (sec <= 2 * 3600) return '60,1'     // ≤ 2h  → 1 min
  if (sec <= 12 * 3600) return '900,1'   // ≤ 12h → 15 min
  if (sec <= 2 * 86400) return '3600,1'  // ≤ 2d  → 1 hour
  return '86400,1'                       // else  → 1 day
}

/* ── positive-only responsive bar chart (SVG) ── */
function DeltaBarChart({
  deltas,
  title = 'Per-step usage (Δ)',
}: {
  deltas: { ts: string; delta: number }[]
  title?: string
}) {
  const n = deltas.length
  const max = useMemo(() => Math.max(1, ...deltas.map((d) => d.delta)), [deltas])

  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const hover = hoverIdx != null ? deltas[hoverIdx] : null

  // Measure the real pixel width so the SVG draws 1:1 (no aspect distortion).
  const wrapRef = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(800)
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w && w > 0) setW(Math.round(w))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const H = 240
  const slot = W / Math.max(1, n)
  const barW = slot * 0.72
  const ticks = 4

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between mb-2 gap-2">
        <h3 className="text-sm font-medium text-ink">{title}</h3>
        <div className="text-xs text-ink-secondary tabular-nums">
          {hover ? (
            <>
              <span className="font-medium text-ink">{fmtYMDHM(hover.ts)}</span>
              {' • Δ '}
              {fmtNice(hover.delta, 3)}
            </>
          ) : (
            <>max Δ: {fmtNice(max, 3)}</>
          )}
        </div>
      </div>

      <div ref={wrapRef} className="w-full bg-canvas border border-line rounded-lg overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height={H}
          role="img"
          aria-label={`${title}. ${n} bars.`}
        >
          {Array.from({ length: ticks + 1 }, (_, i) => {
            const y = (i / ticks) * H
            return (
              <line
                key={i}
                x1={0}
                y1={y}
                x2={W}
                y2={y}
                stroke="var(--color-line)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            )
          })}

          {deltas.map((d, i) => {
            const barH = (d.delta / max) * H
            const x = i * slot + (slot - barW) / 2
            const isHover = hoverIdx === i
            return (
              <g key={`${d.ts}-${i}`}>
                {isHover && <rect x={i * slot} y={0} width={slot} height={H} fill="var(--color-ink)" opacity={0.06} />}
                <rect
                  x={x}
                  y={H - barH}
                  width={barW}
                  height={barH}
                  fill={SERIES}
                  opacity={isHover ? 1 : 0.9}
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                  onTouchStart={() => setHoverIdx(i)}
                >
                  <title>{`${fmtYMDHM(d.ts)} • Δ ${fmtNice(d.delta, 3)}`}</title>
                </rect>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="flex justify-between text-[10px] sm:text-xs text-ink-muted mt-1 tabular-nums">
        <span className="truncate">{deltas[0] ? fmtMDHM(deltas[0].ts) : ''}</span>
        <span className="truncate">{n > 0 ? fmtMDHM(deltas[Math.floor(n / 2)].ts) : ''}</span>
        <span className="truncate">{deltas[n - 1] ? fmtMDHM(deltas[n - 1].ts) : ''}</span>
      </div>
    </div>
  )
}

export interface HistoryReportProps {
  /** EMS tag id queried against the proxy. */
  id: string
  /** Human-readable source name shown in the title. */
  label?: string
  /** Unit for the cumulative total (kWh, T, M³, …). */
  unit?: string
  /** Back-link target (defaults to the AM5 overview). */
  backHref?: string
  backLabel?: string
}

/**
 * Shared historical-report page: pulls a cumulative meter from the AM5 EMS
 * proxy, shows last−first total + a positive-only per-step Δ bar chart.
 * Used by every AM5 source (solar, power houses, steam, coal) — they only
 * differ by tag id, label, unit and back-link.
 */
export function HistoryReport({
  id,
  label,
  unit = 'kWh',
  backHref = '/dashboard/am5',
  backLabel = 'AM5 overview',
}: HistoryReportProps) {
  const [startLocal, setStartLocal] = useState(() => toLocalInput(startOfDay(addDays(new Date(), -1))))
  const [endLocal, setEndLocal] = useState(() => toLocalInput(endOfDay(addDays(new Date(), -1))))
  const [activeRange, setActiveRange] = useState<RangeKey>('yesterday')
  const [timeStepMode, setTimeStepMode] = useState<StepOpt>('auto')

  const [data, setData] = useState<ApiRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const idNum = useMemo(() => Number(id), [id])
  const rangeInvalid = new Date(endLocal) < new Date(startLocal)
  const startApi = useMemo(() => fmtApi(startLocal), [startLocal])
  const endApi = useMemo(() => fmtApi(endLocal), [endLocal])

  const chosenTimeStep = useMemo<Exclude<StepOpt, 'auto'>>(
    () => (timeStepMode === 'auto' ? pickAutoTimeStep(startLocal, endLocal) : timeStepMode),
    [timeStepMode, startLocal, endLocal],
  )

  const handleRangeChange = (range: RangeKey) => {
    setActiveRange(range)
    const now = new Date()
    switch (range) {
      case 'today':
        setStartLocal(toLocalInput(startOfDay(now)))
        setEndLocal(toLocalInput(endOfDay(now)))
        break
      case 'yesterday':
        setStartLocal(toLocalInput(startOfDay(addDays(now, -1))))
        setEndLocal(toLocalInput(endOfDay(addDays(now, -1))))
        break
      case 'last7':
        setStartLocal(toLocalInput(startOfDay(addDays(now, -7))))
        setEndLocal(toLocalInput(endOfDay(now)))
        break
      case 'thisWeek':
        setStartLocal(toLocalInput(startOfWeek(now)))
        setEndLocal(toLocalInput(endOfWeek(now)))
        break
      case 'custom':
        break
    }
  }

  useEffect(() => {
    if (!Number.isFinite(idNum) || !idNum || rangeInvalid) return

    const abort = new AbortController()
    let timedOut = false
    const timeout = setTimeout(() => { timedOut = true; abort.abort() }, 30_000)
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/v1/am5/proxy-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          signal: abort.signal,
          body: JSON.stringify({
            valueIds: [idNum],
            valueNames: [''],
            timeBegin: startApi,
            timeEnd: endApi,
            sqlClause: '',
            timeStep: chosenTimeStep,
          }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const raw: ApiRow[] = await res.json()
        const cleaned = (raw ?? [])
          .map((r) => ({ tagId: r.tagId, timestamp: r.timestamp, value: Number(r.value) }))
          .filter((r) => Number.isFinite(r.value) && r.timestamp)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

        setData(cleaned)
      } catch (e: unknown) {
        if (timedOut) setError('Request timed out — the EMS server took too long to respond.')
        else if ((e as Error)?.name !== 'AbortError') setError((e as Error)?.message ?? 'Failed to fetch data')
      } finally {
        clearTimeout(timeout)
        setLoading(false)
      }
    }
    run()
    return () => {
      clearTimeout(timeout)
      abort.abort()
    }
  }, [idNum, startApi, endApi, chosenTimeStep, rangeInvalid])

  const totalUsed = useMemo(
    () => (data.length < 2 ? null : data[data.length - 1].value - data[0].value),
    [data],
  )

  // per-step deltas (positive-only — negatives are meter resets/rollovers)
  const deltas = useMemo(() => {
    const out: { ts: string; delta: number }[] = []
    for (let i = 1; i < data.length; i++) {
      const delta = data[i].value - data[i - 1].value
      if (delta > 0) out.push({ ts: data[i].timestamp, delta })
    }
    return out
  }, [data])

  const RANGES: { label: string; value: RangeKey }[] = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 Days', value: 'last7' },
    { label: 'This Week', value: 'thisWeek' },
    { label: 'Custom', value: 'custom' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink transition-colors mb-2">
          <ChevronLeft size={15} />
          {backLabel}
        </Link>
        <h1 className="text-2xl font-semibold text-ink mb-1">{label || `Tag ${id}`} — Historical Report</h1>
        <p className="text-sm text-ink-secondary">
          {loading ? 'Loading…' : error ? `Error: ${error}` : `${data.length} points · resolution ${chosenTimeStep}`}
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => handleRangeChange(r.value)}
                aria-pressed={activeRange === r.value}
                className={`px-3 py-2 min-h-11 md:min-h-0 rounded-lg text-sm font-medium border transition-colors ${
                  activeRange === r.value
                    ? 'bg-brand text-brand-fg border-brand'
                    : 'bg-surface text-ink-secondary border-line-strong hover:bg-canvas hover:text-ink'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {activeRange === 'custom' && (
            <label className="inline-flex items-center gap-2 text-sm text-ink-secondary">
              <span>Resolution</span>
              <select
                className="border border-line-strong bg-surface text-ink rounded-lg px-3 py-2 text-sm"
                value={timeStepMode}
                onChange={(e) => setTimeStepMode(e.target.value as StepOpt)}
                title="Aggregation interval"
              >
                <option value="auto">Auto</option>
                <option value="60,1">1 Minute</option>
                <option value="900,1">15 Minutes</option>
                <option value="3600,1">1 Hour</option>
                <option value="86400,1">1 Day</option>
              </select>
            </label>
          )}
        </div>

        {activeRange === 'custom' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label htmlFor="startTime" className="text-sm text-ink-secondary">
              Start Time
              <input
                type="datetime-local"
                id="startTime"
                value={startLocal}
                onChange={(e) => setStartLocal(e.target.value)}
                className="mt-1 block w-full border border-line-strong bg-surface text-ink rounded-lg p-2"
              />
            </label>
            <label htmlFor="endTime" className="text-sm text-ink-secondary">
              End Time
              <input
                type="datetime-local"
                id="endTime"
                value={endLocal}
                onChange={(e) => setEndLocal(e.target.value)}
                className="mt-1 block w-full border border-line-strong bg-surface text-ink rounded-lg p-2"
              />
            </label>
          </div>
        ) : (
          <p className="text-sm text-ink-secondary">
            <span className="font-medium text-ink">Time Range:</span> {fmtRangeSummary(startLocal, endLocal)}
          </p>
        )}

        {rangeInvalid && <p className="text-sm text-danger">End time must be after start time.</p>}
      </Card>

      {data.length >= 2 ? (
        <Card className="p-4 sm:p-5 space-y-1.5">
          <p className="text-sm text-ink-secondary tabular-nums">
            <span className="font-medium text-ink">Initial:</span> {fmtNice(data[0].value, 3)}
          </p>
          <p className="text-sm text-ink-secondary tabular-nums">
            <span className="font-medium text-ink">Last:</span> {fmtNice(data[data.length - 1].value, 3)}
          </p>
          <p className="text-lg font-semibold text-ink tabular-nums">{fmtNice(totalUsed, 2)} {unit}</p>
        </Card>
      ) : (
        <Card className="p-10 text-center">
          <div className="w-12 h-12 bg-surface-subtle rounded-xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 size={22} className="text-ink-muted" aria-hidden="true" />
          </div>
          <p className="text-sm text-ink-secondary">Not enough data for this range (need ≥ 2 points).</p>
        </Card>
      )}

      {deltas.length > 0 && (
        <Card className="p-4">
          <DeltaBarChart deltas={deltas} title="Per-step usage (Δ value)" />
        </Card>
      )}
    </div>
  )
}
