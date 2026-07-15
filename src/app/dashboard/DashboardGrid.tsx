'use client'

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import Link from 'next/link'
import { Zap, Flame, MapPin, ChevronRight } from 'lucide-react'
import { categoryAms, type DashboardAM, type DashboardCategory, type DashboardSubgroup } from '@/lib/dashboardCategories'

type SrcSplit = { gen: number; hfo: number; ke: number; solar: number }
type AmTotal = { power: number; steam: number; src?: SrcSplit }
type Summary = Record<string, AmTotal>

/* ── Scoped teal theme (light / dark). Follows the app's `.dark` class so the
   navbar ThemeToggle flips this too. ─────────────────────────────────────── */
const LIGHT = {
  '--bg': '#f6f7f7',
  '--card': '#ffffff',
  '--card-2': '#fafbfb',
  '--line': '#e4e5e7',
  '--line-2': '#d2d4d8',
  '--ink': '#191b1d',
  '--ink-2': '#5f6468',
  '--ink-3': '#8d9196',
  '--teal': '#0d9488',
  '--teal-deep': '#0f766e',
  '--teal-soft': '#e6f3f2',
  '--ok': '#108a5c',
  '--hfo': '#3b82a6',
  '--ke': '#64748b',
  '--sol': '#f59e0b',
} as CSSProperties

const DARK = {
  '--bg': '#0f1113',
  '--card': '#16181b',
  '--card-2': '#1b1e22',
  '--line': '#262a2e',
  '--line-2': '#363b41',
  '--ink': '#e9ebee',
  '--ink-2': '#a3a8ae',
  '--ink-3': '#70767d',
  '--teal': '#14b8a6',
  '--teal-deep': '#2dd4bf',
  '--teal-soft': '#12302b',
  '--ok': '#34d399',
  '--hfo': '#4b93b8',
  '--ke': '#94a3b8',
  '--sol': '#fbbf24',
} as CSSProperties

/* Power sources — fixed semantic colors, identical everywhere:
   GAS (self-generation on gas) = teal · HFO = blue · KE grid import = slate ·
   Solar = amber. `label` shows in the plant-wide "Power source mix" legend;
   `short` shows in the per-mill source lines (kept as "Eng"). HFO/KE segments
   only render when > 0, so HFO surfaces only while those engines are running. */
const SOURCES = [
  { key: 'gen' as const, label: 'GAS', short: 'Eng', color: 'var(--teal)' },
  { key: 'hfo' as const, label: 'HFO', short: 'HFO', color: 'var(--hfo)' },
  { key: 'ke' as const, label: 'KE grid', short: 'KE', color: 'var(--ke)' },
  { key: 'solar' as const, label: 'Solar', short: 'Sol', color: 'var(--sol)' },
]

const fmtMW = (kw: number) => (kw / 1000).toFixed(1)
const fmtTH = (th: number) => th.toFixed(1)

/** Reads the app's active theme from the `.dark` class on <html> (the navbar
    ThemeToggle is the source of truth). */
const darkSubscribe = (cb: () => void) => {
  const o = new MutationObserver(cb)
  o.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => o.disconnect()
}
const darkSnapshot = () => document.documentElement.classList.contains('dark')
function useAppDark() {
  return useSyncExternalStore(darkSubscribe, darkSnapshot, () => false)
}

/**
 * Categorized overview. Categories/AMs (already role-filtered) come from the
 * server; live Power/Steam + per-mill source split are polled from
 * `/api/v1/summary` every second and summed per category.
 */
