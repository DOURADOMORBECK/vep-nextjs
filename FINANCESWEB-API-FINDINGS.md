# Descobertas sobre a API FinancesWeb

## 🔍 Resumo Executivo

A API está retornando consistentemente `{"status":"erro","motivo":"Layout inválido"}` para todas as requisições POST, independentemente dos parâmetros enviados.

## 📊 Testes Realizados

### 1. **Formatos Testados**
- ✅ API Key válida confirmada (GET retorna "Não autorizado", POST retorna "Layout inválido")
- ❌ Formato básico: `{api_key, tabela}`
- ❌ Com filtros: `{api_key, tabela, filtro}`
- ❌ Com paginação: `{api_key, tabela, limit, offset}`
- ❌ Com campo layout: `{api_key, tabela, layout: "valor"}`
- ❌ Múltiplas variações de layout (23 valores diferentes testados)

### 2. **Endpoints Testados**
Todos retornaram "Layout inválido":
- `produtos`
- `operadores`
- `pessoas`
- `vw_pedidos_venda_produtos`
- `pedidos`
- `marcas`
- `grupos_produtos`
- `departamentos`

### 3. **Descobertas Importantes**

1. **API Key está funcionando**
   - GET sem autenticação: `"Não autorizado"`
   - POST com API key: `"Layout inválido"`
   - Isso confirma que a autenticação está OK

2. **"Layout" não é um campo da requisição**
   - Testar com `layout: "valor"` não muda o erro
   - O erro persiste mesmo sem o campo layout

3. **Erro é consistente**
   - Sempre retorna exatamente: `{"status":"erro","motivo":"Layout inválido"}`
   - Status HTTP sempre 200 (não usa códigos de erro HTTP)

## 💡 Hipóteses

### Hipótese Mais Provável: Layout é uma Configuração no Sistema

O termo "Layout" provavelmente se refere a uma configuração que precisa ser criada no sistema FinancesWeb ANTES de usar a API:

1. **Layout = Template de Dados**
   - Define quais campos serão retornados
   - Define formato da resposta
   - Precisa ser configurado no painel do FinancesWeb

2. **Cada empresa/usuário precisa criar seus layouts**
   - Explicaria por que a mesma API key sempre retorna este erro
   - O layout seria vinculado à API key

3. **Documentação incompleta**
   - A documentação da API não menciona esta configuração
   - Provavelmente há um painel administrativo para criar layouts

## 🔧 Próximos Passos Recomendados

### 1. **Verificar no Sistema FinancesWeb**
Procurar no painel administrativo do FinancesWeb por:
- Configurações de API
- Layouts de exportação
- Templates de dados
- Webhooks configurados

### 2. **Contatar Suporte**
Perguntar especificamente:
- "Como criar um layout para usar a API?"
- "Qual layout devo usar para acessar produtos/pedidos?"
- "Existe um layout padrão disponível?"

### 3. **Solução Alternativa**
Enquanto não resolver o layout, considerar:
- Usar exportação manual do FinancesWeb
- Verificar se há outra API disponível
- Solicitar acesso direto ao banco de dados

## 📝 Código de Teste para Quando o Layout Estiver Configurado

```typescript
// Quando descobrir o nome do layout correto, use assim:
const requestBody = {
  api_key: "18028EFB-5305-4B19-8CA0-8AA9D8636BE7",
  tabela: "produtos",
  layout: "NOME_DO_LAYOUT_AQUI", // <-- Substituir pelo layout criado no sistema
};

// OU pode ser que o layout seja parte da URL ou outro campo
// Aguardar confirmação do suporte
```

## 🚨 Ação Imediata Necessária

**Não é possível prosseguir com a implementação sem resolver a questão do "Layout".**

Entre em contato com o suporte do FinancesWeb ou acesse o painel administrativo para criar/descobrir os layouts necessários.