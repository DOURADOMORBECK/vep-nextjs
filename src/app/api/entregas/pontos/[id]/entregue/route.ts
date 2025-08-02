import { NextRequest, NextResponse } from 'next/server';
import { entregaService } from '@/services/database/entregaService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: pointId } = await params;
  try {
    const data = await request.json();
    
    const success = await entregaService.marcarPontoEntregue(
      pointId, 
      data.notes
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Point not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Point marked as delivered successfully',
      deliveredAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking point as delivered:', error);
    return NextResponse.json(
      { error: 'Failed to mark point as delivered' },
      { status: 500 }
    );
  }
}