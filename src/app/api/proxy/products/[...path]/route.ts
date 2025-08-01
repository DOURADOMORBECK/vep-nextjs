import { createProxyHandler } from '@/lib/proxy-handler';

export const { GET, POST, PUT, DELETE, PATCH } = createProxyHandler({
  internalUrl: 'http://api-jornada-produto.railway.internal:8080',
  externalUrl: 'https://api-jornada-produto-production.up.railway.app'
});