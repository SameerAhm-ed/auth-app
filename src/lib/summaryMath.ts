// Pure per-AM summary computation, extracted from the /api/v1/summary route
// so both the live-DB fallback path (this file) and the standalone poller
// (poller/summaryMath.mjs — plain JS, deployed separately, can't import
// from src/) compute identically. KEEP THESE TWO FILES IN SYNC — if you
// change the math here, mirror the change in poller/summaryMath.mjs.

export type Row = Record<string, number>
export type SrcSplit = { gen: number; hfo: number; ke: number; solar: number }
// Steam source categories: gas-fired boilers, outsourced/coal boilers, biomass,
// waste-heat recovery boilers (WHRBs — includes HRSGs, which recover engine
// exhaust heat the same way).
export type SteamSplit = { gas: number; os: number; biomass: number; whrb: number }
export type AmTotal = { power: number; steam: number; src: SrcSplit; steamSrc: SteamSplit }
export type Summary = {
  am4: AmTotal
  am5: AmTotal
  am8: AmTotal
  am17: AmTotal
  am14: AmTotal
  am15: AmTotal
}

export interface SummaryInputs {
  r4: Row // AM04Powerhouse (main)
  r5: Row // dashboard (am5)
  s5: Row // Solar (am5)
  r14: Row // AM14_POWERHOUSE (main)
  r15: Row // AM17_POWERHOUSE (main) — actually AM15 data, see dashboardCategories notes
  p3: Row // powerhouse3 (am5) — real AM17 PH1
  p4: Row // AM17_PH2 (am5) — real AM17 PH2
  ph1: Row // Steam_PH1 (am5) — sub-boiler breakdown of AM5 steamph1 (gas boiler + WHRB1-4)
}

const n = (v: number | undefined) => Number(v ?? 0)

/**
 * Per-AM live totals: Power in kW, Steam in T/H, plus a source split
 * `src = { gen, hfo, ke, solar }` (gas self-generation vs HFO engines vs KE
 * grid import vs solar). The AM5 `dashboard` table physically covers AM5,
 * AM17 and AM8, so those are split out here:
 *   - AM5  = GAS (PH1 + PH2) + AM5 solar (LT-3/4/5 + AM18); steam = PH1/2 + coal boilers
 *   - AM17 = GAS (CAT + ENGINE1/2/3) + HFO (MAN + MAK1/2) + KE + AM17 solar; steam = 0 (not wired)
 *   - AM8  = AM8 solar only;                                 steam = 0
 * KE grid import belongs to AM17 (not AM5); the AM5→AM17 tie (AM5_KW) is
 * excluded from AM17 to avoid double-counting. Solar comes from the `Solar` table.
 */
const NO_STEAM: SteamSplit = { gas: 0, os: 0, biomass: 0, whrb: 0 }

