# Configuração Simples para Railway

## Passo 1: Adicione o PostgreSQL no Railway
1. No painel do Railway, clique em "New"
2. Escolha "Database" → "Add PostgreSQL"
3. O Railway criará automaticamente a variável `DATABASE_URL`

## Passo 2: Configure apenas 2 variáveis:

### 1. FINANCESWEB_API_KEY
- **O que é**: Chave para acessar dados do ERP FinancesWeb
- **Como obter**: Entre em contato com suporte@financesweb.com.br
- **Exemplo**: `fwb_k3y_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

### 2. JWT_SECRET  
- **O que é**: Senha para proteger o login dos usuários
- **Como gerar**: `openssl rand -base64 32`
- **Exemplo**: `7K9mPqRsTuVwXyZ123456789AbCdEfGhIjKlMnOpQr=`

## O que o Railway configura automaticamente:
- `DATABASE_URL` - Conexão com PostgreSQL (quando você adiciona o banco)
- `PORT` - Porta da aplicação
- Outras variáveis internas do Railway

## Pronto! 🚀

Com apenas essas 2 variáveis, sua aplicação está pronta para rodar no Railway com:
- ✅ Sistema de login funcionando
- ✅ Sincronização com ERP FinancesWeb
- ✅ Banco de dados PostgreSQL
- ✅ Todas as funcionalidades ativas

## Após o deploy:
1. Acesse `/sync` para fazer a primeira sincronização
2. Para cron automático:
   - Gere um token JWT com o script `node scripts/generate-cron-token.js`
   - Configure em cron-job.org com o token no cookie
   - Chame `/api/sync/cron` a cada 4 horas