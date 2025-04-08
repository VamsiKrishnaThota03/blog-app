import { Pool, QueryConfig, QueryResult, QueryResultRow } from 'pg';
import { getPool } from '../config/database';

/**
 * Get the database pool
 * @returns A promise that resolves to the database pool
 */
export async function getDbPool(): Promise<Pool> {
  return getPool();
}

/**
 * Execute a database query
 * @param text The SQL query text
 * @param params The query parameters
 * @param config Additional query configuration
 * @returns A promise that resolves to the query result
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: any[] = [],
  config?: Omit<QueryConfig, 'text' | 'values'>
): Promise<QueryResult<T>> {
  const start = Date.now();
  const pool = await getDbPool();
  
  try {
    const queryConfig: QueryConfig = {
      text,
      values: params,
      ...config
    };
    
    const result = await pool.query<T>(queryConfig);
    const duration = Date.now() - start;
    
    console.log('Executed query', {
      text,
      duration,
      rows: result.rowCount,
    });
    
    return result;
  } catch (error) {
    console.error('Query error', {
      text,
      error,
    });
    throw error;
  }
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