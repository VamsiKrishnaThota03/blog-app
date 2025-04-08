import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Create a pool for the default postgres database
const defaultPool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'postgres',
});

// Create a pool for our application database
const appPool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
});

// Initialize the database
async function initializeDatabase() {
  try {
    // Check if database exists
    const result = await defaultPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME]
    );
    
    if (result.rows.length === 0) {
      // Database doesn't exist, create it
      await defaultPool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`Database ${process.env.DB_NAME} created successfully`);
    }
    
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
  } finally {
    // Close the default pool
    await defaultPool.end();
  }
}

// Export the initialization function and the app pool
export { initializeDatabase };
export default appPool; 