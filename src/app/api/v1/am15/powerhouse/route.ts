import { respondJson } from '@/lib/api'
import { query } from '@/db/query'
import { config } from '@/db/dbconfig'

export const dynamic = 'force-dynamic'

export async function GET() {
  return respondJson(() => query('main', config, 'SELECT * FROM AM17_POWERHOUSE'), 'Failed to load powerhouse data')
}
