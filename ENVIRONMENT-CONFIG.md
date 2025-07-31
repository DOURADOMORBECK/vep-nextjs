# Environment Configuration for VepLim Next.js

## Current Setup ✅

The application is correctly configured to use Railway APIs with automatic environment detection.

### Development Mode (Local)
When running locally with `npm run dev`, the app automatically uses **public URLs**:
- api-users-production-54ed.up.railway.app
- api-jornada-produto-production.up.railway.app
- api-customers-production.up.railway.app
- api-dashboard-production-f3c4.up.railway.app
- api-delivery-production-0851.up.railway.app
- api-userlog-production.up.railway.app
- api-audit-production.up.railway.app
- api-vehicles-production.up.railway.app

### Production Mode (Railway)
When deployed on Railway, the app automatically uses **internal URLs**:
- http://api-users.railway.internal
- http://api-jornada-produto.railway.internal
- http://api-customers.railway.internal
- http://api-dashboard.railway.internal
- http://api-delivery.railway.internal
- http://api-userlog.railway.internal
- http://api-audit.railway.internal
- http://api-vehicles.railway.internal

## Configuration Files

### 1. `/src/config/api.ts`
This file handles the automatic switching between development and production URLs:
```typescript
const isProduction = process.env.NODE_ENV === 'production' && process.env.RAILWAY_ENVIRONMENT;
export const API_CONFIG = isProduction ? PROD_API_URLS : DEV_API_URLS;
```

### 2. `/.env.local`
Contains the environment variables for Railway internal URLs:
```
BUN_AUDIT_SERVICE_URL=http://api-audit.railway.internal
BUN_CUSTOMERS_SERVICE_URL=http://api-customers.railway.internal
BUN_DASHBOARD_SERVICE_URL=http://api-dashboard.railway.internal
BUN_DELIVERY_SERVICE_URL=http://api-delivery.railway.internal
BUN_JORNADA_PRODUTO_SERVICE_URL=http://api-jornada-produto.railway.internal
BUN_USERLOG_SERVICE_URL=http://api-userlog.railway.internal
BUN_USERS_SERVICE_URL=http://api-users.railway.internal
BUN_VEHICLES_SERVICE_URL=http://api-vehicles.railway.internal
```

## How It Works

1. **Local Development**: No configuration needed. The app uses hardcoded public URLs.
2. **Railway Deployment**: Railway automatically sets `RAILWAY_ENVIRONMENT` variable, triggering the use of internal URLs.
3. **Manual Override**: You can set environment variables to override default URLs if needed.

## Important Notes

- The `.env.local` file is already configured correctly
- No changes needed for development - just run `npm run dev`
- When deploying to Railway, these environment variables will be automatically used
- Internal URLs (*.railway.internal) are faster and more secure for production
- Public URLs (*.up.railway.app) are used for development and testing