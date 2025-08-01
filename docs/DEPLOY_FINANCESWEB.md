# Deploy da API FinancesWeb no Railway

## Pré-requisitos

1. Conta no Railway
2. Projeto Next.js já deployado
3. API Key do FinancesWeb

## Configuração das Variáveis de Ambiente

No painel do Railway, adicione a seguinte variável de ambiente:

```
FINANCESWEB_API_KEY=sua_api_key_aqui
```

⚠️ **IMPORTANTE**: Nunca commite a API key no código. Sempre use variáveis de ambiente.

## Verificação da Configuração

1. Acesse o terminal do Railway ou logs
2. Verifique se não há erros relacionados à API key
3. Teste a rota de status: `GET /api/financesweb/sync`

## Primeira Sincronização

1. Acesse `/financesweb/sync` no seu domínio
2. Clique em "Sincronizar Tudo"
3. Aguarde o processo completar
4. Verifique os resultados

## Sincronização Automática (Opcional)

Para configurar sincronização automática, você pode:

### Opção 1: Usar Railway Cron Jobs
```json
{
  "crons": [{
    "schedule": "0 */6 * * *",
    "command": "curl -X POST https://seu-app.railway.app/api/financesweb/sync"
  }]
}
```

### Opção 2: Usar um serviço externo como EasyCron
1. Cadastre-se no EasyCron
2. Configure para chamar `POST /api/financesweb/sync`
3. Defina intervalo (recomendado: 6 horas)

## Monitoramento

### Logs
Os logs de sincronização aparecem no console do Railway:
- 🔄 Início da sincronização
- 📦 Quantidade de registros
- ✅ Sucesso
- ❌ Erro

### Endpoints de Verificação
- Status: `GET /api/financesweb/sync`
- Produtos: `GET /api/financesweb/produtos`
- Operadores: `GET /api/financesweb/operadores`
- Pessoas: `GET /api/financesweb/pessoas`

## Troubleshooting

### Erro: "API key não configurada"
- Verifique se FINANCESWEB_API_KEY está definida no Railway
- Reinicie o serviço após adicionar a variável

### Erro: "No item to return was found"
- Normal se não houver dados para sincronizar
- Verifique os filtros aplicados

### Timeout na sincronização
- Sincronize entidades individualmente
- Aumente o timeout do healthcheck no railway.json

## Segurança

1. **API Key**: Sempre use variáveis de ambiente
2. **CORS**: Configure apenas domínios autorizados
3. **Rate Limiting**: Implemente limites de taxa se necessário
4. **Logs**: Não logue informações sensíveis

## Performance

- Primeira sincronização pode demorar mais
- Sincronizações subsequentes são incrementais (upsert)
- Use índices do banco para melhor performance
- Monitore uso de memória durante sincronização

## Backup

Recomenda-se fazer backup do banco antes da primeira sincronização:
```bash
# No Railway CLI
railway run pg_dump $DATABASE_URL > backup_antes_sync.sql
```