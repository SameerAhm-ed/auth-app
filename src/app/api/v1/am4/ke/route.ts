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
        'SELECT KE_1_KW, KE_1_ERROR, KE_2_KW, KE_2_ERROR, KE_3_KW, KE_3_ERROR FROM AM04Powerhouse',
      ),
    'Failed to load KE data',
  )
}
