import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Parse the connection string to extract components
function parseConnectionString(connectionString: string) {
  try {
    const url = new URL(connectionString);
    return {
      user: url.username,
      password: url.password,
      host: url.hostname,
      port: parseInt(url.port || '5432'),
      database: url.pathname.substring(1),
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 30000,
      query_timeout: 30000,
      // Force IPv4
      family: 4
    };
  } catch (error) {
    console.error('Error parsing connection string:', error);
    return null;
  }
}

// Create a pool using the connection string if available, otherwise use individual parameters
const poolConfig = process.env.DATABASE_URL 
  ? parseConnectionString(process.env.DATABASE_URL) || { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 30000,
      query_timeout: 30000,
      // Force IPv4
      family: 4
    };

console.log('Database configuration:', {
  ...poolConfig,
  password: poolConfig.password ? '********' : undefined
});

const appPool = new Pool(poolConfig);

// Initialize the database with retry logic
async function initializeDatabase(retries = 3, delay = 5000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Database initialization attempt ${attempt}/${retries}`);
      
      // Check if tables exist
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
      } else {
        console.log('Tables already exist');
      }
      
      // If we get here, initialization was successful
      console.log('Database initialized successfully');
      return;
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
}

// Export the initialization function and the app pool
export { initializeDatabase };
export default appPool; 