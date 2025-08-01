import { createProxyHandler } from '@/lib/proxy-handler';

// Configuração do proxy para API de Auditoria
const proxyConfig = {
  internalUrl: 'http://api-audit.railway.internal:8080',
  externalUrl: 'https://api-audit-production.up.railway.app'
};

// Exporta todos os métodos HTTP suportados
export const { GET, POST, PUT, DELETE, PATCH, OPTIONS } = createProxyHandler(proxyConfig);