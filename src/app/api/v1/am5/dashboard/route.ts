import { respondJson } from '@/lib/api'
import { query } from '@/db/query'
import { configAM5 } from '@/db/dbconfig'

export const dynamic = 'force-dynamic'

export async function GET() {
  return respondJson(async () => {
    const [dashboard, ph1Takeoffs, ph2Takeoffs, ph3Takeoffs, am17Takeoffs] = await Promise.all([
      query('am5', configAM5, 'SELECT * FROM dashboard'),
      query('am5', configAM5, 'SELECT takeoff1kw, takeoff2kw, takeoff3kw FROM powerhouse1'),
      query('am5', configAM5, 'SELECT Takeoff4kw, Takeoff5kw, Takeoff6kw, Takeoff7kw, Takeoff8kw, AUX_LV_Takeoff FROM powerhouse2'),
      query('am5', configAM5, 'SELECT Takeoff1kw, Takeoff2kw, Takeoff3kw, Takeoff4kw FROM powerhouse3'),
      query('am5', configAM5, 'SELECT AUXILIARY_kw, TOWARDS_PH1_kw, AM17_B_kw FROM AM17_PH2'),
    ])

    return {
      dashboard,
      ph1_takeoffs: ph1Takeoffs,
      ph2_takeoffs: ph2Takeoffs,
      ph3_takeoffs: ph3Takeoffs,
      am17_takeoffs: am17Takeoffs,
    }
  }, 'Failed to load dashboard data')
}
