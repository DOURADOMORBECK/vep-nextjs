import { NextResponse } from 'next/server';
import { entregaService } from '@/services/database/entregaService';

export async function GET() {
  try {
    const veiculos = await entregaService.getVeiculosDisponiveis();
    return NextResponse.json(veiculos);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
}