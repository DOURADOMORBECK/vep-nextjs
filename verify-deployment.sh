#!/bin/bash

echo "🔍 Verificando status do deployment..."
echo ""

# Verificar se as páginas V2 existem
echo "📄 Verificando arquivos V2 criados:"
if [ -f "src/app/dashboard/page-v2.tsx" ]; then
    echo "✅ Dashboard V2 existe"
else
    echo "❌ Dashboard V2 não encontrado"
fi

if [ -f "src/app/produtos/page-v2.tsx" ]; then
    echo "✅ Produtos V2 existe"
else
    echo "❌ Produtos V2 não encontrado"
fi

if [ -f "src/app/clientes/page-v2.tsx" ]; then
    echo "✅ Clientes V2 existe"
else
    echo "❌ Clientes V2 não encontrado"
fi

if [ -f "src/app/sync-unified/page.tsx" ]; then
    echo "✅ Sync Unificado existe"
else
    echo "❌ Sync Unificado não encontrado"
fi

echo ""
echo "🧩 Verificando componentes:"
if [ -f "src/components/common/EmptyState.tsx" ]; then
    echo "✅ EmptyState componente existe"
else
    echo "❌ EmptyState componente não encontrado"
fi

if [ -f "src/components/common/LoadingOverlay.tsx" ]; then
    echo "✅ LoadingOverlay componente existe"
else
    echo "❌ LoadingOverlay componente não encontrado"
fi

echo ""
echo "🪝 Verificando hooks:"
if [ -f "src/hooks/useSmartData.ts" ]; then
    echo "✅ useSmartData hook existe"
else
    echo "❌ useSmartData hook não encontrado"
fi

echo ""
echo "📦 Verificando dependências:"
if grep -q "chart.js" package.json; then
    echo "✅ chart.js instalado"
else
    echo "❌ chart.js não encontrado"
fi

if grep -q "react-chartjs-2" package.json; then
    echo "✅ react-chartjs-2 instalado"
else
    echo "❌ react-chartjs-2 não encontrado"
fi

echo ""
echo "🚀 Últimos commits:"
git log --oneline -3

echo ""
echo "📡 Para verificar o deployment ao vivo:"
echo "1. Acesse: https://app.veplim.com.br"
echo "2. Login: morbeck@merun.com.br / 123456"
echo "3. Verifique:"
echo "   - Dashboard com gráficos"
echo "   - Produtos com novo layout"
echo "   - Clientes em cards"
echo "   - Sync unificado em /sync-unified"
echo ""
echo "💡 Dica: Se as mudanças não aparecerem, pode ser cache do navegador."
echo "   Tente: Ctrl+Shift+R (Windows/Linux) ou Cmd+Shift+R (Mac)"