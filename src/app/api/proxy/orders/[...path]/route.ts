import { createProxyHandler } from '@/lib/proxy-handler';

export const { GET, POST, PUT, DELETE, PATCH } = createProxyHandler({
  internalUrl: 'http://api-dashboard.railway.internal:8080',
  externalUrl: 'https://api-dashboard-production-f0f1.up.railway.app'
});