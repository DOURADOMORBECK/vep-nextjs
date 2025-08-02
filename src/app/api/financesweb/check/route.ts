import { NextResponse } from 'next/server';
import { API_CONFIG } from '../sync/config';

export async function GET() {
  try {
    const hasApiKey = !!process.env.FINANCESWEB_API_KEY;
    
    if (!hasApiKey) {
      return NextResponse.json({
        configured: false,
        message: 'FINANCESWEB_API_KEY não está configurada',
        apiKey: null,
        baseUrl: API_CONFIG.baseUrl
      });
    }

    // Tenta fazer uma requisição de teste
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "apikey": API_CONFIG.apiKey,
        "tabela": "fnc_operadores", // Tabela pequena para teste
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(API_CONFIG.baseUrl, {
        method: "GET",
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return NextResponse.json({
        configured: true,
        message: response.ok ? 'API configurada e funcionando' : 'API configurada mas com erro',
        apiKey: API_CONFIG.apiKey.substring(0, 8) + '...',
        baseUrl: API_CONFIG.baseUrl,
        testStatus: response.status,
        testOk: response.ok
      });

    } catch (error) {
      return NextResponse.json({
        configured: true,
        message: 'API configurada mas não acessível',
        apiKey: API_CONFIG.apiKey.substring(0, 8) + '...',
        baseUrl: API_CONFIG.baseUrl,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }

  } catch (error) {
    return NextResponse.json({
      configured: false,
      message: 'Erro ao verificar configuração',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}