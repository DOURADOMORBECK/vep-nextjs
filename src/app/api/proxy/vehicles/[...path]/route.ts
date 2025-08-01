import { createProxyHandler } from '@/lib/proxy-handler';
import { API_CONFIG } from '@/config/api';

// Get URLs from centralized configuration
const getVehiclesApiUrls = () => {
  const isRailwayProduction = process.env.RAILWAY_ENV === 'production';
  const configUrl = API_CONFIG.VEHICLES_API;
  
  return {
    internalUrl: isRailwayProduction ? configUrl : 'https://api-vehicles-production-75f8.up.railway.app',
    externalUrl: 'https://api-vehicles-production-75f8.up.railway.app'
  };
};

const { internalUrl, externalUrl } = getVehiclesApiUrls();

export const { GET, POST, PUT, DELETE, PATCH } = createProxyHandler({
  internalUrl,
  externalUrl
});