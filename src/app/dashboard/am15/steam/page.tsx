// /dashboard/am15/steam/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, BarChart3, Flame } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface AM15Steam {
  id: number
  STEAM_FLOW_T_1: number
  STEAM_FLOW_T_2: number
  STEAM_TOWERS_ERROR: number
}

type TowerCfg = {
  id: string
  label: string
  capacity: number // T/H
  flow: keyof AM15Steam
}

// Both towers share one error flag (STEAM_TOWERS_ERROR).
const TOWERS: TowerCfg[] = [
  { id: 'ST1', label: 'Tower 1', capacity: 10, flow: 'STEAM_FLOW_T_1' },
  { id: 'ST2', label: 'Tower 2', capacity: 2, flow: 'STEAM_FLOW_T_2' },
]

function statusOf(error: number, flow: number): { text: string; color: string } {
  if (error > 0) return { text: 'FAULT', color: 'var(--color-danger)' }
  if (flow === 0) return { text: 'OFF', color: 'var(--color-ink-muted)' }
  return { text: 'RUNNING', color: '#22a06b' }
}

async function getData() {
  const res = await fetch('/api/v1/am15/powerhouse', {
    method: 'GET',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error('Failed to fetch data')
  return res.json()
}

const R = 54
const SW = 12
const C = 2 * Math.PI * R

export default function AM15SteamPage() {
  const [data, setData] = useState<AM15Steam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const refresh = async () => {
      try {
        const result = await getData()
        if (!cancelled && result?.data) {
          setData(result.data)
          setError('')
        }
      } catch {
        if (!cancelled) setError('Failed to load steam data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    refresh()
    const id = setInterval(refresh, 1000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  const row = data[0]

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/am15"
          className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink transition-colors mb-2"
        >
          <ChevronLeft size={15} />
          AM15 overview
        </Link>
        <h1 className="text-2xl font-semibold text-ink mb-1">AM15 Steam</h1>
        <p className="text-sm text-ink-secondary">Steam distribution flow and tower status.</p>
      </div>

      <div className="max-w-2xl">
        {loading ? (
          <SteamSkeleton />
        ) : error && !row ? (
          <SteamError message={error} />
        ) : !row ? (
          <SteamEmpty />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {TOWERS.map((t) => (
              <SteamCard key={t.id} cfg={t} flow={row[t.flow] ?? 0} error={row.STEAM_TOWERS_ERROR ?? 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SteamCard({ cfg, flow, error }: { cfg: TowerCfg; flow: number; error: number }) {
  const pct = cfg.capacity > 0 ? Math.min(Math.max((flow / cfg.capacity) * 100, 0), 100) : 0
  const status = statusOf(error, flow)
  const dash = (pct / 100) * C

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-ink-muted" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-ink">{cfg.label}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: status.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
            {status.text}
          </span>
          <Link
            href={`/dashboard/am15/powerhouse/${cfg.id}`}
            aria-label={`View historical report for ${cfg.label}`}
            className="w-11 h-11 md:w-8 md:h-8 -mr-1 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
          >
            <BarChart3 size={16} />
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 shrink-0">
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full -rotate-90"
            role="img"
            aria-label={`${cfg.label}: ${Math.round(pct)}% of capacity, status ${status.text}`}
          >
            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-surface-subtle)" strokeWidth={SW} />
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke={status.color}
              strokeWidth={SW}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${C - dash}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-ink tabular-nums">
            {Math.round(pct)}%
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-2xl font-bold text-ink tabular-nums leading-none">
            {flow.toLocaleString()}
            <span className="ml-1 text-sm font-medium text-ink-secondary">T/H</span>
          </p>
          <p className="mt-1.5 text-xs text-ink-muted">of {cfg.capacity.toLocaleString()} T/H capacity</p>
        </div>
      </div>
    </Card>
  )
}

/* ── States ──────────────────────────────────────────────────────── */

function SteamSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i} className="p-4 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-20 rounded bg-surface-subtle" />
            <div className="h-4 w-16 rounded bg-surface-subtle" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full border-[12px] border-surface-subtle shrink-0" />
            <div className="space-y-2">
              <div className="h-6 w-20 rounded bg-surface-subtle" />
              <div className="h-3 w-24 rounded bg-surface-subtle" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

function SteamEmpty() {
  return (
    <Card className="p-10 text-center">
      <Flame size={24} className="mx-auto mb-3 text-ink-muted" aria-hidden="true" />
      <h2 className="text-base font-semibold text-ink mb-1">No steam data</h2>
      <p className="text-sm text-ink-secondary">There&apos;s no steam data to show right now.</p>
    </Card>
  )
}

function SteamError({ message }: { message: string }) {
  return (
    <Card className="p-10 text-center">
      <div className="w-12 h-12 bg-danger-bg rounded-xl flex items-center justify-center mx-auto mb-4">
        <Flame size={22} className="text-danger" aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold text-ink mb-1">Couldn&apos;t load data</h2>
      <p className="text-sm text-ink-secondary mb-5">{message}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex items-center justify-center h-9 px-4 rounded-lg border border-line-strong text-sm font-medium text-ink hover:bg-canvas transition-colors"
      >
        Try again
      </button>
    </Card>
  )
}
