import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createIPv4ConnectionString } from '../utils/dnsResolver';
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
    console.error(`Failed to resolve ${hostname} to IPv4:`, error);
    throw error;
  }
}

/**
 * Initialize the database connection
 * @returns A promise that resolves to the database pool
 */
export async function initializeDatabase(): Promise<Pool> {
  console.log('Database: Initializing database connection');
  
  // If we already have a pool, return it
  if (pool) {
    console.log('Database: Using existing pool');
    return pool;
  }
  
  try {
    // Get the database URL from environment variables
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Create an IPv4 connection string
    console.log('Database: Creating IPv4 connection string');
    const ipv4ConnectionString = await createIPv4ConnectionString(databaseUrl);
    
    // Create a new pool with the IPv4 connection string
    console.log('Database: Creating new pool with IPv4 connection string');
    pool = new Pool({
      connectionString: ipv4ConnectionString,
      ssl: {
        rejectUnauthorized: false
      },
      query_timeout: 30000
    });
    
    // Test the connection
    console.log('Database: Testing connection');
    await pool.query('SELECT NOW()');
    console.log('Database: Connection successful');
    
    // Initialize tables if they don't exist
    await initializeTables();
    
    return pool;
  } catch (error) {
    console.error('Database: Failed to initialize database:', error);
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