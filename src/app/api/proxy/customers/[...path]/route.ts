import { createProxyHandler } from '@/lib/proxy-handler';
import { API_CONFIG } from '@/config/api';

// Get URLs from centralized configuration
const getCustomersApiUrls = () => {
  const isRailwayProduction = process.env.RAILWAY_ENV === 'production';
  const configUrl = API_CONFIG.CLIENTS_API;
  
  return {
    internalUrl: isRailwayProduction ? configUrl : 'https://api-customers-production-8cc3.up.railway.app',
    externalUrl: 'https://api-customers-production-8cc3.up.railway.app'
  };
};

const { internalUrl, externalUrl } = getCustomersApiUrls();

export const { GET, POST, PUT, DELETE, PATCH } = createProxyHandler({
  internalUrl,
  externalUrl
});