import { NextRequest, NextResponse } from 'next/server';
import { entregaService } from '@/services/database/entregaService';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const rota = await entregaService.criarRota({
      codigoRota: data.route_code,
      motoristaId: data.driver_id,
      motoristaNome: data.driver_name,
      veiculoId: data.vehicle_id,
      totalPontos: data.total_points,
      distanciaKm: data.distance_km
    });

    return NextResponse.json(rota, { status: 201 });
  } catch (error) {
    console.error('Error creating delivery route:', error);
    return NextResponse.json(
      { error: 'Failed to create delivery route' },
      { status: 500 }
    );
  }
}