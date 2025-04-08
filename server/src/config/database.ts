import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createIPv4ConnectionString, createDirectConnectionString, createIPv4FamilyConnectionString } from '../utils/dnsResolver';
import dns from 'dns';
import { promisify } from 'util';
import net from 'net';

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
 * Initialize the database connection pool
 * @returns A promise that resolves to the database pool
 */
export async function initializeDatabase(): Promise<Pool> {
  if (pool) {
    console.log('Using existing database pool');
    return pool;
  }

  console.log('Initializing database connection pool');
  
  try {
    // Get the database connection string from environment variables
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Create a connection string with IPv4 family parameter
    const ipv4ConnectionString = createIPv4FamilyConnectionString(connectionString);
    
    // Create the pool configuration
    const poolConfig: PoolConfig = {
      connectionString: ipv4ConnectionString,
      ssl: {
        rejectUnauthorized: false
      },
      query_timeout: 30000,
      connectionTimeoutMillis: 10000
    };
    
    // Create the pool
    pool = new Pool(poolConfig);
    
    // Test the connection
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();
    
    return pool;
  } catch (error) {
    console.error('Failed to initialize database pool:', error);
    throw error;
  }
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
    pool = await initializeDatabase();
  }
  return pool;
}

// Export the pool for direct access
export { pool };

/**
 * Close the database pool
 * @returns A promise that resolves when the pool is closed
 */
export async function closePool(): Promise<void> {
  if (pool) {
    console.log('Closing database pool');
    await pool.end();
    pool = null;
  }
} 