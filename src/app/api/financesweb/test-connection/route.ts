import { NextRequest, NextResponse } from 'next/server';

// Configurações para testar
const API_CONFIG = {
  baseUrl: "https://flow.financesweb.com.br/webhook/financeserp",
  apiKey: process.env.FINANCESWEB_API_KEY || "18028EFB-5305-4B19-8CA0-8AA9D8636BE7"
};

interface TestResult {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
  success: boolean;
  status?: number;
  statusText?: string;
  response?: unknown;
  error?: string;
  duration: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table') || 'fnc_operadores';
  
  const results: TestResult[] = [];
  
  console.log('🧪 Iniciando testes de conexão com FinancesWeb API...');
  console.log(`📊 Tabela de teste: ${table}`);
  console.log(`🔑 API Key: ${API_CONFIG.apiKey.substring(0, 8)}...`);

  // Teste 1: GET com headers (formato atual)
  await testRequest({
    method: 'GET',
    headers: {
      "Content-Type": "application/json",
      "apikey": API_CONFIG.apiKey,
      "tabela": table,
    },
    description: 'GET com headers (formato atual)'
  }, results);

  // Teste 2: POST com body JSON
  await testRequest({
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      api_key: API_CONFIG.apiKey,
      tabela: table
    },
    description: 'POST com body JSON'
  }, results);

  // Teste 3: POST com api_key no header
  await testRequest({
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "api_key": API_CONFIG.apiKey,
    },
    body: {
      tabela: table
    },
    description: 'POST com api_key no header'
  }, results);

  // Teste 4: GET com query parameters
  const urlWithParams = `${API_CONFIG.baseUrl}?api_key=${API_CONFIG.apiKey}&tabela=${table}`;
  await testRequest({
    method: 'GET',
    url: urlWithParams,
    headers: {
      "Content-Type": "application/json",
    },
    description: 'GET com query parameters'
  }, results);

  // Teste 5: POST com diferentes formatos de body
  await testRequest({
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_CONFIG.apiKey}`,
    },
    body: {
      tabela: table
    },
    description: 'POST com Authorization Bearer'
  }, results);

  // Encontrar o teste bem-sucedido
  const successfulTest = results.find(r => r.success && r.response);
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
    recommendation: successfulTest ? {
      method: successfulTest.method,
      headers: successfulTest.headers,
      body: successfulTest.body,
      message: 'Use esta configuração para fazer requisições à API'
    } : {
      message: 'Nenhum teste foi bem-sucedido. Verifique a API key e o endpoint.'
    }
  });
}

async function testRequest(
  config: {
    method: string;
    url?: string;
    headers: Record<string, string>;
    body?: unknown;
    description: string;
  },
  results: TestResult[]
): Promise<void> {
  const startTime = Date.now();
  const result: TestResult = {
    method: config.method,
    url: config.url || API_CONFIG.baseUrl,
    headers: config.headers,
    body: config.body,
    success: false,
    duration: 0
  };

  try {
    console.log(`\n🔄 Testando: ${config.description}`);
    console.log(`   Método: ${config.method}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Headers:`, config.headers);
    if (config.body) {
      console.log(`   Body:`, config.body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(result.url, {
      method: config.method,
      headers: config.headers,
      body: config.body ? JSON.stringify(config.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    result.status = response.status;
    result.statusText = response.statusText;
    result.duration = Date.now() - startTime;

    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      try {
        const data = await response.json();
        result.response = data;
        result.success = true;
        console.log(`   ✅ Sucesso! Resposta:`, JSON.stringify(data).substring(0, 200) + '...');
      } catch {
        const text = await response.text();
        result.response = text;
        result.success = response.ok;
        console.log(`   ⚠️ Resposta não é JSON:`, text.substring(0, 200) + '...');
      }
    } else {
      const errorText = await response.text().catch(() => 'Erro ao ler resposta');
      result.error = errorText;
      console.log(`   ❌ Erro:`, errorText.substring(0, 200) + '...');
    }

  } catch (error) {
    result.duration = Date.now() - startTime;
    result.error = error instanceof Error ? error.message : 'Erro desconhecido';
    console.log(`   ❌ Exceção:`, result.error);
  }

  results.push(result);
}

// POST para testar tabelas específicas
export async function POST(request: NextRequest) {
  try {
    const { tables = ['fnc_operadores', 'fnc_pessoas', 'fnc_produtos_e_servicos', 'vw_pedidos_venda_produtos'] } = await request.json();
    
    const results: Record<string, TestResult[]> = {};
    
    for (const table of tables) {
      console.log(`\n📊 Testando tabela: ${table}`);
      const tableResults: TestResult[] = [];
      
      // Teste apenas o formato que mais provavelmente funciona
      await testRequest({
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          "apikey": API_CONFIG.apiKey,
          "tabela": table,
        },
        description: `GET ${table} com headers`
      }, tableResults);
      
      results[table] = tableResults;
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      tables: Object.keys(results),
      results
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Erro ao processar requisição',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}