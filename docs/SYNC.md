# Sistema de Sincronização ERP FinancesWeb

Este documento descreve o sistema de sincronização entre o ERP FinancesWeb e o banco de dados PostgreSQL local.

## Visão Geral

O sistema de sincronização permite:
- **Sincronização Completa**: Carrega TODOS os dados do ERP sem filtros
- **Sincronização Incremental**: Atualiza apenas registros novos ou modificados
- **Monitoramento em Tempo Real**: Acompanhe o status de cada entidade
- **Logs Detalhados**: Todos os processos são registrados no sistema de logs

## Entidades Sincronizadas

1. **Produtos** (`fnc_produtos_e_servicos`)
   - Descrição, código, categoria, preços
   - Estoque atual e mínimo
   - Status de ativação

2. **Pessoas** (`fnc_pessoas`)
   - Clientes, fornecedores e ambos
   - Dados completos de contato
   - Endereços e coordenadas

3. **Operadores** (`fnc_operadores`)
   - Usuários do sistema
   - Dados de contato
   - Status de ativação

4. **Pedidos** (`vw_pedidos_venda_produtos`)
   - Pedidos de venda completos
   - Itens e valores
   - Status e observações

## Configuração

### 1. Variáveis de Ambiente

```env
# API Key do FinancesWeb (obrigatório)
FINANCESWEB_API_KEY=sua_chave_api_aqui

# Token secreto para cron jobs (opcional)
CRON_SECRET_TOKEN=token_secreto_seguro
```

### 2. Inicialização do Banco

As tabelas são criadas automaticamente na primeira sincronização:
- `sync_control`: Controle de sincronização
- `produtos_financesweb`: Produtos sincronizados
- `pessoas_financesweb`: Pessoas sincronizadas
- `operadores_financesweb`: Operadores sincronizados
- `pedidos_financesweb`: Pedidos sincronizados

## Uso

### Interface Web

Acesse `/sync` no sistema (requer permissão de administrador):
- Visualize o status de cada entidade
- Execute sincronização completa ou incremental
- Acompanhe o progresso em tempo real
- Veja estatísticas detalhadas

### API REST

#### Sincronização Completa (Todas as Entidades)
```bash
POST /api/sync
```

#### Sincronização Completa (Entidade Específica)
```bash
POST /api/sync?entity=produtos
POST /api/sync?entity=pessoas
POST /api/sync?entity=operadores
POST /api/sync?entity=pedidos
```

#### Sincronização Incremental
```bash
POST /api/sync?mode=incremental
POST /api/sync?entity=produtos&mode=incremental
```

#### Verificar Status
```bash
GET /api/sync
GET /api/sync?entity=produtos
```

### Cron Job Automático

**Importante**: O endpoint requer autenticação JWT (usuário admin).

1. **Gere um token JWT para o cron**:
   ```bash
   JWT_SECRET=seu-jwt-secret node scripts/generate-cron-token.js
   ```

2. **Use o token no cookie**:
   ```bash
   curl -H "Cookie: veplim-auth-token=SEU_TOKEN_JWT" \
        https://seu-dominio.com/api/sync/cron
   ```

## Sincronização Incremental

O sistema suporta sincronização incremental baseada em:
- `updated_at` para produtos, pessoas e operadores
- `fnc_ped_data_modificacao` para pedidos

Apenas registros criados ou modificados após a última sincronização são processados.

## Monitoramento

### Logs do Sistema

Todos os processos são registrados em `user_logs`:
- `SYNC_FULL_START`: Início de sincronização completa
- `SYNC_INCREMENTAL_START`: Início de sincronização incremental
- `SYNC_FULL_COMPLETE`: Conclusão com estatísticas
- `SYNC_ERROR`: Erros durante o processo

### Tabela de Controle

A tabela `sync_control` mantém:
- Data da última sincronização
- Quantidade de registros processados
- Status atual (pending, running, completed, error)
- Mensagens de erro (se houver)

## Performance

### Processamento em Chunks

Os dados são processados em lotes para otimizar performance:
- Produtos: 1000 registros por vez
- Pessoas: 500 registros por vez
- Operadores: 100 registros por vez
- Pedidos: 500 registros por vez

### Otimizações

- Índices criados automaticamente nas tabelas
- Operações UPSERT para evitar duplicatas
- Transações para garantir consistência
- Logs assíncronos para não bloquear o processo

## Segurança

1. **API Key**: Necessária para acessar o FinancesWeb
2. **Autenticação**: Apenas administradores podem acessar
3. **Token Cron**: Protege contra execuções não autorizadas
4. **Logs**: Todas as operações são auditadas

## Solução de Problemas

### Erro de API Key
- Verifique se `FINANCESWEB_API_KEY` está configurada
- Confirme se a chave é válida com o FinancesWeb

### Timeout em Sincronização
- Use sincronização por entidade individual
- Verifique a conexão com o banco de dados
- Monitore os logs para identificar o problema

### Dados Não Sincronizando
- Verifique o campo de data de modificação
- Confirme que os dados existem no FinancesWeb
- Execute uma sincronização completa se necessário

## Manutenção

### Limpeza de Logs
```sql
-- Manter apenas últimos 90 dias de logs
DELETE FROM user_logs 
WHERE module = 'SYNC' 
AND timestamp < NOW() - INTERVAL '90 days';
```

### Reset de Sincronização
```sql
-- Resetar controle para forçar sincronização completa
UPDATE sync_control 
SET last_sync_date = NULL, 
    last_record_date = NULL,
    record_count = 0,
    status = 'pending'
WHERE entity = 'nome_da_entidade';
```

## Suporte

Para problemas com a sincronização:
1. Verifique os logs em `/userlogs`
2. Consulte o status em `/sync`
3. Verifique as configurações de ambiente
4. Entre em contato com o suporte técnico