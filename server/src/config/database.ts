import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Create a pool using the connection string if available, otherwise use individual parameters
const appPool = new Pool(
  process.env.DATABASE_URL 
    ? { 
        connectionString: process.env.DATABASE_URL,
        // Force IPv4 to avoid IPv6 issues
        connectionTimeoutMillis: 10000,
        query_timeout: 10000,
        // Disable IPv6
        ssl: {
          rejectUnauthorized: false
        }
      }
    : {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME,
        // Force IPv4 to avoid IPv6 issues
        connectionTimeoutMillis: 10000,
        query_timeout: 10000,
        // Disable IPv6
        ssl: {
          rejectUnauthorized: false
        }
      }
);

// Initialize the database
async function initializeDatabase() {
  try {
    // Check if tables exist
    try {
      const tablesResult = await appPool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `);
      
      if (!tablesResult.rows[0].exists) {
        // Tables don't exist, create them
        const schemaPath = path.join(__dirname, '../../schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await appPool.query(schema);
        console.log('Tables created successfully');
      }
    } catch (error) {
      console.error('Error checking/creating tables:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Export the initialization function and the app pool
export { initializeDatabase };
export default appPool; 