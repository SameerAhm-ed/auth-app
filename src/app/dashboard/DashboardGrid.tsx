'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap, Flame, Factory, MapPin, Shirt, Layers, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { categoryAms, type DashboardAM, type DashboardCategory, type DashboardSubgroup } from '@/lib/dashboardCategories'

type AmTotal = { power: number; steam: number }
type Summary = Record<string, AmTotal>
type IconCmp = React.ComponentType<{ size?: number; className?: string }>

const CATEGORY_ICONS: Record<string, IconCmp> = {
  'map-pin': MapPin,
  shirt: Shirt,
  factory: Factory,
  layers: Layers,
}

const ONLINE = '#22a06b' // status green (matches engineStatus RUNNING)
const fmtMW = (kw: number) => (kw / 1000).toFixed(1)
const fmtTH = (th: number) => th.toFixed(1)
const monogram = (label: string) => label.replace(/^AM\s*/i, '') || label

/**
 * Categorized overview. Categories/AMs (already role-filtered) come from the
 * server; combined Power/Steam totals are polled live from `/api/v1/summary`
 * and summed per category over the AMs that report data.
 */
export function DashboardGrid({ categories }: { categories: DashboardCategory[] }) {
  const [summary, setSummary] = useState<Summary>({})

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
          if (!cancelled && json?.data) setSummary(json.data)
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
  let plantPower = 0
  let plantSteam = 0
  for (const a of allAms) {
    const t = summary[a.id]
    if (t) {
      plantPower += t.power
      plantSteam += t.steam
    }
  }

  return (
    <div className="space-y-6">
      {/* Plant-wide summary */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <SummaryStat icon={Zap} label="Total power" value={fmtMW(plantPower)} unit="MW" />
        <SummaryStat icon={Flame} label="Total steam" value={fmtTH(plantSteam)} unit="T/H" />
        <SummaryStat icon={Factory} label="Mills online" value={String(onlineCount)} unit={`/ ${allAms.length}`} />
      </div>

      {/* Category panels */}
      <div className="space-y-4">
        {categories.map((category) => {
          const Icon = CATEGORY_ICONS[category.icon] ?? Factory
          const mills = categoryAms(category)
          let power = 0
          let steam = 0
          let hasData = false
          for (const am of mills) {
            const t = summary[am.id]
            if (t) {
              power += t.power
              steam += t.steam
              hasData = true
            }
          }
          const liveCount = mills.filter((a) => a.live).length

          return (
            <Card key={category.name} className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-surface-subtle text-ink flex items-center justify-center shrink-0">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-ink truncate">{category.name}</p>
                    <p className="text-xs text-ink-muted">
                      {mills.length} {mills.length === 1 ? 'mill' : 'mills'}
                    </p>
                  </div>
                </div>

                {hasData ? (
                  <div className="flex items-center gap-2">
                    <StatChip icon={Zap} value={fmtMW(power)} unit="MW" />
                    <StatChip icon={Flame} value={fmtTH(steam)} unit="T/H" />
                  </div>
                ) : liveCount === 0 ? (
                  <span className="text-xs text-ink-muted">Setup pending</span>
                ) : null}
              </div>

              {/* Subgroups (recessed clusters), then direct mills */}
              <div className="space-y-4">
                {category.subgroups?.map((group) => (
                  <SubgroupPanel key={group.name} group={group} summary={summary} />
                ))}

                {category.ams.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {category.ams.map((am) => (
                      <MillTile key={am.id} am={am} total={summary[am.id]} />
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function SubgroupPanel({ group, summary }: { group: DashboardSubgroup; summary: Summary }) {
  let power = 0
  let steam = 0
  let hasData = false
  for (const am of group.ams) {
    const t = summary[am.id]
    if (t) { power += t.power; steam += t.steam; hasData = true }
  }

  const headerInner = (
    <>
      <span className="flex items-center gap-2.5 min-w-0">
        <span className="w-7 h-7 rounded-lg bg-surface border border-line text-ink-secondary flex items-center justify-center shrink-0">
          <MapPin size={14} />
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-1 text-sm font-semibold text-ink">
            <span className="truncate">{group.name}</span>
            {group.id && (
              <ChevronRight size={14} className="shrink-0 text-ink-muted group-hover:text-ink group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
            )}
          </span>
          <span className="block text-[11px] text-ink-muted">
            {group.ams.length} {group.ams.length === 1 ? 'mill' : 'mills'}
          </span>
        </span>
      </span>
      {hasData && (
        <span className="flex items-center gap-2 shrink-0">
          <StatChip icon={Zap} value={fmtMW(power)} unit="MW" />
          <StatChip icon={Flame} value={fmtTH(steam)} unit="T/H" />
        </span>
      )}
    </>
  )

  return (
    <div className="rounded-xl border border-line bg-canvas p-3">
      {group.id ? (
        <Link
          href={`/dashboard/${group.id}`}
          className="group flex items-center justify-between gap-3 flex-wrap rounded-lg px-1 py-1 mb-3 -mx-1 hover:bg-surface-subtle transition-colors"
        >
          {headerInner}
        </Link>
      ) : (
        <div className="flex items-center justify-between gap-3 flex-wrap px-1 py-1 mb-3">{headerInner}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {group.ams.map((am) => (
          <MillTile key={am.id} am={am} total={summary[am.id]} />
        ))}
      </div>
    </div>
  )
}

function MillTile({ am, total }: { am: DashboardAM; total?: AmTotal }) {
  return (
    <Link
      href={`/dashboard/${am.id}`}
      className="group flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 hover:border-line-strong hover:bg-canvas transition-colors"
    >
      <span
        className={`w-8 h-8 rounded-lg bg-surface-subtle text-xs font-semibold flex items-center justify-center shrink-0 ${am.live ? 'text-ink' : 'text-ink-muted'}`}
      >
        {monogram(am.label)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink truncate">{am.label}</span>
        {am.live ? (
          <>
            <span className="inline-flex items-center gap-1.5 text-xs text-ink-secondary">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ONLINE }} aria-hidden="true" />
              Online
            </span>
            {total ? (
              <span className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-secondary tabular-nums">
                <span className="inline-flex items-center gap-1">
                  <Zap size={12} className="text-ink-muted" aria-hidden="true" />
                  <span className="font-semibold text-ink">{fmtMW(total.power)}</span> MW
                </span>
                <span className="text-line-strong">·</span>
                <span className="inline-flex items-center gap-1">
                  <Flame size={12} className="text-ink-muted" aria-hidden="true" />
                  <span className="font-semibold text-ink">{fmtTH(total.steam)}</span> T/H
                </span>
              </span>
            ) : null}
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-ink-muted)' }} aria-hidden="true" />
            Coming soon
          </span>
        )}
      </span>
      <ChevronRight size={16} className="shrink-0 text-ink-muted group-hover:text-ink transition-colors" aria-hidden="true" />
    </Link>
  )
}

function SummaryStat({ icon: Icon, label, value, unit }: { icon: IconCmp; label: string; value: string; unit: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3 sm:p-4">
      <div className="flex items-center gap-1.5 text-xs text-ink-secondary mb-1">
        <Icon size={14} className="text-ink-muted" />
        <span className="truncate">{label}</span>
      </div>
      <div className="text-xl sm:text-2xl font-bold text-ink tabular-nums leading-none">
        {value}
        <span className="ml-1 text-sm font-medium text-ink-secondary">{unit}</span>
      </div>
    </div>
  )
}

function StatChip({ icon: Icon, value, unit }: { icon: IconCmp; value: string; unit: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas px-2.5 py-1 text-xs text-ink-secondary tabular-nums">
      <Icon size={14} className="text-ink-muted" />
      <span className="font-semibold text-ink">{value}</span> {unit}
    </span>
  )
}
