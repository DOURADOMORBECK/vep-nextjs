# API Test Results

Este diretório contém os resultados dos testes automatizados das APIs Railway.

## Como executar os testes

### 1. Pela interface web
1. Acesse `/api-test` no aplicativo
2. Clique em "Executar Testes"
3. Os resultados serão exibidos na tela
4. Use "Baixar Resultados" para salvar em JSON

### 2. Via linha de comando
```bash
# Execute o script de teste
npm run test-apis

# Ou diretamente
node scripts/test-apis.js
```

## Configuração

Antes de executar os testes, configure as variáveis de ambiente no arquivo `.env.local`:

```env
BUN_AUDIT_SERVICE_URL=https://sua-api-audit.railway.app
BUN_CUSTOMERS_SERVICE_URL=https://sua-api-customers.railway.app
BUN_DASHBOARD_SERVICE_URL=https://sua-api-dashboard.railway.app
BUN_DELIVERY_SERVICE_URL=https://sua-api-delivery.railway.app
BUN_JORNADA_PRODUTO_SERVICE_URL=https://sua-api-produtos.railway.app
BUN_USERLOG_SERVICE_URL=https://sua-api-userlog.railway.app
BUN_USERS_SERVICE_URL=https://sua-api-users.railway.app
BUN_VEHICLES_SERVICE_URL=https://sua-api-vehicles.railway.app
```

## Estrutura dos resultados

### Arquivos gerados
- `test-results-YYYY-MM-DD-HH-mm-ss.json` - Resultado completo dos testes
- `responses/` - Diretório com respostas individuais de cada endpoint
- `responses/index.json` - Índice de todos os endpoints testados

### Formato do resultado
```json
{
  "timestamp": "2024-01-31T10:00:00.000Z",
  "duration": 5432,
  "total": 25,
  "success": 23,
  "failed": 2,
  "results": [
    {
      "endpoint": "GET /api/products",
      "method": "GET",
      "url": "https://api.railway.app/api/products",
      "timestamp": "2024-01-31T10:00:01.000Z",
      "success": true,
      "status": 200,
      "statusText": "OK",
      "duration": 234,
      "data": { ... }
    }
  ]
}
```

## Endpoints testados

### Autenticação
- POST /auth/login

### Produtos (Jornada Produto Service)
- GET /api/products
- POST /api/products
- GET /api/products/:id
- PUT /api/products/:id
- DELETE /api/products/:id

### Clientes (Customers Service)
- GET /api/customers
- POST /api/customers
- GET /api/customers/:id
- PUT /api/customers/:id
- DELETE /api/customers/:id

### Pedidos (Dashboard Service)
- GET /api/orders
- POST /api/orders
- GET /api/orders/:id
- PUT /api/orders/:id

### Operadores (Users Service)
- GET /api/users?role=operator
- POST /api/users
- GET /api/users/:id
- PUT /api/users/:id
- DELETE /api/users/:id

### Fornecedores (Customers Service)
- GET /api/suppliers
- POST /api/suppliers
- GET /api/suppliers/:id
- PUT /api/suppliers/:id
- DELETE /api/suppliers/:id

### Usuários (Users Service)
- GET /api/users
- POST /api/users
- GET /api/users/:id
- PUT /api/users/:id
- DELETE /api/users/:id

### Veículos (Vehicles Service)
- GET /api/vehicles
- POST /api/vehicles
- GET /api/vehicles/:id
- PUT /api/vehicles/:id
- DELETE /api/vehicles/:id

### Entregas (Delivery Service)
- GET /api/deliveries
- GET /api/deliveries/:id
- PUT /api/deliveries/:id/status

### Logs (UserLog Service)
- POST /api/logs

## Credenciais de teste

```json
{
  "email": "admin@veplim.com",
  "password": "admin123",
  "role": "admin"
}
```

## Observações

1. Os testes criam dados temporários que são deletados ao final
2. Alguns dados (como cliente e pedido) são mantidos para testes de relacionamento
3. Todos os endpoints são testados com token de autenticação
4. As respostas são salvas automaticamente para análise posterior
5. O interceptor de API também captura todas as requisições durante o desenvolvimento