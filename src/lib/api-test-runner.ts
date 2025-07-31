import { railwayApi } from './api-interceptor';
import fs from 'fs/promises';
import path from 'path';

interface ApiTestResult {
  endpoint: string;
  method: string;
  timestamp: string;
  success: boolean;
  status?: number;
  statusText?: string;
  data?: any;
  error?: any;
}

interface ApiTestSuite {
  testName: string;
  timestamp: string;
  results: ApiTestResult[];
  summary: {
    total: number;
    success: number;
    failed: number;
  };
}

// Dados de teste para criar/atualizar entidades
const testData = {
  product: {
    code: 'TEST001',
    name: 'Produto Teste',
    description: 'Produto criado automaticamente para teste',
    category: 'Frutas',
    unit: 'KG',
    price: 10.50,
    stock: 100,
    minStock: 10,
    supplier: 'Fornecedor Teste',
    barcode: '7890000000001',
    active: true
  },
  client: {
    code: 'CLI001',
    name: 'Cliente Teste',
    type: 'PJ' as const,
    document: '00000000000191', // CNPJ válido para teste
    email: 'teste@empresa.com',
    phone: '11999999999',
    whatsapp: '11999999999',
    address: 'Rua Teste',
    number: '123',
    complement: 'Sala 1',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01000000',
    latitude: -23.550520,
    longitude: -46.633308,
    deliveryNotes: 'Entregar das 8h às 17h',
    active: true
  },
  order: {
    clientId: '', // Será preenchido após criar cliente
    orderDate: new Date().toISOString(),
    deliveryDate: new Date(Date.now() + 86400000).toISOString(), // Amanhã
    items: [{
      productId: '', // Será preenchido após criar produto
      productName: 'Produto Teste',
      quantity: 10,
      unit: 'KG',
      price: 10.50,
      total: 105.00
    }],
    totalAmount: 105.00,
    status: 'pending' as const,
    paymentMethod: 'money',
    paymentStatus: 'pending' as const,
    deliveryPeriod: 'morning' as const,
    deliveryAddress: 'Rua Teste, 123 - Centro - São Paulo/SP',
    deliveryNotes: 'Entregar das 8h às 17h',
    createdBy: 'api-test'
  },
  operator: {
    code: 'OP001',
    name: 'Operador Teste',
    email: 'operador@teste.com',
    phone: '11888888888',
    cpf: '00000000191',
    password: 'senha123',
    role: 'operator',
    permissions: ['products.view', 'orders.view', 'delivery.view'],
    active: true
  },
  supplier: {
    code: 'FOR001',
    name: 'Fornecedor Teste',
    type: 'PJ' as const,
    document: '00000000000191',
    email: 'fornecedor@teste.com',
    phone: '11777777777',
    whatsapp: '11777777777',
    contact: 'João Silva',
    address: 'Rua do Fornecedor',
    number: '456',
    complement: '',
    neighborhood: 'Industrial',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '02000000',
    categories: ['Frutas', 'Verduras'],
    paymentTerms: '30 dias',
    deliveryDays: [1, 3, 5], // Seg, Qua, Sex
    minimumOrder: 500,
    active: true
  },
  user: {
    name: 'Usuário Teste',
    email: 'usuario@teste.com',
    password: 'senha123',
    role: 'user',
    department: 'Administrativo',
    phone: '11666666666',
    cpf: '00000000191',
    active: true
  },
  vehicle: {
    plate: 'ABC1234',
    model: 'Fiat Ducato',
    year: 2022,
    capacity: 1000,
    type: 'van',
    active: true
  }
};

class ApiTestRunner {
  private results: ApiTestResult[] = [];
  private createdIds: Record<string, string> = {};

  async runAllTests(): Promise<ApiTestSuite> {
    console.log('🚀 Iniciando testes automáticos das APIs Railway...\n');
    
    const startTime = Date.now();
    
    try {
      // 1. Teste de autenticação
      await this.testAuth();
      
      // 2. Testes de CRUD para cada entidade
      await this.testProducts();
      await this.testClients();
      await this.testOrders();
      await this.testOperators();
      await this.testSuppliers();
      await this.testUsers();
      await this.testVehicles();
      await this.testDeliveries();
      
      // 3. Teste de UserLogs
      await this.testUserLogs();
      
    } catch (error) {
      console.error('❌ Erro durante execução dos testes:', error);
    }
    
    const duration = Date.now() - startTime;
    const summary = this.generateSummary();
    
    console.log('\n📊 Resumo dos Testes:');
    console.log(`Total: ${summary.total}`);
    console.log(`✅ Sucesso: ${summary.success}`);
    console.log(`❌ Falha: ${summary.failed}`);
    console.log(`⏱️ Duração: ${duration}ms\n`);
    
    const testSuite: ApiTestSuite = {
      testName: 'Railway API Test Suite',
      timestamp: new Date().toISOString(),
      results: this.results,
      summary
    };
    
    // Salvar resultados em arquivo JSON
    await this.saveResults(testSuite);
    
    return testSuite;
  }
  
