import { NextResponse } from 'next/server';

export async function GET() {
  // Verificar variáveis de ambiente essenciais
  const envCheck = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    railway: {
      isRailway: !!process.env.RAILWAY_ENV,
      environment: process.env.RAILWAY_ENV || 'not-on-railway'
    },
    database: {
      configured: !!process.env.DATABASE_URL,
      // Não expor a URL completa por segurança
      urlPattern: process.env.DATABASE_URL 
        ? process.env.DATABASE_URL.substring(0, 20) + '...' 
        : 'not-configured'
    },
    financesweb: {
      apiKeyConfigured: !!process.env.FINANCESWEB_API_KEY,
      // Não expor a chave, apenas confirmar se existe
      keyLength: process.env.FINANCESWEB_API_KEY?.length || 0
    },
    auth: {
      jwtSecretConfigured: !!process.env.JWT_SECRET
    },
    port: process.env.PORT || '3000',
    nodeVersion: process.version
  };

  // Adicionar avisos se algo estiver faltando
  const warnings = [];
  
  if (!envCheck.database.configured) {
    warnings.push('DATABASE_URL não configurada');
  }
  
  if (!envCheck.financesweb.apiKeyConfigured) {
    warnings.push('FINANCESWEB_API_KEY não configurada - sincronização não funcionará');
  }
  
  if (!envCheck.auth.jwtSecretConfigured) {
    warnings.push('JWT_SECRET não configurada - autenticação pode falhar');
  }

  return NextResponse.json({
    ...envCheck,
    warnings,
    status: warnings.length === 0 ? 'OK' : 'WARNINGS',
    message: warnings.length === 0 
      ? 'Todas as variáveis de ambiente estão configuradas' 
      : `${warnings.length} avisos encontrados`
  });
}