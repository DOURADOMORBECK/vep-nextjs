// Debug script for login issues
const http = require('http');

async function debugLogin() {
  console.log('=== Login Debug Script ===\n');
  
  // Test different scenarios
  const tests = [
    {
      name: 'Direct API call',
      url: 'https://api-users-production-54ed.up.railway.app/login',
      email: 'paulomoraes@veplim.com.br',
      password: 'veplim123' // Try common passwords
    },
    {
      name: 'Local proxy call',
      url: 'http://localhost:3000/api/auth/login',
      email: 'paulomoraes@veplim.com.br',
      password: 'veplim123'
    }
  ];
  
  for (const test of tests) {
    console.log(`\n📍 Testing: ${test.name}`);
    console.log(`URL: ${test.url}`);
    
    try {
      const response = await fetch(test.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: test.email,
          password: test.password
        })
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));
      
      const text = await response.text();
      console.log('Response body:', text);
      
      try {
        const data = JSON.parse(text);
        console.log('Parsed data:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('Could not parse as JSON');
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      if (error.cause) {
        console.error('Cause:', error.cause);
      }
    }
  }
  
  // Test if local server is running
  console.log('\n📍 Checking if local Next.js server is running...');
  try {
    const localResponse = await fetch('http://localhost:3000');
    console.log('Local server is running ✅');
  } catch (error) {
    console.log('Local server is NOT running ❌');
    console.log('Please run: npm run dev');
  }
}

debugLogin();