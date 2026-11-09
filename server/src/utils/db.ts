import { Pool } from 'pg';
import { getPool } from '../config/database';

export async function getDbPool(): Promise<Pool> {
  return getPool();
}