export function DashboardGrid({ categories, name }: { categories: DashboardCategory[]; name: string }) {
  const dark = useAppDark()
  const [summary, setSummary] = useState<Summary>({})
  // Rolling 90s history of total plant power, fed by the same 1s polls.
  const [trend, setTrend] = useState<number[]>([])
  const trendRef = useRef<number[]>([])

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let controller: AbortController | undefined

    const schedule = () => { if (!cancelled) timer = setTimeout(tick, 1000) }

    async function tick() {
      if (typeof document !== 'undefined' && document.hidden) return
      controller = new AbortController()
      try {
        const res = await fetch('/api/v1/summary', { cache: 'no-store', signal: controller.signal })
        if (res.ok) {
          const json = await res.json()
          if (!cancelled && json?.data) {
            const data: Summary = json.data
            setSummary(data)
            let total = 0
            for (const k of Object.keys(data)) total += data[k]?.power ?? 0
            trendRef.current = [...trendRef.current, total].slice(-90)
            setTrend(trendRef.current)
          }
        }
      } catch {
        /* keep last-good totals on a failed tick */
      } finally {
        if (!cancelled) schedule()
      }
    }

    const onVisible = () => { if (!cancelled && !document.hidden) { if (timer) clearTimeout(timer); tick() } }

    tick()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      controller?.abort()
      if (timer) clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const allAms = categories.flatMap(categoryAms)
  const onlineCount = allAms.filter((a) => a.live).length
  let plantPower = 0, plantSteam = 0
  for (const a of allAms) { const t = summary[a.id]; if (t) { plantPower += t.power; plantSteam += t.steam } }

  // Plant-level source mix, summed across all reporting mills.
  const srcTotals: SrcSplit = { gen: 0, hfo: 0, ke: 0, solar: 0 }
  for (const a of allAms) {
    const s = summary[a.id]?.src
    if (s) { srcTotals.gen += s.gen; srcTotals.hfo += s.hfo; srcTotals.ke += s.ke; srcTotals.solar += s.solar }
  }
  const srcSum = srcTotals.gen + srcTotals.hfo + srcTotals.ke + srcTotals.solar

  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div style={{ ...(dark ? DARK : LIGHT), colorScheme: dark ? 'dark' : 'light' } as CSSProperties} className="text-[var(--ink)]">
      {/* Greeting */}
      <p className="text-[13px] text-[var(--ink-3)]">{today}</p>
      <h1 className="text-xl font-bold tracking-tight mt-0.5 mb-4">Good day, {name}</h1>

      {/* ── Hero: totals + live sparkline + source mix ── */}
      <section className="rounded-2xl bg-[var(--card)] border border-[var(--line)] shadow-[0_1px_3px_rgba(25,27,29,0.06)] overflow-hidden mb-5">
        <div className="p-5 sm:p-6 pb-0">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-[var(--ink-2)]">Total power generation</p>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--ok)] bg-[var(--teal-soft)] rounded-full px-2.5 py-1">
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--ok)] opacity-50 animate-ping" />
                <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-[var(--ok)]" />
              </span>
              Live
            </span>
          </div>
          <div className="mt-2 flex items-end justify-between gap-4 flex-wrap">
            <p className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold tabular-nums tracking-tight leading-none text-[var(--teal-deep)]">{fmtMW(plantPower)}</span>
              <span className="text-lg font-semibold text-[var(--ink-3)]">MW</span>
            </p>
            <div className="flex items-center gap-5 pb-1">
              <p className="flex items-baseline gap-1.5">
                <Flame size={14} className="self-center text-[var(--ink-3)]" />
                <span className="text-xl font-bold tabular-nums leading-none">{fmtTH(plantSteam)}</span>
                <span className="text-[11px] font-medium text-[var(--ink-3)]">T/H</span>
              </p>
              <p className="flex items-baseline gap-1.5">
                <Zap size={14} className="self-center text-[var(--ink-3)]" />
                <span className="text-xl font-bold tabular-nums leading-none">{onlineCount}<span className="text-[var(--ink-3)]">/{allAms.length}</span></span>
                <span className="text-[11px] font-medium text-[var(--ink-3)]">online</span>
              </p>
            </div>
          </div>
        </div>

        {/* live sparkline — total power, grows as you watch */}
        <Sparkline data={trend} />

        {/* power source mix — engines vs KE grid vs solar, plant-wide */}
        <div className="px-5 sm:px-6 pb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-3)]">Power source mix</p>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden bg-[var(--bg)]">
            {srcSum > 0 && SOURCES.map((s) => (
              srcTotals[s.key] > 0 ? (
                <div
                  key={s.key}
                  className="h-full transition-all duration-700"
                  style={{ width: `${(srcTotals[s.key] / srcSum) * 100}%`, backgroundColor: s.color }}
                  title={`${s.label} · ${fmtMW(srcTotals[s.key])} MW`}
                />
              ) : null
            ))}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
            {SOURCES.map((s) => (
              srcTotals[s.key] > 0 ? (
                <span key={s.key} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--ink-2)] tabular-nums">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.label}
                  <span className="text-[var(--ink-3)]">{fmtMW(srcTotals[s.key])} MW · {srcSum > 0 ? Math.round((srcTotals[s.key] / srcSum) * 100) : 0}%</span>
                </span>
              ) : null
            ))}
          </div>
        </div>
      </section>

      {/* ── Mill groups: professional list rows ── */}
      <div className="space-y-5">
        {categories.map((cat) => {
          const mills = categoryAms(cat)
          let cp = 0, cs = 0
          for (const a of mills) { const t = summary[a.id]; if (t) { cp += t.power; cs += t.steam } }
          const on = mills.filter((a) => a.live).length
          return (
            <section key={cat.name}>
              <div className="flex items-baseline justify-between px-1 mb-2">
                <h2 className="text-[15px] font-bold tracking-tight">{cat.name}</h2>
                <span className="text-xs text-[var(--ink-3)]">{on} of {mills.length} online</span>
              </div>

              <div className="rounded-xl bg-[var(--card)] border border-[var(--line)] shadow-[0_1px_3px_rgba(25,27,29,0.06)] overflow-hidden">
                {/* group subtotal strip */}
                <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[var(--line)] bg-[var(--card-2)] text-xs tabular-nums">
                  <span className="inline-flex items-center gap-1.5 text-[var(--ink-2)]">
                    <Zap size={13} className="text-[var(--teal)]" />
                    <b className="font-semibold text-[var(--ink)]">{fmtMW(cp)}</b> MW
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[var(--ink-2)]">
                    <Flame size={13} className="text-[var(--teal)]" />
                    <b className="font-semibold text-[var(--ink)]">{fmtTH(cs)}</b> T/H
                  </span>
                </div>

                {cat.subgroups?.map((g) => (
                  <ClusterBand key={g.name} group={g} summary={summary} />
                ))}
                {cat.ams.map((am) => (
                  <MillRow key={am.id} am={am} t={summary[am.id]} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

/* ── Live sparkline (SVG, no library, single hue) ───────────── */

function Sparkline({ data }: { data: number[] }) {
  const W = 600
  const H = 64
  if (data.length < 2) {
    return <div className="h-16 mx-5 sm:mx-6 mb-4 rounded-lg bg-[var(--bg)] animate-pulse" aria-hidden="true" />
  }
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = Math.max(max - min, max * 0.02, 1)
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - 6 - ((v - min) / span) * (H - 16)
    return [x, y] as const
  })
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${W},${H} L0,${H} Z`
  const last = pts[pts.length - 1]

  return (
    <div className="px-5 sm:px-6 pb-3" aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-16 block">
        <defs>
          <linearGradient id="dash-spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--teal)', stopOpacity: 0.18 }} />
            <stop offset="100%" style={{ stopColor: 'var(--teal)', stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#dash-spark-fill)" />
        <path d={line} fill="none" style={{ stroke: 'var(--teal)' }} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <circle cx={last[0]} cy={last[1]} r="3.5" style={{ fill: 'var(--teal)' }} />
        <circle cx={last[0]} cy={last[1]} r="7" style={{ fill: 'var(--teal)' }} opacity="0.25">
          <animate attributeName="r" values="4;9;4" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.06;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
      <p className="mt-1 text-[10px] text-[var(--ink-3)]">Total power · last {data.length}s</p>
    </div>
  )
}

/* ── Components ─────────────────────────────────────────────── */

function ClusterBand({ group, summary }: { group: DashboardSubgroup; summary: Summary }) {
  let p = 0, s = 0, has = false
  for (const am of group.ams) { const t = summary[am.id]; if (t) { p += t.power; s += t.steam; has = true } }

  const head = (
    <>
      <span className="flex items-center gap-2 min-w-0">
        <span className="w-6 h-6 rounded-md bg-[var(--teal-soft)] text-[var(--teal-deep)] flex items-center justify-center shrink-0">
          <MapPin size={12} />
        </span>
        <span className="text-[13px] font-semibold truncate">{group.name}</span>
        {group.id && <ChevronRight size={13} className="text-[var(--ink-3)] shrink-0" aria-hidden="true" />}
        <span className="text-[11px] text-[var(--ink-3)]">· {group.ams.length} mills</span>
      </span>
      {has && (
        <span className="hidden sm:flex items-center gap-3 text-[11px] text-[var(--ink-2)] tabular-nums shrink-0">
          <span><b className="font-semibold text-[var(--ink)]">{fmtMW(p)}</b> MW</span>
          <span><b className="font-semibold text-[var(--ink)]">{fmtTH(s)}</b> T/H</span>
        </span>
      )}
    </>
  )

  return (
    <>
      {group.id ? (
        <Link href={`/dashboard/${group.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[var(--line)] bg-[var(--teal-soft)]/40 active:bg-[var(--teal-soft)] hover:bg-[var(--teal-soft)]/70 transition-colors">
          {head}
        </Link>
      ) : (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[var(--line)] bg-[var(--teal-soft)]/40">{head}</div>
      )}
      {group.ams.map((am) => <MillRow key={am.id} am={am} t={summary[am.id]} inset />)}
    </>
  )
}

/** Per-mill source breakdown: slim segmented bar + live MW per active source. */
function SourceLine({ src }: { src: SrcSplit }) {
  const sum = src.gen + src.hfo + src.ke + src.solar
  if (sum <= 0) return null
  const active = SOURCES.filter((s) => src[s.key] > 0)
  return (
    <span className="mt-1.5 block max-w-[240px]">
      <span className="flex h-1 rounded-full overflow-hidden bg-[var(--line)]">
        {active.map((s) => (
          <span
            key={s.key}
            className="block h-full transition-all duration-700"
            style={{ width: `${(src[s.key] / sum) * 100}%`, backgroundColor: s.color }}
          />
        ))}
      </span>
      <span className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[10px] font-medium text-[var(--ink-3)] tabular-nums">
        {active.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.short} <b className="font-semibold text-[var(--ink-2)]">{fmtMW(src[s.key])}</b>
          </span>
        ))}
      </span>
    </span>
  )
}

