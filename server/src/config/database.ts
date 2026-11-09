import { Pool, PoolConfig } from 'pg';
import { requireEnv } from './env';

let pool: Pool | null = null;

/**
 * Build the SSL option from DATABASE_URL and DB_SSL.
 *   DB_SSL=disable    -> no TLS (local Postgres)
 *   DB_SSL=no-verify  -> TLS without certificate verification
 *   unset / anything  -> TLS with certificate verification, except for localhost
 */
export function sslConfig(connectionString: string): PoolConfig['ssl'] {
  const mode = (process.env.DB_SSL || '').toLowerCase();
  if (mode === 'disable' || mode === 'false') return false;
  if (mode === 'no-verify') return { rejectUnauthorized: false };
  try {
    const { hostname } = new URL(connectionString);
    if (hostname === 'localhost' || hostname === '127.0.0.1') return false;
  } catch {
    // fall through to verified TLS
  }
  return { rejectUnauthorized: true };
}

export function createPool(): Pool {
  const connectionString = requireEnv('DATABASE_URL');
  return new Pool({
    connectionString,
    ssl: sslConfig(connectionString),
    query_timeout: 30000,
    connectionTimeoutMillis: 10000,
  });
}

/** Create the pool (once) and check that the database is reachable. */
export async function initializeDatabase(): Promise<Pool> {
  if (pool) return pool;
  const newPool = createPool();
  const client = await newPool.connect();
  client.release();
  pool = newPool;
  return pool;
}

export async function getPool(): Promise<Pool> {
  return pool ?? initializeDatabase();
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
