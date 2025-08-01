import { createProxyHandler } from '@/lib/proxy-handler';
import { API_CONFIG } from '@/config/api';

// Get URLs from centralized configuration
const getOrdersApiUrls = () => {
  const isRailwayProduction = process.env.RAILWAY_ENV === 'production';
  const configUrl = API_CONFIG.ORDERS_API;
  
  return {
    internalUrl: isRailwayProduction ? configUrl : 'https://api-dashboard-production-f0f1.up.railway.app',
    externalUrl: 'https://api-dashboard-production-f0f1.up.railway.app'
  };
};

const { internalUrl, externalUrl } = getOrdersApiUrls();

export const { GET, POST, PUT, DELETE, PATCH } = createProxyHandler({
  internalUrl,
  externalUrl
});