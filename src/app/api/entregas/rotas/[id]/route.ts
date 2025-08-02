import { NextRequest, NextResponse } from 'next/server';
import { entregaService } from '@/services/database/entregaService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const data = await request.json();
    
    const success = await entregaService.atualizarRota(id, {
      pontosCompletos: data.completed_points
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Route updated successfully' });
  } catch (error) {
    console.error('Error updating delivery route:', error);
    return NextResponse.json(
      { error: 'Failed to update delivery route' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'start') {
      const success = await entregaService.iniciarRota(id);
      if (!success) {
        return NextResponse.json(
          { error: 'Route not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ message: 'Route started successfully' });
    }

    if (action === 'finish') {
      const success = await entregaService.finalizarRota(id);
      if (!success) {
        return NextResponse.json(
          { error: 'Route not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ message: 'Route finished successfully' });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing route action:', error);
    return NextResponse.json(
      { error: 'Failed to process route action' },
      { status: 500 }
    );
  }
}