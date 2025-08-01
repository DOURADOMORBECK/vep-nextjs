import { createProxyHandler } from '@/lib/proxy-handler';
import { API_CONFIG } from '@/config/api';

// Get URLs from centralized configuration
const getProductsApiUrls = () => {
  const isRailwayProduction = process.env.RAILWAY_ENV === 'production';
  const configUrl = API_CONFIG.PRODUCTS_API;
  
  return {
    internalUrl: isRailwayProduction ? configUrl : 'https://api-jornada-produto-production.up.railway.app',
    externalUrl: 'https://api-jornada-produto-production.up.railway.app'
  };
};

const { internalUrl, externalUrl } = getProductsApiUrls();

export const { GET, POST, PUT, DELETE, PATCH } = createProxyHandler({
  internalUrl,
  externalUrl
});