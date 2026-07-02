'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Flame, Gauge, Download, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

/* ───────────────── Types ──────────────── */
type TagRecord = { tagId: number; timestamp: string; value: number }
type QueryBody = { valueIds: number[]; timeBegin: string; timeEnd: string; timeStep: string }
type CostInput = number | ''
type ExportArgs = {
  start: string
  end: string
  diffs: Record<number, number>
  gasCostPerM3: number
  gasCostPerMMBtu: number
  coalCostPerTon: number
}
/** Minimal worksheet cell shapes for the XLSX export (avoids `any`). */
type CellFormula = { t: 'n'; f: string }
type CellValue = string | number | CellFormula
type XStyle = Record<string, unknown>
type XCell = { t: string; v: unknown; s?: XStyle; z?: string }
type XlsxUtils = {
  aoa_to_sheet: (data: CellValue[][]) => Record<string, unknown>
  encode_cell: (addr: { r: number; c: number }) => string
  book_new: () => Record<string, unknown>
  book_append_sheet: (wb: Record<string, unknown>, ws: Record<string, unknown>, name: string) => void
}
type XlsxModule = { utils: XlsxUtils; writeFile: (wb: Record<string, unknown>, filename: string) => void }

/* ───────────────── Config ──────────────── */
const API_URL = '/api/v1/am5/proxy-query'

/* ───────────────── Constants / Conversions ──────────────── */
const MMBTU_PER_M3 = 0.035315
/** HRSG duct conversion (m³ → ton steam) */
const HRSG_DUCT_DIVISOR = 76

/** Power House 1 */
const FREE_STEAM_1 = [133, 138, 141, 147] as const
const GAS_ID_1 = 171
/** Power House 2 */
const FREE_STEAM_2_ORDERED = [170, 153, 158, 163] as const
/** Power House 3 */
const FREE_STEAM_3_ORDERED = [4666, 4673, 4680] as const
/** Power House 4 */
const FREE_STEAM_4_ORDERED = [4687, 4694] as const

/** Gas meters */
const GAS_TOTALIZER_ID = 278 // Gas boiler totalizer (m³)
const HRSG_GAS_TOTALIZER_ID = 4658 // HRSG duct gas (m³)
/** Outsource (coal) boiler */
const COAL_CONSUMED_ID = 4649
const COAL_STEAM_ID = 177
/** Extra free-steam tag */
const HRSG_STEAM_TOTALIZER_ID = 4657 // counted inside FREE

const TAG_NAMES: Record<number, string> = {
  // PH1
  133: 'WHRB 1', 138: 'WHRB 2', 141: 'WHRB 3', 147: 'WHRB 4', 171: 'Gas fired', 278: 'Gas boiler gas totalizer',
  // PH2
  170: 'WHRB 1', 166: 'WHRB 1', 153: 'WHRB 2', 158: 'WHRB 3', 163: 'WHRB 4', 4657: 'HRSG steam totalizer', 4658: 'HRSG gas totalizer',
  // PH3
  4666: 'WHRB 1', 4673: 'WHRB 2', 4680: 'WHRB 3',
  // PH4
  4687: 'WHRB 4', 4694: 'WHRB 5',
  // Coal boiler
  4649: 'Coal consumed', 177: 'Coal boiler steam',
}

/* ───────────────── Fuel-price persistence ──────────────── */
type FuelPrices = { gasMMBtu: CostInput; gasM3: CostInput; coalTon: CostInput; dieselL: CostInput }
const FUEL_PRICES_KEY = 'steamReport.fuelPrices'

function loadFuelPrices(): FuelPrices | null {
  try {
    const raw = localStorage.getItem(FUEL_PRICES_KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    const coerce = (v: unknown): CostInput =>
      v === '' || v == null ? '' : Number.isFinite(Number(v)) ? Number(v) : ''
    return { gasMMBtu: coerce(p.gasMMBtu), gasM3: coerce(p.gasM3), coalTon: coerce(p.coalTon), dieselL: coerce(p.dieselL) }
  } catch {
    return null
  }
}
function saveFuelPrices(p: FuelPrices) {
  try {
    localStorage.setItem(FUEL_PRICES_KEY, JSON.stringify(p))
  } catch {
    /* ignore (private mode / storage disabled) */
  }
}

/* ───────────────── Utilities ──────────────── */
const pad = (n: number) => String(n).padStart(2, '0')
const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
const toApiTime = (local: string) => (local ? local.replace('T', ' ') + ':00.000' : '')

/** Default range: yesterday 08:00 → today 08:01 (a 24h production shift). */
const defaultStart = () => { const d = new Date(); d.setDate(d.getDate() - 1); d.setHours(8, 0, 0, 0); return toLocalInput(d) }
const defaultEnd = () => { const d = new Date(); d.setHours(8, 1, 0, 0); return toLocalInput(d) }

/** Frozen number format to avoid SSR/CSR locale mismatch. */
const NUMBER_FMT = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 })
const fmt = (n: number | null | undefined) =>
  n == null || Number.isNaN(n) || !Number.isFinite(n) ? '—' : NUMBER_FMT.format(Number(n))
