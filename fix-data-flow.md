# Fix Data Flow from PostgreSQL to Frontend

## Current Issues

1. **Customer Data Not Showing**: The `/api/clientes` endpoint returns empty array
2. **Database Connection**: Works in production but not locally
3. **Type Filtering**: The pessoa type determination might be incorrect

## Investigation Results

### Production Status
- ✅ Products API works: Returns 75+ products
- ❌ Customers API returns empty array
- ✅ Database connection works (products are proof)

### Potential Issues

1. **Type Mismatch in PessoaService**:
   - The service filters by `fnc_pes_tipo_pessoa = '1'` for customers
   - But the actual data might use different values or fields

2. **Status Field**:
   - The service filters by `fnc_pes_status = 'A' OR fnc_pes_status = 'ATIVO'`
   - The actual status values might be different

## Solutions Implemented

1. **Updated PessoaService.getAll()**:
   ```typescript
   // Now returns all active pessoas without type filtering
   // Type filtering happens after mapping to avoid missing records
   ```

2. **Added Debug Endpoints**:
   - `/api/test-db-schema`: Comprehensive database schema test
   - `/api/db-test`: Simple connection and count test
   - `/api/debug-db`: Connection info and API test

## Next Steps

1. **Wait for deployment** to complete
2. **Test production endpoints** to see actual data
3. **Verify customer data** exists in database
4. **Update queries** based on actual data structure

## Commands to Test

```bash
# Check if customers exist in database
curl -s https://app.veplim.com.br/api/db-test | jq

# Check customer API
curl -s https://app.veplim.com.br/api/clientes | jq

# Check debug info
curl -s https://app.veplim.com.br/api/debug-db | jq
```