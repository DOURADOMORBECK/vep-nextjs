import { Pool } from 'pg';

// Database connection configuration
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create a connection pool
export const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' 
    ? {
        rejectUnauthorized: false
      }
    : undefined,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit the process, just log the error
});

// Initial connection test
pool.connect()
  .then(client => {
    console.log('Database connection test successful');
    client.release();
  })
  .catch(err => {
    console.error('Failed to connect to database:', err.message);
    console.error('Please ensure DATABASE_URL is correctly set');
  });

// Helper function to execute queries with retry logic
export async function query<T = any>(text: string, params?: any[], retries = 3): Promise<T[]> {
  const start = Date.now();
  let lastError: any;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Executed query', { text: text.substring(0, 100), duration, rows: res.rowCount });
      }
      
      return res.rows;
    } catch (error: any) {
      lastError = error;
      console.error(`Database query error (attempt ${attempt}/${retries}):`, error.message);
      
      // Don't retry on certain errors
      if (error.code === '23505' || // unique violation
          error.code === '23503' || // foreign key violation
          error.code === '23502' || // not null violation
          error.code === '42P01' || // undefined table
          error.code === '42703') { // undefined column
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }
  }
  
  throw lastError;
}

// Helper function to get a single row
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

// Transaction helper
export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Graceful shutdown
export async function closePool() {
  await pool.end();
  console.log('Database pool closed');
}