import { respondJson } from '@/lib/api'
import { query } from '@/db/query'
import { configAM5 } from '@/db/dbconfig'

export const dynamic = 'force-dynamic'

export async function GET() {
  return respondJson(() =>
    query(
      'am5',
      configAM5,
      'SELECT whrb4steamflow, whrb4waterflow, whrb4steampressure, whrb5steamflow, whrb5waterflow, whrb5steampressure FROM Steam_PH3',
    ),
  )
}
