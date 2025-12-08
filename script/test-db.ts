import { config } from 'dotenv';
config(); // Load environment variables from .env file

import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;

async function testConnection() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Please set it in your .env file');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:');
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
      if ('code' in error) {
        console.error('Error code:', (error as any).code);
      }
      if ('errno' in error) {
        console.error('Error errno:', (error as any).errno);
      }
      if ('syscall' in error) {
        console.error('Error syscall:', (error as any).syscall);
      }
      console.error('Full error stack:', error.stack);
    } else {
      console.error('Unknown error:', error);
    }
  } finally {
    await pool.end();
  }
}

testConnection();
