import { createProxyHandler } from '@/lib/proxy-handler';

export const { GET, POST, PUT, DELETE, PATCH } = createProxyHandler({
  internalUrl: 'http://api-vehicles.railway.internal:3000',
  externalUrl: 'https://api-vehicles-production-75f8.up.railway.app'
});