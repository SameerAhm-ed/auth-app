import { respondJson } from '@/lib/api'
import { query } from '@/db/query'
import { config, configAM5 } from '@/db/dbconfig'

export const dynamic = 'force-dynamic'

type Row = Record<string, number>
const n = (v: number | undefined) => Number(v ?? 0)

/**
 * Per-AM live totals for the dashboard overview: Power in kW, Steam in T/H.
 * Each AM's math mirrors that site's own overview page. The AM5 `dashboard`
 * table physically covers AM5, AM17 and AM8, so those are split out here:
 *   - AM5  = PH1 + PH2 + KE + AM5 solar (LT-3/4/5 + AM18);  steam = PH1/2 + coal boilers
 *   - AM17 = PH3 + PH4 + AM17 solar (AM17-1/2 + AM19-1/2);  steam = 0 (not wired yet)
 *   - AM8  = AM8 solar only;                                 steam = 0
 * Solar is per-array, so it comes from the AM5 `Solar` table.
 */
export async function GET() {
  return respondJson(async () => {
    const [am4Rows, am5Rows, am5Solar, am14Rows, am15Rows] = await Promise.all([
      query<Row>('main', config, 'SELECT * FROM AM04Powerhouse'),
      query<Row>('am5', configAM5, 'SELECT * FROM dashboard'),
      query<Row>('am5', configAM5, 'SELECT * FROM Solar'),
      query<Row>('main', config, 'SELECT * FROM AM14_POWERHOUSE'),
      query<Row>('main', config, 'SELECT * FROM AM17_POWERHOUSE'),
    ])

    const r4 = am4Rows[0] ?? {}
    const r5 = am5Rows[0] ?? {}
    const s5 = am5Solar[0] ?? {}
    const r14 = am14Rows[0] ?? {}
    const r15 = am15Rows[0] ?? {}

    // Solar split by site (AM5 Solar table is per-array).
    const am5Sol = n(s5.solar3_kW) + n(s5.solar4_kW) + n(s5.solar5_kW) + n(s5.AM18_solar_kW)
    const am17Sol = n(s5.AM17_solar1_kW) + n(s5.AM17_solar2_kW) + n(s5.AM19_solar_kW) + n(s5.AM19_2_solar_kW)
    const am8Sol = n(s5.AM8_solar_kW)

    return {
      am4: {
        power:
          n(r4.ENGINE_1_KW) + n(r4.ENGINE_2_KW) + n(r4.ENGINE_3_KW) + n(r4.ENGINE_4_KW) + n(r4.ENGINE_6_KW) + n(r4.ENGINE_7_KW) +
          n(r4.KE_1_KW) + n(r4.KE_2_KW) + n(r4.KE_3_KW) +
          n(r4.SOLAR_A_KW) + n(r4.SOLAR_B_KW) + n(r4.SOLAR_C_KW),
        steam: n(r4.BIOMASS_STEAM_FLOW) + n(r4.GB_BOSCH_STEAM) + n(r4.GB_ROBEY_STEAM),
      },
      am5: {
        power: n(r5.powerhouse1gen) + n(r5.powerhouse2gen) + n(r5.ke_kw) + am5Sol,
        steam: n(r5.steamph1) + n(r5.steamph2) + n(r5.cb) + n(r5.new_cb),
      },
      am8: {
        power: am8Sol,
        steam: 0, // AM8 is solar-only
      },
      am17: {
        power: n(r5.powerhouse3gen) + n(r5.AM17_PH2) + am17Sol,
        steam: 0, // AM17 steam not wired yet
      },
      am14: {
        power: n(r14.KE_OLD_KW) + n(r14.KE_NEW_KW) + n(r14.GENSET_KW) + n(r14.AM2_A_KW) + n(r14.AM2_B_KW),
        steam: 0, // AM14 steam not instrumented yet
      },
      am15: {
        power:
          n(r15.KE_KW) + n(r15.JGS_420_KW) + n(r15.JGS_312_KW) + n(r15.GAS_1_5_KW) + n(r15.CAT_DIESEL_KW) + n(r15.KT_50_KW) + n(r15.SOLAR_TW_KW),
        steam: n(r15.STEAM_FLOW_T_1) + n(r15.STEAM_FLOW_T_2),
      },
    }
  }, 'Failed to load summary')
}
