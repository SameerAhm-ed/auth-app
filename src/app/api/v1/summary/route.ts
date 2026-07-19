import { respondJson } from '@/lib/api'
import { query } from '@/db/query'
import { config, configAM5 } from '@/db/dbconfig'
import { computeSummary, type Row } from '@/lib/summaryMath'

export const dynamic = 'force-dynamic'

/**
 * Per-AM live totals for the dashboard overview (see summaryMath.ts for the
 * exact fields/derivation): Power in kW, Steam in T/H, per-mill power and
 * steam source splits. Queries both MSSQL DBs directly on every request —
 * every dashboard client polling this at 1s is its own set of queries.
 */
export async function GET() {
  return respondJson(async () => {
    const [am4Rows, am5Rows, am5Solar, am14Rows, am15Rows, ph3Rows, ph4Rows, ph1Rows] = await Promise.all([
      query<Row>('main', config, 'SELECT * FROM AM04Powerhouse'),
      query<Row>('am5', configAM5, 'SELECT * FROM dashboard'),
      query<Row>('am5', configAM5, 'SELECT * FROM Solar'),
      query<Row>('main', config, 'SELECT * FROM AM14_POWERHOUSE'),
      query<Row>('main', config, 'SELECT * FROM AM17_POWERHOUSE'),
      query<Row>('am5', configAM5, 'SELECT * FROM powerhouse3'),
      query<Row>('am5', configAM5, 'SELECT * FROM AM17_PH2'),
      query<Row>('am5', configAM5, 'SELECT * FROM Steam_PH1'),
    ])

    return computeSummary({
      r4: am4Rows[0] ?? {},
      r5: am5Rows[0] ?? {},
      s5: am5Solar[0] ?? {},
      r14: am14Rows[0] ?? {},
      r15: am15Rows[0] ?? {},
      p3: ph3Rows[0] ?? {},
      p4: ph4Rows[0] ?? {},
      ph1: ph1Rows[0] ?? {},
    })
  }, 'Failed to load summary')
}
