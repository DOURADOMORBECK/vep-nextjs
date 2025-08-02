import { NextResponse } from 'next/server';
import { entregaService } from '@/services/database/entregaService';

export async function GET() {
  try {
    const stats = await entregaService.getEstatisticasEntrega();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching delivery stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery stats' },
      { status: 500 }
    );
  }
}