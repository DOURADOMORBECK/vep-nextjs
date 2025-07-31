# VepLim - Sistema de Gestão de Operações

Sistema completo de gestão de operações para VepLim, desenvolvido com Next.js 15, TypeScript e integração com APIs Railway.

## 🚀 Funcionalidades Principais

### Jornadas Operacionais
- **Jornada do Pedido**: Fluxo completo desde a criação até a preparação (Separação → Etiquetagem → Verificação)
- **Jornada da Entrega**: Gestão logística com rastreamento em tempo real via GPS
- **Jornada do Produto**: Controle de produção (Recebimento → Limpeza → Preparação → Embalagem)

### Módulos de Cadastro (CRUD)
- **Produtos**: Gestão completa com categorias, estoque e fornecedores
- **Clientes**: Cadastro com geolocalização (lat/lng) e visualização em mapa
- **Pedidos**: Integração com jornadas e controle de status
- **Operadores**: Gestão de permissões e papéis
- **Usuários**: Controle de acesso por departamento
- **Fornecedores**: Cadastro com dias de entrega e categorias

### Recursos Técnicos
- 🔐 Autenticação JWT com controle de acesso baseado em papéis
- 🗺️ Mapas interativos com Leaflet.js
- 📊 Dashboard com métricas em tempo real
- 🔍 Interceptor de API para debug e análise
- 🧪 Sistema automatizado de testes de API
- 🌍 Interface totalmente em PT-BR
- 🌙 Tema dark responsivo

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Railway com as APIs deployadas

## 🛠️ Instalação

1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/vep-nextjs.git
cd vep-nextjs
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente
```bash
cp .env.local.example .env.local
```

4. Edite `.env.local` com as URLs das suas APIs Railway:
```env
BUN_USERS_SERVICE_URL=https://sua-api-users.railway.app
BUN_CUSTOMERS_SERVICE_URL=https://sua-api-customers.railway.app
BUN_DASHBOARD_SERVICE_URL=https://sua-api-dashboard.railway.app
# ... outras APIs
```

5. Execute o projeto
```bash
npm run dev
```

Acesse http://localhost:3000

## 🔑 Credenciais de Acesso

```
Email: admin@veplim.com
Senha: admin123
```

## 🗂️ Estrutura do Projeto

```
vep-nextjs/
├── src/
│   ├── app/              # Páginas do Next.js (App Router)
│   ├── components/       # Componentes React reutilizáveis
│   ├── lib/             # Utilitários e interceptors
│   └── config/          # Configurações de API
├── public/              # Assets estáticos
├── scripts/             # Scripts utilitários
└── api-test-results/    # Resultados dos testes de API
```

## 🧪 Testes de API

### Interface Web
Acesse `/api-test` para executar testes pela interface gráfica.

### Linha de Comando
```bash
npm run test-apis
```

Os resultados são salvos em `api-test-results/`.

## 📡 APIs Integradas

- **Users Service**: Autenticação e gestão de usuários/operadores
- **Customers Service**: Clientes e fornecedores
- **Dashboard Service**: Pedidos e métricas
- **Delivery Service**: Entregas e rastreamento
- **Jornada Produto Service**: Produtos e estoque
- **UserLog Service**: Auditoria e logs
- **Vehicles Service**: Veículos de entrega
- **Audit Service**: Auditoria do sistema

## 🎨 Tecnologias Utilizadas

- **Frontend**: Next.js 15, React 19, TypeScript
- **Estilização**: Tailwind CSS 4
- **Mapas**: Leaflet.js
- **Ícones**: Font Awesome 6
- **APIs**: REST com Railway/Bun
- **Autenticação**: JWT

## 📱 Funcionalidades por Página

### Dashboard
- Métricas de pedidos, clientes e produtos
- Gráficos de desempenho
- Alertas e notificações

### Jornada do Pedido
- Criação e gestão de pedidos
- Fluxo de separação com scanner
- Etiquetagem automática
- Verificação com checklist

### Jornada da Entrega
- Atribuição de motoristas
- Otimização de rotas
- Rastreamento em tempo real
- Confirmação de entrega com foto

### Jornada do Produto  
- Recebimento com conferência
- Processo de higienização
- Preparação e porcionamento
- Embalagem com rastreabilidade

## 🔒 Segurança

- Autenticação JWT em todas as rotas
- Controle de acesso baseado em papéis (RBAC)
- Interceptor de API para monitoramento
- Logs de auditoria em todas as ações

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é proprietário da VepLim.

## 📞 Suporte

Para suporte, entre em contato com a equipe de desenvolvimento.

---

Desenvolvido com ❤️ para VepLim