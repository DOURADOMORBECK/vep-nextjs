/**
 * Database initialization module
 * This module handles database initialization with proper error handling
 * for both build and runtime environments
 */

import { getPool } from './db';

/**
 * Initialize database connection
 * This is safe to call multiple times - it will only initialize once
 */
export async function initializeDatabase(): Promise<void> {
  // Skip initialization during Next.js build phase
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('[Database] Skipping initialization during build phase');
    return;
  }

  // In production, DATABASE_URL must be set
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL must be set in production environment. ' +
      'Please configure it in your Railway environment variables.'
    );
  }

  // For development, DATABASE_URL is optional
  if (!process.env.DATABASE_URL) {
    console.warn(
      '[Database] DATABASE_URL not set. Database features will not be available. ' +
      'Set DATABASE_URL in your .env.local file for local development.'
    );
    return;
  }

  try {
    // This will trigger pool initialization
    const pool = getPool();
    
    // Verify connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    console.log('[Database] Successfully initialized connection pool');
  } catch (error) {
    console.error('[Database] Failed to initialize:', error);
    
    // In production, this is fatal
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    
    // In development, log but don't crash
    console.warn('[Database] Continuing without database connection');
  }
}

/**
 * Check if database is available
 */
export function isDatabaseAvailable(): boolean {
  return !!process.env.DATABASE_URL && process.env.NEXT_PHASE !== 'phase-production-build';
}