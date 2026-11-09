import fs from 'fs';
import path from 'path';
import { createPool } from '../config/database';

/** Apply schema.sql to the database in DATABASE_URL (idempotent). */
async function initDb() {
  const pool = createPool();
  try {
    const schema = fs.readFileSync(path.resolve(__dirname, '../../schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('Schema applied successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

initDb();
