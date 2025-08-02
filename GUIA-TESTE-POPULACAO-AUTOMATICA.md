# 🧪 Guia de Teste - População Automática de Dados

## 📋 Checklist de Verificação

### 1. **Teste de Login**
- [ ] Acesse https://app.veplim.com.br
- [ ] Use as credenciais:
  - Email: `morbeck@merun.com.br`
  - Senha: `123456`
- [ ] Após clicar em "Entrar", observe se aparece:
  - Toast/notificação: "Preparando o sistema..."
  - Seguido de: "Sistema pronto para uso!"

### 2. **Verificar Cache no Navegador**
Após o login, abra o DevTools (F12) e vá para:
- **Chrome**: Application → Local Storage → app.veplim.com.br
- **Firefox**: Storage → Local Storage → app.veplim.com.br

Procure por estas chaves:
- [ ] `cache_produtos` - deve ter dados de produtos
- [ ] `cache_clientes` - deve ter dados de clientes
- [ ] `cache_fornecedores` - deve ter dados de fornecedores
- [ ] `cache_pedidos` - deve ter dados de pedidos
- [ ] `lastDataInitialization` - deve ter timestamp recente

### 3. **Teste de Performance**
- [ ] **Dashboard**: Deve carregar instantaneamente com:
  - Gráficos funcionais
  - Cards com estatísticas reais
  - Sem indicador de "dados demo"
  
- [ ] **Produtos**: Deve mostrar:
  - Lista de produtos reais
  - Sem mensagem de "Sincronizar dados"
  - Carregamento instantâneo
  
- [ ] **Clientes**: Deve exibir:
  - Cards de clientes reais
  - Sem botão de sincronização visível
  - Dados completos

### 4. **Teste de Navegação**
- [ ] Navegue rapidamente entre páginas
- [ ] Observe que não há loading entre páginas
- [ ] Dados aparecem instantaneamente

### 5. **Teste de Refresh**
- [ ] Faça refresh (F5) em qualquer página
- [ ] Os dados devem continuar carregando rapidamente do cache
- [ ] Não deve refazer a sincronização (cache válido por 1 hora)

## 🚨 Possíveis Problemas

### Se os dados não estão sendo populados:

1. **Cache do Navegador**
   - Limpe o cache: Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)
   - Ou abra em aba anônima/privada

2. **Verificar Console**
   - Abra o Console do DevTools (F12)
   - Procure por mensagens como:
     - "🚀 Iniciando carregamento automático de dados..."
     - "✅ produtos carregados"
     - Erros de CORS ou API

3. **Deploy Pode Estar em Andamento**
   - Railway pode levar 2-5 minutos para deploy
   - Verifique em alguns minutos

## 📊 Resultado Esperado

✅ **Com População Automática Funcionando:**
- Login → "Preparando sistema" → Dashboard com dados reais
- Navegação instantânea entre páginas
- Sem necessidade de clicar em "Sincronizar"
- Performance excelente

❌ **Sem População Automática:**
- Páginas mostram "dados de demonstração"
- Botões de "Sincronizar" visíveis
- Loading em cada página
- Navegação lenta

## 🔧 Debug Avançado

No Console do navegador, execute:
```javascript
// Ver todos os caches
Object.keys(localStorage).filter(k => k.startsWith('cache_'))

// Ver última inicialização
localStorage.getItem('lastDataInitialization')

// Ver dados de produtos cacheados
JSON.parse(localStorage.getItem('cache_produtos'))
```