function MillRow({ am, t, inset }: { am: DashboardAM; t?: AmTotal; inset?: boolean }) {
  return (
    <Link
      href={`/dashboard/${am.id}`}
      className={`flex items-center gap-3 min-h-[60px] px-4 py-3 border-b border-[var(--line)] last:border-b-0 active:bg-[var(--bg)] hover:bg-[var(--card-2)] transition-colors ${inset ? 'pl-6' : ''}`}
    >
      {/* name + status + source line */}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold leading-tight truncate">{am.label}</span>
          {am.live ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--ok)] bg-[var(--teal-soft)] rounded-full px-1.5 py-px shrink-0">
              <span className="w-1 h-1 rounded-full bg-[var(--ok)]" />
              Online
            </span>
          ) : (
            <span className="text-[10px] font-medium text-[var(--ink-3)] bg-[var(--bg)] rounded-full px-1.5 py-px shrink-0">Coming Soon</span>
          )}
        </span>
        {am.live && t?.src && <SourceLine src={t.src} />}
      </span>

      {/* readouts */}
      {am.live && t ? (
        <span className="text-right tabular-nums shrink-0 leading-tight">
          <span className="block text-sm font-bold">{fmtMW(t.power)} <span className="text-[10px] font-medium text-[var(--ink-3)]">MW</span></span>
          <span className="block text-xs font-semibold text-[var(--ink-2)]">{fmtTH(t.steam)} <span className="text-[10px] font-medium text-[var(--ink-3)]">T/H</span></span>
        </span>
      ) : null}

      <ChevronRight size={16} className="shrink-0 text-[var(--line-2)]" aria-hidden="true" />
    </Link>
  )
}
