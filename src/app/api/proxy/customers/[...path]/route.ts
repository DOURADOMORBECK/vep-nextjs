import { createProxyHandler } from '@/lib/proxy-handler';

export const { GET, POST, PUT, DELETE, PATCH } = createProxyHandler({
  internalUrl: 'http://api-customers.railway.internal:3000',
  externalUrl: 'https://api-customers-production-8cc3.up.railway.app'
});