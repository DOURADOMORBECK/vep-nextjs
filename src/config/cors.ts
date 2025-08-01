// CORS configuration
const isDevelopment = process.env.NODE_ENV === 'development';

// Allowed origins based on environment
export const ALLOWED_ORIGINS = isDevelopment
  ? [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ]
  : [
      'https://vep-nextjs-production.up.railway.app',
      'https://*.railway.app', // Allow Railway preview deployments
      // Add your production domains here
    ];

// CORS options
export const CORS_OPTIONS = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true',
};

// Function to get appropriate CORS origin header
export function getCorsOrigin(requestOrigin: string | null): string {
  // In development, be more permissive
  if (isDevelopment) {
    return requestOrigin || '*';
  }

  // In production, check against allowed origins
  if (!requestOrigin) {
    return ALLOWED_ORIGINS[0]; // Default to first allowed origin
  }

  // Check if origin is allowed
  const isAllowed = ALLOWED_ORIGINS.some(allowed => {
    if (allowed.includes('*')) {
      // Handle wildcard patterns
      const pattern = allowed.replace('*', '.*');
      return new RegExp(`^${pattern}$`).test(requestOrigin);
    }
    return allowed === requestOrigin;
  });

  return isAllowed ? requestOrigin : ALLOWED_ORIGINS[0];
}

// Function to create CORS headers
export function createCorsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(origin),
    ...CORS_OPTIONS,
  };
}