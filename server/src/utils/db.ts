import { Pool, QueryConfig, QueryResult, QueryResultRow } from 'pg';
import { getPool } from '../config/database';

// Function to get a database pool that is guaranteed to be initialized
export async function getDbPool(): Promise<Pool> {
  const pool = await getPool();
  if (!pool) {
    throw new Error('Failed to initialize database pool');
  }
  return pool;
}

// Function to execute a query with proper error handling
export async function executeQuery<T extends QueryResultRow>(
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

export async function query<T extends QueryResultRow = any>(
  text: string,
  params: any[] = [],
  config?: QueryConfig
): Promise<QueryResult<T>> {
  const pool = getPool();
  
  try {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    console.log('Executed query', {
      text,
      duration,
      rows: result.rowCount,
    });
    
    return result;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
} 