import { respondJson } from '@/lib/api'
import { query } from '@/db/query'
import { config, configAM5 } from '@/db/dbconfig'

export const dynamic = 'force-dynamic'

type Row = Record<string, number>
const n = (v: number | undefined) => Number(v ?? 0)

/**
 * Per-AM live totals for the dashboard overview: Power in kW, Steam in T/H,
 * plus a source split `src = { gen, hfo, ke, solar }` (gas self-generation vs
 * HFO engines vs KE grid import vs solar) that the overview renders as a
 * per-mill source-mix bar. The AM5 `dashboard` table physically covers AM5,
 * AM17 and AM8, so those are split out here:
 *   - AM5  = GAS (PH1 + PH2) + AM5 solar (LT-3/4/5 + AM18); steam = PH1/2 + coal boilers
 *   - AM17 = GAS (CAT + ENGINE1/2/3) + HFO (MAN + MAK1/2) + KE + AM17 solar; steam = 0 (not wired)
 *   - AM8  = AM8 solar only;                                 steam = 0
 * KE grid import belongs to AM17 (not AM5); the AM5→AM17 tie (AM5_KW) is
 * excluded from AM17 to avoid double-counting. Solar comes from the `Solar` table.
 */
export async function GET() {
  return respondJson(async () => {
    const [am4Rows, am5Rows, am5Solar, am14Rows, am15Rows, ph3Rows, ph4Rows] = await Promise.all([
      query<Row>('main', config, 'SELECT * FROM AM04Powerhouse'),
      query<Row>('am5', configAM5, 'SELECT * FROM dashboard'),
      query<Row>('am5', configAM5, 'SELECT * FROM Solar'),
      query<Row>('main', config, 'SELECT * FROM AM14_POWERHOUSE'),
      query<Row>('main', config, 'SELECT * FROM AM17_POWERHOUSE'),
      query<Row>('am5', configAM5, 'SELECT * FROM powerhouse3'),
      query<Row>('am5', configAM5, 'SELECT * FROM AM17_PH2'),
    ])

    const r4 = am4Rows[0] ?? {}
    const r5 = am5Rows[0] ?? {}
    const s5 = am5Solar[0] ?? {}
    const r14 = am14Rows[0] ?? {}
    const r15 = am15Rows[0] ?? {}
    const p3 = ph3Rows[0] ?? {}
    const p4 = ph4Rows[0] ?? {}

    // Solar split by site (AM5 Solar table is per-array).
    const am5Sol = n(s5.solar3_kW) + n(s5.solar4_kW) + n(s5.solar5_kW) + n(s5.AM18_solar_kW)
    const am17Sol = n(s5.AM17_solar1_kW) + n(s5.AM17_solar2_kW) + n(s5.AM19_solar_kW) + n(s5.AM19_2_solar_kW)
    const am8Sol = n(s5.AM8_solar_kW)

    // Source split per mill: gen = self-generation, ke = grid import, solar.
    const am4Gen = n(r4.ENGINE_1_KW) + n(r4.ENGINE_2_KW) + n(r4.ENGINE_3_KW) + n(r4.ENGINE_4_KW) + n(r4.ENGINE_6_KW) + n(r4.ENGINE_7_KW)
    const am4Ke = n(r4.KE_1_KW) + n(r4.KE_2_KW) + n(r4.KE_3_KW)
    const am4Sol = n(r4.SOLAR_A_KW) + n(r4.SOLAR_B_KW) + n(r4.SOLAR_C_KW)
    // AM5 — KE dropped (that grid import belongs to AM17). GAS = PH1 + PH2.
    const am5Gas = n(r5.powerhouse1gen) + n(r5.powerhouse2gen)

    // AM17 — from its real per-engine tables so GAS and HFO can be split:
    //   GAS = CAT + ENGINE1/2/3 (R-LNG) ·  HFO = MAN + MAK1 + MAK2 ·  KE = KE_KW
    // The AM5_KW inter-plant tie is excluded to avoid double-counting AM5.
    const am17Gas = n(p3.CAT_KW) + n(p4.ENGINE1_KW) + n(p4.ENGINE2_KW) + n(p4.ENGINE3_KW)
    const am17Hfo = n(p3.MAN_KW) + n(p3.MAK1_KW) + n(p3.MAK2_KW)
    const am17Ke = n(p3.KE_KW)
    const am14Gen = n(r14.GENSET_KW) + n(r14.AM2_A_KW) + n(r14.AM2_B_KW)
    const am14Ke = n(r14.KE_OLD_KW) + n(r14.KE_NEW_KW)
    const am15Gen = n(r15.JGS_420_KW) + n(r15.JGS_312_KW) + n(r15.GAS_1_5_KW) + n(r15.CAT_DIESEL_KW) + n(r15.KT_50_KW)
    const am15Ke = n(r15.KE_KW)
    const am15Sol = n(r15.SOLAR_TW_KW)

    return {
      am4: {
        power: am4Gen + am4Ke + am4Sol,
        steam: n(r4.BIOMASS_STEAM_FLOW) + n(r4.GB_BOSCH_STEAM) + n(r4.GB_ROBEY_STEAM),
        src: { gen: am4Gen, hfo: 0, ke: am4Ke, solar: am4Sol },
      },
      am5: {
        power: am5Gas + am5Sol,
        steam: n(r5.steamph1) + n(r5.steamph2) + n(r5.cb) + n(r5.new_cb),
        src: { gen: am5Gas, hfo: 0, ke: 0, solar: am5Sol },
      },
      am8: {
        power: am8Sol,
        steam: 0, // AM8 is solar-only
        src: { gen: 0, hfo: 0, ke: 0, solar: am8Sol },
      },
      am17: {
        power: am17Gas + am17Hfo + am17Ke + am17Sol,
        steam: 0, // AM17 steam not wired yet
        src: { gen: am17Gas, hfo: am17Hfo, ke: am17Ke, solar: am17Sol },
      },
      am14: {
        power: am14Gen + am14Ke,
        steam: 0, // AM14 steam not instrumented yet
        src: { gen: am14Gen, hfo: 0, ke: am14Ke, solar: 0 },
      },
      am15: {
        power: am15Gen + am15Ke + am15Sol,
        steam: n(r15.STEAM_FLOW_T_1) + n(r15.STEAM_FLOW_T_2),
        src: { gen: am15Gen, hfo: 0, ke: am15Ke, solar: am15Sol },
      },
    }
  }, 'Failed to load summary')
}