const fmtPct = (part: number | null | undefined, total: number) =>
  part == null || Number.isNaN(part) || total <= 0
    ? '—'
    : ((part / total) * 100).toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' %'
const asNumberOrEmpty = (v: string): CostInput => {
  if (v.trim() === '') return ''
  const n = Number(v)
  return Number.isFinite(n) ? n : ''
}

export default function SteamGenerationReport() {
  const [start, setStart] = useState(defaultStart)
  const [end, setEnd] = useState(defaultEnd)
  const [data, setData] = useState<TagRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  // Fuel-price inputs (persisted to localStorage).
  // Lazy-init from localStorage (SSR-safe: loadFuelPrices try/catches and the
  // values aren't rendered until the modal opens, so no hydration mismatch).
  const [gasCostPerMMBtu, setGasCostPerMMBtu] = useState<CostInput>(() => loadFuelPrices()?.gasMMBtu ?? '')
  const [gasCostPerM3, setGasCostPerM3] = useState<CostInput>(() => loadFuelPrices()?.gasM3 ?? '')
  const [coalCostPerTon, setCoalCostPerTon] = useState<CostInput>(() => loadFuelPrices()?.coalTon ?? '')
  const [dieselCostPerLiter, setDieselCostPerLiter] = useState<CostInput>(() => loadFuelPrices()?.dieselL ?? '')
  const [showPricesModal, setShowPricesModal] = useState(false)

  // Modal: scroll-lock + close on Escape.
  useEffect(() => {
    if (!showPricesModal) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowPricesModal(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [showPricesModal])

  // Cumulative diff per tag: sum positive increases, treat drops as meter resets,
  // ignore non-positive readings (communication loss).
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

  /* Power-house totals */
  const whrbDiffs1 = FREE_STEAM_1.map((id) => diffFor(id))
  const freeSteamTotal1 = whrbDiffs1.reduce((s, v) => s + v, 0)
  const gasDiff1 = diffFor(GAS_ID_1)
  const grandTotal1 = freeSteamTotal1 + gasDiff1

  const whrbDiffs2 = FREE_STEAM_2_ORDERED.map((id) => diffFor(id))
  const freeSteamTotal2 = whrbDiffs2.reduce((s, v) => s + v, 0)
  const grandTotal2 = freeSteamTotal2

  const whrbDiffs3 = FREE_STEAM_3_ORDERED.map((id) => diffFor(id))
  const freeSteamTotal3 = whrbDiffs3.reduce((s, v) => s + v, 0)
  const grandTotal3 = freeSteamTotal3

  const whrbDiffs4 = FREE_STEAM_4_ORDERED.map((id) => diffFor(id))
  const freeSteamTotal4 = whrbDiffs4.reduce((s, v) => s + v, 0)
  const grandTotal4 = freeSteamTotal4

  /* Gas & HRSG meters */
  const gasUsedM3 = diffFor(GAS_TOTALIZER_ID)
  const gasUsedMMBtu = gasUsedM3 * MMBTU_PER_M3
  const gasAmountRsM3 = gasCostPerM3 !== '' ? gasUsedM3 * gasCostPerM3 : null

  const hrsgGasUsedM3 = diffFor(HRSG_GAS_TOTALIZER_ID)
  const hrsgDuctTons = hrsgGasUsedM3 / HRSG_DUCT_DIVISOR
  const hrsgGasUsedMMBtu = hrsgGasUsedM3 * MMBTU_PER_M3
  const hrsgGasAmountRs = gasCostPerM3 !== '' ? hrsgGasUsedM3 * gasCostPerM3 : null

  /* Coal (outsource) boiler */
  const coalConsumedDiff = diffFor(COAL_CONSUMED_ID)
  const coalSteamDiff = diffFor(COAL_STEAM_ID)
  const coalConsumedDisplay = coalConsumedDiff / 1000 // kg → ton
  const coalAmount = coalCostPerTon !== '' ? coalConsumedDisplay * coalCostPerTon : null
  const costPerTonSteam = coalAmount != null && coalSteamDiff > 0 ? coalAmount / coalSteamDiff : null

  /* HRSG steam tag (counted inside FREE) */
  const hrsgtotalizerDiff = diffFor(HRSG_STEAM_TOTALIZER_ID)
  const freeTurbineTons = hrsgtotalizerDiff - hrsgDuctTons

  /* Fuel mix (FREE / GAS / COAL) */
  const freeSteamCombined = freeSteamTotal1 + freeSteamTotal2 // WHRBs + Turbine
  const gasGen = gasDiff1 // GAS = boiler-only steam (171)
  const coalGen = coalSteamDiff
  const totalGen = freeSteamCombined + gasGen + coalGen

  const rangeInvalid = !start || !end || start >= end

  async function fetchReport(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setLoading(true)
    setData([])

    const valueIds = [
      ...FREE_STEAM_1, GAS_ID_1, ...FREE_STEAM_2_ORDERED, ...FREE_STEAM_3_ORDERED, ...FREE_STEAM_4_ORDERED,
      COAL_CONSUMED_ID, COAL_STEAM_ID, HRSG_STEAM_TOTALIZER_ID, GAS_TOTALIZER_ID, HRSG_GAS_TOTALIZER_ID,
    ]
    const body: QueryBody = { valueIds, timeBegin: toApiTime(start), timeEnd: toApiTime(end), timeStep: '3600,1' }

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

  /* ───────────────── XLSX export (HRSG duct kept inside GAS FUEL) ──────────────── */
  async function exportToXlsx({ start, end, diffs, gasCostPerM3, gasCostPerMMBtu, coalCostPerTon }: ExportArgs) {
    const mod = (await import('xlsx-js-style')) as unknown as XlsxModule & { default?: XlsxModule }
    const XLSX: XlsxModule = mod.default ?? mod
    const { utils, writeFile } = XLSX

    const d = (id: number) => Number(diffs[id] ?? 0)

    // FREE block
    const FREE_TURBINE = freeTurbineTons
    const WHRB1 = d(133) + d(138) + d(141) + d(147)
    const WHRB2 = d(170) + d(153) + d(158) + d(163)
    const WHRB3 = d(4666) + d(4673) + d(4680)
    const WHRB4 = d(4687) + d(4694)
    const FREE_TOTAL = FREE_TURBINE + WHRB1 + WHRB2 + WHRB3 + WHRB4

    // GAS (boiler) & HRSG duct
    const GAS_TON = d(171)
    const GAS_M3 = d(278)
    const GAS_MMBTU = GAS_M3 * MMBTU_PER_M3
    const GAS_AMOUNT_RS = GAS_M3 * (Number(gasCostPerM3) || 0)
    const GAS_COST_RS_PER_TON = GAS_TON > 0 ? GAS_AMOUNT_RS / GAS_TON : 0

    const HRSG_GAS_M3 = d(4658)
    const HRSG_DUCT_TON = HRSG_GAS_M3 / HRSG_DUCT_DIVISOR
    const HRSG_GAS_MMBTU = HRSG_GAS_M3 * MMBTU_PER_M3
    const HRSG_GAS_AMOUNT_RS = HRSG_GAS_M3 * (Number(gasCostPerM3) || 0)
    const HRSG_COST_RS_PER_TON = HRSG_DUCT_TON > 0 ? HRSG_GAS_AMOUNT_RS / HRSG_DUCT_TON : 0

    const GAS_TON_TOTAL = HRSG_DUCT_TON + GAS_TON
    const GAS_M3_TOTAL = HRSG_GAS_M3 + GAS_M3
    const GAS_MMBTU_TOTAL = HRSG_GAS_MMBTU + GAS_MMBTU
    const GAS_AMOUNT_RS_TOTAL = HRSG_GAS_AMOUNT_RS + GAS_AMOUNT_RS
    const GAS_COST_RS_PER_TON_TOTAL = GAS_TON_TOTAL > 0 ? GAS_AMOUNT_RS_TOTAL / GAS_TON_TOTAL : 0

    // COAL (outsourced)
    const COAL_TON_STEAM = d(177)
    const COAL_CONS_TON = d(4649) / 1000
    const COAL_AMOUNT_RS = COAL_CONS_TON * (Number(coalCostPerTon) || 0)
    const COAL_COST_RS_PER_TON = COAL_TON_STEAM > 0 ? COAL_AMOUNT_RS / COAL_TON_STEAM : 0

    // Mix + fuel-cost summary (HRSG not counted in GAS generation)
    const FREE_GEN = FREE_TOTAL
    const GAS_GEN = GAS_TON
    const COAL_GEN = COAL_TON_STEAM
    const TOTAL_GEN = FREE_GEN + GAS_GEN + COAL_GEN

    const COST_GAS = GAS_AMOUNT_RS
    const COST_HRSG = HRSG_GAS_AMOUNT_RS
    const COST_COAL = COAL_AMOUNT_RS
    const COST_TOTAL = COST_GAS + COST_HRSG + COST_COAL
    const COST_PER_TON_WITH_FREE = TOTAL_GEN > 0 ? COST_TOTAL / TOTAL_GEN : 0
    const nonFreeGen = GAS_GEN + COAL_GEN
    const COST_PER_TON_WO_FREE = nonFreeGen > 0 ? COST_TOTAL / nonFreeGen : 0

    const startDt = new Date(start)
    const endDt = new Date(end)
    const days = Math.max(0, Math.round((+endDt - +startDt) / 86_400_000))
    const monthHdr = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(startDt).toUpperCase()

    const BORDER = {
      top: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
    }
    const sTitle: XStyle = { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center', vertical: 'center' }, border: BORDER }
    const sBand: XStyle = { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' }, fill: { fgColor: { rgb: 'EDEDED' } }, border: BORDER }
    const sHdr: XStyle = { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' }, border: BORDER }
    const sR: XStyle = { alignment: { horizontal: 'right', vertical: 'center' }, border: BORDER }
    const sL: XStyle = { alignment: { horizontal: 'left', vertical: 'center' }, border: BORDER }
    const sGreen: XStyle = { fill: { fgColor: { rgb: 'D8EAD8' } }, border: BORDER }
    const sNote: XStyle = { fill: { fgColor: { rgb: 'FBE6D5' } }, font: { bold: true }, alignment: { horizontal: 'left', vertical: 'center' }, border: BORDER }
    const num0 = '#,##0', num2 = '#,##0.00', num3 = '#,##0.00', money = '#,##0'

    const rows: CellValue[][] = Array.from({ length: 120 }, () => Array(40).fill('') as CellValue[])
    const A = (r: number, c: number) => utils.encode_cell({ r, c })
    const set = (r: number, c: number, v: CellValue) => { rows[r][c] = v }

    // Title & date/days. Show the actual fetched range (start → end) + day count.
    const fmtGB = (d: Date) => new Intl.DateTimeFormat('en-GB').format(d)
    set(3, 2, `STEAM GENERATION REPORT - ${monthHdr}`)
    set(3, 12, 'DATE'); set(3, 13, `${fmtGB(startDt)} – ${fmtGB(endDt)}`)
    set(4, 12, 'DAYS'); set(4, 13, days)

    // Prices (right)
    set(6, 11, 'GAS'); set(6, 12, gasCostPerMMBtu || 0); set(6, 13, 'Rs./mmbtu')
    set(7, 11, 'GAS'); set(7, 12, gasCostPerM3 || 0); set(7, 13, 'Rs./m3')
    set(8, 11, 'COAL'); set(8, 12, coalCostPerTon || 0); set(8, 13, 'Rs./ton')
    set(9, 11, 'DIESEL'); set(9, 12, 0); set(9, 13, 'Rs./liter')

    // FREE
    set(7, 1, 'FREE'); set(7, 3, 'GENERATION')
    ;['TURBINE', 'WHRB 1', 'WHRB 2', 'WHRB 3', 'WHRB 4', 'TOTAL'].forEach((h, i) => set(8, 3 + i, h))
    set(9, 1, 'UNITS'); set(9, 2, 'tons')
    ;[FREE_TURBINE, WHRB1, WHRB2, WHRB3, WHRB4, FREE_TOTAL].forEach((v, i) => set(9, 3 + i, v))

    // GAS FUEL (with HRSG DUCT inside)
    set(11, 1, 'GAS FUEL'); set(11, 3, 'GENERATION')
    set(13, 1, 'UNITS'); set(13, 2, 'tons')
    set(12, 3, 'HRSG DUCT'); set(12, 4, 'GAS BOILER'); set(12, 5, 'TOTAL')
    set(13, 3, HRSG_DUCT_TON); set(13, 4, GAS_TON); set(13, 5, GAS_TON_TOTAL)
    set(14, 1, 'GAS'); set(14, 2, 'm3'); set(14, 3, HRSG_GAS_M3); set(14, 4, GAS_M3); set(14, 5, GAS_M3_TOTAL)
    set(15, 1, 'GAS'); set(15, 2, 'mmbtu'); set(15, 3, HRSG_GAS_MMBTU); set(15, 4, GAS_MMBTU); set(15, 5, GAS_MMBTU_TOTAL)
    set(16, 1, 'AMOUNT'); set(16, 2, 'Rs.'); set(16, 3, HRSG_GAS_AMOUNT_RS); set(16, 4, GAS_AMOUNT_RS); set(16, 5, GAS_AMOUNT_RS_TOTAL)
    set(17, 1, 'COST'); set(17, 2, 'Rs./ton'); set(17, 3, HRSG_COST_RS_PER_TON); set(17, 4, GAS_COST_RS_PER_TON); set(17, 5, GAS_COST_RS_PER_TON_TOTAL)

    // COAL FUEL
    set(20, 1, 'COAL FUEL'); set(20, 3, 'GENERATION')
    set(21, 3, 'COAL BOILER'); set(21, 4, 'TOTAL')
    set(22, 1, 'UNITS'); set(22, 2, 'tons'); set(22, 3, COAL_TON_STEAM); set(22, 4, COAL_TON_STEAM)
    set(23, 1, 'COAL'); set(23, 2, 'tons'); set(23, 3, COAL_CONS_TON); set(23, 4, COAL_CONS_TON)
    set(24, 1, 'AMOUNT'); set(24, 2, 'Rs.'); set(24, 3, COAL_AMOUNT_RS); set(24, 4, COAL_AMOUNT_RS)
    set(25, 1, 'COST'); set(25, 2, 'Rs./ton'); set(25, 3, COAL_COST_RS_PER_TON); set(25, 4, COAL_COST_RS_PER_TON)

    // Right table 1: Fuel / Generation / Share%
    set(11, 11, 'Fuel'); set(11, 12, 'Generation (ton)'); set(11, 13, 'Share %')
    set(12, 11, 'FREE'); set(12, 12, FREE_GEN); set(12, 13, { t: 'n', f: `IF(${A(12, 12)}>0,${A(12, 12)}/${A(15, 12)},0)` })
    set(13, 11, 'GAS'); set(13, 12, GAS_GEN); set(13, 13, { t: 'n', f: `IF(${A(13, 12)}>=0,${A(13, 12)}/${A(15, 12)},0)` })
    set(14, 11, 'COAL'); set(14, 12, COAL_GEN); set(14, 13, { t: 'n', f: `IF(${A(14, 12)}>=0,${A(14, 12)}/${A(15, 12)},0)` })
    set(15, 11, 'TOTAL'); set(15, 12, TOTAL_GEN); set(15, 13, 1)

    // Right table 2: Fuel / Cost / Share%
    set(19, 11, 'Fuel'); set(19, 12, 'Cost'); set(19, 13, 'Share %')
    set(20, 11, 'FREE'); set(20, 12, 0); set(20, 13, { t: 'n', f: `IF(${A(23, 12)}>0,${A(20, 12)}/${A(23, 12)},0)` })
    set(21, 11, 'GAS'); set(21, 12, GAS_AMOUNT_RS); set(21, 13, { t: 'n', f: `IF(${A(23, 12)}>0,${A(21, 12)}/${A(23, 12)},0)` })
    set(22, 11, 'HRSG'); set(22, 12, HRSG_GAS_AMOUNT_RS); set(22, 13, { t: 'n', f: `IF(${A(23, 12)}>0,${A(22, 12)}/${A(23, 12)},0)` })
    set(23, 11, 'COAL'); set(23, 12, COAL_AMOUNT_RS); set(23, 13, { t: 'n', f: `IF(${A(23, 12)}>0,${A(23, 12)}/${A(23, 12)},0)` })
    set(24, 11, 'TOTAL'); set(24, 12, { t: 'n', f: `${A(20, 12)}+${A(21, 12)}+${A(22, 12)}+${A(23, 12)}` }); set(24, 13, 1)

    // Bottom fuel-cost rows
    set(26, 11, 'Fuel Cost'); set(26, 12, COST_PER_TON_WITH_FREE); set(26, 13, 'Rs./ton'); set(26, 14, 'W. FREE ST')
    set(27, 11, 'Fuel Cost'); set(27, 12, COST_PER_TON_WO_FREE); set(27, 13, 'Rs./ton'); set(27, 14, 'W.O. FREE ST')

    // NOTE band
    set(27, 1, 'NOTE'); set(27, 2, 'Natural Gas rates based on latest bill.')

    const ws = utils.aoa_to_sheet(rows)
    ws['!merges'] = [
      { s: { r: 3, c: 2 }, e: { r: 3, c: 11 } },
      // NOTE: the DATE/DAYS label (col 12) and value (col 13) are intentionally NOT
      // merged — merging them hid the value behind the label in the original.
      { s: { r: 7, c: 1 }, e: { r: 8, c: 2 } },
      { s: { r: 7, c: 3 }, e: { r: 7, c: 8 } },
      { s: { r: 11, c: 1 }, e: { r: 12, c: 2 } },
      { s: { r: 11, c: 3 }, e: { r: 11, c: 5 } },
      { s: { r: 20, c: 1 }, e: { r: 21, c: 2 } },
      { s: { r: 20, c: 3 }, e: { r: 20, c: 4 } },
      { s: { r: 27, c: 1 }, e: { r: 27, c: 7 } },
    ]
    ws['!cols'] = [2, 10, 10, 12, 12, 12, 12, 12, 12, 8, 8, 12, 14, 10, 12].map((wch) => ({ wch }))

    const style = (r1: number, c1: number, r2: number, c2: number, s: XStyle, z?: string) => {
      for (let r = r1; r <= r2; r++)
        for (let c = c1; c <= c2; c++) {
          const addr = A(r, c)
          let cell = (ws as Record<string, XCell | undefined>)[addr]
          if (!cell) { cell = { t: 's', v: '' }; ;(ws as Record<string, XCell>)[addr] = cell }
          cell.s = { ...(cell.s ?? {}), ...s }
          if (z) cell.z = z
        }
    }

    style(3, 2, 3, 11, sTitle)
    style(3, 12, 4, 13, sHdr)
    style(6, 11, 9, 13, { border: BORDER })
    style(6, 11, 9, 11, sHdr); style(6, 12, 9, 12, sR, num3); style(6, 13, 9, 13, sHdr)
    style(7, 1, 7, 2, sBand); style(7, 3, 7, 8, sBand); style(8, 3, 8, 8, sHdr)
    style(9, 1, 9, 8, { border: BORDER }); style(9, 3, 9, 8, sR, num0); style(9, 1, 9, 2, sL)
    style(11, 1, 12, 2, sBand); style(11, 3, 12, 5, sBand)
    style(13, 1, 13, 5, { border: BORDER }); style(14, 1, 18, 5, { border: BORDER })
    style(14, 3, 18, 5, sR, num3); style(15, 3, 15, 5, sR, num0); style(16, 3, 16, 5, sR, num3)
    style(17, 3, 17, 5, sR, money); style(18, 3, 18, 5, sR, num3)
    style(20, 1, 21, 2, sBand); style(20, 3, 20, 4, sBand)
    style(21, 1, 25, 4, { border: BORDER }); style(21, 3, 21, 4, sHdr); style(21, 3, 25, 4, sR, num3)
    style(24, 3, 24, 4, sR, money); style(25, 3, 25, 4, sR, num3)
    style(11, 11, 11, 13, sHdr); style(12, 11, 15, 13, { border: BORDER })
    style(12, 11, 15, 11, sHdr); style(12, 12, 15, 12, sR, num0); style(12, 13, 15, 13, sR); style(15, 11, 15, 13, sGreen)
    style(19, 11, 19, 13, sHdr); style(20, 11, 24, 13, { border: BORDER })
    style(20, 11, 24, 11, sHdr); style(20, 12, 24, 12, sR, money); style(20, 13, 24, 13, sR); style(24, 11, 24, 13, sGreen)
    style(26, 11, 27, 13, sGreen); style(26, 11, 27, 11, sL); style(26, 12, 27, 12, sR, num2)
    style(26, 13, 27, 13, sHdr); style(26, 14, 27, 14, sHdr)
    style(27, 1, 27, 1, sNote); style(27, 2, 27, 7, { ...sNote, font: { bold: false } })

    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Steam Report')
    writeFile(wb, `STEAM_GENERATION_REPORT_${monthHdr.replace(' ', '_')}.xlsx`)
  }

  const handleExportXlsx = () => {
    const diffs: Record<number, number> = {}
    new Set(data.map((d) => d.tagId)).forEach((id) => { diffs[id] = diffFor(id) })
    const num = (v: CostInput) => (v === '' ? 0 : v)
    void exportToXlsx({
      start,
      end,
      diffs,
      gasCostPerM3: num(gasCostPerM3),
      gasCostPerMMBtu: num(gasCostPerMMBtu),
      coalCostPerTon: num(coalCostPerTon),
    })
  }

  const hasData = data.length > 0

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/am5" className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink transition-colors mb-2">
          <ChevronLeft size={15} />
          AM5 overview
        </Link>
        <h1 className="text-2xl font-semibold text-ink mb-1">Steam Generation Report</h1>
        <p className="text-sm text-ink-secondary">Cumulative steam generation, fuel mix and cost across all power houses.</p>
      </div>

      {/* Report parameters */}
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
            <Button type="button" variant="secondary" icon={<Gauge size={15} />} onClick={() => setShowPricesModal(true)}>
              Fuel prices
            </Button>
            <Button type="button" variant="secondary" icon={<Download size={15} />} disabled={!hasData} onClick={handleExportXlsx}>
              Export XLSX
            </Button>
          </div>
        </form>
      </Card>

      {hasData ? (
        <>
          <PowerHouseSection
            title="Power House 1"
            sources={FREE_STEAM_1.map((id, i) => ({ label: TAG_NAMES[id] ?? `Tag ${id}`, value: whrbDiffs1[i] }))}
            freeTotal={freeSteamTotal1}
            extra={[
              { label: 'Gas fired', value: gasDiff1 },
              { label: 'Grand total', value: grandTotal1, strong: true },
            ]}
          />
          <PowerHouseSection
            title="Power House 2"
            sources={FREE_STEAM_2_ORDERED.map((id, i) => ({ label: TAG_NAMES[id] ?? `Tag ${id}`, value: whrbDiffs2[i] }))}
            freeTotal={freeSteamTotal2}
            extra={[{ label: 'Grand total', value: grandTotal2, strong: true }]}
          />
          <PowerHouseSection
            title="Power House 3"
            sources={FREE_STEAM_3_ORDERED.map((id, i) => ({ label: TAG_NAMES[id] ?? `Tag ${id}`, value: whrbDiffs3[i] }))}
            freeTotal={freeSteamTotal3}
            extra={[{ label: 'Grand total', value: grandTotal3, strong: true }]}
          />
          <PowerHouseSection
            title="Power House 4"
            sources={FREE_STEAM_4_ORDERED.map((id, i) => ({ label: TAG_NAMES[id] ?? `Tag ${id}`, value: whrbDiffs4[i] }))}
            freeTotal={freeSteamTotal4}
            extra={[{ label: 'Grand total', value: grandTotal4, strong: true }]}
          />

          {/* Gas + HRSG */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="overflow-hidden">
              <SectionHead icon={<Flame size={16} className="text-ink-muted" aria-hidden="true" />} title="Gas Boiler Consumption" />
              <div className="p-4 divide-y divide-line">
                <KvRow label="Gas used (m³)" value={fmt(gasUsedM3)} />
                <KvRow label="Gas used (MMBtu)" value={fmt(gasUsedMMBtu)} />
                <KvRow label="Cost (Rs.)" value={fmt(gasAmountRsM3)} strong />
              </div>
            </Card>
            <Card className="overflow-hidden">
              <SectionHead icon={<Flame size={16} className="text-ink-muted" aria-hidden="true" />} title="HRSG Duct" />
              <div className="p-4 divide-y divide-line">
                <KvRow label="Gas used (m³)" value={fmt(hrsgGasUsedM3)} />
                <KvRow label="Steam (tons)" value={fmt(hrsgDuctTons)} />
                <KvRow label="Gas used (MMBtu)" value={fmt(hrsgGasUsedMMBtu)} />
                <KvRow label="Cost (Rs.)" value={fmt(hrsgGasAmountRs)} strong />
              </div>
            </Card>
          </div>

          {/* Coal boiler */}
          <Card className="overflow-hidden">
            <SectionHead icon={<Flame size={16} className="text-ink-muted" aria-hidden="true" />} title="Coal Boiler (Outsource)" />
            <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatTile label="Coal consumed" value={coalConsumedDisplay} unit="tons" />
              <StatTile label="Steam generated" value={coalSteamDiff} unit="tons" />
              <StatTile label="Total cost" value={coalAmount} unit="Rs." />
              <StatTile label="Cost per ton" value={costPerTonSteam} unit="Rs./ton" />
            </div>
          </Card>

          {/* Fuel mix */}
          <Card className="overflow-hidden">
            <SectionHead icon={<Gauge size={16} className="text-ink-muted" aria-hidden="true" />} title="Fuel Mix Summary" />
            <div className="p-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-ink-muted uppercase tracking-wider border-b border-line">
                    <th className="px-3 py-2">Fuel type</th>
                    <th className="px-3 py-2 text-right">Generation (T)</th>
                    <th className="px-3 py-2 text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  <FuelRow label="FREE (WHRB + Turbine)" value={freeSteamCombined} total={totalGen} />
                  <FuelRow label="GAS (Boiler)" value={gasGen} total={totalGen} />
                  <FuelRow label="COAL (Outsource)" value={coalGen} total={totalGen} />
                  <tr className="bg-brand text-brand-fg font-semibold">
                    <td className="px-3 py-2.5">TOTAL</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmt(totalGen)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">100.0 %</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* HRSG breakdown */}
          <Card className="overflow-hidden">
            <SectionHead icon={<Flame size={16} className="text-ink-muted" aria-hidden="true" />} title="HRSG Steam Breakdown" />
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatTile label="Free turbine steam" value={freeTurbineTons} unit="tons" />
                <StatTile label="HRSG duct steam" value={hrsgDuctTons} unit="tons" />
              </div>
              <p className="mt-3 text-xs text-ink-muted italic">HRSG steam totalizer = Free turbine + HRSG duct</p>
            </div>
          </Card>
        </>
      ) : (
        !loading && (
          <Card className="p-10 text-center">
            <div className="w-12 h-12 bg-surface-subtle rounded-xl flex items-center justify-center mx-auto mb-4">
              <Flame size={22} className="text-ink-muted" aria-hidden="true" />
            </div>
            <h2 className="text-base font-semibold text-ink mb-1">No report yet</h2>
            <p className="text-sm text-ink-secondary">Pick a date range and fetch to generate the steam report.</p>
          </Card>
        )
      )}

      {showPricesModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPricesModal(false) }}
        >
          <Card role="dialog" aria-modal="true" aria-label="Fuel prices" className="w-full max-w-md max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-line sticky top-0 bg-surface">
              <h2 className="text-base font-semibold text-ink">Fuel Prices</h2>
              <button
                type="button"
                onClick={() => setShowPricesModal(false)}
                aria-label="Close"
                className="w-11 h-11 md:w-9 md:h-9 -mr-1 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <PriceInput id="gas-mmbtu" label="Gas cost (Rs. per MMBtu)" value={gasCostPerMMBtu} onChange={setGasCostPerMMBtu} />
              <PriceInput id="gas-m3" label="Gas cost (Rs. per m³)" value={gasCostPerM3} onChange={setGasCostPerM3} />
              <PriceInput id="coal-ton" label="Coal cost (Rs. per ton)" value={coalCostPerTon} onChange={setCoalCostPerTon} />
              <PriceInput id="diesel-liter" label="Diesel cost (Rs. per liter)" value={dieselCostPerLiter} onChange={setDieselCostPerLiter} />
            </div>
            <div className="flex gap-3 p-4 border-t border-line sticky bottom-0 bg-surface">
              <Button type="button" variant="secondary" fullWidth onClick={() => setShowPricesModal(false)}>Cancel</Button>
              <Button
                type="button"
                fullWidth
                onClick={() => {
                  saveFuelPrices({ gasMMBtu: gasCostPerMMBtu, gasM3: gasCostPerM3, coalTon: coalCostPerTon, dieselL: dieselCostPerLiter })
                  setShowPricesModal(false)
                }}
              >
                Save
              </Button>
            </div>
          </Card>
        </div>
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

function PowerHouseSection({
  title,
  sources,
  freeTotal,
  extra,
}: {
  title: string
  sources: { label: string; value: number }[]
  freeTotal: number
  extra?: { label: string; value: number; strong?: boolean }[]
}) {
  return (
    <Card className="overflow-hidden">
      <SectionHead icon={<Flame size={16} className="text-ink-muted" aria-hidden="true" />} title={title} />
      <div className="p-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-ink-muted uppercase tracking-wider border-b border-line">
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2 text-right">Generation (T)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sources.map((s) => (
              <tr key={s.label}>
                <td className="px-3 py-2.5 text-ink-secondary">{s.label}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-ink font-medium">{fmt(s.value)}</td>
              </tr>
            ))}
            <tr className="bg-surface-subtle font-semibold text-ink">
              <td className="px-3 py-2.5">Free steam total</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{fmt(freeTotal)}</td>
            </tr>
            {extra?.map((e) => (
              <tr key={e.label} className={e.strong ? 'bg-brand text-brand-fg font-bold' : 'bg-surface-subtle font-semibold text-ink'}>
                <td className="px-3 py-2.5">{e.label}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{fmt(e.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function KvRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className={`text-sm ${strong ? 'font-semibold text-ink' : 'text-ink-secondary'}`}>{label}</span>
      <span className={`text-sm tabular-nums ${strong ? 'font-bold text-ink' : 'font-medium text-ink'}`}>{value}</span>
    </div>
  )
}

function StatTile({ label, value, unit }: { label: string; value: number | null | undefined; unit: string }) {
  return (
    <div className="rounded-lg border border-line bg-canvas p-4">
      <div className="text-xs text-ink-muted uppercase tracking-wide mb-1">{label}</div>
      <div className="text-xl font-bold text-ink tabular-nums">{fmt(value)}</div>
      <div className="text-xs text-ink-muted mt-1">{unit}</div>
    </div>
  )
}

function FuelRow({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <tr>
      <td className="px-3 py-2.5 text-ink-secondary">{label}</td>
      <td className="px-3 py-2.5 text-right tabular-nums text-ink font-medium">{fmt(value)}</td>
      <td className="px-3 py-2.5 text-right tabular-nums text-ink-secondary">{fmtPct(value, total)}</td>
    </tr>
  )
}

function PriceInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: CostInput
  onChange: (v: CostInput) => void
}) {
  return (
    <label htmlFor={id} className="block text-sm font-medium text-ink-secondary">
      {label}
      <input
        id={id}
        type="number"
        step="any"
        value={value}
        onChange={(e) => onChange(asNumberOrEmpty(e.target.value))}
        placeholder="0"
        className="mt-1.5 block w-full border border-line-strong bg-surface text-ink rounded-lg px-3 py-2.5 text-sm"
      />
    </label>
  )
}
