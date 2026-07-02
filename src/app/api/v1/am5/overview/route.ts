import { respondJson } from '@/lib/api'
import { query } from '@/db/query'
import { configAM5 } from '@/db/dbconfig'

export const dynamic = 'force-dynamic'

export async function GET() {
  return respondJson(async () => {
    const [overview, dashboard, powerhouse1, powerhouse2, powerhouse3] = await Promise.all([
      query('am5', configAM5, 'SELECT * FROM overview'),
      query('am5', configAM5, 'SELECT * FROM dashboard'),
      query('am5', configAM5, 'SELECT engine6kw, engine7kw FROM powerhouse1'),
      query('am5', configAM5, 'SELECT turbinekw FROM powerhouse2'),
      query('am5', configAM5, 'SELECT MAN_KW, MAK1_KW, MAK2_KW FROM powerhouse3'),
    ])

    return { overview, dashboard, powerhouse1, powerhouse2, powerhouse3 }
  }, 'Failed to load overview data')
}
