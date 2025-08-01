/**
 * Database operation wrapper that handles build-time safety
 * This ensures database operations are only executed at runtime
 */

import { Pool, PoolClient, QueryResultRow } from 'pg';
import { getPool as getPoolInternal, query as queryInternal, queryOne as queryOneInternal, transaction as transactionInternal } from './db';

/**
 * Check if we're in a runtime environment where database operations are allowed
 */
function isRuntimeEnvironment(): boolean {
  return process.env.NEXT_PHASE !== 'phase-production-build';
}

/**
 * Wrap database operations to ensure they only run at runtime
 */
function ensureRuntime() {
  if (!isRuntimeEnvironment()) {
    throw new Error(
      'Database operations cannot be performed during build phase. ' +
      'Ensure this code is only executed at runtime (e.g., in API routes, server actions, or with dynamic imports).'
    );
  }
}

/**
 * Get the database connection pool (runtime-safe)
 */
export function getPool(): Pool {
  ensureRuntime();
  return getPoolInternal();
}

/**
 * Execute a query with automatic retry logic (runtime-safe)
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string, 
  params?: unknown[], 
  retries = 3
): Promise<T[]> {
  ensureRuntime();
  return queryInternal<T>(text, params, retries);
}

/**
 * Execute a query and return a single row (runtime-safe)
 */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string, 
  params?: unknown[]
): Promise<T | null> {
  ensureRuntime();
  return queryOneInternal<T>(text, params);
}

/**
 * Execute a function within a database transaction (runtime-safe)
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  ensureRuntime();
  return transactionInternal<T>(callback);
}

// Re-export other functions that don't need runtime checks
export { closePool, healthCheck } from './db';