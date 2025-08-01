import { createProxyHandler } from '@/lib/proxy-handler';
import { API_CONFIG } from '@/config/api';

// Get URLs from centralized configuration
const getUsersApiUrls = () => {
  const isRailwayProduction = process.env.RAILWAY_ENV === 'production';
  const configUrl = API_CONFIG.AUTH_API;
  
  return {
    internalUrl: isRailwayProduction ? configUrl : 'https://api-users-production-54ed.up.railway.app',
    externalUrl: 'https://api-users-production-54ed.up.railway.app'
  };
};

const { internalUrl, externalUrl } = getUsersApiUrls();

export const { GET, POST, PUT, DELETE, PATCH } = createProxyHandler({
  internalUrl,
  externalUrl
});