import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.production
dotenv.config({ path: path.resolve(__dirname, '../../.env.production') });

async function initializeDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to Neon database...');
    
    // Read the schema file
    const schemaPath = path.resolve(__dirname, '../../schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    console.log('Creating tables...');
    await pool.query(schema);
    console.log('Tables created successfully!');
    
    // Create a test user
    console.log('Creating test user...');
    const hashedPassword = '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqDu0.i9ZwPTi'; // password: test123
    await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING RETURNING id',
      ['Test User', 'test@example.com', hashedPassword]
    );
    console.log('Test user created successfully!');
    
    // Get the user ID
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', ['test@example.com']);
    const userId = userResult.rows[0]?.id;
    
    if (userId) {
      // Create a test post
      console.log('Creating test post...');
      await pool.query(
        'INSERT INTO posts (title, content, user_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        ['Welcome to My Blog', 'This is a test post created during database initialization.', userId]
      );
      console.log('Test post created successfully!');
    }
    
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await pool.end();
  }
}

// Run the initialization
initializeDatabase(); 