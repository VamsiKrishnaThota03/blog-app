import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createIPv4ConnectionString, createDirectConnectionString } from '../utils/dnsResolver';
import dns from 'dns';
import { promisify } from 'util';

dotenv.config();

// Global pool instance
let pool: Pool | null = null;

// Promisify DNS lookup
const lookup = promisify(dns.lookup);

// Function to resolve hostname to IPv4
async function resolveHostnameToIPv4(hostname: string): Promise<string> {
  try {
    console.log(`Attempting to resolve hostname: ${hostname}`);
    const { address } = await lookup(hostname, { family: 4 });
    console.log(`Successfully resolved ${hostname} to IPv4: ${address}`);
    return address;
  } catch (error) {
    console.warn(`Failed to resolve ${hostname} to IPv4, using original hostname:`, error);
    return hostname;
  }
}

/**
 * Initialize the database connection with retry logic
 * @param maxRetries Maximum number of retry attempts
 * @param initialDelay Initial delay in milliseconds
 * @returns A promise that resolves to the database pool
 */
export async function initializeDatabase(maxRetries = 5, initialDelay = 1000): Promise<Pool> {
  console.log('Database: Initializing database connection');
  
  // If we already have a pool, return it
  if (pool) {
    console.log('Database: Using existing pool');
    return pool;
  }
  
  let retries = 0;
  let delay = initialDelay;
  
  while (retries < maxRetries) {
    try {
      // Get the database URL from environment variables
      const databaseUrl = process.env.DATABASE_URL;
      
      if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable is not set');
      }
      
      // Try different connection strategies
      console.log('Database: Creating connection string');
      let connectionString = databaseUrl;
      let connectionStrategy = 'original';
      
      try {
        // First try: Use IPv4 connection string
        connectionString = await createIPv4ConnectionString(databaseUrl);
        connectionStrategy = 'ipv4';
      } catch (error) {
        console.warn('Database: Failed to create IPv4 connection string, trying direct connection:', error);
        
        try {
          // Second try: Use direct connection string
          connectionString = createDirectConnectionString(databaseUrl);
          connectionStrategy = 'direct';
        } catch (error) {
          console.warn('Database: Failed to create direct connection string, using original:', error);
          // Fall back to original connection string
          connectionString = databaseUrl;
          connectionStrategy = 'original';
        }
      }
      
      // Create a new pool with the connection string
      console.log(`Database: Creating new pool with ${connectionStrategy} connection strategy`);
      
      // Configure the pool based on the connection strategy
      const poolConfig: PoolConfig = {
        connectionString,
        ssl: {
          rejectUnauthorized: false
        },
        query_timeout: 30000
      };
      
      // Add additional configuration for direct connection
      if (connectionStrategy === 'direct') {
        // Force IPv4 for direct connections
        poolConfig.connectionTimeoutMillis = 10000;
      }
      
      pool = new Pool(poolConfig);
      
      // Test the connection
      console.log('Database: Testing connection');
      await pool.query('SELECT NOW()');
      console.log('Database: Connection successful');
      
      // Initialize tables if they don't exist
      await initializeTables();
      
      return pool;
    } catch (error) {
      console.error(`Database: Connection attempt ${retries + 1} failed:`, error);
      
      // If we've reached the maximum number of retries, throw the error
      if (retries >= maxRetries - 1) {
        console.error('Database: Maximum retry attempts reached, giving up');
        throw error;
      }
      
      // Otherwise, wait and retry
      retries++;
      console.log(`Database: Retrying in ${delay}ms (attempt ${retries + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff with a maximum delay of 30 seconds
      delay = Math.min(delay * 2, 30000);
    }
  }
  
  // This should never be reached due to the throw in the catch block
  throw new Error('Failed to initialize database after multiple attempts');
}

/**
 * Initialize the database tables
 */
async function initializeTables(): Promise<void> {
  console.log('Database: Initializing tables');
  
  if (!pool) {
    throw new Error('Database pool is not initialized');
  }
  
  try {
    // Check if the users table exists
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    const usersTableExists = result.rows[0].exists;
    
    if (!usersTableExists) {
      console.log('Database: Creating users table');
      await pool.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Database: Users table created');
    } else {
      console.log('Database: Users table already exists');
    }
    
    // Check if the posts table exists
    const postsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'posts'
      );
    `);
    
    const postsTableExists = postsResult.rows[0].exists;
    
    if (!postsTableExists) {
      console.log('Database: Creating posts table');
      await pool.query(`
        CREATE TABLE posts (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Database: Posts table created');
    } else {
      console.log('Database: Posts table already exists');
    }
  } catch (error) {
    console.error('Database: Failed to initialize tables:', error);
    throw error;
  }
}

/**
 * Get the database pool
 * @returns A promise that resolves to the database pool
 */
export async function getPool(): Promise<Pool> {
  if (!pool) {
    return initializeDatabase();
  }
  return pool;
}

// Export the pool for direct access
export { pool };

// Function to close the pool
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database pool closed');
  }
} 