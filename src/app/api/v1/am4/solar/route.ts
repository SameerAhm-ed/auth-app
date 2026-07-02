import { respondJson } from '@/lib/api'
import { query } from '@/db/query'
import { config } from '@/db/dbconfig'

export const dynamic = 'force-dynamic'

export async function GET() {
  return respondJson(
    () =>
      query(
        'main',
        config,
        'SELECT SOLAR_A_KW, SOLAR_A_ERROR, SOLAR_B_KW, SOLAR_B_ERROR, SOLAR_C_KW, SOLAR_C_ERROR FROM AM04Powerhouse',
      ),
    'Failed to load solar data',
  )
}
