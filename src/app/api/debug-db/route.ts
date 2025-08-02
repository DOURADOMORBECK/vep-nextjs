import { NextResponse } from 'next/server';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  
  // Parse database URL safely
  let connectionInfo = {
    hasUrl: !!dbUrl,
    host: 'unknown',
    database: 'unknown',
    user: 'unknown',
    port: 'unknown'
  };
  
  if (dbUrl) {
    try {
      const url = new URL(dbUrl);
      connectionInfo = {
        hasUrl: true,
        host: url.hostname,
        database: url.pathname.slice(1),
        user: url.username,
        port: url.port || '5432'
      };
    } catch {
      // Invalid URL format
    }
  }
  
  // Test simple fetch to see if products API works
  let productsWork = false;
  let productCount = 0;
  try {
    const response = await fetch('http://localhost:3000/api/produtos');
    if (response.ok) {
      const data = await response.json();
      productsWork = true;
      productCount = data.products?.length || 0;
    }
  } catch {
    // Ignore
  }
  
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    database: connectionInfo,
    apis: {
      products: { works: productsWork, count: productCount }
    },
    timestamp: new Date().toISOString()
  });
}