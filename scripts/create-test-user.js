// Script to create a test user via the Users API
async function createTestUser() {
  const apiUrl = 'https://api-users-production-54ed.up.railway.app';
  
  const testUser = {
    name: 'Paulo Moraes',
    email: 'paulomoraes@veplim.com.br',
    password: 'veplim123' // You can change this password
  };
  
  console.log('Creating test user:', testUser.email);
  
  try {
    const response = await fetch(`${apiUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ User created successfully!');
      console.log('You can now login with:');
      console.log('Email:', testUser.email);
      console.log('Password:', testUser.password);
    }
  } catch (error) {
    console.error('Failed to create user:', error.message);
  }
}

createTestUser();