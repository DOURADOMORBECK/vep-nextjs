# Checklist de Deploy no Railway

## ✅ Pré-Deploy

- [ ] Código testado localmente
- [ ] Build sem erros: `npm run build`
- [ ] Projeto conectado ao GitHub

## ✅ No Railway

- [ ] Criar novo projeto
- [ ] Adicionar PostgreSQL (New → Database → Add PostgreSQL)
- [ ] Conectar repositório GitHub

## ✅ Variáveis de Ambiente no Railway

### Obrigatórias:
- [ ] `FINANCESWEB_API_KEY` - Chave da API do FinancesWeb
- [ ] `JWT_SECRET` - String segura de 32+ caracteres

### Opcionais:
- [ ] `NODE_ENV` - production (Railway configura automaticamente)

### NÃO adicionar (Railway configura):
- [ ] `DATABASE_URL`
- [ ] `PORT`
- [ ] `RAILWAY_ENV`

## ✅ Pós-Deploy

### 1. Verificações Iniciais
- [ ] Acessar `/api/env-check` - Verificar configuração
- [ ] Acessar `/test-db` - Testar conexão com banco
- [ ] Fazer login como admin

### 2. Primeira Sincronização
- [ ] Acessar `/sync` como admin
- [ ] Executar sincronização completa
- [ ] Verificar logs em `/userlogs`
- [ ] Confirmar dados em `/produtos`, `/clientes`, etc

### 3. Configurar Cron Job (Opcional)
- [ ] Criar conta em cron-job.org ou similar
- [ ] Configurar chamada para `/api/sync/cron`
- [ ] Agendar a cada 4 horas

## ⚠️ Troubleshooting

### Se a sincronização falhar:
1. Verificar `/api/env-check`
2. Confirmar `FINANCESWEB_API_KEY` está configurada
3. Verificar logs do Railway
4. Testar `/api/financesweb/sync?entity=produtos` individualmente

### Se o login falhar:
1. Verificar `JWT_SECRET` está configurada
2. Verificar se o banco tem a tabela `usuarios`
3. Confirmar que há usuários cadastrados

## 📞 Suporte

- **FinancesWeb API Key**: suporte@financesweb.com.br
- **Railway**: https://railway.app/help
- **Aplicação**: Verificar logs em `/userlogs`