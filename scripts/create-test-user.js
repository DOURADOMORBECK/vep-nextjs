// Script para criar usuário de teste via API Users
const createTestUser = async () => {
  const apiUrl = 'https://api-users-production-54ed.up.railway.app';
  
  // Primeiro, tentar registrar um novo usuário
  const testUser = {
    name: 'Admin VepLim',
    email: 'admin@veplim.com',
    password: 'admin123'
  };
  
  console.log('🔑 Criando usuário de teste...');
  console.log('Email:', testUser.email);
  console.log('Senha:', testUser.password);
  
  try {
    // Tentar criar o usuário
    const registerResponse = await fetch(`${apiUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });
    
    const registerData = await registerResponse.text();
    console.log('\n📝 Resposta do registro:', registerData);
    
    if (registerResponse.ok) {
      console.log('✅ Usuário criado com sucesso!');
    } else {
      console.log('⚠️  Usuário pode já existir ou houve erro no registro');
    }
    
    // Agora tentar fazer login
    console.log('\n🔐 Testando login...');
    const loginResponse = await fetch(`${apiUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      }),
    });
    
    const loginData = await loginResponse.text();
    console.log('📝 Resposta do login:', loginData);
    
    if (loginResponse.ok) {
      const loginJson = JSON.parse(loginData);
      console.log('\n✅ Login bem-sucedido!');
      console.log('Token:', loginJson.token?.substring(0, 20) + '...');
      console.log('User:', loginJson.user);
    } else {
      console.log('❌ Falha no login');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
};

// Executar
createTestUser();