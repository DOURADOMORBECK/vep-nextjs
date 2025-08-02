# Troubleshooting - Sincronização FinancesWeb

## Erro 500 ao clicar em "Sincronizar"

### 1. Verificar Configuração da API Key

Acesse: `/api/env-check`

Verifique se mostra:
```json
{
  "financesweb": {
    "apiKeyConfigured": true,
    "keyLength": 36  // ou outro número > 0
  }
}
```

Se `apiKeyConfigured` for `false`:
- Adicione `FINANCESWEB_API_KEY` nas variáveis do Railway
- Reinicie o serviço

### 2. Testar Conexão com FinancesWeb

Acesse: `/api/sync/test`

Resposta esperada:
```json
{
  "success": true,
  "message": "Teste de conexão bem-sucedido"
}
```

Possíveis erros:
- **"FINANCESWEB_API_KEY não configurada"**: Configure a API key
- **"API FinancesWeb retornou erro 401"**: API key inválida
- **"Timeout ao buscar dados"**: Problema de rede ou API fora do ar

### 3. Verificar Logs do Railway

No painel do Railway:
1. Vá em "Deployments"
2. Clique no deployment atual
3. Veja a aba "Logs"

Procure por:
- `[FinancesWeb API]` - Logs da API
- `[SyncService]` - Logs do serviço de sincronização
- `Erro na API de sincronização` - Erro principal

### 4. Verificar Banco de Dados

Acesse: `/test-db`

Se mostrar erro:
- Verifique se o PostgreSQL está rodando no Railway
- Aguarde 1-2 minutos para o banco inicializar

### 5. Testar Sincronização Individual

Tente sincronizar uma entidade por vez:

```bash
# Via interface (logado como admin)
/sync → Clique em "Sincronizar" em Produtos

# Ou via API (com autenticação)
POST /api/sync?entity=produtos&mode=full
```

### 6. Verificar Console do Navegador

Abra o Console (F12) e procure por:
- Erro de JSON parse → Resposta vazia ou inválida
- Status 500 → Erro no servidor

### Soluções Comuns

#### API Key não configurada
```bash
# No Railway:
FINANCESWEB_API_KEY=sua_chave_aqui
```

#### Banco de dados não conectado
```bash
# Verificar se DATABASE_URL existe
# Railway cria automaticamente ao adicionar PostgreSQL
```

#### Timeout na API
- API do FinancesWeb pode estar lenta
- Tente novamente em alguns minutos
- Sincronize entidades individuais

### Debug Avançado

1. **Ativar logs detalhados**:
   - Os logs já estão configurados
   - Verifique logs do Railway em tempo real

2. **Testar API diretamente**:
   ```bash
   curl -H "apikey: SUA_API_KEY" \
        -H "tabela: fnc_produtos_e_servicos" \
        https://flow.financesweb.com.br/webhook/financeserp
   ```

3. **Verificar estrutura de resposta**:
   - A API deve retornar JSON
   - Dados dentro de objeto com nome da tabela

### Contatos de Suporte

- **FinancesWeb**: suporte@financesweb.com.br
- **Railway**: https://railway.app/help
- **Logs da aplicação**: /userlogs (como admin)