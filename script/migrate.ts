import * as dotenv from 'dotenv';
dotenv.config();

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pkg from 'pg';
const { Pool } = pkg;

async function runMigrations() {
  if (!process.env.PG_CONNECTION_STRING) {
    throw new Error('DATABASE_URL is not set. Please set it in your .env file');
  }
  

  const pool = new Pool({
    connectionString: process.env.PG_CONNECTION_STRING,
  });

  const db = drizzle(pool);

  console.log('Running migrations...');
  
  try {
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();


