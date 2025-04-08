import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import dns from 'dns';
import { promisify } from 'util';

dotenv.config();

// Promisify DNS lookup
const lookup = promisify(dns.lookup);

// Function to resolve hostname to IPv4 address
async function resolveHostnameToIPv4(hostname: string): Promise<string> {
  try {
    const result = await lookup(hostname, { family: 4 });
    console.log(`Resolved ${hostname} to IPv4: ${result.address}`);
    return result.address;
  } catch (error) {
    console.error(`Error resolving ${hostname} to IPv4:`, error);
    return hostname; // Fall back to hostname if resolution fails
  }
}

// Initialize the database with retry logic
async function initializeDatabase(retries = 3, delay = 5000): Promise<Pool> {
  let pool: Pool | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Database initialization attempt ${attempt}/${retries}`);
      
      // Create a new pool for each attempt
      if (process.env.DATABASE_URL) {
        // Extract hostname from connection string
        const url = new URL(process.env.DATABASE_URL);
        const hostname = url.hostname;
        
        // Resolve hostname to IPv4
        const ipv4Address = await resolveHostnameToIPv4(hostname);
        
        // Create a new connection string with IPv4 address
        const ipv4ConnectionString = process.env.DATABASE_URL.replace(
          hostname, 
          ipv4Address
        );
        
        console.log(`Using IPv4 connection string: ${ipv4ConnectionString.replace(/:[^:@]*@/, ':****@')}`);
        
        pool = new Pool({
          connectionString: ipv4ConnectionString,
          ssl: {
            rejectUnauthorized: false
          },
          connectionTimeoutMillis: 30000,
          query_timeout: 30000
        });
      } else {
        // Use individual parameters
        const hostname = process.env.DB_HOST || 'localhost';
        const ipv4Address = await resolveHostnameToIPv4(hostname);
        
        pool = new Pool({
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          host: ipv4Address,
          port: parseInt(process.env.DB_PORT || '5432'),
          database: process.env.DB_NAME,
          ssl: {
            rejectUnauthorized: false
          },
          connectionTimeoutMillis: 30000,
          query_timeout: 30000
        });
      }
      
      // Test the connection
      await pool.query('SELECT NOW()');
      console.log('Database connection successful');
      
      // Check if tables exist
      const tablesResult = await pool.query(`
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
        await pool.query(schema);
        console.log('Tables created successfully');
      } else {
        console.log('Tables already exist');
      }
      
      // If we get here, initialization was successful
      console.log('Database initialized successfully');
      
      // Export the pool for use in the application
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

// Create a global pool variable
let appPool: Pool | null = null;

// Initialize the database and set the global pool
initializeDatabase()
  .then(pool => {
    appPool = pool;
    console.log('Database pool initialized and set globally');
  })
  .catch(error => {
    console.error('Failed to initialize database pool:', error);
    process.exit(1);
  });

// Export the initialization function and the app pool
export { initializeDatabase };
export default appPool; 