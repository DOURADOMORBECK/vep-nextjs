# Guia de Implementação - API FinancesWeb

## ✅ Formato Correto da API

A API FinancesWeb usa:
- **Método**: GET (não POST)
- **Parâmetros**: Enviados nos headers (não no body)
- **Autenticação**: API key no header `apikey`

### Exemplo de Requisição Correta

```typescript
const headers = {
  "Content-Type": "application/json",
  "apikey": "18028EFB-5305-4B19-8CA0-8AA9D8636BE7",
  "tabela": "fnc_produtos_e_servicos",
  "filtro": "fnc_pro_status=eq.1" // opcional
};

const response = await fetch("https://flow.financesweb.com.br/webhook/financeserp", {
  method: "GET",
  headers
});
```

## 📊 Tabelas Disponíveis

| Tabela | Descrição | Exemplo de Filtro |
|--------|-----------|-------------------|
| `fnc_produtos_e_servicos` | Produtos e serviços | `fnc_pro_status=eq.1` (ativos) |
| `fnc_operadores` | Vendedores/operadores | `fnc_ope_status=eq.1` |
| `fnc_pessoas` | Clientes e fornecedores | `fnc_pes_tipo=eq.J` (PJ) |
| `vw_pedidos_venda_produtos` | Pedidos detalhados | `fnc_nat_origem=eq.1` |

## 🔍 Operadores de Filtro

- `eq` - Igual: `campo=eq.valor`
- `gt` - Maior que: `campo=gt.valor`
- `gte` - Maior ou igual: `campo=gte.valor`
- `lt` - Menor que: `campo=lt.valor`
- `lte` - Menor ou igual: `campo=lte.valor`

### Filtros Múltiplos
Use `&` para combinar: `campo1=eq.valor1&campo2=gt.valor2`

## 📦 Estrutura da Resposta

A API retorna um objeto com o nome da tabela como chave:

```json
{
  "fnc_produtos_e_servicos": [
    {
      "fnc_pro_id": 4195,
      "fnc_pro_descricao": "CLC 25 - DESENT. SANITARIO",
      "fnc_pro_preco_a_vista": 1.5559,
      // ... outros campos
    }
  ]
}
```

## 🚀 Implementação Correta

### 1. Arquivo de Configuração (`config.ts`)

```typescript
export async function fetchFromAPI(tabela: string, filtro?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "apikey": API_CONFIG.apiKey,
    "tabela": tabela,
  };

  if (filtro) {
    headers["filtro"] = filtro;
  }

  const response = await fetch(API_CONFIG.baseUrl, {
    method: "GET",
    headers,
  });

  const data = await response.json();
  
  // Extrai o array de dados
  if (data[tabela]) {
    return data[tabela];
  }
  
  // Fallback para outros formatos
  const firstArray = Object.values(data).find(v => Array.isArray(v));
  return firstArray || [];
}
```

### 2. Uso nos Arquivos de Sincronização

```typescript
// sync-produtos.ts
const produtos = await fetchFromAPI("fnc_produtos_e_servicos");

// sync-pessoas.ts - apenas PJ
const pessoas = await fetchFromAPI("fnc_pessoas", "fnc_pes_tipo=eq.J");

// sync-pedidos.ts - com filtro composto
const pedidos = await fetchFromAPI(
  "vw_pedidos_venda_produtos", 
  "fnc_nat_origem=eq.1&fnc_pve_data_emissao=gte.2025-01-01"
);
```

## 📁 Estrutura de Arquivos

```
User_Input/sync-financesweb/
├── config.ts               # Configuração e helpers
├── sync-produtos.ts        # Sincroniza produtos
├── sync-operadores.ts      # Sincroniza operadores
├── sync-pessoas.ts         # Sincroniza pessoas (PJ)
├── sync-pedidos-detalhe.ts # Sincroniza pedidos
├── sync-all.ts            # Servidor principal
└── README.md              # Documentação
```

## 🔧 Deploy no Railway

1. Faça o deploy dos arquivos
2. Configure as variáveis de ambiente:
   - `DATABASE_URL` - Conexão PostgreSQL
   - `FINANCESWEB_API_KEY` - Chave da API
3. Execute `sync-all.ts` como servidor Bun
4. Configure cron jobs para sincronização periódica

## ⚠️ Observações Importantes

1. **Não há paginação**: A API retorna todos os registros de uma vez
2. **Limite de registros**: Aparentemente limitado a 1000 por requisição
3. **Tipos de pessoa**: Use `J` para jurídica, não `PJ`
4. **Prefixos**: Todas as tabelas começam com `fnc_`
5. **Views**: Pedidos usa `vw_pedidos_venda_produtos`

## 🧪 Testando a Implementação

Execute localmente:
```bash
bun run test-api-only.ts
```

Para testar com banco de dados (Railway):
```bash
bun run sync-all.ts
```