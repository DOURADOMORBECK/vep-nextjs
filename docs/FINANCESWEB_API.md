# API FinancesWeb - Documentação

## Visão Geral

Esta API fornece integração com o sistema FinancesWeb, permitindo sincronização e consulta de dados de produtos, operadores, pessoas e pedidos.

## Endpoints

### 1. Sincronização

#### Sincronizar Todos os Dados
```
POST /api/financesweb/sync
```

#### Sincronizar Entidade Específica
```
POST /api/financesweb/sync?entity=[produtos|operadores|pessoas|pedidos]
```

**Resposta de Exemplo:**
```json
{
  "timestamp": "2025-08-01T12:00:00.000Z",
  "results": {
    "produtos": {
      "inseridos": 450,
      "atualizados": 10,
      "erros": 0,
      "total": 460,
      "status": "success"
    }
  },
  "errors": [],
  "success": true
}
```

### 2. Consulta de Produtos

#### Listar Todos os Produtos
```
GET /api/financesweb/produtos
```

#### Buscar Produto por ID
```
GET /api/financesweb/produtos?id=123
```

#### Pesquisar Produtos
```
GET /api/financesweb/produtos?search=termo
```

### 3. Consulta de Operadores

#### Listar Todos os Operadores
```
GET /api/financesweb/operadores
```

#### Listar Apenas Operadores Ativos
```
GET /api/financesweb/operadores?ativos=true
```

#### Buscar Operador por ID
```
GET /api/financesweb/operadores?id=123
```

#### Pesquisar Operadores
```
GET /api/financesweb/operadores?search=nome
```

### 4. Consulta de Pessoas

#### Listar Todas as Pessoas
```
GET /api/financesweb/pessoas
```

#### Listar Apenas Pessoas Jurídicas
```
GET /api/financesweb/pessoas?tipo=pj
```

#### Buscar Pessoa por ID
```
GET /api/financesweb/pessoas?id=123
```

#### Pesquisar Pessoas
```
GET /api/financesweb/pessoas?search=termo
```

### 5. Consulta de Pedidos

#### Buscar Pedidos por ID do Pedido
```
GET /api/financesweb/pedidos?pedidoId=123
```

#### Buscar Pedidos por Cliente
```
GET /api/financesweb/pedidos?clienteId=456
```

#### Buscar Pedidos por Produto
```
GET /api/financesweb/pedidos?produtoId=789
```

#### Buscar Pedidos por Período
```
GET /api/financesweb/pedidos?startDate=2025-01-01&endDate=2025-12-31
```

#### Obter Totais por Cliente
```
GET /api/financesweb/pedidos?totals=cliente
```

#### Obter Totais por Produto
```
GET /api/financesweb/pedidos?totals=produto
```

## Interface Web

Acesse a interface de sincronização em:
```
/financesweb/sync
```

Esta interface permite:
- Sincronizar todos os dados de uma vez
- Sincronizar entidades individuais
- Visualizar resultados da última sincronização
- Monitorar erros e status

## Configuração

### Variáveis de Ambiente

```env
# API Key do FinancesWeb (obrigatória)
FINANCESWEB_API_KEY=sua_api_key_aqui

# Banco de dados PostgreSQL
DATABASE_URL=postgresql://...
```

### Estrutura do Banco de Dados

As seguintes tabelas são criadas automaticamente:
- `produtos_financesweb`
- `operadores_financesweb`
- `pessoas_financesweb`
- `pedidos_detalhe_financesweb`

## Fluxo de Sincronização

1. **Busca de Dados**: A API busca dados do FinancesWeb
2. **Validação**: Os dados são validados e preparados
3. **Upsert**: Registros são inseridos ou atualizados no banco
4. **Relatório**: Um relatório de sincronização é retornado

## Tratamento de Erros

A API implementa tratamento robusto de erros:
- Erros de conexão com FinancesWeb
- Erros de banco de dados
- Validação de dados
- Timeouts e limites de taxa

## Exemplo de Uso

```javascript
// Sincronizar todos os dados
const response = await fetch('/api/financesweb/sync', {
  method: 'POST'
});
const result = await response.json();

// Buscar produtos
const produtos = await fetch('/api/financesweb/produtos').then(r => r.json());

// Pesquisar clientes
const clientes = await fetch('/api/financesweb/pessoas?search=supermercado&tipo=pj')
  .then(r => r.json());
```

## Manutenção

### Logs
Os logs de sincronização são exibidos no console do servidor com os seguintes indicadores:
- 🔄 Início da sincronização
- 📦 Quantidade de registros encontrados
- ✅ Sucesso
- ❌ Erro

### Monitoramento
Recomenda-se monitorar:
- Taxa de sucesso das sincronizações
- Tempo de resposta da API
- Quantidade de erros por entidade
- Uso de memória durante sincronização

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs do servidor
2. Confirme as variáveis de ambiente
3. Teste a conexão com FinancesWeb
4. Verifique permissões do banco de dados