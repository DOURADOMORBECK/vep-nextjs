#!/usr/bin/env node

const https = require('https');

// Test delivery API
async function testDeliveryAPI() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api-delivery-production-0851.up.railway.app',
      port: 443,
      path: '/delivery',
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    console.log('📦 Testing Delivery API...');
    console.log('URL: https://api-delivery-production-0851.up.railway.app/delivery');

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('\nResponse Status:', res.statusCode, res.statusMessage);
        
        if (res.statusCode === 500) {
          console.log('❌ Internal Server Error - Database connection issue likely');
          console.log('This is expected if the database is not accessible');
        } else if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            console.log('✅ Success! Data:', JSON.stringify(parsed, null, 2));
          } catch {
            console.log('✅ Success! Raw data:', data);
          }
        } else {
          console.log('Response:', data);
        }
        
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (e) => {
      console.error('❌ Request error:', e);
      reject(e);
    });

    req.end();
  });
}

// Run test
testDeliveryAPI()
  .then(() => {
    console.log('\n✅ Test completed');
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
  });