  private async testAuth() {
    console.log('🔐 Testando autenticação...');
    
    const result = await this.testEndpoint(
      'POST /auth/login',
      async () => railwayApi.login('admin@veplim.com', 'admin123', 'admin')
    );
    
    if (result.success && result.data?.token) {
      // Salvar token para próximas requisições
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', result.data.token);
        localStorage.setItem('userId', result.data.userId || 'test-user');
      }
    }
  }
  
  private async testProducts() {
    console.log('📦 Testando API de Produtos...');
    
    // Listar produtos
    await this.testEndpoint(
      'GET /api/products',
      async () => railwayApi.getProducts()
    );
    
    // Criar produto
    const createResult = await this.testEndpoint(
      'POST /api/products',
      async () => railwayApi.createProduct(testData.product)
    );
    
    if (createResult.success && createResult.data?.id) {
      this.createdIds.product = createResult.data.id;
      
      // Buscar produto específico
      await this.testEndpoint(
        `GET /api/products/${this.createdIds.product}`,
        async () => railwayApi.getProduct(this.createdIds.product)
      );
      
      // Atualizar produto
      await this.testEndpoint(
        `PUT /api/products/${this.createdIds.product}`,
        async () => railwayApi.updateProduct(this.createdIds.product, {
          ...testData.product,
          name: 'Produto Teste Atualizado'
        })
      );
      
      // Deletar produto
      await this.testEndpoint(
        `DELETE /api/products/${this.createdIds.product}`,
        async () => railwayApi.deleteProduct(this.createdIds.product)
      );
    }
  }
  
  private async testClients() {
    console.log('👥 Testando API de Clientes...');
    
    // Listar clientes
    await this.testEndpoint(
      'GET /api/customers',
      async () => railwayApi.getClients()
    );
    
    // Criar cliente
    const createResult = await this.testEndpoint(
      'POST /api/customers',
      async () => railwayApi.createClient(testData.client)
    );
    
    if (createResult.success && createResult.data?.id) {
      this.createdIds.client = createResult.data.id;
      
      // Buscar cliente específico
      await this.testEndpoint(
        `GET /api/customers/${this.createdIds.client}`,
        async () => railwayApi.getClient(this.createdIds.client)
      );
      
      // Atualizar cliente
      await this.testEndpoint(
        `PUT /api/customers/${this.createdIds.client}`,
        async () => railwayApi.updateClient(this.createdIds.client, {
          ...testData.client,
          name: 'Cliente Teste Atualizado'
        })
      );
      
      // Manter cliente para testes de pedidos
      // Não deletar aqui
    }
  }
  
  private async testOrders() {
    console.log('🛒 Testando API de Pedidos...');
    
    // Criar produto para o pedido
    const productResult = await this.testEndpoint(
      'POST /api/products (for order)',
      async () => railwayApi.createProduct(testData.product)
    );
    
    if (productResult.success && productResult.data?.id) {
      this.createdIds.productForOrder = productResult.data.id;
    }
    
    // Listar pedidos
    await this.testEndpoint(
      'GET /api/orders',
      async () => railwayApi.getOrders()
    );
    
    // Criar pedido
    if (this.createdIds.client && this.createdIds.productForOrder) {
      const orderData = {
        ...testData.order,
        clientId: this.createdIds.client,
        items: [{
          ...testData.order.items[0],
          productId: this.createdIds.productForOrder
        }]
      };
      
      const createResult = await this.testEndpoint(
        'POST /api/orders',
        async () => railwayApi.createOrder(orderData)
      );
      
      if (createResult.success && createResult.data?.id) {
        this.createdIds.order = createResult.data.id;
        
        // Buscar pedido específico
        await this.testEndpoint(
          `GET /api/orders/${this.createdIds.order}`,
          async () => railwayApi.getOrder(this.createdIds.order)
        );
        
        // Atualizar pedido
        await this.testEndpoint(
          `PUT /api/orders/${this.createdIds.order}`,
          async () => railwayApi.updateOrder(this.createdIds.order, {
            ...orderData,
            status: 'confirmed'
          })
        );
      }
    }
  }
  
  private async testOperators() {
    console.log('👷 Testando API de Operadores...');
    
    // Listar operadores
    await this.testEndpoint(
      'GET /api/users?role=operator',
      async () => railwayApi.getOperators()
    );
    
    // Criar operador
    const createResult = await this.testEndpoint(
      'POST /api/users (operator)',
      async () => railwayApi.createOperator(testData.operator)
    );
    
    if (createResult.success && createResult.data?.id) {
      this.createdIds.operator = createResult.data.id;
      
      // Buscar operador específico
      await this.testEndpoint(
        `GET /api/users/${this.createdIds.operator}`,
        async () => railwayApi.getOperator(this.createdIds.operator)
      );
      
      // Atualizar operador
      await this.testEndpoint(
        `PUT /api/users/${this.createdIds.operator}`,
        async () => railwayApi.updateOperator(this.createdIds.operator, {
          ...testData.operator,
          name: 'Operador Teste Atualizado'
        })
      );
      
      // Deletar operador
      await this.testEndpoint(
        `DELETE /api/users/${this.createdIds.operator}`,
        async () => railwayApi.deleteOperator(this.createdIds.operator)
      );
    }
  }
  
  private async testSuppliers() {
    console.log('🏭 Testando API de Fornecedores...');
    
    // Listar fornecedores
    await this.testEndpoint(
      'GET /api/suppliers',
      async () => railwayApi.getSuppliers()
    );
    
    // Criar fornecedor
    const createResult = await this.testEndpoint(
      'POST /api/suppliers',
      async () => railwayApi.createSupplier(testData.supplier)
    );
    
    if (createResult.success && createResult.data?.id) {
      this.createdIds.supplier = createResult.data.id;
      
      // Buscar fornecedor específico
      await this.testEndpoint(
        `GET /api/suppliers/${this.createdIds.supplier}`,
        async () => railwayApi.getSupplier(this.createdIds.supplier)
      );
      
      // Atualizar fornecedor
      await this.testEndpoint(
        `PUT /api/suppliers/${this.createdIds.supplier}`,
        async () => railwayApi.updateSupplier(this.createdIds.supplier, {
          ...testData.supplier,
          name: 'Fornecedor Teste Atualizado'
        })
      );
      
      // Deletar fornecedor
      await this.testEndpoint(
        `DELETE /api/suppliers/${this.createdIds.supplier}`,
        async () => railwayApi.deleteSupplier(this.createdIds.supplier)
      );
    }
  }
  
  private async testUsers() {
    console.log('👤 Testando API de Usuários...');
    
    // Listar usuários
    await this.testEndpoint(
      'GET /api/users',
      async () => railwayApi.getUsers()
    );
    
    // Criar usuário
    const createResult = await this.testEndpoint(
      'POST /api/users',
      async () => railwayApi.createUser(testData.user)
    );
    
    if (createResult.success && createResult.data?.id) {
      this.createdIds.user = createResult.data.id;
      
      // Buscar usuário específico
      await this.testEndpoint(
        `GET /api/users/${this.createdIds.user}`,
        async () => railwayApi.getUser(this.createdIds.user)
      );
      
      // Atualizar usuário
      await this.testEndpoint(
        `PUT /api/users/${this.createdIds.user}`,
        async () => railwayApi.updateUser(this.createdIds.user, {
          ...testData.user,
          name: 'Usuário Teste Atualizado'
        })
      );
      
      // Deletar usuário
      await this.testEndpoint(
        `DELETE /api/users/${this.createdIds.user}`,
        async () => railwayApi.deleteUser(this.createdIds.user)
      );
    }
  }
  
  private async testVehicles() {
    console.log('🚚 Testando API de Veículos...');
    
    // Listar veículos
    await this.testEndpoint(
      'GET /api/vehicles',
      async () => railwayApi.getVehicles()
    );
    
    // Criar veículo
    const createResult = await this.testEndpoint(
      'POST /api/vehicles',
      async () => railwayApi.createVehicle(testData.vehicle)
    );
    
    if (createResult.success && createResult.data?.id) {
      this.createdIds.vehicle = createResult.data.id;
      
      // Buscar veículo específico
      await this.testEndpoint(
        `GET /api/vehicles/${this.createdIds.vehicle}`,
        async () => railwayApi.getVehicle(this.createdIds.vehicle)
      );
      
      // Atualizar veículo
      await this.testEndpoint(
        `PUT /api/vehicles/${this.createdIds.vehicle}`,
        async () => railwayApi.updateVehicle(this.createdIds.vehicle, {
          ...testData.vehicle,
          model: 'Fiat Ducato Atualizado'
        })
      );
      
      // Deletar veículo
      await this.testEndpoint(
        `DELETE /api/vehicles/${this.createdIds.vehicle}`,
        async () => railwayApi.deleteVehicle(this.createdIds.vehicle)
      );
    }
  }
  
  private async testDeliveries() {
    console.log('📍 Testando API de Entregas...');
    
    // Listar entregas
    await this.testEndpoint(
      'GET /api/deliveries',
      async () => railwayApi.getDeliveries()
    );
    
    // Se temos um pedido criado, testar atualização de status
    if (this.createdIds.order) {
      await this.testEndpoint(
        `PUT /api/deliveries/${this.createdIds.order}/status`,
        async () => railwayApi.updateDeliveryStatus(this.createdIds.order, 'delivering', {
          lat: -23.550520,
          lng: -46.633308
        })
      );
    }
  }
  
  private async testUserLogs() {
    console.log('📝 Testando API de UserLogs...');
    
    // Registrar ação de teste
    await this.testEndpoint(
      'POST /api/logs',
      async () => railwayApi.logUserAction('API_TEST_COMPLETED', {
        module: 'API_TEST',
        totalTests: this.results.length,
        timestamp: new Date().toISOString()
      })
    );
  }
  
  private async testEndpoint(
    name: string,
    testFn: () => Promise<Response>
  ): Promise<ApiTestResult> {
    const startTime = Date.now();
    const result: ApiTestResult = {
      endpoint: name,
      method: name.split(' ')[0],
      timestamp: new Date().toISOString(),
      success: false
    };
    
    try {
      const response = await testFn();
      const duration = Date.now() - startTime;
      
      result.status = response.status;
      result.statusText = response.statusText;
      result.success = response.ok;
      
      try {
        result.data = await response.json();
      } catch {
        result.data = await response.text();
      }
      
      console.log(`${result.success ? '✅' : '❌'} ${name} - ${response.status} (${duration}ms)`);
      
    } catch (error) {
      result.error = error;
      result.success = false;
      console.log(`❌ ${name} - Erro: ${error}`);
    }
    
    this.results.push(result);
    return result;
  }
  
  private generateSummary() {
    const total = this.results.length;
    const success = this.results.filter(r => r.success).length;
    const failed = total - success;
    
    return { total, success, failed };
  }
  
  private async saveResults(testSuite: ApiTestSuite) {
    try {
      // Salvar resultado completo
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const filename = `api-test-results-${timestamp}.json`;
      const filePath = path.join(process.cwd(), 'api-test-results', filename);
      
      // Criar diretório se não existir
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      
      // Salvar arquivo
      await fs.writeFile(filePath, JSON.stringify(testSuite, null, 2));
      
      console.log(`\n💾 Resultados salvos em: ${filePath}`);
      
      // Salvar também respostas individuais por endpoint
      for (const result of testSuite.results) {
        if (result.success && result.data) {
          const endpointName = result.endpoint.replace(/[^a-zA-Z0-9]/g, '-');
          const endpointFile = `${endpointName}-response.json`;
          const endpointPath = path.join(process.cwd(), 'api-test-results', 'responses', endpointFile);
          
          await fs.mkdir(path.dirname(endpointPath), { recursive: true });
          await fs.writeFile(endpointPath, JSON.stringify(result.data, null, 2));
        }
      }
      
      // Criar índice de todas as respostas
      const index = testSuite.results
        .filter(r => r.success)
        .map(r => ({
          endpoint: r.endpoint,
          method: r.method,
          status: r.status,
          file: `${r.endpoint.replace(/[^a-zA-Z0-9]/g, '-')}-response.json`
        }));
      
      const indexPath = path.join(process.cwd(), 'api-test-results', 'responses', 'index.json');
      await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
      
      console.log('📁 Respostas individuais salvas em: api-test-results/responses/');
      
    } catch (error) {
      console.error('❌ Erro ao salvar resultados:', error);
    }
  }
}

// Exportar para uso em scripts
export const apiTestRunner = new ApiTestRunner();

// Função para executar testes
export async function runApiTests() {
  return apiTestRunner.runAllTests();
}

// Se executado diretamente via Node.js
if (require.main === module) {
  runApiTests().then(() => {
    console.log('✅ Testes concluídos!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
}