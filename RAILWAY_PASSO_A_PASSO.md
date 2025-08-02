# Deploy no Railway - Passo a Passo

## 🚀 Etapa 1: Preparar o Projeto

```bash
# Testar localmente
npm install
npm run build
```

## 🚂 Etapa 2: Criar Projeto no Railway

1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Clique em **"New Project"**
4. Escolha **"Deploy from GitHub repo"**
5. Selecione seu repositório

## 🗄️ Etapa 3: Adicionar PostgreSQL

1. No seu projeto Railway, clique em **"New"**
2. Selecione **"Database"**
3. Escolha **"Add PostgreSQL"**
4. Aguarde a criação (Railway configura `DATABASE_URL` automaticamente)

## 🔑 Etapa 4: Configurar Variáveis

1. Clique na aba **"Variables"**
2. Adicione estas 2 variáveis:

### FINANCESWEB_API_KEY
```
Valor: sua_chave_api_aqui
```
*Obtenha com: suporte@financesweb.com.br*

### JWT_SECRET
```
Valor: gerar_com_comando_abaixo
```
*Gere com:* `openssl rand -base64 32`

## ✅ Etapa 5: Deploy

1. Railway fará o deploy automaticamente
2. Aguarde o build completar
3. Clique no link gerado para acessar

## 🎯 Etapa 6: Primeira Sincronização

1. Acesse `https://seu-app.railway.app/login`
2. Faça login como admin
3. Vá em `https://seu-app.railway.app/sync`
4. Clique em **"Sincronização Completa"**

## ⏰ Etapa 7: Cron Automático (Opcional)

1. Gere um token JWT:
```bash
JWT_SECRET=mesmo_secret_do_railway node scripts/generate-cron-token.js
```

2. Configure em [cron-job.org](https://cron-job.org):
   - URL: `https://seu-app.railway.app/api/sync/cron`
   - Headers: `Cookie: veplim-auth-token=TOKEN_GERADO`
   - Frequência: A cada 4 horas

## 🎉 Pronto!

Sua aplicação está rodando com:
- ✅ Banco de dados PostgreSQL
- ✅ Sincronização com FinancesWeb
- ✅ Sistema de autenticação
- ✅ Todas as funcionalidades

## ❓ Problemas Comuns

### "Database connection failed"
→ Aguarde 1-2 minutos para o PostgreSQL inicializar

### "API key não configurada"
→ Verifique se adicionou `FINANCESWEB_API_KEY`

### "Login falhou"
→ Verifique se adicionou `JWT_SECRET`

### "Sincronização não funciona"
→ Confirme que é usuário admin e tem a API key configurada