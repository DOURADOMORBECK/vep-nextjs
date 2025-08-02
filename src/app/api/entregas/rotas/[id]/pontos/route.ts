import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: routeId } = await params;
  try {
    const data = await request.json();
    
    // Simular adição de ponto à rota
    const ponto = {
      id: Date.now(), // ID temporário
      routeId: parseInt(routeId),
      sequence: data.sequence,
      customer_name: data.customer_name,
      address: data.address,
      lat: data.lat,
      lng: data.lng,
      notes: data.notes,
      status: 'PENDENTE',
      createdAt: new Date().toISOString()
    };

    return NextResponse.json(ponto, { status: 201 });
  } catch (error) {
    console.error('Error adding delivery point:', error);
    return NextResponse.json(
      { error: 'Failed to add delivery point' },
      { status: 500 }
    );
  }
}