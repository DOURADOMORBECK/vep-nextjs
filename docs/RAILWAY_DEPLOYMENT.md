# Deployment no Railway

Este documento detalha como fazer o deploy da aplicação no Railway com todas as configurações necessárias.

## Variáveis de Ambiente Necessárias

Configure estas variáveis no painel do Railway:

### 1. Variáveis Obrigatórias

```env
# API Key do FinancesWeb (ESSENCIAL para sincronização)
FINANCESWEB_API_KEY=sua_chave_api_aqui

# JWT Secret para autenticação
JWT_SECRET=gerar_string_segura_aqui
```

### 2. Variáveis Opcionais

```env
# Ambiente
NODE_ENV=production
```

### 3. Variáveis Automáticas do Railway

O Railway configura automaticamente:
- `DATABASE_URL` - String de conexão PostgreSQL
- `RAILWAY_ENV` - Ambiente do Railway
- `PORT` - Porta da aplicação

## Como Configurar no Railway

1. **Primeiro, adicione o PostgreSQL:**
   - No painel do Railway, clique em "New"
   - Escolha "Database" → "Add PostgreSQL"
   - O Railway criará automaticamente a `DATABASE_URL`

2. **Depois, configure as variáveis:**
   - Acesse seu projeto
   - Vá em "Variables" 
   - Clique em "Add Variable"
   - Adicione cada variável listada acima

2. **Gerando valores seguros:**
   ```bash
   # Para JWT_SECRET
   openssl rand -base64 32
   ```

3. **Obtendo FINANCESWEB_API_KEY:**
   - Entre em contato com o suporte do FinancesWeb
   - Solicite uma API Key para seu domínio
   - Configure no Railway assim que receber

## Sincronização Automática

### 1. Sincronização Manual (via interface)

Após o deploy, acesse:
- `/sync` - Interface de sincronização (requer admin)
- Execute uma sincronização completa inicial

### 2. Cron Job Automático

**Importante**: O endpoint de cron requer autenticação JWT.

1. **Gere um token para o cron**:
   ```bash
   # No seu projeto local
   JWT_SECRET=seu-jwt-secret-do-railway node scripts/generate-cron-token.js
   ```

2. **Configure o cron job** (ex: cron-job.org):
   ```bash
   GET https://seu-app.railway.app/api/sync/cron
   Headers:
     Cookie: veplim-auth-token=SEU_TOKEN_JWT_AQUI
   ```

Sugestão de agendamento:
- A cada 4 horas para sincronização incremental
- 1x por dia para sincronização completa

### 3. GitHub Actions (Opcional)

Crie `.github/workflows/sync.yml`:

```yaml
name: Sync FinancesWeb Data

on:
  schedule:
    - cron: '0 */4 * * *'  # A cada 4 horas
  workflow_dispatch:  # Permite execução manual

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Sync
        env:
          CRON_TOKEN: ${{ secrets.CRON_JWT_TOKEN }}
        run: |
          curl -X GET \
            -H "Cookie: veplim-auth-token=${CRON_TOKEN}" \
            https://seu-app.railway.app/api/sync/cron
```

## Verificação Pós-Deploy

1. **Testar conexão com banco:**
   - Acesse `/test-db`
   - Deve mostrar "Database connection successful"

2. **Verificar API Key:**
   - Acesse `/api/sync`
   - Não deve retornar erro de API key

3. **Executar primeira sincronização:**
   - Acesse `/sync` como admin
   - Execute sincronização completa
   - Monitore os logs

## Monitoramento

### Logs de Sincronização
- Acesse `/userlogs` para ver histórico
- Filtre por módulo "SYNC"
- Verifique erros e estatísticas

### Métricas no Railway
- CPU e memória durante sincronização
- Tempo de resposta das APIs
- Uso do banco de dados

## Troubleshooting

### Erro: "API key não configurada"
- Verifique se `FINANCESWEB_API_KEY` está definida
- Reinicie o serviço após adicionar

### Timeout em sincronização
- Normal para primeira carga completa
- Use sincronização por entidade
- Aumente timeout se necessário

### Endpoint de cron não responde
- Verifique se a URL está correta
- Confirme que o deploy foi feito com sucesso

## Segurança

1. **Nunca commite credenciais no código**
2. **Use valores únicos para cada ambiente**
3. **Rotacione tokens periodicamente**
4. **Monitore logs de acesso não autorizado**

## Suporte

Em caso de problemas:
1. Verifique logs no Railway
2. Consulte `/userlogs` na aplicação
3. Verifique status em `/sync`
4. Entre em contato com suporte técnico