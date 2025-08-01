import { NextResponse } from 'next/server';
import { clearRateLimitStore } from '@/lib/api-middleware';

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  clearRateLimitStore();
  
  return NextResponse.json({ 
    success: true, 
    message: 'Rate limit store cleared' 
  });
}