// Test script to check Users API availability
async function testUsersAPI() {
  const apiUrl = 'https://api-users-production-54ed.up.railway.app';
  
  console.log('Testing Users API at:', apiUrl);
  
  // Test health check
  try {
    console.log('\n1. Testing health check endpoint...');
    const healthResponse = await fetch(apiUrl);
    console.log('Health check status:', healthResponse.status);
    const healthText = await healthResponse.text();
    console.log('Health check response:', healthText);
  } catch (error) {
    console.error('Health check failed:', error.message);
  }
  
  // Test login endpoint
  try {
    console.log('\n2. Testing login endpoint...');
    const loginResponse = await fetch(`${apiUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'paulomoraes@veplim.com.br',
        password: 'test123' // You'll need to use the correct password
      })
    });
    
    console.log('Login status:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('Login response:', JSON.stringify(loginData, null, 2));
  } catch (error) {
    console.error('Login test failed:', error.message);
  }
}

testUsersAPI();