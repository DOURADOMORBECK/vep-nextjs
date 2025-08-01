import { createProxyHandler } from '@/lib/proxy-handler';

// Configuração do proxy para health check da API de Vehicles
const proxyConfig = {
  internalUrl: 'http://api-vehicles.railway.internal:8080',
  externalUrl: 'https://api-vehicles-production.up.railway.app'
};

// Exporta todos os métodos HTTP suportados
export const { GET, POST, PUT, DELETE, PATCH, OPTIONS } = createProxyHandler(proxyConfig);