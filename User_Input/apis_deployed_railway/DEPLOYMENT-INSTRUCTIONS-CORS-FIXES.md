# CORS Security Fixes - Deployment Instructions

## Overview
This document contains instructions for deploying the CORS-fixed versions of the Users and Customers APIs to Railway.

## Security Issues Fixed
1. **CORS Wildcard Vulnerability**: Replaced `cors()` with proper origin validation
2. **Credential Handling**: Added `credentials: true` support for httpOnly cookies
3. **Origin Validation**: Implemented environment-specific allowed origins
4. **Header Security**: Added proper allowed headers and methods

## Files to Deploy

### 1. Users API (api-users service)
- **File**: `sugest_api-users-cors-fixed.txt`
- **Service**: `api-users-production-54ed.up.railway.app`
- **Main Changes**:
  - Enhanced CORS configuration with origin validation
  - Environment-specific allowed origins
  - Support for httpOnly cookies with `credentials: true`
  - Better logging for debugging

### 2. Customers API (api-customers service)
- **File**: `sugest_api-customers-cors-fixed.txt`
- **Service**: `api-customers-production.up.railway.app`
- **Main Changes**:
  - Same CORS security fixes as Users API
  - Added JWT authentication middleware
  - Enhanced error handling

## Deployment Steps

### Step 1: Environment Variables
Ensure these environment variables are set in Railway:

```bash
# Required for all services
DATABASE_URL=<your_postgres_connection_string>
JWT_SECRET=<secure_random_string>
NODE_ENV=production
RAILWAY_ENV=production

# Optional but recommended
PORT=8080
```

### Step 2: CORS Configuration
The new CORS configuration will automatically:
- Allow `https://vep-nextjs-production.up.railway.app` (main frontend)
- Allow `https://*.railway.app` (Railway preview deployments)
- Block all other origins in production
- Allow localhost in development

### Step 3: Deploy Users API
1. Access your Railway project
2. Go to the `api-users` service
3. Replace the existing code with content from `sugest_api-users-cors-fixed.txt`
4. Deploy the changes
5. Monitor logs for any errors

### Step 4: Deploy Customers API
1. Access your Railway project
2. Go to the `api-customers` service
3. Replace the existing code with content from `sugest_api-customers-cors-fixed.txt`
4. Deploy the changes
5. Monitor logs for any errors

### Step 5: Update Other APIs (Optional)
Apply similar CORS fixes to other APIs:
- `api-jornada-produto`
- `api-dashboard`
- `api-delivery`
- `api-userlog`
- `api-vehicles`
- `api-audit`

## Testing After Deployment

### 1. CORS Testing
Test that CORS works correctly:
```bash
# Should work - allowed origin
curl -H "Origin: https://vep-nextjs-production.up.railway.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://api-users-production-54ed.up.railway.app/login

# Should fail - blocked origin
curl -H "Origin: https://malicious-site.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://api-users-production-54ed.up.railway.app/login
```

### 2. Login Testing
Test the login flow from the frontend:
1. Go to `https://vep-nextjs-production.up.railway.app/login`
2. Try to log in with valid credentials
3. Check browser network tab for CORS errors
4. Verify cookies are set correctly

### 3. API Testing
Test authenticated endpoints:
```bash
# Test with valid origin
curl -H "Origin: https://vep-nextjs-production.up.railway.app" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <your_jwt_token>" \
     https://api-users-production-54ed.up.railway.app/me
```

## Monitoring and Logs

### What to Look For
After deployment, monitor logs for:
- CORS-related errors
- Origin validation messages
- Authentication issues
- Database connection problems

### Log Messages
The fixed APIs will log:
```
🚀 Users API starting on port 8080
📍 Environment: production
🔒 CORS Security: ENABLED with origin validation
🌐 Allowed origins: https://vep-nextjs-production.up.railway.app, https://*.railway.app
```

## Rollback Plan
If issues occur:
1. Keep backup of original API code
2. Revert to previous deployment in Railway
3. Check logs for specific error messages
4. Fix issues and redeploy

## Security Verification Checklist
- [ ] CORS wildcard (*) removed
- [ ] Only specific origins allowed
- [ ] Credentials support enabled
- [ ] Proper headers configured
- [ ] Environment variables set
- [ ] APIs deployed successfully
- [ ] Login flow tested
- [ ] CORS working correctly
- [ ] No console errors in browser
- [ ] Cookies being set properly

## Next Steps
After successful deployment:
1. Test all authentication flows
2. Verify that the frontend can communicate with APIs
3. Check that cookies are working for session management
4. Monitor for any CORS-related errors
5. Update other APIs with similar fixes if needed

## Contact
If you encounter issues during deployment, check:
1. Railway service logs
2. Browser developer console
3. Network tab for CORS errors
4. Database connectivity

The CORS fixes should resolve the security vulnerability while maintaining full functionality with the Next.js frontend.