# Implementação de Sincronização Automática com FinancesWeb

## Resumo

Implementamos um sistema de sincronização automática e incremental que é executado após o login do usuário, garantindo que os dados do FinancesWeb ERP sejam sempre atualizados no sistema.

## Funcionalidades Implementadas

### 1. Sincronização Automática no Login
- **Arquivo**: `/src/services/dataInitializationService.ts`
- Após login bem-sucedido, o sistema verifica se precisa sincronizar dados
- Sincroniza automaticamente se:
  - Não há dados (primeira vez)
  - Última sincronização foi há mais de 1 hora
  - Alguma tabela tem 0 registros

### 2. Sincronização Incremental
- **Arquivo**: `/src/services/sync/IncrementalSyncService.ts`
- Sincroniza apenas dados novos ou alterados desde a última sincronização
- Processa dados em lotes de 100 registros para melhor performance
- Suporta 4 entidades principais:
  - Produtos (`fnc_produtos_e_servicos`)
  - Pessoas (`fnc_pessoas`)
  - Operadores (`fnc_operadores`)
  - Pedidos (`vw_pedidos_venda_produtos`)

### 3. Feedback Visual do Progresso
- **Arquivo**: `/src/components/SyncProgressModal.tsx`
- Modal que mostra o progresso em tempo real
- Exibe status de cada entidade:
  - Aguardando
  - Sincronizando (com barra de progresso)
  - Concluído
  - Erro
- Fecha automaticamente após conclusão

### 4. Cliente de Sincronização (Client-Side)
- **Arquivo**: `/src/services/sync/IncrementalSyncClient.ts`
- Versão client-side para evitar erros de build
- Simula progresso visual enquanto sincronização real acontece no servidor
- Sistema de callbacks para atualizar UI em tempo real

## Correções de Problemas

### 1. Mapeamento de Colunas
Corrigimos o mapeamento de colunas que não existem no banco:
- Removido `fnc_pes_tipo_pessoa` 
- Removido `fnc_pes_razao_social`
- Mudado `fnc_pes_telefone` → `fnc_pes_telefone_principal`
- Adicionado suporte para `fnc_pes_ativo` como alternativa

### 2. Separação Client/Server
- Criamos versões separadas dos serviços para client e server
- Evita erros de importação de módulos Node.js no client-side

## Como Funciona

1. **Login**: Usuário faz login normalmente
2. **Verificação**: Sistema verifica necessidade de sincronização
3. **Modal**: Exibe modal de progresso se sincronização necessária
4. **Sincronização**: Executa sincronização incremental em background
5. **Conclusão**: Redireciona para dashboard após conclusão

## Configuração Necessária

Certifique-se que a variável de ambiente está configurada:
```env
FINANCESWEB_API_KEY=18028EFB-5305-4B19-8CA0-8AA9D8636BE7
```

## Endpoints de API

### Verificar Configuração
```bash
curl http://localhost:3000/api/financesweb/check
```

### Sincronizar Manualmente
```bash
# Sincronizar tudo
curl -X POST http://localhost:3000/api/financesweb/sync

# Sincronizar apenas pessoas
curl -X POST http://localhost:3000/api/financesweb/sync?entity=pessoas
```

## Benefícios

1. **Automático**: Sem necessidade de intervenção manual
2. **Incremental**: Sincroniza apenas dados novos/alterados
3. **Visual**: Feedback claro do progresso
4. **Resiliente**: Não bloqueia login se sincronização falhar
5. **Performático**: Processa em lotes, evita timeout