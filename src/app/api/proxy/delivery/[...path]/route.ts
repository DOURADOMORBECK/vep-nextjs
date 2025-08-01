import { createProxyHandler } from '@/lib/proxy-handler';

export const { GET, POST, PUT, DELETE, PATCH } = createProxyHandler({
  internalUrl: 'http://api-delivery.railway.internal:8080',
  externalUrl: 'https://api-delivery-production-0851.up.railway.app'
});