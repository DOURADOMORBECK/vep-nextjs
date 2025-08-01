import { createProxyHandler } from '@/lib/proxy-handler';

export const { GET, POST, PUT, DELETE, PATCH } = createProxyHandler({
  internalUrl: 'http://api-users.railway.internal:8080',
  externalUrl: 'https://api-users-production-54ed.up.railway.app'
});