import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createIPv4ConnectionString } from '../utils/dnsResolver';

dotenv.config();

// Create a singleton pool instance
let pool: Pool | null = null;

// Function to initialize the database connection
export async function initializeDatabase(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  const retries = 5;
  const delay = 5000; // 5 seconds

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempting to initialize database (attempt ${attempt}/${retries})...`);
      
      // Get database configuration from environment variables
      const dbConfig = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        query_timeout: 30000, // 30 seconds
      };

      // If using a connection string, try to use it directly
      if (process.env.DATABASE_URL) {
        console.log('Using DATABASE_URL for connection');
        
        try {
          // Try to create an IPv4 connection string
          const ipv4ConnectionString = await createIPv4ConnectionString(process.env.DATABASE_URL);
          console.log(`Using IPv4 connection string: ${ipv4ConnectionString.replace(/:[^:@]*@/, ':****@')}`);
          
          pool = new Pool({
            connectionString: ipv4ConnectionString,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            query_timeout: 30000, // 30 seconds
            connectionTimeoutMillis: 10000,
          });
        } catch (error) {
          console.error('Failed to create IPv4 connection string:', error);
          console.log('Falling back to direct connection string');
          
          // Use the original connection string
          pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            query_timeout: 30000, // 30 seconds
            connectionTimeoutMillis: 10000,
          });
        }
      } else {
        console.log('Using individual connection parameters');
        pool = new Pool(dbConfig);
      }

      // Test the connection
      await pool.query('SELECT NOW()');
      console.log('Database connection test successful');

      // Check if tables exist
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `);

      if (!tableCheck.rows[0].exists) {
        console.log('Tables do not exist, initializing database schema...');
        // Initialize your database schema here
        // This should match your schema.sql file
        await pool.query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS posts (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('Database schema initialized successfully');
      }

      console.log('Database initialized successfully');
      return pool;
    } catch (error) {
      console.error(`Error initializing database (attempt ${attempt}/${retries}):`, error);
      
      if (attempt < retries) {
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('Failed to initialize database after all retry attempts');
        throw error;
      }
    }
  }
  
  throw new Error('Failed to initialize database after all retry attempts');
}

// Export a function to get the pool
export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializeDatabase() first.');
  }
  return pool;
} 