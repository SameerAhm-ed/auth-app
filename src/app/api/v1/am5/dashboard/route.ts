import { respondJson } from '@/lib/api'
import { query } from '@/db/query'
import { configAM5 } from '@/db/dbconfig'

export const dynamic = 'force-dynamic'

export async function GET() {
  return respondJson(async () => {
    const [dashboard, ph1Takeoffs, ph2Takeoffs, ph3Takeoffs, am17Takeoffs, am5Solar] = await Promise.all([
      query('am5', configAM5, 'SELECT * FROM dashboard'),
      query('am5', configAM5, 'SELECT takeoff1kw, takeoff2kw, takeoff3kw FROM powerhouse1'),
      query('am5', configAM5, 'SELECT Takeoff4kw, Takeoff5kw, Takeoff6kw, Takeoff7kw, Takeoff8kw, AUX_LV_Takeoff FROM powerhouse2'),
      query('am5', configAM5, 'SELECT Takeoff1kw, Takeoff2kw, Takeoff3kw, Takeoff4kw FROM powerhouse3'),
      query('am5', configAM5, 'SELECT AUXILIARY_kw, TOWARDS_PH1_kw, AM17_B_kw FROM AM17_PH2'),
      // AM5-only solar, summed from the individual arrays rather than the
      // `Solar` table's `solar_total_kW` column: that DB-computed column
      // still reflects the old AM19-under-AM17 split and hasn't been updated
      // to include AM19_solar_kW under AM5 (see summaryMath.ts for the
      // canonical split). Once the DB column is fixed, this can go back to
      // `SELECT solar_total_kW FROM Solar`. The dashboard table's
      // `totalsolargen` is the whole cluster, so it's not used here either.
      query('am5', configAM5, 'SELECT solar3_kW, solar4_kW, solar5_kW, AM18_solar_kW, AM19_solar_kW FROM Solar'),
    ])

    return {
      dashboard,
      ph1_takeoffs: ph1Takeoffs,
      ph2_takeoffs: ph2Takeoffs,
      ph3_takeoffs: ph3Takeoffs,
      am17_takeoffs: am17Takeoffs,
      am5_solar: am5Solar,
    }
  }, 'Failed to load dashboard data')
}
