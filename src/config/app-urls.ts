// Configuration for application URLs

// Determine the base URL based on environment
export function getAppBaseUrl(): string {
  // In production on Railway, use internal URL
  if (process.env.RAILWAY_ENV === 'production') {
    return 'http://vep-nextjs.railway.internal:8080';
  }
  
  // In development or other environments
  if (typeof window === 'undefined') {
    // Server-side
    return process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`;
  } else {
    // Client-side
    return '';  // Use relative URLs on client side
  }
}

// Get the full URL for API routes
export function getApiUrl(path: string): string {
  const baseUrl = getAppBaseUrl();
  
  // If we're on the client side, just return the path (relative URL)
  if (typeof window !== 'undefined') {
    return path;
  }
  
  // On server side, return full URL
  return `${baseUrl}${path}`;
}