export function computeSummary({ r4, r5, s5, r14, r15, p3, p4, ph1 }: SummaryInputs): Summary {
  const am5Sol = n(s5.solar3_kW) + n(s5.solar4_kW) + n(s5.solar5_kW) + n(s5.AM18_solar_kW)
  const am17Sol = n(s5.AM17_solar1_kW) + n(s5.AM17_solar2_kW) + n(s5.AM19_solar_kW) + n(s5.AM19_2_solar_kW)
  const am8Sol = n(s5.AM8_solar_kW)

  const am4Gen = n(r4.ENGINE_1_KW) + n(r4.ENGINE_2_KW) + n(r4.ENGINE_3_KW) + n(r4.ENGINE_4_KW) + n(r4.ENGINE_6_KW) + n(r4.ENGINE_7_KW)
  const am4Ke = n(r4.KE_1_KW) + n(r4.KE_2_KW) + n(r4.KE_3_KW)
  const am4Sol = n(r4.SOLAR_A_KW) + n(r4.SOLAR_B_KW) + n(r4.SOLAR_C_KW)
  const am4Biomass = n(r4.BIOMASS_STEAM_FLOW)
  const am4GasBoilers = n(r4.GB_BOSCH_STEAM) + n(r4.GB_ROBEY_STEAM) // GB = Gas Boiler (Bosch/Robey are boiler brands)

  const am5Gas = n(r5.powerhouse1gen) + n(r5.powerhouse2gen)
  // steamph1 is a mixed bucket (1 gas-fired boiler + 4 WHRBs) — split it via
  // the Steam_PH1 sub-boiler table so it lands in the right steam category.
  // steamph2 is 100% WHRB/HRSG, so the pre-aggregated dashboard total is used
  // as-is for that part (no extra query needed).
  const am5Ph1Gas = n(ph1.gasfiredsteamflow)
  const am5Ph1Whrb = n(ph1.whrb1steam) + n(ph1.whrb2steam) + n(ph1.whrb3steam) + n(ph1.whrb4steam)
  const am5Whrb = am5Ph1Whrb + n(r5.steamph2)
  const am5Os = n(r5.cb) + n(r5.new_cb) // "Out Source Boiler" 1/2 — coal-fired, labeled OS in the app

  const am17Gas = n(p3.CAT_KW) + n(p4.ENGINE1_KW) + n(p4.ENGINE2_KW) + n(p4.ENGINE3_KW)
  const am17Hfo = n(p3.MAN_KW) + n(p3.MAK1_KW) + n(p3.MAK2_KW)
  const am17Ke = n(p3.KE_KW)
  // AM17's steam (Steam_PH3: WHRB1-3 via steamph3, WHRB4-5 via steamph4 — same
  // table, no gas/coal component) is pre-aggregated in the same `dashboard`
  // row as AM5's steamph1/steamph2, so no extra query is needed.
  const am17Whrb = n(r5.steamph3) + n(r5.steamph4)

  const am14Gen = n(r14.GENSET_KW) + n(r14.AM2_A_KW) + n(r14.AM2_B_KW)
  const am14Ke = n(r14.KE_OLD_KW) + n(r14.KE_NEW_KW)
  const am15Gen = n(r15.JGS_420_KW) + n(r15.JGS_312_KW) + n(r15.GAS_1_5_KW) + n(r15.CAT_DIESEL_KW) + n(r15.KT_50_KW)
  const am15Ke = n(r15.KE_KW)
  const am15Sol = n(r15.SOLAR_TW_KW)

  return {
    am4: {
      power: am4Gen + am4Ke + am4Sol,
      steam: am4Biomass + am4GasBoilers,
      src: { gen: am4Gen, hfo: 0, ke: am4Ke, solar: am4Sol },
      steamSrc: { gas: am4GasBoilers, os: 0, biomass: am4Biomass, whrb: 0 },
    },
    am5: {
      power: am5Gas + am5Sol,
      steam: am5Ph1Gas + am5Ph1Whrb + n(r5.steamph2) + am5Os,
      src: { gen: am5Gas, hfo: 0, ke: 0, solar: am5Sol },
      steamSrc: { gas: am5Ph1Gas, os: am5Os, biomass: 0, whrb: am5Whrb },
    },
    am8: {
      power: am8Sol,
      steam: 0,
      src: { gen: 0, hfo: 0, ke: 0, solar: am8Sol },
      steamSrc: NO_STEAM,
    },
    am17: {
      power: am17Gas + am17Hfo + am17Ke + am17Sol,
      steam: am17Whrb,
      src: { gen: am17Gas, hfo: am17Hfo, ke: am17Ke, solar: am17Sol },
      steamSrc: { gas: 0, os: 0, biomass: 0, whrb: am17Whrb },
    },
    am14: {
      power: am14Gen + am14Ke,
      steam: 0,
      src: { gen: am14Gen, hfo: 0, ke: am14Ke, solar: 0 },
      steamSrc: NO_STEAM,
    },
    am15: {
      power: am15Gen + am15Ke + am15Sol,
      // STEAM_FLOW_T_1/T_2 ("Tower 1/2") are distribution/consumption meters,
      // not generation — excluded from the steam total (per product decision).
      steam: 0,
      src: { gen: am15Gen, hfo: 0, ke: am15Ke, solar: am15Sol },
      steamSrc: NO_STEAM,
    },
  }
}
