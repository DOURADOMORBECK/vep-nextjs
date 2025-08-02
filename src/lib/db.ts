import { Pool, PoolClient, QueryResultRow } from 'pg';

// Singleton pool instance
let pool: Pool | undefined;

// Flag to track if we've attempted initialization
let initializationAttempted = false;
let initializationError: Error | undefined;

/**
 * Get the database connection pool
 * Creates the pool on first access with proper configuration
 */
export function getPool(): Pool {
  // During build phase, we can't initialize the pool
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    throw new Error(
      'Database operations are not available during build phase. ' +
      'This code should only run at runtime.'
    );
  }

  if (!pool && !initializationAttempted) {
    initializationAttempted = true;
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      initializationError = new Error(
        'DATABASE_URL environment variable is not set. ' +
        'Please ensure it is configured in your environment.'
      );
      throw initializationError;
    }

    // Create the connection pool with production-ready settings
    pool = new Pool({
      connectionString,
      // SSL configuration - Railway PostgreSQL requires SSL
      ssl: {
        rejectUnauthorized: false, // Required for Railway PostgreSQL
      },
      // Connection pool configuration
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 5000, // Timeout for new connections
      // Statement timeout to prevent long-running queries
      statement_timeout: 30000,
      // Query timeout
      query_timeout: 30000,
    });

    // Pool event handlers
    pool.on('connect', () => {
      console.log('[Database] New client connected to pool');
    });

    pool.on('error', (err: Error) => {
      console.error('[Database] Unexpected error on idle client:', err);
    });

    pool.on('remove', () => {
      console.log('[Database] Client removed from pool');
    });

    // Verify connection on startup (non-blocking)
    pool.connect()
      .then(client => {
        console.log('[Database] Successfully connected to PostgreSQL');
        client.release();
      })
      .catch(err => {
        console.error('[Database] Failed to connect to PostgreSQL:', err.message);
        initializationError = err;
        // Don't throw here - let individual queries handle connection errors
      });
  }
  
  if (!pool) {
    if (initializationError) {
      throw initializationError;
    }
    throw new Error('Database pool not initialized');
  }
  
  return pool;
}

// Export the pool getter
export { getPool as pool };

/**
 * Execute a query with automatic retry logic
 * @param text SQL query text
 * @param params Query parameters
 * @param retries Number of retry attempts (default: 3)
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string, 
  params?: unknown[], 
  retries = 3
): Promise<T[]> {
  const start = Date.now();
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const pool = getPool();
      const res = await pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      // Log query execution in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Database] Query executed', { 
          query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          duration: `${duration}ms`,
          rows: res.rowCount 
        });
      }
      
      return res.rows;
    } catch (error) {
      lastError = error as Error;
      const pgError = error as { code?: string; message: string };
      
      console.error(
        `[Database] Query error (attempt ${attempt}/${retries}):`,
        {
          code: pgError.code,
          message: pgError.message,
          query: text.substring(0, 100)
        }
      );
      
      // Don't retry on logical errors
      const nonRetryableCodes = [
        '23505', // unique_violation
        '23503', // foreign_key_violation
        '23502', // not_null_violation
        '23514', // check_violation
        '42P01', // undefined_table
        '42703', // undefined_column
        '42883', // undefined_function
        '22P02', // invalid_text_representation
      ];
      
      if (pgError.code && nonRetryableCodes.includes(pgError.code)) {
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      if (attempt < retries) {
        const delay = Math.min(Math.pow(2, attempt) * 100, 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Execute a query and return a single row
 * @param text SQL query text
 * @param params Query parameters
 */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string, 
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

/**
 * Execute a function within a database transaction
 * Automatically handles BEGIN, COMMIT, and ROLLBACK
 * @param callback Function to execute within the transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Database] Transaction rolled back:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close the database connection pool gracefully
 * Should be called on application shutdown
 */
export async function closePool(): Promise<void> {
  if (pool) {
    try {
      await pool.end();
      console.log('[Database] Connection pool closed gracefully');
      pool = undefined;
    } catch (error) {
      console.error('[Database] Error closing pool:', error);
      throw error;
    }
  }
}

/**
 * Health check for database connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query<{ now: Date }>('SELECT NOW()');
    return result.length > 0;
  } catch (error) {
    console.error('[Database] Health check failed:', error);
    return false;
  }
}

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    console.log('\n[Database] SIGINT received, closing connections...');
    await closePool();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('[Database] SIGTERM received, closing connections...');
    await closePool();
    process.exit(0);
  });
}