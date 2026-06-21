import sql from "mssql";

/**
 * One cached connection pool per database key, reused across requests.
 *
 * We use explicit ConnectionPool instances (not the global `sql.connect`)
 * so the app can talk to multiple databases at once without them clobbering
 * each other's global pool. Caching the pool also keeps 1s polling cheap.
 */
const pools = new Map<string, Promise<sql.ConnectionPool>>();

export function getPool(key: string, cfg: sql.config): Promise<sql.ConnectionPool> {
  let pool = pools.get(key);
  if (!pool) {
    pool = new sql.ConnectionPool(cfg).connect();
    // If the initial connect fails, drop it so the next request can retry.
    pool.catch(() => pools.delete(key));
    pools.set(key, pool);
  }
  return pool;
}
