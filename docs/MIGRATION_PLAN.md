# Plano de Migração para Dados Reais - VEP NextJS

## 📊 Estado Atual do Sistema

### 1. Páginas com Integração Real (✅ Completas)
- **Dashboard** - Usa banco de dados PostgreSQL local
- **FinancesWeb Sync** - Integração completa com API externa e banco local

### 2. Páginas com APIs Externas Railway (⚠️ Dependentes)
Estas páginas dependem de microsserviços externos que podem não estar sincronizados com o banco local:

| Página | API Externa | Status |
|--------|------------|--------|
| Produtos | api-jornada-produto | Funcionando via proxy |
| Clientes | api-customers | Funcionando via proxy |
| Fornecedores | api-customers | Funcionando via proxy |
| Operadores | api-users | Funcionando via proxy |
| Usuários | api-users | Funcionando via proxy |
| Pedidos | api-dashboard | Funcionando via proxy |
| UserLogs | api-userlog | Funcionando via proxy |
| Jornada Pedido | api-dashboard | Funcionando via proxy |
| Jornada Produto | api-jornada-produto | Funcionando via proxy |
| Jornada Entrega | api-delivery | Funcionando via proxy |
| Rotas Entrega | api-delivery | Funcionando via proxy |

### 3. Estrutura do Banco de Dados Local

Tabelas disponíveis no PostgreSQL:
- `users` - Usuários do sistema
- `pedidos_venda_produtos` - Pedidos e produtos
- `produtos` - Catálogo de produtos
- `pessoas` - Clientes e fornecedores
- `operadores_financesweb` - Sincronizado do FinancesWeb
- `produtos_financesweb` - Sincronizado do FinancesWeb
- `pessoas_financesweb` - Sincronizado do FinancesWeb
- `pedidos_detalhe_financesweb` - Sincronizado do FinancesWeb

## 🎯 Plano de Migração

### Fase 1: Unificar Dados de Produtos (Prioridade Alta)
**Problema**: Existem 2 fontes de produtos:
- Tabela `produtos` (vazia ou com poucos dados)
- Tabela `produtos_financesweb` (450+ produtos do FinancesWeb)

**Solução**:
1. Criar serviço unificado de produtos que:
   - Use `produtos_financesweb` como fonte principal
   - Migre gradualmente para tabela `produtos` local
   - Mantenha compatibilidade com ambas APIs

**Implementação**:
```typescript
// src/services/database/unifiedProductService.ts
class UnifiedProductService {
  async getProducts() {
    // 1. Buscar do FinancesWeb primeiro
    // 2. Fallback para tabela produtos local
    // 3. Mesclar resultados se necessário
  }
}
```

### Fase 2: Migrar Clientes/Fornecedores (Prioridade Alta)
**Problema**: 
- Tabela `pessoas` existe mas pode estar vazia
- Tabela `pessoas_financesweb` tem dados reais de empresas

**Solução**:
1. Criar serviço unificado de pessoas
2. Sincronizar dados do FinancesWeb com tabela local
3. Adaptar páginas para usar novo serviço

### Fase 3: Criar Serviços de Pedidos (Prioridade Média)
**Problema**: 
- Pedidos estão em `pedidos_venda_produtos` (estrutura antiga)
- Novos pedidos em `pedidos_detalhe_financesweb`

**Solução**:
1. Criar novo modelo de pedidos unificado
2. Migrar dados históricos
3. Adaptar interfaces

### Fase 4: Operadores e Usuários (Prioridade Baixa)
**Problema**: 
- Tabela `users` para autenticação
- Tabela `operadores_financesweb` com dados do ERP

**Solução**:
1. Sincronizar operadores com usuários do sistema
2. Manter autenticação local
3. Importar dados complementares do FinancesWeb

## 🚀 Implementação Recomendada

### 1. Criar API Interna Unificada
```typescript
// src/app/api/v2/produtos/route.ts
export async function GET() {
  const financesweb = await produtoFinanceswebService.getAll();
  const local = await produtoService.getAll();
  return combineAndDeduplicate(financesweb, local);
}
```

### 2. Adaptar Frontend Gradualmente
```typescript
// Manter compatibilidade durante transição
const produtos = isNewApiEnabled 
  ? await fetch('/api/v2/produtos')
  : await railwayApi.getProducts();
```

### 3. Sincronização Automática
- Configurar job para sincronizar FinancesWeb a cada 6 horas
- Manter cache local atualizado
- Reduzir dependência de APIs externas

## 📅 Cronograma Sugerido

| Semana | Atividade |
|--------|-----------|
| 1 | Implementar serviço unificado de produtos |
| 2 | Migrar página de produtos para usar dados locais |
| 3 | Implementar serviço de clientes/fornecedores |
| 4 | Migrar páginas de clientes e fornecedores |
| 5-6 | Implementar novo modelo de pedidos |
| 7-8 | Migrar jornadas (pedido, produto, entrega) |

## 🔧 Benefícios da Migração

1. **Performance**: Queries locais são mais rápidas
2. **Confiabilidade**: Menos dependência de serviços externos
3. **Flexibilidade**: Facilita customizações e relatórios
4. **Custo**: Reduz chamadas para APIs externas
5. **Manutenção**: Código mais simples e centralizado

## ⚠️ Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Inconsistência de dados | Sincronização regular com FinancesWeb |
| Quebra de funcionalidades | Testes extensivos e rollback gradual |
| Performance do banco | Índices otimizados e cache |
| Complexidade de migração | Fases incrementais com validação |

## 🏁 Próximos Passos

1. **Imediato**: Começar com serviço unificado de produtos
2. **Curto prazo**: Migrar páginas críticas (produtos, clientes)
3. **Médio prazo**: Unificar modelo de pedidos
4. **Longo prazo**: Eliminar dependência de APIs externas