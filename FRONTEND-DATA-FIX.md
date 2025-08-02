# Frontend Data Integration Fix

## Current Status

### ✅ Working
- Products API returns 74 products from PostgreSQL
- Database connection is established in production
- Authentication and login system works

### ❌ Not Working
- Customers API returns empty array (0 customers)
- Dashboard shows no real data
- Local development cannot connect to database

## Root Cause Analysis

### 1. Customer Query Issue
The `PessoaService` is filtering customers incorrectly:
- It uses `fnc_pes_tipo_pessoa = '1'` for customers
- But we don't know if this field exists or has these values
- The status filter might also be incorrect

### 2. Database Schema Unknown
Without access to the actual database schema, we're guessing:
- Field names
- Field values
- Table relationships

## Solution Path

### Step 1: Deploy Debug Endpoints (In Progress)
We've created these endpoints to diagnose the issue:
- `/api/customers-debug` - Shows all pessoa queries and counts
- `/api/simple-test` - Tests both products and customers
- `/api/db-test` - Tests database connection and counts

### Step 2: Analyze Production Data
Once deployed, we need to:
1. Check what data exists in `pessoas_financesweb` table
2. Understand the actual field values for status and type
3. Update queries to match actual data

### Step 3: Fix Queries
Based on the debug information, update:
- `PessoaService.getAll()` to use correct filters
- `PessoaService.determineType()` to map types correctly
- Status field checks to match actual values

## Testing Commands

```bash
# Once deployed, run these:

# 1. Check customer debug info
curl -s https://app.veplim.com.br/api/customers-debug | jq

# 2. Check simple test
curl -s https://app.veplim.com.br/api/simple-test | jq

# 3. Check if customers are returned
curl -s https://app.veplim.com.br/api/clientes | jq
```

## Expected Fix

The issue is likely one of:
1. **No customer data** in the database
2. **Wrong field values** in our queries (tipo_pessoa != '1')
3. **Wrong status values** (not 'A' or 'ATIVO')
4. **Missing data** in required fields causing mapping to fail

Once we see the debug output, we can fix the exact issue.