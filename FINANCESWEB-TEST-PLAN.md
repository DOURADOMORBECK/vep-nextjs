# Plano de Testes da API FinancesWeb

## 🎯 Objetivo
Dominar completamente o comportamento da API FinancesWeb para criar uma implementação robusta e confiável.

## 📁 Arquivos de Teste Criados

### 1. `test-financesweb-quick.ts`
**Propósito**: Teste rápido e simples para verificar se a API está respondendo
```bash
bun run test-financesweb-quick.ts
```

### 2. `test-financesweb-api.ts`
**Propósito**: Bateria completa de testes explorando todos os endpoints
```bash
bun run test-financesweb-api.ts
```

### 3. `test-financesweb-detailed.ts`
**Propósito**: Análise detalhada com geração de relatório
```bash
bun run test-financesweb-detailed.ts
```

## 🔍 O Que Vamos Descobrir

### 1. **Estrutura de Resposta**
- [ ] A API retorna Array direto ou objeto com array dentro?
- [ ] Qual é a chave que contém os dados quando retorna objeto?
- [ ] Como a API indica quando não há dados?

### 2. **Paginação**
- [ ] A API suporta `limit` e `offset`?
- [ ] Existe um limite máximo de registros por requisição?
- [ ] Como saber o total de registros disponíveis?

### 3. **Filtros**
- [ ] Quais operadores são suportados? (eq, gt, gte, lt, lte, like, etc.)
- [ ] É possível combinar múltiplos filtros?
- [ ] Como fazer buscas case-insensitive?

### 4. **Endpoints Disponíveis**
- [ ] `produtos` - Catálogo de produtos
- [ ] `operadores` - Vendedores/operadores
- [ ] `pessoas` - Clientes e fornecedores
- [ ] `vw_pedidos_venda_produtos` - Pedidos detalhados
- [ ] Outros endpoints não documentados?

### 5. **Campos e Tipos**
- [ ] Quais campos estão disponíveis em cada tabela?
- [ ] Quais são os tipos de dados (string, number, date)?
- [ ] Existem campos obrigatórios vs opcionais?

## 📋 Checklist de Execução

1. **Configurar API Key**
   ```bash
   # Edite .env.local e adicione:
   FINANCESWEB_API_KEY=sua_chave_real_aqui
   ```

2. **Executar Teste Rápido**
   ```bash
   bun run test-financesweb-quick.ts
   ```
   - Confirma que a API está acessível
   - Verifica estrutura básica da resposta

3. **Executar Bateria Completa**
   ```bash
   bun run test-financesweb-api.ts
   ```
   - Testa todos os endpoints
   - Explora diferentes filtros
   - Testa paginação

4. **Executar Análise Detalhada**
   ```bash
   bun run test-financesweb-detailed.ts
   ```
   - Gera relatório em `financesweb-api-report.json`
   - Identifica padrões e comportamentos

## 🔧 Ajustes Necessários Após Testes

Com base nos resultados dos testes, precisaremos ajustar:

1. **Função `fetchFromAPI` em `/User_Input/sync-financesweb/config.ts`**
   - Corrigir parsing da resposta
   - Implementar paginação correta
   - Ajustar tratamento de erros

2. **Arquivos de Sincronização**
   - Ajustar para estrutura real da API
   - Implementar paginação se necessário
   - Otimizar queries em lote

3. **Tratamento de Dados**
   - Conversão de tipos corretos
   - Validação de campos obrigatórios
   - Normalização de dados

## 🚀 Próximos Passos

1. Execute os testes na ordem sugerida
2. Analise os logs e o relatório gerado
3. Compartilhe os resultados para ajustarmos a implementação
4. Teste a sincronização ajustada com dados reais

## 💡 Dicas

- Se a API retornar erro 401, verifique a API key
- Se retornar erro 400, o nome da tabela pode estar errado
- Observe o tempo de resposta para otimizar batch sizes
- Verifique se há rate limiting na API