import sql from 'mssql'
import { getPool } from './pools'

/**
 * Typed, pooled MSSQL read. One place that knows how to run a query, so routes
 * stay declarative and every DB call goes through the cached pool registry
 * (`getPool`) — never the global `sql.connect`, which collides across the two
 * databases this app talks to.
 */
export async function query<T = Record<string, unknown>>(
  key: string,
  cfg: sql.config,
  text: string,
): Promise<T[]> {
  const pool = await getPool(key, cfg)
  const result = await pool.request().query<T>(text)
  return result.recordset
}
