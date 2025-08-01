import { createProxyHandler } from '@/lib/proxy-handler';
import { API_CONFIG } from '@/config/api';

// Get URLs from centralized configuration
const getDeliveryApiUrls = () => {
  const isRailwayProduction = process.env.RAILWAY_ENV === 'production';
  const configUrl = API_CONFIG.DELIVERY_API;
  
  return {
    internalUrl: isRailwayProduction ? configUrl : 'https://api-delivery-production-0851.up.railway.app',
    externalUrl: 'https://api-delivery-production-0851.up.railway.app'
  };
};

const { internalUrl, externalUrl } = getDeliveryApiUrls();

export const { GET, POST, PUT, DELETE, PATCH } = createProxyHandler({
  internalUrl,
  externalUrl
});