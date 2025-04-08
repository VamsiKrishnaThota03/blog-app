import { Pool } from 'pg';
import { initializeDatabase } from '../config/database';

// Function to get a database pool that is guaranteed to be initialized
export async function getDbPool(): Promise<Pool> {
  const pool = await initializeDatabase();
  if (!pool) {
    throw new Error('Failed to initialize database pool');
  }
  return pool;
}

// Function to execute a query with proper error handling
export async function executeQuery<T = any>(
  queryFn: (pool: Pool) => Promise<{ rows: T[] }>
): Promise<T[]> {
  const pool = await getDbPool();
  try {
    const result = await queryFn(pool);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
} 