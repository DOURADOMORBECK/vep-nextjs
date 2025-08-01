# Deployment Fix Instructions

## Current Issues

1. **Login not working**: The production database is missing the `login_attempts` and `locked_until` columns that the API code expects for rate limiting.

## Solution Steps

### 1. Fix the Database Schema

Connect to your Railway PostgreSQL database and run the migration script:

```sql
-- Add missing columns to the users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
```

### 2. Test User Credentials

After fixing the database, you can use these test credentials:
- Email: `test@example.com`
- Password: `test123`

Or create a new user via the API:

```bash
curl -X POST https://api-users-production-54ed.up.railway.app/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "admin123",
    "role": "admin"
  }'
```

### 3. Temporary Workaround (Optional)

While waiting for the database fix, you can temporarily use the simple login endpoint:

```javascript
// In src/app/login/page.tsx, change line 32:
// FROM:
const response = await fetch('/api/auth/login', {

// TO:
const response = await fetch('/api/auth/login-simple', {
```

This will allow login with test credentials without database dependency.

### 4. Nixpacks Configuration

Your current nixpacks.toml is correctly configured for Node.js 20:

```toml
[variables]
NODE_VERSION = "20"

[phases.setup]
nixPkgs = ["nodejs-20_x"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm start"
```

### 5. Environment Variables

Ensure these environment variables are set in Railway:

```bash
# Required for Next.js
NODE_ENV=production
RAILWAY_ENV=production

# API URLs (already configured in your code)
NEXT_PUBLIC_API_AUTH=https://api-users-production-54ed.up.railway.app
# Add other API URLs as needed
```

### 6. Install Missing Dependency

Although not required for login (backend handles bcrypt), you might want to add bcryptjs for future frontend use:

```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

## Quick Test

After deployment, test the login:

```bash
# Test the API directly
curl -X POST https://api-users-production-54ed.up.railway.app/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}'

# Or test through your Next.js app
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}'
```

## Notes

- The backend API uses bcryptjs to hash passwords
- Passwords are sent as plain text to the API and hashed server-side
- JWT tokens are stored in httpOnly cookies for security
- The frontend stores only non-sensitive user data in localStorage