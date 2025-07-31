#!/usr/bin/env node

/**
 * Test direct API calls to Railway endpoints
 */

const https = require('https');

// Direct API test
async function testDirectLogin() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: 'admin@veplim.com',
      password: 'admin123',
      role: 'admin'
    });

    const options = {
      hostname: 'api-users-production-54ed.up.railway.app',
      port: 443,
      path: '/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('🔐 Testing direct login to Railway API...');
    console.log('URL: https://api-users-production-54ed.up.railway.app/login');
    console.log('Payload:', { email: 'admin@veplim.com', password: 'admin123' });

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('\nResponse Status:', res.statusCode, res.statusMessage);
        console.log('Response Headers:', res.headers);
        
        try {
          const parsed = JSON.parse(data);
          console.log('Response Body:', JSON.stringify(parsed, null, 2));
          
          if (res.statusCode === 200 && parsed.token) {
            console.log('\n✅ Login successful!');
            console.log('Token:', parsed.token.substring(0, 50) + '...');
            resolve(parsed);
          } else {
            console.log('\n❌ Login failed');
            resolve(parsed);
          }
        } catch (e) {
          console.log('Response Body (raw):', data);
          resolve(data);
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Request error:', e);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

// Run test
testDirectLogin()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });